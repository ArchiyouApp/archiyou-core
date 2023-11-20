/*
    ViewSVGEdit.ts

    Edit SVGs for use in Doc View Containers

*/

import { CLASS_TO_STYLE, SVGtoPDFtransform } from './internal' // constants.s

import * as txml from 'txml' // Browser independant XML elements and parsing, used in toSVG. See: https://github.com/TobiasNickel/tXml
import { tNode as TXmlNode } from 'txml/dist/txml' // bit hacky

import { PageData, ContainerData, DocPDFExporter } from './internal'
import { DocPathStyle, PDFLinePath } from './internal'

import { convertValueFromToUnit, mmToPoints } from './utils'

import parseSVG from "svg-path-parser"; // https://github.com/hughsk/svg-path-parser

export class DocViewSVGEdit
{
    //// SETTINGS ////
    DIMLINE_LINE_THICKNESS_MM = 0.05;

    //// END SETTINGS ////

    _svg:string
    _svgXML:TXmlNode
    _svgToPDFTransform:SVGtoPDFtransform // save important svg to pdf information for later use

    constructor(view:ContainerData)
    {
        this._svg = view?.content?.data

        if (!this._svg){ throw new Error(`DocViewSVGEdit: No valid SVG data found in view with name "${view.name}"!`) }
        else {
            this.parse();
        }
    }

    parse()
    {
        this.reset();
        this._svgXML = txml.parse(this._svg)[0] as TXmlNode; 
    }

    reset()
    {
        this._svgToPDFTransform = undefined;
    }

    /** Return changed SVG as string */
    export():string
    {
        return txml.stringify([this._svgXML]); // NOTE: this is not well documentated in tXML - it needs an Array to start
    }

    //// OPERATIONS ////

    setViewBox()
    {
        this._svgXML.attributes['viewBox'] = this._svgXML.attributes['bbox']; // viewbox is _bbox set in model units - NOTE: underscores are removed after parsing
    }

    setNoStrokeScaling()
    {
        // NOTE: this does not work with svg-to-pdfkit
        const APPLY_TO_TAGS = ['path'];
        const pathNodes = txml.filter(this._svgXML.children, node => APPLY_TO_TAGS.includes(node.tagName))
        pathNodes.forEach(path => path.attributes['vector-effect'] = 'non-scaling-stroke' )
    }

    /** Information that is needed to transform SVG shape content to PDF */
    toPDFDocTransform(pdfExporter:DocPDFExporter, view:ContainerData, page:PageData): SVGtoPDFtransform
    {
        // TODO: this is needed when zoomLevel is calculated later (now we simply fill the container no matter what the svg model units)
        const svgUnits = this._svgXML.attributes['worldUnits'] || 'mm'; // default is mm

        const svgLeft = parseFloat(this._svgXML.attributes['bbox'].split(' ')[0]);
        const svgTop = parseFloat(this._svgXML.attributes['bbox'].split(' ')[1]);
        const svgWidth = parseFloat(this._svgXML.attributes['bbox'].split(' ')[2]);
        const svgHeight = parseFloat(this._svgXML.attributes['bbox'].split(' ')[3]);

        const pdfViewWidthPnts = pdfExporter.relWidthToPoints(view.width, page);
        const pdfViewHeightPnts = pdfExporter.relHeightToPoints(view.height, page);
        const pdfViewOffsetXPnts = pdfExporter.coordRelWidthToPoints(view.position[0], page, true);
        const pdfViewOffsetYPnts = pdfExporter.coordRelHeightToPoints(view.position[1], page, true);

        const pdfViewRatio = pdfViewWidthPnts/pdfViewHeightPnts;
        const svgRatio = svgWidth/svgHeight;
        const boundBy = (pdfViewRatio < svgRatio) ? 'width' : 'height';

        // transformation variables
        const svgToPDFTranslateX = -svgLeft;
        const svgToPDFTranslateY = -svgTop;
        // scale factor from svg to pdf
        const svgToPDFScale = (boundBy === 'width') ?
            pdfViewWidthPnts / svgWidth :
            pdfViewHeightPnts / svgHeight;

        const containerPositionPnts = pdfExporter.containerToPositionInPnts(view, page); // includes offsets for pivot

        // Content align: see what dimension is bound by Container (width or height) and then align along the other dimension
        const contentOffsetX = (boundBy === 'width' || !view.contentAlign || view.contentAlign[0] === 'left') 
                                ? 0 
                                : (pdfViewWidthPnts - svgWidth * svgToPDFScale)/((view.contentAlign[0] === 'center') ? 2 : 1)

        const contentOffsetY = (boundBy === 'height' || !view.contentAlign || view.contentAlign[1] === 'top') 
                                ? 0 
                                : (pdfViewHeightPnts - svgWidth * svgToPDFScale)/((view.contentAlign[1] === 'center') ? 2 : 1)

        const svgToPdfTransform = {
            svgUnits: svgUnits,
            scale: svgToPDFScale,
            translateX: svgToPDFTranslateX,
            translateY: svgToPDFTranslateY,
            containerTranslateX: containerPositionPnts.x, 
            containerTranslateY: containerPositionPnts.y,
            contentOffsetX: contentOffsetX,
            contentOffsetY: contentOffsetY,
            boundBy: boundBy as 'width'|'height',
        }

        this._svgToPDFTransform = svgToPdfTransform; // save for later use

        return this._svgToPDFTransform;
    }

    /** Transform and scale SVG Shape data to PDF space coordinates (points) 
     * 
     *  NOTES:
     *      - incoming SVG units are worldUnits (in <svg _worldUnits="..">) [ NOTE: after parsing XML nodes _ is removed!]
     *      - bbox is in <svg _bbox="left top width height"
    */
    toPDFDocShapePaths(pdfExporter:DocPDFExporter, view:ContainerData, page:PageData):Array<PDFLinePath>
    {
        // gather paths in such a way that we can directly apply them with pdfkit in native PDF coordinate space
        const linePaths:Array<PDFLinePath> = new Array(); 
        const pathNodes = txml.filter(this._svgXML.children, (node) => node.tagName === 'path')

        if(!pathNodes || pathNodes.length === 0)
        {
            console.warn('DocViewSVGEdit:toPDFDocShapePaths: No paths found. Returned empty array.')
        }
        else
        {
            // Basic translation/scaling aspects
            const svgToPDFTransform = this.toPDFDocTransform(pdfExporter, view, page);

            pathNodes.forEach( node => 
            {
                // There are only single lines in the commands: 'M275,35 L325,35'
                const line = this._pathCmdToLineData(node.attributes.d);  // [x1,y1,x2,y2]
                if(line)
                {
                    let x1 = (line[0] + svgToPDFTransform.translateX)*svgToPDFTransform.scale + svgToPDFTransform.containerTranslateX + svgToPDFTransform.contentOffsetX; 
                    let y1 = (line[1] + svgToPDFTransform.translateY)*svgToPDFTransform.scale + svgToPDFTransform.containerTranslateY + svgToPDFTransform.contentOffsetY;
                    let x2 = (line[2] + svgToPDFTransform.translateX)*svgToPDFTransform.scale + svgToPDFTransform.containerTranslateX + svgToPDFTransform.contentOffsetX;
                    let y2 = (line[3] + svgToPDFTransform.translateY)*svgToPDFTransform.scale + svgToPDFTransform.containerTranslateY + svgToPDFTransform.contentOffsetY;

                    linePaths.push(
                        {
                            path: `M${x1},${y1} L${x2},${y2}`,
                            style: this._pathClassesToPDFPathStyle(node.attributes?.class)
                        });
                }
                
            })
            
        }
        
        return linePaths;
    }

    _pathCmdToLineData(d:string):Array<number|number|number|number>
    {
        const m = d.match(/M([^,]+),([^,]+) L([^,]+),([^$]+)/);
        if(Array.isArray(m))
        {
            m.shift();
            return m.map(c => parseFloat(c))
        }
        else {
            console.error(`DocViewSVGEdit::_pathCmdToLineData: Failed to parse path: "${d}"`);
        }
    }

    /** Translate the classes applied to svg path to a PDF style map 
     *  
     *   Settings are in constants.ts: CLASS_TO_STYLE
     * 
     *   Currently these styles exists:
     *   - line - the default line edge
     *   - dashed - dashed line edge
     *   - hidden - a line edge that is hidden behind other shapes used in elevations
     *   - outline - a line edge that is the outline of a projection
     *   - dimensionline - a dimension line (see: Annotator)
     * 
     *  Classes are applied in order (last has priority)
    */
    _pathClassesToPDFPathStyle(classesStr?:string):DocPathStyle
    {
        const FALLBACK_STYLE:DocPathStyle = { lineWidth: 0.15  };

        if(!classesStr || (typeof classesStr) !== 'string' || classesStr === '')
        {
            return FALLBACK_STYLE;
        }

        const classes = classesStr.split(' '); // for example: classesStr = 'line dashed'
        let docStyle:DocPathStyle = {};

        classes.forEach( className => 
        {
            const classStyle = CLASS_TO_STYLE[className];
            if(!classStyle)
            {
                console.warn(`DocViewSVGEdit::_pathClassesToPDFPathStyle: Encountered unknown style: ${className}`)
            }
            else {
                // apply style of this class
                docStyle = { ...docStyle, ...classStyle };
            }
        })

        return docStyle;
    }

    // Parsing dimension lines and draw directly on active pdfExporter.activePDFDoc
    drawDimLinesToPDF(pdfExporter:DocPDFExporter)
    {      
        const DIMLINE_CLASS = 'dimensionline';
        
        if(!this._svgXML){ throw new Error(`DocViewSVGEdit:drawDimLinesToPDF: Please parse SVG data first!`); }
        if(!pdfExporter){ throw new Error(`DocViewSVGEdit:drawDimLinesToPDF: Please supply a PDFExporter instance!`); }
        
        const dimLineNodes = txml.filter(this._svgXML.children, node => node.attributes?.class?.includes(DIMLINE_CLASS));
        
        dimLineNodes.forEach(dimLineNode => 
        {
            this._drawDimLineLine(dimLineNode, pdfExporter);
            this._drawDimLineArrows(dimLineNode, pdfExporter);
        })
        
        
    }

    /** Draw the line element of a dimLineNode to PDFdocument */
    _drawDimLineLine(dimLineNode:TXmlNode, pdfExporter:DocPDFExporter)
    {
        const lineNode = txml.filter(dimLineNode.children, node => node.tagName === 'line')[0];
        const lineX1 = this._svgCoordToPDFcoord(this._svgToPDFTransform, lineNode.attributes.x1, 'x');
        const lineX2 = this._svgCoordToPDFcoord(this._svgToPDFTransform, lineNode.attributes.x2, 'x');
        const lineY1 = this._svgCoordToPDFcoord(this._svgToPDFTransform, lineNode.attributes.y1, 'y');
        const lineY2 = this._svgCoordToPDFcoord(this._svgToPDFTransform, lineNode.attributes.y2, 'y');
        
        pdfExporter?.activePDFDoc?.moveTo(lineX1, lineY1).lineTo(lineX2, lineY2)
            .stroke()
            .lineWidth(mmToPoints(this.DIMLINE_LINE_THICKNESS_MM))
            .fillColor('black')
    }

    /** Draw the line nodes of a dimeLineNode to PDFDocument */
    _drawDimLineArrows(dimLineNode:TXmlNode, pdfExporter:DocPDFExporter)
    {
        const arrowNodes = txml.filter(dimLineNode.children, node => node.tagName === 'g' && node.attributes?.class?.includes('arrow'));
        arrowNodes.forEach(a => 
        {
            const tm = a.attributes?.transform.match(/translate\(([\-\d]+) ([\-\d]+)\)/);
            const translateCoords = (tm) ? 
                        [parseFloat(tm[1])*this._svgToPDFTransform.scale,parseFloat(tm[2])*this._svgToPDFTransform.scale
                        ] : 
                    [0,0]

            const rm = a.attributes?.transform.match(/rotate\(([\-\d]+)\)/);
            const rotateAngle = (rm) ? parseFloat(rm[1]) : 0;

            this._drawSVGPathToPDF(a.children[0].attributes?.d, pdfExporter, 
                {
                    translate: translateCoords,
                    rotate: rotateAngle,
                }); // path
        })
    }

    /** Draw a raw SVG path d datastring to PDF after transforming 
     *  styles record needs to correspond with those of pdfkit: https://pdfkit.org/docs/vector.html
    */
    _drawSVGPathToPDF(d:string, pdfExporter:DocPDFExporter, localTransforms?:Record<string, any>, styles?:Record<string, any>)
    {
        const PATH_CMD_TO_PDFKIT = {
            'M' : 'moveTo',
            'L' : 'lineTo',
        }

        const pathCommands = parseSVG(d);
        let doc = pdfExporter?.activePDFDoc;

        // transforms
        if(localTransforms)
        {
            if(localTransforms.translate){ 
                doc = doc.translate(localTransforms.translate[0], localTransforms.translate[1])
            }
            /*
            /* TODO: need origin
            if(localTransforms.rotate){ 
                doc = doc.rotate(localTransforms.rotate);
            }
            */
        }

        pathCommands.forEach(cmd => {
            if(doc[PATH_CMD_TO_PDFKIT[cmd.code]]) // basic protection
            {
                doc = doc[PATH_CMD_TO_PDFKIT[cmd.code]](
                    // basically moveTo or lineTo with coordinate pair
                    this._svgCoordToPDFcoord(this._svgToPDFTransform, cmd.x, 'x'),
                    this._svgCoordToPDFcoord(this._svgToPDFTransform, cmd.y, 'y')
                )
            }
            else {
                console.error(`DocViewSVGEdit::_drawSVGPathToPDF: Unknown/unmapped SVG path command: "${cmd.code}"`)
            }
        })    

        // wrap up
        doc.stroke()
            .fillColor('black')
            .lineWidth(mmToPoints(this.DIMLINE_LINE_THICKNESS_MM))

        // reset transforms
        if(localTransforms)
        {
            if(localTransforms.translate){ 
                doc = doc.translate(-localTransforms.translate[0], -localTransforms.translate[1])
            }
            /* TODO: need origin
            if(localTransforms.rotate)
            { 
                doc = doc.rotate(-localTransforms.rotate);
            }
            */
        }
    }

    //// UTILS ////

    _svgCoordToPDFcoord(transform: SVGtoPDFtransform, c:number|string, axis:'x'|'y'= 'x')
    {
        if(!transform){ throw new Error(`DocViewSVGEdit:_svgCoordToPDFcoord(): Please supply a SVGtoPDFtransform object`)}

        const coord = (typeof c === 'string') ? parseFloat(c) : c;
        
        return (axis === 'x') 
            ? (coord + transform.translateX)*transform.scale + transform.containerTranslateX + transform.contentOffsetX
            : (coord + transform.translateY)*transform.scale + transform.containerTranslateY + transform.contentOffsetY
        
    }


}
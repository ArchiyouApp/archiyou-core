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

export class DocViewSVGManager
{
    //// SETTINGS ////
    DIMLINE_LINE_THICKNESS_MM = 0.05;
    DIMLINE_ARROW_SVG_WIDTH = 10; // incoming arrow width in svg units (see also svg::_worldUnits )
    DIMLINE_ARROW_PDF_WIDTH_MM = 5;
    DIMLINE_TEXT_WIDTH_MM = 10;
    DIMLINE_TEXT_BACKGROUND_COLOR = 'white';
    DIMLINE_TEXT_SIZE_MM = 3; 

    //// END SETTINGS ////

    _svg:string
    _svgXML:TXmlNode
    _svgToPDFTransform:SVGtoPDFtransform // save important svg to pdf information for later use

    constructor(view:ContainerData)
    {
        this._svg = view?.content?.data

        if (!this._svg){ throw new Error(`DocViewSVGManager: No valid SVG data found in view with name "${view.name}"!`) }
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
            console.warn('DocViewSVGManager:toPDFDocShapePaths: No paths found. Returned empty array.')
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
            console.error(`DocViewSVGManager::_pathCmdToLineData: Failed to parse path: "${d}"`);
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
                console.warn(`DocViewSVGManager::_pathClassesToPDFPathStyle: Encountered unknown style: ${className}`)
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
        
        if(!this._svgXML){ throw new Error(`DocViewSVGManager:drawDimLinesToPDF: Please parse SVG data first!`); }
        if(!pdfExporter){ throw new Error(`DocViewSVGManager:drawDimLinesToPDF: Please supply a PDFExporter instance!`); }
        
        const dimLineNodes = txml.filter(this._svgXML.children, node => node.attributes?.class?.includes(DIMLINE_CLASS));
        
        dimLineNodes.forEach(dimLineNode => 
        {
            this._drawDimLineLine(dimLineNode, pdfExporter);
            this._drawDimLineArrows(dimLineNode, pdfExporter);
            this._drawDimLineText(dimLineNode, pdfExporter);
        })
        
        
    }

    /** Draw the line element of a dimLineNode to PDFdocument 
     *  Returns the coordinates of the line in PDF coordinates
    */
    _drawDimLineLine(dimLineNode:TXmlNode, pdfExporter:DocPDFExporter):Array<number>
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

        return [lineX1, lineY1, lineX2, lineY2]
    }

    /** Draw the line nodes of a dimeLineNode to PDFDocument */
    _drawDimLineArrows(dimLineNode:TXmlNode, pdfExporter:DocPDFExporter)
    {
        const arrowNodes = txml.filter(dimLineNode.children, node => node.tagName === 'g' && node.attributes?.class?.includes('arrow'));

        arrowNodes.forEach(a => 
        {
            // Transform contains the coord of the arrow pointer - we also use PDF document transforms to place arrow
            const tm = a.attributes?.transform.match(/translate\(([\-\d]+) ([\-\d]+)\)/);
            const translateCoords = (tm) ? 
                        [
                            this._svgCoordToPDFcoord(this._svgToPDFTransform, parseFloat(tm[1]), 'x'),
                            this._svgCoordToPDFcoord(this._svgToPDFTransform, parseFloat(tm[2]), 'y')
                        ] : 
                    [0,0]
            
            // Rotation of arrow
            const rm = a.attributes?.transform.match(/rotate\(([\-\d]+)\)/);
            const rotateAngle = (rm) ? parseFloat(rm[1]) : 0;
            
            // Scaling of arrow to achieve arrow width set by DIMLINE_ARROW_PDF_WIDTH_MM
            const arrowScale = this.DIMLINE_ARROW_PDF_WIDTH_MM / convertValueFromToUnit(
                this.DIMLINE_ARROW_SVG_WIDTH,  
                this._svgXML.attributes['worldUnits'] || 'mm', 
                'mm');

            this._drawSVGPathToPDF(a.children[0].attributes?.d, pdfExporter, 
                {
                    translate: translateCoords,
                    rotate: rotateAngle,
                    scale: arrowScale,
                }); // path
        })
    }

    /** Draw text label of Dimension line */
    _drawDimLineText(dimLineNode:TXmlNode, pdfExporter:DocPDFExporter)
    {
        const textNode = txml.filter(dimLineNode.children, node => node.tagName === 'text')[0];
        const x = this._svgCoordToPDFcoord(this._svgToPDFTransform, parseFloat(textNode.attributes.x), 'x');
        const y = this._svgCoordToPDFcoord(this._svgToPDFTransform, parseFloat(textNode.attributes.y), 'y');
        const textValue = textNode.children[0];
    
        // Background rectangle
        if (this.DIMLINE_TEXT_BACKGROUND_COLOR)
        {
            const bgWidth = mmToPoints(this.DIMLINE_TEXT_WIDTH_MM);
            const bgHeight = mmToPoints(this.DIMLINE_TEXT_SIZE_MM)*1.3;
            pdfExporter?.activePDFDoc?.rect(
                    x - bgWidth/2,
                    y - bgHeight/2, 
                    bgWidth, 
                    bgHeight // slightly higher then text
                ).fill(this.DIMLINE_TEXT_BACKGROUND_COLOR); 
        }
        
        // Text
        pdfExporter?.activePDFDoc?.fontSize(mmToPoints(this.DIMLINE_TEXT_SIZE_MM))
        pdfExporter?.activePDFDoc?.fill('black').stroke();
        pdfExporter?.activePDFDoc?.text(
            textValue,
            x - mmToPoints(this.DIMLINE_TEXT_WIDTH_MM)/2,
            y - mmToPoints(this.DIMLINE_TEXT_SIZE_MM)/2,
            {
                width: mmToPoints(this.DIMLINE_TEXT_WIDTH_MM),
                align: 'center',
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

        // transforms. NOTE: order is important!
        if(localTransforms)
        {   
            /** Translate contains the coordinate (offset from origin) of the end/start of dimension line */
            if(localTransforms?.translate)
            { 
                doc = doc.translate(localTransforms.translate[0], localTransforms.translate[1])
            }
            /* An SVG path arrow is originally located at [0,0], then transformed into position */
            if(localTransforms?.rotate)
            { 
                doc = doc.rotate(localTransforms.rotate, 
                        { origin: [0,0] }); // coordinate system origin is already translated
            }
            if(localTransforms?.scale !== undefined)
            { 
                doc = doc.scale(localTransforms.scale, { origin: [0,0] }) // coordinate system origin is already translated
            }
            
        }

        pathCommands.forEach(cmd => 
        {
            if(doc[PATH_CMD_TO_PDFKIT[cmd.code]]) // basic protection
            {
                doc = doc[PATH_CMD_TO_PDFKIT[cmd.code]](
                    // basically moveTo or lineTo with coordinate pair
                    cmd.x,
                    cmd.y
                )
            }
            else {
                console.error(`DocViewSVGManager::_drawSVGPathToPDF: Unknown/unmapped SVG path command: "${cmd.code}"`)
            }
        })    

        // wrap up
        doc.stroke()
            .fillColor('black')
            .lineWidth(mmToPoints(this.DIMLINE_LINE_THICKNESS_MM))

        // reset transforms (reverse order than applied earlier!)
        if(localTransforms)
        {
            if(localTransforms?.scale !== undefined)
            { 
                doc = doc.scale(1.0/localTransforms.scale, { origin: [0,0] })
            }
            if(localTransforms.rotate)
            { 
                doc = doc.rotate(-localTransforms.rotate,  { origin: [0,0 ] });
            }
            if(localTransforms.translate)
            { 
                doc = doc.translate(-localTransforms.translate[0], -localTransforms.translate[1])
            }
        }
    }

    //// UTILS ////

    _svgCoordToPDFcoord(transform: SVGtoPDFtransform, c:number|string, axis:'x'|'y'= 'x')
    {
        if(!transform){ throw new Error(`DocViewSVGManager:_svgCoordToPDFcoord(): Please supply a SVGtoPDFtransform object`)}

        const coord = (typeof c === 'string') ? parseFloat(c) : c;
        
        return (axis === 'x') 
            ? (coord + transform.translateX)*transform.scale + transform.containerTranslateX + transform.contentOffsetX
            : (coord + transform.translateY)*transform.scale + transform.containerTranslateY + transform.contentOffsetY
        
    }


}
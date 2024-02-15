/*
    DocViewSVGManager.ts

    Edit SVGs for use in Doc View Containers

    NOTES:
    - Dimension Line Arrows are generated in th Annotator
    - SVG Arrows are originally defined as pointing upwards (in SVG space) with arrow at [0,0]
        default arrow: M-5 5 L 0 0 L 5 5

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
    DIMLINE_ARROW_SVG_WIDTH = 10; // incoming arrow width in svg units (see also svg::_worldUnits ) - width is always relative to arrow pointing up
    DIMLINE_ARROW_PDF_WIDTH_MM = 5; 
    DIMLINE_IS_SMALL_FACTOR_TIMES_TEXT_WIDTH = 3; // what is considered a small dimension line (in WIDTH) - different rendering than activated
    DIMLINE_TEXT_WIDTH_MM = 8; // max text width
    DIMLINE_TEXT_BACKGROUND_COLOR = 'white';
    DIMLINE_TEXT_SIZE_MM = 3; // height of character
    DIMLINE_TEXT_SMALL_OFFSET_TIMES_TEXT_SIZE = 2;

    //// END SETTINGS ////

    _svg:string
    _svgXML:TXmlNode
    _svgToPDFTransform:SVGtoPDFtransform // save important svg to pdf information for later use

    constructor(view?:ContainerData)
    {
        if(view)
        {
            const r = this.parse(view);
            if(!r)
            {
                console.error(`DocViewSVGManager: No valid SVG data found in view with name "${view.name}"!`)
            }
        }
    }

    parse(view?:ContainerData):boolean
    {
        this.reset();
        this._svg = (!this._svg) ? view?.content?.data : this._svg;
        if(!this._svg)
        {
            return false;
        }
        this._svgXML = txml.parse(this._svg)[0] as TXmlNode; 
        return true;
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
                // There are only single lines in the commands: 'M4231,-1011 L4231,-1188'
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
    
    /** Given a SVG path (in format M4193,-1011 L4231,-1011) for a line extract start and end coordinates  */
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

    /** 
     *  if a SVG Dimension is considered small
     *  Utility used by Dimension Line drawing functions 
    */
    _svgDimLineIsSmall(dimLineNode:TXmlNode):boolean
    {
        const dimLineCoords = this._svgDimLineParseLine(dimLineNode)
        // line length in PDF coords (pts!)
        const lineLengthPdf = Math.sqrt(Math.pow(dimLineCoords[2] - dimLineCoords[0],2) + Math.pow(dimLineCoords[3] - dimLineCoords[1],2)); 
        
        return lineLengthPdf < convertValueFromToUnit(this.DIMLINE_TEXT_SIZE_MM*this.DIMLINE_IS_SMALL_FACTOR_TIMES_TEXT_WIDTH, 'mm', 'pnt')
    }

    /** Parse SVG dimension node and return line coordines in PDF system  */
    _svgDimLineParseLine(dimLineNode:TXmlNode):[number,number,number,number]|null
    {
        const lineNode = txml.filter(dimLineNode.children, node => node.tagName === 'line')[0];

        if(!lineNode) return null;

        const lineX1 = this._svgCoordToPDFcoord(this._svgToPDFTransform, lineNode.attributes.x1, 'x');
        const lineX2 = this._svgCoordToPDFcoord(this._svgToPDFTransform, lineNode.attributes.x2, 'x');
        const lineY1 = this._svgCoordToPDFcoord(this._svgToPDFTransform, lineNode.attributes.y1, 'y');
        const lineY2 = this._svgCoordToPDFcoord(this._svgToPDFTransform, lineNode.attributes.y2, 'y');

        return [lineX1, lineY1, lineX2, lineY2];
    }

    /** Get normalized offset vector from dimension line 
     *  TODO: This does not take into account the original offset direction!
     *  NOTE: We can't use archiyou-core because we are probably in the main app!
    */
    _svgDimLineOffsetVec(dimLineNode:TXmlNode, length:number=1):[number,number]|null
    {
        const dimLineCoords = this._svgDimLineParseLine(dimLineNode);

        if(!dimLineCoords) return null;

        const vec = [dimLineCoords[2]-dimLineCoords[0], dimLineCoords[3]-dimLineCoords[1]] as [number,number];
        
        return this._rotateVec(vec, 90, length)
    }

    /** Rotate a Vector a given angle around the origin and give it a certain length */
    _rotateVec(v:[number,number], angle:number, length:number=1):[number,number]
    {
        const r = Math.sqrt(Math.pow(v[0],2) + Math.pow(v[1],2)); 
        const angleRad = angle * Math.PI / 180;
        return [
            r * Math.cos(angleRad) / r * length, // normalize and then scale 
            r * Math.sin(angleRad) / r * length 
        ] as [number,number]
    }

    /** Draw the line element of a dimLineNode to PDFdocument 
     *  Returns the coordinates of the line in PDF coordinates
    */
    _drawDimLineLine(dimLineNode:TXmlNode, pdfExporter:DocPDFExporter):Array<number>
    {
        const dimLineCoords = this._svgDimLineParseLine(dimLineNode);

        pdfExporter?.activePDFDoc?.moveTo(dimLineCoords[0], dimLineCoords[1])
            .lineTo(dimLineCoords[2], dimLineCoords[3])
            .stroke()
            .lineWidth(mmToPoints(this.DIMLINE_LINE_THICKNESS_MM))
            .fillColor('black')

        return dimLineCoords;
    }

    /** Draw the line nodes of a dimeLineNode to PDFDocument 
     * 
     *  When dimension line is small, the arrows are flipped ( <--> to >--< )
    */
    _drawDimLineArrows(dimLineNode:TXmlNode, pdfExporter:DocPDFExporter)
    {
        const arrowNodes = txml.filter(dimLineNode.children, node => node.tagName === 'g' && node.attributes?.class?.includes('arrow'));

        arrowNodes.forEach(a => 
        {
            // Transform contains the coord of the arrow pointer - we also use PDF document transforms to place arrow
            const tm = a.attributes?.transform.match(/translate\(([\-\d\.]+) ([\-\d\.]+)\)/);

            const translateCoords = (tm) ? 
                        [
                            this._svgCoordToPDFcoord(this._svgToPDFTransform, parseFloat(tm[1]), 'x'),
                            this._svgCoordToPDFcoord(this._svgToPDFTransform, parseFloat(tm[2]), 'y')
                        ] : 
                    [0,0]
            
            // Rotation of arrow
            const rm = a.attributes?.transform.match(/rotate\(([\-\d]+)\)/);
            let rotateAngle = (rm) ? parseFloat(rm[1]) : 0;
            
            if(this._svgDimLineIsSmall(dimLineNode))
            {
                // flip 180 degrees when line is too small
                rotateAngle += 180;
            }
            
            // Scaling of arrow to achieve arrow width set by DIMLINE_ARROW_PDF_WIDTH_MM
            const arrowScale = this.DIMLINE_ARROW_PDF_WIDTH_MM / convertValueFromToUnit(
                    this.DIMLINE_ARROW_SVG_WIDTH, this._svgXML.attributes['worldUnits'] || 'mm', 'mm');


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
        let x = this._svgCoordToPDFcoord(this._svgToPDFTransform, parseFloat(textNode.attributes.x), 'x');
        let y = this._svgCoordToPDFcoord(this._svgToPDFTransform, parseFloat(textNode.attributes.y), 'y');
        const textValue = textNode.children[0];

        // If dimension line is very small we place text away from it
        if (this._svgDimLineIsSmall(dimLineNode))
        {
            const offsetAmount = convertValueFromToUnit(this.DIMLINE_TEXT_SMALL_OFFSET_TIMES_TEXT_SIZE * this.DIMLINE_TEXT_SIZE_MM, 'mm', 'pnt');
            const offsetVec = this._svgDimLineOffsetVec(dimLineNode, offsetAmount)

            if(!offsetVec)
            { 
                console.warn(`DocViewSVGManager::_drawDimLineText(): Can't get offset vector. Skipped offsetting small dimension line`); 
            }
            else 
            {
                const offsettedX = x + offsetVec[0];
                const offsettedY = y + offsetVec[1]; 

                // Draw offset line
                pdfExporter?.activePDFDoc?.moveTo(x, y)
                    .lineTo(offsettedX, offsettedY)
                    .stroke()
                    .lineWidth(mmToPoints(this.DIMLINE_LINE_THICKNESS_MM))
                    .fillColor('black')
                
                // update text position
                x = offsettedX;
                y = offsettedY;
            }
        }
    
        // Background rectangle
        if (this.DIMLINE_TEXT_BACKGROUND_COLOR)
        {
            //const bgMaxWidth = mmToPoints(this.DIMLINE_TEXT_WIDTH_MM);
            const bgWidth = mmToPoints(textValue.length * this.DIMLINE_TEXT_SIZE_MM) * 0.6; // Factor to make smaller, because width of letter is not 
            const bgHeight = mmToPoints(this.DIMLINE_TEXT_SIZE_MM)*1.3; // Some factor to extend background a bit
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
                return null;
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
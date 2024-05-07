/*
    DocViewSVGManager.ts

    Edit SVGs for use in Doc View Containers

    NOTES:
    - Dimension Line Arrows are generated in th Annotator
    - SVG Arrows are originally defined as pointing upwards (in SVG space) with arrow at [0,0]
        default arrow: M-5 5 L 0 0 L 5 5

*/

import { CLASS_TO_STYLE, Container, SVGtoPDFtransform } from './internal' // constants.s

import * as txml from 'txml' // Browser independant XML elements and parsing, used in toSVG. See: https://github.com/TobiasNickel/tXml
import { tNode as TXmlNode } from 'txml/dist/txml' // bit hacky

import { PageData, ContainerData, DocPDFExporter } from './internal'
import { DocPathStyle, PDFLinePath } from './internal'

import { convertValueFromToUnit, mmToPoints } from './utils'

import parseSVG from "svg-path-parser"; // https://github.com/hughsk/svg-path-parser

export class DocViewSVGManager
{
    //// SETTINGS ////
    PATH_BASE_STYLE = {
            lineWidth: 0.15
        } as DocPathStyle

    DIMLINE_LINE_THICKNESS_MM = 0.05;
    DIMLINE_ARROW_SVG_WIDTH = 10; // incoming arrow width in svg units (see also svg::_worldUnits ) - width is always relative to arrow pointing up
    DIMLINE_ARROW_PDF_WIDTH_MM = 5; 
    DIMLINE_IS_SMALL_FACTOR_TIMES_TEXT_WIDTH = 3; // what is considered a small dimension line (in WIDTH) - different rendering than activated
    DIMLINE_TEXT_WIDTH_MM = 8; // max text width
    DIMLINE_TEXT_BACKGROUND_COLOR = '#FFFFFF';
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

    parse(view?:ContainerData):TXmlNode|null
    {
        this.reset();
        this._setCleanSvg(view)

        if(!this._svg)
        {
            return null;
        }
        this._svgXML = txml.parse(this._svg)[0] as TXmlNode; 
        return this._svgXML;
    }

    _setCleanSvg(view?:ContainerData)
    {
        const svg = (!this._svg) ? view?.content?.data : this._svg;
        this._svg = svg.replace(/\<\?xml [^>]+>/, ''); // clean potential <?xml tag
        return this._svg
    }

    /** Used for JsPDF */
    // NEEDED?
    /*
    parseToElement(view?:ContainerData):Element
    {
        this._setCleanSvg(view)
        return new JSDOM(this._svg)
    }
    */

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
        // gather paths in such a way that we can directly apply them with jsPDF in native PDF coordinate space
        const linePaths:Array<PDFLinePath> = new Array(); 
        const pathNodes = txml.filter(this._svgXML.children, (node) => 
                                    // NOTE: we can have other paths (for example for arrows)
                                    node.tagName === 'path' && node.attributes?.class.split(' ').includes('line')
                                    ) 

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
                // There are only single lines in the commands: 'M4231 -1011 L 4231 -1188'
                const line = this._pathCmdToLineData(node.attributes.d);  // [x1,y1,x2,y2]
                if(line)
                {
                    let x1 = (line[0] + svgToPDFTransform.translateX)*svgToPDFTransform.scale + svgToPDFTransform.containerTranslateX + svgToPDFTransform.contentOffsetX; 
                    let y1 = (line[1] + svgToPDFTransform.translateY)*svgToPDFTransform.scale + svgToPDFTransform.containerTranslateY + svgToPDFTransform.contentOffsetY;
                    let x2 = (line[2] + svgToPDFTransform.translateX)*svgToPDFTransform.scale + svgToPDFTransform.containerTranslateX + svgToPDFTransform.contentOffsetX;
                    let y2 = (line[3] + svgToPDFTransform.translateY)*svgToPDFTransform.scale + svgToPDFTransform.containerTranslateY + svgToPDFTransform.contentOffsetY;

                    linePaths.push(
                        {
                            path: `M ${x1} ${y1} L${x2} ${y2}`,
                            style: this.gatherPDFPathStyle(node), // this._pathClassesToPDFPathStyle(node.attributes?.class)
                        });
                }  
            })
        }
        
        return linePaths;
    }

    /** Within SVG path (<path d="..">) we have multiple ways to set style
     *      1. on object itself as attribute: stroke="#0000FF" (see Edge._getSvgPathAttributes )
     *      2. by classes
     *  
     *  Classes have priority over object styling because it allowes the user to quickly override 
     *  styling without going into the script
     */
    gatherPDFPathStyle(svgPathNode:TXmlNode):DocPathStyle
    {
        return {
            ...this.PATH_BASE_STYLE, // start with minimum styling
            ...this._pathAttributesToPDFPathStyle(svgPathNode),
            ...this._pathClassesToPDFPathStyle(svgPathNode),
        }
    }

    _pathAttributesToPDFPathStyle(svgPathNode:TXmlNode):DocPathStyle
    {
        const PATH_STYLE_ATTR_TO_PDF = {
            stroke : 'strokeColor',
            'stroke-dasharray' : 'lineDashPattern',
            'stroke-width' : 'strokeWidth',
            'stroke-opacity' : 'strokeOpacity'
        }

        const style = {} as DocPathStyle;

        Object.keys(PATH_STYLE_ATTR_TO_PDF).forEach( pathAttr => {
            if(svgPathNode?.attributes[pathAttr])
            {
                const pdfStylePropName = PATH_STYLE_ATTR_TO_PDF[pathAttr];
                style[pdfStylePropName] = svgPathNode?.attributes[pathAttr];
            }
        })

        return style;
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
    _pathClassesToPDFPathStyle(svgPathNode:TXmlNode):DocPathStyle
    {
        const classesStr = svgPathNode?.attributes['class'];

        if(!classesStr || (typeof classesStr) !== 'string' || classesStr === '')
        {
            return {};
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

    /** jsPDF needs Line paths as [{op: m|l, c: [x,y] }] */
    _pdfLinePathToJsPDFPathLines(pdfPath: PDFLinePath):Array<Record<string, any>>
    {   
        // parseSVG see: https://github.com/hughsk/svg-path-parser
        const pathCmds = parseSVG(pdfPath.path); // returns [{ code, command, x1,y1,x2,y2...xN,yN }
        // NOTE: Here we expect only move and line commands
        return pathCmds.map(pc => { 

            const orderedCoords = { x: [], y: [] };
            Object.keys(pc)
                .filter(key => key.includes('x') || key.includes('y'))
                .sort((a,b) => {
                    // NOTE: if only 2 coords, we have x,y - just add 0 to it to pass regex below
                    a += (!b.match(/\d+/)) ? 0 : '';
                    b += (!b.match(/\d+/)) ? 0 : '';
                    return parseInt(b.match(/\d+/)[0]) - parseInt(a.match(/\d+/)[0])
                })
                .forEach(key => {
                    orderedCoords[key].push(pc[key]);
                })

            const pathLineCoords = orderedCoords.x.map((x,i) => [x,orderedCoords.y[i]])[0]

            return {  
                op: pc.code.toLowerCase(), // jsPDF.path() interpretes all al absolute coords
                c: pathLineCoords
            }
        })
    }

    
    /** Given a SVG path for a Line (in format M 10 10 L 10 10), extract start and end coordinates  */
    _pathCmdToLineData(d:string):Array<number|number|number|number>
    {
        const m = d.match(/M *([^ ]+) ([^ ]+) L *([^ ]+) ([\d\-]+)/); // some robustness for no spacing: M5 5 L10

        if(Array.isArray(m))
        {
            m.shift();
            return m.map(c => parseFloat(c))
        }
        else {
            console.error(`DocViewSVGManager::_pathCmdToLineData: Failed to parse path as a Line: "${d}"`);
        }
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

        pdfExporter?.activePDFDoc?.stroke()
            .setLineWidth(mmToPoints(this.DIMLINE_LINE_THICKNESS_MM))
            .setDrawColor('#000000')
            .moveTo(dimLineCoords[0], dimLineCoords[1])
            .lineTo(dimLineCoords[2], dimLineCoords[3])

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
                pdfExporter?.activePDFDoc?.stroke()
                    .setFillColor('black')
                    .setLineWidth(mmToPoints(this.DIMLINE_LINE_THICKNESS_MM))
                    .moveTo(x, y)
                    .lineTo(offsettedX, offsettedY)
                    
                
                // update text position
                x = offsettedX;
                y = offsettedY;
            }
        }
    
        // Background rectangle
        if (this.DIMLINE_TEXT_BACKGROUND_COLOR)
        {
            //const bgMaxWidth = mmToPoints(this.DIMLINE_TEXT_WIDTH_MM);
            const bgWidth = mmToPoints(this.DIMLINE_TEXT_WIDTH_MM); // Factor to make smaller, because width of letter is not 
            const bgHeight = mmToPoints(this.DIMLINE_TEXT_SIZE_MM)*1.3; // Some factor to extend background a bit
            pdfExporter?.activePDFDoc
                    .fill()
                    .setFillColor(this.DIMLINE_TEXT_BACKGROUND_COLOR) // DEBUGGING 
                    .rect(  // see: https://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html#rect
                        x - bgWidth/2,
                        y - bgHeight/2, 
                        bgWidth, 
                        bgHeight,
                        'F' // set fill instead of stroke (default)
                    )
        }
        
        // Text
        pdfExporter?.activePDFDoc?.setFontSize(mmToPoints(this.DIMLINE_TEXT_SIZE_MM))
        pdfExporter?.activePDFDoc?.fill().stroke().setFillColor('#000000');
        pdfExporter?.activePDFDoc?.text(
            textValue,
            x, // baseline and align take care of centering
            y,
            {
                maxWidth: mmToPoints(this.DIMLINE_TEXT_WIDTH_MM),
                align: 'center', // horizontal align
                baseline: 'middle'
            })   
    }

    /** Draw a raw SVG path d datastring to PDF after transforming 
     *  TODO: styles for jsPDF
    */
    _drawSVGPathToPDF(d:string, pdfExporter:DocPDFExporter, localTransforms?:Record<string, any>, styles?:Record<string, any>)
    {
        const PATH_CMD_TO_JSPDF = {
            'M' : 'moveTo',
            'L' : 'lineTo',
        }

        const pathCommands = parseSVG(d);
        let doc = pdfExporter?.activePDFDoc;

        if(!doc){
            throw new Error(`DocViewSVGManager::_drawSVGPathToPDF: Please supply activePDFDoc (jsPDF) instance`)
        }

        // Using jsPDF.context2d for transformations. See: https://raw.githack.com/MrRio/jsPDF/master/docs/module-context2d.html
        if(localTransforms) // Start transforming
        {   
            /** Translate contains the coordinate (offset from origin) of the end/start of dimension line */
            if(localTransforms?.translate)
            { 
                doc.context2d.translate(localTransforms.translate[0], localTransforms.translate[1])
            }
            /* An SVG path arrow is originally located at [0,0], then transformed into position */
            if(localTransforms?.rotate)
            { 
                doc.context2d.rotate(localTransforms.rotate*Math.PI/180); // coordinate system origin is already translated. JsPDF needs radians
            }
            if(localTransforms?.scale !== undefined)
            { 
                doc.context2d.scale(localTransforms.scale,localTransforms.scale) // coordinate system origin is already translated
            }
            
        }
        
        const drawContext = doc.context2d;
        drawContext.beginPath();
        drawContext.lineWidth = mmToPoints(this.DIMLINE_LINE_THICKNESS_MM);
        // TODO: other styling here. Where is Stroke color?
    
        // Draw path by issuing SVG commands
        pathCommands.forEach(cmd => 
        {
            if(drawContext[PATH_CMD_TO_JSPDF[cmd.code]]) // basic protection
            {
                drawContext[PATH_CMD_TO_JSPDF[cmd.code]]( cmd.x, cmd.y);
            }
            else {
                console.error(`DocViewSVGManager::_drawSVGPathToPDF: Unknown/unmapped SVG path command: "${cmd.code}"`)
                return null;
            }
        })    

        drawContext.stroke(); // finalize path. See: https://raw.githack.com/MrRio/jsPDF/master/docs/module-context2d.html#~stroke
        drawContext.setTransform(1, 0, 0, 1, 0 ,0); // reset transformations
    }
    
    //// IMPROVE SVG INPUT ROUTINES ////



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
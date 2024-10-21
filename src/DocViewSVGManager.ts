/*
    DocViewSVGManager.ts

    Edit SVGs for use in Doc View Containers

    NOTES:
    - Dimension Line Arrows are generated in th Annotator
    - SVG Arrows are originally defined as pointing upwards (in SVG space) with arrow at [0,0]
        default arrow: M-5 5 L 0 0 L 5 5

*/

import { CLASS_TO_STYLE, DOC_DIMENSION_LINES_TEXT_HEIGHT, SVGtoPDFtransform } from './internal' // constants.ts

import * as txml from 'txml' // Browser independant XML elements and parsing, used in toSVG. See: https://github.com/TobiasNickel/tXml
import { tNode as TXmlNode } from 'txml/dist/txml' // bit hacky

import { PageData, ContainerData, DocPDFExporter } from './internal'
import { DocPathStyle, PDFLinePath } from './internal'

import { convertValueFromToUnit, mmToPoints, toRad } from './utils'

import parseSVG from "svg-path-parser"; // https://github.com/hughsk/svg-path-parser

export class DocViewSVGManager
{
    //// SETTINGS ////
    PATH_BASE_STYLE = {
            strokeColor: '#000000', 
            lineWidth: 1
        } as DocPathStyle

    DIMLINE_LINE_THICKNESS_MM = 0.05;
    DIMLINE_ARROW_SVG_WIDTH = 10; // incoming arrow width in svg units (see also svg::_worldUnits ) - width is always relative to arrow pointing up
    DIMLINE_ARROW_PDF_WIDTH_MM = 5; 
    DIMLINE_IS_SMALL_FACTOR_TIMES_TEXT_WIDTH = 3; // what is considered a small dimension line (in WIDTH) - different rendering than activated
    DIMLINE_TEXT_SIZE_MM = DOC_DIMENSION_LINES_TEXT_HEIGHT; // height of character
    DIMLINE_TEXT_MAX_WIDTH_MM = DOC_DIMENSION_LINES_TEXT_HEIGHT*3; // max text width
    DIMLINE_TEXT_BACKGROUND_COLOR = '#FFFFFF';
    DIMLINE_TEXT_SMALL_OFFSET_TIMES_TEXT_SIZE = 2;

    //// END SETTINGS ////

    _svg:string
    _svgXML:TXmlNode
    _svgToPDFTransform:SVGtoPDFtransform // save important svg to pdf information for later use
    _docActivePage:PageData;
    

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
        this._docActivePage = page; // set this so we can use it later

        // TODO: this is needed when zoomLevel is calculated later (now we simply fill the container no matter what the svg model units)
        const svgUnits = this._svgXML.attributes['worldUnits'] || 'mm'; // default is mm

        // NOTE: viewBox is SVG coordinate system, bbox model coordinate system
        const svgLeft = parseFloat(this._svgXML.attributes['viewBox'].split(' ')[0]);
        const svgTop = parseFloat(this._svgXML.attributes['viewBox'].split(' ')[1]);
        const svgWidth = parseFloat(this._svgXML.attributes['viewBox'].split(' ')[2]);
        const svgHeight = parseFloat(this._svgXML.attributes['viewBox'].split(' ')[3]);

        const pdfViewWidthPnts = pdfExporter.relWidthToPoints(view.width, page);
        const pdfViewHeightPnts = pdfExporter.relHeightToPoints(view.height, page);
        //const pdfViewOffsetXPnts = pdfExporter.coordRelWidthToPoints(view.position[0], page, true);
        //const pdfViewOffsetYPnts = pdfExporter.coordRelHeightToPoints(view.position[1], page, true);

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

        const containerPositionPnts = pdfExporter.containerToPDFPositionInPnts(view, page); // includes offsets for pivot

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
     *      This includes styling based on classes
     * 
     *  NOTES:
     *      - incoming SVG units are worldUnits (in <svg _worldUnits="..">) [ NOTE: after parsing XML nodes _ is removed!]
     *      - bbox is in <svg _bbox="left top width height"
    */
    toPDFDocShapePaths(pdfExporter:DocPDFExporter, view:ContainerData, page:PageData):Array<PDFLinePath>
    {
        // gather paths in such a way that we can directly apply them with jsPDF in native PDF coordinate space
        const pathNodes = txml.filter(this._svgXML.children, (node) => 
                                    // NOTE: we can have other paths (for example for arrows)
                                    node.tagName === 'path' && node.attributes?.class.split(' ').includes('line')
                                    ) 

        const linePaths:Array<PDFLinePath> = new Array(); 

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
                // There can be d attributes with single commands M L commands or multiple
                // like single: 'M -25 20 L -25 -20' or 'M -25 20 L -24.33 22.5 L -22.5 24.33 L -20 25'
                linePaths.push(
                    {
                        path: this._svgPathDToPDFPath(node.attributes.d, svgToPDFTransform),
                        style: this.gatherPDFPathStyleFromSVG(node), // this._svgPathClassesToPDFPathStyle(node.attributes?.class)
                    });
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
    gatherPDFPathStyleFromSVG(svgPathNode:TXmlNode):DocPathStyle
    {
        return {
            ...this.PATH_BASE_STYLE, // start with minimum styling
            ...this._svgPathClassesToPDFPathStyle(svgPathNode), // Override style PDF paths based on class on svg path
            ...this._svgPathAttributesToPDFPathStyle(svgPathNode), // SVG path attributes are set on individual shapes. These have priority of class styling
        }
    }

    _svgPathAttributesToPDFPathStyle(svgPathNode:TXmlNode):DocPathStyle
    {
        const svgUnits = this._svgXML.attributes['worldUnits'] || 'mm'; // default is mm

        const PATH_STYLE_ATTR_TO_PDF = {
            stroke : { to: 'strokeColor' },
            'stroke-dasharray' : { to: 'lineDashPattern'} ,
            'stroke-width' : { to: 'lineWidth', 
                                // IMPORTANT: SVG units are world/model units, for PDF we need to convert to PDF document units (default is 'mm' for both)
                                transform: (val) => convertValueFromToUnit(val, svgUnits ?? 'mm', this._docActivePage.docUnits ?? 'mm')  }, 
            'stroke-opacity' : { to: 'lineOpacity' }
        }

        const style = {} as DocPathStyle;

        Object.keys(PATH_STYLE_ATTR_TO_PDF)
        .forEach( pathAttr => {
            if(svgPathNode?.attributes[pathAttr])
            {
                const pdfStylePropName = PATH_STYLE_ATTR_TO_PDF[pathAttr].to;
                const pdfStyleValueTransformFn =  PATH_STYLE_ATTR_TO_PDF[pathAttr]?.transform;
                style[pdfStylePropName] = (!pdfStyleValueTransformFn) 
                                                ? svgPathNode?.attributes[pathAttr]
                                                : pdfStyleValueTransformFn(svgPathNode?.attributes[pathAttr]);
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
    _svgPathClassesToPDFPathStyle(svgPathNode:TXmlNode):DocPathStyle
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
                console.warn(`DocViewSVGManager::_svgPathClassesToPDFPathStyle: Encountered unknown style: ${className}`)
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

    /** Get d attribute of a SVG path and convert to PDF line path, this includes transformation of the coordinates and styling */
    _svgPathDToPDFPath(d:string, transform: SVGtoPDFtransform):string
    {        
        // handle commands like 'M -25 20 L -25 -20' (single) or 'M -25 20 L -24.33 22.5 L -22.5 24.33 L -20 25' (multiple)
        const ONLY_CODES = ['M', 'L'];
        
        const pathCmds = parseSVG(d);
        let newPathStr = '';
        pathCmds.forEach(cmd => {
            if (ONLY_CODES.includes(cmd.code))
            {
                const x = (cmd.x + transform.translateX)*transform.scale + transform.containerTranslateX + transform.contentOffsetX; 
                const y = (cmd.y + transform.translateY)*transform.scale + transform.containerTranslateY + transform.contentOffsetY;
                newPathStr += `${cmd.code} ${x} ${y}`
            }
        })

        return newPathStr;
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

        pdfExporter?.activePDFDoc
            .setDrawColor('#000000')
            .setLineWidth(mmToPoints(this.DIMLINE_LINE_THICKNESS_MM))
            .moveTo(dimLineCoords[0], dimLineCoords[1])
            .lineTo(dimLineCoords[2], dimLineCoords[3])
            .stroke();

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
                    scale: arrowScale, // IMPROTANT: stroke width is also scaled here
                }); // path
        })
    }

    /** Draw text label of Dimension line */
    _drawDimLineText(dimLineNode:TXmlNode, pdfExporter:DocPDFExporter)
    {
        const textNode = txml.filter(dimLineNode.children, node => node.tagName === 'text')[0];
        const textNodeData = (textNode.attributes?.data) ? JSON.parse(textNode.attributes.data.replaceAll("'",'"')) : {};

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
                pdfExporter?.activePDFDoc
                    .setLineWidth(mmToPoints(this.DIMLINE_LINE_THICKNESS_MM))
                    .moveTo(x, y)
                    .lineTo(offsettedX, offsettedY)
                    .stroke() // IMPORTANT: stroke executes the graphic commands
                    
                
                // update text position
                x = offsettedX;
                y = offsettedY;
            }
        }
        
        // Place rotated text and its background rect
        const textAngleDeg = textNodeData?.angle || 0;
        const textAngleRad = toRad(textAngleDeg);

        pdfExporter?.activePDFDoc?.setFontSize(mmToPoints(this.DIMLINE_TEXT_SIZE_MM)); // Set font size first then get text dimensions
        let { w:textWidth, h:textHeight } = pdfExporter?.activePDFDoc?.getTextDimensions(textValue);
        textWidth *= 1.1; // small margin

        const drawContext = pdfExporter.activePDFDoc.context2d;
        drawContext.translate(x,y); // move context origin to center of container
        drawContext.rotate(textAngleRad);

        // Background rectangle
        if (this.DIMLINE_TEXT_BACKGROUND_COLOR)
        {   
            // NOTE: We need to draw stuff on drawContext instead on Document because we need the transformation!
            drawContext.fillStyle = this.DIMLINE_TEXT_BACKGROUND_COLOR;
            drawContext.fillRect( // NOTE: rect is not working
                    0 - textWidth/2, // with translate the origin is already at x
                    0 - textHeight/2, 
                    textWidth,  // small margin
                    textHeight
                )
        }
        
        // Text
        drawContext.fillStyle = '#000000';
        drawContext.fillText(
            textValue,
            0 - textWidth/2,  // default text pivot is [left,bottom] in jsPDF coord system with origin at lefttop
            0 + textHeight/2 - textHeight*0.1, // small correction
            mmToPoints(this.DIMLINE_TEXT_MAX_WIDTH_MM) // max width
        )

        // after drawing, return to original context
        drawContext.setTransform(1,0,1,0,0,0);
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

        const drawContext = doc.context2d;
        drawContext.setTransform(1,0,0,1,0,0); // To be sure: reset transformations first

        // Using jsPDF.context2d for transformations. See: https://raw.githack.com/MrRio/jsPDF/master/docs/module-context2d.html
        if(localTransforms) // Start transforming
        {   
            /** Translate contains the coordinate (offset from origin) of the end/start of dimension line */
            if(localTransforms?.translate)
            { 
                drawContext.translate(localTransforms.translate[0], localTransforms.translate[1])
            }
            /* An SVG path arrow is originally located at [0,0], then transformed into position */
            if(localTransforms?.rotate)
            { 
                drawContext.rotate(localTransforms.rotate*Math.PI/180); // coordinate system origin is already translated. JsPDF needs radians
            }
            if(localTransforms?.scale !== undefined)
            { 
                drawContext.scale(localTransforms.scale,localTransforms.scale) // coordinate system origin is already translated
            }
            
        }
        
        pdfExporter.activePDFDoc.setDrawColor('#000000')
        drawContext.beginPath();
        // IMPORTANT: when scale, stroke width is scaled too, correct this!
        const scale = localTransforms.scale ?? 1.0;
        drawContext.lineWidth = mmToPoints(this.DIMLINE_LINE_THICKNESS_MM) * 1/scale;
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
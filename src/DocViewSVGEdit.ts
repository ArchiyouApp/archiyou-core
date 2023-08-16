/*
    ViewSVGEdit.ts

    Edit SVGs for use in Doc View Containers

*/

import { convertValueFromToUnit } from './utils'
import { CLASS_TO_STYLE } from './internal' // constants.s

import * as txml from 'txml' // Browser independant XML elements and parsing, used in toSVG. See: https://github.com/TobiasNickel/tXml
import { tNode as TXmlNode } from 'txml/dist/txml' // bit hacky

import { PageData, ContainerData, DocPDFExporter } from './internal'
import { DocPathStyle, PDFLinePath } from './internal'

export class DocViewSVGEdit
{
    _svg:string
    _svgXML:TXmlNode

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
        this._svgXML = txml.parse(this._svg)[0] as TXmlNode; 
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

    /** Transform and scale SVG data to PDF space coordinates (points) 
     * 
     *  NOTES:
     *      - incoming SVG units are worldUnits (in <svg _worldUnits="..">) [ NOTE: after parsing XML nodes _ is removed!]
     *      - bbox is in <svg _bbox="left top width height"
    */
    toPDFDocPaths(pdfExporter:DocPDFExporter, view:ContainerData, page:PageData):Array<PDFLinePath>
    {
        // first basic translation/scaling aspects

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
        const containedBy = (pdfViewRatio < svgRatio) ? 'width' : 'height';

        // transformation variables
        const svgToPDFTranslateX = -svgLeft;
        const svgToPDFTranslateY = -svgTop;
        const svgToPDFScale = (containedBy === 'width') ?
                                    pdfViewWidthPnts / svgWidth :
                                    pdfViewHeightPnts / svgHeight;
        
        // gather paths in such a way that we can directly apply them with pdfkit in native PDF coordinate space
        const linePaths:Array<PDFLinePath> = new Array(); 
        const pathNodes = txml.filter(this._svgXML.children, (node) => node.tagName === 'path')

        if(!pathNodes || pathNodes.length === 0)
        {
            console.warn('DocViewSVGEdit:toPDFDocPaths: No paths found. Returned empty array.')
        }
        else
        {
            pathNodes.forEach( node => 
            {
                // There are only single lines in the commands: 'M275,35 L325,35'
                const line = this._pathCmdToLineData(node.attributes.d);  // [x1,y1,x2,y2]
                if(line)
                {
                    // translate and scale coords to PDF coord space and size of view container
                    // TODO: implement zoomLevels later
                    const containerPositionPnts = pdfExporter.containerToPositionPoints(view, page); // includes offsets for pivot

                    let x1 = (line[0] + svgToPDFTranslateX)*svgToPDFScale + containerPositionPnts.x;  // TODO: implement contentAlign (now:lefttop)
                    let y1 = (line[1] + svgToPDFTranslateY)*svgToPDFScale + containerPositionPnts.y;
                    let x2 = (line[2] + svgToPDFTranslateX)*svgToPDFScale + containerPositionPnts.x;
                    let y2 = (line[3] + svgToPDFTranslateY)*svgToPDFScale + containerPositionPnts.y;

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


}
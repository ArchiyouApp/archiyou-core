/*
    ViewSVGEdit.ts

    Edit SVGs for use in Doc View Containers

*/

import { convertValueFromToUnit } from './utils'

import * as txml from 'txml' // Browser independant XML elements and parsing, used in toSVG. See: https://github.com/TobiasNickel/tXml
import { tNode as TXmlNode } from 'txml/dist/txml' // bit hacky


import { ContainerData, DocPDFExporter } from './internal'

interface PDFPathStyle {
    // see: https://pdfkit.org/docs/vector.html
    lineWidth:number
    lineCap:'butt'|'round'|'square'
    lineJoin:'miter'|'bevel'|'round'
    dash:Array<number|number> // size, space
    strokeColor:string // 'red', '#FF0000'
    strokeOpacity:number // [0.0-1.0]
    fillColor:string
    fillOpacity:number
}

interface PDFPath {
    path: string // the d of SVG paths in PDF coords
    style: PDFPathStyle
}

export class DocViewSVGEdit
{
    _svg:string
    _svgXML:TXmlNode

    constructor(view:ContainerData)
    {
        this._svg = view?.content?.data

        console.log('LOAD SVG');
        console.log(this._svg);

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
    toPDFDocPaths(pdfExporter:DocPDFExporter, view:ContainerData, page:PageData)
    {
        // first basic translation/scaling aspects

        const svgUnits = this._svgXML.attributes['worldUnits'] || 'mm'; // default is mm

        const svgLeft = parseFloat(this._svgXML.attributes['bbox'].split(' ')[0]);
        const svgTop = parseFloat(this._svgXML.attributes['bbox'].split(' ')[1]);
        const svgWidth = parseFloat(this._svgXML.attributes['bbox'].split(' ')[2]);
        const svgHeight = parseFloat(this._svgXML.attributes['bbox'].split(' ')[3]);

        const pdfViewWidthPnts = pdfExporter.relWidthToPoints(view.width, page);
        const pdfViewHeightPnts = pdfExporter.relHeightToPoints(view.height, page);

        const pdfViewRatio = pdfViewWidthPnts/pdfViewHeightPnts;
        const svgRatio = svgWidth/svgHeight;
        const containedBy = (pdfViewRatio < svgRatio) ? 'width' : 'height';

        // transformation variables
        const svgToPDFTranslateX = -svgLeft;
        const svgToPDFTranslateY = -svgTop;
        const svgToPDFScale = (containedBy === 'width') ?
                                    pdfViewWidthPnts / svgWidth :
                                    pdfViewHeightPnts / svgHeight;
        
        const paths:Array<PDFPath> = new Array(); 
        const pathNodes = txml.filter(this._svgXML.children, (node) => node.tagName === 'path')
        if (pathNodes)
        {
            pathNodes.forEach( node => 
            {
                const line = this._pathCmdToLineData(node.attributes.d);  // There are only single lines in the commands: 'M275,35 L325,35'
                if(line)
                {
                    console.log(line);
                    // TODO: transform
                }
                
            })
            
        }
        
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


}
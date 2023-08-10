/*
    ViewSVGEdit.ts

    Edit SVGs for use in Doc View Containers

*/

import * as txml from 'txml' // Browser independant XML elements and parsing, used in toSVG. See: https://github.com/TobiasNickel/tXml
import { tNode as TXmlNode } from 'txml/dist/txml' // bit hacky

import { ContainerData } from './internal'

export class DocViewSVGEdit
{
    _svg:string
    _svgXML:TXmlNode

    constructor(view:ContainerData)
    {
        this._svg = view?.content?.main

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
        const APPLY_TO_TAGS = ['path'];

        const pathNodes = txml.filter(this._svgXML.children, node => APPLY_TO_TAGS.includes(node.tagName))
        pathNodes.forEach(path => path.attributes['vector-effect'] = 'non-scaling-stroke' )
    }


    /* NOTES
        - TODO: auto zoom level
    */
}
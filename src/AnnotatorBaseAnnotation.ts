import { uuidv4 } from './internal' // utils

import { AnyShape, Bbox } from './internal'
import { AnnotationType } from './internal' // types

export class BaseAnnotation
{
    uuid:string;
    value:string|number;
    _type:AnnotationType;

    constructor(type?:AnnotationType)
    {
        this.uuid = uuidv4();
        this._type = type;
    }

    static isAnnotation(obj:any):boolean
    {
        return (typeof obj === 'object') && obj.hasOwnProperty('uuid') && obj.hasOwnProperty('_type');
    }

    /** Type of Annotation, reimplemented in extended classes */
    type():AnnotationType
    {
        return this._type;
    }

    update()
    {
        // override
    }

    sameId():string|null
    {
        // override
        return null;
    }

    //// OPERATIONS ////

    inBbox(bbox:Bbox):boolean
    {
        return bbox.contains(this.toShape())
    }

    //// EXPORTS ////

    toSVG():string|null
    {
        return null; // override by child class
    }


    toShape():AnyShape|null
    {
        return null; // override by child class
    }

    toData():any
    {
        // overwritten
    }


}
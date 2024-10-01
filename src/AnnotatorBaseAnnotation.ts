import { v4 as uuidv4 } from 'uuid' // fix TS warning with @types/uuid

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

    toSvg():string|null
    {
        return null; // override by child class
    }

    update()
    {
        // override
    }

    toShape():AnyShape|null
    {
        return null; // override by child class
    }

    inBbox(bbox:Bbox):boolean
    {
        return bbox.contains(this.toShape())
    }
}
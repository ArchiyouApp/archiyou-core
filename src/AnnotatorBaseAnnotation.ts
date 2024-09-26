import { v4 as uuidv4 } from 'uuid' // fix TS warning with @types/uuid

import { AnnotationType } from './internal' // types

export class BaseAnnotation
{
    uuid:string;

    constructor()
    {
        this.uuid = uuidv4();
    }

    /** Type of Annotation, reimplemented in extended classes */
    type():AnnotationType
    {
        return 'base'
    }
}
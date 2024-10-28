/**
 * 
 *  models.ts
 *     General models 
 *      (TODO: refactoring in progress)
 */

import { Statement } from './internal'

/** Define a Param: both as a structure and an instance */
export interface Param
{ 
    id?: string,
    type : string, // number,
    name : string,
    default : any, // Default value: can be string or number
    value? : any, // Can be string or number
    start? : number, // for ParamInputNumber
    end? : number, // for ParamInputNumber
    step? : number // for ParamInputNumber
}

/** Saved Scripts by Version */
export interface ScriptVersion 
{
    id? : string,
    file_id? : string,
    user_id? : string,
    user_name? : string,
    file_name? : string,
    prev_version_id? : string,
    created_at? : string,
    updated_at? : string,
    params? : Array<Param>,
    code : string,
    shared?: boolean,
    shared_version_tag?:string,
    shared_auto_sync? : boolean,
    shared_category?: string,
    shared_description?: string
}

export interface ImportStatement
{
    code: string,
    userName: string
    name: string,
    versionTag: string,
    paramValues?: {[key:string]:string|number},
    statement: Statement, // reference to original statement
}



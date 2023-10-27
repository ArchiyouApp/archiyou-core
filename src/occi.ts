/**  OCCI standard models (simplified)
 *  
 *  Used by the cloud compute worker
 *  Not used internally (yet)
 *  
 * 
 * */ 

import { ArchiyouOutputFormatType, ArchiyouOutputSettings } from './internal' // types

export type ModelRequestOutputType = 'full'|'model'

export interface OcciModelRequest
{
    hash?:string // instance hash (name with parameters and values)
    params?: {[key:string]:any}
    format?: ArchiyouOutputFormatType
    output?: ModelRequestOutputType
    quality?: 'low'|'medium'|'high'
    settings?: ArchiyouOutputSettings // specific compute settings
}

export interface OcciModelResult
{
    id?:string
    success:boolean
    task_id?:string
    request_id?:string
    models?:{[key:string]:any} // stl, gltf, step
    scenegraph?:any, // TODO - NOT IN OCCI SPEC
    errors?:Array<any>
    messages?:Array<any>
    tables?:any // TODO
    duration?:number
}

export interface OcciCadScript
{
    id?:string
    name:string // always lowercase
    author?:string // None
    org?:string
    url?:string
    description?:string
    created_at?:Date
    updated_at?:Date
    version?:string
    prev_version?:string
    safe?:boolean
    published?:boolean
    units?:string
    params?:{[key:string]:any}
    parameter_presets?:{[key:string]:{[key:string]:any}}
    code: string
    cad_engine?:string
    cad_engine_version?:string
    cad_engine_config?:Record<string,any> // special settings for script cad engine
    meta?:{[key:string]:any}
}

export interface OcciCadScriptRequest extends OcciCadScript
{
    status?:'success'|'error' // TODO: nice TS typing
    request?:OcciModelRequest // specifies the request
}

export interface OcciCadScriptResult extends OcciCadScriptRequest
{
    results: OcciModelResult
}
/**  OCCI models (simplified)
 *  
 *  Used by the cloud compute worker
 * 
 *  Not used internally (yet)
 * 
 * */ 

export interface ModelRequest
{
    hash?:string // instance hash (name with parameters and values)
    params?: {[key:string]:any}
    format?: 'step'|'stl'|'gltf'
    output?: 'full'|'model'
    quality?: 'low'|'medium'|'high'
    meta?: any // TODO
}

export interface ModelResult
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

export interface CadScript
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
    script_cad_language?:string
    script_cad_version?:string
    meta?:{[key:string]:any}
}

export interface CadScriptRequest extends CadScript
{
    request?:ModelRequest
}

export interface CadScriptResult extends CadScriptRequest
{
    results: ModelResult
}
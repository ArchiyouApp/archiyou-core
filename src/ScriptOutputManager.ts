/** 
 *  ScriptOutputManager.ts
 * 
 *  Archiyou allows granular control over what the user might need from the script
 *  This is essential for complicated parametric models and assemblies
 * 
 *  Script execution and outputs are organized as follows:
 *  - Every script has one or more pipelines: These are basically functions with some management on top.
 *      - One can define a pipeline with:
 *        pipeline(<name>, <function>); See Geom.pipeline and Pipeline class
 *      - If there is no implicit pipeline defined we call that the default pipeline, which is always run
 *      - Any non-default pipelines are only run on request from the user
 * 
 *  Outputs are organized primary based on the pipelines. Every pipeline outputs the following categories.
 *   There is always only one model (which is the active Scene) but these categories have multiple entities with unique names.
 *   Any entity can be outputted in different formats (with format options). This is an overview:
 * 
 *  - model
 *      - formats: buffer(for editor viewer), glb, step, stl, svg (More are coming!)
 *  - metrics
 *      - formats: json, xls (...)
 *  - tables
 *      - formats: json, xls (...)
 *  - docs
 *      - formats: pdf (...)
 * 
 *  For requesting a specific output we use output paths (a bit like urls): 
 * 
 *  {pipeline}/{category}/?<entity>/{format}?{format options}
 * 
 *  So for example:
 *   - default/model/glb?data=true - run default pipeline and export scene as GLTF binary while exporting extra data
 *   - cnc/model/dxf?flatten
 *   - default/metrics/internal - internal are the raw internal values (used for in-scope communition)
 *   - default/tables/parts/xls
 *   - default/docs/spec/pdf
 *  
 *  Wildcards * are also possible:
*/    
//   - default/metrics/*/xls
//   - default/docs/*/pdf
//   - default/tables/*/xsl
//   - default/*  - everything of default pipeline in all available formats
//   - *  - everything (if user is allowed)
 /*
 *  We process output requests based on the above paths.
 *   1. Any wildcards are resolved (using a script meta property containing the available pipelines, metrics, tables and docs )
 *   2. All the requested data is extracted from the execution scope (see Runner.ts)
 *
 *
 */

 import type { ScriptOutputCategory, ScriptOutputFormatModel, ScriptOutputFormatMetric,
            ScriptOutputFormatTable, ScriptOutputFormatDoc, ScriptMeta
  } from './internal'

 import { convertStringValue } from './internal'

 class ScriptOutputManager
 {
    requestedOutputs: Array<ScriptOutput> = [] // unresolved output requests paths
    resolvedOutputs: Array<ScriptOutput> = []  // resolved output requests paths

    constructor()
    {
        
    }

    public request(outputs:Array<string>)
    {

    }

    private _parseOutputPaths()
    {

    }



 }

 class ScriptOutput
 {
    public raw: string; // original output path
    public valid: boolean;
    public resolved:boolean; // doesn't contain any wildcards anymore
    public pipeline:null|string;
    public category:null|ScriptOutputCategory;
    public entityName:null|string; // name of metric, table or doc
    public format: null|ScriptOutputFormatModel | ScriptOutputFormatMetric | ScriptOutputFormatTable | ScriptOutputFormatDoc|null;
    public formatOptions: Record<string, any>; // TODO: TS typing

    constructor(outputPath:string)
    {
        // parse a string like 'default/model/glb?data=true'
        this.raw = outputPath;
        const PATH_REGEX = /^(?<pipeline>[^\/]+)\/(?<category>[^\/]+)(?:\/(?<entity>[^\/]+))?\/(?<format>[^\/\?]+)(?:\?(?<options>.*))?$/;
        const match = outputPath.match(PATH_REGEX);

        if (!match || !match?.groups)
        {
            console.error(`ScriptOutput::constructor(): Invalid output path: "${outputPath}"`);
        }
        else 
        {
            this.pipeline = match.groups.pipeline;
            this.category = isScriptOutputCategory(match.groups.category) ? match.groups.category : null;
            this.entityName = match.groups.entity;
            this.format = isScriptOutputFormat(match.groups.format) ? match.groups.format : null;
            this.formatOptions = this._parseFormatOptions(match.groups.options);
            
            this._validate();
        }
    }

    private _validate(): boolean
    {
        if (!this.pipeline || !this.category || !this.format)
        {
            console.warn(`ScriptOutput::validate(): Output path "${this.raw}" is missing required fields!`);
            this.valid = false;
            return false;
        }
        this.valid = true;
        return true;
    }

    //// RESOLVING WILDCARDS ////

    /** Resolve any wildcards by filling in the entity names
     * return one or multiple new Script Output instances */
    public resolve(meta: ScriptMeta): Array<this>
    {
        // TODO
    }

    public setResolved()
    {
        this.resolved = true;
    }

    //// UTILS ////

    /** Parse a URL parameter string into an object */
    private _parseFormatOptions(optionsString:string|null):Record<string, any>
    {
        if (!optionsString) return {};

        return optionsString.split('&').reduce((agg, v) => {
            const [key, value] = v.split('=');
            agg[key] = convertStringValue(value) ?? true;
            return agg;
        }, {} as Record<string, any>);
    }
}


//// LOCAL TYPEGUARDS ////

function isScriptOutputCategory(o:any):o is ScriptOutputCategory
{
    return typeof o === "string" && ['model','metrics','tables','docs'].includes(o);
}

function isScriptOutputFormat(o:any):o is ScriptOutputFormatModel | ScriptOutputFormatMetric | ScriptOutputFormatTable | ScriptOutputFormatDoc
{
    return typeof o === "string" && ['buffer','internal', 'glb','step','stl','svg','json','xls','pdf'].includes(o);
}
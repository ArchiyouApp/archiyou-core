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
 *   - default/metrics/internal - internal are the rawPath internal values (used for in-scope communition)
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
 */

 import type { ScriptOutputCategory, ScriptOutputFormatModel, ScriptOutputFormatMetric,
            ScriptOutputFormatTable, ScriptOutputFormatDoc, ScriptMeta,
            RunnerScriptExecutionRequest, ScriptOutputPathData, ScriptOutputFormat
  } from './internal'

 import { convertStringValue } from './internal'
import { SCRIPT_OUTPUT_CATEGORIES, SCRIPT_OUTPUT_MODEL_FORMATS, SCRIPT_OUTPUT_METRIC_FORMATS,
         SCRIPT_OUTPUT_TABLE_FORMATS, SCRIPT_OUTPUT_DOC_FORMATS } from './constants';

 export class ScriptOutputManager
 {
    requestedOutputPaths: Array<ScriptOutputPath> = [] // unresolved output requests paths
    resolvedOutputsPaths: Array<ScriptOutputPath> = []  // resolved output requests paths

    constructor()
    {
        
    }

    /** Load incoming request that contains output request paths 
     *  @returns number of valid (resolved) output paths generated 
    */
    public loadRequest(request:RunnerScriptExecutionRequest, meta:ScriptMeta):this
    {
        const requestedOutputPaths = Array.isArray(request.outputs) ? request.outputs : [];
        if(requestedOutputPaths.length === 0)
        { 
            console.warn(`ScriptOutputManager::loadRequest(): Request has no output paths!`);
            return this;
        }
        requestedOutputPaths.forEach( (path) => 
        {
            const output = new ScriptOutputPath(path);
            if(output.valid)
            {
                this.requestedOutputPaths.push(output);
            }
            else 
            {
                console.warn(`ScriptOutputManager::loadRequest(): Ignoring invalid output path: "${path}"`);
            }
        });
        // Resolve wildcards in the requested outputs
        this.resolvedOutputsPaths = []; // reset
        this.requestedOutputPaths.forEach( (output) => 
        {
            this.resolvedOutputsPaths.push(...output.resolve(meta) ); // resolving can return multiple paths
        });

        return this;
    }

    //// GET RESULTS FROM PARSED OUTPUTS ////

    public getPipelines():Array<string>
    {
        return Array.from(new Set(this.resolvedOutputsPaths.map(o => o.pipeline)));
    }

    public getOutputsByPipeline(pipeline:string):Array<ScriptOutputPath>
    {
        return this.resolvedOutputsPaths.filter(o => o.pipeline === pipeline);
    }
    
    public getOutputsByPipelineCategory(pipeline:string, category:ScriptOutputCategory):Array<ScriptOutputPath>
    {
        return this.resolvedOutputsPaths.filter(o => o.pipeline === pipeline && o.category === category);
    }

    public getOutputsByPipelineEntityFormats(pipeline:string, category:ScriptOutputCategory, formats:Array<string>):Array<ScriptOutputPath>
    {
        return this.resolvedOutputsPaths.filter(o => o.pipeline === pipeline && o.category === category && formats.includes(o.format as string) );
    }


 }

 export class ScriptOutputPath
 {
    public rawPath: string; // original output path
    public resolvedPath: string; // resolved path without wildcards
    public valid: boolean;
    public resolved:boolean; // doesn't contain any wildcards anymore
    public pipeline:null|string;
    public category:null|'*'|ScriptOutputCategory;
    public entityName:null|'*'|string; // name of metric, table or doc
    public format: null|'*'|ScriptOutputFormat|null;
    public formatOptions: Record<string, any>; // TODO: TS typing

    constructor(outputPath:string)
    {
        // parse a string like 'default/model/glb?data=true'
        this.rawPath = outputPath;
        const PATH_REGEX = /^(?<pipeline>[^\/]+)\/(?<category>[^\/]+)(?:\/(?<entity>[^\/]+))?\/(?<format>[^\/\?]+)(?:\?(?<options>.*))?$/;
        const match = outputPath.match(PATH_REGEX);

        if (!match || !match?.groups)
        {
            console.error(`ScriptOutput::constructor(): Invalid output path: "${outputPath}"`);
        }
        else 
        {
            this.pipeline = match.groups.pipeline;

            if(match.groups.format === '*' || isScriptOutputCategory(match.groups.category))
            {
                this.category = match.groups.category as ScriptOutputCategory | '*';
            }
            else
            {
                console.error(`ScriptOutput::constructor(): Invalid output category "${match.groups.category}" in path: "${outputPath}. Valid ones: ${SCRIPT_OUTPUT_CATEGORIES.join(', ')}"`);
                this.category = null;
            }

            this.entityName = match.groups.entity;

            if(!match.groups.format || match.groups.format === '*' || isScriptOutputFormat(match.groups.format))
            {
                // If format is null, we set it to wildcard
                this.format = match.groups.format as ScriptOutputFormat || '*';
            } 
            else 
            {
                console.error(`ScriptOutput::constructor(): Invalid output format "${match.groups.format}" in path: "${outputPath}"`);
                this.format = null;
            }

            this.formatOptions = this._parseFormatOptions(match.groups.options);
            
            this._validate();
        }
    }

    copy():ScriptOutputPath
    {
        return new ScriptOutputPath(this.rawPath);
    }

    toData():ScriptOutputPathData
    {
        return {
            resolvedPath: this.resolvedPath,
            requestedPath: this.rawPath,
            pipeline: this.pipeline,
            category: this.category as ScriptOutputCategory,
            entityName: this.entityName,
            format: this.format as ScriptOutputFormat, // no wild cards after resolve
            formatOptions: this.formatOptions
        }
    }

    private _validate(): boolean
    {
        if (!this.pipeline || !this.category || !this.format)
        {
            console.warn(`ScriptOutputPath::validate(): Output path "${this.rawPath}" is missing required fields!`);
            return this.valid = false;
        }

        // For now only allow wildcards for categories, entities and formats 
        if(this.pipeline.includes('*'))
        {
            console.warn(`ScriptOutputPath::wildCardsAt(): Wildcards in pipeline names are not supported! (${this.rawPath})`);
            return this.valid = false;
        }
        
        this.valid = true;
        return true;
    }

    private checkValid():boolean
    {
        if(!this.valid)
        { 
            console.warn(`ScriptOutputPath::resolve(): Cannot process output path: "${this.rawPath}"`);
        }
        return this.valid;
    }

    //// RESOLVING WILDCARDS ////

    /** Resolve any wildcards in request output path by filling in the entity names
     * return one or multiple new Script Output instances */
    public resolve(meta: ScriptMeta): Array<ScriptOutputPath>
    {
        if(this.checkValid())
        {
            // No wildcards
            if(!this.hasWildCard())
            {
                // check entity name
                if (this.category !== 'model' && !this._metaHasEntityName(meta, this.category as ScriptOutputCategory, this.entityName))
                {
                    console.warn(`ScriptOutputPath::resolve(): Invalid entity name "${this.entityName}" for category "${this.category}". Skipped!`);
                    return [];
                }
                return [this.copy().setResolved()]; // No wildcards, return copy of self
            }

            // Make a big resolve loop
            const wildcardsAt = this.wildCardsAt();
            const resolvedOutputsPaths: Array<ScriptOutputPath> = [];
            const categories = wildcardsAt.includes('category') 
                                ? ['model','metrics','tables','docs'] as Array<ScriptOutputCategory> 
                                : [this.category];

            categories.forEach((category) =>
            {
                const resolvedOutputOfCategory = this.copy() // always copy first instance
                resolvedOutputOfCategory.category = category;

                // Some verbose checking for clarity
                let entities = [];
                if(wildcardsAt.includes('entity'))
                {
                    entities = this._getEntitiesFromMeta(meta, category as ScriptOutputCategory);
                }
                else {
                    entities = (category === 'model') 
                                        ? [null] // model has no entity name
                                        // validate the entity name - otherwise return empty array - so next loop is skipped
                                        : (this._metaHasEntityName(meta, category as ScriptOutputCategory, this.entityName)) ? [this.entityName] : []; 

                    // give a warning if entity name is not valid
                    if(entities.length === 0)
                    {
                        console.warn(`ScriptOutput::resolve(): Invalid entity name "${this.entityName}" for category "${category}. Skipped!"`);
                    }
                }
                                    
                entities.forEach((entity, i) =>
                {
                    const resolvedOutputOfEntityName = (i === 0) 
                                                        ?  resolvedOutputOfCategory // no multiple - keep working on original output instance
                                                        : resolvedOutputOfCategory.copy()
                    resolvedOutputOfEntityName.entityName = entity;

                    // Finally formats
                    const formats = wildcardsAt.includes('format') 
                                        ? this._getFormatsByCategory(category as ScriptOutputCategory)
                                        : [this.format as string];

                    formats.forEach((format, j) =>
                    {
                        const resolvedOutputOfFormat = (j === 0) 
                                                        ?  resolvedOutputOfEntityName // no multiple - keep working on original output instance
                                                        : resolvedOutputOfEntityName.copy()
                        resolvedOutputOfFormat.format = format as ScriptOutputFormatModel | ScriptOutputFormatMetric | ScriptOutputFormatTable | ScriptOutputFormatDoc; 
                        resolvedOutputsPaths.push(resolvedOutputOfFormat.setResolved()); // set resolved!
                    });

                });

            })

            return resolvedOutputsPaths;

        }
    }

    public setResolved():ScriptOutputPath
    {
        this.resolved = true;
        // also generate resolved path
        this.resolvedPath = `${this.pipeline}/${this.category}${this.entityName ? '/'+this.entityName : '' }/${this.format}`;
        const optionsKeys = Object.keys(this.formatOptions);
        if(optionsKeys.length > 0)
        {
            this.resolvedPath += '?' + optionsKeys.map( (k) => `${k}=${this.formatOptions[k]}` ).join('&');
        }
        return this;
    }
    

    public hasWildCard():boolean
    {
        return this.checkValid() && this.wildCardsAt().length > 0;
    }

    public wildCardsAt():Array<string>
    {
        if(this.checkValid())
        {
            const wildCardsAt: Array<string> = [];
            if(this.category.includes('*')) wildCardsAt.push('category');
            if(this.entityName?.includes('*')) wildCardsAt.push('entity');
            if(this.format.includes('*')) wildCardsAt.push('format');
            return wildCardsAt;
        }
        return [];
    }

    private _getEntitiesFromMeta(meta:ScriptMeta, category:ScriptOutputCategory):Array<string>|null
    {
        if(category === 'model') return null;
        if(typeof meta !== 'object') throw new Error(`ScriptOutputPath::getEntitiesFromMeta(): Cannot get entities from invalid meta data!`);
        return meta[category]; 
    }

    /** Get all available formats by category
     *  set flag internal to true to also include 'internal' format
     */
    private _getFormatsByCategory(category:ScriptOutputCategory, internal:boolean=false):Array<string>
    {
        switch(category)
        {
            case 'model': return (internal ? ['internal'] : []).concat(SCRIPT_OUTPUT_MODEL_FORMATS);
            case 'metrics': return (internal ? ['internal'] : []).concat(SCRIPT_OUTPUT_METRIC_FORMATS);
            case 'tables': return (internal ? ['internal'] : []).concat(SCRIPT_OUTPUT_TABLE_FORMATS);
            case 'docs': return (internal ? ['internal'] : []).concat(SCRIPT_OUTPUT_DOC_FORMATS);
            default: return [];
        }
    }

    private _metaHasEntityName(meta:ScriptMeta, category:ScriptOutputCategory, entityName:string):boolean
    {
        if(!entityName) return false;
        const entities = this._getEntitiesFromMeta(meta, category);
        return entities ? entities.includes(entityName) : false;
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
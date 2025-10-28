/**
 *  ScriptOutputPath
 *      A class to parse, validate and resolve script output paths
 *      Unresolved paths can contain wildcards for category, entity name and format
 * 
 *  Example paths:
 *     'default/model/glb?data=true'            - model output in glb format with data option */
 //     'default/tables/*/xlsx'                 - all tables in xlsx format
 //    'default/metrics/*/json'               - all metrics in internal format (raw data)
 //    'default/docs/spec/pdf'                  - doc named 'spec' in pdf format
 /* 
 *  ScriptOutputPath instances are also used to save and load outputs to cache file paths 
 */
 
 import { SCRIPT_OUTPUT_CATEGORIES, SCRIPT_OUTPUT_DOC_FORMATS, SCRIPT_OUTPUT_METRIC_FORMATS, 
        SCRIPT_OUTPUT_MODEL_FORMATS, SCRIPT_OUTPUT_TABLE_FORMATS }
            from './internal' // constants
 import type { ScriptMeta, ScriptOutputCategory, ScriptOutputFormat, 
            ScriptOutputFormatMetric, ScriptOutputFormatModel, ScriptOutputFormatTable, 
            ScriptOutputFormatDoc, ScriptOutputPathData, ScriptOutputDataWrapper } 
        from './internal';

import { isScriptOutputFormat, isScriptOutputCategory } from './internal'; // ScripOutputManager typeguards
import { convertStringValue, recordToUrlParams } from './internal'; // utils
 
 export class ScriptOutputPath
 {
    public requestedPath: string; // original output path
    public resolvedPath: string; // resolved path without wildcards
    public valid: boolean;
    public resolved:boolean; // doesn't contain any wildcards anymore
    public pipeline:null|string;
    public category:null|'*'|ScriptOutputCategory;
    public entityName:null|'*'|string; // name of metric, table or doc
    public format: null|'*'|ScriptOutputFormat|null;
    public formatOptions: Record<string, any>; // TODO: TS typing

    public _output:any|ScriptOutputDataWrapper // if we load output path from result, we can keep track of data here

    constructor(outputPath?:string)
    {
        if(!outputPath)
        {
            console.warn(`ScriptOutputPath::constructor(): Empty ScriptOutputPath instance created. Use fromData() to set!`);
            return;
        }
        // parse a string like 'default/model/glb?data=true'
        this.requestedPath = outputPath;
        const PATH_REGEX = /^(?<pipeline>[^\/]+)\/(?<category>[^\/]+)(?:\/(?<entity>[^\/]+))?\/(?<format>[^\/\?]+)(?:\?(?<options>.*))?$/;
        const match = outputPath.match(PATH_REGEX);

        if (!match || !match?.groups)
        {
            console.error(`ScriptOutputPath::constructor(): Invalid output path: "${outputPath}"`);
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
        return new ScriptOutputPath(this.requestedPath);
    }

    toData():ScriptOutputPathData
    {
        return {
            resolvedPath: this.resolvedPath,
            requestedPath: this.requestedPath,
            pipeline: this.pipeline,
            category: this.category as ScriptOutputCategory,
            entityName: this.entityName,
            format: this.format as ScriptOutputFormat, // no wild cards after resolve
            formatOptions: this.formatOptions
        }
    }

    fromData(data: ScriptOutputPathData): this
    {
        if (!data || typeof data !== 'object')
        {
            console.error(`ScriptOutputPath::fromData(): Invalid data provided!`);
            return this;
        }
        console.info(`ScriptOutputPath::fromData(): Loading output path from data: `, data);

        this.requestedPath = data.requestedPath;
        this.resolvedPath = data.resolvedPath;
        this.pipeline = data.pipeline;
        this.category = data.category as ScriptOutputCategory;
        this.entityName = data.entityName;
        this.format = data.format as ScriptOutputFormat;
        this.formatOptions = data.formatOptions;
        this.valid = true;
        this.resolved = true;
        this.valid = this._validate();
        return this;
    }

    /** Alter path for internal use in context of components
     *  We try to keep it the same as normal use */
    internalize()
    {
        this.entityName = (this.category !== 'model' ) ? '*' : null; // all entities for internal outputs in tables, docs, metrics
        this.format = 'internal';
        this.formatOptions = {};
        // Make resolved path, keeping wildcard in for metrics, tables, docs
        this.resolvedPath = `${this.pipeline}/${this.category}/${ (this.entityName) ? this.entityName + '/' : ''}internal`;
        this.resolved = true;
        this._validate();
        return this;
    }

    setOutputData(data:any):this
    {
        this._output = data;
        return this;
    }

    //// CACHE FILE PATHS ////
    
    /** Load output path data from a cache file path */
    fromCacheFilePath(filePath:string):this
    {
        // parse a file path string like:
        // {pipeline}/{category}/{entityName?}/result[?{options}].{format}
        //  Examples: 
        //  - 'default/model/result?data=true.glb'
        //  - 'default/tables/parts/result.xlsx'
        const CACHE_FILEPATH_REGEX = /^(?<pipeline>[^\/]+)\/(?<category>[^\/]+)(?:\/(?<entity>[^\/]+))?\/result(?:\?(?<options>.*))?\.(?<format>[^\/\?]+)$/;
        const match = filePath.match(CACHE_FILEPATH_REGEX);

        if (!match || !match?.groups)
        {
            console.error(`ScriptOutput::fromCacheFilePath(): Invalid cache file path: "${filePath}"`);
        }
        else 
        {
            this.pipeline = match.groups.pipeline;
            this.category = match.groups.category as ScriptOutputCategory;
            this.entityName = match.groups.entity;
            this.format = match.groups.format as ScriptOutputFormat;
            this.formatOptions = this._parseFormatOptions(match.groups.options);
            this.requestedPath = `${this.pipeline}/${this.category}${this.entityName ? '/'+this.entityName : '' }/${this.format}${recordToUrlParams(this.formatOptions) ? '?' + recordToUrlParams(this.formatOptions) : ''}`;
            this._validate();
            if(this.valid)
            {
                this.resolved = true;
                this.resolvedPath = this.requestedPath; // same as requested path because cache has no wildcards
            }
        }
        return this;
    }

    /** When saving output to cache we need a file path that contains all the info of the output */
    toCacheFilePath(what:'full'|'dir'|'filename'='filename'):string|null
    {
        if(this.checkValid() && this.resolved)
        {
            if(what === 'filename')
            {
                return `result${recordToUrlParams(this.formatOptions) ? '?' + recordToUrlParams(this.formatOptions) : ''}.${this.format}`;
            }
            else if(what === 'dir')
            {
                return `${this.pipeline}/${this.category}${this.entityName ? '/'+this.entityName : '' }/`;
            }
            else {
                // full
                return `${this.pipeline}/${this.category}${this.entityName ? '/'+this.entityName : '' }/result${recordToUrlParams(this.formatOptions) ? '?' + recordToUrlParams(this.formatOptions) : ''}.${this.format}`;
            }
        }
        return null;
    }   

    //// VALIDATION ////

    private _validate(): boolean
    {
        if (!this.pipeline || !this.category || !this.format)
        {
            console.warn(`ScriptOutputPath::validate(): Output path "${this.requestedPath}" is missing required fields!`);
            return this.valid = false;
        }

        // For now only allow wildcards for categories, entities and formats 
        if(this.pipeline.includes('*'))
        {
            console.warn(`ScriptOutputPath::wildCardsAt(): Wildcards in pipeline names are not supported! (${this.requestedPath})`);
            return this.valid = false;
        }
        
        this.valid = true;
        return true;
    }

    public checkValid():boolean
    {
        if(!this.valid)
        { 
            console.warn(`ScriptOutputPath::resolve(): Cannot process output path: "${this.requestedPath}"`);
        }
        return this.valid;
    }

    //// RESOLVING WILDCARDS ////

    /** Resolve any wildcards in request output path by filling in the entity names
     * @return one or multiple new Script Output instances 
     *          and any warnings 
     * */
    public resolveVerbose(meta: ScriptMeta):{ resolved: Array<ScriptOutputPath>, warnings: Array<string> }
    {
        const warnings:Array<string> = []

        if(this.checkValid())
        {
            // No wildcards
            if(!this.hasWildCard())
            {
                // check entity name
                if (this.category !== 'model' && !this._metaHasEntityName(meta, this.category as ScriptOutputCategory, this.entityName))
                {
                    const w = `ScriptOutputPath::resolve(): Invalid entity name "${this.entityName}" for category "${this.category}". Skipped! Please use any of these: "${meta[this.category as ScriptOutputCategory]?.join(', ')}"`;
                    console.warn(w);
                    warnings.push(w);
                    return { resolved: [], warnings };
                }
                // No wildcards, return copy of self
                return { resolved: [this.copy().setResolved()], warnings: [] }; 
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
                        resolvedOutputOfFormat.format = format as ScriptOutputFormatModel | 
                            ScriptOutputFormatMetric | ScriptOutputFormatTable | ScriptOutputFormatDoc; 
                        resolvedOutputsPaths.push(resolvedOutputOfFormat.setResolved()); // set resolved!
                    });

                });

            })

            return { resolved: resolvedOutputsPaths, warnings };

        }
    }

    /** Simple resolve of wildcards in current output path */
    resolve():Array<ScriptOutputPath>
    {
        return this.resolveVerbose({} as ScriptMeta).resolved;
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
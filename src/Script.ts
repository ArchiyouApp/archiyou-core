/**
 *  Script.ts
 *    New script class for Archiyou Scripts
 *    Combines the creation in editor and publishing into one model
 *    Adds programmatic layer for validation 
 */

import { uuidv4 } from './internal' // utils
import semver from 'semver'; // for version validation

import type { ScriptParamData, ScriptPublished, ScriptMeta } from './internal';
import { ScriptParam } from './internal'

export class Script 
{
    //// ATTRIBUTES ////
    id: string; // uuid for the script - this is primary because script names can be changed
    name: string; // always lowercase 
    author: string; // always lowercase
    version: string;  // valid semver version
    private namespace: string; // unique namespace for the script {author}/{name} - automatically generated from author and name
    description: string;
    tags: string[] = []; // array of tags for the script
    created: Date;
    updated: Date;

    code:string;
    params:Record<string,ScriptParam> = {}; 
    presets:Record<string, Record<string, ScriptParamData>> = {}; // TODO: Presets of parameter values

    meta: ScriptMeta|null;  // To be filled in by client or server after execution

    published: ScriptPublished|null; // Information on the published script (if null, not published)
    previousId?:string; // uuid of the previous script version, if any
    previousVersion?:string; // version of the previous script version, if any


    _valid = false; // internal validation flag



    constructor(author?:string, name?:string, version?:string, code?:string, params?:Record<string,ScriptParam>, presets?:Record<string, Record<string, ScriptParamData>>)
    {
        if (!name || !author)
        {
            console.warn(`Script::constructor(): Empty script created, use fromData() to load existing script data`);
        }
        else
        {
            this.name = name?.toLowerCase();
            this.author = author?.toLowerCase();
            this.version = version;
            this.code = code;
            this.params = params || {};
            this.presets = presets || {};
            
            this._setDefaults();
            this.validate(); // automatically validate the script on creation
        }
    }

    isValid():boolean
    {
        return this._valid;
    }

    //// VALIDATION AND DEFAULTS ////

    validate()
    {   
        if(!this._validateBasics()) 
        {
            throw new Error("Script.validate(): Script validation failed: Basic attributes are not valid");
        }
    }

    _setDefaults()
    {
        this.id = this.id ?? uuidv4();
        this.version =  (this.version) ? this.version 
                            : (this.previousVersion && semver.valid(this.previousVersion)) 
                                ? semver.inc(this.previousVersion) : undefined; 
        this.namespace = this.namespace ?? `${this.author}/${this.name}`.toLowerCase();
        this.description = this.description ?? '';
        this.created = this.created ?? new Date();
        this.updated = this.updated ?? new Date();
    }

    _validateBasics():boolean
    {
        const VALIDATIONS = [
            this.id && typeof this.id === "string",
            this.name && typeof this.name === "string" && this.name.length > 0,
            this.author && typeof this.author === "string" && this.author.length > 0,
            // this.version && typeof this.version === "string", // can be undefined
            this.namespace && typeof this.namespace === "string" && this.namespace.length > 0,
            typeof this.description === "string", // Allow empty description
            Array.isArray(this.tags),
            this.created instanceof Date,
            this.updated instanceof Date,
            typeof this.code === "string",
            typeof this.params === "object",
            typeof this.presets === "object",
        ]

        this._valid = VALIDATIONS.every((v) => v === true);
        return this._valid;
    }

    //// PUBLISH ////

    validateParamValues(paramValues:Record<string,any>):boolean
    {
        for(const [key, value] of Object.entries(paramValues))
        {
            const param = this.params[key];
            
            if(!param)
            {
                console.error(`Script.validateParamValues(): Invalid param name "${key}"`);
                return false;
            }
            else if(!param.validateValue(value))
            {
                console.error(`Script.validateParamValues(): Invalid value for param "${key}": ${value}`);
                return false;
            }
        }
        return true;
    }

    /** When a script is executed with a set of params we generate a hash
     *  to uniquely identify the variant of the script. For example for caching
     */
    async getVariantId(paramValues: Record<string,any>): Promise<string> 
    {
        const HASH_LENGTH_TRUNCATE = 11;
        const { createHash } = await import('crypto'); // NOTE: only for node right now!

        // generate string based on the param names and values
        // in format: {param1:value1,param2:value2,...}
        const input = JSON.stringify(paramValues);
        const hash = createHash('md5').update(input).digest();

        // Convert to base64 URL-safe format and truncate
        return hash.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
            .substring(0, HASH_LENGTH_TRUNCATE);
    }

    /** Get number of possible variants */
    getNumVariants():number
    {
        // No parameters, only one variant
        if(!this.params || typeof this.params !== 'object') return 1;

        if(Object.values(this.params).find(param => !param.isIterable()))
        {
            return Infinity;
        }

        return Object.values(this.params).reduce((acc, param) => {
            acc *= param.numValues();
            return acc;
        }, 1);
    }

    /** Iterate over all possible parameter variants
     *  @params params Array of parameter names to iterate over, others are kept to default
     */
    *iterateVariants(only?:Array<string>):Generator<Record<string,any>>
    {
        if(!this.params){ throw new Error("Script::iterateVariants: No parameters defined"); }

        only = only || Object.keys(this.params); // all

        // The params that we iterate
        const iterParams = Object.values(this.params).filter(p => p.isIterable() && only.includes(p.name));
        const staticParams = Object.values(this.params).filter(p => !p.isIterable() || !only.includes(p.name));
        const staticParamValues = Object.fromEntries(staticParams.map(p => [p.name, p.default]));

        // No params to iterate through
        if(iterParams.length === 0) 
        {
            // No iterable parameters, return static variant
            yield staticParamValues;
            return;
        }

        // Now start iterating along every parameter
        yield* this._generateCombinations(iterParams, staticParamValues);

    }

    /** Generate all parameter combinations
     *  This function uses recursion to generate all possible combinations of parameter values.
    */
    *_generateCombinations(params: Array<ScriptParam>, staticValues: Record<string,any>): Generator<Record<string,any>> 
    {
        if (params.length === 0) {
            yield staticValues;
            return;
        }
        
        const [firstParam, ...restParams] = params;
        
        for (const value of firstParam.iterateValues()) 
        {
            const currentValues = { ...staticValues, [firstParam.name]: value };
            
            if (restParams.length === 0) 
            {
                yield currentValues;
            } 
            else 
            {
                yield* this._generateCombinations(restParams, currentValues);
            }
        }
    }



    //// IO ////

    fromData(data:ScriptData):this
    {
        this.id = data.id;
        this.name = data.name.toLowerCase();
        this.author = data.author.toLowerCase();
        this.namespace = `${this.author}/${this.name}`.toLowerCase();
        this.version = data.version;
        this.description = data.description;
        this.tags = Array.isArray(data.tags) ? data.tags : [];
        this.created = data.created ? new Date(data.created) : new Date();
        this.updated = data.updated ? new Date(data.updated) : new Date();
        this.code = data.code;
        this.params = (typeof data.params === 'object') 
            ? Object.entries(data.params).reduce((acc, [key, value]) => {
                    try {
                        acc[key] = new ScriptParam().fromData({ name:key, ...value }); // inject name 
                    }
                    catch(e) {
                        console.error(`Script::fromData(): Skipping param "${key}":`, e);
                    }
                return acc;
            }, {} as Record<string, ScriptParam>) : {};
        this.presets = data.presets || {};
        this.published = data.published || null;

        // Validate the script after loading
        this.validate();
        return this;
    }

    /** To raw data */
    toData():ScriptData
    {
        return {
            id: this.id,
            name: this.name,
            author: this.author,
            version: this.version,
            description: this.description,
            tags: this.tags,
            created: this.created ? this.created.toISOString() : null,
            updated: this.updated ? this.updated.toISOString() : null,
            code: this.code,
            params: (typeof this.params === 'object') 
                ? Object.entries(this.params).reduce((acc, [key, value]) => {
                    acc[key] = { name:key, ...value.toData() }; // inject name into ParamData
                    return acc;
                }, {} as Record<string, ScriptParamData>) : {},
            presets: this.presets,
            published: this.published,
        };
    }

}


//// RELATED TYPES ////

export interface ScriptData
{
    id: string; // all scripts have a id
    name?: string; // most script have name
    author?: string; 
    // valid semver version - we use automatic versioning (TODO)
    // The user can provide major version when publishing
    version?: string; 
    description: string;
    tags?: string[];
    created: string | null;
    updated: string | null;
    code: string;
    params: Record<string,ScriptParamData>;
    presets?: Record<string, Record<string, ScriptParamData>>;
    published: ScriptPublished | null;
}

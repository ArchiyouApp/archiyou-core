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
    // version is only assigned when published
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



    constructor(author?:string, name?:string, code?:string, params?:Record<string,ScriptParam>, presets?:Record<string, Record<string, ScriptParamData>>)
    {
        if (!name || !author)
        {
            console.warn(`Script::constructor(): Empty script created, use fromData() to load existing script data`);
        }
        else
        {
            this.name = name.toLowerCase();
            this.author = author?.toLowerCase();
            // version is at published.version
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
        
        this.description = this.description ?? '';
        this.created = this.created ?? new Date();
        this.updated = this.updated ?? new Date();
    }

    _validateBasics():boolean
    {
        const VALIDATIONS = {
            id: this.id && typeof this.id === "string",
            name : this.name && typeof this.name === "string" && this.name.length > 0,
            author: this.author && typeof this.author === "string" && this.author.length > 0,
            description: (!this?.description) || typeof this.description === "string", // Allow nullish description
            tags: Array.isArray(this.tags),
            created: this.created instanceof Date,
            updated: this.updated instanceof Date,
            code: typeof this.code === "string",
            params: typeof this.params === "object",
            presets: typeof this.presets === "object",
        }

        const isValidBasic = Object.values(VALIDATIONS).every((v) => v === true)
        if(!isValidBasic)
        {
            const firstErrorIndex = Object.values(VALIDATIONS).findIndex(v => v !== true);
            console.error(`Script._validateBasics(): Basic validation failed: ${Object.keys(VALIDATIONS)[firstErrorIndex]}`);
        }
        
        return this._valid = isValidBasic && this._validatePublished();
    }

    /** Validated ScriptPublished */
    _validatePublished():boolean
    {
        if(!this.published) return true; // If not published, no validation needed
        if(typeof this.published !== "object"){ return false; }

        const VALIDATIONS = {
            version : typeof this.published?.version === "string" 
                // see docs semver - valid return null if invalid, string if valid. coerce allows things like "0.5" to be valid
                && semver.valid(semver.coerce(this.published.version)) !== null, 
            //title: this.published.title && typeof this.published.title === "string" && this.published.title.length > 0,
            // libraryUrl: this.published?.libraryUrl && typeof this.published.libraryUrl === "string" && this.published.libraryUrl.length > 0,
            // url: this.published?.url && typeof this.published.url === "string" && this.published.url.length > 0,
            // published : this.published.published instanceof Date,
            // description: this.published.description && typeof this.published.description === "string",
            // params: typeof this.published.params === "object",
        }

        const isValidPublished = Object.values(VALIDATIONS).every((v) => v === true);
        
        if(!isValidPublished)
        {
            const firstErrorIndex = Object.values(VALIDATIONS).findIndex((v) => v !== true); // trigger on anything that is not a true
            console.error(`Script._validatePublished(): Published validation failed: ${Object.keys(VALIDATIONS)[firstErrorIndex]}`);
        }

        return isValidPublished
    }

    /** Used by library to set public url of this script */
    setPublishedUrl(rootUrl:string):this
    {
        if(this.published)
        {
            this.published.libraryUrl = rootUrl; // without trailing slash
            this.published.url = `/${this.author}/${this.name}:${this.published.version}`;
        }
        else {
            console.warn("Script.setPublishedUrl(): Cannot set published URL, script is not published yet.");
        }
        return this;
    }

    //// PARAM CHECKS ////

    /** Check parameter values against script definition params and give back error messages
     *  @return 
     *      success flag
     *      Record with valid values only
     */
    checkParamValuesVerbose(paramValues:Record<string,any>):{ success: boolean, errors: Array<string>, checkedParamValues: Record<string,any> }
    {
        let errors:Array<string> = [];
        let success: boolean;

        const checkedParamValues = Object.fromEntries(
            Object.entries(this.params).map(([key, param]) => {
                return [key, param.default];
            })
        );

        // empty/nullish input param values
        if(paramValues === null || typeof paramValues !== 'object' 
            || (typeof paramValues === 'object' && Object.keys(paramValues).length === 0))
        {
            return { success: true, errors: [], checkedParamValues };
        }

        for(const [key, value] of Object.entries(paramValues))
        {
            console.info(`Script.checkParamValues(): Checking param "${key}" with value:`, value);

            const keyUpper = key.toUpperCase();
            const param = this.params[keyUpper];

            if(!param)
            {  
                throw new Error(`Script.checkParamValuesVerbose(): Parameter "${key}" is not defined in script parameters. Check script params and published.params!`); 
            }

            const { success: validateSuccess, errors: validateErrors } = param.validateValueVerbose(value)

            if(param && validateSuccess)
            {
                checkedParamValues[keyUpper] = value;
                success = validateSuccess;
            }
            else {
                success = false;
                if(!param)
                { 
                    errors.push(`Script.checkParamValues(): Invalid param name "${key}", ignoring it.`);
                }
                else {
                    errors = errors.concat(validateErrors);
                }
            }
        }

        // Log all errors
        errors.forEach( (e) => console.error(e) );

        return { success, errors, checkedParamValues };   
    }

    /** Simple flag version */
    checkParamValues(paramValues:Record<string,any>):boolean
    {
        return this.checkParamValuesVerbose(paramValues).success;
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
        // TODO: remove dynamic import?
        const { createHash } = await import('crypto'); // NOTE: only for node right now!

        // generate string based on the param names and values
        // in format: {param1:value1,param2:value2,...}
        // NOTE: We use param definitions in script.params and default values if not set in paramValues
        const paramValuesDefault = Object.fromEntries(Object.entries(this.params).map(([paramName, paramObj]) => [paramName.toUpperCase(), paramObj?.default]));
        // Only accept param names that are also in definition 
        const paramValuesUpper = Object.fromEntries(
            Object.entries(paramValues)
                .map(([k, v]) => [k.toUpperCase(), v])
                .filter(([k, v]) => Object.keys(this.params).map(p => p.toUpperCase()).includes(k))
        );
        const input = JSON.stringify({...paramValuesDefault, ...paramValuesUpper}); // incoming overwrite default
        const hash = createHash('md5').update(input).digest();

        // Convert to base64 URL-safe format and truncate
        const id = hash.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
            .substring(0, HASH_LENGTH_TRUNCATE);

        console.log(`Script::getVariantId(): Generated variant id "${id}" for param values: ${input}`);

        return id;
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

    /** Load from raw data
     *  Some backwards compatibility
     */
    fromData(data:Script|ScriptData|Record<string, any>):Script|this
    {
        if (data instanceof Script)
        {
            return data as Script;
        }

        this.id = data.id;
        this.name = data.name.toLowerCase();
        this.author = data.author?.toLowerCase();
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

        this.published = data.published || null; // will be validated in validate()     
        
        // Some backwards compatibility for v1 scripts
        const anyData = (data as any);
        if(!this.published && anyData?.version)
        {
            this.published = {
                title: anyData.name,
                version: anyData.version,
            } as ScriptPublished
        }

        // Try to fix any semver issues
        if(this.published)
        {
            this.published.version = this.fixSemver(this.published.version);
        }

        // Validate the script after loading
        try { 
            this.validate();
        }
        catch(e)
        {
            return null;
        }

        return this;
    }

    fixSemver(v:string)
    {
        return semver.valid(semver.coerce(v));
    }

    /** To raw data */
    toData():ScriptData
    {
        return {
            id: this.id,
            name: this.name,
            author: this.author,
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
    name?: string; // most script have name - lowercase
    author?: string; 
    // The user provides an version when publishing, see published
    description: string;
    tags?: string[];
    created: string | null;
    updated: string | null;
    code: string;
    params: Record<string,ScriptParamData>;
    presets?: Record<string, Record<string, ScriptParamData>>;
    published: ScriptPublished | null;
}

/**
 *  Script.ts
 *    New script class for Archiyou Scripts
 *    Combines the creation in editor and publishing into one model
 *    Adds programmatic layer for validation 
 */

import { uuidv4 } from './internal' // utils
import semver from 'semver'; // for version validation

import type { Param, PublishParam, ScriptPublished,  } from "./internal";


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
    params:Record<string, Param> = {}; // TODO
    presets:Record<string, Record<string, PublishParam>> = {}; // TODO: Presets of parameter values

    published: ScriptPublished|null; // Information on the published script (if null, not published)
    previousId?:string; // uuid of the previous script version, if any
    previousVersion?:string; // version of the previous script version, if any


    _valid = false; // internal validation flag



    constructor(author?:string, name?:string, version?:string, code?:string, params?:Record<string, Param>, presets?:Record<string, Record<string, PublishParam>>)
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
       if(!this._validateBasics()) throw new Error("Script.validate(): Script validation failed: Basic attributes are not valid");
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
            typeof this.params === "object" && !Array.isArray(this.params),
            typeof this.presets === "object" && !Array.isArray(this.presets),
        ]

        this._valid = VALIDATIONS.every((v) => v === true);
        return this._valid;
    }

    //// PUBLISH ////

    // TODO


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
        this.params = data.params || {};
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
            params: this.params,
            presets: this.presets,
            published: this.published,
        };
    }

}


//// RELATED TYPES ////

export interface ScriptData
{
    id: string;
    name: string;
    author: string;
    version?: string; // valid semver: can be undefined, then automatically generated
    description: string;
    tags: string[];
    created: string | null;
    updated: string | null;
    code: string;
    params: Record<string, Param>;
    presets: Record<string, Record<string, PublishParam>>;
    published: ScriptPublished | null;
}

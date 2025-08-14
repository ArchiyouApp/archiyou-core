/**
 *  a Parameter instance of a script for internal use
 *  containts extra methods to validate, iterate etc
 *  use toData() to convert to ScriptParamData
 */

import type { ModelUnits, ParamType, ParamObjectSchema, 
        ParamBehaviourTarget} from './internal'

import { isScriptParamType } from './internal'

import { isNumeric } from './internal' // utils

export class ScriptParam
{
    //// SETTINGS ////
    MAX_TEXT_LENGTH = 255;

    //// END SETTINGS ////


    id:string;
    type:ParamType;
    name:string;
    
    enabled?:boolean
    visible?:boolean // Param is visible or not
    label: string // publically visible name
    
    default?: any // Default value: can be string or number
    _value?: any|Array<any> // single or multiple values - private
    
    min?: number // for ParamInputNumber
    max?: number // for ParamInputNumber
    step?: number // for ParamInputNumber
    options?: Array<string> // for ParamInputOptions
    length?: number // for ParamInputText, ParamInputList    

    listElem?: ScriptParam;
    schema?: ParamObjectSchema // object definition for complex params
    
    // Publishing
    order?:number // integer, lower is in front
    iterable?:boolean // for determine param variants
    description?:string // added for the user
    units?:ModelUnits // also for the user

    // Managed params 
    _definedProgrammatically?: boolean // this Param is defined programmatically in script
    _behaviours?: Record<ParamBehaviourTarget, (curParam:ScriptParamData, params:Record<string,ScriptParam>) => any> | {} 

    constructor()
    {
        // use fromData to create 
    }

    fromData(param:ScriptParamData)
    {
        const validatedData = this.validateInput(param);
        
        if(validatedData)
        {
           // All keys are the same - first copy
           Object.assign(this, validatedData);

           // Do some alterations
           this.iterable = this.isIterable(); // set iterable based on type
           this.listElem = (typeof param?.listElem === 'object') ? new ScriptParam().fromData(param?.listElem) : undefined;

           // TODO: behaviour functions (if any?)
        }
        
        return this;
    }

    /** Export ScriptParam instance to equivalent data structure */
    toData(): ScriptParamData
    {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            enabled: this.enabled,
            visible: this.visible,
            label: this.label,
            default: this.default,
            _value: this._value,
            min: this.min,
            max: this.max,
            step: this.step,
            options: this.options,
            length: this.length,
            listElem: this.listElem?.toData(),
            schema: this.schema,
            units: this.units,
            order: this.order,
            iterable: this.iterable,
            description: this.description,
        };
    }

    /** Validate incoming ScriptParamData object */
    validateInput(param:ScriptParamData):ScriptParamData
    {
        if(!param || typeof param !== 'object')
        {
            throw new Error(`ScriptParam::validateInput: Please supply ScriptParamData object for param "${param.name}". Got data: ${JSON.stringify(param)}`);
        }
        // check type
        if(!isScriptParamType(param?.type))
        {
            throw new Error(`ScriptParam::validateInput: Invalid param type: "${param.type}" for "${param.name}"`);
        }
        // check name
        if(typeof param?.name !== 'string' || param?.name.length === 0)
        {
            throw new Error(`ScriptParam::validateInput: Invalid param name: "${param.name}" for param "${param.name}"`);
        }
        // check internal structure of param
        if(!this.validateStructure(param))
        {
            throw new Error(`ScriptParam::validateInput: Invalid param structure: ${JSON.stringify(param)} for "${param.name}"`);
        }
        
        return param;
    }

    /** Validate structure of ParamData by type 
     *  NOTE: _value is always internal, so we don't validate it here
     *  use validateParamValue() for value validation
    */
    validateStructure(param:ScriptParamData):boolean
    {
        if(!param || typeof param !== 'object')
        {
            throw new Error(`ScriptParam::validateStructure: Invalid param: ${JSON.stringify(param)}`);
        }

        // default needs to be present always
        if(!param?.default){
            throw new Error(`ScriptParam::validateStructure: Default value is required for param "${param?.name}"`);
        }

        switch(param?.type)
        {
            case 'number':
                param.step = param.step || 1; // default step
                const rmin = isNumeric(param?.min);
                const rmax = isNumeric(param?.max);
                const rstep = isNumeric(param?.step);
                if(!rmin) console.error(`ScriptParam::validateStructure: Value "${param?.min}" is invalid for param "${param?.name}"`);
                if(!rmax) console.error(`ScriptParam::validateStructure: Value "${param?.max}" is invalid for param "${param?.name}"`);
                if(!rstep) console.error(`ScriptParam::validateStructure: Value "${param?.step}" is invalid for param "${param?.name}"`);

                return rmin && rmax && rstep;
            case 'boolean':
                return true; // no structure
            case 'text':
                param.length = param.length || this.MAX_TEXT_LENGTH;
                const rl = (isNumeric(param?.length) && param.length > 0) || true;
                if (!rl){ console.error(`ScriptParam::validateStructure: Invalid text length for param "${param?.name}": ${param?.length}`);}
                return rl;
            case 'options':
                return (Array.isArray(param?.options) && param.options.length > 0);
            case 'list':
                return (
                        param?.listElem
                        && typeof param.listElem === 'object'
                        && this.validateStructure(param.listElem));
                    
            case 'object':
                // TODO: test with schema
                return true;
            default:
                console.warn(`ScriptParam::validateStructure: Unsupported param type: ${this.type}`);
                return false;
        }
    }

    /** Validate any value against current Param instance */
    validateValue(v:any):boolean
    {
        switch (this.type)
        {
            case 'number':
                const rn = isNumeric(v);
                const rmin = v >= this.min;
                const rmax = v <= this.max;
                const rstep = this.step ? (v - this.min) % this.step === 0 : true;
                if(!rn) console.error(`ScriptParam::validateValue: Invalid number value: "${v}" for param "${this.name}"`);
                if(!rmin) console.error(`ScriptParam::validateValue: Value "${v}" is below min "${this.min}" for param "${this.name}"`);
                if(!rmax) console.error(`ScriptParam::validateValue: Value "${v}" is above max "${this.max}" for param "${this.name}"`);
                if(!rstep) console.error(`ScriptParam::validateValue: Value "${v}" is not a multiple of step "${this.step}" for param "${this.name}"`);

                return rn && rmin && rmax && rstep;

            case 'boolean':
                return typeof v === 'boolean';
            case 'text':
                return typeof v === 'string' && v.length > 0 && v.length < (this.length || Infinity);
            case 'options':
                return Array.isArray(v) && v.every((opt) => typeof opt === 'string');
            case 'list':
                return Array.isArray(v) && v.every((item) => this.listElem?.validateValue(item));
            case 'object':
                return typeof v === 'object' // && this.schema?.validate(v); // TODO
            default:
                return false;
        }
    }

    //// PARAM ITERATION ////

    /** If it makes sense to iterate over param values 
     *  This means there are a limited set of values
    */
    isIterable(): boolean
    {
        switch(this.type)
        {
            case 'number':
            case 'boolean':
            case 'options':
            // case 'list': // in theory could be iterable - but TODO
            // case 'object': // in theory could be iterable - but TODO
                return true;
            default:
                return false;
        }
    }

    /** Get number of values that a Paramater can take
     *  If a Param is not iterable we directly return 1
    */
    numValues():number
    {
        if(!this.isIterable())
        {
            // object, text
            return 1;
        }
        switch(this.type)
        {
            case 'number':
                return Math.floor((this.max - this.min) / this.step);
            case 'options':
                return this.options?.length ?? 0;
            case 'boolean':
                return 2;
            // don't for now: object, list. See isIterable()
            default:
                return 0;
        }
    }

    /** Iterate over all param values */
    *iterateValues():Generator<any>
    {
        if(!this.isIterable())
        {
            yield this.default;
            return;
        }

        switch(this.type)
        {
            case 'number':
                for(let i = this.min; i <= this.max; i += this.step)
                {
                    yield i;
                }
                break;
            case 'boolean':
                yield true;
                yield false;
                break;
            case 'options':
                for(const opt of this.options)
                {
                    yield opt;
                }
                break;

            default:
                throw new Error(`ScriptParam::iterateValues: Unsupported param type: ${this.type}`);
        }
    }

}

//// DATA INTERFACE ////


/** Data version of ScriptParam instance */
export interface ScriptParamData
{ 
    id?: string
    type: ParamType
    name: string // always a name!
    enabled?:boolean // enabled or not
    visible?:boolean // Param is visible or not
    label: string // publically visible name
    
    _value?: any|Array<any> // One of multiple values (only used privately)
    default?: any // Default value: can be string or number

    min?: number // for ParamInputNumber
    max?: number // for ParamInputNumber
    step?: number // for ParamInputNumber
    listElem?: ScriptParamData, // definition of list content (also a Param)
    schema?: ParamObjectSchema // object definition
    options?: Array<string> // for ParamInputOptions
    length?: number // for ParamInputText, ParamInputList    
    units?:ModelUnits
    
    // For publishing
    order?:number // integer, lower is in front
    iterable?:boolean // for determine param variants
    description?:string // added for the user

    // for ParamManager
    _definedProgrammatically?: boolean // this Param is defined programmatically in script
    // logic attached to param, triggerend anytime any param changes and applies to a specific Param attribute (ParamBehaviourTarget)
    _behaviours?: Record<string,string> // stringified function for save to db etc
}
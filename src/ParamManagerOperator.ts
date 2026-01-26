/** 
 *  ParamManagerOperator
 *  
 *  Used in ParamManager to change target Params, compare and export new Param.
 *  In the ParamManager, at every run a fresh Operator instance is created and potentially modified by the script
 *  Then changed Params are registered by comparing new Param instances after changes in Operator are applied
 * 
 *  
 *  It provides a operator interface in scope of script
 * 
 *      $PARAMS(:ParamManager).SOME_PARAM(:ParamManagerOperator).visibleIf(...)
 *      $PARAMS(:ParamManager).SOME_PARAM(:ParamManagerOperator).enableIf(...)
 *      $PARAMS(:ParamManager).SOME_PARAM(:ParamManagerOperator).enableIf(...)
 *  
 *  it also provides getters and setters of properties of Param
 *      $PARAMS(:ParamManager).SOME_PARAM(:ParamManagerOperator).value
 *      $PARAMS(:ParamManager).SOME_PARAM(:ParamManagerOperator).type
 *      ...etc
 *  
 *  
 *  
 *      
 *  
 * */

import { ParamManager, ParamOperation } from "./internal";
import { ScriptParam } from "./internal"
import type { ScriptParamData } from "./internal";

import deepEqual from 'deep-is'

export class ParamManagerOperator
{   
    //// SETTINGS ////
    PARAM_TYPES = ['number', 'text', 'options', 'boolean', 'list', 'object']
    PARAM_TYPE_DEFAULT_LENGTH = 16;
    
    BASE_TYPE_PARAM_CHECKS = {
        number: '_checkNumParamInput',
        boolean: '_checkBoolParamInput',
        options: '_checkOptionsParamInput',
        list: '_checkListParamInput',
        object: '_checkObjParamInput',
    }

    name:string
    originalParam:ScriptParam
    targetParam:ScriptParam
    value:any // reference to targetParam.value
    manager: ParamManager
    operation:ParamOperation // undefined (none), new, update, delete

    constructor(manager:ParamManager, p?:ScriptParam)
    {
        if(!p){ throw new Error(`ParamManagerEntryController::constructor(): Please supply a Param obj for init`) }
        
        //this.originalParam = this._checkParam(p); 
        this.originalParam = p; // TODO: validation
        this.name = this.originalParam.name;
        this.targetParam = { ...this.originalParam, _behaviours: {}} as ScriptParam; // start with copy, but reset behaviours 
        this.manager = manager;

        this._setParamProps(); // set properties of targetParam on this Controller
    }

    //// GETTERS/SETTERS ////

    setOperation(op:ParamOperation)
    {
        this.operation = op;
    }

    //// OPERATORS ON PARAM ////

    /** Set value of Parameter */
    set(v:any):any
    {
        if(!this._checkParamInput(v))
        {
            throw new Error(`ParamManager: Your are trying to set a value that does not fit a Param of type ${this.targetParam.type}! Check input type or range!`);
        }        
        this.targetParam._value = v; // Set value of Param 

        return v;
    }

    /** Insert a value into List Param */
    push(v:any):any
    {
        if(this.targetParam.type !== 'list'){ throw new Error(`ParamManager: Your are trying to insert a value into Parameter value that is not a list!`);}
        
        if(!this._checkParamInput(v, this.targetParam.listElem))
        {
            throw new Error(`ParamManager: Please supply valid input for list of type "${this.targetParam.listElem.type}"!`);
        }
        if(!this._checkIfListElemExistsLast(v))
        {
            this.targetParam._value = this.targetParam._value.concat(v); // Insert new element into list
        }

        return v;
    }

    /** Directly make Param visible */
    visible()
    {
        this.targetParam.visible = true;
        this.setOperation('updated');
    }

    /** Directly make Param invisible */
    hide()
    {
        this.targetParam.visible = false;
        this.setOperation('updated');
    }

    /** Directly enable Param */
    enable()
    {
        console.info(`ParamManagerOperator::enable(): Enabled param "${this.targetParam.name}"`)
        this.targetParam.enabled = true;
        this.setOperation('updated');
    }

    /** Directly disable Param */
    disable()
    {
        console.info(`ParamManagerOperator::disable(): Disabled "${this.targetParam.name}"`)
        this.targetParam.enabled = false;
        this.setOperation('updated');
    }

    /** Conditional visibility */
    visibleIf(b:boolean)
    {
        if(b) this.visible();
        else this.hide();
    }

    /** Set behaviour that controls enable flag of this Param */
    enableIf(b:boolean)
    {
        if(b) this.enable();
        else this.disable();
    }
    
    /** Set behaviour that controls value attribute of this Param */    
    valueOn(fn:(curParam:ScriptParam, params?:Record<string,ScriptParam>) => boolean)
    {
        // Disabled behaviours
        //this.targetParam._behaviours['value '] = fn;
    }

    //// TODO: delete
    //// TODO: changes of properties specific to types (min,max,step for number etc)

    //// INTERNAL STATE MANAGEMENT ////

    /** Forward properties on this controller to target Param obj */
    _setParamProps()
    {
        /*
        for (const [k,v] of Object.entries(this.targetParam))
        {
            this[k] = this.targetParam[k];
        }
        */
        // only place reference to value
        this.value = this.targetParam._value;
    }

    //// COMPARE WITH ORIGINAL PARAM ////

    /** Had this operator any operations */
    paramOperated():boolean
    {
        return this.operation !== undefined;
    }
    
    /** Compare target Param with original one */
    paramChanged():boolean
    {
        return (this.operation !== 'new')
        ? !deepEqual(this.paramToData(this.originalParam), this.paramToData(this.targetParam))
        : true;
    }

    //// BEHAVIOURS BASED ON PROGRAMMATIC CONTROLS ////
    
    /** Evaluate behaviour and return changed param 
     *  @params a map for easy access: params.TEST.value
    */
   /*
    evaluateBehaviours(params:Record<ParamBehaviourTarget,ScriptParam>):null|Param
    {
        let changedParam = null;
        if(this?.target?._behaviours)
        {
            for (const [propName, fn] of Object.entries(this?.target?._behaviours))
            {
                // IMPORTANT: We used some black magic to convert string to Function, typeof does not work 
                if( (typeof fn === 'function') || (fn as any)?.constructor?.name === 'Function')
                {
                    const newValue = fn(this.targetParam, params);
                    this.targetParam[propName] = newValue; // directly plug in the test result to target param
                    changedParam = this.targetParam;
                    console.info(`ParamEntryController::evaluateBehaviours: Updated Param "${this.targetParam.name}" attribute "${propName}" = "${newValue}"`);
                }
                else {
                    console.error(`ParamEntryController::evaluateBehaviours [${this.getScope()}]: Given behaviour for property "${propName}" is not a function, but a "${typeof fn}"`);
                }
                
            }
        }

        return changedParam;
    }
        */
    
    //// IO ////

    paramToData(param:ScriptParam):ScriptParamData
    {
        const behaviourData = {};
        for(const [k,v] of Object.entries(param?._behaviours || {})){ behaviourData[k] = v.toString(); }

        return {
            ...param,
            _behaviours : behaviourData // Need a string because we can't send functions through
        } as any as ScriptParamData; // TODO: TS fix
    }

    /** Export to raw Param data for output 
     *  NOTE: We use ScriptParam here that is used for IO, but in App it is transformed back to Param
    */
    toData():ScriptParamData
    {
        return this.paramToData(this.targetParam);
    }


    //// UTILS ////

    /** Adding to lists create unending loops 
     *  We check if the last element is the same
     *  TODO: Make a better solution
    */
    _checkIfListElemExistsLast(v:Record<string,any>):boolean
    {
        const exists = deepEqual(this.targetParam._value[this.targetParam._value.length-1], v)
        if (exists)
        {
            console.warn(`ParamManager::_checkIfListElemExistsLast(): We blocked an element that already exists in the list!`)
        }
        return exists;
    }

    /** Check Param input, if param is not set, the target Param is used */
    _checkParamInput(v:any, p?:ScriptParam):boolean
    {
        p = p ?? this.targetParam;
        const checkFnName = this.BASE_TYPE_PARAM_CHECKS[p.type];
        if(!checkFnName)
        {
            console.warn(`ParamManager::_checkParamInput: No check config for Param type ${p.type}. This might mess things up!`)
        }

        return this[checkFnName](v, p); // Bind to this instance of ParamManagerEntryController

    }

    _checkNumParamInput(v:any, p?:ScriptParam):boolean
    {
        p = p ?? this.targetParam;
        
        return (typeof v === 'number' && isFinite(v)) && v >= p.min && v <= p.max;
    }

    _checkBoolParamInput(v:any, p?:ScriptParam):boolean
    {
        p = p ?? this.targetParam;
        return typeof v === 'boolean'
    }

    _checkOptionsParamInput(v:any, p?:ScriptParam):boolean
    {
        p = p ?? this.targetParam;
        return p.options.includes(v);
    }

    _checkListParamInput(v, p?:ScriptParam)
    {
        p = p ?? this.targetParam;
        return this._checkParamInput(v, p.listElem);
    }

    /** Check input against schema */
    _checkObjParamInput(v:any, p?:ScriptParam):boolean
    {
        p = p ?? this.targetParam;

        if(typeof v !== 'object') return false;

        // directly make all input keys uppercase
        v = Object.keys(v).reduce((acc, k) => 
            { 
                acc[k.toUpperCase()] = v[k];
                return acc;
            }, {});

        for (const [attr, elemParam] of Object.entries(p.schema))
        {
            // NOTE: Params attribute names are always caps!
            if (!v[attr])
            { 
                console.error(`ParamManager::_checkObjParamInput(). Given attribute "${attr}" does not exist in schema with attributes: ${Object.keys(p.schema).join('')}`);
                return false 
            };
            if (!this._checkParamInput(v[attr], elemParam))
            {
                console.error(`ParamManager::_checkObjParamInput(). Invalid input "${v}" for Object attribute "${attr}" which needs type "${elemParam.type}"`);
                return false;
            }
        }

        return true
        

        return false;
    }

    
    _getObjValueByPath(path:string, obj:Object):any
    {
        return path.split('.').reduce((acc, c) => acc && acc[c], obj);
    }

    
    _checkParam(p:ScriptParam):ScriptParam
    {
        if ( typeof p !== 'object' || !p?.name || !p?.type)
        {
            throw new Error(`ParamManagerEntryController:_checkParam: Please supply a valid Param config object like with { name, type, ?default }
                    Options per type:        
                    - number: { start, end }
                    - text: { length }
                    - options: { values }
                    - list: { length }
                    - objects: { schema: Record<string,ScriptParam> }`)
        }

        if(p.type === 'number')
        {
            if(typeof p?.min !== 'number' || typeof p?.max !== 'number' )
            {
                throw new Error(`ParamManagerEntryController:_checkParam: Please supply a valid 'number' Param object: { min:number, max:number }`);
            }
            // correct no default
            p.default = p?.default || p.min;
        }
        else if(p.type === 'text')
        {
            if(typeof p?.length !== 'number')
            {
                console.warn(`ParamManagerEntryController:_checkParam: No text length supplied. Default: ${this.PARAM_TYPE_DEFAULT_LENGTH}`);
                p.length = p?.length || this.PARAM_TYPE_DEFAULT_LENGTH;
            }
        }
        else if(p.type === 'options')
        {
            if(!Array.isArray(p?.options))
            {
                throw new Error(`ParamManagerEntryController:_checkParam: Please supply an Array of options to options Param`);
            }
        }
        else if(p.type === 'list')
        {
            if(p?.listElem ?? true)
            {
                //throw new Error(`ParamManagerEntryController:_checkParam: If you want to make a list supply at least the listElem Param definition!`);
            }
        }
        else if(p.type === 'object')
        {
            if(typeof p?.schema !== 'object')
            {
                throw new Error(`ParamManagerEntryController:_checkParam: If you want to object Parameter please supply a schema in format { prop1: { Param }, prop2 : { Param }}`)
            }
        }

        return p;


    }

    getScope():string
    {
        return (this?.manager.inWorker()) ? 'worker' : 'app'
    }
    

}
/**
 *  ParamManager.ts
 * 
 *  Handles parameter values and settings in scope of the app (both editor and configurator) and during script execution.
 *  It can handle advanced scenario's like:
 *     - Define advanced parameters from the script (like objects) where there is no UI menu implemented for the user (yet)
 *     - Different states of Parameter Menu within app. For example: Hide/Show certain parameters based on other parameters or state of script
 *     - Interconnectiveness between parameters. For example: One value of a parameter changes the range of another
 *  
 *  ParamManager can communicatie with app from script to send through operations
 *  ParamManager exists on both the script execution worker and the app
 *  It sends through changed Param to the ParamManager where it has effect
 * 
 *  Architecture:
 *      ParamManager has a set of ParamManagerEntryController instances 
 *      that each control a specific 'target' Param instance. 
 *      
 *      Behaviours managed by the ParamManager are placed on the Param instance Param._behaviours 
 * 
 *      ParamManager maintains a history across multiple runs of the script, so updates happen only once
 *      
 *      
 * 
 */

import { ParamType, Param, PublishParam, isParam, isPublishParam, ParamBehaviourTarget } from './internal'
import { publishParamToParam, paramToPublishParam } from './internal' // utils

import deepEqual from 'deep-is'

/** Main ParamManager
 *  Maintains all ParamManagerEntryControllers 
 */
export class ParamManager
{
    parent: any; // worker or app scope
    paramControllers:Array<ParamManagerEntryController> = [];

    /** Set up ParamManager with current params */
    constructor(params?:Array<PublishParam>)
    {
        if(Array.isArray(params) && params.length > 0)
        {
            this.paramControllers = params.map(p => new ParamManagerEntryController(this, publishParamToParam(p)))
            this.paramControllers.forEach( p => this[p.name] = p) // set param access
        }
    }

    setParent(scope:any):this
    {
        this.parent = scope;
        return this
    }

    addParam(p:Param):this
    {
        const newParamController = new ParamManagerEntryController(this, p);
        this.paramControllers.push( newParamController)
        return this;
    }

    //// BASIC MANAGEMENT ////

    getParamController(name:string):ParamManagerEntryController
    {
        return this.paramControllers.find(pc => pc.name === name)
    }

    //// EVALUATE AFTER CHANGE ////

    /** After Param instances are changed, they is broadcast through the app where it will be synced 
     *  NOTE: We use a Array here, to be able to broadcast multiple params at the same time if needed
    */
    handleManaged(changedParams:Array<Param>)
    {
        if(this.inWorker())
        {
            this.sendChangedParamsFromWorkerToApp(this.parent, changedParams);
        }
        else {
            // Main thread App scope
            // TODO: this might not be needed - App handles differently
            console.log('**** PARAMMANAGER.handleManaged');
            console.log(changedParams)
            console.log(this.parent);
        }
    }

    /** Check and update params from managed params */
    update(params:Array<Param>, evaluateBehaviours:boolean=true):this
    {
        const curParamsMap = this.getParamsMap();
        params.forEach((updateParam) => 
        {
            // It does not exist
            if(!Object.keys(curParamsMap).includes(updateParam.name))
            {
                // Just add
                this.addParam(updateParam)
            }
            else {
                // It does exist but if different then update
                const paramController = this.getParamController(updateParam.name);
                if(!paramController.sameParam(updateParam))
                {
                    console.info(`ParamManager::update [${this.inWorker() ? 'worker' : 'app'}]: Updated param "${updateParam.name}" : ${JSON.stringify(updateParam)}`);
                    paramController.updateTargetParam(updateParam);
                }
                else 
                {
                    console.info(`ParamManager::update [${this.inWorker() ? 'worker' : 'app'}]: Incoming param "${updateParam.name}" is the same. Update skipped! Current: ${JSON.stringify(updateParam)}`);
                }

            }
        })

        if(evaluateBehaviours)
        {
            this.evaluateBehaviours(); // sets attributes based on behaviours
        }

        return this;
    }
    
    /** This triggers after a param change and evaluates any changes 
     *  to other Params corresponding to behaviours
     *  @returns Array of Params that changed
     *  */
    evaluateBehaviours():Array<Param>
    {
        return this.paramControllers.map( pc => pc.evaluateBehaviours(this.getParamsMap()))
                                    .filter(p => p !== null)
    }

    //// IO ////

    sendChangedParamsFromWorkerToApp(worker:any, changedParams:Array<Param>) // TODO: TS typing
    {
        if(!worker?.postMessage){ throw new Error(`ParamManager::sendChangedParamFromWorkerToApp: Can't send message from worker scope: no parent set. Please use setParent(workerScope)`); }

        worker.postMessage(
            {
                type: 'managed-param',
                payload: changedParams.map(p => paramToPublishParam(p)) as Array<PublishParam>,
            }
        )
    }

    /** Utility to easily get target Params */
    getParams():Array<Param>
    {
        return this.paramControllers.map(pc => pc.target)
    }

    /** Utility to easily get target Params in a map */
    getParamsMap():Record<string, Param>
    {
        const map = {};
        this.paramControllers.forEach(pc => { map[pc.name] = pc.target })
        return map;
    }

    //// UTILS ////

    /** If this ParamManager is in a worker scope */
    inWorker():boolean
    {
        return typeof this?.parent?.postMessage === 'function';
    }

    //// UTILS ////

    /** Compare two params (either Param or PublishParam) */
    equalParams(param1:Param|PublishParam, param2:Param|PublishParam):boolean
    {
        const publishParam1 = JSON.parse(JSON.stringify(paramToPublishParam(param1)));
        const publishParam2 = JSON.parse(JSON.stringify(paramToPublishParam(param2)));
        return deepEqual(publishParam1,publishParam2);
    }

}


/** Controller for a specific parameter */
export class ParamManagerEntryController
{   
    //// SETTINGS ////
    PARAM_TYPES = ['number', 'text', 'options', 'boolean', 'list', 'object']
    PARAM_TYPE_DEFAULT_LENGTH = 16;

    name:string
    target:Param
    manager: ParamManager

    constructor(manager:ParamManager, p?:Param)
    {
        if(!p){ throw new Error(`ParamManagerEntryController::constructor(): Please supply a Param obj for init`) }
        p = { ...this._checkParam(p) }; // copy
        this.name = p.name;
        this.target = p;
        this._setParamPropsOnController();
        this.manager = manager;
    }

    updateTargetParam(param:Param)
    {
        this.target = { ...param }
        return this.target;
    }

    /** Check if incoming PublishParam is same as target Param */
    sameParam(param:Param):boolean
    {
        // IMPORTANT: make sure we loose any observability from vue 
        param = JSON.parse(JSON.stringify(paramToPublishParam(param))); 
        return deepEqual(this.toData(), param );
    }

    //// HANDLING CHANGES ////

    /** Handle this Param being changed
     *  NOTE: here we turn Param instances (with _behaviour functions to data with ParamEntryController.toData())
     */
    handleManaged()
    {
        if(!this?.manager){ throw new Error(`ParamManagerEntryController::handleManaged: No parent ParamManager set. Set it in new ParamManagerEntryController(<<ParamManager>>, param)`)}
        this.manager.handleManaged([this.toData() as PublishParam]);
    }

    //// ADVANCED PARAM CREATION ////

    define(p:Param)
    {

    }

    //// BEHAVIOURS BASED ON PROGRAMMATIC CONTROLS ////

    /** Evaluate behaviour and return changed param 
     *  @params a map for easy access: params.TEST.value
    */
    evaluateBehaviours(params:Record<ParamBehaviourTarget,Param>):null|Param
    {
        let changedParam = null;
        if(this?.target?._behaviours)
        {
            for (const [propName, fn] of Object.entries(this?.target?._behaviours))
            {
                // IMPORTANT: We used some black magic to convert string to Function, typeof does not work 
                if( (typeof fn === 'function') || (fn as any)?.constructor?.name === 'Function')
                {
                    const newValue = fn(this.target, params);
                    this.target[propName] = newValue; // directly plug in the test result to target param
                    changedParam = this.target;
                    console.info(`ParamEntryController::evaluateBehaviours: Updated Param attribute "${propName}" = "${newValue}"`);
                }
                else {
                    // TODO: fix bug here: why does this happen?
                    // LOOKS LIKE AFTER A UPDATE OF PARAMS IN WORKER  
                    // visible : {} 
                    console.error(`ParamEntryController::evaluateBehaviours [${this.getScope()}]: Given behaviour for property "${propName}" is not a function, but a "${typeof fn}"`);
                    console.error(fn);
                    console.error(this?.target?._behaviours);
                }
                
            }
        }

        return changedParam;
    }

    //// PROGRAMMATIC PARAM CONTROL ////

    /* Programmatic real time control over param entries 
        inside the Param Menu of the app (editor or configurator).
        It facilitates more advanced states of the menu for a nicer user experience
    */

    /** Set visibility to true 
     *  
     *  @example 
     *      $PARAMS.SOMEPARAM.visible((param, all) => all.OTHERPARAM.value === true )
    */
    visible(test:(curParam:Param, params?:Record<string, Param>) => any )
    {
        if(this._needsUpdate('visible', test))
        {
            this.target._behaviours = this.target._behaviours ?? {};
            this.target._behaviours['visible'] = test;
            this.handleManaged(); // trigger update
        }
    }
    
    /** Set value of Param */
    /*
    value(func:(curParam:Param, params?:Array<Param>) => any)
    {
        this.target._behaviours = this.target._behaviours ?? [];
        this.target._behaviours.push((curParam:Param, params?:Array<Param>) => {
            const r = func(curParam,params); 
            if(typeof r === 'boolean'){
                this.target.value ;
            }
        })
        this.handleManaged();
    }
    */

    /** Set start of range on number Param */
    /*
    start(func:(curParam:Param, params?:Array<Param>) => any)
    {
        // TODO: test if number param
        this.target._behaviours = this.target._behaviours ?? [];
        this.target._behaviours.push((curParam:Param, params?:Array<Param>) => {
            const r = func(curParam,params); 
            if(typeof r === 'number')
            {
                this.target.start = r;
                return this.target;
            }
            return null;
        })
        this.handleManaged();
    }
    */

    /** Set end range on number Param */
    /*
    end(func:(curParam:Param, params?:Array<Param>) => any)
    {
        // TODO: test if number param
        this.target._behaviours = this.target._behaviours ?? [];
        this.target._behaviours.push((curParam:Param, params?:Array<Param>) => {
            const r = func(curParam,params); 
            if(typeof r === 'number')
            {
                this.target.end = r;
                return this.target;
            }
            return null;
        })
        this.handleManaged();
    }
    */

    /** Set values for options Param */
    options(v:Array<string>)
    {
        // TODO
    }

    //// IO ////

    /** Export to raw Param data for output 
     *  NOTE: We use PublishParam here that is used for IO, but in App it is transformed back to Param
    */
    toData():PublishParam
    {
        const behaviourData = {};
        for(const [k,v] of Object.entries(this.target?._behaviours || {})){ behaviourData[k] = v.toString(); }

        return {
            ...this.target,
            _behaviours : behaviourData // Need a string because we can't send functions through
        }
    }

    //// UTILS ////

    /** Test if a change to a ParamEntryController is new and it needs to be updated */
    _needsUpdate(attr:string, value:any): boolean
    {   
        const oldValue = this.target[attr];
        const flatOldValue = (typeof oldValue === 'function') ? oldValue.toString() : oldValue; 
        const flatNewValue = (typeof value === 'function') ? value.toString() : value;
        
        return !deepEqual(flatOldValue,flatNewValue);
    }

    /** Forward properties on this controller to target Param obj */
    _setParamPropsOnController()
    {
        for (const [k,v] of Object.entries(this.target))
        {
            this[k] = this.target[k];
        }
    }
    
    _checkParam(p:Param):Param
    {
        if ( typeof p !== 'object' || !p?.name || !p?.type)
        {
            throw new Error(`ParamManagerEntryController:_checkParam: Please supply a valid Param config object like with { name, type, ?default }
                    Options per type:        
                    - number: { start, end }
                    - text: { length }
                    - options: { values }
                    - list: { length }
                    - objects: { schema: Record<string,Param> }`)
        }

        if(p.type === 'number')
        {
            if(typeof p?.start !== 'number' || typeof p?.end !== 'number' )
            {
                throw new Error(`ParamManagerEntryController:_checkParam: Please supply a valid 'number' Param object: { start:number, end:number }`);
            }
            // correct no default
            p.default = p?.default || p.start;
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
            if(!this.PARAM_TYPES.includes(p?.elemType))
            {
                throw new Error(`ParamManagerEntryController:_checkParam: If you want to make a list supply at least the elemType (${this.PARAM_TYPES.join(',')}) or object (with the schema)`);
            }
            else 
            {
                if(p.elemType === 'object' && (p?.schema ?? true) )
                {
                    throw new Error(`ParamManagerEntryController:_checkParam: If you want to make a list with a nested object supply a schema!`)
                }
            }
        }
        else if(p.type === 'object')
        {
            if(typeof p?.schema !== 'object')
            {
                throw new Error(`ParamManagerEntryController:_checkParam: If you want to object Parameter please supply a schema in format { prop1: { Param }, prop2 : { Param }}`)
            }
            else {
                if(p?.elemType === 'object' && (p?.schema ?? true))
                {
                    throw new Error(`ParamManagerEntryController:_checkParam: If you want to object Parameter please supply a schema in format { prop1: { Param }, prop2 : { Param }}`)
                }
            }
        }

        return p;


    }

    getScope():string
    {
        return (this?.manager.inWorker()) ? 'worker' : 'app'
    }
    

}
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
 */

import { ParamType, Param, PublishParam } from './internal'

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

    //// HANDLING CHANGES ////

    handleManaged()
    {
        if(!this?.manager){ throw new Error(`ParamManagerEntryController::handleManaged: No parent ParamManager set. Set it in new ParamManagerEntryController(<<ParamManager>>, param)`)}
        this.manager.handleManaged(this.toData() as PublishParam);
    }

    //// ADVANCED PARAM CREATION ////

    define(p:Param)
    {

    }

    //// TEST BEHAVIOUR BASED ON PROGRAMMATIC CONTROLS ////

    /** Evaluate behaviour and return changed param 
     *  @params a map for easy access: params.TEST.value
    */
    evaluateBehaviours(params:Record<string,Param>):null|Param
    {
        let changedParam = null;
        if(this?.target?._behaviours)
        {
            for (const [propName, fn] of Object.entries(this?.target?._behaviours))
            {
                // TODO: some validation
                this.target[propName] = fn(this.target, params); // directly plug in the test result to target param
                changedParam = this.target;
            }
        }

        return changedParam;
    }

    //// PROGRAMMATIC PARAM CONTROL ////

    /* Programmatic real time control over param entries 
        inside the Param Menu of the app (editor or configurator).
        It facilitates more advanced states of the menu for a nicer user experience
    */

    /** Set visibility to true */
    show(test:(curParam:Param, params?:Record<string, Param>) => any )
    {
        this.target._behaviours = this.target._behaviours ?? {};
        this.target._behaviours['visible'] = test;
        this.handleManaged();
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
        for(const [k,v] of Object.entries(this.target._behaviours)){ behaviourData[k] = v.toString(); }

        return {
            ...this.target,
            _behaviours : behaviourData // Need a string because we can't send functions through
        }
    }

    //// UTILS ////

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
    

}

/** Main ParamManager
 *  Maintains all ParamManagerEntryControllers 
 */
export class ParamManager
{
    parent: any; // worker or app scope
    paramControllers:Array<ParamManagerEntryController> = [];

    /** Set up ParamManager with current params */
    constructor(params?:Array<Param>)
    {
        if(Array.isArray(params) && params.length > 0)
        {
            this.paramControllers = params.map(p => new ParamManagerEntryController(this, p))
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

    handleManaged(changedParam:PublishParam)
    {

        if(this.inWorker())
        {
            this.sendChangedParamFromWorkerToApp(this.parent, changedParam);
        }
        else {
            // Main thread App scope
            console.log('**** PARAMMANAGER.handleManaged');
            console.log(this.parent);
        }
    }

    /** Check and update params from managed params */
    update(managedParams:Array<PublishParam>):this
    {
        const inParams = managedParams.map(mp => this.publishParamToParam(mp))

        // TODO: use these?
        const updatedParams = [];
        const newParams = [];

        inParams.forEach(p => 
        {
            const updatedParam = this.getParamController(p.name)?.updateTargetParam(p);
            // Updated existing param
            if(updatedParam)
            { 
                updatedParams.push(updatedParam);
                console.info(`ParamManager:update: Updated param "${p.name}"`);
                console.info(updatedParam)
            }
            else {
                // New param
                this.addParam(p);
                newParams.push(p);
                console.info(`ParamManager:update: Added new param ${p.name}: ${JSON.stringify(updatedParam)}`);
            }
        })

        return this;
    }
    
    /** This triggers after a param change and evaluates any changes 
     *  to other Params corresponding to behaviours
     *  @returns Array of Params that changed
     *  */
    evaluateBehaviours():Array<Param>
    {
        console.log(this.getParams());
        return this.paramControllers.map( pc => pc.evaluateBehaviours(this.getParamsMap()))
            .filter(p => p !== null)
    }

    //// IO ////

    sendChangedParamFromWorkerToApp(worker:any, changedParam:PublishParam) // TODO: TS typing
    {
        if(!worker?.postMessage){ throw new Error(`ParamManager::sendChangedParamFromWorkerToApp: Can't send message from worker scope: no parent set. Please use setParent(workerScope)`); }

        worker.postMessage(
            {
                type: 'managed-param',
                payload: changedParam as PublishParam,
            }
        )
    }

    getParams():Array<Param>
    {
        return this.paramControllers.map(pc => pc.target)
    }

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

    publishParamToParam(publishParam:PublishParam):Param
    {
        const funcBehaviours = {};
        if(publishParam?._behaviours)
        {
            for( const [propName, funcStr] of Object.entries(publishParam?._behaviours))
            {
                funcBehaviours[propName] = new Function('return ' + funcStr)()
            }
        }

        const param = { 
            ...publishParam, 
            _behaviours : funcBehaviours, 
        } as Param

        console.log('**** publishParamToParam ');
        console.log(publishParam?._behaviours)

        return param;
    }


}
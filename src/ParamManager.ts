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

import { Param, PublishParam, ParamOperation, isParam, isPublishParam, ParamBehaviourTarget } from './internal'
import { publishParamToParam, paramToPublishParam } from './internal' // utils

import deepEqual from 'deep-is'
import deepClone from 'deep-clone'

/** Main ParamManager
 *  Maintains all ParamManagerEntryControllers 
 */
export class ParamManager
{
    //// SETTINGS ////
    PARAM_SIGNIFIER = '$';

    //// END SETTINGS ////

    parent: any; // worker or app scope
    paramControllers:Array<ParamManagerEntryController> = [];

    /** Set up ParamManager with current params */
    constructor(params?:Array<PublishParam|Param>)
    {
        if(Array.isArray(params) && params.length > 0)
        {
            this.paramControllers = params.map(p => new ParamManagerEntryController(this, publishParamToParam(p))); // always make sure we use Param internally
            this.paramControllers.forEach( p => this[p.name] = p) // set param access
        }
    }

    setParent(scope:any):this
    {
        this.parent = scope;
        return this
    }

    /** add or update Param and return what was done ('update', 'same', 'new)  */
    addParam(p:Param):ParamOperation
    {
        if(this._paramNameExists(p))
        { 
            const updated = this.updateParam(p);
            return (updated) ? 'updated' : 'same';
        }
        else {
            const newParamController = new ParamManagerEntryController(this, this._validateParam(p));
            this.paramControllers.push(newParamController)
            return 'new'
        }

    }

    deleteParam(name:string):this
    {
        this.paramControllers = this.paramControllers.filter( pc => pc.name !== name);
        
        return this;
    }

    _paramNameExists(p:Param):boolean
    {
        return Object.keys(this.getParamsMap()).includes(p.name.toUpperCase()) 
    }

    /** Update ParamEntryController if needed and return updated or not */
    updateParam(p:Param):boolean
    {
        if(this._paramNameExists(p))
        {
            const existingParamController = this.paramControllers.find(pc => pc.name === p.name );

            if(!this.equalParams(p,existingParamController.target))
            {
                p.name = p.name.toUpperCase(); // names are always uppercase
                const index = this.paramControllers.indexOf(existingParamController);
                this.paramControllers[index] =  new ParamManagerEntryController(this, p);
                return true;
            }
            else {
                console.info(`ParamManager::updateParam: No update needed. Same params!"`);
                return false;
            }
        }
        else {
            console.warn(`ParamManager::updateParam: Can't update: No param with name ${p.name}"`);
            return false;
        }
    }

    //// PROGRAMMATIC PARAM CREATION ////
    
    /** Programmatically define a param: from simple to advanced 
     *  This can be used to define complex Parameters that can't be defined by the menu
     * 
     *  @example myParamManager.define({ name: 'testnum', type: 'number'})
     *  @example myParamManager.define({ name: 'mylist', type: 'list', listElem: 
     *      { 
     *      type: 'object', 
     *      schema: { w: { type: 'number', default: 100 },
     *                h: { type: 'number', default: 200, start: 50, end: 300 } 
     *   }})
    */
    define(p:Param)
    {
        if(!p){ throw new Error(`ParamManager::define(p:Param): Please supply valid Param object! Got ${JSON.stringify(p)}`); }
        if(!p?.name){ throw new Error(`ParamManager::define(): Please supply at least a name for this Param!`); }

        const checkedParam = this._validateParam(p);
        if(!checkedParam){ return this }; //  Error already thrown in checkParam if any

        // Add Param to Manager by making ParamController
        const r = this.addParam(checkedParam);

        // Only send managed Param to App if anything changed
        if (['new','update'].includes(r))
        {
            this.handleManaged([checkedParam]); // Send new definition to App
        }


        return this;

    }

    /** Check Param input and fill in defaults
     *  We try to make anything work here, except if nothing is given
     *  See also checkParam in ParamEntryController
     */
    _validateParam(p:Param):Param
    {
        if(!p)
        {
            console.error(`ParamManager::_validateParam(p:Param): Please supply valid Param object! Got null/undefined!`);
            return null;
        }

        const paramType = p?.type || 'number'; // Default Param type is number
        let checkedParam;

        switch(paramType)
        {
            case 'number':
                checkedParam = {
                    ...p, // copy all for convenience 
                    type: paramType,
                    start: p?.start ?? 0,
                    end: p?.end ?? 100,
                    step: p?.step ?? 1,
                } as Param;
                // if default not given choose start
                checkedParam['default'] = p?.default ?? p.start;
                break;
            case 'boolean': 
                checkedParam = {
                    ...p, // copy all for convenience 
                    type: paramType,
                } as Param;
                break;
            case 'text':
                checkedParam = {
                    ...p,
                    type: paramType,
                    length: p.length ?? 100,
                } as Param;
                break;
            case 'options':
                checkedParam = {
                    ...p,
                    type: paramType,
                    options: p.options ?? [],
                } as Param;
                break;
            case 'list': 
                // NOTE: listElem is also a Param, which we need to check!
                checkedParam = {
                    ...p,
                    type: paramType,
                    listElem: this._validateParam(p.listElem) ?? this._validateParam({ type: 'number' } as Param), // a Number is the default for a List
                } as Param;
                break;
            case 'object':
                // Object schema is also a set of Params
                const s = p.schema ?? {};
                const schema = {};
                
                for (const [name, param] of Object.entries(s))
                {
                    schema[name.toUpperCase()] = this._validateParam(param); // param names are always uppercase!
                }

                checkedParam = {
                    ...p,
                    type: paramType,
                    schema: schema,
                } as Param;
                break;
        }

        // basic checks and defaults
        checkedParam.name = checkedParam?.name?.toUpperCase() ?? null; // make sure names are always uppercase
        
        return checkedParam;
    }

    //// BASIC MANAGEMENT ////

    getParamController(name:string):ParamManagerEntryController
    {
        return this.paramControllers.find(pc => pc.name === name)
    }

    //// EVALUATE AFTER CHANGE ////

    /** After Param instances are changed, they are broadcast through the app where it will be synced 
     *  NOTE: We use a Array here, to be able to broadcast multiple params at the same time if needed
    */
    handleManaged(changedParams:Array<Param>)
    {
        if(this.inWorker())
        {
            this.sendChangedParamsFromWorkerToApp(changedParams);
        }
        else {
            // Main thread App scope: handled differently
        }
    }

    /** Check and update params */
    update(params:Array<Param|PublishParam>, evaluateBehaviours:boolean=true):this
    {
        // Make sure we have Params
        params = params.map(p => publishParamToParam(p)) as Array<Param>

        const curParamsMap = this.getParamsMap();
        let paramsWereChanged = false;

        // Check from incoming Params
        params.forEach((updateParam) => 
        {
            // It does not exist
            if(!Object.keys(curParamsMap).includes(updateParam.name))
            {
                // Just add
                this.addParam(updateParam);
                paramsWereChanged = true;
            }
            else {
                // It does exist but if different then update
                const paramController = this.getParamController(updateParam.name);
                if(!paramController.sameParam(updateParam))
                {
                    //console.info(`ParamManager::update [${this.inWorker() ? 'worker' : 'app'}]: Updated param "${updateParam.name}" : ${JSON.stringify(updateParam)}`);
                    paramController.updateTargetParam(updateParam);
                    paramsWereChanged = true;
                }
                else 
                {
                    //console.info(`ParamManager::update [${this.inWorker() ? 'worker' : 'app'}]: Incoming param "${updateParam.name}" is the same. Update skipped! Current: ${JSON.stringify(updateParam)}`);
                }
            }
        })

        // Only evaluate behaviours if any param changed
        if(paramsWereChanged && evaluateBehaviours)
        {
            this.evaluateBehaviours(); // sets attributes based on behaviours
        }

        this.setParamControlRefs();

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

    sendChangedParamsFromWorkerToApp(changedParams:Array<Param>) // TODO: TS typing
    {
        const worker = this.parent;
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

    /** Set Param read and write as globals on worker scope (in this.parent) 
     *  NOTE: We can not really work with Proxies here because we can not really set a Param global (ie. $TEST)
     *      on this scope that is not a Proxy. Proxies can only target Objects
            Use $PARAMS.$TEST.set() to set a value
    */
    setParamGlobalsOnWorker():boolean
    {
        const curParams = this.getParams();

        if (!Array.isArray(curParams)){ return false; }

        // Make Params with getter and setter with Proxy
        curParams.forEach( p => {
            this.parent[this.PARAM_SIGNIFIER + p.name] = p.value ?? p.default;
        })
    }

    /** Compare two params (either Param or PublishParam) */
    equalParams(param1:Param|PublishParam, param2:Param|PublishParam):boolean
    {
        const publishParam1 = JSON.parse(JSON.stringify(paramToPublishParam(param1)));
        const publishParam2 = JSON.parse(JSON.stringify(paramToPublishParam(param2)));
        return deepEqual(publishParam1,publishParam2);
    }

    /** Set quick references from this instance to the values of params 
        This is used to control Params directly (through ParamManagerEntryController)
        The user can write values for example with $PARAMS.$TEST.set(50)
    */
    setParamControlRefs()
    {
        this.paramControllers.forEach( pc =>
        {
            this[pc.name] = pc;
        })
    }

    /*
    deleteParamValueRef(name:string)
    {
        if (typeof name === 'string')
        {
            delete this[name];
        }
    }
    */
}


/** Controller for a specific parameter */
export class ParamManagerEntryController
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
                    console.info(`ParamEntryController::evaluateBehaviours: Updated Param "${this.target.name}" attribute "${propName}" = "${newValue}"`);
                }
                else {
                    console.error(`ParamEntryController::evaluateBehaviours [${this.getScope()}]: Given behaviour for property "${propName}" is not a function, but a "${typeof fn}"`);
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

    /** Add behaviour that controls visible attribute of this Param
    *      @example $PARAMS.SOMEPARAM.visibleIf((param, all) => all.OTHERPARAM.value === true )
    */
    visibleIf(test:(curParam:Param, params?:Record<string, Param>) => boolean )
    {
        if(this._needsUpdate('_behaviours.visible', test))
        {
            this.target._behaviours = this.target._behaviours ?? {};
            this.target._behaviours['visible'] = test;
            this.handleManaged(); // trigger update
        }
    }

    /** Set behaviour that controls enable flag of this Param */
    enableIf(test:(curParam:Param, params?:Record<string, Param>) => boolean )
    {
        if(this._needsUpdate('_behaviours.enable', test))
        {
            this.target._behaviours = this.target._behaviours ?? {};
            this.target._behaviours['enable'] = test;
            this.handleManaged(); // trigger update
        }
    }
    
    /** Set behaviour that controls value attribute of this Param */
    // TODO: TEST
    valueOn(fn:(curParam:Param, params?:Record<string, Param>) => boolean)
    {
        if(this._needsUpdate('value', fn))
        {
            this.target._behaviours = this.target._behaviours ?? {};
            this.target._behaviours['value '] = fn;
            this.handleManaged(); // trigger update
        }
    }

    /** Set value of Parameter */
    set(v:any):any
    {
        if(!this._checkParamInput(v))
        {
            throw new Error(`ParamManager: Your are trying to set a value that does not fit a Param of type ${this.target.type}! Check input type or range!`);
        }
        
        this.target.value = v; // Set value of Param 
        this.manager.setParamGlobalsOnWorker(); // set globals to new value
        this.manager.sendChangedParamsFromWorkerToApp([this.target]); // Communicate value change to parent!

        this.target.value = v; // Set value of Param 
        this._afterSetParamValue();
        return v;
    }

    /** Insert a value into List */
    push(v:any):any
    {
        if(this.target.type !== 'list'){ throw new Error(`ParamManager: Your are trying to insert a value into Parameter value that is not a list!`);}
        
        if(!this._checkParamInput(v, this.target.listElem))
        {
            throw new Error(`ParamManager: Please supply valid input for list of type "${this.target.listElem.type}"!`);
        }
        if(!this._checkIfListElemExistsLast(v))
        {
            this.target.value = this.target.value.concat(v); // Insert new element into list
            this._afterSetParamValue();
        }

        return v;
    }

    /** Adding to lists create unending loops 
     *  We check if the last element is the same
     *  TODO: Make a better solution
    */
    _checkIfListElemExistsLast(v:Record<string,any>):boolean
    {
        const exists = deepEqual(this.target.value[this.target.value.length-1], v)
        if (exists)
        {
            console.warn(`ParamManager::_checkIfListElemExistsLast(): We blocked an element that already exists in the list!`)
        }
        return exists;
    }

    /** Set Value without checking */
    _afterSetParamValue()
    {
        this.manager.setParamGlobalsOnWorker(); // set globals to new value
        this.manager.sendChangedParamsFromWorkerToApp([this.target]); // Communicate value change to parent!    
    }

    /** Check Param input, if param is not set, the target Param is used */
    _checkParamInput(v:any, p?:Param):boolean
    {
        p = p ?? this.target;
        const checkFnName = this.BASE_TYPE_PARAM_CHECKS[p.type];
        if(!checkFnName)
        {
            console.warn(`ParamManager::_checkParamInput: No check config for Param type ${p.type}. This might mess things up!`)
        }

        return this[checkFnName](v, p); // Bind to this instance of ParamManagerEntryController

    }

    _checkNumParamInput(v:any, p?:Param):boolean
    {
        p = p ?? this.target;
        
        return (typeof v === 'number' && isFinite(v)) && v >= p.start && v <= p.end;
    }

    _checkBoolParamInput(v:any, p?:Param):boolean
    {
        p = p ?? this.target;
        return typeof v === 'boolean'
    }

    _checkOptionsParamInput(v:any, p?:Param):boolean
    {
        p = p ?? this.target;
        return p.options.includes(v);
    }

    _checkListParamInput(v, p?:Param)
    {
        p = p ?? this.target;
        return this._checkParamInput(v, p.listElem);
    }

    /** Check input against schema */
    _checkObjParamInput(v:any, p?:Param):boolean
    {
        p = p ?? this.target;

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
    
    /** TODO: more behaviours 
     *   - values
     *   - start
     *   - end
     *   - options   
    */

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

    /** Test if a attribute value (or behaviour) of target Param is different than given value
     *  NOTE: attr can be a path
     *  @example: _needsUpdate('_behaviours.visible', testfunc)
    */
    _needsUpdate(attr:string, value:any): boolean
    {   
        // compare behaviour definition in Param._behaviours
        if (attr.includes('_behaviours'))
        {
            const oldValue = this._getObjValueByPath(attr, this.target);
            const flatOldValue = (typeof oldValue === 'function') ? oldValue.toString() : oldValue; 
            const flatNewValue = (typeof value === 'function') ? value.toString() : value;
            
            return !deepEqual(flatOldValue,flatNewValue);

        }
        // Or static attribute value (TODO: TEST)
        else {
            const oldValue = this._getObjValueByPath(attr, this.target);
            // execute if function and compare to current value of Param attribute
            const newValue = (typeof value === 'function') ? value(this.target as Param, this.manager.getParams()) : value;
            return !deepEqual(oldValue,newValue);
        }
    }

    _getObjValueByPath(path:string, obj:Object):any
    {
        return path.split('.').reduce((acc, c) => acc && acc[c], obj);
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
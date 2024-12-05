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
    
    curRunManagedParams:Record<string,Array<Param>> = {}; // all programmatic operations that take place this run on Params

    /** Set up ParamManager with current params */
    constructor(params?:Array<PublishParam|Param>)
    {
        if(Array.isArray(params) && params.length > 0)
        {
            this.paramControllers = params.map(p => new ParamManagerEntryController(this, publishParamToParam(p))); // always make sure we use Param internally
            this.paramControllers.forEach( p => this[p.name] = p) // set param access
        }

        this.startRun();
    }

    /** Every script run we keep track of what Params we started with, 
     *  those that are defined in script and others that are removed from it */
    startRun()
    {
        this.curRunManagedParams = {  'new' : [], 'updated' : [], 'same' : [], 'deleted' : [] } 
    }

    /** After a run we need to check if defined Params are still present in the script
     *  otherwise remove them internally and in parent
     */
    endRunCleanup()
    {
        if(!this.curRunManagedParams)
        {
            console.warn(`ParamManager::endRunCleanup(): run was not initiated with startRun()!`)
        }
        else {
            const curDefinedParamNames = this.getParams().filter(p => p._definedProgrammatically).map(p => p.name);
            const curRunDefinedParamNames = this.curRunManagedParams['new'].filter(p => p._definedProgrammatically).map( p => p.name );
            const danglingParamNames = curDefinedParamNames.filter( pn => !curRunDefinedParamNames.includes(pn)); // the programmatically-defined Params that are still here, but are not in the script anymore 

            if (danglingParamNames.length > 0)
            {
                console.info(`Remove dangling programmatically defined Params: ${danglingParamNames.join(',')}`);
            
                const danglingParams = danglingParamNames.map(paramName => this.getParamsMap()[paramName] || null ).filter(p => p !== null);    
                danglingParams.forEach(p => p._manageOperation = 'deleted'); // set operation to delete so the parent knows what to do
                this.handleManaged(danglingParams); // set to parent
    
                danglingParamNames.forEach( paramName => this.deleteParam(paramName)); // delete internally
            }
        }
    }

    setParent(scope:any):this
    {
        this.parent = scope;
        return this
    }

    /** Keep track of managed Params per run
     *  results are in curRunManagedParams
     *  @example curRunManagedParams['new'] = [Param, Param]
      */
    trackManagedParam(p:Param, operation:ParamOperation)
    {
        this.curRunManagedParams[operation].push(p)
        p._manageOperation = operation; // keep track of operation in Param instance
    }

    /** add or update Param and return what was done ('update', 'same', 'new)  */
    addParam(p:Param):ParamOperation
    {
        if(this._paramNameExists(p))
        { 
            const updated = this.updateParam(p);
            const operation = (updated) ? 'updated' : 'same';
            this.trackManagedParam(p, operation); // keep track of managed params
            return operation
        }
        else {
            const newParamController = new ParamManagerEntryController(this, this._validateParam(p));
            this.paramControllers.push(newParamController)
            this.trackManagedParam(p, 'new');
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

        checkedParam._definedProgrammatically = true; // flag this Param as programmaticallly defined
        this.trackManagedParam(checkedParam, 'new')

        // Add Param to Manager by making ParamController
        const r = this.addParam(checkedParam); // returns 'same' if we already have the Param definition

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

        // Make sure we have Params instances
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
                const curParamController = this.getParamController(updateParam.name);
                if(!curParamController.sameParam(updateParam))
                {
                    //console.info(`ParamManager::update [${this.inWorker() ? 'worker' : 'app'}]: Updated param "${updateParam.name}" : ${JSON.stringify(updateParam)}`);
                    curParamController.updateTargetParam(updateParam);
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

        // If we got internal Params that are not in the updateParams, remove these
        this.getParams()
            .forEach(p => {
                if(!params.find(np => np.name === p.name))
                {
                    console.info(`ParamManager::update(): [${this.inWorker() ? 'worker' : 'app'}] Deleted internal Param "${p.name}" because it was deleted by the user`);
                    this.deleteParam(p.name);
                }
            })
            
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

        const paramsByOperation = {} as Record<ParamOperation,Array<Param>>; // { new : [Param, Param], 'updated' : [], 'deleted': [Param] } etc
        changedParams.forEach(p => 
            {
                if (p._manageOperation) // just to make sure that this param is managed here
                {
                    if(!Array.isArray(paramsByOperation[p._manageOperation])) paramsByOperation[p._manageOperation] = [];
                    paramsByOperation[p._manageOperation].push(paramToPublishParam(p))
                } 
            });

        worker.postMessage(
            {
                type: 'managed-param',
                payload: paramsByOperation
            }
        )
    }

    /** Utility to easily get target Params */
    getParams():Array<Param>
    {
        return this.paramControllers.map(pc => pc.target)
    }

    /** Utility to easily get target Params by name */
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


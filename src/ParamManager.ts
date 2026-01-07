/**
 *  
 *  !!!! CHECKS AND REFACTOR NEEDED !!!!
 *  
 *  ParamManager.ts
 * 
 *  Manages Parameters from script scope
 * 
 *  It can handle advanced scenario's like:
 * 
 *     - Define advanced parameters from the script (like objects) where there is no UI menu implemented for the user (yet)
 *     - Different states of Parameter Menu within app. For example: Hide/Show certain parameters based on other parameters or state of script
 *     - Set parameter values: Interconnectiveness between parameters. For example: One value of a parameter changes the range of another
 *  
 *  Architecture:
 *      - [App scope] Script has params that go to ParamMenu
 *      - [Worker scope] ParamManager instance is created every run, new ParamManagerOperators are created based on current Params
 *      - [Worker scope] During script execution ParamManager is used to define or edit params
 *      - [Worker scope] At end of script execution, params that are managed are added to RunnerScriptExecutionResult at managedParams and send to app. 
 *                       The managedParams are stateless, so every run, with same param values they emit the same managedParams
 *      - [App scope: editor or configurator] managedParams are put in store and picked up by ParamMenu to change menu params. 
 *                      It is the responsibility of receiver to compare existing params with incoming ManagedParams. 
 *                      There is a helper method on ParamManager.updateParamsWithManaged()
 * 
 * 
 *  TODO: Refactor and test with new ScriptParam
 * 
 * 
 */

import { ScriptParam, ScriptParamData, ParamOperation, ParamManagerOperator } from './internal'

import deepEqual from 'deep-is'

/** Main ParamManager
 *  Maintains all ParamManagerOperators 
 */
export class ParamManager
{
    //// SETTINGS ////
    PARAM_SIGNIFIER = '$';

    //// END SETTINGS ////
    parent: any; // worker or app scope
    paramOperators:Array<ParamManagerOperator> = [];

    /** Set up ParamManager with current params */
    constructor(params?:Array<ScriptParam>)
    {
        if(Array.isArray(params) && params.length > 0)
        {
            //this.paramOperators = params.map(p => new ParamManagerOperator(this, this._validateParam(ScriptParamToParam(p)))); // always make sure we use Param internally
            // Disable validation because its old
            this.paramOperators = params.map(p => new ParamManagerOperator(this, p)); // always make sure we use Param internally
            this.paramOperators.forEach( p => this[p.name] = p) // set param access
        }
    }

    setParent(scope:any):this
    {
        this.parent = scope;
        this.setParamGlobalsInScope();
        return this
    }

    //// CLASS METHOD ////

    /** Compare managedParams with original ones of ParamManager and update params array in place
     *  If needed forcing reactivity by creating copies
     *  returns new or changed params 
     */
    static updateParamsWithManaged(currentParams:Array<ScriptParam>, managedParams:Record<ParamOperation, Array<ScriptParam>> = { new: [], updated: [], deleted: []}, forceReactivity:boolean=true):Array<ScriptParam>
    {
        const allManagedParams = [...managedParams.new, ...managedParams.updated];
        const paramsToChange:Array<ScriptParam> = []

        allManagedParams.forEach( managedParam => 
        {
            const presentParam = currentParams.find( p => p.name === managedParam.name);
            if(!presentParam)
            {
                // new param
                paramsToChange.push(managedParam);
            }
            else {
                // existing param: check if changed
                if(!deepEqual(presentParam, managedParam))
                { 
                    paramsToChange.push(managedParam)
                }
            }
        })
        // Now update the original currentParams
        paramsToChange.forEach((pc) => {
            const i = currentParams.findIndex((p) => p.name === pc.name)
            if(i >= 0)
            {
                // update existing in place
                currentParams[i] = pc;
            }
            else {
                // new
                currentParams.push(pc);
            }
        })

        if(forceReactivity) currentParams = [...currentParams];
        return paramsToChange
    }

    //// MANAGING PARAMS ////

    /** Add or update Param and return what was done (update, new, null)  */
    addParam(p:ScriptParam):ParamOperation|null
    {
        if(this._paramNameExists(p))
        { 
            // update existing
            const updated = this.updateParam(p);
            const operation = (updated) ? 'updated' : null;
            if(operation)
            {
                this.getParamController(p.name).setOperation(operation); 
            }
            return operation
        }
        else {
            // create new
            const newParamOperator = new ParamManagerOperator(this, p);
            this.paramOperators.push(newParamOperator);
            newParamOperator.setOperation('new');
            return 'new'
        }

    }

    deleteParam(name:string):this
    {
        this.paramOperators = this.paramOperators.filter( pc => pc.name !== name);
        
        return this;
    }

    /** Update ParamEntryController if needed and return updated or not */
    updateParam(p:ScriptParam):boolean
    {
        if(this._paramNameExists(p))
        {
            const existingParamController = this.paramOperators.find(pc => pc.name === p.name );

            if(!this.equalParams(p,existingParamController.targetParam))
            {
                p.name = p.name.toUpperCase(); // names are always uppercase
                const index = this.paramOperators.indexOf(existingParamController);
                this.paramOperators[index] =  new ParamManagerOperator(this, p);
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

    _paramNameExists(p:ScriptParam):boolean
    {
        return Object.keys(this.getParamsMap()).includes(p.name.toUpperCase()) 
    }

    /** Utility to easily get target Params */
    getParams():Array<ScriptParam>
    {
        return this.paramOperators.map(pc => pc.targetParam)
    }

    /** Utility to easily get target Params by name */
    getParamsMap():Record<string,ScriptParam>
    {
        const map = {};
        this.paramOperators.forEach(pc => { map[pc.name] = pc.targetParam })
        return map;
    }

    getParamController(name:string):ParamManagerOperator
    {
        return this.paramOperators.find(pc => pc.name === name)
    }

    //// PROGRAMMATIC PARAM DEFINITION ////
    
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
    define(p:ScriptParam)
    {
        if(!p){ throw new Error(`ParamManager::define(p:ScriptParam): Please supply valid Param object! Got ${JSON.stringify(p)}`); }
        if(!p?.name){ throw new Error(`ParamManager::define(): Please supply at least a name for this Param!`); }

        const checkedParam = p;
        if(!checkedParam)
        { 
            return this; //  Error already thrown in checkParam if any
        }; 

        checkedParam._definedProgrammatically = true; // flag this Param as programmaticallly defined

        const r = this.addParam(checkedParam); // returns null if we already have the Param definition

        return this;
    }

    //// EVALUATE ////

    /** Return Params that we operated upon */
    getOperatedParamsByOperation():Record<ParamOperation, Array<ScriptParamData>>
    {
        const changedParamsByOperation = this.paramOperators
                                    .filter((po) => po.paramOperated())
                                    .reduce(
                                        (acc,po) => {
                                            acc[po.operation as ParamOperation].push((po as any).toData()) // TODO: Fix TS
                                            return acc
                                        }, 
                                        { new: [] as Array<ScriptParamData>, updated: [] as Array<ScriptParamData>, deleted: [] as Array<ScriptParamData> })

        console.info('**** ParamManager::getOperatedParamsByOperation ****')
        console.info(changedParamsByOperation);
        
        return changedParamsByOperation
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
    setParamGlobalsInScope(scope?:any):boolean
    {
        const curParams = this.getParams();

        if(typeof scope !== 'object' || !scope)
        { 
            scope = this.parent; // set to parent scope (worker or app)
        } 

        if (!Array.isArray(curParams)){ return false; }

        // Set value of param reference ${PARAM_NAME} on scope
        curParams.forEach( p => 
        {
            console.info(`ParamManager::setParamGlobalsInScope(): Setting global param "${this.PARAM_SIGNIFIER + p.name}" with value "${p._value ?? p.default}"`);
            scope[this.PARAM_SIGNIFIER + p.name] = p._value ?? p.default;
        })
    }

    /** Compare two params (either Param or ScriptParam) */
    equalParams(param1:ScriptParam, param2:ScriptParam):boolean
    {
        const ScriptParam1 = JSON.parse(JSON.stringify(param1));
        const ScriptParam2 = JSON.parse(JSON.stringify(param2));
        return deepEqual(ScriptParam1,ScriptParam2);
    }

    /** Set quick references from this instance to the values of params 
        This is used to control Params directly (through ParamManagerOperator)
        The user can write values for example with $PARAMS.$TEST.set(50)
    */
    setParamControlRefs()
    {
        this.paramOperators.forEach( pc =>
        {
            this[pc.name] = pc;
        })
    }
}


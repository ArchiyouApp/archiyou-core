/**
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
 *      - [Worker scope] At end of script execution changed params are added to ComputeResult at managedParams and send to app
 *      - [App scope] managedParams are put in store and picked up by ParamMenu to change menu params (without triggering execution again)
 * 
 */

import { Param, PublishParam, ParamOperation, ParamManagerOperator,  } from './internal'
import { publishParamToParam, paramToPublishParam } from './internal' // utils

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
    constructor(params?:Array<PublishParam|Param>)
    {
        if(Array.isArray(params) && params.length > 0)
        {
            this.paramOperators = params.map(p => new ParamManagerOperator(this, this._validateParam(publishParamToParam(p)))); // always make sure we use Param internally
            this.paramOperators.forEach( p => this[p.name] = p) // set param access
        }
    }

    setParent(scope:any):this
    {
        this.parent = scope;
        this.setParamGlobalsOnWorker();
        return this
    }

    //// MANAGING PARAMS ////

    /** Add or update Param and return what was done (update, new, null)  */
    addParam(p:Param):ParamOperation|null
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
            const newParamOperator = new ParamManagerOperator(this, this._validateParam(p));
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
    updateParam(p:Param):boolean
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

    _paramNameExists(p:Param):boolean
    {
        return Object.keys(this.getParamsMap()).includes(p.name.toUpperCase()) 
    }

    /** Utility to easily get target Params */
    getParams():Array<Param>
    {
        return this.paramOperators.map(pc => pc.targetParam)
    }

    /** Utility to easily get target Params by name */
    getParamsMap():Record<string, Param>
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
    define(p:Param)
    {
        if(!p){ throw new Error(`ParamManager::define(p:Param): Please supply valid Param object! Got ${JSON.stringify(p)}`); }
        if(!p?.name){ throw new Error(`ParamManager::define(): Please supply at least a name for this Param!`); }

        const checkedParam = this._validateParam(p);
        if(!checkedParam)
        { 
            return this; //  Error already thrown in checkParam if any
        }; 

        checkedParam._definedProgrammatically = true; // flag this Param as programmaticallly defined

        const r = this.addParam(checkedParam); // returns null if we already have the Param definition

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
        checkedParam.enabled = checkedParam?.enabled ?? true;
        checkedParam.visible = checkedParam?.visible ?? true;
        
        return checkedParam;
    }

    //// EVALUATE CHANGES ////

    getChangedParamsByOperation():Record<ParamOperation, Array<PublishParam>>
    {
        const changedParamsByOperation = this.paramOperators
                                    .filter((po) => po.paramChanged())
                                    .reduce(
                                        (acc,po) => {
                                            acc[po.operation as ParamOperation].push(po.toData())
                                            return acc
                                        }, 
                                        { new: [] as Array<PublishParam>, updated: [] as Array<PublishParam>, deleted: [] as Array<PublishParam> })

        console.info('**** ParamManager::getChangedParamsByOperation ****')
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


/**
 * 
 *  ComponentManager.ts
 *      
 *    Manages the registration, loading and documentation of components
 *      An reference to an instance of ComponentManager is accessible in script scope at $component
 */

import { ArchiyouApp, ScriptVersion } from "./internal"; // types

//// MAIN CLASS ////

export class ComponentManager
{
    _ay:ArchiyouApp
    _components:Record<string,any> = {};
    _scriptCache:Record<string,any> = {}; // by path of component

    constructor(_ay:ArchiyouApp)
    {
        this._ay = _ay;
    }

    /** Register a component for importing 
     *  
     *  @param path - the path to the component script on Archiyou platform, can be with or without version
     *                  'archiyou/wall:1.0' or 'archiyou/wall' - version pinning is probably better
     *  @params params - any parameters values to pass to the component
     *  @params options - any options to pass to the component - repe
     * 
     *  $component[an instance of ComponentManager].load('path/to/my-component.js')
     *      
    */
    load(path:string, params:Record<string,any>, options:Record<string,any>):this
    {

        return this;
    }
}


//// COMPONENT MANAGER SUBCLASSES ////

/** ImportComponent */
export class ImportComponent
{
    _manager: ComponentManager;
    _path:string;
    _params:Record<string,any>;
    _options:Record<string,any>;
    _script:ScriptVersion;
    _error:boolean = false;

    constructor(path:string, params:Record<string,any>, options:Record<string,any>)
    {
        this._path = path;
        this._params = params;
        this._options = options;
    }

    setManager(manager:ComponentManager):this
    {
        this._manager = manager;
        return this
    }

    /** Fetch the script of the component */
    async fetchScript(useCache:boolean = true):Promise<this>
    {
        if (this._manager._scriptCache[this._path] && useCache)
        {
            return this._manager._scriptCache[this._path];
        }
        //  do real fetch
        const url = `${this._manager._ay.config.API_URL}/${this._manager._ay.config.API_URL_SHARED_SCRIPT_NAME_AND_TAG}/${this._path}`;

        try
        {
            let r = await fetch(url, { 
                method : 'GET',
                headers: {
                    'Content-type': 'application/json',
                },
            })
            this._script = (r.json) ? (await r.json()).data as ScriptVersion : r as any as ScriptVersion; // NOTE: json() return another promise
            this._manager._scriptCache[this._path] = this._script;
        }
        catch(e)
        {
            console.error(`ImportComponent::fetchScript: Fetch failed for path "${this._path}". Please check if it exists!`);
            this._error = true;
        }
        return this;
    }

    //// REAL FETCH AND LOAD HANDLERS ////

    /** Give information on the component by loading it  */
    info()
    {

    }

}
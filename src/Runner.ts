/**
 *  Archiyou Runner.ts
 *  Easily execute Archiyou scripts in different contexts
 * 
 *  For requesting results we use output paths in RunnerExecutionRequest.outputs:
 *  For example: 
*/
 //      - default/models/glb: get the default model in GLB format with default options
 //      - default/models/dxf?2d: get the default model in DXF format with 2D options
 //      - default/docs/*/pdf // get all documents in PDF format
 //      - sketch/tables/*/*  // execute sketch pipeline and get all tables in all formats
 //      - [WIP] */*/*/* // execute all pipelines, all entities and all formats (for example for cache purposes)
 //


import type { ArchiyouApp, ExportGLTFOptions, Statement, 
                StatementResult, RunnerScriptScopeState, ScriptOutputPath, ScriptOutputFormatModel, ScriptOutputPathData, 
                ScriptOutputFormat, ScriptOutputData, DocData,
 } from "./internal"


import { OcLoader, Console, Geom, Doc, Calc, Exporter, Make, IO, 
            RunnerScriptExecutionResult, CodeParser, LibraryConnector, 
            ScriptOutputManager} from "./internal"

import { Point, Vector, Bbox, Edge, Vertex, Wire, Face, Shell, Solid, ShapeCollection, Obj, ParamManager } from "./internal"

import { RunnerComponentImporter, DocDocument, Table } from "./internal"

import { GEOM_METHODS_INTO_GLOBAL, SCRIPT_OUTPUT_MODEL_FORMATS
 } from "./internal" // from constants


import type { RunnerOptions, RunnerExecutionContext, RunnerRole, RunnerScriptExecutionRequest,
                RunnerActiveScope, ModelFormat, RunnerWorkerMessage, RunnerManagerMessage, 
                PublishScript,
                ScriptParamData, ExecutionRequestOutputFormatGLTFOptions, ScriptMeta} from "./internal"

import { isRunnerScriptExecutionResult } from './internal' // typeguards

import { roundTo, toRad, toDeg } from './internal' // utils


export class Runner
{
    ay:ArchiyouApp
    role: RunnerRole // role of the runner: single (single thread), manager or worker
    
    _config: Record<string,any> // environment variables for worker
    _oc: any; // OpenCascade WASM module
    _localScopes: Record<string, any> = {}; // TODO: more specific typing for Proxy
    _activeScope: RunnerActiveScope; // scope in given context (local or worker) and name
    _activeExecRequest: RunnerScriptExecutionRequest;

    _componentScripts: Record<string, PublishScript> = {}; // prefetched component scripts by name=url=path
    
    _manageWorker:Worker|null; // the worker that this runner manages (if role is manager)
    _onWorkerMessageFunc:(m:RunnerWorkerMessage) => any; // function to call when we get a message from the Worker

    //// SETTINGS ////
    LOGGING_DEBUG: boolean = false; // directly log into local console, not that of Archiyo

    //// DEFAULTS ////
    DEFAULT_ROLE: RunnerRole = 'single'
    DEFAULT_OUTPUTS = ['default/model/glb']
    OUTPUT_FORMAT_DEFAULTS = {
        glb: { binary: true, data: true, metrics: true, docs: false, tables: true, pointAndLines: true, shapesAsPointAndLines: true } as ExecutionRequestOutputFormatGLTFOptions,
    } as Record<ScriptOutputFormat, Record<string, any>>; // default output formats for each type

    /**
     *  Create a new Runner instance on main thread (as manager or single)
     *  Or as parallel worker (Webworker or WorkerThread) listening to incoming messages before doing the work
     */
    constructor(role?:RunnerRole) 
    {
        this.role = role || this.DEFAULT_ROLE;
        
        console.info(`Runner: Starting Archiyou Runner with role: "${this.role}"`)

        if(this.role === 'worker')
        {
            // loads the OC wasm and start worker
            this._startAsWorker();
        }
        else if(this.role === 'manager')
        {
            console.info(`Runner: Starting Archiyou Runner in manager mode. Please provide a worker to manage with .startAsManager(worker)`);
        }
        else if(this.role === 'single')
        {
            console.info(`Runner: Starting Archiyou Runner in single thread mode. Please load the library with .load()`);
        }
        else {
            throw new Error(`Runner: Unknown role "${this.role}". Please supply a valid role: 'single', 'manager' or 'worker'`);
        }
    }

    /** Loading Archiyou library with WASM module 
        @returns [Runner, OC library]
    */
    async load():Promise<this>  
    {
        if(this.loaded())
        { 
            console.info('Runner::load(): Archiyou library already loaded. Skipping loading OC WASM module');
            return this;
        }
        console.info(`Runner: Loading Archiyou library with WASM module`)
        //this._oc = await new OcLoader().loadAsync();
        // TODO: set when to use modern loadAsync() or non-dynamic version for compatibility
        new OcLoader().load((oc) => {
            this._oc = oc;
            console.info(`Runner: Done loading. Setup default execution scope in role "${this.role}"`)    
            // Create a execution scope and give it a initial state with Archiyou modules 
            this.createScope('default'); // NOTE: Errors give a big readout around OC WASM. But is not related to it!
        });
        
        return this;
    }

    /** If OpenCascade is loaded */
    loaded():boolean
    {
        return !!this._oc;
    }

    //// RUNNER AS MANAGER ////

    startAsManager(worker?:Worker, settings?:Record<string,any>):this
    {
        if(!worker){ throw new Error(`Runner::startAsManager(): Worker not provided`)}

        this._manageWorker = worker;
        this.role = 'manager';
        this._connectToWorker(settings); // TODO: settings
        
        return this;
    }

    /** Supply a function to call when we get a message from the Worker */
    onWorkerMessage(func:(message:RunnerWorkerMessage) => any):this
    {
        if(!this._manageWorker){ throw new Error(`Runner::onMessage(): Worker not found`);}
        this._onWorkerMessageFunc = func;
        return this;
    }

    /** Send message to Worker
     * IMPORTANT: data can only contain standard data types (no functions, classes etc)
     */
    _postMessageToWorker(message:RunnerManagerMessage)
    {
        if(!this._manageWorker){ throw new Error(`Runner::_postMessageToWorker(): Worker not found`);}
        this._manageWorker.postMessage(message);
    }

    /** Setup communication between manager and worker */
    _connectToWorker(settings:Record<string,any>={})
    {
        if(!this._manageWorker){ throw new Error(`Runner::_postMessageToWorker(): Worker not found`);}

        this._manageWorker.addEventListener('message', (ev) => this._handleMessageFromWorker(ev));
        // send settings to worker
        this._postMessageToWorker({ type: 'init', payload: { settings: settings }});
        
    }
    
    _handleMessageFromWorker(m:MessageEvent)
    {
        const message = m.data as RunnerWorkerMessage;

        console.info(`Runner::handleMessageFromWorker(): Received message from worker: ${message}`);

        switch(message.type)
        {
            case 'loaded':
                console.info(`Runner::handleMessageFromWorker(): Worker is loaded and ready to execute scripts!`);
                break;

            case 'executing':
                console.info(`Runner::handleMessageFromWorker(): Worker is executing script`);
                break;  

            case 'stopped':
                console.info(`Runner::handleMessageFromWorker(): Worker execution stopped`);
                break;

            case 'executed':
                console.info(`Runner::handleMessageFromWorker(): Worker script executed`);
                // TODO: handle results
                break;
            
                case 'console':
                const consoleMessage = message.payload.message; // ConsoleMessage
                console.log(`Runner::handleMessageFromWorker(): Worker console message: ${consoleMessage}`);
                break;

            case 'save-step':
                const stepContent = message.payload.content;
                //this.exporter.exportToStepWindow(stepContent);
                break;
            
                case 'save-stl':
                const stlContent = message.payload.payload.content;
                //this.exporter.exportToStlWindow(stlContent);
                break;

            // Got a GLTF file back
            case 'save-gltf':
                const gltfContent = message.payload.payload.content; // ArrayBuffer binary or string
                // this.exporter.exportToGLTFWindow(gltfContent);
                break;

            // Got a SVG file back
            case 'save-svg':
                const svgContent = message.payload.payload.content; // string
                /*
                if (svgContent === null)
                {
                this.showMessage('No SVG content found to export to SVG. If you choose 2D, make sure there are 2D Shapes on the XY plane!');
                }
                else {
                this.exporter.exportToSvgWindow(svgContent);
                }*/
                break;
            
            default: 
                // TODO
                console.error(`Runner:_handleMessageFromWorker: Unknown message: "${message.type}"`)
        }

        // Forward to user-supplied handle function
        if(typeof this._onWorkerMessageFunc === 'function')
        {
            this?._onWorkerMessageFunc(message);
        }
        else {
            console.warn(`Runner::_handleMessageFromWorker(): No onMessage function provided: If you want to handle messages from the worker locally, use .onWorkerMessage(func)`);
        }
    }

    //// RUNNER AS WORKER IN A SEPERATE THREAD: WEBWORKER OR WORKERTHREAD (WIP) ////

    /** Set current runner as worker wihtin a parallel thread
     *  Listen to messages on ports, execute scripts and send back the results
     */
    _startAsWorker():this
    {
        this.role = 'worker';
        this._startWorkerListener();
        this.load() // First load OpenCascade - also creates default scope
            .then((runner) => 
            {
                this._postMessageToManager({ type: 'loaded', payload : { msg: `Archiyou worker is loaded and ready to execute scripts!`}});   
            })
        return this;
    }

    _startWorkerListener()
    {
        const ctx = this._getWorkerContext();
        if(!ctx) throw new Error(`Runner::_startWorkerListener(): Worker context not found`);

        console.info(`Runner::_startWorkerListener(): Starting worker listener in context ${this._getWorkerContextName()}`);

        if(this._getWorkerContextName() === 'webworker')
        {
            (ctx as globalThis).onmessage = async (ev) => await this._handleMessageFromManager(ev);
        }
        else
        {
            // Because the way we run TS in Node we can't get context from within the WorkerThread
            //(ctx as typeof parentPort).on('message', this._handleMessage);
            return null;
        }
    }

    /** Post message as worker to parent 
     *  IMPORTANT: data can only contain standard data types (no functions, classes etc)
    */
    _postMessageToManager(message:RunnerWorkerMessage)
    {
        const ctx = this._getWorkerContext();
        ctx?.postMessage(message); // Node:Workerthreads dont work yet!
    }

    async _handleMessageFromManager(e:MessageEvent):Promise<void>
    {
        const m = e.data as RunnerManagerMessage;
        switch(m.type)
        {
            case 'init':
                this._config = e.data?.payload?.settings; // set all incoming env variables
                console.info(`Runner::_handleMessageFromManager(): Worker initialized with settings: ${this._config}`);
                break;
            case 'execute':
                // First callback that we are executing
                this._postMessageToManager({ type: 'executing', payload: { msg: `Executing script`}});
                await this.execute(e.data.payload as RunnerScriptExecutionRequest); // Async function, once it is done we do callback to manager
                break;

            case 'stop':
                console.info(`Runner::_handleMessageFromManager(): Worker stop requested!`);
                // TODO
                //setCancelExecution();
                break;
            
            /*
            case 'export-to-step':
                let stepContent = exporter.exportToStep();
                ctx.postMessage({ type : 'save-step', payload : { content : stepContent }});
                break;
            
            case 'export-to-stl':
                let stlContent = exporter.exportToStl();
                ctx.postMessage({ type : 'save-stl', payload : { content : stlContent }});
                break;

            case 'export-to-gltf':
                const binary = (e.data.payload?.binary !== undefined) ? e.data.payload?.binary : true; // get binary flag from payload
                // Async because some methods within GLTFBuilder are async
                exporter.exportToGLTF({ binary: binary })
                    .then( gltfContent => ctx.postMessage({ type : 'save-gltf', payload : { content : gltfContent }}))
                break;
            
            case 'export-to-svg':
                const svgContent = exporter.exportToSvg(false);
                ctx.postMessage({ type : 'save-svg', payload : { content : svgContent }});
                break;

            case 'export-to-svg-2d':
                const svgContent2D = exporter.exportToSvg(true); // 2D only
                ctx.postMessage({ type : 'save-svg', payload : { content : svgContent2D }});
                break;

            default:
                ctx.postMessage({ type : 'error', payload :  { msg : `Unknown message: ${e.data.type}`}});
            */
        }    
    }

    _getWorkerContext():globalThis|null
    {
        return (this._getWorkerContextName() === 'webworker') 
                ? self 
                : this._getWorkerThreadContext();
    }

    _getWorkerThreadContext():null
    {
        // IMPORTANT: This does not work, probably because of Typescript compilation
        /*
        const { parentPort, isMainThread  } = await import('worker_threads');
        return parentPort
        */
        console.warn(`Runner::_getWorkerThreadContext(): WorkerThread not implemented yet`);
        return null;
    }

    _getWorkerContextName():'webworker'|'workerthread'
    {
        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
        {
            return 'webworker';
        } 
        else if (typeof process !== 'undefined' && process?.versions?.node)
        {
            return 'workerthread'; // TODO: detect if normal node
        } 
        return null; 
    }

    //// EXECUTION SCOPES ////

    /** Set Execution Scope 
     *  Depending on the execution context we set up a scope in which the script will run 
     *  
     *  NOTES:
     *      - big errors like 'var Module=typeof Module!="undefined"?Module:{}....' are ofter thrown when any problem arrises
     * 
     * */
    createScope(name:string='default'):this
    {
        const BASIC_SCOPE = { console: console };

        const state = this.buildLocalExecScopeState();
        state._scope = name; // set name of the scope inside scope

        if(this.role === 'worker' || this.role === 'single')
        {
            const scope = new Proxy({ ...BASIC_SCOPE, ...state }, 
            {
                has: () => true, // Allows access to any variable (avoids ReferenceError)
                get: (target, key) => target[key], // Retrieves values from scope
                set: (target, key, value) => {
                    if (typeof target[key] === 'object' && target[key] !== null) {
                        // If the property is an object, update its properties
                        Object.assign(target[key], value);
                    } else {
                        // Otherwise, directly set the value
                        target[key] = value;
                    }
                    return true;
                }
            });
            scope.ay.scope = scope; // Set a property directly within the Proxy
            this._localScopes[name] = scope; 
            this._activeScope = { name: name, context: 'local' };
        }
        else 
        {
            console.warn(`Runner::createScope(): Scope creation by manager not implemented yet`);
            // Manager command
        }

        return this;
    }
    
    /** Build start Archiyou state for a execution scope
     *  Each scope uses its own instances of Archiyou modules 
     */
    buildLocalExecScopeState():RunnerScriptScopeState
    {
        const scopeState = { ay: null } as RunnerScriptScopeState; 

        // Archiyou base modules like geom, doc, calc, make etc
        Object.assign(scopeState, { ay: this.initLocalArchiyou()});

        // Add basic globals (like Math)
        this._addGlobalsToScopeState(scopeState);

        // Add Archiyou modules as globals in execution scope state object
        this._addModulesToScopeState(scopeState);
        // Modeling basics into state
        this._addModelingMethodsToScopeState(scopeState)
        // Special scope methods, for example importing components
        this._addMetaMethodsToScopeState(scopeState);


        return scopeState;
    }

    /** Initiate all Archiyou modules and return a state object
     *  that is plugged into a local execution scope
     */
    initLocalArchiyou():ArchiyouApp
    {
        // create all Archiyou modules
        const ay  = {
            console: new Console((this.LOGGING_DEBUG) ? console : this), // put Archiyou console in debug mode if needed
            geom: new Geom(),
            doc: new Doc(), // TODO: settings with proxy
            calc: new Calc(),
            exporter: new Exporter(),
            make: new Make(),
            worker: this, // reference to worker instance
            scope: null, // reference to the scope - is set when scope is created
        } as ArchiyouApp

        // TODO: Improve providing all Archiyou modules to to modules themselves
        ay?.doc?.setArchiyou(ay);
        ay?.exporter?.setArchiyou(ay);
        ay?.make?.setArchiyou(ay);
        ay?.beams?.setArchiyou(ay); // Not there currently

        return ay;
    }

    /** Our scopes are very limited. We need to make sure basic globals are availble */
    _addGlobalsToScopeState(state:Record<string,any>):Record<string,any>
    {
        // Add basic globals to the state
        Object.assign(state,
            {
                Math: Math, 
                roundTo: roundTo,
                toRad: toRad,
                toDeg: toDeg,
                JSON: JSON,
                Array: Array,
                Object: Object,
            }
        );

        return state;
    }

    /** Add Archiyou modules as globals in execution scope state object */
    _addModulesToScopeState(state:Record<string,any>):Record<string,any>
    {
        if(!state.ay){ throw new Error(`Runner:: _addModulesToScopeState(): Archiyou modules not found in state object`); }
        
        Object.assign(state, { 
            console: state.ay.console,
            geom: state.ay.geom,
            doc: state.ay.doc,
            calc: state.ay.calc,
            exporter: state.ay.exporter,
            make: state.ay.make
        });        

        // setup logging
        this._addLoggingToScopeState(state);
        
        return state; // update remains the same
    }

    _addLoggingToScopeState(state:Record<string,any>):Record<string,any>
    {
        // Overwrite global console methods with Archiyou console
        // That console still has a reference for global console for debugging
        globalThis.console = state.console;

        state.print = (m:string) => state.console.user(m);
        state.log = (m:string) => state.console.info(m);
        
        return state;
    }

    /** Make general modeling methods available in scope state object */
    _addModelingMethodsToScopeState(state:Record<string,any>):Record<string,any>
    {
        // Basic modeling classes
        state.Vector = Vector;
        state.Point = Point;
        state.Bbox = Bbox;
        state.Edge = Edge;
        state.Vertex = Vertex;
        state.Wire = Wire;
        state.Face = Face;
        state.Shell = Shell;
        state.Solid = Solid;
        state.ShapeCollection = ShapeCollection;
        state.Obj = Obj;

        if(!state.geom)
        {
            // Make sure the geom global is present
            this._addModulesToScopeState(state);
        }

        // Some shortcuts to important methods on Geom
        GEOM_METHODS_INTO_GLOBAL
        .forEach(methodName => 
        {
            const method = state.geom[methodName];
            if (!method){ console.warn(`Runners::_addModelingMethodsToScopeState: Could not find ${methodName} in Geom class. Check config: GEOM_METHODS_INTO_GLOBAL`);}
            else {
                // avoid overwriting
                if (!state[methodName])
                {
                    state[methodName] = method.bind(state.geom);
                }
                state[methodName.toLowerCase()] = method.bind(state.geom);
            }
        })

        return state;
    }

    /** Add specific meta methods */
    _addMetaMethodsToScopeState(state:Record<string,any>)
    {
        // Import component
        state.$component = (name:string, params:Record<string,any>={}) => 
        {
            console.info(`$component: Importing component: "${name}" with param values: ${JSON.stringify(params)}`);

            const componentImporter = new RunnerComponentImporter(this, this.getLocalActiveScope(), name, params);
            // Don't execute yet, wait for componentImporter.get()
            return componentImporter;
        }
    }

    //// MANAGING EXECUTION SCOPES 
    
    /** Select a scope */
    scope(name:string):this
    {
        if(!this._localScopes[name]){ throw new Error(`Runner:: scope(): Scope "${name}" does not exist`)}
        this._activeScope = { name: name, context: 'local' };

        return this;
    }

    getLocalActiveScope():RunnerScriptScopeState
    {
        if(!this._activeScope) { throw new Error(`Runner:: scope(): No active scope found`)}
        return this._localScopes[this._activeScope.name];
    }

    getLocalScope(name:string):RunnerScriptScopeState
    {
        if(!this._localScopes[name]){ throw new Error(`Runner:: scope(): Scope "${name}" does not exist`)}
        return this._localScopes[name];
    }

    deleteLocalScope(name:string):this
    {
        if(!this._localScopes[name]){ throw new Error(`Runner:: scope(): Scope "${name}" does not exist`)}
        delete this._localScopes[name];
        this._activeScope = { name: 'default', context: 'local' }; // reset to default scope
        
        console.info(`Runner::deleteLocalScope(): Deleted scope: "${name}. Returned to default."`);

        return this;
    }



    //// REQUESTS AND EXECUTION ////

    /** Start execution of entire code or script with params in fresh, active scope 
     *  @request - string with code or object with script and params
     *  @result - return the result of the execution
    */
    public async execute(request: string|RunnerScriptExecutionRequest):Promise<RunnerScriptExecutionResult>
    {
        await this._prefetchComponentScripts(request, true); // Prefetch component scripts if needed
        return await this._execute(request, true, true);
    }

    /** Execute (entire or partial) request on local execution scope or on managed worker */
    private async _execute(request: string|RunnerScriptExecutionRequest, startRun:boolean=true, result:boolean=true):Promise<RunnerScriptExecutionResult>
    {
        console.info(`**** Runner::_execute(): Executing script "${(request as any)?.script?.name || request}" in role "${this.role}", return result ${result} ****`);

        // Convert code to request if needed
        if(typeof request === 'string')
        {
            request = { script: { code: request } } as RunnerScriptExecutionRequest;    
        }

        // If no outputs are defined, use default outputs
        if(!request.outputs || request.outputs.length === 0)
        {
            request.outputs = this.DEFAULT_OUTPUTS;
        }

        // Check request structure (including params defs and values)
        this._activeExecRequest = this._checkRequestAndAddDefaults(request);

        if(this.role === 'worker' || this.role === 'single') // Do the work here
        {
            return await this._executeLocal(this._activeExecRequest, startRun, result);
        }
        else if(this.role === 'manager')
        {
            return await this._executeInWorker(this._activeExecRequest);
        }
    }

    /** Main entrypoint for execution in statements
     *  Use this is you need more control of execution and possible errors
     *  This seperates the code in statements and returns results for each statement
     *  It still uses execute() internally
    */
    async executeInStatements(request: RunnerScriptExecutionRequest):Promise<RunnerScriptExecutionResult>
    {
        this._activeExecRequest = this._checkRequestAndAddDefaults(request);
        const statementResults = [] as Array<StatementResult>;

        if(this.role === 'worker' || this.role === 'single')
        {
            return await this._executeLocalInStatements(this._activeExecRequest, statementResults);
        }
        else
        {
            console.warn(`Runner::execute(): Execution by manager not implemented yet`);
            return null;
        }
    }

    /** Check execution request */
    _checkRequestAndAddDefaults(request:RunnerScriptExecutionRequest):RunnerScriptExecutionRequest
    {
        console.info(`Runner::_checkRequestAndAddDefaults(): Checking Execution Request with code "${request.script.code.slice(0, 150)}..."`);
        // check params defs and inputs
        this._checkRequestParams(request);

        return {
            ...request
        }
    }

       /** Check params in RunnerScriptExecutionRequest
     *  We need to make sure that param values are there and consistent with param definitions 
     *  - if param values (request.params) are not set, we use default values from script.params definitions
     *  - param values (request.params) are put in defs (request.script.params) 
     * */
    _checkRequestParams(request:RunnerScriptExecutionRequest):RunnerScriptExecutionRequest
    {
        // No param definitions in script
        if(!request.script.params)
        {
            request.params = {}; // no param values in request
            return request;
        }
        
        // Do some sanity checks on script param definition
        if(typeof request.script.params !== 'object')
        {
            console.error(`Runner::_checkRequestParams(): Script params should be an object, but got: ${JSON.stringify(request.script.params)}`);
            request.script.params = {}; // reset to empty object
        }

        // Params from script definition and values from request
        const params = (request.script.params && typeof request.script.params === 'object' && Object.keys(request.script.params).length > 0) 
            ? Object.values(request.script.params) : [];
        // Make sure we got name in param obj definition too
        params.forEach((pd,i) => 
        {
            const name = Object.keys(request.script.params)[i];
            pd.name = name;
            if(!name){ console.error(`Runner::_checkRequestParams(): Param definition without name found: ${JSON.stringify(pd)}`); }	
        });

        const paramValues = (request.params && typeof request.params === 'object' && Object.keys(request.params)) ? request.params : {};
        params.forEach(pd => pd.value = paramValues[pd.name] || pd.default); // set values from request if available
        // NOTE: in paramManager incoming values are validated and set to default if not valid
        
        // Make sure we have param values too (default if not set)
        request.params = params.reduce( (agg,p) => { agg[p.name] = p.value; return agg }, {}); 

        return request;
    }

    /** Execute a request in a seperate managed worker */
    async _executeInWorker(request: RunnerScriptExecutionRequest):Promise<RunnerScriptExecutionResult>
    {
        console.info(`Runner: Executing script in worker`);

        this._postMessageToWorker({ type: 'execute', payload: request });

        return new Promise((resolve, reject) => 
        {
            const handleMessage = (event: MessageEvent) => 
            {
                const message = event.data as RunnerWorkerMessage;
                if (message.type === 'executed')
                {
                    this._manageWorker.removeEventListener('message', handleMessage); // Clean up listener
                    resolve(message.payload as RunnerScriptExecutionResult); // Resolve the promise with the payload
                }
            };
            // Add the message event listener
            this._manageWorker.addEventListener('message', handleMessage);
            
            setTimeout(() => {
                this._manageWorker.removeEventListener('message', handleMessage); // Clean up listener
                reject(new Error(`Execute in worker timed out (> 10s)`));
            }, 10000); // 10 seconds timeout
        });
    }
    

    /** Execute a piece of code or script (and params) in local execution context 
     *  @param {RunnerScriptExecutionRequest} [request] - string with code or object with script and params
     *  @param {boolean} [startRun] - if true a reset is made of the state to prepare for fresh run
     *  @param {boolean} [output] - if true, the Archiyou state is returned as RunnerScriptExecutionResult
     * 
     *  @returns - RunnerScriptExecutionResult or error string or null if no output 
     * 
     *  NOTE: this = execution context (not Runner)
    */
    async _executeLocal(request: RunnerScriptExecutionRequest, startRun:boolean=true, output:boolean=true):Promise<RunnerScriptExecutionResult|null>
    {
        if(!this.loaded())
        { 
            console.warn(`Runner::_executeLocal(): OpenCascade WASM module not loaded yet. The request is executed once it is!`);

            return new Promise((resolve, reject) => {
                const checkLoaded = () => {
                    if (this.loaded())
                    {
                        resolve(this._executeLocal(request, startRun, output)); // Resolve the promise when loaded() is true
                    } 
                    else 
                    {
                        setTimeout(checkLoaded, 100); // Check again after the interval
                    }
                };
                checkLoaded();
            });
        }
            
        console.info(`Runner: Executing script in active local context: "${this._activeScope.name}"`);
        console.info(`* With param values: ${JSON.stringify(request.params)} *`);

        this._activeExecRequest = request;
        const executeStartTime = performance.now()

        // In older apps AyncFunction is not available because await/async are replaced on buildtime
        // This is pretty OK, instead that in the dynamic function underneath the awaits are not replaced
        // Resulting in error: "await is only valid in async function"
        // We use a fix that detects type of inner execution function
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

        const scope = this.getLocalActiveScope();
        const code = request.script.code;

        const startRunFunc = (startRun) ? this._executionStartRunInScope : () => {};
        const outputFunc = (output) 
                            ? this.getLocalScopeResults.bind(this) // bind to this
                            : async () => null; // output or return null

        const exec = async () =>
        {
            try 
            {
                return await (new AsyncFunction(  
                        'request',
                        'scope', 
                        'startRunFunc',
                        'outputFunc',
                            // function body
                            `
                            startRunFunc.call(scope, scope, request); // first is this, the rest args
                            // To deal with replaced async functions in old JS enviroments

                            // run code in scope
                            with (scope)
                            {
                                "use strict"; 
                                ${code};
                            }
                            // export results
                            
                            // detect if everything is OK and this is indeed a AsyncFunction - otherwise it is Function
                            asyncOutput = outputFunc.constructor.name === 'AsyncFunction'; 
                            // We run the output function in scope of Runner and pass the scope as argument
                            return (asyncOutput) 
                                        ? Promise.resolve(outputFunc(scope, request)) // avoid await keyword - again for Webpack 4
                                        : outputFunc(scope, request);
            
                            `
                    ))(this._activeExecRequest, scope, startRunFunc, outputFunc) as Promise<RunnerScriptExecutionResult>|RunnerScriptExecutionResult;    
            }
            catch(e)
            {
               return this._handleExecutionError(scope, this._activeExecRequest, code, e);
            }
        }

        const result = await exec();
        
        // Set duration if result is RunnerScriptExecutionResult
        if(isRunnerScriptExecutionResult(result)){
            result.duration = Math.round(performance.now() - executeStartTime);
        }

        // Send message to manager if in worker role
        if(this.role === 'worker')
        {
            this._postMessageToManager({ type: 'executed', payload: result });
        }

        return result;
    }

    _handleExecutionError(scope: RunnerScriptScopeState, request:RunnerScriptExecutionRequest,code:string, e:Error):RunnerScriptExecutionResult
    {
        // NOTE: code can be just a small part of the request.script.code
        // Get context of error by parsing the stack trace
        const context = this._extractScriptContextFromErrorStack(e, code);
        const errorMessage = `
**** EXECUTION ERROR ****
- error: "${e.message}" 
- context: 
${context}
**** END ERROR ****`;

        // Also add to local console
        console.error(errorMessage);

        return {
            status: 'error',
            errors: [{ status: 'error', message: errorMessage, code: code } as StatementResult],
            // get all messages out too, this could help debugging
            messages: scope.console.getBufferedMessages(['user', 'exec','warn', 'error']),
            request: request, // original request in response for debugging
        } as RunnerScriptExecutionResult
    }

    _extractScriptContextFromErrorStack(e:Error, code:string):string|null
    {
        /* Within eval we get something like:
         
            TypeError: roundTo is not a function
            at eval (eval at <anonymous> (file:///app/lib/archiyou-core/src/Runner.ts:1:13312), <anonymous>:216:14)
            at exec (/app/lib/archiyou-core/src/Runner.ts:834:21)
            at Runner._executeLocal (/app/lib/archiyou-core/src/Runner.ts:854:30)
            ...

            <anonymous>:216:14 contains line and column number of error. Extract that from the code

        */
        const CONTEXT_LINES_BEFORE = 3;
        const CONTEXT_LINES_AFTER = 3;
        // shift line number because we wrap in eval - TODO:check this
        const CORRECT_LINES_FOR_EVAL_WRAP = -11; 

        // TODO: there seems to be a discrepancy between the line numbers in the error stack and the actual code
        const matches = e.stack.match(/<anonymous>:(\d+):(\d+)/);
        if(matches && matches.length === 3)
        {
            const line = parseInt(matches[1]) + CORRECT_LINES_FOR_EVAL_WRAP;
            const column = parseInt(matches[2]);

            if(line < 0 || column < 0) {
                console.error(`Runner::_extractScriptContextFromErrorStack(): Invalid line or column number extracted from stack trace: ${line}, ${column}`);
                return null;
            }

            // Extract the code around the error
            const lines = code.split('\n');
            const contextLines = lines.slice(
                                    Math.max(0, line - CONTEXT_LINES_BEFORE), 
                                    Math.min(lines.length, line + CONTEXT_LINES_AFTER));
            let context = contextLines.join('\n');

            // Try to highlight error
            const stringOverlap = this._stringOverlap(context, e.message);
            if(stringOverlap){
                context = context.replace(stringOverlap, `\x1b[31m >>>> ${stringOverlap} <<<<\x1b[0m`);
            }

            return context;
        }
        else {
            console.error(`Runner::_extractScriptContextFromErrorStack(): Failed to extract line and column from stack trace: ${e.stack}`);
            return null;
        }
    }


    /** Run a execution request (with script, params etc) in individual statements 
     *  This is used for debugging and testing in browser
     *  NOTE: see executeInStatements() for main entrypoint
    */
    async _executeLocalInStatements(request: RunnerScriptExecutionRequest, statementResults:Array<StatementResult>):Promise<RunnerScriptExecutionResult>
    {
        this._prefetchComponentScripts(request, true); // Prefetch component scripts if needed

        const codeParser = new CodeParser(request.script.code, {}, null); // TODO: config, IO => archiyou?
        const statements = await codeParser.getStatements();
        
        let result:RunnerScriptExecutionResult;

        console.info(`Runner::_executeLocalInStatements(): Executing script in ${statements.length} statements in active local context: "${this._activeScope?.name}"`);

        for(let s = 0; s < statements.length; s++)
        {
            const statementStartTime = performance.now()
            const statement = this._preprocessStatement({ ...statements[s] });
            const output = (s === statements.length -1); // only output on last statement

            const r = await this._execute(
                { 
                    ...request, // take from main request
                    script: {  
                        code: statement.code,  // only statement code
                        params: request.script.params || {} // use params from request
                    },
                } as RunnerScriptExecutionRequest, 
                (s === 0), // startRun on first statement
                output // only return output on last statement
            ); 

            const statementDuration = Math.round(performance.now() - statementStartTime);
            if(r?.status === 'error') // r can be null
            {
                console.error(`!!!! Runner::_executeLocalInStatements(): ***** ERROR: "${r.errors[0].message}" in following statement @${statement.lineStart}-${statement.lineEnd}} !!!! `);
                console.error(statement.code);

                statementResults.push({ 
                    ...statement,
                    status: 'error',
                    message: r.errors[0].message, // add error message to statement result
                    duration: statementDuration 
                }); 
            }
            
            console.exec(`Runner::_executeLocalInStatements(): Statement #${s+1} - ${output ? 'with' : 'without'} output] executed in ${statementDuration}ms`);
            result = r;
            
        }

        return result
    }

    /** Some preprocessing for statements */
    _preprocessStatement(statement:Statement):Statement
    {
        const CODE_REPLACE_RES = [
            { 
                // Replace function declarations with function expressions
                // So the function is assigned to a variable - otherwise it is not available in the local scope
                from: /function\s+(\w+)\s*\(/g, 
                to: (match, functionName) => `${functionName} = function(`,
                msg:  (matches) => {
                    return `Replacing declaration of "${matches[0]}" in statement "${statement.code}" to fit in local scope! Please use fn = function(){...} instead of function fn(){...} !`
                }
            }
        ]
        CODE_REPLACE_RES.forEach(ft => 
        {
            const originalCode = statement.code; // keep original code for error messages
            statement.code = statement.code.replace(ft.from, ft.to);
            if(originalCode !== statement.code)
            {
                console.warn(`Runner::_preprocessStatement(): ${ft.msg(originalCode.match(ft.from))}`);
            }
        });
        
        return statement;
    }



    /** Setup for every execution run inside execution scope
     *  IMPORTANT: 'this' is the execution scope
    */
    _executionStartRunInScope(scope:any, request: RunnerScriptExecutionRequest):void
    {
        // Setup ParamManager
        // TODO: ParamManager takes array of Params. Make consistent with map of PublishScript.params
        const params = (typeof request.script.params === 'object') ? Object.values(request.script.params) : []; // defs with values from request.params
        console.info(`Runner::_executionStartRunInScope()[in execution context]: Setting up ParamManager in scope with params "${JSON.stringify(params)}"`);
        
        scope.ay.paramManager = new ParamManager(params).setParent(scope); // sets globals in setParent()
        scope.$PARAMS = scope.ay.paramManager;

        // Reset some modules
        scope.ay.geom.reset(); // reset before we begin
        scope.ay.doc.reset();
        scope.ay.calc.reset();
        scope.ay.beams?.reset();
        scope.ay.gizmos = [];
    }

     //// EXECUTION COMPONENT SCRIPTS ////
     

    /** Execute a component script in a seperate scope
     *  This is always done in local context 
     *   because executing components comes from within execution scope and context
     *   IMPORTANT: 
     *      We want to avoid writing in a script: await $component('name').get(..) - which will be ugly and prone to errors
     *      So a sync function is used to execute component scripts
     *      This also means that we need to pre-fetch all component scripts before executing them
     */
    _executeComponentScript(request:RunnerScriptExecutionRequest): RunnerScriptExecutionResult
    {
        const scopeName = `component:${request.component}`;
        this.createScope(scopeName); // automatically becomes current scope
        const result = this._executeLocalComponent(request, true, true); // start run and output
        this.deleteLocalScope(scopeName); // delete scope after execution
        return result;
    }

     /** For executing component scripts we need to have synchronous execution function
     *  Because we don't want to write await $component('name').get() in the code
     *  This is possible only if we use sync methods in the code
     *  In this case that's no problem because we need the internal instances from Component scope for model, metrics, docs, tables
     *  
     *  NOTE: This is run in the local scope, so 'this' is the execution scope
     */
     _executeLocalComponent(request: RunnerScriptExecutionRequest, startRun:boolean=true, output:boolean=true):RunnerScriptExecutionResult|null
     {
         if(!this.loaded())
         { 
             throw new Error(`Runner::_executeLocalComponent(): OpenCascade WASM module not loaded yet`);
         }
             
         console.info(`Runner: Executing script in active local context: "${this._activeScope.name}"`);
         console.info(`* With execution request settings: { params: ${JSON.stringify(request.params)} and outputs: ${JSON.stringify(request.outputs)} }`);

         this._activeExecRequest = request;
         const executeStartTime = performance.now()
 
         const scope = this.getLocalActiveScope();
         const code = request.script.code;
 
         const startRunFunc = (startRun) ? this._executionStartRunInScope : () => {};
         const outputFunc = (output) 
                             ? this.getLocalScopeResultsComponent.bind(this) // <== this is a special sync function only used for Components
                             : () => null; // output or return null
      
         const exec = () =>
         {
             try 
             {
                 return (new Function(  
                         'request',
                         'scope', 
                         'startRunFunc',
                         'outputFunc',
                             // function body
                             `
                             startRunFunc.call(scope, scope, request); // first is this, the rest args
                             // To deal with replaced async functions in old JS enviroments
 
                             // run code in scope
                             with (scope)
                             {
                                 "use strict"; 
                                 ${code};
                             }
                             // export results
                             return outputFunc(scope, request);
             
                             `
                     ))(this._activeExecRequest, scope, startRunFunc, outputFunc) as RunnerScriptExecutionResult;    
             }
             catch(e)
             {
                // Any error while executing code is caught here
                return this._handleExecutionError(scope, this._activeExecRequest, code, e);
             }
         }
 
         const result = exec();
         
         // Set duration if result is RunnerScriptExecutionResult
         if(isRunnerScriptExecutionResult(result))
         {
             result.duration = Math.round(performance.now() - executeStartTime);
         }
 
         // Send message to manager if in worker role
         if(this.role === 'worker')
         {
             this._postMessageToManager({ type: 'executed', payload: result });
         }
 
         return result;
     }

    /* Prefetch component scripts from request script code
        IMPORTANT: How to deal with recursive component imports?
    */
    async _prefetchComponentScripts(request:string|RunnerScriptExecutionRequest, noCache:boolean=false):Promise<Record<string,PublishScript>>
    {
        const IMPORT_COMPONENT_RE = /\$component\(\s*'(?<name>[^,]+)'[^\)]+/g;

        const scriptCode = (typeof request === 'string') 
            ? request : (request as RunnerScriptExecutionRequest).script.code;
        const componentMatches = [...scriptCode.matchAll(IMPORT_COMPONENT_RE)];

        if(componentMatches.length === 0)
        {
            console.info(`Runner::_prefetchComponentScripts(): No component scripts found in request script code`);
            return this._componentScripts; // no components to fetch
        }

        console.info(`Runner::_prefetchComponentScripts(): Found ${componentMatches.length} component scripts to prefetch in request script code`);

        // Fetch all component scripts
        for(let i = 0; i < componentMatches.length; i++)
        {   
            const match = componentMatches[i];
            const name = match.groups?.name?.trim();
            if(!name){ console.warn(`Runner::_prefetchComponentScripts(): Component name not found in match: ${JSON.stringify(match)}`); }

            // Fetch component script
            const componentScript = await this._fetchComponentScript(name);
            if(!componentScript){ console.error(`Runner::_prefetchComponentScripts(): Component script "${name}" not found!`);}

            // Add component script to request
            console.info(`Runner::_prefetchComponentScripts(): Fetched component script and placed in Runners cache "${name}"`);
            this._componentScripts[name] = componentScript; // add to components
            // !!!! TODO: possible recurse with component in component scripts !!!!
        };

        return this._componentScripts; // return all fetched component scripts
    }

    
    /** Fetch component script from url or local file path */
    async _fetchComponentScript(name?:string):Promise<PublishScript>
    {
        if(!name){ throw new Error(`$component("${name}")::_prefetchComponentScript(): Cannot fetch. Component name not set!`);}

        // Local file path (in node)
        if(name.includes('.json'))
        {
            if(!this.inNode())
            {
                throw new Error(`$component("${name}")::_fetchComponentScript(): Cannot fetch component script from local file. Runner is not in Node.js context!`);    
            }

            console.info(`$component("${name}")::_fetchComponentScript(): Fetching local component script at "${name}"...`);
            
            // Load dynamically to avoid issues in browser
            const FS_PROMISES_LIB = 'fs/promises'; // avoid problems with older build systems preparsing import statement
            const fs = await import(FS_PROMISES_LIB); // use promises version of fs
            const data = await fs.readFile(name, 'utf-8');

            if(!data)
            { 
                throw new Error(`$component("${name}")::_fetchComponentScript(): Cannot read component script from file "${name}". File not found or empty!`);
            }
            return JSON.parse(data) as PublishScript; // parse JSON script
        }
        // Remote URL in format like 'archiyou/testcomponent:0.5' or 'archiyou/testcomponent'
        else {
            return await this.getScriptFromUrl(name); // get library instance
        }
    }

    /** Get component from cache in componentScripts */
    getComponentScript(name:string):PublishScript|null
    {
        if(!this._componentScripts[name])
        {
            console.warn(`Runner::getComponentScript(): Component script "${name}" not found in cache`);
            return null;
        }
        return this._componentScripts[name];
    }

    //// EXECUTION UTILS ////

    /** Execute from URL of Archiyou library */
    async executeUrl(url:string, params?:Record<string,ScriptParamData>, outputs?:Array<string>):Promise<RunnerScriptExecutionResult>
    {
        const script = await this.getScriptFromUrl(url);
        if(!script){ throw new Error(`Runner::executeUrl(): Script not found at URL "${url}"`);}


        const request:RunnerScriptExecutionRequest = {
            script: script,
            params: params || Object.values(script.params).reduce((agg, p) => { agg[p.name] = p.default; return agg; }, {}), // use default param values if not provided
            outputs: outputs || this.DEFAULT_OUTPUTS, // default output
        };
        
        console.info(`Runner::executeUrl(): Executing script from URL "${url}" with params ${JSON.stringify(request.params)}`);

        const r = await this.executeInStatements(request); // execute script in active scope
        return r;
    }

    async getScriptFromUrl(url:string):Promise<PublishScript>
    {
        const library = new LibraryConnector();
        return await library.getScriptFromUrl(url); // get script from library
    }

    //// RESULTS ////

    _addMetaToResult(scope, request:RunnerScriptExecutionRequest, result:RunnerScriptExecutionResult):RunnerScriptExecutionResult
    {
        const shapes = scope.geom.all();
        const bbox = shapes.length ? shapes.bbox() : undefined;
        const bboxArr = bbox ? bbox.min().toArray().concat(bbox.max().toArray()) : undefined;

        // Add meta info to result
        result.meta = {
            units: scope.geom._units,
            docs : scope.doc.docs(), // available doc names
            pipelines : scope.geom.getPipelineNames(),  // names of defined pipelines
            tables:scope.calc.getTableNames(), // names of available tables
            metrics : scope.calc.getMetricNames(),
            bbox : bboxArr, 
            numShapes: shapes.length,
        } as ScriptMeta;

        return result;
    }

    /** Get results out of local execution scope  
     *  This function is bound to the scope - so 'this' is the execution scope
     *  If this method is run only if there were no errors during execution
    */
    async getLocalScopeResults(scope:any, request:RunnerScriptExecutionRequest):Promise<RunnerScriptExecutionResult>
    {
        console.info('****Runner::getLocalScopeResults(): Getting results from execution scope ****');
        console.info(`Request outputs:`)
        request.outputs?.forEach(o => console.info(` * ${o}`));
   
        const result = {} as RunnerScriptExecutionResult;

        // Basic data
        result.status = 'success'; // if this method is run, this means no errors were thrown
        result.request = request; // Keep the original request
        result.errors = []; // no errors by definition
        result.duration = scope.geom._duration; // duration of the last operation

        // Basic Archiyou data
        result.scenegraph = scope.geom.scene.toGraph();

        // Meta
        this._addMetaToResult(scope, request, result);
        
        // Outputs (needs to be after meta, because we need that info)
        if(request.outputs)
        {
            result.outputs = await this.getLocalScopeResultOutputs(scope, request, result.meta);
        }
        else {
            throw new Error(`Runner::getLocalScopeResults(): No outputs requested`);
        }


        // Console messages
        if(request.messages && Array.isArray(result.messages))
        {
            result.messages = scope.console.getBufferedMessages(request.messages && []);
        }

        return result;
    }


    /** Get results from local execution scope based on 
     *  request.outputs paths
     *  We gather result by pipeline, because we can have multiple pipelines in the request that need to be run
     *  @scope - execution scope to get results from
     *  @request - execution request with outputs
    */
    async getLocalScopeResultOutputs(scope:any, request:RunnerScriptExecutionRequest, meta:ScriptMeta):Promise<Array<ScriptOutputData>>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request, meta);

        const pipelines = outputManager.getPipelines();

        console.info(`**** Runner::getLocalScopeResultOutputs(): Getting results from execution scope. Requested pipelines: ${pipelines.length ? pipelines.join(',') : 'none'} ****`);

        const outputs = [] as Array<ScriptOutputData>;

        for(let i = 0; i < pipelines.length; i++)
        {
            const pipeline = pipelines[i];
            
            // Default pipeline is already run, only run others
            if(pipeline !== 'default')
            {
                // TODO: run specific pipeline
                console.info(`'Runner::getLocalScopeResultOutputs(): Running extra pipeline: "${pipelines[i]}"`);                
                console.warn(`Runner::getLocalScopeResultOutputs(): Running pipeline "${pipeline}" not implemented yet`);
            }

            // Gather results per pipeline and add to array
            outputs.push(...await this._exportPipelineModels(scope, request, pipeline, meta)); 
            outputs.push(...await this._exportPipelineMetrics(scope, request, pipeline, meta));
            outputs.push(...await this._exportPipelineTables(scope, request, pipeline, meta));
            outputs.push(...await this._exportPipelineDocs(scope, request, pipeline, meta));

        };

        return outputs;
    }    

    /**
     * Get results out of local execution scope synchronously for Components
     * For special cases like importing components we want to avoid async methods  */
    getLocalScopeResultsComponent(scope:any, request:RunnerScriptExecutionRequest):RunnerScriptExecutionResult
    {
        const result = {} as RunnerScriptExecutionResult;

        // Meta
        this._addMetaToResult(scope, request, result);

        // Outputs
        if(request.outputs)
        {
            console.info(`Runner::getLocalScopeResultsComponent(): Getting results from execution scope. Requested outputs: ${request.outputs.join(', ')}`);
            result.outputs = this.getLocalScopeResultOutputsInternal(scope, request, result.meta);
        }
        return result;
    }

        
    /** Export models from given scope, pipeline and using output paths in request.outputs and place in ExecutionResult tree */
    async _exportPipelineModels(scope:any, request:RunnerScriptExecutionRequest, pipeline:string, meta:ScriptMeta):Promise<Array<ScriptOutputData>>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request, meta);
        const outputPaths = outputManager.getOutputsByPipelineCategory(pipeline, 'model') as Array<ScriptOutputPath>;

        const outputs = [] as Array<ScriptOutputData>;

        for(let m = 0; m < outputPaths.length; m++)
        {
            const outputPath = outputPaths[m] as ScriptOutputPath;
        
            switch(outputPath.format as ScriptOutputFormatModel)
            {
                // NOTE: No internal here, use _exportPipelineModelsInternal()
                case 'buffer':
                    outputs.push({ 
                            path: outputPath.toData(),
                            output: scope.geom.scene.toMeshShapeBuffer(),
                        } as ScriptOutputData);
                    break;
                case 'glb':
                    // convert the flat ExecutionRequestOutputFormatGLTFOptions to ExportGLTFOptions (TODO: use one and the same type)
                    const inOptions = outputPath?.formatOptions as ExecutionRequestOutputFormatGLTFOptions;
                    const options = {
                        binary: this.OUTPUT_FORMAT_DEFAULTS.glb.binary, // always binary for now
                        archiyouFormat: inOptions?.data ?? this.OUTPUT_FORMAT_DEFAULTS.glb.data, 
                        // quality leave default
                        archiyouOutput: { 
                            metrics: inOptions?.metrics ?? this.OUTPUT_FORMAT_DEFAULTS.glb.metrics, 
                            docs: inOptions?.docs ?? this.OUTPUT_FORMAT_DEFAULTS.glb.docs, 
                            tables: inOptions?.tables ?? this.OUTPUT_FORMAT_DEFAULTS.glb.tables 
                        },
                        includePointsAndLines: inOptions?.pointAndLines ?? this.OUTPUT_FORMAT_DEFAULTS.glb.pointAndLines, // export points and lines
                        extraShapesAsPointLines: inOptions?.shapesAsPointAndLines ?? this.OUTPUT_FORMAT_DEFAULTS.glb.shapesAsPointAndLines, // export extra shapes as points and lines
                    } as ExportGLTFOptions
                    outputs.push({
                        path: outputPath.toData(),
                        output: await (scope.exporter as Exporter).exportToGLTF(options)
                    });
                    break;
                case 'svg':
                    outputs.push({
                        path: outputPath.toData(),
                        output: scope.exporter.exportToSvg(false)
                    } as ScriptOutputData);
                    break;
                default:
                    console.error(`Runner::_getScopeRunnerScriptExecutionResult(): Skipped unknown model format "${outputPath.format}" in requested output "${outputPath.resolvedPath}"`); 
            }   
        }

        return outputs;
    }


    async _exportPipelineMetrics(scope:any, request:RunnerScriptExecutionRequest, pipeline:string, meta:ScriptMeta):Promise<Array<ScriptOutputData>>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request, meta);
        const outputPathsMetrics = outputManager.getOutputsByPipelineCategory(pipeline, 'metrics') as Array<ScriptOutputPath>;

        // real results
        const outputs = [] as Array<ScriptOutputData>;

        // Check if we need anything to export for current request and pipeline
        if(outputPathsMetrics.length === 0)
        { 
            console.info(`Runner::_exportPipelineMetrics(): No metrics to export`);
            return []; // no metrics to export
        } 

        for (let m = 0; m < outputPathsMetrics.length; m++)
        {
            const outputPathMetric = outputPathsMetrics[m];


            // Now do export
            switch (outputPathMetric.format)
            {
                    case 'json':
                        outputs.push({
                            path: outputPathMetric.toData(),
                            output: scope.calc.toMetricsData(outputPathMetric.entityName) // by name
                        });
                        break;
                    // TODO: more
                    default:
                        throw new Error(`Runner::_getScopeRunnerScriptExecutionResult(): Unknown metric export format "${outputPathMetric.format}"`);
            }
        }
        return outputs;
    }
    
     
    async _exportPipelineTables(scope: any, request: RunnerScriptExecutionRequest, pipeline: string, meta:ScriptMeta): Promise<Array<ScriptOutputData>>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request, meta);
        // All table output paths for this pipeline
        const outputPathsTables = outputManager.getOutputsByPipelineCategory(pipeline, 'tables') as Array<ScriptOutputPath>;
        
        // real table outputs
        const outputs = [] as Array<ScriptOutputData>;

        // Check if we need anything to export for current request and pipeline
        if(outputPathsTables.length === 0)
        { 
            console.info(`Runner::_exportPipelineTables(): No tables to export`);
            return [];
        } 
        
        for (let t = 0; t < outputPathsTables.length; t++)
        {
            const outputPathTable = outputPathsTables[t];
            
            // Now do export
            switch (outputPathTable.format)
            {
                case 'json':
                    outputs.push({
                        path: outputPathTable.toData(),
                        output: scope.calc.toTableData(outputPathTable.entityName) // by name
                    } as ScriptOutputData);
                    break;
                case 'xls':
                    console.warn(`Runner::_exportPipelineTables(): xls export not implemented yet`);
                    break;
                default:
                    throw new Error(`Runner::_getScopeRunnerScriptExecutionResult(): Unknown table export format "${outputPathTable.format}"`);
            }
        };

        return outputs;
    }

    
    async _exportPipelineDocs(scope: any, request: RunnerScriptExecutionRequest, pipeline:string, meta: ScriptMeta): Promise<Array<ScriptOutputData>>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request, meta);
        // All table output paths for this pipeline
        const outputPathsDocs = outputManager.getOutputsByPipelineCategory(pipeline, 'docs') as Array<ScriptOutputPath>;
        // real doc outputs
        const outputs = [] as Array<ScriptOutputData>;

        // Check if we need anything to export for current pipeline and tables
        if(outputPathsDocs.length === 0)
        { 
            console.info(`Runner::_exportPipelineDocs(): No docs to export`);
            return []; // no docs to export
        } 
        
        // Now generate the docs
        for(let d = 0; d < outputPathsDocs.length; d++)
        {
            const outputPathDoc = outputPathsDocs[d];

            // Now do export
            switch (outputPathDoc.format)
            {
                case 'json':
                    outputs.push({
                        path: outputPathDoc.toData(),
                        output: await (scope.doc as Doc).toData(outputPathDoc.entityName) as Record<string, DocData> // by name. TODO: remove name key?
                    });
                    break;
                case 'pdf':
                    const pdfBuffer = await (scope.doc as Doc).toPDF(outputPathDoc.entityName) as ArrayBuffer // single doc name return single result buffer

                    outputs.push({
                        path: outputPathDoc.toData(),
                        output: pdfBuffer as ArrayBuffer
                    });
                    

                    break;
                default:
                        throw new Error(`Runner::_getScopeRunnerScriptExecutionResult(): Unknown doc export format "${outputPathDoc.format}"`);
            }
        };

        return outputs;
    }

  
    //// INTERNAL DATA OUTPUTS FOR USE WITH COMPONENTS ////

    /** Get internal outputs synchronously per pipeline
     *  Iterate from outputs and run pipelines where needed
    */
    getLocalScopeResultOutputsInternal(scope:any, request:RunnerScriptExecutionRequest, meta:ScriptMeta):Array<ScriptOutputData>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request,meta);
        const pipelines = outputManager.getPipelines();

        console.info(`Runner::getLocalScopeResultOutputsInternal(): Getting results from execution scope. Running pipelines: ${pipelines.join(',')}`);

        const outputs = [] as Array<ScriptOutputData>;

        for(let i = 0; i < pipelines.length; i++)
        {
            const pipeline = pipelines[i];
            
            // Default pipeline is already run, only run others
            if(pipeline !== 'default')
            {
                console.info(`Runner::getLocalScopeResultOutputsInternal(): Running extra pipeline: "${pipelines[i]}"`);
                console.error(`Runner::getLocalScopeResultOutputsInternal(): Running pipeline "${pipeline}" not implemented yet`);
                // TODO: run specific pipeline
            }

            // Gather raw results from pipeline
            this._exportPipelineModelsInternal(scope, request, pipeline, meta);
            this._exportPipelineMetricsInternal(scope, request, pipeline, meta);
            this._exportPipelineTablesInternal(scope,request, pipeline, meta);
            this._exportPipelineDocsInternal(scope, request, pipeline, meta);
        };

        return outputs;
    }

    /** Get internal Obj/Shape model data from local execution scope */
    _exportPipelineModelsInternal(scope:any, request:RunnerScriptExecutionRequest, pipeline:string, meta:ScriptMeta):Array<ScriptOutputData>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request,meta);
        const outputPaths = outputManager.getOutputsByPipelineEntityFormats(pipeline, 'model', ['internal']); // get the models to export for current pipeline

        const outputs = [] as Array<ScriptOutputData>;

        for(let i = 0; i < outputPaths.length; i++)
        {
            const outputPath = outputPaths[i];

            outputs.push({
                path: outputPath.toData(),
                output: scope.geom.scene.toComponentGraph(request.component)
            })
        }
        return outputs;
    }

    /** Get internal Metric data from local execution scope and set in result tree */
    _exportPipelineMetricsInternal(scope:any, request:RunnerScriptExecutionRequest, pipeline:string, meta:ScriptMeta):Array<ScriptOutputData>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request,meta);
        const outputPathsForMetrics = outputManager.getOutputsByPipelineEntityFormats(pipeline, 'metrics', ['internal']); // get the metrics to export for current pipeline
        
        const outputs = [] as Array<ScriptOutputData>;

        const metricsToExport = Array.from(new Set(outputPathsForMetrics.map(o => o.entityName))); // get unique metric names
        const metrics = (scope.calc as Calc).getMetrics(metricsToExport);

        metrics.forEach((metric) => 
        {
            // To keep track that this Metric instance came from the component
            metric._component = request?.component;

            const outputPath = outputPathsForMetrics.find(p => p.entityName === metric.name);

            // TODO: test
            outputs.push({
                path: outputPath.toData(),
                output: metric,
            });
        });

        console.info(`Runner::_exportPipelineMetricsInternal(): Exported metrics ${JSON.stringify(outputs)} of Pipeline "${pipeline}"`);

        return outputs;
    }


    /** Get internal Table data from local execution scope and set in result tree */
    _exportPipelineTablesInternal(scope:any, request:RunnerScriptExecutionRequest, pipeline:string, meta:ScriptMeta):Array<ScriptOutputData>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request,meta);
        // Get all table outputs for this pipeline in internal format
        const outputPathsForTables = outputManager.getOutputsByPipelineCategory(pipeline, 'tables') as Array<ScriptOutputPath>;
        
        if(outputPathsForTables.length === 0)
        {
            console.info(`Runner::_exportPipelineTablesInternal(): No tables to export`);
            return []; // no tables to export
        }

        // Filter out doubles
        const outputs = [] as Array<ScriptOutputData>;
        
        outputPathsForTables.forEach((path) => 
        {
            const table = scope.calc.getTable(path.entityName);
            // To keep track that this Table instance came from a component
            table._component = request?.component; // set component name on table instance
            
            outputs.push({
                path: path.toData(),
                output: table // get table by name    
            });

        });

        console.info(`Runner::_exportPipelineTablesInternal(): Exported ${outputs.length} tables of Pipeline "${pipeline}" with output request: "${outputPathsForTables.map(o => o.entityName).join(', ')}"`);

        return outputs;
    }

 
    /** Get internal Doc data from local execution scope and set in result tree */
    _exportPipelineDocsInternal(scope:any, request:RunnerScriptExecutionRequest, pipeline:string, meta:ScriptMeta):Array<ScriptOutputData>
    {
        const outputManager = new ScriptOutputManager().loadRequest(request,meta);
        const outputPathsForDocs = outputManager.getOutputsByPipelineEntityFormats(pipeline, 'docs', ['internal']); // get the docs to export for current pipeline
        const outputs = [] as Array<ScriptOutputData>;

        // what documents to output
        // NOTE: toData() is raw data, we need to export internal data
        
        outputPathsForDocs.forEach((outputPath) => 
        {
            const doc = scope.doc.getDoc(outputPath.entityName)
            // To keep track that this DocDocument instance came from a component
            doc._component = request?.component;
            // Set internal doc data in result in path pipelines/docname/internal
            outputs.push({
                path: outputPath.toData(),
                output: doc
            });
            
        });

        console.info(`Runner::_exportPipelineDocsInternal(): Exported ${outputs.length} docs of Pipeline "${pipeline}" with output request: ${outputPathsForDocs.map(d => d.entityName).join(', ')}`);
        return outputs;
    }

    //// UTILS ////

    inNode():boolean
    {
        return (typeof process !== 'undefined' && process.versions?.node) ? true : false;
    }

    /**
     * Convert a string value to its native type if possible.
     * - "true"/"false" (case-insensitive) => boolean
     * - Numeric strings => number
     * - Otherwise, return as string
     */
    _convertStringValue(value: string): string | number | boolean {
        if (typeof value !== 'string') return value;
        const lower = value.toLowerCase();
        if (lower === 'true') return true;
        if (lower === 'false') return false;
        if (!isNaN(Number(value)) && value.trim() !== '') return Number(value);
        return value;
    }

    /**
    * Returns the longest substring that is both a suffix of str1 and a prefix of str2.
    */
    _stringOverlap(str1: string, str2: string): string 
    {
        let longest = '';
        for (let i = 0; i < str1.length; i++) {
            for (let j = i + 1; j <= str1.length; j++) {
                const substr = str1.slice(i, j);
                if (substr.length > longest.length && str2.includes(substr)) {
                    longest = substr;
                }
            }
        }
        return longest;
    }

    //// BASE 64 ENCODE/DECODE ////
    /*
        If we send anything between scopes, or servers we need to encode binary data
        For use in JSON we use base64 encoding. This operates on instances of ScriptOutputDataWrapper.
        In this wrapper we keep track of encoding and register the type of the original data for easy decoding
    */



}


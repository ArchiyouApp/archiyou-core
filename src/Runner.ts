/**
 *  Archiyou Runner.ts
 *  Easily execute Archiyou scripts in different contexts
 * 
 *  For requesting results we use output paths in RunnerExecutionRequest.outputs:
 *  For example: 
*/
 //      - default/models/glb: get the default model in GLB format with default options
 //      - default/models/dxf?2d: get the default model in DXF format with 2D options
 //      - 'default/docs/*/pdf' // get all documents in PDF format
 //      - [WIP] sketch/tables/*/*  // execute sketch pipeline and get all tables in all formats
 //      - [WIP] */*/*/* // execute all pipelines, all entities and all formats (for example for cache purposes)
 //



import type { ArchiyouApp, ExportGLTFOptions, ArchiyouAppInfo, ArchiyouAppInfoBbox, 
                    Statement, StatementResult, RunnerScriptScopeState, RunnerScript,
 } from "./internal"


import { OcLoader, Console, Geom, Doc, Calc, Exporter, Make, IO, 
            ComputeResult, CodeParser, Library } from "./internal"

import { Point, Vector, Bbox, Edge, Vertex, Wire, Face, Shell, Solid, ShapeCollection, Obj, ParamManager } from "./internal"

import { RunnerComponentImporter } from "./internal"

import { GEOM_METHODS_INTO_GLOBAL, EXECUTE_OUTPUT_MODEL_FORMATS_DEFAULT_ALL,
    EXECUTE_OUTPUT_DOC_FORMATS_DEFAULT_ALL
 } from "./internal" // from constants


import type { RunnerOptions, RunnerExecutionContext, RunnerRole, RunnerScriptExecutionRequest,
                RunnerActiveScope, ModelFormat, RunnerWorkerMessage, RunnerManagerMessage, 
                ExecutionRequestOutputPath, ExecutionRequestOutput, ExecutionResultOutput, ExecutionResultOutputs,
                ExecutionRequestOutputFormat, ExecutionRequestOutputEntityGroup, 
                PublishScript,
                PublishParam} from "./types"

import { isComputeResult } from './typeguards'


export class Runner
{
    ay:ArchiyouApp
    role: RunnerRole // role of the runner: single (single thread), manager or worker
    
    _config: Record<string,any> // environment variables for worker
    _oc: any; // OpenCascade WASM module
    _localScopes: Record<string, any> = {}; // TODO: more specific typing for Proxy
    _activeScope: RunnerActiveScope; // scope in given context (local or worker) and name
    _activeExecRequest: RunnerScriptExecutionRequest;
    
    _manageWorker:Worker|null; // the worker that this runner manages (if role is manager)
    _onWorkerMessageFunc:(m:RunnerWorkerMessage) => any; // function to call when we get a message from the Worker

    //// SETTINGS ////

    LOGGING_DEBUG: boolean = false; // directly log into local console, not that of Archiyou

    //// DEFAULTS ////

    DEFAULT_ROLE: RunnerRole = 'single'
    EXEC_REQUEST_MODEL_FORMAT:ModelFormat = 'glb';

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

    /** Setup communition between manager and worker */
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

    //// SCOPES AND EXECUTION ////

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

        state.print = (m:string) => state.console.log(m);
        state.log = (m:string) => state.console.log(m);
        
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
            console.info(`$component: Importing component: "${name}"`);
            const componentImporter = new RunnerComponentImporter(this, this.getLocalActiveScope(), name, params);
            // Don't execute yet, wait for componentImporter.get()
            return componentImporter;
        }
    }

    //// MANAGING SCOPES 
    
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



    //// Executing scripts

    /** Execute code or script with params in active scope 
     *  @request - string with code or object with script and params
     *  @startRun - reset the scope before running the code
     *  @result - return the result of the execution
    */
    async execute(request: string|RunnerScriptExecutionRequest, startRun:boolean=true, result:boolean=true):Promise<ComputeResult>
    {
        console.info(`\x1b[34m**** Runner::execute(): Executing script "${(request as any)?.script?.name || request}" in role "${this.role}", return result ${result} ****\x1b[0m`);

        // Convert code to request if needed
        if(typeof request === 'string')
        {
                request = { script: { code: request } } as RunnerScriptExecutionRequest;    
        }

        // Check request structure (including params defs and values)
        this._activeExecRequest = this._checkExecRequestAndAddDefaults(request);

        if(this.role === 'worker' || this.role === 'single') // Do the work here
        {
            //return await this._executeLocal(this._activeExecRequest, startRun, result);
            return await this._executeLocal(this._activeExecRequest, startRun, result);
        }
        else if(this.role === 'manager')
        {
            return await this._executeInWorker(this._activeExecRequest);
        }
    }


    async _executeInWorker(request: RunnerScriptExecutionRequest):Promise<ComputeResult>
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
                    resolve(message.payload as ComputeResult); // Resolve the promise with the payload
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

    /** Execute request in statements for easy debugging */
    async executeInStatements(request: RunnerScriptExecutionRequest):Promise<ComputeResult>
    {
        this._activeExecRequest = this._checkExecRequestAndAddDefaults(request);
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

    _checkExecRequestAndAddDefaults(request:RunnerScriptExecutionRequest):RunnerScriptExecutionRequest
    {
        // check params defs and inputs
        this._checkRequestParams(request);

        return {
            modelFormat: this.EXEC_REQUEST_MODEL_FORMAT,
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

        // Params from script definition and values from request
        const params = (request.script.params && typeof request.script.params === 'object' && Object.keys(request.script.params).length > 0) 
            ? Object.values(request.script.params) : [];
        // Make sure we got name in param obj definition too
        params.forEach((pd,i) => 
        {
            const name = Object.keys(request.script.params)[i];
            pd.name = name;
            if(!name){ console.error(`Runner::_executeStartLocalRun(): Param definition without name found: ${JSON.stringify(pd)}`); }	
        });

        const paramValues = (request.params && typeof request.params === 'object' && Object.keys(request.params)) ? request.params : {};
        params.forEach(pd => pd.value = paramValues[pd.name] || pd.default); // set values from request if available
        // NOTE: in paramManager incoming values are validated and set to default if not valid
        console.log(`**** _executeStartLocalRun(): Params: ${JSON.stringify(params)}`);
        
        // Make sure we have param values too (default if not set)
        request.params = params.reduce( (agg,p) => { agg[p.name] = p.value; return agg }, {}); 

        return request;
    }
    

    /** Execute a piece of code or script (and params) in local context 
     *  IMPORTANT: this = execution context
     *  @request - string with code or object with script and params
     *  @startRun - if true a reset is made of the state to prepare for fresh run
     *  @output - if true, the Archiyou state is returned as ComputeResult
     * 
     *  @returns - ComputeResult or null if no output or error string
    */
    async _executeLocal(request: RunnerScriptExecutionRequest, startRun:boolean=true, output:boolean=true):Promise<ComputeResult|null>
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
            
        console.info(`\x1b[34mRunner: Executing script in active local context: "${this._activeScope.name}"\x1b[0m`);
        console.info(`* With execution request settings: { modelFormat: "${this._activeExecRequest.modelFormat}" } *`);
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

        const startRunFunc = (startRun) ? this._executeStartLocalRun : () => {};
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
                    ))(this._activeExecRequest, scope, startRunFunc, outputFunc) as Promise<ComputeResult>|ComputeResult;    
            }
            catch(e)
            {
                // Any error while executing code is caught here
                console.error(`Runner::_executeLocal(): Error while executing code "${code}": "${e}"`);
                return {
                    status: 'error',
                    errors: [{ status: 'error', message: e.message, code: code } as StatementResult],
                } as ComputeResult
            }
        }

        const result = await exec();
        
        // Set duration if result is ComputeResult
        if(isComputeResult(result))
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


    /** Run a execution request (with script, params etc) in individual statements 
     *  This is used for debugging and testing in browser
    */
    async _executeLocalInStatements(request: RunnerScriptExecutionRequest, statementResults:Array<StatementResult>):Promise<ComputeResult>
    {
        const codeParser = new CodeParser(request.script.code, {}, null); // TODO: config, IO => archiyou?
        const statements = await codeParser.getStatements();
        
        let result:ComputeResult;

        console.info(`\x1b[34mRunner::_executeLocalInStatements(): Executing script in ${statements.length} statements in active local context: "${this._activeScope?.name}"\x1b[0m`);

        for(let s = 0; s < statements.length; s++)
        {
            const statementStartTime = performance.now()
            const statement = this._preprocessStatement({ ...statements[s] });
            const output = (s === statements.length -1); // only output on last statement
            const r = await this.execute(
                { 
                    ...request, // take from main request
                    script: {  
                        code: statement.code,  // only statement code
                        params: request.script.params || {} // use params from request
                    },
                } as RunnerScriptExecutionRequest, 
                (s === 0), 
                output
            ); // only start run on first and return result on last

            const statementDuration = Math.round(performance.now() - statementStartTime);
            if(r?.status === 'error') // r can be null
            {
                console.error(`\x1b[31m !!!! Runner::_executeLocalInStatements(): ***** ERROR: "${r.errors[0].message}" in following statement @${statement.lineStart}-${statement.lineEnd}} !!!! \x1b[0m`);
                console.error(statement.code);

                statementResults.push({ 
                    ...statement,
                    status: 'error',
                    message: r.errors[0].message, // add error message to statement result
                    duration: statementDuration 
                }); 
            }
            
            console.info(`Runner::_executeLocalInStatements(): Statement #${s+1} - ${output ? 'with' : 'without'} output] executed in ${statementDuration}ms`);
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

    /** For executing component scripts we need to have synchronous execution function
     *  This is possible only if we use sync methods in the code
     *  We only allow export methods of raw (which have data already available by definition)
     *  IMPORPTANT: This is run in the local scope, so 'this' is the execution scope
     */
    _executeLocalSync(request: RunnerScriptExecutionRequest, startRun:boolean=true, output:boolean=true):ComputeResult|null
    {
        if(!this.loaded())
        { 
            throw new Error(`Runner::_executeLocalSync(): OpenCascade WASM module not loaded yet`);
        }
            
        console.info(`Runner: Executing script in active local context: "${this._activeScope.name}"`);
        console.info(`* With execution request settings: { params: ${request.params} , 
                        modelFormat: "${this._activeExecRequest.modelFormat}" }*`);

        this._activeExecRequest = request;
        const executeStartTime = performance.now()

        const scope = this.getLocalActiveScope();
        const code = request.script.code;

        const startRunFunc = (startRun) ? this._executeStartLocalRun : () => {};
        const outputFunc = (output) 
                            ? this.getLocalScopeResultsSync.bind(this) // bind to this
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
                    ))(this._activeExecRequest, scope, startRunFunc, outputFunc) as ComputeResult;    
            }
            catch(e)
            {
                // Any error while executing code is caught here
                console.error(`Runner::_executeLocal(): Error while executing code: "${e}" : ${e.stack}`);
                return {
                    status: 'error',
                    errors: [{ status: 'error', message: e.message, code: code } as StatementResult],
                } as ComputeResult
            }
        }

        const result = exec();
        
        // Set duration if result is ComputeResult
        if(isComputeResult(result))
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



    /** Setup for every execution run 
     *  IMPORTANT: This is run inside the execution scope - so 'this' is the execution scope
    */
    _executeStartLocalRun(scope:any, request: RunnerScriptExecutionRequest):void
    {
        // Setup ParamManager
        console.info(`Runner::_executeStartLocalRun()[in execution context]: Setting up ParamManager in scope with params "${JSON.stringify(request.script.params)}"`);
                
        // TODO: ParamManager takes array of Params. Make consistent
        const params = (typeof request.script.params === 'object') ? Object.values(request.script.params) : []; // defs with values from request.params
        scope.ay.paramManager = new ParamManager(params).setParent(scope); // sets globals in setParent()
        scope.$PARAMS = scope.ay.paramManager;

        // Reset some modules
        scope.ay.geom.reset(); // reset before we begin
        scope.ay.doc.reset();
        scope.ay.calc.reset();
        scope.ay.beams?.reset();
        scope.ay.gizmos = [];
    }

    /** Get results out of local execution scope  
     *  This function is bound to the scope - so 'this' is the execution scope
    */
    async getLocalScopeResults(scope:any, request:RunnerScriptExecutionRequest):Promise<ComputeResult>
    {
        console.info('\x1b[32m****Runner::getLocalScopeResults(): Getting results from execution scope ****\x1b[0m');
        console.info(`\x1b[32mRequest outputs:\x1b[0m`)
        request.outputs?.forEach(o => console.info(`\x1b[32m * ${o}\x1b[0m`));
   
        const result = {} as ComputeResult;

        // New request outputs
        if(request.outputs)
        {
            result.outputs = await this.getLocalScopeResultOutputs(scope, request);
        }
        // BACKWARDS COMPATIBILITY: Old request outputs
        else 
        {
       
            switch(request.modelFormat)
            {
                case 'buffer': // TODO: raw
                    result.meshBuffer = scope.geom.scene.toMeshShapeBuffer(request.modelSettings);
                    break;
                case 'glb':
                    result.meshGLB = await scope.exporter.exportToGLTF(request?.modelFormatOptions as ExportGLTFOptions); 
                    break;
                case 'svg':
                    result.svg = scope.exporter.exportToSvg(false); // get SVG isometry
                    break;
                default:
                    throw new Error(`Runner::_getScopeComputeResult(): Unknown model format "${request.modelFormat}"`);
            }
        }

        this._addAppInfoToResult(scope, request, result); // add app info to result
        
        // Other data
        result.status = 'success'; 
        result.scenegraph = scope.geom.scene.toGraph();
        result.docs = (request.docs) ? await scope.doc.toData() : undefined,
        result.pipelines = scope.geom.getPipelineNames(),  // names of defined pipelines
        result.tables = scope.calc?.toTableData(); 
        result.metrics =  scope.calc?.metrics();
        result.managedParams = scope.ay.paramManager.getOperatedParamsByOperation();        

        return result;
    }

    /** For special cases we need only sync  */
    getLocalScopeResultsSync(scope:any, request:RunnerScriptExecutionRequest):ComputeResult
    {
        console.info('Runner::getLocalScopeResultsSync(): Getting results from execution scope');
   
        const result = {} as ComputeResult;

        // New request outputs
        if(request.outputs)
        {
            result.outputs = this.getLocalScopeResultOutputsSync(scope, request);
        }

        console.log(JSON.stringify(scope.geom.scene.toGraph()));
      
        this._addAppInfoToResult(scope, request, result); // add app info to result
        
        // Other data
        result.scenegraph = scope.geom.scene.toGraph();
        result.pipelines = scope.geom.getPipelineNames(),  // names of defined pipelines
        result.tables = scope.calc?.toTableData(); 
        result.metrics =  scope.calc?.metrics();
        result.managedParams = scope.ay.paramManager.getOperatedParamsByOperation();        

        return result;
    }

    /** Set archiyou app info on result */
    _addAppInfoToResult(scope:any, request:RunnerScriptExecutionRequest, result:ComputeResult):ArchiyouAppInfo
    {
        const shapes = scope.geom.all();
        const bbox = shapes.length ? shapes.bbox() : undefined;
        const sceneBbox = bbox ? { min: bbox.min().toArray(), max: bbox.max().toArray() } as ArchiyouAppInfoBbox : undefined;

        result.info = {
            units: scope.geom._units,
            numShapes: shapes.length,
            bbox: sceneBbox,
            hasDocs: scope.doc.hasDocs(),
        } as ArchiyouAppInfo;

        return result.info;
    }
    

    /** New method for running specific pipelines and gettings outputs 
     *  Using request.outputs
    */
    async getLocalScopeResultOutputs(scope:any, request:RunnerScriptExecutionRequest):Promise<ExecutionResultOutputs>
    {
        const requestedOutputs = this._parseRequestOutputPaths(request.outputs);
        const pipelines = Array.from(new Set(requestedOutputs.map(o => o.pipeline))); // pipelines to run

        console.info(`\x1b[32m**** Runner::getLocalScopeResultOutputs(): Getting results from execution scope. Running pipelines: ${pipelines.join(',')} ****\x1b[0m`);

        const resultTree = { state: {}, pipelines: {}} as ExecutionResultOutputs;

        for(let i = 0; i < pipelines.length; i++)
        {
            const pipeline = pipelines[i];
            
            // Default pipeline is already run, only run others
            if(pipeline !== 'default')
            {
                console.info(`'\x1b[32mRunner::getLocalScopeResultOutputs(): Running extra pipeline: "${pipelines[i]}"\x1b[0m`);
                // TODO: run specific pipeline
                console.warn(`'\x1b[31mx1b[0mRunner::getLocalScopeResultOutputs(): Running pipeline "${pipeline}" not implemented yet\x1b[0m`);
            }

            // Gather results from pipeline
            await this._exportModels(scope, request, pipeline, resultTree); 
            await this._exportDocs(scope, request, pipeline, resultTree);
            await this._exportTables(scope, request, pipeline, resultTree);
        };

        return resultTree;
    }

    /** Some outputs we can get synchronously
     *  This is used for running component scripts
     */
    getLocalScopeResultOutputsSync(scope:any, request:RunnerScriptExecutionRequest):ExecutionResultOutputs
    {
        const requestedOutputs = this._parseRequestOutputPaths(request.outputs);
        const pipelines = Array.from(new Set(requestedOutputs.map(o => o.pipeline))); // pipelines to run

        console.info(`Runner::getLocalScopeResultOutputs(): Getting results from execution scope. Running pipelines: ${pipelines.join(',')}`);

        const resultTree = { state: {}, pipelines: {}} as ExecutionResultOutputs;

        for(let i = 0; i < pipelines.length; i++)
        {
            const pipeline = pipelines[i];
            
            // Default pipeline is already run, only run others
            if(pipeline !== 'default')
            {
                console.info(`Runner::getLocalScopeResultOutputs(): Running extra pipeline: "${pipelines[i]}"`);
                console.warn(`Runner::getLocalScopeResultOutputs(): Running pipeline "${pipeline}" not implemented yet`);
                // TODO: run specific pipeline
            }

            // Gather results from pipeline
            // We can use this sync - but some export methods are async
            this._exportModelsSyncRaw(scope, request, pipeline, resultTree); 
            // TODO: export docs and tables
        };

        return resultTree;
    }
    

    /** Parse output paths to create  */
    _parseRequestOutputPaths(outputs:Array<ExecutionRequestOutputPath>):Array<ExecutionRequestOutput>
    {
        const requestOutputs = [] as Array<ExecutionRequestOutput>;
        outputs.forEach((outputPath) => 
        {   
            const pathParts = outputPath.split('/');

            const isModel = outputPath.includes('model');
            // default pipeline form: model/glb or docs/*/pdf
            if((isModel && pathParts.length === 2) || (!isModel && pathParts.length === 3)) 
            {
                pathParts.unshift('default'); // add default pipeline 
            }

            if((isModel && pathParts.length !== 3) || !isModel && pathParts.length !== 4)
            { 
                console.error(`Runner::_parseRequestOutputPaths(): Malformed output path "${outputPath}". Format should be {pipeline}/{model}/{format} or {pipeline}/{docs|tables}/{name}/{format}`);
                return; // abort
            }	

            const pipeline = pathParts[0];
            const entityGroup = pathParts[1]; 
            const entityName = (!isModel) ? pathParts[2] : null; // name of entity or * (not used for model)
            let outputFormat = pathParts[pathParts.length - 1]; // last part is the output format
            const optionsString = outputFormat.split('?')[1] || ''; // options are in the last part of the path
            if(outputFormat.includes('?')){ outputFormat = outputFormat.split('?')[0];} // remove options from format
            const options = optionsString.split('?').reduce((agg,v) => 
                { 
                    if(v.length === 0){ return agg; } // skip empty values
                    agg[v.split('=')[0]] = agg[v.split('=')[1]] || true; 
                    return agg
                }, {})

            requestOutputs.push(
                {
                    path : outputPath,
                    pipeline: pipeline,
                    entityGroup: entityGroup,
                    entityName: entityName,
                    outputFormat: outputFormat,
                    options: options    
                } as ExecutionRequestOutput
            );
        });

        return requestOutputs;
    }

    
    /** Export models from given scope using paths in request.outputs and place in ExecutionResult tree */
    async _exportModels(scope:any, request:RunnerScriptExecutionRequest, pipeline:string, result:ExecutionResultOutputs):Promise<ExecutionResultOutputs>
    {
        const outputs = this._parseRequestOutputPaths(request.outputs)
                        .filter(o => o.entityGroup === 'model' && o.pipeline === pipeline); // filter for models

        for(let i = 0; i < outputs.length; i++)
        {
            const output = outputs[i];
            const pipelineResultModel = this._checkResultForModelsOutputs(result, output); // check if we need to create a new model entry in the result tree
            
            const outputFormats = (output.outputFormat === '*') ? EXECUTE_OUTPUT_MODEL_FORMATS_DEFAULT_ALL : [output.outputFormat];

            for(let j = 0; j < outputFormats.length; j++)
            {
                const format = outputFormats[j];
                console.info(`Runner::_exportModels(): Exporting "${output.path}" with export in format: "${format}"`);

                switch(format)
                {
                    case 'raw':
                        pipelineResultModel.raw = { options: output.options, data:  scope.geom.scene }; // Obj instance with all hierarchy - imported to current scope
                    case 'buffer':
                        pipelineResultModel.buffer = { options: output.options, data:  scope.geom.scene.toMeshShapeBuffer(request.modelSettings) };
                        break;
                    case 'glb':
                        pipelineResultModel.glb = { options: output.options, data:  await scope.exporter.exportToGLTF(request?.modelFormatOptions as ExportGLTFOptions) }; 
                        break;
                    case 'svg':
                        pipelineResultModel.svg = { options: output.options, data:  scope.exporter.exportToSvg(false) }; // get SVG isometry
                        break;
                    default:
                        console.error(`Runner::_getScopeComputeResult(): Skipped unknown model format "${output.outputFormat} in requested output "${output.path}"`); 
                }
            }
        }
        return result;
    }

    /** Check structure of result for pipeline 
     *  and return reference to entry where results can be placed */
    _checkResultForModelsOutputs(result:ExecutionResultOutputs, output:ExecutionRequestOutput): Partial<Record<ExecutionRequestOutputFormat,ExecutionResultOutput>>
    {
        let pipelineResult = result.pipelines[output.pipeline];
        if(pipelineResult === undefined)
        { 
            result.pipelines[output.pipeline] = { model : {} }; 
            pipelineResult = result.pipelines[output.pipeline]; 
        }
        const pipelineResultModel = pipelineResult.model;
        return pipelineResultModel;
    }

    /** For component we need to export raw but synchronous 
     *  because there is no await in script execution scope */
    _exportModelsSyncRaw(scope:any, request:RunnerScriptExecutionRequest, pipeline:string, result:ExecutionResultOutputs):ExecutionResultOutputs
    {
        const outputs = this._parseRequestOutputPaths(request.outputs)
                        .filter(o => o.entityGroup === 'model' && o.pipeline === pipeline); // filter for models

        for(let i = 0; i < outputs.length; i++)
        {
            const output = outputs[i];
            const pipelineResultModel = this._checkResultForModelsOutputs(result, output); // check if we need to create a new model entry in the result tree
            
            pipelineResultModel.raw = { options: output.options, data: scope.geom.scene.toComponentGraph(request.component) }; // data tree with raw shapes - to be recreated in main scope scene
            
        }

        return result;
    }
    
 
    async _exportDocs(scope: any, request: RunnerScriptExecutionRequest, pipeline:string, result: ExecutionResultOutputs): Promise<ExecutionResultOutputs> 
    {
        const EXPORT_FORMATS = ['raw', 'pdf'];

        let outputs = this._parseRequestOutputPaths(request.outputs)
                            .filter(o => o.entityGroup === 'docs' && o.pipeline === pipeline); // filter for docs
        
                            // checks and warnings
        outputs.forEach((o,i) => {
            if(!EXPORT_FORMATS.includes(o.outputFormat))
            {
                console.warn(`\x1b[31m !!!! Runner::_exportDocs(): Skipped unknown doc format "${o.outputFormat}" in requested output "${o.path}"\x1b[0m !!!!`); 
            }
        })
        outputs = outputs.filter(o => EXPORT_FORMATS.includes(o.outputFormat)); // filter for docs

        // Check if we need anything to export for current request and pipeline
        if(outputs.length === 0)
        { 
            console.info(`Runner::_exportDocs(): No docs to export`);
            return result; // no docs to export
        } 

        // Check and setup result data structure 
        let pipelineResult = result.pipelines[pipeline];
        if (pipelineResult === undefined)
        {
            result.pipelines[pipeline] = { docs: {} };
            pipelineResult = result.pipelines[pipeline];
        }
        else (pipelineResult.docs === undefined)
        {
            pipelineResult.docs = {};   
        }
        const pipelineResultDocs = pipelineResult.docs;
        
        // Now generate the docs
        // Docs are exported at the same time per format
        for(let f =0; f < EXPORT_FORMATS.length; f++)
        {
            const format = EXPORT_FORMATS[f];
            let onlyDocNames = Array.from(new Set(outputs.filter(o => o.outputFormat === format).map(o => o.entityName))); // get unique doc names

            if(onlyDocNames.length > 0) // if user requested this format
            {
                // if * is present, all docs are selected
                if(onlyDocNames.includes('*')){ onlyDocNames = []; } // if * is present, all docs are selected

                // Some sanity checks - if user requested a doc name that does not exist give a warning
                onlyDocNames.forEach((docName) => {
                    if(!scope.doc.docs().includes(docName))
                    {
                        console.warn(`\x1b[31mRunner::_exportDocs(): Skipped export of doc "${docName}" in format "${format}" because it does not exist!\x1b[0m`);
                    }
                });                

                // Now do export
                switch (format)
                {
                    case 'raw':
                        const docsRawByName = await scope.doc.toData(onlyDocNames);
                        this._setFormatResults(pipelineResultDocs,docsRawByName, format); // set results in pipeline result tree
                        break;
                    case 'pdf':
                        const docsPdfByName = await scope.doc.toPDF(onlyDocNames);
                        this._setFormatResults(pipelineResultDocs,docsPdfByName, format);
                        break;
                    default:
                        throw new Error(`Runner::_getScopeComputeResult(): Unknown doc export format "${format}"`);
                }
            }
            
        };

        return result;
    }
    
    async _exportTables(scope: any, request: RunnerScriptExecutionRequest, pipeline: string, result: ExecutionResultOutputs): Promise<ExecutionResultOutputs> 
    {
        
        const EXPORT_FORMATS = ['raw', 'xls'];

        const outputs = this._parseRequestOutputPaths(request.outputs).filter(o => o.pipeline === pipeline && o.entityGroup === 'tables'); // filter for tables

        // Check if we need anything to export for current request and pipeline
        if(outputs.length === 0)
        { 
            console.info(`Runner::_exportDocs(): No tables to export`);
            return result; // no docs to export
        } 

        // Check result data structure 
        let pipelineResult = result.pipelines[pipeline];
        if (pipelineResult === undefined)
        {
            result.pipelines[pipeline] = { tables: {} };
            pipelineResult = result.pipelines[pipeline];
        }
        else (pipelineResult.tables === undefined)
        {
            pipelineResult.tables = {};   
        }
        const pipelineResultTables = pipelineResult.tables;
        
        // Tables are exported at the same time per format
        for(let f =0; f < EXPORT_FORMATS.length; f++)
        {
            const format = EXPORT_FORMATS[f];
            let onlyTableNames = Array.from(new Set(outputs.filter(o => o.outputFormat === format).map(o => o.entityName))); // get unique doc names

            if(onlyTableNames.length > 0)
            {
                // if * is present, all docs are selected
                if(onlyTableNames.includes('*')){ onlyTableNames = []; } // if * is present, all docs are selected
                // Now do export
                switch (format)
                {
                    case 'raw':
                        const tablesRawByName = scope.calc.toTableData();
                        this._setFormatResults(pipelineResultTables,tablesRawByName, format); // set results in pipeline result tree
                        break;
                    case 'xls':
                        console.warn(`Runner::_exportTables(): xls export not implemented yet`);
                        break;
                    default:
                        throw new Error(`Runner::_getScopeComputeResult(): Unknown doc export format "${format}"`);
                }
            }
            
        };

        return result;
    }

    // TODO: metrics

    _setFormatResults = (resultGroup:Record<string,any>, resultsByName:Record<string,any>, format:ExecutionRequestOutputFormat) => 
    {
        Object.keys(resultsByName || {}).forEach((docName) =>
        {   
            if(!resultGroup[docName]){ resultGroup[docName] = {}; resultGroup[docName][format] = {}; }
            resultGroup[docName][format] = { options: {}, data: resultsByName[docName] }; // TODO: do we need options? Rewrite needed if so
        });
    }

    //// EXECUTION COMPONENT SCRIPTS ////

    /** Execute a component script in a seperate scope
     *  This is always done in local context 
     *   because executing components comes from within execution scope and context
     *   IMPORTANT: Because we need to wait for it, this needs to be synchonous, 
     *   using await in execution scope does work, but is ugly. 
     */
    _executeComponentScript(request:RunnerScriptExecutionRequest): ComputeResult
    {
        this.createScope('component'); // automatically becomes current scope

        const result = this._executeLocalSync(request, true, true); // start run and output
        this.deleteLocalScope('component'); // delete scope after execution
        return result;
    }

    //// EXECUTE FROM ARCHIYOU LIBRARY ////
    async executeUrl(url:string, params?:Record<string,PublishParam>, outputs?:Array<ExecutionRequestOutputPath>):Promise<ComputeResult>
    {
        const script = await this.getScriptFromUrl(url);
        if(!script){ throw new Error(`Runner::executeUrl(): Script not found at URL "${url}"`);}


        const request:RunnerScriptExecutionRequest = {
            script: script,
            params: params || Object.values(script.params).reduce((agg, p) => { agg[p.name] = p.default; return agg; }, {}), // use default param values if not provided
            outputs: outputs || ['default/model/glb'], // default output
        };
        
        console.log(`Runner::executeUrl(): Executing script from URL "${url}" with params ${JSON.stringify(request.params)}`);

        const r = await this.executeInStatements(request); // execute script in active scope
        return r;
    }

    async getScriptFromUrl(url:string):Promise<PublishScript>
    {
        const library = new Library();
        return await library.getScriptFromUrl(url); // get script from library
    }

    //// UTILS ////

    inNode():boolean
    {
        return (typeof process !== 'undefined' && process.versions?.node) ? true : false;
    }


}


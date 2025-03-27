/**
 *  Archiyou Runner.ts
 *  Easily execute Archiyou scripts in different contexts
 * 
 */


import type { ArchiyouApp, ExportGLTFOptions, ArchiyouAppInfo, ArchiyouAppInfoBbox, StatementResult } from "./internal"

import { OcLoader, Console, Geom, Doc, Calc, Exporter, Make, IO, ComputeResult, CodeParser } from "./internal"

import { Point, Vector, Bbox, Edge, Vertex, Wire, Face, Shell, Solid, ShapeCollection, ParamManager } from "./internal"

import { GEOM_METHODS_INTO_GLOBAL } from "./internal" // from constants


import type { RunnerOptions, RunnerExecutionContext, RunnerRole, RunnerScriptExecutionRequest,
                RunnerActiveScope, ModelFormat, RunnerWorkerMessage, RunnerManagerMessage } from "./types"

import { isComputeResult } from './typeguards'


export class Runner
{
    ay:ArchiyouApp
    role: RunnerRole // role of the runner: single (single thread), manager or worker
    
    _config: Record<string,any> // environment variables for worker
    _oc: any; // OpenCascade WASM module
    _localScopes: Record<string, any> = {}; // TODO: more specific typing for Proxy
    _activeScope: RunnerActiveScope;
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

        if(this.role === 'worker' || this.role === 'single')
        {
            this._localScopes[name] = new Proxy({ ...BASIC_SCOPE, ...state }, 
            {
                has: () => true, // Allows access to any variable (avoids ReferenceError)
                get: (target, key) => target[key], // Retrieves values from scope
                set: (target, key, value) => {
                    target[key] = value; // Stores values inside scope
                    return true;
                }
            });
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
    buildLocalExecScopeState():Record<string,any>
    {
        const state = {};

        // Archiyou base modules like geom, doc, calc, make etc
        Object.assign(state, { ay: this.initLocalArchiyou()});

        // Add Archiyou modules as globals in execution scope state object
        this._addModulesToScopeState(state);
        // Modeling basics into state
        this._addModelingMethodsToScopeState(state)

        return state;
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
            make: new Make()
        } as ArchiyouApp

        // TODO: Improve providing all Archiyou modules to to modules themselves
        ay?.doc?.setArchiyou(ay);
        ay?.exporter?.setArchiyou(ay);
        ay?.make?.setArchiyou(ay);
        ay?.beams?.setArchiyou(ay); // Not there currently

        return ay;
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

    //// Managing scopes 
    
    /** Select a scope */
    scope(name:string):this
    {
        if(!this._localScopes[name]){ throw new Error(`Runner:: scope(): Scope "${name}" does not exist`)}
        this._activeScope = { name: name, context: 'local' };

        return this;
    }

    getLocalScope(name:string):ProxyConstructor
    {
        if(!this._localScopes[name]){ throw new Error(`Runner:: scope(): Scope "${name}" does not exist`)}
        return this._localScopes[name];
    }

    //// Executing scripts

    /** Execute code or script with params in active scope 
     *  @request - string with code or object with script and params
     *  @startRun - reset the scope before running the code
     *  @result - return the result of the execution
    */
    async execute(request: string|RunnerScriptExecutionRequest, startRun:boolean=true, result:boolean=true):Promise<ComputeResult|string>
    {
        // Convert code to request if needed
        if(typeof request === 'string')
        {
                request = { script: { code: request } } as RunnerScriptExecutionRequest;    
        }

        this._activeExecRequest = this._checkExecRequestAndAddDefaults(request);

        if(this.role === 'worker' || this.role === 'single') // Do the work here
        {
            //return await this._executeLocal(this._activeExecRequest, startRun, result);
            return this._executeLocal(this._activeExecRequest, startRun, result);
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
        return {
            modelFormat: this.EXEC_REQUEST_MODEL_FORMAT,
            ...request
        }
    }

    /** Execute a piece of code or script (and params) in local context 
     *  @request - string with code or object with script and params
     *  @startRun - if true a reset is made of the state to prepare for fresh run
     *  @output - if true, the Archiyou state is returned as ComputeResult
     * 
     *  @returns - ComputeResult or null if no output or error string
    */
    async _executeLocal(request: RunnerScriptExecutionRequest, startRun:boolean=true, output:boolean=true):Promise<ComputeResult|null|string>
    {
        if(!this.loaded())
        { 
            console.warn(`Runner::_executeLocal(): OpenCascade WASM module not loaded yet. The request is executed once it is!`);

            return new Promise((resolve, reject) => {
                const checkLoaded = () => {
                    if (this.loaded()) {
                        resolve(this._executeLocal(request, startRun, output)); // Resolve the promise when loaded() is true
                    } else {
                        setTimeout(checkLoaded, 100); // Check again after the interval
                    }
                };
                checkLoaded();
            });
        }
            
        console.info(`Runner: Executing script in active local context: "${this._activeScope.name}"`);
        console.info(`* With execution request settings: { modelFormat: "${this._activeExecRequest.modelFormat}" } *`);

        this._activeExecRequest = request;
        const executeStartTime = performance.now()

        // In older apps AyncFunction is not available because await/async are replaced on buildtime
        // This is pretty OK, instead that in the dynamic function underneath the awaits are not replaced
        // Resulting in error: "await is only valid in async function"
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

        const scope = this._localScopes[this._activeScope.name];
        const code = request.script.code;

        const startRunFunc = (startRun) ? this._executeStartRun : () => {};
        const outputFunc = (output) ? this.getLocalScopeResults : async () => null; // output or return null
     

        const exec = async () =>
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
                            execute = () =>
                            { 
                                    "use strict"; 
                                    try {
                                        ${code};
                                    }
                                    catch(e)
                                    {
                                        console.exec('Runner::executeLocal(): Error code script execution:' + e);
                                        return e.toString();
                                    }
                            };
                            execute.bind(scope);
                            execute();
                        }
                        // export results
                        
                        // detect if everything is OK and this is indeed a AsyncFunction - otherwise it is Function
                        asyncOutput = outputFunc.constructor.name === 'AsyncFunction'; 
                        return (asyncOutput) 
                                       ? Promise.resolve(outputFunc.call(scope, scope, request)) // avoid await keyword - again for Webpack 4
                                       : outputFunc.call(scope, scope, request);
        
                        `
                ))(this._activeExecRequest, scope, startRunFunc, outputFunc);    
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

        console.info(`Runner::_executeLocalInStatements(): Executing script in ${statements.length} statements in active local context: "${this._activeScope.name}"`);

        for(let s = 0; s < statements.length; s++)
        {
            const statementStartTime = performance.now()
            const statement = statements[s];
            const output = s === statements.length -1; // only output on last statement
            const r = await this.execute(statement.code, (s === 0), output); // only start run on first and return result on last
            const statementDuration = Math.round(performance.now() - statementStartTime);
            if(typeof r === 'string')
            {
                statementResults.push({ 
                    ...statement,
                    status: 'error',
                    message: r,
                    duration: statementDuration 
                }); // Error
            }
            else {
                console.info(`Runner::_executeLocalInStatements(): Statement "${statement.code.slice(0,50) }]" [index:${s+1} - ${output ? 'with' : 'without'} output] executed in ${statementDuration}ms`);
                result = r;
            }
        }

        return result
    }

    /** Setup for every execution run 
     *  This is run inside the execution scope
    */
    _executeStartRun(scope:any, request: RunnerScriptExecutionRequest):void
    {
        // Setup ParamManager
        console.info(`Runner::_executeStartRun()[in execution context]: Setting up ParamManager in scope`);
        const params = (Array.isArray(request.script.params) && request.script.params.length) ? Object.values(request.script.params) : [];
        scope.ay.paramManager = new ParamManager(params).setParent(scope);
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
        console.info('Runner::getLocalScopeResults(): Getting results from execution scope');
   
        const result = {} as ComputeResult;

        // Models
        switch(request.modelFormat)
        {
            case 'buffer':
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
        
        // Other data
        result.scenegraph = scope.geom.scene.toGraph();
        result.docs = (request.docs) ? await scope.doc.toData() : undefined,
        result.pipelines = scope.geom.getPipelineNames(),  // names of defined pipelines
        result.tables = scope.calc?.toTableData(); 
        result.metrics =  scope.calc?.metrics();
        result.managedParams = scope.ay.paramManager.getOperatedParamsByOperation();

        // TODO: Move this function somewhere else?
        const getInfo = () => {
            const shapes = scope.geom.all();
            const bbox = shapes.length ? shapes.bbox() : undefined;
            const sceneBbox = bbox ? { min: bbox.min().toArray(), max: bbox.max().toArray() } as ArchiyouAppInfoBbox : undefined;
    
            return {
                units: scope.geom._units,
                numShapes: shapes.length,
                bbox: sceneBbox,
                hasDocs: scope.doc.hasDocs(),
            } as ArchiyouAppInfo;
        }
        result.info = getInfo();


        return result;
    }

    


}
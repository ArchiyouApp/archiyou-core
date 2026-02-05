import { Runner, Script, ScriptOutputManager, ScriptOutputPath, } from './internal';

import type { RunnerScriptExecutionRequest, 
            RunnerScriptScopeState, Obj, PublishScript, 
            ImportComponentResult, ImportComponentResultPipelines } from './internal';


/**
 *   Exists in script execution scope
 *   And gathers all information needed to execute a component script 
 *   and return specific results
 * 
 *   Executing component script and getting result (async/sync)
 *      Script execution is async, but we want to avoid using 
 *      "await $component(...).get(...)" which is not user friendly
 *      
 *      Because internal data (the model Obj/Shapes, table data and doc instances)
 *      are by definition always directly available in the scope    
 *      We can avoid async by using the sync execution method "Runner._executeLocalSync"
 *      RunnerComponentImporter.get() => Runner._executeComponentScript => Runner._executeLocalSync
 * 
 *   How components work with RunnerComponentImporter class
 *   
 *   1. Runner preprocesses any $component(<<script>>, <<params>>) statements: loads them and caches in Runner._componentScripts
 *       This is needed because we need to wait until async fetching of scripts is done 
 *         before we can synchronous execute script, get results out and use them in main script scope
 * 
 *      argument <<script>> can point to a script in various ways:
 *      - $component("{{author}}/{{scriptname}}:{{version}}") or $component("{{author}}/{{scriptname}}")
 *         => Gets script from default library (probably https://lib.archiyou.com)
 *      - $component("https://lib.notarchiyou.com/myorg/myscript")
 *          => Get script from external archiyou library
 *      - $component("./scripts/test.js") 
 *          => Get script from local path: relative or absolute (need for .js extension)( possibly later .ts)
 *      - $component(script:ScriptData)
 *          => Directly use script data 
 * 
 *
 *   2. Main Execution: The main script is executed within its scope. 
 *         $component(..) refer to the RunnerComponentImporter constructor
 *         So every $component(...) statement creates and returns an RunnerComponentImporter instance
 *          This component importer instance has access to Runner instance and main execution scope 
 * 
 *   3. Executing the component script with params and getting results
 *       $component(<<script>>) just loads the script and creates the component importer instance
 *       Execution takes two steps (like all scripts):
 *          a. plug in param values: $component("test").params({ size: 100 })
 *          b. execute with request for outputs:
 *              - .pipeline(<<pipeline>>) - if only single pipeline, select it. default = "default"
 *              - .model() - get the model (ShapeCollection) for single pipeline (mostly default)
 *                  $component("test").params({ size: 100 }).model() ==> get model from (default or single) pipeline
 *              - .get(<<output(s)>>)
 *                  get anything out (various pipelines, various entities) using output paths. 
 *                  Results by output path. So you can use destructing assignment:
 *                   const { "default/model" : mainModel, "cnc/model" : cncModel, "cnc/tables/parts" : cncPartsTable } = $component("test").get(["default/model", "cnc/model", "cnc/tables"]);
 * 
 *              - .all(): Get all outputs of pipeline (set with .pipeline() or "default")
 *                          returns { model, docs, tables, metrics }
 *
 *   4. Using component results
 *          Any results that $component(...).model()/get() etc returns are internal entities
 *          either ShapeCollection, Doc, Table, Metric that can be read and merged with others
 * 
 *          Use a wall component:
 *              myWall = $component("wall").params({ size: 100 }).model();
 *              // now use it as any other ShapeCollection
 *              myWall.align(otherMainWall, 'leftfront', 'rightfront'); 
 * 
 *          Merge a document of component:
 *          
 *           { "default/docs/spec" : myWallDoc } = $component("wall").params({ size: 100 }).get("default/docs/spec")
 *           // main document
 *           doc('mainDoc')
 *              .page('cover page')
 *              .title('MyProject')
 *              .merge(myWallDoc) // add all pages of myWallDoc to current Doc
 *              ..
 *      
 *      NOTE: 
 *          - no entity names, just entire instances: 
 *               - no "default/docs/somespecial" => just return Doc module instance
 *               - tables => Db instance
 *               these instances have inspection/selection functionality
 *          
 * 
 */
export class RunnerComponentImporter
{
    //// SETTINGS ////
    DEFAULT_OUTPUTS = ['default/model/internal']; 

    ////  END SETTINGS ////
    
    _runner:Runner;
    _scope:RunnerScriptScopeState; // main scope to import into
    ref:string; // reference. Can be url, or inline code
    label:string; // nice label
    _params:Record<string,any>;
    _pipeline:string = 'default'; // if single pipeline
    options:Record<string,any>; // TODO
    script?:PublishScript; // script to execute - will be fetched from library or from disk
    _requestedOutputs:Array<string> = [];  // requested outputs

    
    constructor(runner:Runner, scope:RunnerScriptScopeState,  ref:string)
    {
        this._runner = runner; // tied to runner
        this._scope = scope; // main scope to import into
        this.ref = ref; // name of the component ('archiyou/testcomponent:0.5')
        this.label = this.generateName();
    }

    /** Set param values before execution */
    params(params?: Record<string, any>): this
    {
        if(typeof params !== 'object')
        {
            throw new Error(`$component("${this.label}")::params(): Invalid params object. Please supply something like { param1: val1, param2: val2 }`);
        }
        this._params = params || {};
        return this;
    }

    /** Set single pipeline to get outputs from */
    pipeline(p:string): this
    {
        if(typeof p !== 'string')
        {
            throw new Error(`$component("${this.label}")::pipeline(): Invalid pipeline string. Please supply a valid pipeline string.`);
        }
        this._pipeline = p;
        return this;
    }

    /** 
     *  Get outputs from component script execution
     *   This will enable the user to get specific outputs from the component:
     *      - any pipeline
     *      - any category: model, docss, tables, metrics 
     *  
     *  @param p - path or array of paths to requested outputs (like 'default/model', 'cnc/model')  
     * 
     *  Components only work with internal data, so we always get 'internal' format
     *  
     *  Some simplications: 
     *      - no other formats than 'internal'
     *      - we export internal categories like 'model', 'docs', 'tables', 'metrics' directly as module instances
     *          : no specific entities like 'docs/report'
     *      - if only one output path given (for example 'default/model') return that directly
     * 
     *  See RunnerComponentImporter.model() for easy way of getting model
     *  
     * */
    get(p:string|Array<string>): ImportComponentResult
    {
        if (typeof p === 'string') p = [p]; // convert to array if string

        const outputPaths = p.map((path) =>
        {
            const outputPathObj = new ScriptOutputPath(path).internalize();
            if(!outputPathObj.checkValid())
            {
                console.warn(`$component("${this.label}")::get(): Invalid output path requested: "${path}". Skipping this output.`);
                return undefined;
            }
            return outputPathObj.resolvedPath;

        }).filter(path => path !== undefined); // remove undefined paths

        this._requestedOutputs = outputPaths;

        console.info(`$component("${this.label}")::get(): Requested outputs:"${this._requestedOutputs.join(',')}"`);

        return this._getAndExecute();
    }

    /** Shortcut method for getting model from single pipeline */
    model(): ImportComponentResult 
    {
        return this.get(`${this._pipeline}/model/internal`);
    }

    /** Shortcut method for getting everything of single/default pipeline */
    all(): ImportComponentResult
    {
        return this.get([
            `${this._pipeline}/model/internal`,
            `${this._pipeline}/tables/*/internal`,
            `${this._pipeline}/docs/*/internal`,
            `${this._pipeline}/metrics/*/internal`,
        ]);
        // TODO: flatten results to { model, tables, docs, metrics }
    }

   
    /** Really get the script and execute in seperate component scope */
    _getAndExecute():ImportComponentResult
    {
        if(!this._runner){ throw new Error('ImportComponentController::_execute(): Runner not set!');}
        
        const script = this._getComponentScript();
    
        if(!script)
        {
            throw new Error(`$component("${this.label}")::_getAndExecute(): Cannot find component script in Runner.componentScripts cache. Make sure the component is loaded and available.`);
        }
        return this._executeComponentScript(script); // execute script in seperate component scope
    }

    /** Execute component script with params and requested outputs
     *  @param script - Script to execute
     *  @param params - parameters to pass to the script
     *  @returns Promise<ImportComponentResult> - result of the execution
     */
    _executeComponentScript(script:Script):ImportComponentResult
    {
        const request:RunnerScriptExecutionRequest = {
            script: script,
            component: this.label, // scope identifier
            params: this.params,
            outputs: (this._requestedOutputs.length === 0) ? this.DEFAULT_OUTPUTS : this._requestedOutputs,
        };

        this._runner._checkRequestAndAddDefaults(request); // check request and add defaults if needed

        console.info(`$component("${this.label}")::_executeComponentScript(): Executing component script with outputs: "${request.outputs.join(',')}"`);
        
        const r = this._runner._executeComponentScript(request);
        
        // Check for errors
        if(r.status === 'error')
        {
            throw new Error(`$component("${this.label}")::_executeComponentScript(): Error executing component script: ${r.errors.join('; ')}`);
        }

        //// TODO: 
        // Continue gathering results
        /* Check how we can flatten the result:
            - check how many pipelines
            - if single output
            - if multiple outputs
        */
        const outputManager = new ScriptOutputManager().fromResult(r); // tie outputs to path objects too 

        // First make total tree, then apply shortcuts (if any)
        let result = {} as ImportComponentResult; 
        
        outputManager.getPipelines().forEach(pl => 
        {
            outputManager.getOutputsByPipeline(pl)
            .forEach( outPathObj =>
            {
                if(!result[pl]){ result[pl] = {} as ImportComponentResultPipelines };
                const pipelineResult = result[pl]; // reference
                // All outputs are grouped together (no specific entities like 'docs/report')
                // Make data directly available (flatten path and _output structure)
                pipelineResult[outPathObj.category] = outPathObj._output;

                // Special import for model category - recreate Obj tree in main scope
                if(outPathObj.category === 'model' && outPathObj._output)
                {
                    console.info(`$component("${this.label}")::_executeComponentScript(): Recreating component Obj tree in main scope for pipeline "${pl}"...`);
                    const recreatedObj = this._recreateComponentObjTree(outPathObj._output as Object);
                    pipelineResult['model'] = recreatedObj.shapes(true); // result is ShapeCollection of all shapes in the Obj tree
                    console.info(`$component("${this.label}")::_executeComponentScript(): Recreated component Obj tree in main scope for pipeline "${pl}".`);
                }
            });
        });

        // Flatten result if possible
        if(outputManager.getPipelines().length === 1)
        {
            const singlePipeline = outputManager.getPipelines()[0];
            result = result[singlePipeline];   
            // only one result
            if(outputManager.getOutputsByPipeline(singlePipeline).length === 1)
            {
                const singleOutput = outputManager.getOutputsByPipeline(singlePipeline)[0];
                result = result[singleOutput.category];
                const resultType = result?.constructor?.name || typeof result;
                console.info(`$component("${this.label}")::_executeComponentScript(): Returning single output of category "${singleOutput.category}" with result of type "${resultType}".`);
            }
        }
        
        return result;

    }

     /** Get component script from Runners cache (in Runner.componentScripts) */
    _getComponentScript():Script|null
    {
        return this._runner.getComponentScriptFromCache(this.ref);
    }

    /** We need to recreate the component object tree into the current scope */
    _recreateComponentObjTree(tree:Object, parentObj?:Obj):Obj
    {
        console.info(`$component("${this.label}")::_recreateComponentObjTree(): Recreating component object tree...`);
        const mainScope = this._scope;

        const curNode = tree as Object as any; // TODO: TS typing
        const newObj = new mainScope.Obj(); // create Geom Obj container 
        newObj.name((curNode as any).name);
        // IMPORTANT: Shapes are still tied to Geom of component scope - change that
        newObj._updateShapes(curNode.shapes.map(s => { s._brep = mainScope.brep; return s; })); 

        console.info(`$component("${this.label}")::_recreateComponentObjTree(): Recreated object "${newObj.name()}" with ${newObj.shapes(false).length} shapes`);
        
        // is root
        if(!parentObj)
        {
            mainScope.brep.scene.add(newObj);
        }
        else {
            parentObj.add(newObj); // add to parent
        }

        // iterate children
        if (curNode.children && curNode.children.length > 0)
        {
            curNode.children.forEach((childNode) => {
                this._recreateComponentObjTree(childNode, newObj); // pass new object as parent
            });
        }
        
        return newObj;
    }

    //// UTILS ////

    /** Either directly name, or is a code a label with snippet */
    generateName()
    {
        return (Script.isProbablyCode(this.ref)) 
                    ? `<<inline code>>:${this.ref.trim().replace(/\s+/g, ' ').substring(0,20)}...`
                    : this.ref;
    }

}


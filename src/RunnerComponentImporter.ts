import { Runner, Script, ScriptOutputManager, ScriptOutputPath, } from './internal';

import type { RunnerScriptExecutionRequest, 
            RunnerScriptScopeState, Obj, PublishScript, 
            ImportComponentResult, ImportComponentResultPipelines } from './internal';


/**
 *  Exists in script execution scope
 *   And gathers all information needed to execute a component script 
 *   and return specific results
 * 
 *   Executing component script and getting result (async/sync)
 *      Script execution is async, but we want to avoid using 
 *      "await $component(...).get(...)" which is not user friendly
 *      
 *      Because all the export functions for raw data (the model Obj/Shapes, table data and doc instances)
 *      that is by definition always available in the scope    
 *      We can get away with introducing a sync execution method
 *      RunnerComponentImporter.get() => Runner._executeComponentScript => Runner._executeLocalSync
 *      
 *  Some usage examples based on get and shortcuts methods model() and all():
 * 
 *    - leftWall = $component("test/wall", { LENGTH: 300, HEIGHT: 250 }).model() // default pipeline model Obj  
 *    ==> same as: $component("test/wall", { LENGTH: 300, HEIGHT: 250 }).get('default/model')
 *    - cutShapes = $component("test/box", { WIDTH: 100, DEPTH: 100 }).get('cnc/model')  
 *    - { model: wallShape, docs: wallDocs, tables: wallTables } = $component("test/wall", { }).all()
 *    ==> same as: $component("test/wall", { }).get('default/model','default/tables', 'default/docs', 'default/metrics')
 * 
 * 
 */
export class RunnerComponentImporter
{
    //// SETTINGS ////
    DEFAULT_OUTPUTS = ['default/model/internal']; 

    ////
    
    _runner:Runner;
    _scope:RunnerScriptScopeState; // main scope to import into
    name:string;
    params:Record<string,any>;
    options:Record<string,any>; // TODO
    script?:PublishScript; // script to execute - will be fetched from library or from disk
    _requestedOutputs:Array<string> = [];  // requested outputs

    
    constructor(runner:Runner, scope:RunnerScriptScopeState,  name:string, params?:Record<string,any>)
    {
        this._runner = runner; // tied to runner
        this._scope = scope; // main scope to import into
        this.name = name; // name of the component ('archiyou/testcomponent:0.5')
        this.params = params || {}; // parameters for the component
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
                console.warn(`$component("${this.name}")::get(): Invalid output path requested: "${path}". Skipping this output.`);
                return undefined;
            }
            return outputPathObj.resolvedPath;

        }).filter(path => path !== undefined); // remove undefined paths

        this._requestedOutputs = outputPaths;

        console.info(`$component("${this.name}")::get(): Requested outputs:"${this._requestedOutputs.join(',')}"`);

        return this._getAndExecute();
    }

    /** Shortcut method for getting model */
    model(): ImportComponentResult 
    {
        // TODO: add pipeline arg
        return this.get('default/model/internal');
    }

    /** Shortcut method for getting everything of default pipeline */
    all(): ImportComponentResult
    {
        // TODO: add pipeline arg
        return this.get(['default/model/internal', 'default/metrics/*/internal', 'default/tables/*/internal', 'default/docs/*/internal']);
    }

   
    /** Really get the script and execute in seperate component scope */
    _getAndExecute():ImportComponentResult
    {
        if(!this._runner){ throw new Error('ImportComponentController::_execute(): Runner not set!');}
        
        const script = this._getComponentScript();
    
        if(!script)
        {
            throw new Error(`$component("${this.name}")::_getAndExecute(): Cannot find component script in Runner.componentScripts cache. Make sure the component is loaded and available.`);
        }
        
        return this._executeComponentScript(script); // execute script in seperate component scope
    }

    /** Execute component script with params and requested outputs
     *  @param script - PublishScript to execute
     *  @param params - parameters to pass to the script
     *  @returns Promise<ImportComponentResult> - result of the execution
     */
    _executeComponentScript(script:Script):ImportComponentResult
    {
        const request:RunnerScriptExecutionRequest = {
            script: script,
            component: this.name,
            params: this.params,
            outputs: (this._requestedOutputs.length === 0) ? this.DEFAULT_OUTPUTS : this._requestedOutputs,
        };

        this._runner._checkRequestAndAddDefaults(request); // check request and add defaults if needed

        console.info(`$component("${this.name}")::_executeComponentScript(): Executing component script with outputs: "${request.outputs.join(',')}"`);
        
        const r = this._runner._executeComponentScript(request);
        
        // Check for errors
        if(r.status === 'error')
        {
            throw new Error(`$component("${this.name}")::_executeComponentScript(): Error executing component script: ${r.errors.join('; ')}`);
        }

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
                    console.info(`$component("${this.name}")::_executeComponentScript(): Recreating component Obj tree in main scope for pipeline "${pl}"...`);
                    const recreatedObj = this._recreateComponentObjTree(outPathObj._output as Object);
                    pipelineResult['model'] = recreatedObj.shapes(true); // result is ShapeCollection of all shapes in the Obj tree
                    console.info(`$component("${this.name}")::_executeComponentScript(): Recreated component Obj tree in main scope for pipeline "${pl}".`);
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
                console.info(`$component("${this.name}")::_executeComponentScript(): Returning single output of category "${singleOutput.category}" with result of type "${resultType}".`);
            }
        }
        
        return result;

    }

     /** Get component script from Runners cache (in Runner.componentScripts) */
    _getComponentScript():Script|null
    {
        return this._runner.getComponentScript(this.name)
    }

    /** We need to recreate the component object tree into the current scope */
    _recreateComponentObjTree(tree:Object, parentObj?:Obj):Obj
    {
        console.info(`$component("${this.name}")::_recreateComponentObjTree(): Recreating component object tree...`);
        const mainScope = this._scope;

        const curNode = tree as Object as any; // TODO: TS typing
        const newObj = new mainScope.Obj(); // create Geom Obj container 
        newObj.name((curNode as any).name);
        // IMPORTANT: Shapes are still tied to Geom of component scope - change that
        newObj._updateShapes(curNode.shapes.map(s => { s._brep = mainScope.brep; return s; })); 

        console.info(`$component("${this.name}")::_recreateComponentObjTree(): Recreated object "${newObj.name()}" with ${newObj.shapes(false).length} shapes`);
        
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
}


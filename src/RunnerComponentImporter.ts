import { Runner } from './internal';
import type { RunnerScriptExecutionRequest, 
            RunnerScriptScopeState, Obj, PublishScript, 
            ImportComponentResult } from './internal';


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
 *      
 * 
 */
export class RunnerComponentImporter
{
    //// SETTINGS ////
    DEFAULT_OUTPUTS = ['models/raw']; 

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

    /** This trigger actual script execution
     *  based on data in this instance of RunnerComponentImporter
     *  @param p - path or array of paths to requested outputs (like 'model', 'cnc/model')  
     * 
     *  Components only work with internal data, so we always get 'internal' format
     *  
     * */
    get(p:string|Array<string>)
    {
        if (typeof p === 'string') p = [p]; // convert to array if string

        // what to get 
        // 'model' => 'default/models/internal'
        // 'docs' => 'default/docs/*/internal'
        // or default/docs/spec/internal
        const outputPaths = p.map((path) =>
        {
            console.log(path.split('/'));
            // For get we have some simpler paths - like 'model', 'docs', 'tables', 'metrics'
            // TODO: Manage output paths in a more generic way
            if(path.split('/').length === 1 && ['model', 'docs', 'tables', 'metrics'].includes(path))
            {
                if(path === 'model') return `default/${path}/internal`;
                else return `default/${path}/*/internal`; // 'docs/*' or 'tables/*' or 'metrics/*'
            }
            // Append format'internal' with paths like 'docs/spec' or 'tables/*' or 'models/cnc'
            else if(path.split('/').length === 2)
            {
                return `default/${path}/internal`; // 'docs/spec/internal' or 'tables/*/internal'
            }
            // TODO: correct wrong formats like 'cnc/model/dxf' or 'cnc/tables/*/xlsx'


        }).filter(path => path !== undefined); // remove undefined paths

        
        this._requestedOutputs = this._requestedOutputs.concat(outputPaths);

        console.log(`$component("${this.name}")::get(): Requested outputs:"${this._requestedOutputs.join(',')}"`);

        return this._getAndExecute();
    }
   
    /** Really get the script and execute in seperate scope */
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

    /** Get component script from Runners cache (in Runner.componentScripts) */
    _getComponentScript():PublishScript|null
    {
        return this._runner.getComponentScript(this.name)
    }

    /** Execute component script with params and requested outputs
     *  @param script - PublishScript to execute
     *  @param params - parameters to pass to the script
     *  @returns Promise<ImportComponentResult> - result of the execution
     */
    _executeComponentScript(script:PublishScript):ImportComponentResult
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
        
        // We get a normal ExecutionResult here, convert to a more simpler ImportComponentResult
        // With only raw data per pipeline name
        if(r.status === 'error')
        {
            return { status: 'error', errors: r.errors, component: this.name, outputs: {}};
        }

        // Basic structure for result from Component 
        const result:ImportComponentResult = {
                status: r.status,
                errors: r.errors,
                component: this.name,
                outputs: {},
                model: undefined,
                metrics: {},
                tables: {},
                docs: {}
            };

        const singlePipeline = (Object.keys(r.outputs.pipelines).length === 1)  
                                    ? Object.keys(r.outputs.pipelines)[0] 
                                    : Object.keys(r.outputs.pipelines).find((k) => k === 'default') 
                                        ? 'default' : null;
                                    
        const allPipelines = Object.keys(r.outputs.pipelines);

        console.info(`$component("${this.name}")::get(): Got result with pipelines:"${allPipelines.join(',')}. The main pipeline is "${singlePipeline}". Access results of default pipeline with .model, .tables, .docs, .metrics. Or use .{pipelinename}.model for specific pipeline`);

        allPipelines.forEach((pipelineName) => 
        {
            let resultTarget = result[pipelineName]; 
            if(resultTarget === undefined){  resultTarget = result[pipelineName] = {} as ImportComponentResult;}
        
            // We need to recreate the component scene hierarchy and shapes in main scope
            // TODO: check results
            resultTarget.model = this._recreateComponentObjTree(r.outputs.pipelines[pipelineName].model.internal.data);
            // Other outputs by name of document, metric, table etc
            resultTarget.metrics = r.outputs.pipelines[pipelineName]?.metrics || {}; 

            console.log(`==== METREICS FOR PIPELINE ${pipelineName} ====`);
            console.log(JSON.stringify(resultTarget.metrics));

            resultTarget.tables = Object.keys(r.outputs.pipelines[pipelineName]?.tables || {}).reduce((agg,v) => { agg[v] = r.outputs.pipelines[pipelineName].tables[v].internal.data; return agg }, {});
            resultTarget.docs = Object.keys(r.outputs.pipelines[pipelineName]?.docs || {}).reduce((agg,v) => { agg[v] = r.outputs.pipelines[pipelineName].docs[v].internal.data; return agg}, {});
            
            // default on main level result object
            if(pipelineName === 'default' || pipelineName === singlePipeline)
            {
                result.model = resultTarget.model;
                result.metrics = resultTarget.metrics;
                result.tables = resultTarget.tables;
                result.docs = resultTarget.docs;
            }

        });

        return result;

    }


    _recreateComponentObjTree(tree:Object, parentObj?:Obj):Obj
    {
        console.info(`$component("${this.name}")::_recreateComponentObjTree(): Recreating component object tree...`);
        const mainScope = this._scope;

        const curNode = tree as Object as any; // TODO: TS typing
        const newObj = new mainScope.Obj(); // create Geom Obj container 
        newObj.name((curNode as any).name);
        // IMPORTANT: Shapes are still tied to Geom of component scope - change that
        newObj._updateShapes(curNode.shapes.map(s => { s._geom = mainScope.geom; return s; })); 

        console.info(`$component("${this.name}")::_recreateComponentObjTree(): Recreated object "${newObj.name()}" with ${newObj.shapes(false).length} shapes`);
        
        // is root
        if(!parentObj)
        {
            mainScope.geom.scene.add(newObj);
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


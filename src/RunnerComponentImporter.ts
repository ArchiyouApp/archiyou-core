import { Runner } from './internal';
import type { RunnerScriptExecutionRequest, PublishParam, RunnerScriptScopeState, Obj } from './internal';

/**
 *  Exists in script execution scope
 *   And gathers all information needed to execute a component script 
 *   and return specific results
 * 
 */
export class RunnerComponentImporter
{
    //// SETTINGS ////
    DEFAULT_OUTPUTS = ['models/raw']

    ////
    
    _runner:Runner;
    _scope:RunnerScriptScopeState; // main scope to import into
    name:string;
    params:Record<string,any>;
    options:Record<string,any>; // TODO
    _requestedOutputs:Array<string> = [];  // requested outputs

    

    constructor(runner:Runner, scope:RunnerScriptScopeState,  name:string, params?:Record<string,any>)
    {
        this._runner = runner; // tied to runner
        this._scope = scope; // main scope to import into
        this.name = name; // name of the component ('archiyou/testcomponent:0.5')
        this.params = params || {}; // parameters for the component
    }

    /** Really get the script and execute in seperate scope 
     *  Because we can't use await inside a script this needs to be synchronous
    */
    _execute():ImportComponentResult
    {
        // TODO: fetch real script
        const TEST_COMPONENT_SCRIPT = {
            code: `p = plane($SIZE)`,
            params: { size: { type: 'number', default: 100 } as PublishParam }, // TODO: get from component
        };
        if(!this._runner){ throw new Error('ImportComponentController::_execute(): Runner not set!');}

        const request:RunnerScriptExecutionRequest = {
            script: TEST_COMPONENT_SCRIPT,
            component: this.name,
            outputs: (this._requestedOutputs.length === 0) ? this.DEFAULT_OUTPUTS : this._requestedOutputs,
        };
        
        const r = this._runner._executeComponentScript(request);
        
        // We do some simplication turning ComputeResult into ImportComponentResult
        // If we only have one pipeline we set models, tables, docs, metrics directly on result
        // Other pipelines are set on result by name. i.e. cnc/models, cnc/tables etc

        if(r.status === 'error')
        {
            return { status: 'error', errors: r.errors, component: this.name , model: {}, tables: {}, docs: {} };
        }

        const result:ImportComponentResult = {
                status: r.status,
                errors: r.errors,
                component: this.name,
            };

        const singlePipeline = (Object.keys(r.outputs.pipelines).length === 1)  
                                    ? Object.keys(r.outputs.pipelines)[0] 
                                    : Object.keys(r.outputs.pipelines).find((k) => k === 'default') 
                                        ? 'default' : null;
                                    
        const allPipelines = Object.keys(r.outputs.pipelines);

        console.info(`$component("${this.name}")::get(): Got result with pipelines:"${allPipelines.join(',')}. The main pipeline is "${singlePipeline}". Access results with .model, .tables, .docs, .metrics`);

        allPipelines.forEach((pipelineName) => 
        {
            let resultTarget = (pipelineName === singlePipeline) ? result : result[pipelineName]; // set single on result instance 
            if(resultTarget === undefined){  resultTarget = result[pipelineName] = {} as ImportComponentResult;}
        
            // We need to recreate the component scene hierarchy and shapes in main scope
            resultTarget.model = this._recreateComponentObjTree(r.outputs.pipelines[pipelineName].model.raw.data);
            resultTarget.tables = Object.keys(r.outputs.pipelines[pipelineName]?.tables || {}).reduce((agg,v) => agg[v] = r.outputs.pipelines[pipelineName].tables[v].raw.data, {});
            resultTarget.docs = Object.keys(r.outputs.pipelines[pipelineName]?.docs || {}).reduce((agg,v) => agg[v] = r.outputs.pipelines[pipelineName].docs[v].raw.data, {});
            // TODO: metrics
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

    /** Request certain outputs based on execution output paths */
    get(p:string|Array<string>)
    {
        if (typeof p === 'string') p = [p]; // convert to array if string

        // very simple inputs like 'model' => 'default/models/raw'
        const outputPaths = p.map((path) =>
        {
            if(path.split('/').length === 1 && ['model', 'tables', 'docs'].includes(path))
            {
                return `default/${path}/raw`;
            }
        }).filter(path => path !== undefined); // remove undefined paths
        
        this._requestedOutputs = this._requestedOutputs.concat(outputPaths);

        console.log(`$component("${this.name}")::get(): Requested outputs:"${this._requestedOutputs.join(',')}"`);

        return this._execute();
    }

}

/** Results of component execution */
export interface ImportComponentResult
{
    status?:'success'|'error'; // status of the execution
    errors?:Array<any>; // errors if any
    component?:string // name of component
    model?:Record<string,any>; // default pipeline model data
    tables?:Record<string,any>; // default pipeline tables data
    docs?:Record<string,any>; // default pipeline documents data
    // non-default pipilines are set on object dynamically
    // cnc/model, cnc/tables etc
}
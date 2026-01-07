/**
 *  Pipeline.ts
 *      Define a series of operations on shapes for specific purposes. 
 *      Like making cutting plans or different representations of the model.
 *      Able to run automatically or manually
 *          
 *      To create a pipeline in a script. Example:
 *         
 *      $pipeline('<<unique name>>', async function(mainScope) => 
 *      { 
 *          // User defined pipeline function
 *          iso = mainScope.someShape.iso(); // Make some isometric view
 *          
 *          await calc.gsheets.fromTemplate(...); // IMPORTANT: use await is essential here!
 * 
 *          // RETURN: after pipeline is done, results are taken from pipeline scope
            // If no return value is given the current state within the pipeline scope is outputted
            // (which is the scene root Obj)
            // When one Shape or ShapeCollection is returned this is used as state (TODO)
 *      })
 * 
 *      
 *     NOTES:
 *          - SCOPE: a Pipeline is mostly executed after the main part of the script, so it's executed in the main scope 
 *                  We want to avoid that it adds to the global scope - otherwise other pipeline might pick it up and it will be confusing
 *          - SYNC/ASYNC: a function given to a pipeline can be sync/async - be careful when using async methods in its body:
 *               await is needed, otherwise the pipeline is done before asynchonous results are in 
 *          - INLINE FUNCTION DEFINITIONS:
 *                    TODO: () => { ...} versus function() { ... }
 *       
 *     TODO:
 *          - Can we do away with the distinction between sync/async for ease of use for the user?
 *          - Pipelines can only defined inside main scope: Protect against this
 *          - Currently pipelines are one-way and independent - consider allowing pipelines to call other pipelines?
 *
 */ 

import { ShapeCollection, Brep } from './internal'
import { analyzeFunc } from './internal'
import { PIPELINE_VALID_NAMES } from './internal' // from typeguards.ts

//// SETTINGS ////


export class Pipeline
{
    //// SETTINGS ////
    
    //// END SETTINGS ////

    _oc; // is set in constructor prototype when Brep once OC is loaded - IMPORTANT: Don't assign here!
    _brep:Brep; // also set on Pipeline prototype when making Brep
    name:string;
    _shapes:ShapeCollection
    _function:() => ShapeCollection


    /** Create a Pipeline */
    constructor(name?:string)
    {   
        this.name = name;
    }

    /** Things for the pipeline to do
     *   NOTE: the given function is executed in the WebWorker global scope, 
     *   IMPORTANT: While previously defined variables from the main script scope are accessible,
     *              it is STRONGLY ADVISED to only use variables defined within the pipeline function itself,
     *              or passed as arguments to it. This avoids unexpected behavior due to variable scope issues.
     *   
     */
    do(fn:() => ShapeCollection):this
    {
        if (typeof fn === 'function')
        {
            this._function = fn;
            
            // Some IMPORTANT warnings about how pipelines work based on the function analysis
            const funcInfo = analyzeFunc(fn);
            if(funcInfo.argCount === 0)
            {
                console.warn(`Pipeline::do(): Pipeline "${this.name}": The pipeline function has no arguments. 
                It is strongly advised to define at least one argument (mainScope) 
                to ensure proper access to the script's main scope.
                Relying on external variables can lead to unexpected behavior.`);
            }
            if(!funcInfo.hasMainScopeParam)
            {
                console.warn(`Pipeline::do(): Pipeline "${this.name}": You don't seem to use a mainScope reference.
                    Please only access variables from main scope using this mainScope argument to avoid issues!
                    Use: function(mainScope) { ... } and access shapes via mainScope.someShape ...`);
            }
            if(funcInfo.argCount > 1)
            {
                console.warn(`Pipeline::do(): Pipeline "${this.name}": You have defined multiple arguments in your pipeline function.
                    It is strongly advised to only use one argument (mainScope) to ensure proper access to the script's main scope.
                    Relying on external variables can lead to unexpected behavior.`);
            }
            

            return this;
        }
        else {
            throw new Error(`pipeline.execute(fn): Please supply a function with structure fn(shapes) => shapes to pipeline!`);
        }
    }

    /** Run pipeline and get a ShapeCollection back */
    run():ShapeCollection
    {
        if(!this._function)
        {
            throw new Error(`pipeline.run(): No pipeline function defined. Use myPipeline.set(fn)`);
        }
        return this._function();
    }

}

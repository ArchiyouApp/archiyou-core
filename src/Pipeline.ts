/**
 *  Pipeline.ts
 *      Define a series of operations on shapes for specific purposes. 
 *      Like making cutting plans or different representations of the model.
 *      Able to run automatically or manually
 * 
 *      For now a pipeline is just a simple function that is run when needed.
 *      Later we can add structure to it (layout, annotate etc)
 */ 

import { Point, Vector, PointLike, isPointLike, ShapeCollection, Shape, Vertex, Edge, Wire, Face, Geom, isPipelineType } from './internal'
import { PIPELINE_VALID_NAMES } from './internal' // from typeguards.ts

//// SETTINGS ////


export class Pipeline
{
    //// SETTINGS ////
    
    //// END SETTINGS ////

    _oc; // is set in constructor prototype when Geom once OC is loaded - IMPORTANT: Don't assign here!
    _geom:Geom; // also set on Pipeline prototype when making Geom
    name:string;
    _shapes:ShapeCollection
    _function:() => ShapeCollection


    /** Create a Pipeline */
    constructor(name?:string)
    {   
        if(isPipelineType(name))
        {
            this.name = name;
            return this;
        }
        else {
            throw new Error(`pipeline(name): Pipeline names can be any of these: ${PIPELINE_VALID_NAMES.join('","')}`);
        }
    }

    /** Things for the pipeline to do
     *   NOTE: the given function is executed in the WebWorker global scope, 
     *   this means previous variables are available
     */
    does(fn:() => ShapeCollection):this
    {
        if (typeof fn === 'function')
        {
            this._function = fn;
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

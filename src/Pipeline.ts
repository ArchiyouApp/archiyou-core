/**
 *  Pipeline.ts
 *      Define a series of operations on shapes for specific purposes. 
 *      Like making cutting plans or different representations of the model.
 *      Able to run automatically or manually
 * 
 *      Pipeline have a common structure:
 *          - assemble
 *          - layout (including disassemble)
 *          - annotate
 *          - process - process shapes
 *          - [ pages ]
 *          - [ toolpaths ]
 */ 

import { Point, Vector, PointLike, isPointLike, ShapeCollection, Shape, Vertex, Edge, Wire, Face, Geom } from './internal'
import { AnyShape,  AnyShapeOrCollection, Layout } from './internal'
import { gp_Ax3, gp_Trsf, gp_Pnt } from '../libs/archiyou-opencascade/archiyou-opencascade'
import { checkInput } from './decorators' // NOTE: needs to be direct

import { FACE_CIRCLE_RADIUS, FACE_PLANE_WIDTH, FACE_PLANE_DEPTH } from './internal' // Face

//// SETTINGS ////


interface PipelineAnnotate
{
    // TODO
}


export class Pipeline
{
    //// SETTINGS ////
    
    //// END SETTINGS ////

    _oc; // is set in constructor prototype when Geom once OC is loaded - IMPORTANT: Don't assign here!
    _geom:Geom; // also set on Pipeline prototype when making Geom
    name:string;
    _shapes:ShapeCollection


    /** Create a Pipeline */
    constructor(name:string)
    {   
        this.name = name;
    }

    /** Select shapes that go into the Pipeline */
    @checkInput('AnyShapeOrCollection', 'ShapeCollection')
    shapes(shapes:AnyShapeOrCollection)
    {
        this._shapes = shapes as ShapeCollection; // auto converted
        return this;
    }

    /** Disassemble and layout in a given order */
    layout(layout:Layout):Pipeline
    {
        // TODO
        return this;
    }

    /** Annotate shapes */
    annotate(options:PipelineAnnotate):Pipeline
    {
        // TODO
        return this;
    }

    /** Process Shapes or pipeline */
    process(fn:(shape:AnyShape, index:number, all:ShapeCollection) => any):Pipeline
    {
        // TODO
        return this;
    }

}

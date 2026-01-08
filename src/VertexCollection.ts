/**
 *  TODO: Remove this in favor of typed ShapeCollection
 * 
 */

import type { MakeShapeCollectionInput } from './internal' // types
import { ShapeCollection } from './internal'
import { isCoordArray} from './internal' // typeguards
import { checkInput } from './decorators'; // Use direct import to avoid error with ts-node/jest

/** A ShapeCollection with only Vertices */
export class VertexCollection extends ShapeCollection
{
    /*
        Inherited properties from ShapeCollection:

        _oc
        _obj
        shapes

    */

    constructor(entities?:MakeShapeCollectionInput, ...args)
    {
        super(entities, ...args);
        this._check();
        this._setFakeArrayKeys();
    }

    /** Try to turn anything into a VertexCollection (based on ShapeCollection._addEntities) ) */
    @checkInput('MakeShapeCollectionInput', 'auto')
    fromAll(entities?:MakeShapeCollectionInput, ...args):VertexCollection
    {
        // Fix single PointLike
        entities = (Array.isArray(entities) && !isCoordArray(entities)) ? entities.concat(args) : [entities, ...args]; 

        this._addEntities(entities);
        this._check();
        this._setFakeArrayKeys();
        return this;
    }

    /** Class method */
    static fromAll(v:any, ...args):VertexCollection
    {
        return new VertexCollection().fromAll(v, ...args);
    }

    /** Check and filter all shapes in ShapeCollection that are Vertices */
    _check():VertexCollection
    {
        let filteredShapes = this.getShapesByType('Vertex').toArray();

        if (filteredShapes.length != this.shapes.length)
        {
            let filteredOutEntities =  this.shapes.filter(e => !filteredShapes.includes(e));
            console.warn(`VertexCollection::check: Filtered out ${filteredOutEntities.length}/${this.shapes.length} non-Vertex entities: ${filteredOutEntities}`);
        }

        this.shapes = filteredShapes; // make sure this is an Array

        return this;
    }

    
}
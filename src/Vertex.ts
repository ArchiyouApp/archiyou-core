/** 
 * 
 *  Vertex.ts - A single point in space which together shapes a Edge (Line, Spline, Circle), Wire, Face etc.
 *  !!!! TODO: have Vertex inherit properties from Vector/Point !!!!
 */

import { PointLike, isPointLike, PointLikeOrAnyShapeOrCollection } from './internal' // see types.ts
import { Point, Vector, Shape, Edge } from './internal'
import { checkInput } from './decorators' // Use direct import to avoid error with ts-node/jest
import { roundToTolerance } from './internal'

// this can disable TS errors when subclasses are not initialized yet
type IEdge = Edge

export class Vertex extends Shape
{
    /* 
        Inherited from Shape:
        _oc
        _ocShape
        _ocId

        move()
        
    */
    _x = 0;
    _y = 0; 
    _z = 0;

    // for TopoDS_Vertex see: see: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_topo_d_s___vertex.html

    constructor(p?:PointLike, ...args)
    {   
        /* NOTE: because a constructor cannot return null this always returns at least Vertex[0,0,0]
            fromPointLike will give an error message if the input is wrong */
        super(); // this sets up basic Shape structure, but not much else
        this.fromPointLike(p, ...args); 
    }

    /** Create Vertex from PointLike input */
    fromPointLike( p?:PointLike, ...args ):Vertex
    {
        let point = new Point().fromPointLike(p, ...args); // we need to capture null if input is bogus

        if (point) // error message is already given in fromPointLike
        {
            // IMPORTANT: set private properties because setters need _ocShape
            this._x = point.x;
            this._y = point.y;
            this._z = point.z;
            this._updateOcShape();
            return this;
        }
        
        return null;
    }

    /** Class method */
    static fromPointLike(p:any, ...args):Vertex
    {
        return new Vertex().fromPointLike(p, ...args);
    }

    /** For backwards compatibility 
        TODO: Up for removal
    */
    fromAll(v?:PointLike, ...args):Vertex
    {
       console.warn('Vertex::fromAll: **** To be deprecated ****. Use constructor directly: new Vertex(PointLike)');
       
       return this.fromPointLike(v, ...args);
    }

    /** 
     *   Create Vertex from given ocVertex
     *      We take some effort to round the Vertex because OC native rounding with Shape.round() does not work for Vertices?
     */
    _fromOcVertex(ocVertex?:any, round:boolean=false):Vertex
    {   
        // IMPORTANT: Rounding here is a bad idea since it makes a copy of the original OC Shape, this makes it unsuitable in selections
        if (ocVertex && (ocVertex instanceof this._oc.TopoDS_Vertex || ocVertex instanceof this._oc.TopoDS_Shape) && !ocVertex.IsNull())
        {
            // For easy debug, always make sure the wrapped OC Shape is TopoDS_Vertex
            ocVertex = this._makeSpecificOcShape(ocVertex, 'Vertex');

            if(!round)
            {
                this._ocShape = ocVertex;
                this._updateFromOcShape(); // set internal properties from _ocShape
            }
            else {
                // NOTE: we take a little bit of a strange path here - not assigning ocVertex directly and calling updating properties from here
                // TODO: Allow to disable copying and rounding for methods like vertices() where we need to keep the original Shapes
                let ocPoint = this._oc.BRep_Tool.Pnt(ocVertex); // converts a TopoDS_Vertex to a OC Point
                let point = new Point()._fromOcPoint(ocPoint); // The Point is rounded here
                [this._x, this._y, this._z] = point.toArray();
                this._updateOcShape();
            }
            this._ocId = this._hashcode();
        }
        else {
            throw new Error('Vertex::_fromOcVertex: No valid ocVertex given! Check if null, empty or the right OC Shape type!');
        }
    
        return this;
    }

    /** Set OC Shape from given [x,y,z] or if not present the existing [x,y,z] */
    _updateOcShape(x:number=null,y:number=null,z:number=null):Vertex   
    {
        x = (x === null) ? this._x : x;
        y = (y === null) ? this._y : y;
        z = (z === null) ? this._z : z;

        let ocPoint = new Point(x,y,z)._toOcPoint(); 
        let newOcVertex = new this._oc.BRepBuilderAPI_MakeVertex(ocPoint).Vertex();
        this._ocShape = newOcVertex;

        return this;
    }

    /** Updates properties from this._ocShape */
    _updateFromOcShape():Vertex
    {
        if (this._ocShape)
        {
            let ocPoint = this._oc.BRep_Tool.prototype.constructor.Pnt(this._ocShape)
            this._x = ocPoint.X();
            this._y = ocPoint.Y();
            this._z = ocPoint.Z();
        }
        
        return this;
    }

    /** For backward compatibility: Better to use constructor */
    @checkInput('Vector', 'Vector')
    fromVector(v:Vector):Vertex
    {
        console.warn('Vertex::fromVector: **** To be deprecated ****. Use constructor directly: new Vertex(PointLike)');
        this._updateOcShape(v.x,v.y,v.z);

        return this;
    }

    /** For backward compatibility: could just use constructor */
    @checkInput('Point', 'Point')
    fromPoint(p:Point)
    {
        console.warn('Vertex::fromPoint: **** To be deprecated ****. Use constructor directly: new Vertex(PointLike)');
        this._updateOcShape(p.x,p.y,p.z);

        return this;
    }
    

    _fromOcPoint(ocPoint:any):Vertex
    {
        let newOcVertex = new this._oc.BRepBuilderAPI_MakeVertex(ocPoint).Vertex();
        this._fromOcVertex(newOcVertex);

        return this;
    }

    //// GETTERS AND SETTERS ////
    // NOTE: Internally we always use the direct private properties _x, _y, _z, outside always the getters/setters x,y,z

    get x():number
    {
        return this._x;
    }

    get y():number
    {
        return this._y;
    }

    get z():number
    {
        return this._z;
    }

    set x(x:number)
    {
        this.setX(x);
    }

    set y(y:number)
    {
        this.setY(y);
    }

    set z(z:number)
    {
        this.setZ(z);
    }

    @checkInput(Number, Number)
    // overload method on Point
    setX(x:number):Vertex
    {
        this._x = x;
        this._updateOcShape();
        return this;
    }

    /** Sets y component of Vector  */
    // overload method on Point
    @checkInput(Number, Number)
    setY(y:number):Vertex
    {
        this._y = y;
        this._updateOcShape();
        return this;
    }

    /** Sets z component of Vector  */
    // overload method on Point
    @checkInput(Number, Number)
    setZ(z:number):Vertex
    {
        this._z = z;
        this._updateOcShape();
        return this;
    }

    //// TRANSFORMATION METHODS ////

    toVector():Vector
    {
        return this.toPoint().toVector();
    }

    toArray():Array<number>
    {
        return this.toPoint().toArray();
    }

    toPoint():Point
    {
        return new Point(this._x, this._y, this._z);
    }

    _toOcPoint():any // TODO: OC typing
    {
        return this.toPoint()._toOcPoint();
    }

    //// COMPUTED PROPERTIES  ////

    /** The position of the Vertex. Method is for consistency with other Shapes */
    center():any 
    {
        return this.toPoint();
    }

    //// SELF OPERATIONS ////

    /** Extrudes the Vertex to create a Edge with certain length along a Direction Vector: default direction: Z-axis */
    @checkInput([Number, [ 'PointLike', [0,0,1] ]],[Number, 'Vector'])
    extrude(amount:number, direction?:PointLike):IEdge 
    {
        let endVertex = this.moved( (direction as Vector).normalize().scaled(amount) ); // direction is auto converted 
        let newEdge = new Edge(this, endVertex); 
        this.replaceShape(newEdge);
        return newEdge;
    }

    /** Extrude a copy of Vertex to create a Edge with certain length along a Direction Vector: default direction: Z-axis */
    @checkInput([Number, [ 'PointLike', [0,0,1] ]],[Number, 'Vector'])
    extruded(amount:number, direction?:PointLike):IEdge 
    {
        return this.copy().extrude(amount, direction as Vector) as Edge; // auto added to Scene by copy()
    }

    /** Rounds this Vertex (avoids very small values like 2.0e-15 */
    // NOTE: We need to figure out the OC native way to do this
    rounded():Vertex
    {    
        return new Vertex( roundToTolerance(this._x), roundToTolerance(this._y), roundToTolerance(this._z) );
    }

    //// METHODS WITH OTHER SHAPES ////
    
    /** Test if given entity has equivalent geometry as current Vertex 
     *  We use the basic tolerance by using Vertex.rounded()
    */
    @checkInput('PointLikeOrAnyShapeOrCollection', 'Vertex')
    equals(other:PointLikeOrAnyShapeOrCollection, ...args):boolean // consistency with Shape.equals
    {
        if (isPointLike(other))
        {
            // Point.equals() takes care of tolerance
            return this.toPoint().equals( (other as Vertex).toPoint() );
        }
        
        return false
    }

    //// SPECIAL OPERATIONS ////

    /*
    @checkInput('AnyShapeOrCollection', 'auto')
    project(to:AnyShapeOrCollection)
    {
        return this.toPoint().project(to);
    }
    */

    //// OUTPUT ////

    toData():Array<number>
    {
        return [roundToTolerance(this.x), roundToTolerance(this.y), roundToTolerance(this.z)]; 
    }

    /** Export entity and minimal data as string (used for outputting on console and hashing ) */
    toString():string
    {
        return `<Vertex position="[${this.toArray()}]">`;
    }

}
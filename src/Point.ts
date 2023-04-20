/**
 * 
 *  Archiyou Point
 *      A very basic mathematical construct that serves as parent of Vector and Vertex
 *      
 *      It's also an important part of working with coordinates and thus geometry
 *      So it contains a lot of logic to parse multiple inputs into a Point:
 *      - Numbers Point(x,y)
 *      - Array [x,y,z]
 *      - or instances of Point, Vector or Vertex
 *      - It also supports relative coordinates: Point('+10',0,0) either from origin (if single Point) or from last Point in sequences
 *      
 *      Code structure and relations:
 *        - Although this class does most of the work, PointLike and IsPointLike in typings handles first stage of input checking and typing
 *        - Vector and Vertex extend the Point class
 */

import { Vector, Vertex } from './internal'
import { AXIS_TO_VECS, PointLike, isPointLike, isCoord, Coord, PolarCoord, Axis, isAxis, Cursor, 
    isAnyShapeOrCollection, AnyShapeOrCollection, isCursor, Plane } from './internal' // see types.ts
import { isRelativeCartesianCoordString, parseRelativePolarCoordString, relativeCoordToNumber, roundToTolerance} from './internal' // utils
import { addResultShapesToScene, checkInput } from './decorators' // decorators - using internal gives error
import { gp_Pnt, gp_Vec } from '../libs/archiyou-opencascade/archiyou-opencascade'

export class Point
{  
    _x = 0;
    _y = 0;
    _z = 0;
    _oc:any; // TODO: OC typing
    _cursor:Cursor; // { point, direction }

    //// CREATION METHODS ////
    constructor (p?:PointLike, ...args)
    {
        // IMPORTANT: this method always creates a Point, default is [0,0,0]
        this.fromPointLike(p, ...args); 
    }

    /* Test if a given object is a Point */
    static isPoint(obj:any):boolean
    {
        return (!obj) ? false : (obj instanceof Point);
    }

    /** Create a Point from a PointLike (see typings.ts) */
    // NOTE: allow everything coming in here
    // IMPORTANT: we need to use private properties _x here, otherwise the setter is invoked on Vector before ocVector is set
    fromPointLike( p?:PointLike, ...args): Point | Vector
    {
        if (p === null || p === undefined)
        {
            // new Point() or new Vector() is handy to have default to [0,0,0]
            return this;
        }
        else if(isPointLike(p))
        {
            // an instance of a PointLike Class
            let anyPoint = p as any;
            if (anyPoint instanceof Point || anyPoint instanceof Vector || anyPoint instanceof Vertex)
            {
                this._x = anyPoint.x;
                this._y = anyPoint.y;
                this._z = anyPoint.z;
                return this;
            }
            // Array of at least one number or string with relative coord, the rest will be 0
            else if (Array.isArray(p) && isCoord(p[0]))
            {
                let pointArr = [0,0,0].map( (v,i) =>  p[i] || v ); // default value (0) or value in given array p
                let pointArrChecked = this._arrayResolveRelativeCoordinates(pointArr);
                [this._x,this._y,this._z] = pointArrChecked;
                return this;
            }
            // Given one or more coordinates (number and relative coord strings) in arguments
            else if(isCoord(p)) 
            {
                // just one or more coords in arguments
                let otherArgNums = args.filter(c => isCoord(c));
                let pointArr = [p, otherArgNums[0] || 0, otherArgNums[1] || 0];
                let pointArrChecked = this._arrayResolveRelativeCoordinates(pointArr);
                [this._x,this._y,this._z] = pointArrChecked;
                return this;
            }
            else if(isAxis(p))
            {
                [this._x,this._y,this._z] = AXIS_TO_VECS[p];
                return this;
            }
            else {
                console.error(`Point::toPoint: Could not create a Point from input "${p}. This error should not occur: Check isPointLike method`);
                return null;
            }
        }
        else 
        {
            // NOTE: error message is generated from isPointLike()
            console.error(`fromPointLike: Could not make Point from input "${p}"`);
            return null; 
        }

    }

    /** Set cursor on this Point instance, so we can make relative coords */
    cursor(cursor:Point|Cursor):Point
    {
        console.log('CURSOR');
        console.log(cursor);
        
        this._cursor = (isCursor(cursor)) ? cursor : (Point.isPoint(cursor)) ? { point: cursor, direction: new Vector(1,0,0) } : null;

        if (!this._cursor)
        {
            console.warn(`Point::cursor: Invalid cursor "${cursor}". Defaulted to [0,0,0]`);
            this._cursor = { point : new Point() };
        }
        
        return this;
    }
    
    /** Class method */
    static fromPointLike(v:any, ...args):Point
    {
        return new Point().fromPointLike(v, ...args);
    }

    //// SETTING PROPERTIES ////

    get x()
    {
        return this._x;
    }

    get y()
    {
        return this._y;
    }

    get z()
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

    /** Sets x,y,z components of Point  */
    @checkInput( 'PointLike', 'Point')
    set(point:PointLike, ...args):Point // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {
        point = point as Point; 
        this.setX(point.x);
        this.setY(point.y);
        this.setZ(point.z);
        
        return this;
    }   

    /** Sets x component of Point  */
    @checkInput(Number, Number)
    setX(x:number):Point
    {
        this._x = x;
        return this;
    }

    /** Sets y component of Point  */
    @checkInput(Number, Number)
    setY(y:number):Point
    {
        this._y = y;
        return this;
    }

    /** Sets z component of Point  */
    @checkInput(Number, Number)
    setZ(z:number):Point
    {
        this._z = z;
        return this;
    }

    //// COMPUTED PROPERTIES ////

    isOrigin():boolean
    {
        return this._x == 0 && this._y == 0 && this._z == 0
    }

    //// TRANSFORMATION METHODS ////

    _fromOcPoint(ocPoint:any)
    {
        return this.fromPointLike(
            roundToTolerance(ocPoint.X()),
            roundToTolerance(ocPoint.Y()),
            roundToTolerance(ocPoint.Z())
        );
    }

    _fromOcXYZ(ocXYZ:any)
    {
        return this.fromPointLike(
            roundToTolerance(ocXYZ.X()),
            roundToTolerance(ocXYZ.Y()),
            roundToTolerance(ocXYZ.Z())
        );
    }

    _toOcPoint():gp_Pnt
    {
        return new this._oc.gp_Pnt_3(this._x, this._y, this._z);
    }
    
    _toOcVector():gp_Vec
    {
        return new this._oc.gp_Vec_4(this._x, this._y, this._z);
    }

    _toOcDir():any // TODO: OC typing
    {
        let p;
        if (this.isOrigin())
        {
            console.error(`Vector::_toOcDir: Cannot convert [0,0,0] Vector to Oc Direction: defaulted to [0,0,1]!`);
            p = this.fromPointLike([0,0,1]);
        }
        else {
            p = this;
        }   

        return new this._oc.gp_Dir_2(p._toOcVector());
    }

    toArray():Array<number>
    {
        return [this._x, this._y, this._z];
    }

    
    toVector():Vector
    {
        return new Vector(this);
    }
    

    /** Transform Point to new Vertex without adding to Scene */
    _toVertex():Vertex
    {
        return new Vertex(this._x, this._y, this._z);
    }

    /** Transform Point to new Vertex and add to Scene */
    @addResultShapesToScene
    toVertex()
    {
        return this._toVertex();
    }



    
    //// TRANSFORMATIONS ////

    copy():Point
    {
        return new Point(this.x,this.y, this.z);
    }

    /** Add a PointLike to this Vector */
    @checkInput('PointLike', 'Point')
    add(v:PointLike, ...args):Point // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {
        let dp = v as Point; // autoconverted
        this.x += dp.x;
        this.y += dp.y;
        this.z += dp.z;

        return this; 
    }

    /** Add PointLike to this one and return a new Vector  */
    @checkInput('PointLike', 'Point')
    added(v:PointLike, ...args):Point
    {
        return this.copy().add(v);
    }

    /** Move Point */
    @checkInput('PointLike', 'Vector')
    move(vec:PointLike, ...args):Point
    {
        let moveVec = vec as Vector; // auto converted
        this.x += moveVec.x;
        this.y += moveVec.y;
        this.z += moveVec.z;

        return this;
    }

    @checkInput('PointLike', 'Vector')
    moved(vec:PointLike, ...args):Point
    {
        let moveVec = vec as Vector; // auto converted
        let p = this.copy()
        p.x += moveVec.x;
        p.y += moveVec.y;
        p.z += moveVec.z;

        return p;
    }

    //// RELATIONS WITH OTHER POINTS ////

    /** Test if given entity has equivalent geometry as current Point */
    @checkInput('PointLike', 'Point')
    equals(other:PointLike, ...args):boolean
    {
        other = other as Point;
        const tolerance = this._oc.SHAPE_TOLERANCE; // TODO: use methods on OC?
        return Math.abs(this._x - other._x) < tolerance && 
               Math.abs(this._y - other._y) < tolerance && 
               Math.abs(this._z - other._z) < tolerance;
    }

    @checkInput('PointLike', 'auto')
    distance(other:PointLike):number
    {
        let otherPoint = new Point(other);
        let dx = otherPoint.x - this._x;
        let dy = otherPoint.y - this._y;
        let dz = otherPoint.z - this._z;
        return Math.sqrt(dx*dx+dy*dy+dz*dz);
    }
    
    /** We got a Point array with relative coordinates: resolve into real numbers based on previous Point 
     *    
     *  2 Types:
     *      - cartesian ['+10','-10']
     *      - polar coordinates ['100<30'] or ['100<<20'] (relative angle)
    */
    _arrayResolveRelativeCoordinates(pointArr:Array<string|number>, cursor:Cursor=null):Array<number>
    {
        const AXIS = ['x', 'y', 'z'];

        let pointAbsCoords = [];

        if (!isCursor(cursor))
        {
            cursor = this._cursor || { point: new Point() }; 
        }

        pointArr.every( (v,i) =>
        {
            if (typeof v === 'string')
            {
                if (isRelativeCartesianCoordString(v))
                {
                    pointAbsCoords[i] = cursor.point[AXIS[i]] + (relativeCoordToNumber(v) || 0); // protect against null values from relativeCoordToNumber and default to zero0
                }
                else if(parseRelativePolarCoordString(v) != null)
                {
                    // polar coordinates are given with only one string ['100<20'] or ['300<<30'] (relative angle TODO)
                    let polarCoord:PolarCoord = parseRelativePolarCoordString(v);

                    let angle = polarCoord.angle;
                    // relative angle
                    if(polarCoord.relativeAngle)
                    {
                        if(Vector.isVector(cursor.direction))
                        {
                            let baseAngle = cursor.direction.angles()[2]; // angle around z-axis
                            angle += baseAngle;
                        }
                        else {
                            console.warn(`Point::_arrayResolveRelativeCoordinates: Got relative angle polar coordinate but no cursor direction!`)
                        }
                    }
                    let offsetVec = new Vector(polarCoord.length).rotate(angle);
                    let offsettedPoint = cursor.point.toVector().add(offsetVec)
                    pointAbsCoords = offsettedPoint.toArray();

                    return false; // quit loop
                }
                else {
                    console.error(`_arrayResolveRelativeCoordinates: Encountered a non-coordinate string: "${v}". Defaulting to 0.`);
                    pointAbsCoords[i] = 0;
                }
                
            }
            else {
                // just keep coordinate
                pointAbsCoords[i] = pointArr[i];
            }

            return true;
        })

        return pointAbsCoords;
    }

    /** Calculate orthogonal projections from this Point to Edges/Wires of a given Shape 
        A projected Point from an original Point to a Curve is the point on a other Shape
        where the line between the two points is perpendicular to the Curve at the projected Point
    */
    @checkInput('AnyShapeOrCollection', 'auto')
    project(to:AnyShapeOrCollection):Array<Point>
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_geom_a_p_i___project_point_on_curve.html
        // We make it simple and just use the Edges as Curves in a generic shape to compute projection points

        let projectedPoints:Array<Point> = [];
        to.edges().forEach( curEdge => // NOTE: is Shape is a Vertex there will be no edges()
        {
            let umin, umax;
            [umin,umax] = curEdge.getParamMinMax();
            let ocGeomCurveHandle = curEdge._toOcCurve().Curve().Curve(); // Going through the adaptors: _toOcCurve : Adaptor3D_Curve => .Curve(): GeomAdaptor_Curve => .Curve(): Handle_Geom_Curve 
            
            //let ocProjector = new this._oc.GeomAPI_ProjectPointOnCurve_3(this._toOcPoint(), ocGeomCurveHandle, umin, umax);
            let ocProjector = new this._oc.GeomAPI_ProjectPointOnCurve_2(this._toOcPoint(), ocGeomCurveHandle);

            for( let i = 1; i < ocProjector.NbPoints()+1; i++ )
            {
                let ocPoint = ocProjector.Point(i);
                let p = new Point()._fromOcPoint(ocPoint);
                // NOTE: For circle Edges something strange happens: HACK a solution
                if (curEdge.edgeType() == 'Circle')
                {
                    p.add(curEdge.center());
                }
                
                projectedPoints.push(p);
            }
        });

        return projectedPoints.sort( (a,b) => a.distance(this) - b.distance(this)  ); // order by distance ascending
    }

    /** Does current Point share plane with the other */
    @checkInput('PointLike', 'Point')
    sharedPlane(other:PointLike):Plane
    {
        let otherPoint = other as Point;
        if(this.equals(otherPoint))
        {
            console.warn(`Point:sharedPlane: Points are equal!`)
            return null;
        }
        else if(this.z == otherPoint.z)
        {
            return 'xy';
        }
        else if(this.x == otherPoint.x)
        {
            return 'yz'
        }
        else if(this.y == otherPoint.y)
        {
            return 'xz'
        }
        return null;
    }

    //// UTILS ////

    round():Point
    {
        this._x = roundToTolerance(this._x);
        this._y = roundToTolerance(this._y);
        this._z = roundToTolerance(this._z);

        return this;
    }

    rounded():Point
    {
        return new Point(this._x, this._y, this._z).round();
    }

    //// OUTPUT ////

    toData()
    {
        return [this._x, this._y, this._z];
    }

    /** Export entity and minimal data as string (used for outputting on console and hashing ) */
    toString():string
    {
        return `<Point[${this.toData()}]>`;
    }

}
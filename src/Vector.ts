/**
 * 
 *  Archiyou Vector Shape 
 *    inherits from Point
 *    
 */

import { MainAxis, Point } from './internal'
import { Vertex } from './internal'
import { PointLike, isPointLike } from './internal' // see: types.ts
import { addResultShapesToScene, checkInput } from './decorators' // decorators
import { toDeg, toRad, roundToTolerance } from './internal' // utils
import { targetOcForGarbageCollection } from './internal'


export class Vector extends Point
{  
    /* inherited from Point:
        _x = 0;;
        _y = 0;
        _z = 0;

        get x()
        get y()
        get z()
        set x()
        set y()
        set z()
    */
    
    _ocVector:any; // OC gp_Vec https://dev.opencascade.org/doc/occt-7.4.0/refman/html/classgp___vec.html

    //// CREATION METHODS ////
    constructor (p?:PointLike, ...args)
    {
        super(p, ...args);

        this._updateOcVector();
        targetOcForGarbageCollection(this, this._ocVector);
    }

    _clearOcVector()
    {
        this?._ocVector?.delete();
        this._ocVector = undefined;
        // TODO: untarget gc
    }

    /* Test if a given object is a Vector */
    static isVector(obj:any):boolean
    {
        return (!obj) ? false : (obj instanceof Vector);
    }

    /** Overload from Point */
    fromPointLike( p?:PointLike, ...args ):Vector
    {
        let point = new Point().fromPointLike(p, ...args); // we need to capture null if input is bogus

        if (point)
        {
            // IMPORTANT: we need to set the private properties here, because the setter needs the OcVector being set
            this._x = point.x;
            this._y = point.y;
            this._z = point.z;
            this._updateOcVector();
            return this;
        }
        
        return null; // NOTE: new Vector() always returns an instance
    }

    /** Class method */
    static fromPointLike(v:any, ...args):Vector
    {
        return new Vector().fromPointLike(v, ...args);
    }

    /** Sets OC Vector from x,y,z coordinates  */
    _updateOcVector():Vector
    {
        // Don't make OC zero Vector: difficult to control
        this._ocVector = (this._oc) ? new this._oc.gp_Vec_4(
                this._x || 0,  // avoid nulls
                this._y || 0,  
                this._z || 0
                ) : null; // Allow null as _ocVector if OC is not loaded

        targetOcForGarbageCollection(this, this._ocVector); // New instance, register too

        return this;
    }

    /** Update properties from _ocVector */
    _updateFromOcVector():Vector
    {
        return this._fromOcVec(this._ocVector);
    }

    _toOcLocation():any // TODO OC type
    {
        const ocTransform = new this._oc.gp_Trsf_1();
        ocTransform.SetTranslationPart(this._ocVector);
        const ocLocation = new this._oc.TopLoc_Location_2(ocTransform);

        return ocLocation;
        // TODO: target for garbage collection
    }

    //// CREATION METHODS ////

    /* ==== Inherited from Point ====

        fromPointLike(p:PointLike):Point
        distance: Will be overloaded
        project
    */

    /** Try to convert anything to a Vector
        mostly here for backwards compatibiliy
        TODO: slowly move this out since the constructor does the same */
    fromAll(v:any, ...args):Vector
    {
        if (isPointLike(v))
        {
            return new Vector(v, ...args);
        }
        else {
            console.warn(`Vector::fromAll: Could not convert "${v}" to a Vector. Please supply: Coord (absolute or relative), an array of Coords, Point, Vector or Vertex`);
            return null;
        }
        
    }

    /** Set internal properties x,y,z from a given or already wrapped OC gp_Vec instance */
    _fromOcVec(ocVec:any=null):Vector
    {
        // If any existing gp_Vec giving, first set that
        if (ocVec != null)
        {
            this._ocVector = ocVec; // TODO: research if a reference to OC instance can be problematic when carbage collecting
            targetOcForGarbageCollection(this, this._ocVector);
        }

        if(this._ocVector)
        {
            // Update internal coords
            // NOTE: Don't round automatically because Vectors need more accuracy than Shapes
            this._x = this._ocVector.X();
            this._y = this._ocVector.Y();
            this._z = this._ocVector.Z();
        }
        else {
            console.warn(`Vector::_fromOcVec(): Can not set internals from empty _ocVector. You got a undefined Vector instance!`);
        }

        return this;
    }

    /** Copy OC Vector from given Vector */
    _copyOcFromVec(vector:Vector)
    {
        if (vector && vector._ocVector)
        {
            this._ocVector = vector._ocVector;
            this._fromOcVec();
        }
    }

    /** Create Vector from OC Point instance */
    _fromOcPoint(ocPoint:any):Vector
    {
        return new Vector(ocPoint.X(),ocPoint.Y(), ocPoint.Z());
    }

    /** Create Vector from OC Direction instance */
    _fromOcDir(ocDir:any):Vector 
    {
        return new Vector(ocDir.X(),ocDir.Y(), ocDir.Z());
    }

    /** Random Vector in a circle of given radius */
    random(radius:number=1)
    {
        return new Vector( 
            ((Math.random()) < 0.5 ? -1 : 1) * Math.random()*radius, 
            ((Math.random()) < 0.5 ? -1 : 1) * Math.random()*radius, 
            ((Math.random()) < 0.5 ? -1 : 1) * Math.random()*radius);
    }

    //// TRANSFORMATIONS ////

    toVector():Vector
    {
        // is overloading in Point
        return this;
    }

    toPoint()
    {
        return new Point(this._x, this._y, this._z);
    }

    @addResultShapesToScene
    toVertex()
    {
        return new Vertex(this._x, this._y, this._z);
    }

    toArray():[number,number,number]
    {
        return [this._x,this._y,this._z];
    }

    /*
         _toOcPoint():any
         inherited from Point
    */

    _ocGeom():any // TODO: OC typing
    {
        return this._ocVector;
    }


    //// SETTING PROPERTIES ////

    /** Sets x,y,z components of Vector  */
    @checkInput( 'PointLike', 'Vector')
    set(vector:PointLike, ...args):Vector // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {
        // we want to catch all arguments here to allow for set(x,y,z)
        // NOTE: at this moment 
        //let vector = new Vector(p, ...args); // use PointLike to make Vector or [0,0,0]
        this._copyOcFromVec(vector as Vector);
        
        return this;
    }   

    /** Sets x component of Vector  */
    // overload method on Point
    @checkInput(Number, Number)
    setX(x:number):Vector
    {
        this._x = x;
        this._ocVector.SetX(x);
        return this;
    }

    /** Sets y component of Vector  */
    // overload method on Point
    @checkInput(Number, Number)
    setY(y:number):Vector
    {
        this._y = y;
        this._ocVector.SetY(y);
        return this;
    }

    /** Sets z component of Vector  */
    // overload method on Point
    @checkInput(Number, Number)
    setZ(z:number):Vector
    {
        this._z = z;
        this._ocVector.SetZ(z);
        return this;
    }

    setComponent(a:MainAxis, v:number)
    {
        return this[`set${a.toUpperCase()}`](v);
    }

    //// COMPUTED PROPERTIES ////

    /** Return the magnitude/length of this Vector */
    magnitude()
    {
        return this._ocVector.Magnitude();
    }

    /** Return the magnitude/length of this Vector */
    length()
    {
        return this.magnitude();
    }

    /** Return the squared magnitude/length of this Vector */
    squareMagnitude()
    {
        return this._ocVector.SquareMagnitude();
    }

    /** Check if this Vector is normal to the another: abs(<me>.Angle(Other) - PI/2.) <= AngularToleranc */
    @checkInput('PointLike', Vector)
    isNormalTo(other:PointLike, ...args):boolean // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {  
        return this._ocVector.IsNormal( (other as Vector)._ocVector, this._oc.SHAPE_TOLERANCE); // auto converted to Vector @with checkInput
    }

    /** Return the angles around the different axis
     *     !!!! Some of these values can be null - for example for [100,0,0] => rotation around X axis = null  !!!!
     */
    angles():Array<number>
    {
        // YZ plane => X axis
        let vzy = this.copy().setX(0);
        let ryz = (vzy.length() > 0) ? vzy.angleRef(new Vector(0,1,0), new Vector(-1,0,0)) : null; 
        // ryz = (ryz == 180 ) ? 0 : ryz; // test
        
        // XZ plane => Y axis
        let vxz = this.copy().setY(0);
        let rxz = (vxz.length() > 0) ? vxz.angleRef(new Vector(1,0,0), new Vector(0,1,0)) : null; // correct for left-hand
        // rxz = (rxz == 180 ) ? 0 : rxz; // test

        // XY plane => Z axis
        let vxy = this.copy().setZ(0);
        // NOTE: don't really understand why we need to flip the reference axis to get the right result!
        let rxy = (vxy.length() > 0) ? vxy.angleRef(new Vector(1,0,0), new Vector(0,0,-1)) : null; // protect against null values
        // rxy = (rxy == 180 ) ? 0 : rxy; // test

        return [ryz, rxz, rxy]; // x,y,z axis
    }


    // !!!! NOT WORKING PROPERTY FOR NOW IN COMBINATION WITH ROTATE EULER IN SHAPE !!!!
    
    /** Returns the angles of rotation (intrinsic YZX Euler angles) around each axis that transform the given normalized Vector to the normalized other
     *  Important: When rotation around axis apply in order YZX
     *  docs: 
     *      - https://dev.opencascade.org/content/get-euler-angles-gptrsf-gpquaterniongeteulerangles
     *      - https://dev.opencascade.org/content/gpquaternion-changes-regarding-euler-angles-700
     *      - https://en.wikipedia.org/wiki/Euler_angles
     *      - https://www.mathworks.com/matlabcentral/answers/407489-rotate-vectors-onto-each-other-and-euler-angles
     *      - http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/index.htm
    */
    /*
    eulerAngles(other:Vector|Array<number>):Array<number>
    {
        console.error(`Vector::eulerAngles might not work!`);

        let quaternion = new this._oc.gp_Quaternion_3(this._ocVector, (other as Vector)._ocVector).Normalized();
        
        // ==== Of course this is not working, because OC cannot write to references ====
        // let eulerOrder = this._oc.gp_EulerSequence.gp_Intrinsic_XYZ;
        // let angles = { alpha : -1.0, beta: -1.0, gamma: -1.0 };
        // quaternion.GetEulerAngles(eulerOrder, angles.alpha, angles.beta, angles.gamma);

        // ==== We got this Quaternion to Euler angles from : http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/index.htm ====

        let qx = quaternion.X();
        let qy = quaternion.Y();
        let qz = quaternion.Z();
        let qw = quaternion.W();

        let heading; // y
        let attitude; // z
        let bank; // x
        
        let test = qx*qy + qz*qw;
        if (test > 0.499) { // singularity at north pole
            heading = 2 * Math.atan2(qx,qw);
            attitude = Math.PI/2;
            bank = 0;
        }
        if (test < -0.499) 
        { 
            // singularity at south pole
            heading = -2 * Math.atan2(qx,qw);
            attitude = - Math.PI/2;
            bank = 0;
        }
        else {
            // the normal calculations
            let sqx = qx*qx;
            let sqy = qy*qy;
            let sqz = qz*qz;
            heading = Math.atan2(2*qy*qw-2*qx*qz , 1 - 2*sqy - 2*sqz);
            attitude = Math.asin(2*test);
            bank = Math.atan2(2*qx*qw-2*qy*qz , 1 - 2*sqx - 2*sqz);
        }

        // looks likes the example as a left-handed orientation around Y-axis - change
        return [-roundToTolerance(toDeg(bank)),roundToTolerance(toDeg(heading)),roundToTolerance(toDeg(attitude))];
    }
    */

    /** Return a new Vector with all its coordinates positive */
    abs():Vector
    {
        return new Vector(Math.abs(this._x), Math.abs(this._y), Math.abs(this._z));
    }

    //// MODIFYING THE VECTOR ////

    /** Move the Vector - mainly for consistency for example Vertex */
    @checkInput('PointLike', 'Vector')
    move(p:PointLike, ...args):Vector // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {  
        let moveVec = p as Vector; // auto converted and all arguments gathered into Vector

        this._x += moveVec.x;
        this._y += moveVec.y;
        this._z += moveVec.z;
        this._updateOcVector();
        
        return this;
    }

    /** Copy Vector and return a new one */
    copy():Vector
    {
        return new Vector(this._x, this._y, this._z);
    }

    /** Add a PointLike to this Vector */
    @checkInput('PointLike', 'Vector')
    add(vector:PointLike, ...args):Vector // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {
        const v = vector as Vector; // autoconverted
        this._ocVector.Add(v._ocVector)
        this._fromOcVec(); // update properties [x,y,z]

        return this; 
    }

    /** Add PointLike to this one and return a new Vector  */
    @checkInput('PointLike', 'Vector')
    added(vector:PointLike, ...args):Vector
    {
        return this.copy().add(vector);
    }

    /** Subtract a PointLike from current Vector */
    @checkInput('PointLike', 'Vector')
    subtract(vector:PointLike, ...args) // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {
        this._ocVector.Subtract((vector as Vector)._ocVector); // auto converted to Vector
        this._fromOcVec(); // update properties [x,y,z]
        return this; 
    }

    /** Subtract a PointLike from this one and return a new Vector  */
    @checkInput('PointLike', 'Vector')
    subtracted(vector:PointLike, ...args):Vector // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {
        return this.copy().subtract(vector as Vector);
    }

    /** Multiple Vector with scalar (1D,2D,3D) and return current Vector 
     *  We can multiple with one number or by axis with Array [x,y,z]
    */
    @checkInput('PointLike', 'auto') // let through and figure out, because we need to detect single number or Vector input
    multiply(scalar:number|PointLike, ...args):Vector // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {
        /* OC does not offer scaling in multiple axis: do this manually
         
        Depending on inputs we see input as general scalar or per axis scalar:

            Vector(1,1,1).multiply(30) ==> Vector(30,30,30)
            Vector(1,1,1).multiply([30]) ==> Vector(30,0,0) - follows point logic - feels right
            Vector(1,1,1).multiply(30,0,0) ==> Vector(30,0,0)
            Vector(1,1,1).multiply([30,0,0]) ==> Vector(30,0,0)
        */
        
        const scalarVec = new Vector(scalar); // auto converted
        const singleScalar = (typeof(scalar) === 'number') ? true : false;

        this._x *= scalarVec.x;
        this._y *= singleScalar ? scalarVec.x : scalarVec.y;
        this._z *=  singleScalar ? scalarVec.x : scalarVec.z;
        
        
        this._updateOcVector();
        
        return this;
    }

    /** Multiply Vector with scalar and return a copy of Vector */
    @checkInput('PointLike', 'auto')
    multiplied(scalar:number|PointLike, ...args):Vector // NOTE: args to signify that checkInput will gather them and avoid TS warnings
    {
        let v:Vector = this.copy();
        v.multiply(scalar as Vector);
        return v; 
    }
    
    /** Scale is an alias for multiply */
    @checkInput('PointLike', 'auto')
    scale(scalar:number|PointLike, ...args):Vector 
    {
        return this.multiply(scalar as Vector);
    }

    /** Scaled is an alias for multiplied */
    @checkInput('PointLike', 'auto')
    scaled(scalar:number|PointLike, ...args):Vector 
    {
        return this.multiplied(scalar as Vector);
    }

    /** Divide Vector by scalar and return current Vector */
    @checkInput('PointLike', 'auto')
    divide(scalar:number|PointLike, ...args):Vector
    {
        let scalarVec = new Vector(scalar); // auto converted by decorator

        let singleScalar = (typeof(scalar) === 'number') ? true : false;
            
        this._x /= scalarVec.x;
        this._y /= singleScalar ? scalarVec.x : scalarVec.y;
        this._z /= singleScalar ? scalarVec.x : scalarVec.z;
        this._updateOcVector();
        
        return this;
    }

    /** Divide Vector by this one and return a new Vector  */
    @checkInput('PointLike', 'auto')
    divided(scalar:PointLike, ...args):Vector
    {
        let v:Vector = this.copy();
        v.divide(scalar as Vector);
        return v; 
    }

    /** Calculate Cross Vector with this and other vector and return a new Vector */
    @checkInput('PointLike', 'Vector')
    crossed(other:PointLike, ...args):Vector
    {
        if(this.equals(other))
        {
            console.warn(`Vector::crossed: Vectors are the same. Returned null`)
            return null;
        }
        let otherVec = other as Vector; // PointLike automatically converted to Vector
        let v:Vector = this.copy();
        v._ocVector.Cross(otherVec._ocVector); // IMPORTANT: overwrite existing ocShape
        v._fromOcVec();
        return v; 
    }

    /** Calculate Dot / Inner product with this and other Vector */
    @checkInput('PointLike', 'Vector')
    dot(other:PointLike, ...args):number 
    {
        let otherVec = other as Vector; // PointLike automatically converted to Vector
        return this._ocVector.Dot(otherVec._ocVector);
    }

    /** Normalize current Vector and return */
    normalize():Vector 
    {
        if(this.equals([0,0,0]))
        {
            console.warn(`Vector::normalize(): Can't normalize a zero length Vector!`)
        }
        else 
        {
            this._ocVector.Normalize();
            this._fromOcVec(); // update internals from ocVector
        }
        
        return this;
    }

    /** Normalize current Vector and return a copy */
    normalized():Vector 
    {
        return this.copy().normalize();
    }

    /** Reverse current Vector and return current Vector */
    reverse():this 
    {
        this._ocVector.Reverse();
        this._fromOcVec();
        return this;
    }

    /** Reverse current Vector and return a copy */
    reversed():Vector 
    {
        return this.copy().reverse();
    }

    /** Mirror current Vector 
        @param position position of mirror axis
        @param direction direction of mirror axis - default is the Y axis
    */
    @checkInput( [ ['PointLike',[0,0,0]] , ['PointLike',[0,1,0]] ], [Vector, Vector]) // default values in checkInput
    mirror(position?:PointLike, direction?:PointLike):Vector
    {
        const positionPoint = (position as Vector).toPoint(); // auto converted to Vector
        const directionVec = direction as Vector

        const ocAxis = new this._oc.gp_Ax1_2( positionPoint._toOcPoint(), directionVec._toOcDir() );
        this._ocVector.Mirror_2(ocAxis);
        this._fromOcVec(); // sync internals with Oc instance
        ocAxis?.delete(); // clear ocAxis
        return this;
    }

    /** Mirror current Vector and return a copy */
    mirrored(position?:PointLike, direction?:PointLike):Vector
    {
        return this.copy().mirror(position, direction);
    }

    /** 
     *   Rotates current Vector along a axis defined by position and direction
     *   @param angle in degrees
     */   
    @checkInput( [Number, ['PointLike',[0,0,0]] , ['PointLike',[0,0,1]] ], [Number, 'Point', 'Vector'])
    rotate(angle:number, position?:PointLike, direction?:PointLike):this
    {
        // IMPORTANT: probably right-hand rotation - for Y - axis this could cause problems 

        /** See OC gp_Pnt: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/classgp___pnt.html */
        const ocAxis = new this._oc.gp_Ax1_2( (position as Point)._toOcPoint(), (direction as Vector)._toOcDir() ); // auto converted
        this._ocVector.Rotate(ocAxis,toRad(angle));
        this._fromOcVec(); // sync internals from oc instance
        ocAxis?.delete(); // clean
        return this;
    }

    /** 
     *   Same as rotate() but returns a copy
     *   @param angle in degrees
     */ 
    @checkInput( [Number, ['PointLike',[0,0,0]] , ['PointLike',[0,0,1]] ], [Number, 'Point', 'Vector'])    
    rotated(angle:number, position?:PointLike, direction?:PointLike):Vector
    {
        return this.copy().rotate(angle, position, direction);
    }

    // TODO: add rotation pivot
    @checkInput(Number,'auto')
    rotateX(angle:number):this
    {
        return this.rotate(angle, [0,0,0], [1,0,0])
    }

    @checkInput(Number,'auto')
    rotateY(angle:number):this
    {
        return this.rotate(angle, [0,0,0], [0,1,0])
    }

    @checkInput(Number,'auto')
    rotateZ(angle:number):this
    {
        return this.rotate(angle, [0,0,0], [0,0,1])
    }

    /** Swap x,y coordinates for some 2D applications */
    swappedXY():Vector
    {
        return new Vector(this._y, this._x, this._z);
    }

    /** Get largest component along any (negative) axis */
    largestAxis():MainAxis
    {
        return [
            { c: 'x', n: Math.abs(this.x) },
            { c: 'y', n: Math.abs(this.y) },
            { c : 'z', n : Math.abs(this.z) }
        ].sort( (a,b) => b.n - a.n)[0].c as MainAxis 
    }
    
    isOrtho():boolean
    {
        const n = this.normalized().abs();
        if(n.toArray().every(c => c === 0)){ return false }; // [0,0,0] not ortho
        return n.toArray().every(c => c === 1 || c === 0)
    }

    //// RELATIONS WITH OTHER VECTORS ////

    /** Check if this Vector is the opposite of another Vector */
    @checkInput('PointLike', 'Vector')
    isOpposite(other:PointLike, ...args):boolean
    {
        return this._ocVector.IsOpposite((other as Vector)._ocVector, this._oc.SHAPE_TOLERANCE);
    }

    /** Check if this Vector is parallel to another Vector */
    @checkInput('PointLike', 'Vector')
    isParallel(other:PointLike, ...args):boolean
    {
        const otherVec = other as Vector; // auto converted in checkInput
        if(this.length() == 0 || otherVec.length() == 0)
        {
            console.warn(`Vector::isParallel: Cannot check parallelism with zero length Vector`)
            return null;
        }
        return this._ocVector.IsParallel((otherVec)._ocVector, this._oc.SHAPE_TOLERANCE);
    }

    /** Get the axis that this Vector could represent, if not null */
    isWhatAxis():string
    {
        const AXIS = { 'x' : new Vector(1,0,0), 'y' : new Vector(0,1,0), 'z' : new Vector(0,0,1) };

        for (const [axis,vec] of Object.entries(AXIS))
        {
            if(this.normalize().equals(vec))
            {
                return axis;
            }
        }

        return null;
    }

    /** Return the smallest angle between this and another Vector in degrees */
    @checkInput('PointLike', 'Vector')
    angle(other:PointLike, ...args):number
    {
        const otherVec = other as Vector; // auto converted in checkInput
        // protect against zero size Vector
        if(this.length() == 0 || otherVec.length() == 0)
        {
            console.warn(`Vector::angle: Cannot calculate angle with a zero length Vector. Returned null`)
            return null;
        }
        return roundToTolerance(toDeg(this._ocVector.Angle(otherVec._ocVector)));
    }

    /** Angle [0-360] on XY plane 
     *  alias backwards compat
    */
    angle2D():number
    {
        return this.angleXY();
    }

    /** Angle [0-360] on XY plane */
    angleXY():number
    {
        const v = this.copy().setZ(0); // make 2D on XY plane
        let a = v.angleRef([1,0,0],[0,0,-1]);
        return (a < 0) ? 360+a : a;
    }

    /** Angle on XY (top) plane */
    angleXZ():number
    {
        return this.copy().setY(0).angleRef([1,0,0], [0,0,1]);
    }

    /** Angle around Y-axis, alias of angleXZ */
    angleY():number
    {
        return this.angleXZ();
    }

    /** Angle on YZ (right) plane */
    angleYZ():number
    {
        return this.copy().setX(0).angleRef([0,1,0], [0,0,1]);
    }

    /** Angle around X-axis, alias of angleYZ */
    angleX():number
    {
        return this.angleYZ();
    }

    /** Return the angle between one Vector and another where ref defines the positive sense of rotation */
    @checkInput(['PointLike','PointLike'], ['Vector','Vector'])
    angleRef(other:PointLike, ref:PointLike):number
    {
        const otherVec = other as Vector; // auto converted
        const refVec = ref as Vector;

        if( this.normalized().equals(otherVec.normalized())){  return 0 } // avoid error in OC

        // see: https://dev.opencascade.org/doc/refman/html/classgp___vec.html
        /* theVRef defines the positive sense of rotation: the angular value is positive, 
        if the cross product this ^ theOther has the same orientation as theVRef relative to the plane 
        defined by the vectors this and theOther. Otherwise, the angular value is negative. 
        */
        return roundToTolerance(toDeg(this._ocVector.AngleWithRef(otherVec._ocVector, refVec._ocVector)));
    }

    @checkInput('PointLike', 'Vector')
    projectedToPlane(normal:PointLike):Vector
    {
        const n = normal as Vector; // auto converted
        return this.subtracted(
                n.scaled(
                    this.copy().dot(normal)/n.squareMagnitude())
                )
    }

    /** Get smallest angle with another Vector around a axis direction */
    @checkInput(['PointLike', 'PointLike'], ['Vector', 'Vector'])
    angleAround(other:PointLike, axis:PointLike):number
    {
        return this.projectedToPlane(axis as Vector).angle(other as Vector)
    }

    /** Check if this Vector is the same as another */
    @checkInput('PointLike', 'Vector')
    equals(other:PointLike, ...args):boolean
    {
        let otherVec = other as Vector; // auto converted

        return this._ocVector.IsEqual(otherVec._ocVector, this._oc.SHAPE_TOLERANCE, this._oc.SHAPE_TOLERANCE ); // lineair tolerance, angular tolerance
    }

    /** Returns distance between current Vector with another */
    @checkInput('PointLike', 'Vector') // convert input to Vector
    distance(other:PointLike, ...args):number
    {
        return this.subtracted(other as Vector).length();
    }

    /** Returns the X/Y/Z Plane that Vectors share */
    @checkInput('PointLike', 'Vector') // convert input to Vector
    sharedPlanes(other:PointLike, ...args):Array<string>
    {
        const TOLERANCE = this._oc.SHAPE_TOLERANCE;
        const otherVec = other as Vector; // auto converted by @checkInput

        const planes = [];
        if ( Math.abs(this._x - otherVec.x) <= TOLERANCE) planes.push('x');
        if ( Math.abs(this._y - otherVec.y) <= TOLERANCE) planes.push('y');
        if ( Math.abs(this._z - otherVec.z) <= TOLERANCE) planes.push('z');

        return planes;
    }

    //// UTILS ////

    round():Vector // overloaded from Point
    {
        this._x = roundToTolerance(this._x);
        this._y = roundToTolerance(this._y);
        this._z = roundToTolerance(this._z);
        this._updateOcVector();

        return this;
    }

    rounded():Vector  // overloaded from Point
    {
        return this.copy().round();
    }

    //// REPRESENTATIONS ////

    // Point:toData

    /** Export entity and minimal data as string (used for outputting on console and hashing ) */
    toString():string
    {
        return `<Vector[${this.toData()}]>`;
    }

}
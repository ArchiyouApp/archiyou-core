/** 
 * 
 *  Face.ts - A collection of Wires that form the (inner and outher) enclosure of a surface: together form a shell

 */

// constants
import { FACE_PLANE_WIDTH, FACE_PLANE_DEPTH, FACE_PLANE_POSITION, FACE_PLANE_NORMAL, FACE_BASEPLANE_AXIS, FACE_BASEPLANE_SIZE, FACE_CIRCLE_RADIUS, FACE_EXTRUDE_AMOUNT, FACE_OFFSET_AMOUNT, FACE_OFFSET_TYPE, FACE_THICKEN_AMOUNT, FACE_THICKEN_DIRECTION, FACE_LOFT_SOLID, FACE_NORMAL_EDGE_SIZE, FACE_FILLET_RADIUS, FACE_CHAMFER_DISTANCE, FACE_CHAMFER_ANGLE, LinearShape } from './internal'

import type { PointLike, Cursor, PointLikeSequence, MakeFaceInput, 
        AnyShape, Axis, ThickenDirection,
        PointLikeOrAnyShape, PointLikeOrVertexCollection,
        AnyShapeSequence, AnyShapeOrCollection, PointLikeOrAnyShapeOrCollectionOrSelectionString, 
        SelectionString,
        DimensionOptions } from './internal'; // types

// typeguards
import { isPointLike, isCoordArray, isPointLikeSequence, 
    isAnyShapeSequence, isAnyShape, isSelectionString
} from './internal'

import { Vector, Point, Shape, Vertex, Edge, Wire, Shell, Solid, 
        ShapeCollection, VertexCollection,
        DimensionLine } from './internal'

import { addResultShapesToScene, checkInput, protectOC  } from './decorators'; // Import directly to avoid ts-node error
import { targetOcForGarbageCollection, removeOcTargetForGarbageCollection } from './internal';

import { flattenEntities, toRad, roundToTolerance } from './internal' // utils

// this can disable TS errors when subclasses are not initialized yet
type IShell = Shell
type ISolid = Solid

export class Face extends Shape
{   
    
    /* 
        Inherited from Obj:
            + _oc
        Inherited from Shape:
            + _ocShape
            + _ocId
    */

    constructor(entities?:any, ...args:Array<any>)
    {   
        super();

        if (entities)
        {
            let selectedEntities = (Array.isArray(entities) && !isCoordArray(entities)) ? (entities as Array<any>).concat(args) as Array<any>: [entities, ...args];
            selectedEntities = flattenEntities(selectedEntities); // NOTE: we could also use flattenEntitiesToArray
            
            this.fromAll(selectedEntities);   
        }
        else {
            //console.warn(`Face::constructor: Empty Shape created!`);
        }
    }

    /** Create Face from all kinds of inputs */
    @checkInput('MakeFaceInput', 'auto')
    fromAll(o:MakeFaceInput, ...args)
    {
        /* 
            We can create a Face from:
            - a Face - copy the Face
            - a Wire - with closing it
            - a series of Points (PointLikeSequence): Create a 2D/3D Line Wire and close 
            - a series of Edges in ShapeCollection or Array (AnyShapeSequence)

        */

        if (isAnyShape(o) && o.type() == 'Face')
        {
            this._fromOcFace( (o as unknown as Face).copy()._ocShape);
        }
        else if(isAnyShape(o) && o.type() == 'Wire')
        {
            this.fromWire(o as Wire);
        }
        else if (isPointLikeSequence(o))
        {
            let vertexCollection = new VertexCollection(o, ...args); // capture all as VertexCollection
            this.fromVertices(vertexCollection);
        }
        else if (isAnyShapeSequence(o)) // Array or ShapeCollection of Edges
        {
            let edgeCollection = new ShapeCollection(o).getShapesByType('Edge');
            this.fromEdges(edgeCollection);
        }
        else {
            console.error(`Face::fromAll: Could not make Face from input ${o}. Check if its a series of Points, a Wire, a Face or a series of Edges!`);
            return null;
        }

        return this;

    }
    
    //@cacheOperation
    /** Create Face from a Wire */
    @checkInput('Wire', 'Wire')
    fromWire(wire: Wire):Face|Shell
    {   
        /*
         - BREPBuilderAPI_MakeFace: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_builder_a_p_i___make_face.html#a8a9938b47aeace1c59ee3af7fea43919
         - Non planar with BRepFill_Filling: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_fill___filling.html
         - more info: https://dev.opencascade.org/content/create-face-non-planar-wire-using-ocgcmakearcofcircle-and-straight-lines
        */
        wire.close(); 

        if (wire.planar())
        {
            let faceBuilder = new this._oc.BRepBuilderAPI_MakeFace_15(wire._ocShape, false); // OnlyPlane = Standard_False 
            
            faceBuilder.Build(new this._oc.Message_ProgressRange_1());

            if (!faceBuilder.IsDone())
            {
                throw new Error(`Face::fromWire: Cannot build Face: "${faceBuilder.Error().constructor.name}". Check if the Wire describes a space!`);
            }
            else 
            {
                let face = faceBuilder.Face();
                this._fromOcFace(face);
                return this;
            }
        }
        else 
        {
            let wireEdges = wire.edges();
            if (wireEdges.length > 4)
            {
                throw new Error(`Face::fromWire: Cannot build non-planar Face with more than 4 Edges. Got ${wireEdges.length}`);
            }
            else {
                // use Shell.fromEdges to make non-planar Face
                const newShape = new Shell().fromEdges(wireEdges).checkDowngrade();
                removeOcTargetForGarbageCollection(newShape._ocShape); // Avoid any sharing of OC instances
                this._fromOcFace(newShape._ocShape);
                
                
                if(newShape.type() != 'Face')
                {
                    // !!!! This results in a Face class with a Shell Shape inside it !!!!
                    console.warn('Face::fromEdges: Non-planar Edges generated a Shell, not a Face. ')
                }

                return this;
            }
            
        }
    }

    /** Create a Face from Vertices */
    //@cacheOperation
    @checkInput('PointLikeSequence', 'VertexCollection')
    fromVertices(vertices:PointLikeSequence, ...args):Face // also get args for ex: Face.fromVertices([0,0,0],[100,0,0])
    {
        vertices = vertices as VertexCollection; // auto converted
        let wire = new Wire().fromVertices(vertices)
        wire.close();

        return this.fromWire(wire) as Face;
    }

    //@cacheOperation
    @checkInput('AnyShapeSequence', 'ShapeCollection')
    fromEdges(shapes:AnyShapeSequence, ...args):Face // also flat arguments Face.fromEdges(edge1,edge2)
    {
        // TODO: auto-connect Edges?
        shapes = shapes as ShapeCollection; // auto convert
        let edgeCollection = shapes.getShapesByType('Edge');

        if (edgeCollection.length == 0)
        {
            console.warn(`Face::fromEdges: Could not create Face from Edges. Please provide a Array or ShapeCollection of connected Edges!`);
            return null;
        }

        let wire = new Wire().fromEdges(edgeCollection);
        wire.close();
        return this.fromWire(wire) as Face;
    }

    /** Create a Face from a OC Face instance */
    _fromOcFace(ocFace:any):Face
    {
        if(ocFace && (ocFace instanceof this._oc.TopoDS_Face || ocFace instanceof this._oc.TopoDS_Shape) && !ocFace.IsNull())
        {
            this._ocShape = ocFace;
            this._ocId = this._hashcode();
            this.round(); // round to tolerance

            targetOcForGarbageCollection(this, this._ocShape);

            return this;
        }
        else {
            throw new Error(`Face::_fromOcFace: Could not make a valid Face. Check if not null, is the right OC Shape and is not null!`)
        }
    }

    //// CURSOR ////

    /** Generate Cursor */
    getCursor():Cursor
    {
        return { point: this.center(), direction: this.normalAt(this.center()) }
    }

    //// CREATION METHODS ////

    //@cacheOperation
    @checkInput([ [Number,FACE_PLANE_WIDTH], [Number, FACE_PLANE_DEPTH],  ['PointLike',FACE_PLANE_POSITION], ['PointLike',FACE_PLANE_NORMAL]],[Number, Number, 'Point', 'Vector'])
    makePlane(width?:number, depth?:number, position?:PointLike, normal?:PointLike):Face
    {
        /**
         *  OC docs:
         *      - https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep_builder_a_p_i___make_face.html
         * 
         *      NOTE: When we use normals to rotate the plane the width and depth can be turned around. See also planeBetween.
         */
        position = position as Point; // auto converted
        normal = normal as Vector; 

        const ocPlane = new this._oc.gp_Pln_3(position._toOcPoint(), normal._toOcDir());
        const ocFace = new this._oc.BRepBuilderAPI_MakeFace_9(
            ocPlane, -width * 0.5, width * 0.5, -depth * 0.5, depth * 0.5
        ).Face();

        this._fromOcFace(ocFace);

        return this;
        
        // TODO: test for zero width/depth
    }

    /** Make Plane parallel to one of the baseplanes */
    @checkInput([ 'PointLike', 'PointLike' ], ['Vector','Vector'])
    makePlaneBetween(from:PointLike, to:PointLike)
    {
        const PLANE_TO_NORMAL = {
            'xy' : { normal: [0,0,1], switch: false },
            'xz' : { normal: [0,-1,0], switch: true },
            'yz' : { normal: [1,0,0], switch: true }
        }

        const fromVec = from as Vector;
        const toVec = to as Vector;

        const sharedPlane = fromVec.sharedPlane(toVec); // xy, yz, xz

        if (!sharedPlane)
        {
            console.warn(`Face::makePlaneBetween: Can not make plane: Points don't share a baseplane!`);
            return null;
        }
        
        let offsetVec = toVec.subtracted(fromVec);

        // NOTE: when we use normals to rotate the plane the width and depth can be turned around
        let width = PLANE_TO_NORMAL[sharedPlane].switch ? offsetVec[sharedPlane[1]] : offsetVec[sharedPlane[0]]; 
        let depth = PLANE_TO_NORMAL[sharedPlane].switch ? offsetVec[sharedPlane[0]] : offsetVec[sharedPlane[1]]; 
        
        // NOTE: position before rotation
        return this.makePlane(width, depth, fromVec.added( offsetVec.scaled(0.5)), PLANE_TO_NORMAL[sharedPlane].normal);
    }

    /** Make the base planes of the coordinate system
     *  @param axis can be 'z' for 'xy' plane, or directly 'xy'
    */
    //@cacheOperation
    @checkInput([['Axis', FACE_BASEPLANE_AXIS], [Number, FACE_BASEPLANE_SIZE]], ['auto','auto'] )
    makeBasePlane(axis?:Axis, size?:number)
    {
        // We work with the XY Plane as a basis, then simple transform it according to below settings
        const BASE_PLANES_ROTATIONS = {
            'xy' : { rotateAxis: 'x', angle: 0 }, 
            'xz' : { rotateAxis: 'x', angle: 90 }, 
            'yz' : { rotateAxis: 'y', angle: 90 },
            'z' : { rotateAxis: 'x' , angle: 0 }, // XY
            'x' : { rotateAxis: 'y' , angle: 90 }, // YZ
            'y' : { rotateAxis: 'x' , angle: 90 }, // XZ
        }
        
        axis = axis.toLowerCase() as Axis;

        let plane = this.makePlane(size, size);
        let rotation = BASE_PLANES_ROTATIONS[axis];
        return plane['rotate' + rotation.rotateAxis.toUpperCase()](rotation.angle);
    }

    /** Make a 2D plane from two coordinates. See makePlaneBetween for 3D */
    //@cacheOperation
    @checkInput(['PointLike','PointLike'],['Vector', 'Vector'])
    makeRectBetween(from:PointLike,to:PointLike):Face
    {
        let fromV = from as Vector; // auto converted
        let toV = to as Vector;
        
        let diagonalVec = toV.subtracted(fromV);
        let position = fromV.added(diagonalVec.scaled(0.5)).setZ(fromV.z);
        let width = Math.abs(diagonalVec.x);
        let depth = Math.abs(diagonalVec.y);

        if (width == 0 || depth == 0 )
        {
            console.error(`Face::makeRect: Please make sure the Rectangle has a width and depth on XY plane! Given width="${width}" and height="${depth}`);
            return null;
        }
        
        return this.makePlane(width, depth, position);

    }

    @checkInput([ [Number, FACE_CIRCLE_RADIUS ],'PointLike'], ['auto', 'Point'])
    makeCircle(radius:number, center:PointLike ):Face
    {
        const circleFace = new Face().fromWire(new Edge().makeCircle(radius, center)._toWire());
        removeOcTargetForGarbageCollection(circleFace._ocShape); // Avoid sharing OC instances
        this._fromOcFace(circleFace._ocShape);

        return this;
    }

    /** 
     *  docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_offset_a_p_i___make_filling.html#a50e5b1deb08a18908eb8c8dde15dcefd
     *  NOTE: Taken from code by Roger Maitland for CadQuery: https://github.com/CadQuery/cadquery/issues/562 */
    @checkInput(['AnyShapeOrCollection', ['PointLikeSequence', null], ['AnyShapeOrCollection',null]], ['ShapeCollection', 'auto', 'ShapeCollection'])
    makeNonPlanar(wireOrEdges:AnyShapeOrCollection, surfacePoints?:PointLikeSequence, holes?:AnyShapeOrCollection):this|AnyShapeOrCollection
    {
        const ocMakeFilling = new this._oc.BRepOffsetAPI_MakeFilling(3,15,2,false, 0.0001, 0.0001, 0.01, 0.1, 8, 9)
        const allEdges = new ShapeCollection();
        (wireOrEdges as ShapeCollection).forEach(s => { if(['Wire','Edge'].includes(s.type())){ allEdges.add(s.edges()) }}); // wireOrEdges auto converted to ShapeCollection
        allEdges.forEach(e => ocMakeFilling.Add_1(e._ocShape, this._oc.GeomAbs_Shape.GeomAbs_C0, true)) // Add to MakeFilling - NOTE: this changes depending on OC version
        ocMakeFilling.Build(new this._oc.Message_ProgressRange_1());
        if(ocMakeFilling.IsDone())
        {
            const newShapeOrCollection = new Shape()._fromOcShape(ocMakeFilling.Shape())
            if(Shape.isShape(newShapeOrCollection) && newShapeOrCollection.type() === 'Face')
            {
                removeOcTargetForGarbageCollection((newShapeOrCollection as Shape)._ocShape); // Avoid sharing OC instances
                this._fromOcFace((newShapeOrCollection as Shape)._ocShape);
                return this;
            }
            else {
                console.warn(`Face::makeNonPlanar: Result not a Face. Returned new Shape or ShapeCOllection, but did not update original Face`)
                return newShapeOrCollection
            }
        }
        ocMakeFilling.delete();
        // TODO: implement holes and surface points
    }
    
    _setToOc()
    {
        // we only direct OC creation methods
    }

    _toOcSurface():any
    {
        // NOTE: returns handle
        let ocFace = this._makeSpecificOcShape(this._ocShape, 'Face');
        return new this._oc.BRep_Tool.prototype.constructor.Surface_2(ocFace);
    }

    _ocGeom():any 
    {
        /** This returns the most specified subclass of Shape */
        let s = this._makeSpecificOcShape(this._ocShape, 'Face');
        return s;
    }

    /** Create Wire of Face without adding to scene */
    _toWire():Wire
    {
        return this.wires()[0];
    }

    @addResultShapesToScene
    toWire():Wire
    {
        return this.wires()[0];
    }

    /** Create Shell with one Face */
    toShell():IShell
    {
        return new Shell().fromFaces([this], true) as Shell;
    }

    _toShellWhenOcShell():Face|Shell
    {
        return (this.type() === 'Shell') ? new Shell()._fromOcShell(this._ocShape) : this;
    }

    //// CALCULATED PROPERTIES ////

    /** Center of this surface (not its center of mass!) - Override center() of Shape because it results in weird results */
    center():Point
    {
        return this.surfaceCenter();
    }

    /** Check if this Face is planar */
    isPlanar():boolean
    {
        let w = this.wires();
        
        return (w.length > 0) ? w[0].planar() : false;
    }

    is2DXY(): boolean 
    {
        return this.vertices().every(v => (v as Vertex).z <= this._oc.SHAPE_TOLERANCE)
    }

    /** Alias for isPlanar */
    planar():boolean
    {
        return this.isPlanar();
    }

    /** Get subtype of Face - used in Selectors */
    faceType():string
    {
        return (this.isPlanar()) ? 'Planar' : 'Curved';
    }

    outerWire():Wire
    {
        const OcBRepTools = this._oc.BRepTools.prototype.constructor;
        const w = new Wire()._fromOcWire(OcBRepTools.OuterWire(this._ocShape));
        return w;
    }

    innerWires():ShapeCollection
    {
        const outerWire = this.outerWire();
        const innerWires = new ShapeCollection(this.wires().filter(w => !w.same(outerWire))); // filter can return single Shape
        return innerWires;
    }

     /** Get min U, max U, min V and max V parameters of current Face */
    uvBounds()
    {
        /* 
            OC docs: 
            - BRepTools: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_tools.html
            - Bnd_Box2d: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_bnd___box2d.html

            See solution for references to javascript variables: https://github.com/donalffons/opencascade.js/blob/master/doc/README.md#references-to-built-in-data-types
        */

        const umin= { current: 0 };
        const umax = { current: 0 };
        const vmin = { current: 0 };
        const vmax = { current: 0 };

        const ocFace = this._makeSpecificOcShape(this._ocShape, 'Face');        
        this._oc.BRepTools.UVBounds_1(ocFace, umin,umax, vmin, vmax); // Although it does not crash these values still don't get updated!

        return [umin.current,umax.current, vmin.current, vmax.current];
    }

    /** Reverse Face */
    reverse():Face
    {
        this._ocShape.Reverse();
        return this;
    }

    /** Get uv paramaters at center of Face */
    uvCenter():Array<number>
    {
        let bounds = this.uvBounds();
        let uMid = bounds[0] + (bounds[1] - bounds[0])/2;
        let vMid = bounds[2] + (bounds[3] - bounds[2])/2;
        return [uMid, vMid];
    }

    /** Get center of this Face surface */
    surfaceCenter():Point
    {
        let uvCenter = this.uvCenter();
        return this.pointAtUv(uvCenter[0], uvCenter[1]);
    }

    /** Get normal of Plane Face - use normalAt for curved surfaces */
    normal():Vector
    {
        if (!this.isPlanar())
        {
            console.warn(`Face::normal: Face is not planar. Use normalAt to get normal at specific location! Returned normal at first Vertex`);
        }

        let startVertex = this.vertices().first() as Vertex;
        return this.normalAt(startVertex);
    }

    /** Get the normal at a certain Point location on the Face */
    @checkInput('PointLike','Point')
    normalAt(p:PointLike):Vector
    {
        let point = p as Point; // auto converted by @checkInput

        if(point == null || !this.intersects(point._toVertex()))
        {
            console.warn(`Face::normalAt: Given point ${point} does not lie on this Face! Returned null`);
            return null;
        }

        let uv = this.uvAt(point);
        if (uv)
        {
            return this.normalAtUv(uv[0],uv[1]);
        }
        else {
            console.error(`normalAt: Could not find UV coordinates. Check Point (${point}) and Face!`)
            return null;
        }
    }

    /** Get normal at given uv coordinates */
    @checkInput([Number,Number],[Number,Number])
    normalAtUv(u:number, v:number):Vector
    {
        // OC docs: GeomLProp_SLProps - https://dev.opencascade.org/doc/refman/html/class_geom_l_prop___s_l_props.html

        // check if uv parameters are within bounds
        if(!this._testUvToBounds(u,v))
        {
            console.warn(`Face::normalAtUv: UV values [${u},${v}] are out of bounds! Returned null`);
            return null;
        }

        let ocSurface = this._toOcSurface();
        let ocSurfaceProps = new this._oc.GeomLProp_SLProps_1(ocSurface, u, v, 2, 0.001);
        if (ocSurfaceProps.IsNormalDefined())
        {
            let normal = new Vector()._fromOcDir( ocSurfaceProps.Normal() );
            // To be sure: check orientation - reversed Faces we are trying to avoid in creation methods

            if(this._ocShape.Orientation_1() === this._oc.TopAbs_Orientation.TopAbs_REVERSED)
            {
                // console.warn(`Face::normalAtUv: Encoutered a reversed Face: flipped outputted normal!`)
                return normal.reversed();
            } 
            else {
                return normal;
            }
        }
        else {
            console.error(`Face::normalAtUv: Could not get normal of this Face.`)
            return null;
        }
    }

    /** Create a Edge for Planar Face Normal */
    @checkInput([Number,FACE_NORMAL_EDGE_SIZE], Number)
    normalEdge(size?:number)
    {
        return new Edge(this.center(), this.surfaceCenter().toVector().added(this.normal().scaled(size)))
    }

    /** Calculate the area of this Face */
    area():number
    {
        const ocProps = new this._oc.GProp_GProps_1();
        const BRepGProp = this._oc.BRepGProp.prototype.constructor;

        BRepGProp.SurfaceProperties_1(this._ocShape, ocProps, false, false);
        const area = roundToTolerance(ocProps.Mass());
        ocProps?.delete(); // clear OC instance
        return area;
    }
    

    //// OPERATIONS ON FACE ////

    /** Rotate this Face to its normal is parallel to the given Vector */
    @checkInput(['PointLike',['PointLike', null]], ['Vector', 'auto'])
    rotateTo(vector:PointLike,pivot?:PointLike):Face
    {
        const toVec = (vector as Vector).normalize();
        const curNormal = this.normal();

        if (toVec.equals(curNormal))
        {
            // normal is already toVec
            return;
        }

        const angle = curNormal.angle(toVec);

        const rotationAxisVec = curNormal.crossed(toVec);
        const rotationPivot = (pivot as Point) || this.center();

        this.rotateAround(angle, rotationAxisVec, rotationPivot);

        return this;
    }

    /** Extrude a Face a certain amount into a given direction. (private: not added to Scene)
     *  This always creates a different type of Shape ( from Face to Solid ) to use extruded instead of extrude for now
    */
    @checkInput([ [Number, FACE_EXTRUDE_AMOUNT], ['PointLike',null]], [Number, 'auto']) // don't check direction
    _extruded(amount?:number, direction?:PointLike):ISolid
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_prim_a_p_i___make_prism.html
        let directionVec = (direction) ? new Vector(direction) : this.normal();
        
        let extrudeVec = directionVec.normalized().scaled(amount);

        let ocSolid = new this._oc.BRepPrimAPI_MakePrism_1(this._ocShape, extrudeVec._toOcVector(), true, true).Shape(); // make a copy 
        let newSolid = new Solid()._fromOcSolid(ocSolid);

        return newSolid;
    }

    /** Extrude a Face a certain amount into a given direction. (private: not added to Scene) */
    @addResultShapesToScene
    @checkInput([ [Number, FACE_EXTRUDE_AMOUNT], ['PointLike',null]], [Number, 'auto']) // don't check direction
    extruded(amount?:number, direction?:PointLike):ISolid
    {
        return this._extruded(amount, direction);
    }

    /** Same as extruded() but replaces old Shape with extruded one */
    @checkInput([ [Number, FACE_EXTRUDE_AMOUNT], ['PointLike',null]], [Number, 'auto']) // don't check direction
    extrude(amount?:number, direction?:PointLike):ISolid
    {
        let extrudedFace = this._extruded(amount, direction) as Solid;
        if (!extrudedFace)
        {
            console.error(`Face::extrude: Failed. Kept original Face. Check given amount (${amount}) and direction (${direction})`);
            return null;
        }
        
        this.replaceShape(extrudedFace);
        return extrudedFace;
    }

    /** For consistency: Refer shell() to extrude() on Faces */
    @checkInput([[Number,FACE_EXTRUDE_AMOUNT]], ['auto'])
    shell(amount?:number):ISolid
    {
        console.warn(`Face::IShell: Shelling does not really work on Faces. Did an extrude instead!`)
        return this.extrude(amount);
    }

    @checkInput([[Number,FACE_EXTRUDE_AMOUNT]], ['auto'])
    shelled(amount?:number):ISolid
    {
        console.warn(`Face::IShell: Shelling does not really work on Faces. Did an extrude instead!`)
        return this.extruded(amount);
    }

    /** Make a bigger (+amount) or smaller (-amount) Face (private)
     *  NOTE: onPlaneNormal is for consistency and does nothing
    */
    @checkInput([[Number,FACE_OFFSET_AMOUNT],[String, FACE_OFFSET_TYPE],['PointLike',null]], ['auto', 'auto', 'Vector'])
    _offsetted(amount?:number, type?:string, onPlaneNormal?:PointLike):this
    {
        /*
            OC docs:
                - https://dev.opencascade.org/doc/refman/html/class_b_rep_offset_a_p_i___make_offset.html
        */                   

        if (!this.isPlanar())
        {
            console.warn(`Face::offsetted: Cannot offset non-planar Face! You can try to convert to Shell and offset.`);
            return this;
        }

        // use Wire method
        const offsetWire = this._toWire()._offsetted(amount,type);
        if(!offsetWire)
        {
            console.warn(`Face::offsetted: Failed to offset Wire. Returned copy of original`);
            return this.copy() as this; // avoid TS warning 
        }
        
        const newFace = offsetWire._toFace()._copy() as this; // avoid TS warning 

        return newFace;        
    }

    /** Make a bigger (+amount) or smaller (-amount) Face (private) */
    @addResultShapesToScene
    @checkInput([[Number,FACE_OFFSET_AMOUNT],[String, FACE_OFFSET_TYPE],['PointLike',null]], ['auto', 'auto', 'Vector'])
    offsetted(amount?:number, type?:string, onPlaneNormal?:PointLike):this
    {
        return this._offsetted(amount,type,onPlaneNormal);
    }

    /** Make the Face bigger (+amount) or smaller (-amount) */
    @checkInput([[Number,FACE_OFFSET_AMOUNT],[String, FACE_OFFSET_TYPE],['PointLike',null]], ['auto', 'auto', 'Vector'])
    offset(amount?:number, type?:string, onPlaneNormal?:PointLike):this
    {
       const offsetFace = this._offsetted(amount, type)

       if(!offsetFace)
       {
            console.warn(`Face::offset: Could not offset Face. Returned original!`);
       }
       else {
            // IMPORTANT: We can't directly set _ocShape from offsetFace because 
            // it will create a shared instance that might be deleted when offsetFace is garbage collected
            removeOcTargetForGarbageCollection(offsetFace._ocShape); // Avoid sharing OC instances
            this._ocShape = offsetFace._ocShape;
       }

       return this;
    }


    /** Thicken the Face a given amount and direction to create a Solid */
    @checkInput([ [Number,FACE_THICKEN_AMOUNT],['ThickenDirection',FACE_THICKEN_DIRECTION]], [Number, 'auto'])
    _thickened(amount?:number, direction?:ThickenDirection):ISolid
    {
        // This is actually extrude with extra alignments, we use the methods on Shell
        return this.toShell().thickened(amount, direction);
    }

    @addResultShapesToScene
    @checkInput([ [Number,FACE_THICKEN_AMOUNT],['ThickenDirection',FACE_THICKEN_DIRECTION]], [Number, 'auto'])
    thickened(amount?:number, direction?:ThickenDirection):ISolid
    {
        return this._thickened(amount,direction);
    }   

    /** Thicken current Face  */
    @checkInput([ [Number,FACE_THICKEN_AMOUNT],['ThickenDirection',FACE_THICKEN_DIRECTION]], [Number, 'auto'])
    thicken(amount?:number, direction?:ThickenDirection):ISolid
    {
        let thickenedShape = this._thickened(amount, direction);
        if (!thickenedShape)
        {
            console.error(`Face::thickened: Thickening failed. Face remains the same. Check given amount and direction.`)
            return null;
        }

        this.replaceShape(thickenedShape);
        return thickenedShape
    }

    /** Make a Shell or Solid by lofting outerWire of Face to other Wire Shapes  */
    @checkInput(['AnyShapeOrCollection', [Boolean, FACE_LOFT_SOLID ]], ['ShapeCollection', 'auto'])
    _lofted(sections:AnyShapeOrCollection, solid?:boolean):IShell|Solid
    {
        let outerWire = this.outerWire();
        return outerWire._lofted(sections, solid); // already added to Scene
    }

    @addResultShapesToScene
    @checkInput(['AnyShapeOrCollection', [Boolean, FACE_LOFT_SOLID ]], ['ShapeCollection', 'auto'])
    lofted(sections:AnyShapeOrCollection, solid?:boolean):IShell|Solid
    {
        return this._lofted(sections, solid)
    }

    /** Loft current Face */
    @checkInput(['AnyShapeOrCollection', [Boolean, FACE_LOFT_SOLID ]], ['ShapeCollection', 'auto'])
    loft(sections:AnyShapeOrCollection, solid?:boolean):IShell|Solid
    {
        let outerWire = this.outerWire();
        let loftedShape = outerWire._lofted(sections, solid);
        this.replaceShape(loftedShape);
        return loftedShape;
    }

    /** Extrude and twist a given amount of angles (private, without adding to scene ) */
    @checkInput([[Number,100],[Number, 360],['PointLike', null],['PointLike',[0,0,1]],[Boolean,false]],['auto','auto', 'Point', 'Vector','auto'])
    _twistExtruded(amount?:number, angle?:number, pivot?:PointLike, direction?:PointLike, lefthand?:boolean):ISolid
    {
        let outerSolid = this.outerWire()._twistExtruded(amount,angle,pivot,direction,lefthand);
        let innerSolids = this.innerWires().toArray().map( w => (w as Wire)._twistExtruded(amount,angle,pivot,direction,lefthand));
        
        if (innerSolids.length == 0 )
        {
            this.replaceShape(outerSolid)
            return outerSolid;
        }
        else {
            // subtract innerSolids from outerSolid
            let resultSolid = outerSolid;
            innerSolids.forEach( solid => resultSolid._subtracted(solid))
            return resultSolid;
        }
    }

    /** Extrude and twist a given amount of angles (public ) */
    @checkInput([[Number,100],[Number, 360],['PointLike', null],['PointLike',[0,0,1]],[Boolean,false]],['auto','auto', 'Point', 'Vector','auto'])
    twistExtruded(amount?:number, angle?:number, pivot?:PointLike, direction?:PointLike, lefthand?:boolean):ISolid
    {
        let resultSolid = this._twistExtruded(amount,angle,pivot,direction,lefthand);
        resultSolid.addToScene();
        return resultSolid;
    }


    /** Extrude Face and rotate a given angle */
    @checkInput([[Number,100],[Number, 360],['PointLike', null],['PointLike',[0,0,1]],[Boolean,false]],['auto','auto', 'Point', 'Vector','auto'])
    twistExtrude(amount?:number, angle?:number, pivot?:PointLike, direction?:PointLike, lefthand?:boolean):ISolid
    {
       let resultSolid = this._twistExtruded(amount,angle,pivot,direction,lefthand);
       this.replaceShape(resultSolid);
       return resultSolid;
    }

    /** Round corners of Wire with given radius, at given Vertex (same or equals) or VertexCollection or all if given none */
    @protectOC('Size of fillet may not exceed length of neighboring Edges')
    @checkInput([[Number,FACE_FILLET_RADIUS],['PointLikeOrAnyShapeOrCollectionOrSelectionString', null]],['auto','auto'])
    fillet(radius?:number, at?:PointLikeOrAnyShapeOrCollectionOrSelectionString )
    {
        // OC docs: BRepFilletAPI_MakeFillet2d: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_fillet_a_p_i___make_fillet2d.html
        if(this.isEmpty() || !this.planar())
        {
            console.warn(`Face::fillet: Cannot fillet a empty or non-planar Face!`);
            return;
        }
        
        // Fillet can either supply a SelectionString or Any Shape or Collection
        let filletVertices = new VertexCollection();
        let doCheck = true;
        if (at == null)
        {   
            filletVertices = this.vertices() as VertexCollection; // all
            doCheck = false;
        }
        if (isSelectionString(at))
        {
            let selectedShapes = this.select(at as SelectionString);
            if (selectedShapes == null)
            {
                console.warn(`No vertices found with selection string: "${at}. Fell back to all!`);
                filletVertices = this.vertices() as VertexCollection;
                doCheck = false;
            }
            else {
                filletVertices = selectedShapes.getSubShapes('Vertex') as VertexCollection;
            }
        }
        else // a Shape or Collection
        {
            filletVertices = new ShapeCollection(at).getSubShapes('Vertex') as VertexCollection;
        }

        // now start tests
        let checkedVertices = new ShapeCollection();
        let faceVertices = this.vertices();
        if (doCheck && filletVertices && filletVertices.length > 0)
        {
            
            filletVertices.forEach( v => 
            {
                if (faceVertices.has(v))
                {
                    checkedVertices.add(v);
                }
                else 
                {
                    let equalVertex = faceVertices.find( fv => fv.equals(v)); // also try to get original Vertex or Face based on equal geometry
                    if (equalVertex)
                    {
                        checkedVertices.add(equalVertex);
                    }
                    else {
                        console.warn(`Face::fillet: Skipped given Vertex "${v}": Is not part of current Face or does not equal a Vertex on Face!`);
                    }
                }
            })
        }
        else 
        {
            checkedVertices = filletVertices; // directly take filletVertices without testing
        }
        
        // one last test
        let filletAtVertices = ((checkedVertices && checkedVertices.length > 0) ? checkedVertices : faceVertices) as VertexCollection;
        filletAtVertices = filletAtVertices.unique() as VertexCollection; // remove double vertices for more robustness

        let ocMakeFillet = new this._oc.BRepFilletAPI_MakeFillet2d_2(this._ocShape);

        filletAtVertices.forEach( v => 
        {
            ocMakeFillet.AddFillet(v._ocShape, radius)
        });

        ocMakeFillet.Build(new this._oc.Message_ProgressRange_1());
        this._fromOcFace(ocMakeFillet.Shape());

        return this;        
    }

     /** Chamfer two connected Edges at given Vertex and with and angle of given Edge */
     @protectOC('Size of chamfer may not exceed length of neighboring Edges')
     @checkInput([[Number,FACE_CHAMFER_DISTANCE],[Number,FACE_CHAMFER_ANGLE],['PointLikeOrVertexCollection', null],['AnyShapeOrCollection',null]],['auto','auto', 'VertexCollection', 'ShapeCollection'])
     chamfer(distance?:number, angle?:number, vertices?:PointLikeOrVertexCollection, edges?:ShapeCollection )
     {
         // OC docs: BRepFilletAPI_MakeFillet2d: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_fillet_a_p_i___make_fillet2d.html
         if(this.isEmpty() || !this.planar())
         {
             console.warn(`Face::chamfer: Cannot fillet a empty or non-planar Face!`);
             return;
         }

        // check given Vertex, otherwise all
        let chamferEdges = vertices as VertexCollection; // auto converted
        let faceVertices = this.vertices();
        let checkedVertices = new ShapeCollection();

        if (chamferEdges && chamferEdges.length > 0)
        {
            chamferEdges.forEach( v => 
            {
                if (faceVertices.has(v))
                {
                    checkedVertices.add(v);
                }
                else 
                {
                    let equalVertex = faceVertices.find( fv => fv.equals(v)); // also try to get original Vertex or Face based on equal geometry
                    if (equalVertex)
                    {
                        checkedVertices.add(equalVertex);
                    }
                    else {
                        console.warn(`Face::fillet: Skipped given Vertex "${v}": Is not part of current Face or does not equal a Vertex on Face!`);
                    }
                }
            })
        }
 
         let chamferAtVertices = ((checkedVertices && checkedVertices.length > 0) ? checkedVertices : this.vertices()) as VertexCollection;
 
         let ocMakeChamfer = new this._oc.BRepFilletAPI_MakeFillet2d_2(this._ocShape);
         let allEdges = this.edges();
 
         chamferAtVertices.forEach( (vertex,i) => 
         {   
             let vertexIndex = faceVertices.indexOf( faceVertices.find( v => v.equals(vertex) ));
            
             let primaryEdge:Edge;
             
             if (edges && edges[i] && ( edges[i].start().equals(vertex) || edges[i].end().equals(vertex)) ) // check if given Edge is really aligning
             {
                primaryEdge = edges[i];
             }
             else 
             {
                // automatically pick first Edge as primary
                let edgeIndex = ( vertexIndex == 0 ) ? (allEdges.length - 1) : vertexIndex - 1;
                primaryEdge = allEdges[edgeIndex];
             }

             // now add chamfer
             ocMakeChamfer.AddChamfer_2(primaryEdge._ocShape, vertex._ocShape, distance, toRad(angle))
         });
 
         ocMakeChamfer.Build(new this._oc.Message_ProgressRange_1());
         let newOcFace = ocMakeChamfer.Shape();
 
         this._fromOcFace(newOcFace);
 
         return this;     
    }

    /** Create a new Face by projecting current onto another Face, Shell or Solid 
     *   NOTE: converted from code by Roger Maitland for CadQuery: https://github.com/CadQuery/cadquery/issues/562
     *   TODO: FINISH
    */
    
    @checkInput(['AnyShape', ['PointLike',null], ['PointLike', null]], ['auto','Vector', 'Vector'])
    _projectTo(other:AnyShape, direction:Vector, center?:Vector):null|ShapeCollection
    {
        if(!direction && !center){ throw new Error(`Wire._projectTo: Please supply a PointLike for direction or center!`);}
        if(['Vertex', 'Edge', 'Wire'].includes(other.type())){ throw new Error(`Wire._projectTo: Please supply a Face, Shell or Solid to project on!`);}

        const projOuterWires = this.outerWire();
        const projInnerWires = this.innerWires()

        return null
    }


    //// SPECIFIC METHODS ON FACE ====

    _intersectionsWithFace(other:Face):Shape|Vertex|Edge|Vertex|Face|ShapeCollection
    {
        // see OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_int_tools___face_face.html
        let ocIntTool = new this._oc.IntTools_FaceFace();
        // ocIntTool.SetParameters(true, true, true, 1e-3 );
        
        ocIntTool.Perform(this._ocShape, other._ocShape);
        
        let intersectionShapes = new ShapeCollection();

        if ( ocIntTool.IsDone())
        {
            if (ocIntTool.TangentFaces())
            {
                // Faces lie directly on each other: return the smallest
                console.warn(`Face::_intersectionWithFace: Faces are tangent: TODO a valid solution`);
                return ( this.area() < other.area() ) ? this : other;
            }
            if (ocIntTool.Lines().Length() > 0)
            {
                // we can have multiple intersection Lines: iterate
                let ocLineSequence = ocIntTool.Lines();

                for ( let i = 1; i <= ocLineSequence.Size(); i++ )
                {
                    let ocCurveHandle = ocIntTool.ocLineSequence.Value(i); // Lines() returns IntTools_SequenceOfCurves
                    let ocCurve = ocCurveHandle.Curve().get();
                    
                    let newEdge = new Edge()._fromOcEdge(ocCurve);
                    intersectionShapes.push(newEdge);
                }
                
            }
            if (ocIntTool.Points().Length() > 0)
            {
                let ocPointSequence = ocIntTool.Points(); // see: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/_int_tools___sequence_of_pnt_on2_faces_8hxx.html#a0795e767e124ecc7741141e8dd12bfe3
                for ( let i = 1; i <= ocPointSequence.Size(); i++ )
                {
                    let ocPntOn2Faces = ocPointSequence.Value(i); // https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_int_tools___pnt_on2_faces.html
                    let ocPnt = ocPntOn2Faces.P1().Pnt() // PntOnFace: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_int_tools___pnt_on2_faces.html
                    let vertex = new Vertex()._fromOcPoint(ocPnt);
                    intersectionShapes.push(vertex);
                }
            }

        }

        return intersectionShapes.collapse();

    }

    //// FACE SPECIFIC CALCULATED PROPERTIES ////

    @checkInput([Number,Number],[Number,Number])
   _testUvToBounds(u:number, v:number):boolean
    {
        let bounds = this.uvBounds();
        return (u >= bounds[0] && u <= bounds[1] && v >= bounds[2] && v <= bounds[3])
    }

    /** Get position Vector at UV coords */
    @checkInput([Number,Number],[Number, Number])
    pointAtUv(u:number, v:number):Point
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_shape_analysis___surface.html#ad17aee92b394ed751cb743ba2c905192
        let ocSurface = this._toOcSurface();
        let ocSurfaceAnalysis = new this._oc.ShapeAnalysis_Surface(ocSurface);
        let ocPoint = ocSurfaceAnalysis.Value_1(u,v);
        return new Point()._fromOcPoint(ocPoint);
    }

    /** Get UV coordinates of point on Face */
    @checkInput('PointLike', 'Vertex')
    uvAt(point:PointLike):Array<number>
    {
        // OC docs - ShapeAnalysis_Surface: https://dev.opencascade.org/doc/refman/html/class_shape_analysis___surface.html#a7afb0a355d4e5cbddb8b9b66d71a4d7e
        
        let vertex = point as Vertex; // auto converted
        
        if(!this.intersects(vertex))
        {
            console.error(`Face::uvAt: Point ${vertex} is not on this Face!`);
            return null;
        }
        
        let ocSurface = this._toOcSurface();
        let ocSurfaceAnalysis = new this._oc.ShapeAnalysis_Surface(ocSurface);
        let ocPointUV = ocSurfaceAnalysis.ValueOfUV(vertex._toOcPoint(), this._oc.SHAPE_TOLERANCE);  // prec

        let uv = (ocPointUV) ? [ ocPointUV.X(), ocPointUV.Y()] : null;  
        
        if (!uv || uv[0] == null || uv[1] == null ) // this actually never happens so it seems in OC: it even returns if outside bounds - not even on the same plane!
        {
            console.warn(`uvAt: Given point [${vertex.toArray()}] not on Face!`);
            return null;
        }

        // check if its within bounds
        let bounds = this.uvBounds();
        uv[0] = (uv[0] < bounds[0]) ? bounds[0] : uv[0];
        uv[0] = (uv[0] > bounds[1]) ? bounds[1] : uv[0];
        uv[1] = (uv[1] < bounds[2]) ? bounds[2] : uv[1];
        uv[1] = (uv[1] > bounds[3]) ? bounds[3] : uv[1];
        
        return uv;
    }

    //// PREDICATES RELATED TO OTHER SHAPES ////

    /** Check if a given Point or Shape can be considered parallel to current Face */
    @checkInput('PointLikeOrAnyShape', 'auto')
    parallel(other:PointLikeOrAnyShape):boolean
    {
        const NOT_WORKING_TYPES = [ 'Vertex', 'Edge', 'Wire', 'Shell', 'Solid'];

        if ( isAnyShape(other) && NOT_WORKING_TYPES.includes((other as Shape).type()) )
        {
            console.warn(`Face::parallel: Parallel to Shape of type "${(other as Shape).type()}" does not really make sense!`);
            return false;
        }

        if (isPointLike(other))
        {
            if (this.isPlanar())
            {
                return this.normal().equals(new Vector(other as PointLike).normalized());
            }
            else {
                return false;
            }
        }
        else if ( isAnyShape(other) && (other as AnyShape).type() == 'Face' )
        {
            if ( this.isPlanar() && ( other as Face).isPlanar() )
            {
                return this.normal().equals( (other as Face).normal());
            }
            else {
                console.warn(`Face::parallel: **** NOT IMPLEMENTED: advanced Faces parallel ****`);
                return false;
            }
        }

        return false;
    }
    
    /** Check if this Face is orthogonal (parallel with one of the base planes) */
    orthogonal():boolean
    {
        const AXIS = [[1,0,0],[0,1,0],[0,0,1],[-1,0,0],[0,-1,0],[0,0,-1]]; // all axis Vectors

        if (!this.isPlanar())
        {
            return false; // curved surfaces cannot be orthogonal
        }

        let normal = this.normal();
        return AXIS.find( axisNormal => normal.round().equals(new Vector(axisNormal))) != undefined;
    }

    //// SHAPE ANNOTATIONS API ////

    /** Simply generate dimension lines for all visible Edges in this Face 
     *  TODO: make sure offsets are right, skip same edges in boxes
    */
    @checkInput([['DimensionOptions',null]], ['auto'])
    dimension(dim?:DimensionOptions):DimensionLine|Array<DimensionLine>
    {
        const dimLines = new ShapeCollection(this.edges().visible()).toArray().map( e => e.dimension(dim)) as Array<DimensionLine>
        return dimLines.length ? dimLines[0] : dimLines;
    }

    /** Alias for dimension() */
    @checkInput([['DimensionOptions',null]], ['auto'])
    dim(dim?:DimensionOptions):DimensionLine|Array<DimensionLine>
    {
        return this.dimension(dim);
    }

    //// OUTPUT ////
    
    /** Export entity and minimal data as string (used for outputting on console and hashing ) */
    toString():string
    {
        return `<Face:${this.faceType()} numVertices="${this.vertices().length}" numEdges="${this.edges().length}">`;
    }


}
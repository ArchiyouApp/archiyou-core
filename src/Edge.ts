/** 
 * 
 *  Edge.ts - a trimmed curve that represents a border of a Face
 *  an Edge can be created as:
 *      - Line
 *      - Spline
 *      - BSpline
 *      - Arc
 *      - Ellipse
 *      - Circle 
 */

import chroma from 'chroma-js' // direct import like in documentation does not work - fix with @types/chroma

import { EDGE_DEFAULT_START, EDGE_DEFAULT_END, EDGE_DEFAULT_CIRCLE_RADIUS, EDGE_DEFAULT_OFFSET, EDGE_DEFAULT_THICKEN,
    EDGE_DEFAULT_POPULATE_NUM, EDGE_DEFAULT_EXTEND_AMOUNT, EDGE_DEFAULT_EXTEND_DIRECTION, EDGE_DEFAULT_ALIGNTO_FROM,
    EDGE_DEFAULT_ALIGNTO_TO, EDGE_DEFAULT_SEGMENTS_ANGLE, EDGE_DEFAULT_SEGMENTS_SIZE
} from './internal'
import { Vector, Point, Shape, Vertex, Wire, Face, Shell, Solid, ShapeCollection, VertexCollection } from './internal'
import { ObjStyle, ThickenDirection, PointLike, isPointLike,Cursor,AnyShape, AnyShapeOrCollection,
        LinearShape, LinearShapeTail, PointLikeSequence } from './internal' // see types
import { roundToTolerance } from './internal'
import { addResultShapesToScene, checkInput } from './decorators' // import directly to avoid ts-node error
import { WIRE_LOFTED_SOLID } from './internal'
import { toRad } from './internal';
import { Annotation, DimensionLine, DimensionOptions } from './internal' // from Annotator through internal.ts

// this can disable TS errors when subclasses are not initialized yet
type IWire = Wire
type IFace = Face
type IShell = Shell
type IDimensionLine = DimensionLine


export class Edge extends Shape
{
    /* OC docs:
         https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_topo_d_s___edge.html#ae1422a3d162365b40d12e941c216f0d0
    
        Inherited from Shape:
        _oc
        _geom
        _obj
        _parent
        _ocShape
        _ocId
    */

    //// SETTINGS ////
    TO_SVG_DASH_SIZE = 5

    /** Creates a simple Line Edge, use new Edge().makeCicle etc for others */
    constructor(start?:any, end?:any) // NOTE: decorators cannot be applied to constructors
    {   
        super(); // Shape constructor

        if (start && end)
        {
            this.makeLine(start,end);
        }

        // NOTE: We can always create default Edges with new Edge() and then alter them with makeCircle, makeArc etc
    }

    //// TRANSFORMATION METHODS ////

    _fromOcEdge(ocEdge:any):Edge
    {
        if (ocEdge && (ocEdge instanceof this._oc.TopoDS_Edge || ocEdge instanceof this._oc.TopoDS_Shape) && !ocEdge.IsNull() )
        {
            // For easy debug, always make sure the wrapped OC Shape is TopoDS_Edge
            ocEdge = this._makeSpecificOcShape(ocEdge, 'Edge');

            this._ocShape = ocEdge;
            this._ocId = this._hashcode();
            this.round(); // round to tolerance - !!!! look like not really working
            return this;
        }
        else {
            throw new Error('Edge::_fromOcEdge: Could not make an Edge, no valid ocEdge given! Check for nulls, the right ocShape type or empty Edge!')
        }
    }

    /**
     * Create Edge from given OC Curve
     * @param ocCurve Geom_Curve
     * @param ocStartPnt gp_Pnt
     * @param ocEndPnt gp_Pnt
     */
    _fromOcCurve(ocCurve:any): Edge
    {
        let ocStartPnt = ocCurve.Value(ocCurve.FirstParameter());
        let ocEndPnt = ocCurve.Value(ocCurve.LastParameter());
        
        let ocCurveHandle = new this._oc.Handle_Geom_Curve_2(ocCurve);
        let ocEdgeCreator = new this._oc.BRepBuilderAPI_MakeEdge_25(ocCurveHandle, ocStartPnt, ocEndPnt ); // see: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep_builder_a_p_i___make_edge.html#a424f7c2f5b8c3588e88e83789a7a5446
        let ocEdge = ocEdgeCreator.Edge();
        
        this._fromOcEdge(ocEdge);

        return this;
    }

    _ocGeom():Edge 
    {
        return this._ocShape;
    }

    /** Convert Edge to one Vector */
    toVector():Vector
    {
        return this.center().toVector();
    }

    _toWire():IWire
    {
        return new Wire().fromEdges([this]);
    }

    /** Convert to Wire and add to Scene */
    @addResultShapesToScene
    toWire():IWire
    {
        return this._toWire()
    }

    _toOcCurve():any
    {
        /** OC docs 
         * BRep_Tool: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep___tool.html 
         * Adaptor3d_Curve: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_adaptor3d___curve.html
         * */

        let curve = new this._oc.BRepAdaptor_Curve_2(this._ocShape);
        return curve;
    }
    
    _toOcCurveHandle():any
    {
        return new this._oc.Handle_Geom_Curve_2(this._toOcCurve().Curve().Curve().get());
    }

    //// CURSOR ////

    getCursor():Cursor
    {
        return { point: this.end().toPoint(), direction: this.directionAt(this.end()) }
    }

    //// CREATION METHODS ////
    
    @checkInput([ ['PointLike',EDGE_DEFAULT_START], ['PointLike',EDGE_DEFAULT_END ] ], ['Vertex', 'Vertex'])
    makeLine(start:PointLike, end:PointLike):Edge
    {
        start = start as Vertex; // auto converted
        end = end as Vertex; 

        let ocEdge;
        if (start.equals(end))
        {
            // Zero length Edge: don't allow and use default
            start = new Vertex(EDGE_DEFAULT_START);
            end =  new Vertex(EDGE_DEFAULT_END);
            console.error(`Edge::makeLine: Start and end Vertex are the same: Zero length Edges are not allowed. Defaulted back to [${EDGE_DEFAULT_START}],[${EDGE_DEFAULT_END}]`);
        }

        let creator =  new this._oc.BRepBuilderAPI_MakeEdge_3(start._toOcPoint(), end._toOcPoint() );
        ocEdge = creator.Edge();
        this._fromOcEdge(ocEdge);
        
        return this;
    }

    
    /** Create a Circle Edge with given radius (default:50) and center (default: [0,0,0]) */
    @checkInput([ [Number, EDGE_DEFAULT_CIRCLE_RADIUS], ['PointLike', [0,0,0]] ], ['auto', 'Point' ])
    makeCircle(radius?:number, center?:PointLike):Edge
    {
        /* OC docs:
         *      - gp_Circ: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/classgp___circ.html
         *      - gp_Ax2: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/classgp___ax2.html
         *      - gp_Dir: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/classgp___dir.html
         */

        center = center as Point; // auto converted
        let ocCircle = new this._oc.gp_Circ_2(new this._oc.gp_Ax2_3(center._toOcPoint(),new this._oc.gp_Dir_4(0, 0, 1)), radius); 
        let ocEdge = new this._oc.BRepBuilderAPI_MakeEdge_8(ocCircle).Edge();
        this._fromOcEdge(ocEdge);
        
        return this;
    }

    /** Make Spline that goes through Vectors provided in list of points (PointLike) */
    @checkInput('PointLikeSequence', 'VertexCollection')
    makeSpline(points:PointLikeSequence, ...args):Edge
    {
        /* OC docs: 
            - tcolgp: https://dev.opencascade.org/doc/occt-6.9.0/refman/html/package_tcolgp.html
            - Tcolgp_Array1OfPnt: https://dev.opencascade.org/doc/occt-6.9.0/refman/html/class_t_colgp___array1_of_pnt.html
            - BRepBuilderAPI_MakeEdge: https://dev.opencascade.org/doc/occt-6.9.0/refman/html/class_b_rep_builder_a_p_i___make_edge.html#ae764242a5e522c151e72befe06fc4b0a
            - GeomAPI_PointsToBSpline: https://dev.opencascade.org/doc/occt-6.9.0/refman/html/class_geom_a_p_i___points_to_b_spline.html
            - BRepBuilderAPI_MakeEdge: https://dev.opencascade.org/doc/occt-6.9.0/refman/html/class_b_rep_builder_a_p_i___make_edge.html
            - Handle<Curve>: https://dev.opencascade.org/doc/occt-6.9.0/refman/html/_standard___macro_8hxx.html#a36a133daea9be10d2f88008f94ebb445
        
        */

        let vertices = points as VertexCollection; // auto converted

        if (vertices.length < 3)
        {
            console.error('Edge::makeSpline: Please supply at least 3 points to create valid Spline!')
            return null;
        }

        let ocPointList = new this._oc.TColgp_Array1OfPnt_2(1, vertices.length);
        vertices.forEach( (v,i) => ocPointList.SetValue(i+1, v._toOcPoint()) );
        let geomSplineCurveHandle = new this._oc.GeomAPI_PointsToBSpline_2(ocPointList, 3, 8, this._oc.GeomAbs_Shape.GeomAbs_C2, 1.0e-3 ).Curve();
        /* WORKAROUND: Expected null or instance of Handle_Geom_Curve, got an instance of Handle_Geom_BSplineCurve
            We resolve the handle (basically an dynamic pointer in OCE) and make a new Curve Handle from the BezierCurve */
        let geomCurveHandle = new this._oc.Handle_Geom_Curve_2(geomSplineCurveHandle.get());
        let ocEdge = new this._oc.BRepBuilderAPI_MakeEdge_24( geomCurveHandle ).Edge(); 

        this._fromOcEdge(ocEdge);

        return this;
        
    }

    /** Make Arc line
     *  @param type threepoint or tangent
     */
    @checkInput(['PointLike', 'PointLike', 'PointLike', [String,'threepoint']], ['Point','Point','Point',String])
    makeArc(start:PointLike, mid:PointLike, end:PointLike, type?:string):Edge
    {   
        start = start as Point; // auto converted from PointLike
        mid = mid as Point;
        end = end as Point;

        // check if midVec is on the line (startVec,endVec) - meaning we don't have an arc but a straight line ( also avoids error in OC )
        if ( new Edge(start, end).intersects(mid))
        {
            console.warn('Edge::makeArc: created a straight Edge instead!');
            this._fromOcEdge(new Edge(start, end)._ocShape);
        }
        else 
        { 
            type = (type != "threepoint" && type != "tangent" ) ? 'threepoint' : type; // check inputs

            let geomTrimmedCurveHandle = (type == 'threepoint') ? 
                                    new this._oc.GC_MakeArcOfCircle_4(start._toOcPoint(), mid._toOcPoint(), end._toOcPoint()).Value() : // mid point is a point
                                    new this._oc.GC_MakeArcOfCircle_5(start._toOcPoint(), mid._toOcVector(), end._toOcPoint()).Value(); // mid point is a tangent

            let geomCurveHandle = new this._oc.Handle_Geom_Curve_2(geomTrimmedCurveHandle.get());
            let newOcEdge = new this._oc.BRepBuilderAPI_MakeEdge_24(geomCurveHandle).Edge();
            this._fromOcEdge(newOcEdge);

        }

        return this;
    }

    /** Make Bezier curve from given points. One control point for Quadratic. Two for Cubic */
    @checkInput('PointLikeSequence', 'VertexCollection')
    makeBezier(points:PointLikeSequence, ...args):Edge // NOTE: handles (start,controlpoint,end) too
    {
        /* OC docs:
            - Geom_Bezier_Curve: https://dev.opencascade.org/doc/refman/html/class_geom___bezier_curve.html
        */

        let bezierPoints = points as VertexCollection;
        
        let ocPointList = new this._oc.TColgp_Array1OfPnt_2(1,bezierPoints.length);
        bezierPoints.forEach( (v,i) => ocPointList.SetValue(i+1, v._toOcPoint()));

        let ocCurve = new this._oc.Geom_BezierCurve_1(ocPointList);
        let ocEdge = new this._oc.BRepBuilderAPI_MakeEdge_24(new this._oc.Handle_Geom_Curve_2(ocCurve)).Edge();
        let bezierEdge = this._fromOcEdge(ocEdge);
        return bezierEdge;
    }

    /** Make weighted Bezier Curve by supplying (control)points and weights */
    /* // NOT WORKING. crashes OC
    @checkInput(['PointLikeSequence', 'Array'], ['VertexCollection', 'auto'])
    makeWeightedBezier(points:PointLikeSequence, weights:Array<number>):Edge
    {
        // some sanity checks
        let bezierPoints = points as VertexCollection; // auto converted
        if (weights.length != bezierPoints.length/3 && weights.length != bezierPoints.length/2)
        {
            throw new Error(`makeWeightedBezier::Please supply a weight for each control point!`);
        }

        let ocPointList = new this._oc.TColgp_Array1OfPnt_2(1,bezierPoints.length);
        bezierPoints.forEach( (v,i) => ocPointList.SetValue(i+1, v._toOcPoint()));
        let ocWeightList = new this._oc.TColStd_Array1OfReal_2(1,weights.length);
        weights.forEach( (w,i) => ocWeightList.SetValue(i+1, w));
        let ocCurve = new this._oc.Geom_BezierCurve_2(ocPointList, ocWeightList);
        let ocEdge = new this._oc.BRepBuilderAPI_MakeEdge_24(new this._oc.Handle_Geom_Curve_2(ocCurve)).Edge();
        let bezierEdge = this._fromOcEdge(ocEdge);
        return bezierEdge;
    }
    */
    
    //// COMPUTED PROPERTIES ////

    /** Get first Vertex of Edge */
    start():Vertex
    {
        // NOTE: _firstVertex already takes care of possible this._oc.TopAbs_Orientation.TopAbs_REVERSED
        return this._firstVertex();
    }

    /** Get last Vertex of Edge */
    end():Vertex
    {
        // NOTE: _lastVertex already takes care of possible this._oc.TopAbs_Orientation.TopAbs_REVERSED
        return this._lastVertex();
    } 

    _firstVertex():Vertex
    {
        return new Vertex()._fromOcVertex((new this._oc.ShapeAnalysis_Edge()).FirstVertex(this._ocShape));
    }

    _lastVertex():Vertex
    {
        return new Vertex()._fromOcVertex((new this._oc.ShapeAnalysis_Edge()).LastVertex(this._ocShape));
    }

    /** Get Edge Type: Line, Circle, Ellipse, Hyperbola, Parabola, BezierCurve, BSplineCurve, OffsetCurve, OtherCurve 
     *  IMPORTANT: Because it generates a lot of confusion we add here the distinction Circle/Arc that is not in OpenCascade
    */
    edgeType():string
    {
        const LOOKUP_INT_TO_TYPE = {
            '0' : 'Line',
            '1' : 'Circle',
            '2' : 'Ellipse',
            '3' : 'Hyperbola ',
            '4' : 'Parabola',
            '5' : 'BezierCurve',
            '6' : 'BSplineCurve',
            '7' : 'OffsetCurve',
            '8' : 'OtherCurve'
        }
        
        let edgeType = LOOKUP_INT_TO_TYPE[String(this._toOcCurve().GetType().value)];

        if(edgeType === 'Circle')
        {
            if (!this.start().equals(this.end()))
            {
                edgeType = 'Arc'
            }
        }

        return edgeType;
    }

    is2DXY(): boolean 
    {
        return this.start().z <= this._oc.SHAPE_TOLERANCE && this.end().z <= this._oc.SHAPE_TOLERANCE
    }

    /** TODO: Make this more robust? */
    isCircular():boolean
    {
        return ['Circle', 'Ellipse'].includes(this.edgeType())
    }

    /** Get length of Edge */
    length():number 
    {
        // Generic Shape method. See: https://dev.opencascade.org/content/how-find-arc-length-part-curve

        if (this.isEmpty())
        { 
            console.error(`Edge::length: Could not get length of empty Edge. Check if the Edge is properly created!`);
            return null 
        };

        let system = new this._oc.GProp_GProps_1();
        this._oc.BRepGProp.LinearProperties(this._ocShape, system, false, false);
        return roundToTolerance(system.Mass());
    }

    /** Calculate the center of this Edge and return a Point */
    center():Point
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep_g_prop.html
        let ocProps = new this._oc.GProp_GProps_1();
        let BRepGProp = this._oc.BRepGProp.prototype.constructor;
        BRepGProp.LinearProperties(this._ocShape, ocProps, false, false);

        return new Point()._fromOcPoint(ocProps.CentreOfMass()).round(); // also round it to avoid very small numbers
    }

    /** Return middle of Edge */
    middle():Point
    {
        return this.pointAt(0.5);
    }

    /** Calculate the normal of the straight line Edge 
     *  Force that normal always faces flipTo (otherwise the side is determined by direction)
    */
    @checkInput([['PointLike', null]], ['Point'])
    normal(orientTo?:PointLike, ...args):Vector
    {
        if(this.edgeType() != 'Line')
        {
            console.error(`Edge::normal: This method only works for Line Edges: You provided a ${this.edgeType()}!`);
        }
        // NOTE: in 3D the normal of a Edge is underdetermined - We use the one orientated on XY plane
        const d = this.direction();
        const workplaneNormal = (!d.normalized().equals([0,0,1])) ? new Vector(0,0,1) : new Vector(0,1,0);
        let n = workplaneNormal.crossed(d).normalize();

        if(!orientTo)
        {
            return n;
        }
        else {
            // orientate towards given Point
            const v1 = this.center().toVector().added(n).toVertex();
            const v2 = this.center().toVector().subtracted(n).toVertex();
            return v1.distance(orientTo) < v2.distance(orientTo) ? n : n.reverse();
        }
        
    }

    /** Calculate workplane normal if 2D (not a 1D Line) */
    workPlaneNormal():Vector 
    {
        if(this.edgeType() == 'Line')
        {
            console.warn(`Edge::workPlaneNormal: 1D Edge has no clear workplane! Returned null!`);
            return null;
        }

        let mid = new Vector(this.pointAt(0.5))
        let v1 = mid.subtracted(this.start())
        let v2 = new Vector(this.end()).subtracted(mid);

        return v2.crossed(v1).normalize();
    }

    _reverseOcEdge(ocEdge:any):any // TODO: OC typing
    {
        // see: https://dev.opencascade.org/content/reverse-edge

        let curve = new this._oc.BRepAdaptor_Curve_2(ocEdge);
        let uMin = curve.FirstParameter();
        let uMax = curve.LastParameter();
        
        let ocGeomCurve = new this._oc.Handle_Geom_Curve_2(curve.Curve().Curve().get()).get();
        
        let uMinRev = ocGeomCurve.ReversedParameter(uMin);
        let uMaxRev = ocGeomCurve.ReversedParameter(uMax);

        let ocEdgeCreator = new this._oc.BRepBuilderAPI_MakeEdge_25(ocGeomCurve.Reversed(), uMaxRev, uMinRev);
        return ocEdgeCreator.Edge();
    }

    /** Reverse Edge in place */
    reverse():Edge
    {
        /* see OC docs: 
            - https://dev.opencascade.org/doc/refman/html/class_geom___curve.html
            - https://dev.opencascade.org/doc/refman/html/class_b_rep_builder_a_p_i___make_edge.html

            !!!! WARNING / TODO: this could lead to weird results !!!!
        */

        let newOcEdge = this._reverseOcEdge(this._ocShape)
        this._fromOcEdge(newOcEdge);

        return this;
    }

    /** Create a new Edge by reversing current one */
    reversed():Edge
    {
        return (this.copy() as Edge).reverse();
    }

    /** Get direction Vector of Line Edge from start to end */
    direction(normalize:boolean=false):Vector
    {
        if (this.edgeType() != 'Line')
        {
            console.warn(`Edge::direction: Edge is of type "${this.edgeType()}" which does not have one direction! Used directionAt in middle`);
            return this.directionAt(this.middle())
        }

        let directionVec = this.end().toVector().subtracted(this.start().toVector());
        if (normalize){
            directionVec.normalize();
        }

        return directionVec;
    }

    /** Get tangent (= direction ) at certain point on the Edge */
    @checkInput('PointLike', 'Point')
    tangent()
    {
        return this.direction().normalize();
    }

    /** Get direction = tangent at certain point on the Edge */
    @checkInput('PointLike', 'Point')
    directionAt(point:PointLike, ...args):Vector
    {
        let at = point as Point; // auto converted
        
        // straight line: direction is always the same
        if(this.edgeType() == 'Line')
        {
            return this.direction();
        }

        let ocClProps = new this._oc.GeomLProp_CLProps_2(
            this._toOcCurveHandle(), 
            this.getParamAt(point),
            1, // 2 is needed for normal
            0.0001 // resolution
        );
        
        let ocDir = new Point(1,0,0)._toOcDir(); // tmp ofDir
        ocClProps.Tangent(ocDir); // filled with tangent
        let direction = new Vector()._fromOcDir(ocDir).normalize().rounded();
        
        return direction;
    }

    /** Get direction Vector at start Vertex */
    directionAtStart():Vector
    {
        return this.directionAt(this.start());
    }

    /** Get direction Vector at end Vertex */
    directionAtEnd():Vector
    {
        return this.directionAt(this.end());
    }

    /** Get direction Vector at percentage of length */
    @checkInput(Number, 'auto')
    directionAtPerc(perc):Vector
    {
        perc = (perc < 0) ? 0 : (perc > 1) ? 1.0 : perc;
        let pointAtPerc = this.pointAt(perc);
        return this.directionAt(pointAtPerc);
    }

    /** Get tangent Vector (=direction) at certain point on the Edge */
    @checkInput('PointLike', 'Point')
    tangentAt(point:PointLike, ...args):Vector
    {
        return this.directionAt(point).normalize();
    }

    /** Close a non-Line Edge to create a Wire **/
    @addResultShapesToScene
    close():IWire
    {
        if(this.edgeType() === 'Line' || this.length() == 0)
        {
            throw new Error(`Edge::close: Cannot close a single Line Edge!`);
        }

        return this._toWire().close();
    }

    /** Thicken Edge to create a Face (private: without adding result to Scene) */
    @checkInput([[Number,EDGE_DEFAULT_THICKEN],['ThickenDirection', 'center'], ['PointLike', null]], ['auto', 'auto', 'Vector'])
    _thickened(amount?:number, direction?:ThickenDirection,  onPlaneNormal?:PointLike):IFace
    {
        // the same for Edges and Wire: forward to the Wire one
        return this._toWire().thickened(amount, direction, onPlaneNormal);
    }

    /** Thicken Edge to create a Face */
    @addResultShapesToScene
    @checkInput([[Number,EDGE_DEFAULT_THICKEN],['ThickenDirection', 'center'], ['PointLike', null]], ['auto', 'auto', 'Vector'])
    thickened(amount?:number, direction?:string,  onPlaneNormal?:PointLike):IFace
    {
        return this._thickened(amount, direction, onPlaneNormal);
    }

    @checkInput([[Number,EDGE_DEFAULT_THICKEN],['ThickenDirection', 'center'], ['PointLike', null]], ['auto', 'auto', 'Vector'])
    thicken(amount:number, direction?:ThickenDirection, onPlaneNormal?:PointLike):IFace
    {
        let newShape = this._thickened(amount, direction, onPlaneNormal);
        this.replaceShape(newShape);
        return newShape;
    }

    /** Thicken the Edge along the normal to create a Face */
    @checkInput([[Number,EDGE_DEFAULT_OFFSET],'PointLike', [Boolean, false]], [Number, Vector, Boolean])
    thickenOffsetted(amount?:number, v?:PointLike, flip?:boolean):IFace 
    {
        let vector = v as Vector;
        vector = vector || this.normal();
        vector = (flip) ? vector.reverse() : vector;
        let edgeOffset = (this.moved(vector.scale(amount)) as Edge);

        return new Face().fromVertices([this.start(), this.end(), edgeOffset.end(), edgeOffset.start()]);
    }

    /** Offset Edge a given amount into normal direction or reversed with '-amount' and return new Edge (private without adding to Scene)
     *  NOTE: param type does nothing but is for consistency     
    */
    @checkInput([ [Number,EDGE_DEFAULT_OFFSET], [String, null],['PointLike', null]], [Number, 'auto','Vector'])
    _offsetted(amount?:number, type?:string, onPlaneNormal?:PointLike):Edge|Wire
    {
        /* OC docs: 
            - MakeOffset: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_offset_a_p_i___make_offset.html
            - Geom_OffsetCurve - https://dev.opencascade.org/doc/refman/html/class_geom___offset_curve.html
            - https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_builder_a_p_i___make_edge.html#a424f7c2f5b8c3588e88e83789a7a5446
        */
      
        /* NOTE: We use MakeOffset on Wires/Faces
            - This works without any problems on 2D Edges (Arcs,Splines) - offset will also be on the same Plane
            - But not one Line Edges - avoid this by doing very simple offset
        */

        if (this.edgeType() != 'Line')
        {
            let wire = this._toWire();
            let ocMakeOffset = new this._oc.BRepOffsetAPI_MakeOffset_3(wire._ocShape, this._oc.GeomAbs_JoinType.GeomAbs_Tangent, true); // isOpenResult (false actually thickens the Edge into a closed Wire)
            ocMakeOffset.Perform(amount,0); // Alt altitude
            let newOcShape = ocMakeOffset.Shape();
            
            let offsetShape = new Shape()._fromOcShape(newOcShape) as Edge|Wire;

            if(!offsetShape){
                throw new Error('Edge::_offsetted: Offsetting failed. Check if the offset amount does not lead to self-intersection!')
            }

            // Sometimes the offsetted Shape becomes a Wire (like in Spline), check if we can downcast to Edge
            offsetShape = (offsetShape.type() === 'Wire') ? offsetShape.checkDowngrade() as Edge|Wire : offsetShape;
            // OC always offsets from origin - correct to offset from center of Edge
            if(offsetShape.type() === 'Edge')
            {
                ((offsetShape as Edge).edgeType() === 'Circle') ? offsetShape.move(this.center().toVector().reversed())
                    : offsetShape.move(0,0,-this.start().z)
            }            
            
            return offsetShape as Edge
        }
        else {
            // Line offset
            let offsetVec = (onPlaneNormal) ? (onPlaneNormal as Vector).crossed(this.directionAtStart()).normalize() : this.normalAt(this.start());
            let newEdge = this.copy().move(offsetVec.scaled(amount));

            return newEdge as Edge;
        }
        
    }

    /** Offset Edge a given amount into normal direction or reversed with '-amount' and return new Edge */
    @addResultShapesToScene
    @checkInput([ [Number,EDGE_DEFAULT_OFFSET], [String, null],['PointLike', null]], [Number, 'auto','Vector'])
    offsetted(amount?:number, type?:string, onPlaneNormal?:PointLike):Edge|Wire
    {
        let offsetShape = this._offsetted(amount,type,onPlaneNormal);
        // Open Shapes sometimes become bigger (after -amount): Check and corrent
        const growth = offsetShape.bbox().area() - this.bbox().area();
        if( (amount > 0 && growth < 0) || (amount < 0 && growth > 0) ){ offsetShape = this._offsetted(-amount, type, onPlaneNormal);}
        return offsetShape;
    }

    /** Offset Edge a given amount into normal direction or reversed with '-amount' */
    @checkInput([ [Number,EDGE_DEFAULT_OFFSET], [String, null], ['PointLike', null]], [Number, 'auto','Vector'])
    offset(amount?:number, type?:string, onPlaneNormal?:PointLike):Edge|Wire
    {
        let offsetShape = this._offsetted(amount, type, onPlaneNormal); 
        // Open Shapes sometimes become bigger (after -amount): Check and corrent
        const growth = offsetShape.bbox().area() - this.bbox().area();
        if( (amount > 0 && growth < 0) || (amount < 0 && growth > 0) ){ offsetShape = this._offsetted(-amount, type, onPlaneNormal);}

        if (offsetShape.type() === 'Edge')
        {
            this._fromOcEdge(offsetShape._ocShape); // replace old OC Edge with new
            return this;
        }
        else {
            // IMPORTANT: Splines can turn into Wires after offsetted - so we can't update 
            console.warn('Edge::offset: A Spline Edge turned into a Wire after offset!')
            this.replaceShape(offsetShape)
            return offsetShape;
        }
        
    }

    /** 
     * Generate a Point at specific percentage of this Edge
     *  @param perc: number between 0 and 1
     */
    @checkInput(Number, Number)
    pointAt(perc:number):Point
    {
        if(perc < 0 || perc > 1)
        {
            console.warn(`Edge:pointAt: Please supply a number in range [0.0-1.0]. Reverted to closest value!`);
            perc = (perc < 0) ? 0.0 : 1.0;
        }
        
        let uMin = this._toOcCurve().FirstParameter();
        let uMax = this._toOcCurve().LastParameter();
        let atU =  uMin + perc * (uMax - uMin);
        return this.pointAtParam(atU);
    }
    
    /** Get Point at specific param value */
    @checkInput(Number, Number)
    pointAtParam(param:number):Point
    {
        let p = new Point()._fromOcPoint(this._toOcCurve().Value(param)); 
        return p.rounded();
    }

    /** Check if Edge has a Vertex that equals the given Vertex */
    @checkInput('PointLike', 'Vertex')
    isVertex(vertex:PointLike, ...args):Vertex
    {
        return ((vertex as Vertex).equals(this.start())) ? this.start() : (((vertex as Vertex).equals(this.end()) ? this.end() : null) );
    }

    /** Calculate the normal for a point on the Edge */
    @checkInput('PointLike', 'Point')
    normalAt(point:PointLike, ...args):Vector
    {   
        let at = point as Point; // auto converted
        
        // straight line: normal is always the same
        if(this.edgeType() == 'Line')
        {
            return this.normal();
        }

        /* New method with GeomLProp_CLProps 
            see docs: https://dev.opencascade.org/doc/refman/html/class_geom_l_prop___c_l_props.html    
        */
        let ocClProps = new this._oc.GeomLProp_CLProps_2(this._toOcCurveHandle(), 
            this.getParamAt(point),
            2, // 2 is needed for normal
            0.0001 // resolution
        );
        
        let ocDir = new Point(1,0,0)._toOcDir(); // tmp ofDir
        ocClProps.Normal(ocDir); // filled with normal
        let normal = new Vector()._fromOcDir(ocDir).rounded();
        
        return normal;
    }

    /** Get normal of Edge at percentage of length */
    @checkInput(Number, 'auto')
    normalAtPerc(perc:number):Vector
    {
        perc = (perc < 0) ? 0 : (perc > 1) ? 1.0 : perc;
        let pointAtPerc = this.pointAt(perc);
        return this.normalAt(pointAtPerc);
    }

    /** Calculate the angle between two touching Edges at either ends */
    @checkInput('Edge', 'Edge')
    angleTo(other:Edge):number
    {
        let intersections = this._intersections(other);

        if (intersections.length == 0)
        {
            console.error(`Edge::angleTo: Supplied Edges don't connect!`)
            return null;
        }

        if (intersections.hasType('Edge'))
        {
            // overlapping Edges: angle is zero
            console.warn(`Edge::angleTo: Both Edges overlap!`)
            return 0.0;
        }

        let intersectionVert = intersections.vertices()[0] as Vertex;
        let firstEdgeNormal:Vector = (this.start().equals(intersectionVert)) ? this.normalAt(this.start()) : this.normalAt(this.end());
        let secondEdgeNormal:Vector = (other.start().equals(intersectionVert)) ? other.normalAt(other.start()) : other.normalAt(other.end());
        
        // return the smallest angle
        let a1 = firstEdgeNormal.angle(secondEdgeNormal);
        let a2 = firstEdgeNormal.angle(secondEdgeNormal.reversed());

        return (a1 < a2) ? a1 : a2;

    }

    //// OPERATIONS ON EDGE ////

    /** Needed to fix some Edges, for example after projecting */
    _buildCurves()
    {
        // OC docs: https://dev.opencascade.org/doc/refman/html/class_b_rep_lib.html#a4f676a67ca12ad407faa3e88a7e72aaa
        this._oc.BRepLib.BuildCurves3d_1(this._ocShape, this._oc.SHAPE_TOLERANCE, this._oc.GeomAbs_Shape.GeomAbs_C1, 14, 0);
    }

    /** Extend Edge into a given direction (start or end) */
    @checkInput([ [Number, EDGE_DEFAULT_EXTEND_AMOUNT], ['LinearShapeTail', EDGE_DEFAULT_EXTEND_DIRECTION]], [Number,'auto'])
    extend(amount?:number, direction?:LinearShapeTail):Edge
    {
        if(!['Line','Arc'].includes(this.edgeType())){ throw new Error(`Edge::extend(): Extend with edge type "${this.edgeType()}" not yet implemented!`)}

        // NOTE: we need to normalize U with the length because Arcs have U based on angle, not distance
        let uMin:number, uMax:number;
        [uMin,uMax] = this.getParamMinMax();
        const edgeLength = this.length(); 
        
        const amountToU = (uMax - uMin) / edgeLength;
        const normalizedAmount = amountToU * amount;
        const extendFrom = (direction === 'start') ? 'end' : 'start';
        const extendFromVertex = this[extendFrom](); // original stable Vertex

        const ocEdgeCreator = (direction == 'end') ? 
                new this._oc.BRepBuilderAPI_MakeEdge_25(this._toOcCurveHandle(), uMin, uMax+normalizedAmount)
                : new this._oc.BRepBuilderAPI_MakeEdge_25(this._toOcCurveHandle(), uMin-normalizedAmount, uMax);
        const ocEdge = ocEdgeCreator.Edge();
        this._fromOcEdge(ocEdge);
        ocEdgeCreator.delete();

        // Moving before extending with Params can result in wrong results: correct using the stable (non-extended) Vertex
        const extendFromVertexAfter = this[extendFrom]();
        if(!extendFromVertex.equals(extendFromVertexAfter))
        {
            this.move(extendFromVertex.toVector().subtracted(extendFromVertexAfter));
        }

        return this;
    }

    /** Extend Edge into a certain direction (start or end) and return a copy */
    @checkInput([[Number,EDGE_DEFAULT_POPULATE_NUM],['LinearShapeTail', EDGE_DEFAULT_EXTEND_DIRECTION]], [Number,'auto'])
    _extended(amount?:number, direction?:LinearShapeTail):Edge 
    {
        return (this._copy() as Edge).extend(amount, direction);
    }

    /** Extend Edge into a certain direction (start or end) and return a copy */
    @addResultShapesToScene
    @checkInput([[Number,EDGE_DEFAULT_POPULATE_NUM],['LinearShapeTail', EDGE_DEFAULT_EXTEND_DIRECTION]], [Number,'auto'])
    extended(amount?:number, direction?:LinearShapeTail):Edge 
    {
        return this._extended(amount, direction);
    }

    /** Extend Edge to nearest point that is shared by other Shape (if any!)
     *  @param other
     *  @param direction Extend at start or end. If not given pick closest
     */
    @checkInput(['AnyShape', ['LinearShapeTail', null]], ['auto', 'auto'])
    extendTo(other:AnyShape, direction?:LinearShapeTail):this
    {
        const EXTEND_NON_CIRCULAR_PERC_DISTANCE = 2;

        direction = direction || (
                        (this.end().distance(other) < this.start().distance(other)) 
                            ? 'end' : 'start');
        
        const extendAtVertex = this[direction](); // .start() or end()
        const extendFrom = (direction === 'start') ? 'end' : 'start';
        const extendFromVertex = this[extendFrom]();
        const distance = other.distance(extendAtVertex)

        if(distance === 0)
        {
            console.warn(`Edge::extendTo: Don't need to extend. Already touching!`)
            return null; 
        }

        const extendedTestShape =  (!this.isCircular()) 
                                ? this._extended(distance*EXTEND_NON_CIRCULAR_PERC_DISTANCE, direction)
                                : this._maxCircularShape();
        
        const testIntersection = extendedTestShape._intersection(other);

        if(!testIntersection)
        { 
            console.warn(`Edge::extendTo: Can't extend to Shape because they never intersect!`)
            return null; 
        }
        
        const testIntVertex = (testIntersection.type() === 'Vertex') 
                                ? (testIntersection as Vertex)
                                : testIntersection.vertices()
                                    .sort((v1,v2) => v1.distance(extendAtVertex) - v2.distance(extendAtVertex)).first() as Vertex

        // NOTE: using BRepBuilderAPI_MakeEdge_26 with Points is not robust, use with params instead
        const ocEdgeCreator = new this._oc.BRepBuilderAPI_MakeEdge_25(
                this._toOcCurveHandle(), this.getParamAt(extendFromVertex), this.getParamAt(testIntVertex));
        this._fromOcEdge(ocEdgeCreator.Edge())
        ocEdgeCreator.delete(); // OC destructor

        // And again like in extend check if Edge still has the position  
        const extendFromVertexAfter = this[extendFrom]();
        if(!extendFromVertex.equals(extendFromVertexAfter))
        {
            this.move(extendFromVertex.toVector().subtracted(extendFromVertexAfter));
        }

        return this;
    }

    @addResultShapesToScene
    @checkInput(['AnyShape', ['LinearShapeTail', null]], ['auto', 'auto'])
    extendedTo(other:AnyShape, direction?:LinearShapeTail):Edge
    {
        return this._copy().extendTo(other,direction);
    }

    _maxCircularShape():Edge|null
    {
        const paramMinMax = this.getParamMinMax()
        return (this.isCircular())
            ? new this._oc.BRepBuilderAPI_MakeEdge_25(this._toOcCurveHandle(), paramMinMax[0], paramMinMax[1])
            : null;
    }


    /** Loft (forwarded to Wire) */
    @checkInput(['AnyShapeOrCollection', [Boolean, WIRE_LOFTED_SOLID ]], ['ShapeCollection', 'auto'])
    loft(sections:AnyShapeOrCollection, solid?:boolean):IShell|Solid
    {
        let newShape = this._toWire()._lofted(sections,solid)
        this.replaceShape(newShape);
        return newShape;
    }

    @addResultShapesToScene
    @checkInput(['AnyShapeOrCollection', [Boolean, WIRE_LOFTED_SOLID ]], ['ShapeCollection', 'auto'])
    lofted(sections:AnyShapeOrCollection, solid?:boolean):IShell|Solid
    {
        return this._toWire()._lofted(sections,solid);
    }

    /* Move current Edge so it connects to another Edge or Wire with given from,to = start | end  */
    @checkInput(['LinearShape', [String, EDGE_DEFAULT_ALIGNTO_FROM], [String, EDGE_DEFAULT_ALIGNTO_TO]], ['Wire', String, String])
    alignTo(other:LinearShape, from?:LinearShapeTail, to?:LinearShapeTail):Edge
    {
        // Main method is in Wire, convert single Edge to Wire and use that method
        let w = this._toWire().alignTo(other,from,to);
        return w._toEdge();
    }

    /** Get parameter (U) on Edge for given Point. If not on Edge will pick closest */ 
    @checkInput('PointLike', 'Point')
    getParamAt(point:PointLike):number
    {
        // OC docs: https://dev.opencascade.org/doc/refman/html/class_geom_a_p_i___project_point_on_curve.html
        // OC docs: https://dev.opencascade.org/doc/refman/html/class_shape_analysis___curve.html
        let ocProjectPoint = new this._oc.GeomAPI_ProjectPointOnCurve_2( (point as Point)._toOcPoint(), this._toOcCurveHandle());
        return ocProjectPoint.LowerDistanceParameter();
    }

    /** Generate a Collection of a given number of Vertices equally spaced over this Edge including the start and end of the Edge */
    @addResultShapesToScene
    @checkInput([[Number, EDGE_DEFAULT_POPULATE_NUM]], Number)
    populated(num?:number):VertexCollection
    {
        // NOTE: 4 points means 3 Edges ~ increments - except for circular Edges
        if(this.isCircular()){ num += 1 };
        const lengthIncrement = 1.0/(num-1); // pointAt uses a percentage [0-1.0]
        const vertices = new VertexCollection();
        for (let p = 0; p <= num; p++) // we start and end with start and end Vertex
        {
            let newVertex = this.pointAt(p*lengthIncrement).toVertex(); // directly add to Scene
            if (newVertex)
            {
                vertices.add(newVertex);
            }
        }
        
        return vertices;
    }

    /** Break a curved Edge up into a Wire consisting of Line Edges with given angle between segments */
    @checkInput([[Number,EDGE_DEFAULT_SEGMENTS_ANGLE], [Number, EDGE_DEFAULT_SEGMENTS_SIZE]], [Number, Number])
    segmentize(angle?:number, size?:number):LinearShape // Wire
    {
        const MINIMUM_POINTS = 2;
        const MIN_LENGTH = 1;

        if (this.edgeType() == 'Line')
        {
            console.warn('Edge::segments: We can only segmentize a Curve Edge (Arcs, Spline, Circle etc). Not straight Lines! Try populate(num) to!');
            return this;
        }

        let ocLocation = new this._oc.TopLoc_Location_1(); // see OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_top_loc___location.html
        let adaptorCurve = this._toOcCurve();
        let angularDeflection = toRad(angle);
        let tangDef = new this._oc.GCPnts_TangentialDeflection_2(adaptorCurve, angularDeflection, size, MINIMUM_POINTS,  this._oc.SHAPE_TOLERANCE, MIN_LENGTH ); // see OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_g_c_pnts___tangential_deflection.html

        let vertices = [];

        for(let j = 0; j < tangDef.NbPoints(); j++) 
        {
            let ocPoint = tangDef.Value(j+1).Transformed(ocLocation.Transformation()); // world coords
            vertices.push( new Vertex()._fromOcPoint(ocPoint));
        }

        if (vertices.length == 0)
        {
            console.error(`Edge:segments: No segments found! Check the size of angle!`);
            return null;
        }
        else {
            return new Wire().fromVertices(vertices);
        }
    }

    /** Get distributed points on Edge according to QuasiUniformDeflection method  
     *  See: https://dev.opencascade.org/doc/refman/html/class_g_c_pnts___quasi_uniform_deflection.html#details
     *  Used in toSVG()
    */
    _segmentizeToPoints(angularDeflection:number=10, force2D:boolean=true):Array<Point>
    {
        const deflection = toRad(angularDeflection);

        const curve = this._toOcCurve();
        const [start,end] = this.getParamMinMax();

        const ocPointGenerator = new this._oc.GCPnts_QuasiUniformDeflection_4(curve, deflection, start,end, this._oc.GeomAbs_Shape.GeomAbs_C1);
        const points = [] as Array<Point>

        if(ocPointGenerator.IsDone())
        {
            for(let p = 0; p < ocPointGenerator.NbPoints(); p++)
            {
                const ocPoint = ocPointGenerator.Value(p+1); // NOTE: index start = 1
                const newPoint = new Point()._fromOcPoint(ocPoint);
                if(force2D){ newPoint.setZ(0) }
                points.push(newPoint);
            }
        }
        
        return points;
    }

    //// CONTEXT PREDICATES ////

    /* Get the Shapes where given current Edge and another intersect */
    @checkInput('Edge', 'Edge')
    _intersectionsWithEdge(other:Edge):Vertex|Edge|ShapeCollection
    {
        // if edges are the same instance return itself (OC returns null)
        if(this.same(other))
        {
            return this;
        }

        // see OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_int_tools___edge_edge.html#a60cf5b162b732d577b38c2890387a4ba
        let ocIntTool = new this._oc.IntTools_EdgeEdge_2(this._ocShape, other._ocShape);
        ocIntTool.Perform();
        if(!ocIntTool.IsDone())
        {
            console.warn(`Edge::_intersectionWithEdge: No intersection between the two Edges!`);
            return null;
        }
        else 
        {
            let ocShapeSequence = ocIntTool.CommonParts();
            let intersectingShapes = new ShapeCollection();

            for ( let i = 1; i <= ocShapeSequence.Size(); i++)
            {
                let curOcCommonPrt = ocShapeSequence.Value(i); // CommonPrt: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_int_tools___common_prt.html#a93c689d62c52c4f09288c68de13e1ce0
                
                if (curOcCommonPrt)
                {
                    let intersectionType = this._shapeTypeEnumLookup(curOcCommonPrt.Type());

                    // parameters of intersection on Edge 1
                    let paramStart = curOcCommonPrt.Range1_1().First();
                    let paramEnd = curOcCommonPrt.Range1_1().Last();

                    let p1 = this.pointAtParam(paramStart); // get intersection point from parameter
                    let p2 = this.pointAtParam(paramEnd);

                    let intersection = (intersectionType == 'Vertex') ? p1._toVertex() : new Edge(p1,p2);
                    intersectingShapes.push(intersection);
                }
            }

           return intersectingShapes.collapse() as any; // avoid TS errors here: collapse can return all kind of Shapes but here only Edge,Vertex or ShapeCollection
        }
    }   

    /** Test if an Edge shares a Vertex with another */
    @checkInput('Edge', 'Edge')
    connected(other:Edge)
    {
        // NOTE: this uses tolerance via Vector.equals() - and gp_Vec3.Equals()
        return ( 
                this.start().equals(other.start())
                || this.end().equals(other.start()) 
                || this.start().equals(other.end()) 
                || this.end().equals(other.end())
        )
        
    }
    
    /** Check if this Edge is parallel to other given entity */
    parallel(other:PointLike|Edge = null, ...args):boolean
    {
        if ( !(other instanceof Edge) && !isPointLike(other) )
        {
            console.warn(`Edge::parallel: Cannot determine being parallel to for given input "{other}". Please supply another Edge or PointLike`);
            return false;
        }

        let edgeDirection = this.direction().normalized();

        if(isPointLike(other))
        {
            let v = new Vector().fromPointLike(other as PointLike).normalized();
            return edgeDirection.equals(v) || edgeDirection.reversed().equals(v);
        }
        else // Edge
        {
            if(this.edgeType() != (other as Edge).edgeType())
            {
                // Edges of different kinds cannot have equal direction
                return false;
            }
            else if ( this.edgeType() == 'Line' && (other as Edge).edgeType() == 'Line')
            {
                return edgeDirection.equals(other.direction()) || edgeDirection.reversed().equals(other.direction()); 
            }
            else {
                // Advanced Edges like arcs can be parallel to: TODO
                console.warn(`Edge::parallel: Parallel advanced Edges **** NOT IMPLEMENTED ****`)
                return false;
            }
        }
        return false;
    }

    //// SHAPE ANNOTATIONS API ////

    @checkInput([['DimensionOptions',null]], ['auto'])
    dimension(dim?:DimensionOptions):IDimensionLine
    {
        // For Edges it is always unclear where to offset dimension to
        // For now we set offset away from origin. See Annotator
        if(!dim){ dim = { units: null }}
        dim.units = dim?.units || this._geom.units(); // make sure we have units

        let dimLine = this._geom._annotator.dimensionLine(this.start(), this.end());
        dimLine.setOptions(dim); // set offset, units, roundDecimals
        
        const mainShape = this._parent || this;
        dimLine.link(mainShape); // if its a subshape select the main shape

        mainShape._addAnnotation(dimLine);

        return dimLine
    }

    /** Alias for dimension() */
    @checkInput([['DimensionOptions',null]], ['auto'])
    dim(dim?:DimensionOptions):IDimensionLine
    {
        return this.dimension(dim);
    }


    //// OUTPUT ////

    /** Minimal raw data of this Edge */
    toData():Array<Array<number>>
    {
        return (this.vertices().toArray() as Array<Vertex>).map(v => (v as Vertex).toData()); // [[x1,y1,z1],[x2,y2,z2],[xN,yN,zN]]
    }

    /** Export entity and minimal data as string (used for outputting on console and hashing ) */
    toString():string
    {
        if (!this.isEmpty())
        {
            return `<Edge:${this.edgeType()} start="[${this.start().toArray()}]" end="[${this.end().toArray()}]">`;
        }
        else {
            return `Edge:EMPTY<>`;
        }
    }

    /** Export (segmentized) Edge (only X,Y coords) to SVG string 
     *  <path d="M 10 10 L 100 200">
     *  IMPORTANT: official SVG path (without comma!)
     *  code inspired from CadQuery: https://github.com/CadQuery/cadquery/blob/917d918e34690c101a50a233a11026974b87574b/cadquery/occ_impl/exporters/svg.py#L84
    */
    toSvg():string
    {
        /* OC docs: 
            - GCPnts_QuasiUniformDeflection: https://dev.opencascade.org/doc/refman/html/class_g_c_pnts___quasi_uniform_deflection.html
        */
        
        let svgPathD = '' // d attribute of SVG Path
        const segmPoints = this._segmentizeToPoints();

        segmPoints.forEach((point,i) =>
        {
            // NOTE: We just omit the z coordinate. TODO: Warn about exporting a non-flat Edge
            if(i == 0) // first point of Edge, move command
            {
                svgPathD += `M ${point.x} ${point.y}`;
            }
            else {
                // all others: lineTo command
                svgPathD += ` L ${point.x} ${point.y}`;
            }
        })
        
        // Based on attributes we assign some classes for later styling
        const svgNodeStr = `<path d="${svgPathD}" ${this._getSvgPathAttributes()} fill="none" class="${this._getSvgClasses()}"/>`; 

        // NOTE: any dimension lines tied to this Edge will be added in the ShapeCollection.toSvg() method

        return svgNodeStr; // return as string for now
    }

    /** get SVG attributes from style properties of Shape */
    _getSvgPathAttributes():string
    {
        const STYLE_TO_ATTR = [
            { geom: 'line', prop: 'color', attr: 'stroke', transform : (val) => chroma(val).hex() },
            { geom: 'line', prop: 'dashed', attr: 'stroke-dasharray', transform : (val) => this.TO_SVG_DASH_SIZE },
            { geom: 'line', prop: 'width', attr: 'stroke-width' , transform : (val) => val },
            { geom: 'line', prop: 'opacity', attr: 'stroke-opacity' , transform : (val) => val },
        ]

        let svgAttrs = {};

        const style = this?._obj?._style || this?._parent?._obj?._style as ObjStyle;

        if(!style)
        {
            console.warn(`Edge::_getSvgPathAttributes(): This Edge (or it's _parent main Shape) is not in the Scene. There is no style available!`);
        }
        else {
            STYLE_TO_ATTR.forEach( t => 
            {
                const geom = style[t.geom];
                if(geom)
                {
                    const val = geom[t.prop] || null;
                    if (val !== null)
                    {
                        svgAttrs[t.attr] = t.transform(val)
                    }
                }
            })
        }
        let svgAttrArr = [];
        for(const [a,v] of Object.entries(svgAttrs))
        {
            svgAttrArr.push(`${a}="${v}"`)
        }

        const svgAttrStr = svgAttrArr.join(' ');

        return svgAttrStr;
    }

    /** Based on attributes or tests add classes to Svg that help us select and style these SVG elements later */
    _getSvgClasses():string
    {
        const ATTRIBUTE_TRUE_TO_CLASS = {
            hidden : 'hidden',
            outline : 'outline',
        }
        
        const CLASSES_AFTER_TESTS = {
            'line' : (edge) => true, // add for basic geom type styling
            'dashed' : (edge) => edge._getObjStyle()?.line?.dashed === true,
        }

        let classes:Array<string> = [];

        // Add style classes based on attributes
        for (const [attr,value] of Object.entries(this.attributes))
        {
            const toClass = ATTRIBUTE_TRUE_TO_CLASS[attr];
            if(toClass && value)
            {
                classes.push(toClass)
            }
        }
        // Add style classes based on tests
        Object.keys(CLASSES_AFTER_TESTS).forEach( className => {
           if ( CLASSES_AFTER_TESTS[className](this))
           {
                classes.push(className);
            }
        })
        return classes.join(' ');
    }
    
    //// UTILS ////

    /** Getting U min and max of Curve 
     *  IMPORTANT: For Line Curves the parameters are the same as the length
     *  For Arc Curves and Circles the U is the angle ( in radians ) - Half a circle: U = [0, PI] - Circle [0,PI*2]
     */
    getParamMinMax():Array<number>
    {
        let umin = this._toOcCurve().FirstParameter();
        let umax = this._toOcCurve().LastParameter();

        return [umin,umax];
    }

    


}
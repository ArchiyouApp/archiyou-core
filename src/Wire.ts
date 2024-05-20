/** 
 * 
 *  Wire.ts - A ordered collection of Edges
 * 
 * 
 */

import { WIRE_RECT_WIDTH, WIRE_RECT_DEPTH, WIRE_RECT_POSITION, WIRE_POPULATE_NUM, WIRE_COMBINE_RADIUS, WIRE_LOFTED_SOLID, 
    WIRE_SWEEPED_SOLID, WIRE_SWEEPED_AUTOROTATE, WIRE_THICKEN_AMOUNT, WIRE_THICKEN_DIRECTION, WIRE_OFFSET_AMOUNT,
    WIRE_OFFSET_TYPE, WIRE_FILLET_RADIUS, WIRE_CHAMFER_DISTANCE, WIRE_CHAMFER_ANGLE } from './internal'

import { Vector, Shape, Vertex, Point, Edge, Face, Shell, Solid, ShapeCollection, VertexCollection  } from './internal'
import { isCoordArray, PointLike, isPointLike,isCoord,Coord, Cursor, AnyShape,isAnyShape,AnyShapeOrCollection,
        isAnyShapeOrCollection, Alignment, isAlignment, ColorInput, isColorInput,Pivot,isPivot, LinearShape, isLinearShape, PointLikeSequence, 
        isPointLikeSequence, PointLikeOrVertexCollection, LinearShapeTail, isLinearShapeTail, AnyShapeCollection, isAnyShapeCollection,
        AnyShapeSequence, isAnyShapeSequence, AnyShapeOrSequence, isAnyShapeOrSequence, isMakeWireInput, ThickenDirection, 
        isThickenDirection, MakeWireInput, ShapeType, isShapeType} from './internal' // see types
import { checkInput, cacheOperation, protectOC, addResultShapesToScene } from './decorators'; // Direct import to avoid error with ts-node/jest
import { flattenEntitiesToArray, toRad, toDeg } from './internal' // utils

// this can disable TS errors when subclasses are not initialized yet
type IFace = Face
type IShell = Shell
type ISolid = Solid

export class Wire extends Shape
{   
    /* 
        Inherited from Shape:
            + _oc
            + _ocShape
            + _ocId
    */

    constructor(entities?:MakeWireInput, ...args)
    {   
        super(); // Shape constructor

        if (entities)
        {
            let selectedEntities = (Array.isArray(entities) && !isCoordArray(entities)) ? (entities as Array<any>).concat(args) as Array<any>: [entities, ...args];
            this.fromAll(selectedEntities);
        }
        else {
            // NOTE: empty Wire is allowed: but warn
            // console.warn(`Wire:Wire(): Created an empty Wire. Check if you initialize geometry before working with it!`)
        }
    }

     _fromWire(w:Wire):Wire
    {
        if (w && !w.isEmpty())
        {
            this._ocShape = w._ocShape;
        }
        return this;
    }

    _fromOcWire(ocWire:any, fix:boolean=true):Wire // !!!! TODO: Determine if check is needed !!!!
    {
        if(ocWire && (ocWire instanceof this._oc.TopoDS_Wire || ocWire instanceof this._oc.TopoDS_Shape) && !ocWire.IsNull())
        {
            // For easy debug, always make sure the wrapped OC Shape is TopoDS_Wire
            ocWire = this._makeSpecificOcShape(ocWire, 'Wire');
            this._ocShape = ocWire;
            this._ocId = this._hashcode();            
            this.round(); // round to tolerance

            if (fix) // needed to avoid loop from checkAndFix
            {
                this.checkAndFix();
            }
            return this;
        }
        else {
            throw new Error(`Wire::_fromOcWire: Could not make a valid Wire. Check if not null, is the right OC Shape and is not null!`)
        }
    }

    /** Try to convert something into a Wire */
    @checkInput('MakeWireInput', 'auto')
    fromAll(o:MakeWireInput):Wire
    {
        /* Reasonable inputs for a Wire:
            - Single Shapes that can be turned into Wire
            - Line Wire from Points: A sequence of points in PointSequence(s) - VertexCollection 
            - Detailed Wire: 
                - one or more Edges or Wires (LinearShapes) that are connected. PointLikes can create Line Edges
        */

        if (o)
        {
            this._addEntities(o);
        }
        
        return this;
    }

    /** Class method */
    static fromAll(o:any):Wire
    {
        return new Wire().fromAll(o);
    }
 
    /** Sequentually build a Wire */
    @checkInput('MakeWireInput', 'auto')
    _addEntities(entities:MakeWireInput)
    {   
        let entitiesArray = flattenEntitiesToArray(entities);

        let collection = new ShapeCollection(entitiesArray);

        this._fromShapeCollection(collection);

        return this;
        
    }

    /** Process Shapes sequentially and combine them into a Wire */
    @checkInput('ShapeCollection', 'ShapeCollection')
    _fromShapeCollection(shapes:ShapeCollection):Wire
    {

        let appropriateShapes = shapes.getShapesByTypes(['Vertex','Edge','Wire']);
        
        let newWireEdges = new ShapeCollection();
        let startVertex = null;
        let lastVertex = null;

        appropriateShapes.forEach( shape => 
        {
            lastVertex = (newWireEdges.length > 0) ? (newWireEdges.last() as LinearShape).end() : startVertex;            
            
            switch (shape.type())
            {
                case 'Vertex':
                    let vertex = shape as Vertex;

                    if (!lastVertex) // set startVertex by first Vertex being handled
                    {
                        startVertex = vertex;
                    }
                    else if(!vertex.equals(lastVertex))
                    {
                        newWireEdges.push(new Edge(lastVertex, vertex));
                    }
                    else {
                        console.warn(`Wire::_fromShapeCollection: Skipped same Vertex`);
                        console.warn(vertex);
                    }
                    break;

                case 'Edge' :
                    let edge = shape as Edge;
                    if(lastVertex != null && !edge.start().equals(lastVertex))
                    {
                        console.warn(`Wire:_fromShapeCollection: Given Edge ${edge} does not line up. Connected with Line Edge!`);
                        newWireEdges.push( new Edge(lastVertex, edge.start()));
                    }
                    newWireEdges.push(shape);
                    break;

                case 'Wire':
                    let wire = shape as Wire;
                    if(lastVertex != null && !wire.start().equals(lastVertex))
                    {
                        console.warn(`Wire:_fromShapeCollection: Given Wire ${wire} start Vertex does not line up. Connected with Line Edge!`);
                        newWireEdges.push( new Edge(lastVertex, wire.start()));
                    }
                    newWireEdges.concat(wire.edges());
                    break;
            }
        })

        this.fromEdges(newWireEdges)

        return this;
    }

    //// CURSOR ////

    getCursor():Cursor
    {
        return { point: this.end().toPoint(), direction: this.directionAtEnd() }
    }

    //// PUBLIC CREATION METHODS ////

    @checkInput('AnyShapeSequence', 'ShapeCollection')
    fromEdges(edges:AnyShapeSequence, ...args):Wire
    {
        /** Attempt to create a Wire from connecting Edges 
         * 
         *  OC docs: 
         *     - BRepBuilderAPI_MakeWire: https://dev.opencascade.org/doc/refman/html/class_b_rep_builder_a_p_i___make_wire.html
         *      - Shape/Wire: https://dev.opencascade.org/doc/refman/html/class_shape_analysis___wire.html
        */

        let edgesCollection = edges as ShapeCollection; // auto converted

        let checkedEdgesCollection = edgesCollection.getShapesByType('Edge'); // filter out all non-Edge Shapes

        let wireBuilder = new this._oc.BRepBuilderAPI_MakeWire_1();
        checkedEdgesCollection.forEach(e => wireBuilder.Add_1(e._ocShape)); // NOTE: we can also add Wires and general Shapes to the WireBuilder: TODO

        wireBuilder.Build(new this._oc.Message_ProgressRange_1());
        
        if (wireBuilder.IsDone() == false)
        {
            console.warn(`Wire.fromEdges::ERROR: Failed to build Wire from ${checkedEdgesCollection.length} Edges: OC error: ${wireBuilder.Error().constructor.name}. Trying to connect lose Edges`)
            return this.combineEdges(edges);
        }
        else {
            let ocWire = wireBuilder.Wire();
            this._fromOcWire(ocWire, true); // NOTE: enable checking again

            // Close the Wire if the first and last Edges connect
            if (this._hasClosingEdges())
            {
                this.close();
            }
            
            return this;
        }
        
    }

    /** Create Wire with Line Edges from Vertices **/
    @checkInput('PointLikeSequence', 'VertexCollection')
    fromVertices(vertices: PointLikeSequence, ...args):Wire
    {
        let vertexCollection = vertices as VertexCollection; // auto converted
        
        console.info(`Wire::fromVertices: Got ${vertexCollection.length} vertices to create Wire`);

        let edges = [];
        vertexCollection.forEach((curVert,i) => 
        {
                if (i < vertexCollection.length - 1)
                {
                    let nextVert:Vertex = vertices[i+1];
                    edges.push( new Edge().makeLine( curVert, nextVert));
                }
        });

        this.fromEdges(edges);
    
        return this;
    }

    /** Create Wire from Points (Vertices or an Array or coords) */
    @checkInput('PointLikeSequence', 'VertexCollection')
    fromPoints(points: PointLikeSequence)
    {
        return this.fromVertices(points as VertexCollection); 
    }

    /** Create flat Rectangular Wire */
    @checkInput([[Number, WIRE_RECT_WIDTH], [Number, WIRE_RECT_DEPTH], ['PointLike', WIRE_RECT_POSITION] ], ['auto','auto', 'Vector'])
    makeRect(width?:number, depth?:number, position?:PointLike):Wire
    {
        let positionVec = position as Vector; 
        let rectFace = new Face().makePlane(width, depth, positionVec);
        let wire = rectFace.wires()[0];
        this._fromWire(wire); // set ocShape on current Wire instance: Use fromOcWire, not fromOcShape!
        
        return this;
    }

    /** Create a (righthand or lefthand) Helix with a radius, height and angle. Advanced coneSemiAngle (angle at top) for making a changing Helix radius (- for smaller to top) */
    // Taken from CadQuery: https://github.com/CadQuery/cadquery/blob/3032e0f8fe4856b037313def4b0bf431cae87708/cadquery/occ_impl/shapes.py
    // But simplified API
    @checkInput([[Number,50],[Number,100],[Number,360],['PointLike',[0,0,0]],['PointLike',[0,0,1]],[Boolean, false],[Number, null]], ['auto','auto','auto','Point','Vector', 'auto', 'auto'])
    makeHelix(radius?:number, height?:number, angle?:number, pivot?:PointLike, direction?:PointLike, lefthand?:boolean, coneSemiAngle?:number)
    {
        /* OC docs:
            - Geom_CylindricalSurface: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_geom___cylindrical_surface.html
            - Geom_ConicalSurface: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_geom___conical_surface.html
            - gp_Ax3: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/classgp___ax3.html#af85f3ccea226b523ac7d16f18bc3c7ef
            - Geom2d_Line: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_geom2d___line.html
            - gp_Pnt2d: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/classgp___pnt2d.html#af678f82fce31cbc5847c8c6e1e9b750c
            - gp_Dir2d: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/classgp___dir2d.html
            - GCE2d_MakeSegment: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_g_c_e2d___make_segment.html
            - BRepBuilderAPI_MakeEdge: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_builder_a_p_i___make_edge.html
            - BRepLib: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_lib.html
        */
        let ocGeomSurface;
        // bounds [-90,90] - 90 or 0 is straight cylindrical helix
        coneSemiAngle = (coneSemiAngle < -90) ? -90 : (coneSemiAngle > 90) ? 90 : coneSemiAngle; 

        if (!coneSemiAngle || Math.abs(coneSemiAngle) == 90)
        {
            ocGeomSurface = new this._oc.Geom_CylindricalSurface_1(
                                    new this._oc.gp_Ax3_4( 
                                        (pivot as Point)._toOcPoint(),
                                        (direction as Vector)._toOcDir()),
                                    radius
                                    );
        }
        else {
            // a tapering Helix
            ocGeomSurface = new this._oc.Geom_ConicalSurface_1(
                                new this._oc.gp_Ax3_4((pivot as Point)._toOcPoint(), (direction as Vector)._toOcDir()), 
                                toRad(coneSemiAngle), // angle is semi-angle of cone: meaning half of the angle in the top. Range 0 > angle > 90
                                radius
                            )
        }


        let pitch = height/(angle/360);
        let d = (lefthand) ? -1 : 1; // lefthand or righthand
        let ocGeomLine = new this._oc.Geom2d_Line_3(new this._oc.gp_Pnt2d_3(0,0), new this._oc.gp_Dir2d_4(d*2*Math.PI, pitch))

        let numTurns = angle/360;
        let ocStartPoint = ocGeomLine.Value(0);
        let ocEndPoint = ocGeomLine.Value(numTurns*Math.sqrt( (2*Math.PI)**2 + pitch**2));

        let ocGeomTrimmedSegHandle = new this._oc.GCE2d_MakeSegment_1(ocStartPoint, ocEndPoint).Value(); // Handle_Geom2d_TrimmedCurve
        let ocGeomSegHandle = ocGeomTrimmedSegHandle.get().Reversed().get().Reversed(); // TODO: how can we downgrade Handle_Geom2d_TrimmedCurve to Handle_Geom2d_Curve

        let ocGeomSurfaceHandle = new this._oc.Handle_Geom_Surface_2(ocGeomSurface);
        let ocEdge = new this._oc.BRepBuilderAPI_MakeEdge_30(ocGeomSegHandle, ocGeomSurfaceHandle).Edge();
        let ocWire = new this._oc.BRepBuilderAPI_MakeWire_2(ocEdge).Wire();

        this._oc.BRepLib.BuildCurves3d_1(ocWire, this._oc.SHAPE_TOLERANCE, this._oc.GeomAbs_Shape.GeomAbs_C1, 14, 2000 ); // Wire, tolerance, GeomAbs_Shape, maxDegree, maxSegment        
        
        return this._fromOcWire(ocWire);
    }

    /** Make 2D Spiral */
    // Approach from FreeCad: https://github.com/FreeCAD/FreeCAD/blob/48aafc3f8b36ded8dc80fbf83ec608898ed16d4a/src/Mod/Part/App/TopoShape.cpp
    // With slightly different API
    @checkInput([[Number,100],[Number,50],[Number,360],[Boolean, false]], ['auto','auto','auto'])
    makeSpiral(firstRadius:number, secondRadius:number, angle:number, lefthand:boolean)
    {
        /* Oc docs:
            - https://dev.opencascade.org/doc/occt-7.6.0/refman/html/class_geom2d___line.html
            - https://dev.opencascade.org/doc/occt-7.6.0/refman/html/class_geom___surface_of_revolution.html
            - https://dev.opencascade.org/doc/occt-7.6.0/refman/html/class_n_collection___array1.html
            - https://dev.opencascade.org/doc/occt-7.6.0/refman/html/classgp___vec2d.html
            - https://dev.opencascade.org/doc/occt-7.6.0/refman/html/class_g_c_e2d___make_segment.html
        */

        // some input tests
        if(angle < 0)
        {
            console.warn(`Wire::makeSpiral: Please use a positive angle. If you want to reverse direction use [lefthand=] true' as 4th argument!`);
            angle = 360;
        }

        const numPeriods = angle/360;
        const numFullPeriods = Math.floor(numPeriods);
        const remainingPeriod = numPeriods-numFullPeriods; 
        
        const ocPoints = new this._oc.TColgp_Array1OfPnt_2(1, 2);
        ocPoints.SetValue(1, new Point(firstRadius,0,0)._toOcPoint());
        ocPoints.SetValue(2, new Point(secondRadius,0,0)._toOcPoint());
        let ocMeridian = new this._oc.Geom_BezierCurve_1(ocPoints);
        let ocMeridianHandle = new this._oc.Handle_Geom_Curve_2(ocMeridian);

        let ocAxis = new this._oc.gp_Ax1_2(new Point(0,0,0)._toOcPoint(), new Vector(0,0,1)._toOcDir());


        let ocRevSurface = new this._oc.Geom_SurfaceOfRevolution(ocMeridianHandle, ocAxis);
        let ocRevSurfaceHandle = new this._oc.Handle_Geom_Surface_2(ocRevSurface);
        
        let ocPeriodStart = new this._oc.gp_Pnt2d_3(0,0);
        let ocPeriodEnd = new this._oc.gp_Pnt2d_3(0,0)
        let ocInsetDir = new this._oc.gp_Vec2d_4(((lefthand) ? -1 : 1)*2.0*Math.PI, 1/numPeriods );

        let ocWireBuilder = new this._oc.BRepBuilderAPI_MakeWire_1();

        for ( let i = 0; i < numFullPeriods; i++ )
        {
            ocPeriodEnd = ocPeriodStart.Translated_1(ocInsetDir);
            let ocSegm = new this._oc.GCE2d_MakeSegment_1(ocPeriodStart , ocPeriodEnd).Value();
            ocSegm = new this._oc.Handle_Geom2d_Curve_2(ocSegm.get());
            let ocEdgeOnSurf = new this._oc.BRepBuilderAPI_MakeEdge_30(ocSegm , ocRevSurfaceHandle).Edge();
            ocWireBuilder.Add_1(ocEdgeOnSurf);
            ocPeriodStart = ocPeriodEnd;
        }
        // remaining loop
        if (remainingPeriod > this._oc.SHAPE_TOLERANCE)
        {
            ocInsetDir.Scale(remainingPeriod);
            ocPeriodEnd = ocPeriodStart.Translated_1(ocInsetDir);
            let ocSegm = new this._oc.GCE2d_MakeSegment_1(ocPeriodStart , ocPeriodEnd).Value();
            ocSegm = new this._oc.Handle_Geom2d_Curve_2(ocSegm.get());
            let ocEdgeOnSurf = new this._oc.BRepBuilderAPI_MakeEdge_30(ocSegm , ocRevSurfaceHandle).Edge();
            ocWireBuilder.Add_1(ocEdgeOnSurf);
        }
        
        let ocWire = ocWireBuilder.Wire();
        this._oc.BRepLib.BuildCurves3d_1(ocWire, this._oc.SHAPE_TOLERANCE, this._oc.GeomAbs_Shape.GeomAbs_C1, 14, 10000 ); // Wire, tolerance, GeomAbs_Shape, maxDegree, maxSegment    
        return this._fromOcWire(ocWire);
    }

    //// TRANSFORMATIONS ////

    /** Return the first Edge (private)) */
    _toEdge()
    {
        if (this.edges().length > 0)
        {
            return this.edges()[0];
        }
        else {
            console.warn(`Wire::toEdge: Could not get Edge: Wires has no edges!`);
            return null;
        }
    }

    /** Return the first Edge (comes in handy when using Wire methods on single Edge Wire) */
    @addResultShapesToScene
    toEdge()
    {
        return this._toEdge();
    }

    /** For consistency */
    _toWire()
    {
        return this;
    }

    /** For consistency */
    toWire()
    {
        return this;
    }

    /** Try to convert Wire to Face (private) */
    _toFace()
    {
        return new Face().fromWire(this.close()) as Face;
    }

    /** Try to convert Wire to Face */
    @addResultShapesToScene
    toFace():IFace
    {
        return this._toFace();
    }

    /** This returns the most specified subclass of Shape */
    _ocGeom():any 
    {
        this._ocShape;
    }

     _toOcCurve():any
    {
        return this._toOcCurveHandle().get();   
    }

    _toOcCurveHandle():any
    {
        // OC docs: https://dev.opencascade.org/doc/refman/html/class_b_rep_adaptor___comp_curve.html#a1c128035c0640cf679fd3bc22cb59e56
        let ocCompCurve = new this._oc.BRepAdaptor_CompCurve_2(this._ocShape, false); // TopoDS_Shape, KnotByCurvilinearAbcissa 
        
        let ocCurveHandle = ocCompCurve.Trim(ocCompCurve.FirstParameter(), ocCompCurve.LastParameter(), 0.0001); // Use trim to get a Curve, ShallowCopy is not in library yet!    

        return ocCurveHandle;
    }

    //// CALCULATED PROPERTIES ////
     
    /** Check if Wire is coplanar */
    planar():boolean
    {
        // we can say one edge Wire is also planar
        if(this.edges().length == 1)
        {
            return true;
        }

        let ocSurfaceFinder = new this._oc.BRepLib_FindSurface_2(this._ocShape, 1e-3, true, false)
        if (!ocSurfaceFinder.Found())
        {
            ocSurfaceFinder.delete();
            return false;
        }
        return true
    }


    /** Get subtype of Wire, used for selecting */
    wireType():string
    {
        if (this.planar() && !this.closed()){ return 'Planar' } // NOTE: for simplicity and consistency: output as Planar
        else if (!this.planar() && this.closed()){ return 'Closed'}
        else if (this.planar() && this.closed()){ return 'PlanarClosed'}

        return 'OtherWire'; // the default
    }

    /** Check if a Wire is closed */
    closed():boolean
    {
        // OC docs: BRep_Tool: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep___tool.html
        return (this._oc.BRep_Tool.prototype.constructor.IsClosed_1(this._ocShape) === true);
    }

    /** Check if Wire is continuous */
    checkConnections():boolean 
    {
        /** OC docs: https://dev.opencascade.org/doc/refman/html/class_shape_analysis___wire.html */
        // IMPORTANT ON USING ShapeAnalysis: We need to make the Wire part of a Face to get information on self-intersection, connected etc.
        let shapeAnalyse = new this._oc.ShapeAnalysis_Wire_1();
        shapeAnalyse.Load_1(this._ocShape);
        
        let c = !shapeAnalyse.CheckConnected_1(0.0); // NOTE: seems more logical that is returns true when all is connected

        return c;
    }

    selfIntersecting():boolean
    {
        /** OC docs
         *      - CheckSelfIntersection: https://dev.opencascade.org/doc/refman/html/class_shape_analysis___wire.html
         *      - !!!! IMPORTANT: does only check adjacent Edges
         */

        /*
        let shapeAnalyse = new this._oc.ShapeAnalysis_Wire_1();
        shapeAnalyse.Load_1(this._ocShape);
        return shapeAnalyse.CheckSelfIntersection();
        */

        // Because of the limitations CheckSelfIntersection() of we do this outside OC
        
        let edges = this.edges();

        for (let i = 0; i < edges.length; i++)
        {
            let curEdge = edges[i];
            // check intersection with all other Edges except itself
            for (let o = 0; o < edges.length; o++)
            {
                let otherEdge = edges[o];
                if(i != o)
                {
                    let intersections = curEdge._intersections(otherEdge); // ShapeCollection or null
                    
                    let noSelfIntersection = true;

                    if(intersections)
                    {
                        noSelfIntersection = intersections.every( intersection =>
                        {   
                        
                            if( intersection != null && intersection instanceof Vertex
                                && !curEdge.start().equals(intersection) && !curEdge.end().equals(intersection) )
                            {
                                // there is a intersection with other Edge not at its start or end Vertex
                                return false;
                            }
                            else {
                                return true;
                            }
                            
                        });

                        if(!noSelfIntersection)
                        {
                            return true;
                        }
                    }
                    
                }
            }
        }
            
        return false;
    }

    /** Get the start Vertex of the Wire */
    start():Vertex
    {
        return this.vertices().at(0) as Vertex; // although [0] could work with experimental fake keys we use official ShapeCollection.at method
    }

    /** Get the end Vertex of the Wire */
    end():Vertex
    {
        return this.vertices().at(this.vertices().length-1) as Vertex;
    }

    is2DXY(): boolean 
    {
        return this.vertices().every(v => (v as Vertex).z <= this._oc.SHAPE_TOLERANCE)
    }

    /** Get Normal of the Wire at the start Vertex */
    normalAtStart():Vector
    {
        return this.normalAt(this.start());
    }

    /** Get Normal of the Wire at the end Vertex */
    normalAtEnd():Vector
    {
        return this.normalAt(this.end());
    }
    
    /** Get workplane normal if Wire is planar */
    workPlaneNormal():Vector
    {
        let edges = this.edges();
        if (!this.planar())
        {
            console.warn(`Wire::workPlaneNormal: Wire is not planar. Returned null`)
            return null;
        }

        if(edges.length == 1)
        {
            return edges[0].workPlaneNormal(); // if 2D Edge returns normal otherwise null
        }
        
        let v1 = edges[0].direction().normalize();
        let v2 = edges[1].direction().normalize();

        // if vectors are the same but reversed: do our best to 
        // TODO: Implement a more robust solution?
        if(v1.angle(v2) == 180)
        {
            v1 = (edges[0].edgeType() != 'Line') ? edges[0].directionAtPerc(0.3) : edges[0].direction().normalize();
            v2 = (edges[0].edgeType() != 'Line') ? edges[1].directionAtPerc(0.8) : edges[0].direction().normalize();
        }

        let n = v2.crossed(v1).normalize();
        // protect against [0,0,0] workplane which is impossible
        if (n.equals([0,0,0])){ n = new Vector(0,0,1) };
        
        return n;
    }

    /** Get Direction Vector of Wire at the start Vertex */
    directionAtStart():Vector
    {
        let firstEdge = this.edges()[0];
        return firstEdge.directionAt(firstEdge.start());
    }

    /** Get Direction Vector of Wire at the end Vertex */
    directionAtEnd():Vector
    {
        let edges = this.edges();
        let lastEdge = edges[edges.length-1];
        return lastEdge.directionAt(lastEdge.end());
    }
    

    /** Get Edge that contains or is closest to Point */
    @checkInput('PointLike', 'Vertex')
    edgeAtPoint(point:PointLike, ...args):Edge
    {
        let vertex = point as Vertex; // auto converted
        let intersectedEdges = this.edges().filter( e => e._intersections(vertex));

        // if not directly on the Wire: get closest Edge
        let atEdge = intersectedEdges[0] || this.edges().all().sort( (e1,e2) => e1.distance(vertex) - e2.distance(vertex))[0]; // distance ascending
        
        return atEdge
    }


    /** Get the normal on a Point on the Wire  */
    // NOTE: Normals of 3D Wires can be underdetermined (like with all Edges)
    // But if the Wire is planar the normal will lying on that plane (for good 2D use)
    @checkInput('PointLike', 'Point')
    normalAt(point:PointLike, ...args):Vector // ...args for flattened x,y,z input
    {
        // get Edge where the given point is on or closest to
        let atPoint = point as Point; // auto converted
        let atEdge = this.edgeAtPoint(atPoint);

        if (this.planar())
        {
            let face = (this.copy(false) as Wire)._toFace(); // avoid adding to scene
            if (face){
                return face.normal().crossed(atEdge.directionAt(atPoint)).normalize();
            }
        }
        
        // fall back to underdetermined (XY) Edge normal
        return atEdge.normalAt(point);
    }

    /** Get normal of Face bounded by Wire 
     *  NOTE: NormalAt gives on point on the Wire, normal that of the workplane
    */
    normal():Vector
    {
        console.info(`Wire::normal: normal() gives the normal of the workplane of the Wire. Use normalAt of the normal at a Point on the Line`)
        return this.workPlaneNormal();
    }

    @checkInput('PointLike', Vertex)
    directionAt(point:PointLike, ...args):Vector
    {
        let vertex = point as Vertex; // auto converted
        let atEdge = this.edgeAtPoint(vertex);
        return atEdge.directionAt(point); 
    }

    /** Get a Point at a certain percentage of the Wire */
    @checkInput(Number, Number)
    pointAt(perc:number):Vector  // TODO: rename to Vertex at? 
    {
        // NOTE: The same as Edge - combine?
        if(perc < 0 )
        {
            console.warn(`Wire:pointAt: Please supply a number in range [0.0 and 1.0]!`);
            perc = 0.0;
        }
        else if ( perc > 1.0)
        {
            console.warn(`Wire:pointAt: Please supply a number in range [0.0 and 1.0]!`);
            perc = 1.0;
        }

        let uMin = this._toOcCurve().FirstParameter();
        let uMax = this._toOcCurve().LastParameter();

        let atU =  uMin + perc * (uMax - uMin);

        let v:Vector = this.pointAtParam(atU);
        
        return v;
    }

    @checkInput(Number, Number)
    pointAtParam(param:number):Vector
    {
        let v = new Vector()._fromOcPoint(this._toOcCurve().Value(param)); 
        
        return v.rounded();
    }

    /** Generate a Collection of a given number of Vertices equally spaces over this Wire including the start and end 
     *  IMPORTANT: Parameters on a Wire are not homogenous with length units: We need a bit more advanced solution 
     */
    @addResultShapesToScene
    @checkInput([[Number,WIRE_POPULATE_NUM]], Number)
    populated(num?:number):ShapeCollection
    {
        // Forward to Edge if only one 
        if(this.edges().length === 1)
        {
            return this.edges()[0].populated(num)
        }

        const totalEdgeLength = this.edges().all().reduce((acc, e) => acc + e.length(), 0);
        
        const distancePerPoint = totalEdgeLength/(num - 1);

        let travelledDistance = 0;
        const allEdges = this.edges();
        let curEdgeIndex = 0;
        let curEdge = allEdges[curEdgeIndex];
        let curEdgeTravelledAtStart = 0;

        let verticesOnWire = new ShapeCollection();
        
        for (let p = 0; p < num; p++ )
        {
            travelledDistance = distancePerPoint * p; // start with 0
            let travelledOnEdge = travelledDistance - curEdgeTravelledAtStart;
        
            if (travelledOnEdge > curEdge.length() ) // does not fit on the current Edge
            {
                // move to next Edge
                curEdgeIndex += 1;
                curEdgeTravelledAtStart = curEdgeTravelledAtStart + curEdge.length(); // end of Edge
                travelledOnEdge = travelledDistance - curEdgeTravelledAtStart; // new travelled distance on next Edge is what remains
                curEdge = allEdges[curEdgeIndex]; // switch to next Edge
                
                if(!curEdge)
                {
                    // add end Vertex and stop
                    verticesOnWire.add( allEdges[allEdges.length-1].end()); // add Vertex to ShapeCollection
                    break;
                }
            }

            verticesOnWire.add( curEdge.pointAt( travelledOnEdge / curEdge.length())._toVertex() ); // add Vertex to ShapeCollection
        }

        verticesOnWire.setName(`PopulatedVertices`); // set name in scenegraph. TODO: smart names like PopulatedVerticesOf{ParentShape}

        return verticesOnWire;
    }

    /** Get the length of this Wire */
    length():number 
    {   
        if (this.isEmpty() && this.edges().length == 0){
            console.warn(`Wire::length: Empty Wire`);
            return 0;
        }

        let length = 0;
        this.edges().forEach( e => length += e.length() );
        return length;
    }

    /** Get center of Wire - This is not the middle Point! See middle() */
    center():Point
    {
        return (this._ocShape) ? this.bbox().center() : null;
    }

    /** Return middle of Wire */
    middle():Point
    {
        return this.pointAt(0.5);
    }

    //// OPERATIONS ON WIRE ////

    /** Do checks and fix Wire
     *  WARNING: This does more bad than good, so disabled in _fromOcWir
     */
    checkAndFix():Wire
    {
        
        /* IMPORTANT: 
            We cannot set the mode, so only apply this function for closed Wires    

            Docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_shape_fix___wire.html
        */

        const FIX_PRECISION = 0.5;

        if(this.closed())
        {
            try 
            { 
                let ocWireFixer = new this._oc.ShapeFix_Wire_2(this._ocShape, new Face().fromWire(this)._ocGeom(), -1.0 );
                ocWireFixer.SetPrecision(FIX_PRECISION);

                if (ocWireFixer.IsReady())
                {
                    ocWireFixer.FixReorder_1(); // this needs to go first see: https://dev.opencascade.org/doc/overview/html/occt_user_guides__shape_healing.html
                    //ocWireFixer.FixSmall_1(true, 0.0);
                    //ocWireFixer.FixEdgeCurves();
                    //ocWireFixer.FixDegenerated_1();
                    //ocWireFixer.FixGaps3d(); // gives weird results with curved lines
                    // ocWireFixer.FixGaps2d(); // also weird results
                    //ocWireFixer.FixClosed(-1.0);
                    ocWireFixer.FixConnected_1(this._oc.SHAPE_TOLERANCE); // can connect edges for closing!
                    // ocWireFixer.FixLacking_1(false); // weird results

                    //ocWireFixer.Perform();
                    this._fromOcWire(ocWireFixer.Wire(), false); // fix=false, avoid un-ending loop
                }
                else {
                    console.warn(`Wire::_checkAndFix: Problem with ocWireFixer!`)
                }
            }
            catch(e)
            {
                console.warn(`Wire::checkAndFix: Check and fix failed, cannot guarantee quality of Wire! ${e}`);
            }
        }

        return this;
        
    }


    /** Close this Wire by creating Edge from last Vertex to first */
    close():Wire
    {
        // check if the Edges already close or not
        if (this.closed())
        {
            // do nothing
        }
        else
        {
            // create extra Edge from last Vertex to first and make rebuild Wire
            let closingEdge = new Edge().makeLine(this.end(), this.start());
            this.fromEdges(this.edges().add(closingEdge)); // edges() returns ShapeCollection, all() gives the array of Shapes
        }

        return this;

    }

    /** Reverse order of Wire by reversing Edges */
    reverse():Wire
    {
        // non-OC
        let reversedEdges = [];
        this.edges().reverse().forEach( e => reversedEdges.push( new Edge(e.end(), e.start()) ));
        let w = new Wire().fromEdges(reversedEdges);
        this._ocShape = w._ocShape; // copy ocShape

        // this._ocShape.Reverse(); // this does not work: OC probably means something different for orientation !

        return this;
    }

    /** Same as reverse but return a copy */
    reversed():Wire
    {
        return (this.copy() as Wire).reverse();
    }

    /** Connect two Wires together into new one: introducing new line Edges distance is less than radius */
    @checkInput(['Wire',[Number, WIRE_COMBINE_RADIUS]], ['auto','auto'])
    combined(other:Wire, radius?:number):Wire
    {
        // !!!! OC can be very weird with order of Edges in a Wire: use a own method
        let allEdges:ShapeCollection = this.edges().concat(other.edges());

        return this.combineEdges(allEdges);
    }

    /** Extra algorithm to combine Edges into Wire - The OC WireBuilder does this mostly too - but this is triggered as last resort */
    @checkInput(['AnyShapeSequence',[Number,WIRE_COMBINE_RADIUS]], [ShapeCollection, 'auto'] )
    combineEdges(edges:AnyShapeSequence, radius?:number):Wire
    {        
        edges = (edges as ShapeCollection).getShapesByType('Edge');
        let edgeGroups:Array<Array<Edge>> = this._groupEdges(edges, radius);
        if (edgeGroups.length > 1)
        {
            console.warn(`Wire::combineEdges: We have loose Edge groups! So resulting Wire is missing inputs. Please check!`);
        }

        return new Wire().fromEdges(edgeGroups[0]);
    }

    /** We get unconnected Edges a lot ( because OC is somewhat loose with Edges in Wires )
        This algorithm reconstructs a Collection of Array of Edges into a ordered (by number of Edges) Array of Wires */
    @checkInput(['AnyShapeSequence',[Number,WIRE_COMBINE_RADIUS]], ['ShapeCollection', 'auto'])
    _groupEdges(edges:AnyShapeSequence, radius?:number):Array<Array<Edge>>
    {
        const EDGE_ISCONNECTED_RANGE = radius;
        const ADD_LINE_EDGE_IF_GAP = true;

        edges = edges as ShapeCollection; // auto converted

        if (edges.length <= 1)
        {
            return [edges.toArray() as Array<Edge>]; // just collapse the one Edge into one group
        }

        let edgesArr:Array<Edge> = edges.getShapesByType('Edge').toArray() as Array<Edge>;

        let unusedEdges:Array<Edge> = [...edgesArr];
        
        let startEdge = unusedEdges.shift();
        let curGroupExternalEdges = [ startEdge ];
        let edgeGroups:Array<Array<Edge>> = [ [startEdge] ]; // Start with first Edge

        while(unusedEdges.length != 0)
        {
            // find first Edge that is connected to the Edges in curGroupExternalEdges
            let connectingGroupEdge, connectedEdge;

            connectedEdge = unusedEdges.find( e => 
            {
                let groupEdgeConnected = curGroupExternalEdges.find( groupEdge => groupEdge.connected(e) || (groupEdge.distance(e) < EDGE_ISCONNECTED_RANGE)  )
                connectingGroupEdge = groupEdgeConnected;

                return (groupEdgeConnected != undefined)
            });
            
            if (!connectedEdge)
            {
                // no connected Edge: create new group with next Edge
                let newGroupEdge = unusedEdges.shift();
                curGroupExternalEdges = [newGroupEdge]
                edgeGroups.push([newGroupEdge]);
            }
            else 
            {
                let translateConnectedEdge = connectingGroupEdge.distance(connectedEdge) > 0.0; // flag if we need to translate

                let groupEdgeConnectedAt;
                if(!translateConnectedEdge)
                {
                    groupEdgeConnectedAt =  ( connectingGroupEdge.start().equals(connectedEdge.start()) || connectingGroupEdge.start().equals(connectedEdge.end())) ? 'start' : 'end';
                }
                else {
                    groupEdgeConnectedAt =  (connectingGroupEdge.start().distance(connectedEdge) < connectingGroupEdge.end().distance(connectedEdge)) ? 'start' : 'end'
                }
                
                let edgeConnectedAtReverse;

                if (!translateConnectedEdge)
                {
                    edgeConnectedAtReverse = ( connectingGroupEdge[groupEdgeConnectedAt]().equals(connectedEdge[groupEdgeConnectedAt]())) ? true : false; // reverse when start()=start() or end()=end()
                }
                else 
                {
                    edgeConnectedAtReverse = ( connectingGroupEdge[groupEdgeConnectedAt]().distance(connectedEdge.end()) < connectingGroupEdge[groupEdgeConnectedAt]().distance(connectedEdge.start()) );
                }

                let edgeConnectedAt = (edgeConnectedAtReverse) ? ((groupEdgeConnectedAt == 'start' ) ? 'start' : 'end') : ((groupEdgeConnectedAt == 'end' ) ? 'start' : 'end' );

                unusedEdges = unusedEdges.filter( e => e !== connectedEdge); // remove connectedEdge from unused Edges array

                // !!!! NOTE: We don't need to reverse Edges - the OC Wire can handle those as long as the Vertices are ligned up - Also it can handle gaps under tolerance

                let gapEdge:Edge = null;
                if (ADD_LINE_EDGE_IF_GAP)
                {
                    let d = connectedEdge.distance(connectingGroupEdge);
                    if ( d > this._oc.SHAPE_TOLERANCE && d <= EDGE_ISCONNECTED_RANGE)
                    {
                        let firstVertex = connectingGroupEdge[groupEdgeConnectedAt](); // start() or end()
                        let secondVertex = connectedEdge[edgeConnectedAt]();
                        gapEdge = new Edge().makeLine(firstVertex, secondVertex);
                        console.warn(`Wire::_groupEdges: We filled a gap between edges of size "${d}". Current radius="${EDGE_ISCONNECTED_RANGE}". Change this parameter to avoid creating extra Edges!`);
                    }
                }
                
                // now add the connected Edge to the existing group : either at start or end
                let curEdgeGroup = edgeGroups[edgeGroups.length-1];
                if(curEdgeGroup.length == 1)
                { // only one Edge in Group - first Edge
                    if (groupEdgeConnectedAt == 'start')
                    {
                        if (gapEdge) curEdgeGroup.splice(0,0,gapEdge);
                        curEdgeGroup.splice(0,0,connectedEdge); // add 
                    }
                    else {
                        if (gapEdge) curEdgeGroup.push(gapEdge);
                        curEdgeGroup.push(connectedEdge);
                    }
                }
                else {
                    // we have multiple Edges in current group: see at end or beginning
                    if(curEdgeGroup.indexOf(connectingGroupEdge) == 0) // at the start
                    {
                        if (gapEdge) curEdgeGroup.splice(0,0,gapEdge);
                        curEdgeGroup.splice(0,0,connectedEdge);
                    }
                    else 
                    { // at end
                        if (gapEdge) curEdgeGroup.push(gapEdge);
                        curEdgeGroup.push(connectedEdge);
                    }
                }

                curGroupExternalEdges = [curEdgeGroup[0], curEdgeGroup[curEdgeGroup.length-1] ];
            }
        }

        edgeGroups.sort( (g1,g2) => g2.length - g1.length); // sort based on number of Edges in groups (descending)
        
        return edgeGroups;
    }

    //// SHAPE OPERATIONS ON WIRE ////

    /** Make a Solid by lofting from one Wire through section Wires (private: without adding to Scene)  */
    @protectOC([]) // TODO: hints
    @checkInput(['AnyShapeOrCollection', [Boolean, WIRE_LOFTED_SOLID ]], ['ShapeCollection', 'auto'])
    _lofted(sections:AnyShapeOrCollection, solid?:boolean):IShell|Solid
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_offset_a_p_i___thru_sections.html
        // TODO: test ruled
        
        const RULED = false;
        const SHAPES_CAN_BE_LOFTED:Array<ShapeType> = ['Vertex', 'Edge', 'Wire','Face'];
        const SHAPES_TO_WIRE:Array<ShapeType> = ['Edge', 'Face'];
        
        // combine current Shape with given sections
        sections = new ShapeCollection(this, (sections as ShapeCollection).getShapesByTypes(SHAPES_CAN_BE_LOFTED));
        sections = sections.map( s => SHAPES_TO_WIRE.includes((s as AnyShape).type()) ? (s as AnyShape)._toWire() : s);

        // check if we need to try to make a solid or not
        let canBeSolid = true && solid;
        if(canBeSolid)
        {
            for(let w = 0; w < sections.length; w++)
            {
                if(sections[w].closed && sections[w].closed() == false) // NOTE: allow vertices too!
                {
                    canBeSolid = false;
                    break;
                }
            }
        }
        
        let ocLoft = new this._oc.BRepOffsetAPI_ThruSections(canBeSolid, RULED, this._oc.SHAPE_TOLERANCE); // see docs: isSolid, ruled, pres3d

        sections.forEach( section => 
        { 
            if(section instanceof Wire)
            { 
                ocLoft.AddWire( (section as Wire)._ocShape);
            }
            else if( (section as any) instanceof Edge) // NOTE: avoid a weird TS error
            {
                ocLoft.AddWire( (section as Edge)._toWire()._ocShape )  // single Edge Wire
            }
            else if((section as any) instanceof Vertex)
            {
                ocLoft.AddVertex( (section as Vertex)._ocShape )
            }
            else {
                console.warn(`Wire::lofted: Skipped unknown section Shape: ${section}`)
            }
        });

        ocLoft.Build(new this._oc.Message_ProgressRange_1());

        if (ocLoft.IsDone())
        {
            let newShape = new Shape()._fromOcShape(ocLoft.Shape()); // .checkDowngrade();
            return newShape as Shell|Solid;
        }
        else {
            throw new Error(`Wire::_lofted(): Loft failed to generate. Check the given profiles!`)
        }
    }

    /** Make a new Solid by lofting from a flat Shape through a number of sections */
    @addResultShapesToScene
    @checkInput(['AnyShapeOrCollection', [Boolean, WIRE_LOFTED_SOLID ]], ['ShapeCollection', 'auto'])
    lofted(sections:AnyShapeOrCollection, solid?:boolean):IShell|Solid
    {
        return this._lofted(sections, solid);
    }

    /** Make a Solid by lofting a flat Shape through a number of sections  */
    @checkInput(['AnyShapeOrCollection', [Boolean, WIRE_LOFTED_SOLID ]], ['ShapeCollection', 'auto'])
    loft(sections:AnyShapeOrCollection, solid?:boolean):IShell|Solid
    {
        let loftedShape = this._lofted(sections,solid);
        this.replaceShape(loftedShape);
        return loftedShape;
    }

    /** Sweep a profile Wire or Face ( see Face.ts implementation: splitting inner and outerwires) along a path to create a Shell or Solid  
     *  TODO: holes in profile from Face
    */
    @checkInput(['LinearShape',['Boolean', WIRE_SWEEPED_SOLID],[Boolean, WIRE_SWEEPED_AUTOROTATE],['Alignment', null]],['auto','auto','auto','auto'])
    _sweeped(path:LinearShape, solid?:boolean, autoRotate?:boolean, alignToPath?:Alignment):IFace|Shell|Solid
    {
        // OC docs: https://dev.opencascade.org/doc/refman/html/class_b_rep_offset_a_p_i___make_pipe_shell.html
        let holes = []; // TODO: holes

        let profileWire:Wire = this;
        let pathWire:Wire = (path instanceof Wire) ? path : path._toWire(); // if Edge convert to Wire

        // align type the Profile to the start of the path before sweeping: use combinations like left/right, front/back, (bottom/top)
        if(alignToPath)
        {
            this.align(pathWire.start(), alignToPath);
        }
        // for every profile (one inner, and zero or more outer)
        let innerOuterProfiles = [profileWire].concat(holes);
        let sweepedShapes = [];
        
        innerOuterProfiles.forEach( p => 
        {
            let builder = new this._oc.BRepOffsetAPI_MakePipeShell(pathWire._ocShape);

            /* NOTES

                All these modes don't really seem to work:

                builder.SetMode_1(true) // IsFrenet
                builder.SetMode_2( new this._oc.gp_Ax2_3(new Vector(50,0,0)._toOcPoint(), new Vector(1,0,0)._toOcDir()));
                builder.SetMode_3( new Vector(0,1,1)._toOcDir() );
                builder.SetMode_4(profileWire._ocShape) // AuxiliarySpine, 	CurvilinearEquivalence, KeepContact
                builder.SetMode_5(pathWire._ocShape, false, this._oc.BRepFill_TypeOfContact.BRepFill_NoContact) // AuxiliarySpine, 	CurvilinearEquivalence, KeepContact ==> Crash

                builder.SetDiscreteMode() // does not do anything
            */

            /* What do the corners look like: 
                    - BRepBuilderAPI_Transformed = Profile remains the same location 
                    - BRepBuilderAPI_RightCorner = Straight corners 
                    - BRepBuilderAPI_RoundCorner = Rounded corners ( works only with WithCorrection in Add ! )
            */

            builder.SetTransitionMode(this._oc.BRepBuilderAPI_TransitionMode.BRepBuilderAPI_RightCorner ); // BRepBuilderAPI_Transformed             
            
            // NOTE: autoRotate with 2D Shapes (Edges and Faces) results in crashes!
            builder.Add_1(p._ocShape, false, autoRotate); // WithContact ( autotranslate ), WithCorrection ( = autorotate )
            
            try {
                builder.Build(new this._oc.Message_ProgressRange_1());
            }
            catch(e){
                console.error(`Wire::sweeped: Sweep failed. Try to turn off autoRotate for 2D Shapes!`);
            }

            if(solid)
            {
                builder.MakeSolid();
            }

            let newSweepShape = new Shape()._fromOcShape(builder.Shape()).specific();
            
            sweepedShapes.push( newSweepShape );
        });

        let outerSweep = sweepedShapes[0];
        let holeSweeps = sweepedShapes.slice(1);

        return outerSweep; // TODO: cut holes
    }

    /** Sweep a profile Wire or Face ( see Face.ts implementation: splitting inner and outerwires) along a path to create a Shell or Solid  */
    @addResultShapesToScene
    @checkInput(['LinearShape',['Boolean', WIRE_SWEEPED_SOLID],[Boolean, WIRE_SWEEPED_AUTOROTATE],['Alignment', null]],['auto','auto','auto','auto'])
    sweeped(path:LinearShape, solid?:boolean, autoRotate?:boolean, alignToPath?:Alignment):IFace|Shell|Solid
    {
        return this._sweeped(path,solid,autoRotate,alignToPath);
    }

    /** Sweep a profile Wire or Face ( see Face.ts implementation: splitting inner and outerwires) along a path to create a Shell or Solid  */
    @checkInput(['LinearShape',['Boolean', WIRE_SWEEPED_SOLID],[Boolean, WIRE_SWEEPED_AUTOROTATE],['Alignment', null]],['auto','auto','auto','auto'])
    sweep(path:LinearShape, solid?:boolean, autoRotate?:boolean, alignToPath?:Alignment):IFace|Shell|Solid
    {
        let sweepedShape = this._sweeped(path,solid,autoRotate);
        this.replaceShape(sweepedShape);
        return sweepedShape;
    }

    /** Thicken (2D) Wire to create a thick Face (private: without adding to Scene)
     *   Compared to offset thickening creates a higher order Shape while offset keeps original Shape type
     *   @param amount The total thickness added
     *   @param direction PointLike or Side (top,bottom,left,right,front,back)
     *   @param onPlaneNormal Force the resulting Face to be on a specific plane given by its normal
    */
    @checkInput([[Number,WIRE_THICKEN_AMOUNT],['ThickenDirection', WIRE_THICKEN_DIRECTION], ['PointLike', null]], ['auto', 'auto', 'Vector'])
    _thickened(amount:number, direction?:ThickenDirection, onPlaneNormal?:PointLike):IFace
    {
        let planeVec = (onPlaneNormal as Vector) || this.workPlaneNormal();
        let normalAtStart = (planeVec) ? planeVec.crossed(this.directionAtStart()).normalize() : this.normalAtStart();
        let thickenOffsetVec = normalAtStart.scaled(amount);
        let offsetEdge:Edge; // manually align the offsetEdge based on the direction
        
        if(!direction || direction == 'center' || direction == 'all') // default: centered on path
        {
            offsetEdge = new Edge(this.start(), this.start().toVector().added(thickenOffsetVec));
            offsetEdge.align(this.start(), 'center');
        }
        else {
            // based on direction indication we get a Vec that we compare  distance with from the normal and flipped normal
            let directionPosition:Vector;

            if (typeof direction == 'string')
            {   
                // direction indications using the bbox indication              
                let percXYZ = this._alignStringToAlignPerc(direction as string);
                let bbox = this.bbox().enlarged(10); // make a bigger bbox just to avoid zero dimensions for horizontal/vertical lines
                directionPosition = bbox.getPositionAtPerc(percXYZ[0], percXYZ[1], percXYZ[2]).toVector();
            }
            else {
                // given a PointLike
                directionPosition = new Vector(direction)
            }

            // we got a direction to thicken to
            let fromVec = this.center().toVector();
            let v1 = fromVec.added(normalAtStart);
            let v2 = fromVec.subtracted(normalAtStart);

            let d1 = directionPosition.distance(v1);
            let d2 = directionPosition.distance(v2);

            if(d1 <= d2)
            {
                offsetEdge = new Edge(this.start(), this.start().toVector().added(thickenOffsetVec));
            }
            else {
                offsetEdge = new Edge(this.start(), this.start().toVector().subtracted(thickenOffsetVec));
            }
            offsetEdge.alignTo(this, 'start', 'start'); // align the (start of) offset Edge to start of this Wire
        }


        // do the sweep with pre-aligned  offsetEdge and no autorotate
        // NOTE: We need to check for Shape types with only one subtype ( like Shell only one Face => downgrade then)
        let newFace = offsetEdge.sweeped(this, false, false, null).checkDowngrade() as Face; // !!!! autoRotate needs to be off for 2D shapes! !!!!

        newFace._unifyDomain(); // remove subdivision on same plane

        return newFace
    }

    @addResultShapesToScene
    @checkInput([[Number,WIRE_THICKEN_AMOUNT],['ThickenDirection', WIRE_THICKEN_DIRECTION], ['PointLike', null]], ['auto', 'auto', 'Vector'])
    thickened(amount:number, direction?:ThickenDirection, onPlaneNormal?:PointLike):IFace
    {
        return this._thickened(amount, direction, onPlaneNormal);
    }

    /** Thicken (2D) Wire to create a thick Face  
        @param direction PointLike or Side (top,bottom,left,right,front,back)
    */
    @checkInput([[Number,WIRE_THICKEN_AMOUNT],['ThickenDirection', WIRE_THICKEN_DIRECTION], ['PointLike', null]], ['auto', 'auto', 'Vector'])
    thicken(amount:number, direction?:ThickenDirection, onPlaneNormal?:PointLike):IFace
    {
        let newShape = this._thickened(amount, direction, onPlaneNormal);
        this.replaceShape(newShape);

        return newShape;
    }

    /** Offset Wire to create a new parallel Wire at given distance (private) 
     *  IMPORTANT: -amount means the Wire becomes smaller. We will check for that!
    */
    // TODO: @protectOC
    @checkInput([[Number,WIRE_OFFSET_AMOUNT],[String, WIRE_OFFSET_TYPE], ['PointLike', null]], ['auto', 'auto', 'Vector'])
    _offsetted(amount?:number, type?:string, onPlaneNormal?:PointLike):Wire
    {
        // TODO: can we use onPlaneNormal for open 3D Wires?

        const OFFSET_2D_TYPE = {
            'tangent' : this._oc.GeomAbs_JoinType.GeomAbs_Tangent,
            'arc' : this._oc.GeomAbs_JoinType.GeomAbs_Arc,
            'intersection' : this._oc.GeomAbs_JoinType.GeomAbs_Intersection,
            }

        // OC docs: BRepOffsetAPI_MakeOffset: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_offset_a_p_i___make_offset.html
        if (!this.planar())
        {
            console.error(`Wire::offset: Cannot offset a non-planar Wire!`);
            return null;
        }
       
        let ocOffsetType = OFFSET_2D_TYPE[type] || OFFSET_2D_TYPE[WIRE_OFFSET_TYPE];
        let ocMakeOffset;
        let isOpen = false;

        if(this.closed())
        {
            // Closed Wire
            if(this.selfIntersecting())
            {
                console.error(`Wire::offset: Cannot offset a self-intersecting Wire or Face!`);
                return null;
            }

            // Fix case if Wire has only one single (probably a Circle)
            const downgradedShape = this.checkDowngrade();
            if(downgradedShape.type() == 'Edge')
            {
                return (downgradedShape._offsetted(amount, type, onPlaneNormal) as Edge)._toWire();
            }

            ocMakeOffset = new this._oc.BRepOffsetAPI_MakeOffset_2(this._toFace()._ocShape, ocOffsetType, false); // isOpenResult
        }
        else 
        {
            // offset open Wire
            ocMakeOffset = new this._oc.BRepOffsetAPI_MakeOffset_3(this._ocShape, ocOffsetType, true); // isOpenResult
            isOpen = true;
        }
        
        ocMakeOffset.Perform(amount, 0); // Alt
        let offsetWire = (new Shape()._fromOcShape(ocMakeOffset.Shape())) as Wire;
        
        if (!offsetWire)
        {
            throw new Error('Wire::_offsetted: Offsetting failed. Check if the offset amount does not lead to self-intersection!')
        }

        // Test if -amount results in smaller Wire (only when its a open Wire)
        if(isOpen)
        {
            const growth = offsetWire.bbox().area() - this.bbox().area();
            if( (amount > 0 && growth < 0) || (amount < 0 && growth > 0) )
            { 
                ocMakeOffset.Perform(-amount, 0); // switch amount
                offsetWire = (new Shape()._fromOcShape(ocMakeOffset.Shape())) as Wire;
            }
        }

        offsetWire._unifyDomain();

        return offsetWire;
    }

    /** Offset Wire to create a new parallel Wire at given distance */
    @addResultShapesToScene
    @checkInput([[Number,WIRE_OFFSET_AMOUNT],[String, WIRE_OFFSET_TYPE], ['PointLike', null]], ['auto', 'auto', 'Vector'])
    offsetted(amount?:number, type?:string, onPlaneNormal?:PointLike):Wire
    {
        return this._offsetted(amount,type,onPlaneNormal);
    }

    /** Create a new version of current Wire that is parallel at a given distance */
    @checkInput([[Number,WIRE_OFFSET_AMOUNT],[String, WIRE_OFFSET_TYPE], ['PointLike',null]], ['auto', 'auto', 'Vector'])
    offset(amount?:number, type?:string, onPlaneNormal?:PointLike):Wire
    {
        let newWire = this._offsetted(amount, type, onPlaneNormal);
        this._fromOcWire(newWire._ocShape); // update Wire 
        return this;
    }

    /** Extrude a Wire while rotating around the center with a given angle (private: without adding to Scene) */
    @checkInput([[Number,100],[Number, 360],['PointLike', null],['PointLike',[0,0,1]],[Boolean,false]],['auto','auto', 'Point', 'Vector','auto'])
    _twistExtruded(amount?:number, angle?:number, pivot?:PointLike, direction?:PointLike, lefthand?:boolean):ISolid
    {
        /*
            OC docs:
            - BRepOffsetAPI_MakePipeShell: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_offset_a_p_i___make_pipe_shell.html#a31f07509cff6d5294d6c9e8dcfbf2145
        */
        let pivotPoint = (pivot) ? (pivot as Point) : this.center();
        let axisSpine = new Edge().makeLine(pivotPoint, pivotPoint.toVector().add((direction as Vector).normalized().scale(amount)))._toWire();
        let auxSpine = new Wire().makeHelix(1, amount, angle, pivotPoint, direction, lefthand);
        let ocExtrudeBuilder = new this._oc.BRepOffsetAPI_MakePipeShell(axisSpine._ocShape);
        ocExtrudeBuilder.SetMode_5(auxSpine._ocShape, false, this._oc.BRepFill_TypeOfContact.BRepFill_NoContact);
        ocExtrudeBuilder.Add_1(this._ocShape, false, false); // WithContact, WithCorrection
        ocExtrudeBuilder.Build(new this._oc.Message_ProgressRange_1());
        ocExtrudeBuilder.MakeSolid();
        let newOcSolid = ocExtrudeBuilder.Shape()   
        return new Shape()._fromOcShape(newOcSolid) as Solid;
    }

    @addResultShapesToScene
    @checkInput([[Number,100],[Number, 360],['PointLike', null],['PointLike',[0,0,1]],[Boolean,false]],['auto','auto', 'Point', 'Vector','auto'])
    twistExtruded(amount?:number, angle?:number, pivot?:PointLike, direction?:PointLike, lefthand?:boolean):ISolid
    {
        let newSolid = this._twistExtruded(amount,angle,pivot,direction,lefthand)
        return newSolid;
    }

    @checkInput([[Number,100],[Number, 360],['PointLike', null],['PointLike',[0,0,1]],[Boolean,false]],['auto','auto', 'Point', 'Vector','auto'])
    twistExtrude(amount?:number, angle?:number, pivot?:PointLike, direction?:PointLike, lefthand?:boolean):ISolid
    {
        let newSolid = this._twistExtruded(amount,angle,pivot,direction,lefthand)
        this.replaceShape(newSolid);
        return newSolid;
    }

    /** Create a new Wire by projecting this Wire onto another Shape
     *  either from one direction or concentric
     *  
     *  Returns a ShapeCollection with front and back groups
     * 
     *  TODO: When projecting on surface that has same dimensions as projecting Face results can wrong, 
     *          edges are added between front and back projection
     *  NOTE: Converted from code by Roger Maitland for CadQuery: https://github.com/CadQuery/cadquery/issues/562
     
     */
    @checkInput(['AnyShape', ['PointLike',null], ['PointLike', null]], ['auto','Vector', 'Vector'])
    _projectTo(other:AnyShape, direction:Vector, center?:Vector):ShapeCollection|null
    {
        if(['Vertex', 'Edge', 'Wire'].includes(other.type())){ throw new Error(`Wire._projectTo: Please supply a Face, Shell or Solid to project on!`);}
        // default direction: from center to center
        if(!direction)
        {
            direction = (other.center().distance(this.center()) > 0) ? other.center().toVector().subtract(this.center()).toVector() : null;
        }
    
        if(!direction && !center){ throw new Error(`Wire._projectTo: Please supply a PointLike for direction or center!`);}

        let onlyFront = false;
        // Face is OK, but we use a trick to convert to solid first by extruding away from projection and use front projection only
        if(other.type() === 'Face')
        {
            const extrudeVec = (other.center().distance(this.center()) > 0) ? other.center().toVector().subtracted(this.center()) : direction ?? null;
            if(extrudeVec)
            {
                other = other._extruded(10, extrudeVec )
                onlyFront = true;
            }
            else {
                console.warn('Wire::projectTo: You provided a Face to project on, could not extrude it with direction or distance Vector. Projection with fail!')
            }
        }

        const ocProj = (direction) 
                            ? new this._oc.BRepProj_Projection_1(this._ocShape, other._ocShape, direction._toOcDir())
                            : new this._oc.BRepProj_Projection_2(this._ocShape, other._ocShape, center._toOcPoint())
        
        const ocOrigOrientation = this._ocShape.Orientation_1();
        const projWires = [];

        while (ocProj.More())
        {
            const projOcWire = ocProj.Current()
            if(ocOrigOrientation !== projOcWire.Orientation_1())
            {
                projOcWire.Reverse();
            }
            projWires.push(new Wire()._fromOcShape(projOcWire));
            ocProj.Next()
        }

        const frontWires = [] as Array<Wire>;
        const backWires = [] as Array<Wire>;
        if (projWires.length > 1)
        {
            const projWireCenters = projWires.map(w => w.center().toVector())
            const projectionCenter = projWireCenters.reduce(
                    (v1,v2) => v1.added(v2), 
                    new Vector(0,0,0)).scaled(1/projWireCenters.length)
                
            const projWiresDirections:Array<Vector> = projWireCenters.map( c => projectionCenter.subtracted(c).normalized()); // Fixed from original code
            const directionNormalized:Vector = (direction) ? direction.normalized() : center.subtracted(projectionCenter).normalized();
            
            projWiresDirections.forEach((d,i) => 
            {
                if(d.dot(directionNormalized) > 0) // dot product > 0 means angle < 90
                {
                    frontWires.push(projWires[i]) 
                }
                else {
                    backWires.push(projWires[i])
                }
            })
        }
        else if (projWires.length === 1) 
        {
            frontWires.push(projWires[0]);
        }

        const c = new ShapeCollection().addGroup('front', frontWires);

        if(!onlyFront && backWires.length > 0){ c.addGroup('back', backWires) };
                        
        return (c.length > 0) ? c : null;
    }

    @addResultShapesToScene
    @checkInput(['AnyShape', ['PointLike',null], ['PointLike', null]], ['auto','Vector', 'Vector'])
    projectTo(other:AnyShape, direction:Vector, center:Vector):ShapeCollection|null
    {
        return this._projectTo(other,direction,center);
    }

    /** Aligning linear Shapes to each other so they form a connected Line */
    @checkInput(['LinearShape','LinearShapeTail'],['auto','auto'])
    alignTo(other:LinearShape, pivot:LinearShapeTail='start', alignment:LinearShapeTail='end'):Wire
    {
        let destVec = other[alignment]().toVector(); // either end() or start()
        let origVec = this[pivot]().toVector(); // either end() or start()

        return this.move(destVec.subtracted(origVec)) as Wire;
    }

    /** Fillet Wire at given Vertices or all */
    @protectOC('At least 2 Edges')
    @checkInput([[Number, WIRE_FILLET_RADIUS],['PointLikeOrVertexCollection',null]],['auto','VertexCollection'])
    fillet(radius?:number, vertices?:PointLikeOrVertexCollection )
    {
        /* IMPORTANT: Closing Wires to create Faces can quickly result in badly shaped Faces
            Especially when using it for local operations like fillet this will results in a lot of avoidable errors
            For example when closing Edge is parallel to another one (resulting in self-intersection)
            For filleting Wires we choose a different approach: converting every 2 Edges at fillet Vertex to triangle face
        */
        
        // check given vertices
        let filletVertices = vertices as VertexCollection;
        let allVertices = this.vertices();
        let allowedVertices = allVertices.shallowCopy().remove(this.start(), this.end()); // cannot do fillet at start and end Vertices
        let checkedVertices = new VertexCollection();
        
        if (filletVertices && filletVertices.length > 0)
        {
            filletVertices.forEach(v => 
            {
                if (allowedVertices.has(v))
                {
                    checkedVertices.add(v);
                }
                else {
                    let equalVertex = allowedVertices.find( fv => fv.equals(v)); // also try to get original Vertex or Face based on equal geometry
                    if (equalVertex)
                    {
                        console.warn(`Wire::fillet: Added fillet Vertex "${v} because it's equal to one of the Vertices of this Wire!`);
                        checkedVertices.add(equalVertex);
                    }
                    else {
                        console.warn(`Wire::fillet: Ignored one Vertex "${v} that is not in the Wire or is at start or end!`);
                    }
                }
            })
        }
        else {
            checkedVertices = allowedVertices as VertexCollection;
        }
        
        // we iterate all fillet Vertices, find neighboring Edges, make triangle Face, fillet and add to Edges of new Wire
        let origEdges = this.edges();
        let filletEdges = new ShapeCollection();

        allVertices.forEach( (vertex,i) =>
        {

            // let i = allVertices.toArray().indexOf(allVertices.find(v => vertex.equals(v))); // NOTE: Vertices instances could not be the same, so need to use equals
            
            let doFillet = !this.start().equals(vertex) && !this.end().equals(vertex) && checkedVertices.find( cv => cv.equals(vertex)) != null;

            if (doFillet)
            {
                // NOTE: vertex can not be at end or start
                let e1 = (filletEdges.length == 0) ? origEdges[i-1] : filletEdges.last(); 
                let e2 = origEdges[i] as Edge;
                
                if (e1.length() > 0 && e2.length() > 0 && (e1.edgeType() == 'Line' && !e1.direction().equals(e2.direction())))
                {
                    // make Face from 2 Edges and fillet
                    let triangleFace = new Wire().fromEdges(e1,e2)._toFace();
                    let closingEdge = triangleFace.edges().filter( e => !e.equals(e1) && !e.equals(e2) )[0];
                    let localFilletVertex = triangleFace.vertices().find(v => v.equals(vertex));
                    triangleFace.fillet(radius, localFilletVertex);
                    let newFilletEdges = triangleFace.edges().filter( e => !e.equals(closingEdge));
                    // remove last after fillet because that Edge changed
                    if (e1.equals(filletEdges.last()))
                    {
                        filletEdges.pop();
                    }
                    filletEdges.add(newFilletEdges);
                }
                else {
                    console.warn(`Wire::fillet: Skipped fillet Vertex at "${vertex}" because neighboring Edges are not suitable!`);
                }
            }
            else {
                // no fillet
                let noFilletEdges = new ShapeCollection();
                if(!this.start().equals(vertex))
                {
                    if(filletEdges.length == 0 )
                    {
                        noFilletEdges.add(origEdges[i-1]);
                    }
                }
                if(!this.end().equals(vertex))
                {
                    noFilletEdges.add(origEdges[i]);
                }
                
                filletEdges.add(noFilletEdges);
            }
        })
        
        let newWire = new Wire().fromEdges(filletEdges);
        this._fromOcWire(newWire._ocShape, false); 

        return this;
    }

    /** Fillet Wire at given Vertices or all */
    @protectOC('At least 2 Edges')
    @checkInput([[Number,WIRE_CHAMFER_DISTANCE],[Number,WIRE_CHAMFER_ANGLE],['PointLikeOrVertexCollection', null]],['auto','auto', 'VertexCollection', 'VertexCollection'])
    chamfer(distance?:number, angle?:number, vertices?:PointLikeOrVertexCollection )
    {
        // check given vertices
        let chamferVertices = vertices as VertexCollection;
        let allVertices = this.vertices()
        let allowedVertices = allVertices.shallowCopy().remove(this.start(), this.end()); // cannot do fillet at start and end Vertices
        let checkedVertices = new VertexCollection();
        
        if (chamferVertices && chamferVertices.length > 0)
        {
            chamferVertices.forEach(v => 
            {
                if (allowedVertices.has(v))
                {
                    checkedVertices.add(v);
                }
                else {
                    let equalVertex = allowedVertices.find( fv => fv.equals(v)); // also try to get original Vertex or Face based on equal geometry
                    if (equalVertex)
                    {
                        console.warn(`Wire::chamfer: Added chamfer Vertex "${v} because it's equal to one of the Vertices of this Wire!`);
                        checkedVertices.add(equalVertex);
                    }
                    else {
                        console.warn(`Wire::chamfer: Ignored one Vertex "${v} that is not in the Wire or is at start or end!`);
                    }
                }
            })
        }
        else {
            checkedVertices = allowedVertices as VertexCollection;
        }
        
        // we iterate all fillet Vertices, find neighboring Edges, make triangle Face, fillet and add to Edges of new Wire
        let origEdges = this.edges();
        let chamferEdges = new ShapeCollection();

        allVertices.forEach( vertex =>
        {

            let i = allVertices.toArray().indexOf(allVertices.find(v => vertex.equals(v))); // NOTE: Vertices instances could not be the same, so need to use equals
            
            let doFillet = !this.start().equals(vertex) && !this.end().equals(vertex) && checkedVertices.find( cv => cv.equals(vertex)) != null;

            if (doFillet)
            {
                // NOTE: vertex can not be at end or start
                let e1 = (chamferEdges.length == 0) ? origEdges[i-1] : chamferEdges.last(); 
                let e2 = origEdges[i] as Edge;
                
                if (e1.length() > 0 && e2.length() > 0 && (e1.edgeType() == 'Line' && !e1.direction().equals(e2.direction())))
                {
                    // make Face from 2 Edges and fillet
                    let triangleFace = new Wire().fromEdges(e1,e2)._toFace();
                    let closingEdge = triangleFace.edges().filter( e => !e.equals(e1) && !e.equals(e2) )[0];
                    let localFilletVertex = triangleFace.vertices().find(v => v.equals(vertex));
                    triangleFace.chamfer(distance, angle, localFilletVertex);
                    let newFilletEdges = triangleFace.edges().filter( e => !e.equals(closingEdge));
                    // remove last after fillet because that Edge changed
                    if (e1.equals(chamferEdges.last()))
                    {
                        chamferEdges.pop();
                    }
                    chamferEdges.add(newFilletEdges);
                }
                else {
                    console.warn(`Wire::chamfer: Skipped chamfer Vertex at "${vertex}" because neighboring Edges are not suitable!`);
                }
            }
            else {
                // no chamfer
                let noFilletEdges = new ShapeCollection();
                if(!this.start().equals(vertex))
                {
                    if(chamferEdges.length == 0 )
                    {
                        noFilletEdges.add(origEdges[i-1]);
                    }
                }
                if(!this.end().equals(vertex))
                {
                    noFilletEdges.add(origEdges[i]);
                }
                
                chamferEdges.add(noFilletEdges);
            }
        })
        
        let newWire = new Wire().fromEdges(chamferEdges);
        this._fromOcWire(newWire._ocShape, false); 

        return this;
    }

    //// CONTEXT PREDICATES ////

    @checkInput('LinearShape', 'auto')
    _intersectionsWithWire(other:Wire|Edge):ShapeCollection
    {
        // We use the intersection functions on Edges for now 
        let edges = this.edges();
        let otherEdges = (other instanceof Wire) ? other.edges() : [other as Edge];

        let intersections = { 'Vertex' : [], 'Edge' : [] }

        edges.forEach( e1 => 
            {
                otherEdges.forEach( e2 =>
                {
                   let intersectionShapes = e1._intersections(e2); // intersections return ShapeCollection or null

                   if (intersectionShapes != null)
                   {
                       // place in intersections lookup map
                       intersectionShapes.forEach( s => 
                       {
                           intersections[s.type()].push(s);
                       })
                   }

                });
            }
        );

        // we clean up Vertices that are the same as Vertices in the Edges
        // TODO: move these aggregations methods to ShapeCollection
        // NOTE: Can unique be used?
        let uniqueVerts = [];
        intersections['Vertex'].forEach(v => {
            let vertexPresent = false;
            for (let c = 0; c < intersections['Edge'].length; c++)
            {
                let e = intersections['Edge'][c];
                if (e.hasVertex(v))
                {
                    vertexPresent = true;
                    break;
                }
            }
            if (!vertexPresent)
            {
                // this Vertex is not in any Edge
                // to be sure: also test for doubles
                let inUniqueVerts = false;
                for (let c = 0; c < uniqueVerts.length; c++)
                {
                    let uniqueVert = uniqueVerts[c];
                    if (uniqueVert.equals(v)){
                        inUniqueVerts = true;
                        break;
                    }
                }
                if (!inUniqueVerts){
                    uniqueVerts.push(v);
                }
            }
        });
        intersections['Vertex'] = uniqueVerts;

        // we now have intersecting Vertices and Edges: we need to check if Edges together form a Wire
        let combinedWireAndEdgesCollection = new ShapeCollection(intersections['Edge']).upgrade(); // return a ShapeCollection and try to join Shapes into higher order ones
        // remove Shapes that are contained by others. So in this case Edges that are contained by the resulting Wire
        combinedWireAndEdgesCollection._removeContained();
        
        return new ShapeCollection(intersections['Vertex']).add(combinedWireAndEdgesCollection);
           
    }

    //// UTILS ////

    // TO BE FASED OUT
    _hasClosingEdges():boolean
    {
        let edgesCollection = this.edges(); 
        
        return this.start().equals(this.end())
    }

    //// OUTPUT ////
    
    /** Export entity and minimal data as string (used for outputting on console and hashing ) */
    toString():string
    {
        return `<Wire:${this.wireType()} numVertices="${this.vertices().length}" numEdges="${this.edges().length}">`;
    }

}
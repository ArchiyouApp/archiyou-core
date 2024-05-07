/** 
 * 
 *  Face.ts - A collection of Wires that form the (inner and outher) enclosure of a surface: together form a shell

 * 
 */

import { Vector, Point, Shape, Vertex, Edge, Wire, Face, Solid, ShapeCollection } from './internal'
import { PointLike, isCoordArray, isMakeShellInput, MakeShellInput, AnyShape, ThickenDirection, isThickenDirection, AnyShapeOrCollection, 
            isLinearShape, AnyShapeSequence, isAnyShapeSequence } from './internal' // types
import { checkInput, cacheOperation, addResultShapesToScene, protectOC } from './decorators'; // Direct import to avoid error in ts-node/jest

import { flattenEntities } from './internal' // utils

// this can disable TS errors when subclasses are not initialized yet
type ISolid = Solid

export class Shell extends Shape
{   
    
    /* 
    Inherited from Shape:
        + _ocShape
        + _ocId
    Inheritec from Obj
        + _position:Vector
        + _oc
    */

    constructor(entities?:any, ...args:Array<any>)
    {   
        super();

        if(entities == null)
        {
            //console.warn(`Shell::constructor: Empty Shell created!`)
        }
        else if(ShapeCollection.isShapeCollection(entities))
        {
            this.fromAll(entities);
        }
        else
        {
            let selectedEntities = (Array.isArray(entities) && !isCoordArray(entities)) ? (entities as Array<any>).concat(args) as Array<any>: [entities, ...args];
            selectedEntities = flattenEntities(selectedEntities); // NOTE: we could also use flattenEntitiesToArray            
            if(selectedEntities.length == 0)
            {
                console.warn(`Shell::constructor: Empty Shell created!`)
            }
            else {
                this.fromAll(selectedEntities);   
            }
        }
        
    }

    @checkInput('MakeShellInput', 'auto')
    fromAll(entities:MakeShellInput): Shell
    {
        let shapes = entities as ShapeCollection; // auto converted

        if (shapes.getShapesByType('Face').length >= 1)
        {
            const r = this.fromFaces(shapes); // Can return non-Shells - 
            return (r.type() === 'Shell')
                    ? r as Shell
                    : (r as ShapeCollection).filter(s => s.type() === 'Shell').first() as Shell
        }
        else if (shapes.getShapesByType('Edge').length >= 2)
        {
            return this.fromEdges(shapes);
        }
    }

    @checkInput('Face', 'auto')
    fromFace(face:Face):Shell
    {
        // BRep_Builder: https://dev.opencascade.org/doc/refman/html/class_b_rep___builder.html
        let ocBRepBuilder = new this._oc.BRep_Builder();
        let newOcShell = new this._oc.TopoDS_Shell();
        ocBRepBuilder.MakeShell(newOcShell);
        ocBRepBuilder.Add(newOcShell, face._ocShape); 
        return this._fromOcShell(newOcShell);
    }

    @checkInput(['MakeShellInput',[Boolean,false]], ['ShapeCollection', 'auto'])
    fromFaces(faces:MakeShellInput, forceShell?:boolean):Shell|AnyShapeOrCollection|null
    {
        let shapes = faces as ShapeCollection; // auto converted
        let facesCollection = shapes.getShapesByType('Face');

        if (facesCollection.length == 0)
        {
            console.error('Shell::fromAll: Could not create Shell, no Faces given. Empty Shell created!');
            return null; // NOTE: this will create an empty Shell
        }

        if (facesCollection.length == 1)
        {
            return this.fromFace(facesCollection.first() as Face);
        }

        let ocShellBuilder = new this._oc.BRepBuilderAPI_Sewing(1e-6, true, true, true, false);
        facesCollection.forEach( curFace => ocShellBuilder.Add(curFace._ocShape));
        ocShellBuilder.Perform( new this._oc.Message_ProgressRange_1());
        
        const ocSewResult = ocShellBuilder.SewedShape(); // Can be a single Shell or Compound
        
        if (ocSewResult.IsNull())
        {
            console.error(`Shell::fromFaces: Could not combine ${faces.length} Faces into Shell!`);
            return null;
        }
        else {
            // successfull sew
            console.log('==== FROM FACES ====');
            console.log(forceShell);

            const ocSewResultType = this._getShapeTypeFromOcShape(ocSewResult)
            if (ocSewResultType === 'Shell' || forceShell)
            {
                if(ocSewResultType !== 'Shell')
                {
                    console.warn(`Shell::fromFaces(): Combining Faces did not result in one Shell, but forceShell is set! a Bad Shell can be expected!`)
                }
                return this._fromOcShell(ocSewResult).checkAndFix() as Shell; // !!!! check and fix needed? !!!!
            }
            else {
                const nonShellShape = this._fromOcShape(ocSewResult) as AnyShapeOrCollection
                console.warn(`Shell::fromFaces(): Combining ${facesCollection.length} Faces resulted in result type "${nonShellShape.type()}"`)
                return nonShellShape;
            }
        }

    }

    /** Creates an Shell by interpolating between two (=Loft) or more Edges 
     *  Generally used in the context of filling but might be handy as seperate function */
    @checkInput('AnyShapeSequence', 'ShapeCollection')
    fromEdges(edges:AnyShapeSequence):Shell
    {
         /* OC Docs:
             - Filling: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep_fill___filling.html#details
             - ContrainedFilling: https://dev.opencascade.org/doc/refman/html/class_geom_fill___constrained_filling.html
             - SimpleBound: https://dev.opencascade.org/doc/refman/html/class_geom_fill___simple_bound.html
             - see example in docs: https://dev.opencascade.org/doc/overview/html/occt_user_guides__modeling_algos.html
         */
 
        let uncheckedEdges = edges as ShapeCollection; // auto converted
        let checkedEdges = uncheckedEdges.getShapesByType('Edge');

        if(checkedEdges.length == 0)
        {
            throw new Error(`Face::fromEdges: Please supply an array of Edges`);
        }
        else if (checkedEdges.length < 2)
        {
            throw new Error(`Face::fromEdges: Please supply an array of at least 2 Edges`);
        }
        else if (checkedEdges.length == 2)
        {
            // a lofted Face Surface
            let firstEdge = edges[0];
            let otherEdge = edges[1];
            let shellLoft = firstEdge._toWire().lofted(otherEdge, false); // Shell only ( can have only 1 Face)
            this._fromOcShell(shellLoft._ocShape);
            
            return this;
        }
        else if(checkedEdges.length > 4)
        {
            throw new Error(`Face::fromBoundaryEdges: Please supply an array of maximum 4 Edges`);
        }
        else {
            // create a ContrainedFilling out of 3 or 4 Edges
            let ocConstrainedFilling = new this._oc.GeomFill_ConstrainedFilling(180,100); // maxDeg, maxSeg

            let ocBoundaries = checkedEdges.toArray().map ( e => {
                let geomAdaptorCurve = (e as Edge)._toOcCurve().Curve();
                let handleAdaptor3dHCurve = geomAdaptorCurve.Trim(geomAdaptorCurve.FirstParameter(), geomAdaptorCurve.LastParameter(), 1e-3);
                let geomFillSimpleBound = new this._oc.GeomFill_SimpleBound( handleAdaptor3dHCurve , 1e-3, 1e-3); // Tol3d TolAng
                let handleGeomBound = new this._oc.Handle_GeomFill_Boundary_2(geomFillSimpleBound);

                return handleGeomBound
            });

            if(checkedEdges.length == 3 )
            {
                ocConstrainedFilling.Init_1(ocBoundaries[0], ocBoundaries[1], ocBoundaries[2], false); // noCheck
            }
            else {
                ocConstrainedFilling.Init_2(ocBoundaries[0], ocBoundaries[1], ocBoundaries[2], ocBoundaries[3], false); // noCheck
            }

            let ocSurfaceBspline = ocConstrainedFilling.Surface(); // Handle_Geom_BSplineSurface: https://dev.opencascade.org/doc/refman/html/class_geom___b_spline_surface.html

            // make Face/Shell from Surface
            let ocSurface = new this._oc.Handle_Geom_Surface_2(ocSurfaceBspline.get()); // NOTE: We can easily 'transform' inheritance chains with the Handle logic: To Handle_Geom_Surface_2
            let ocShell = new this._oc.BRepBuilderAPI_MakeShell_2(ocSurface, false).Shell();  // see: https://dev.opencascade.org/doc/refman/html/class_b_rep_builder_a_p_i___make_shell.html
            
            if(!ocShell)
            {
                console.error(`Shell::fromEdges: Could not make Shell`);
                return null;
            }

            let newShell = new Shape()._fromOcShape(ocShell).specific() as Shell;

            this._fromOcShell(newShell._ocShape);

            return this;

        }   
    }

    /** Create a Shell from a Wireframe of planar Edges or Wires 
     *  See: https://old.opencascade.com/doc/occt-7.5.0/overview/html/occt_user_guides__modeling_algos.html
     *  docs: https://dev.opencascade.org/doc/refman/html/class_b_o_p_algo___tools.html
    */
    @checkInput('AnyShapeOrCollection', 'ShapeCollection')
    fromWireFrame(wireframe:AnyShapeOrCollection):this
    {
        const ANG_TOL = 1e-3;

        const allEdges = new ShapeCollection();
        (wireframe as ShapeCollection) // auto converted by checkInput
            .filter( s => isLinearShape(s))
            .forEach( s => allEdges.add(s.edges()))
        
        const ocResultWires = new this._oc.TopoDS_Shape(); // Can be a compound!
        const wr = this._oc.BOPAlgo_Tools.EdgesToWires(
                                    allEdges.toOcCompound(),
                                    ocResultWires,
                                    false, // NOTE: for example 4 edges don't yield results if true. TODO: autodetect
                                    ANG_TOL // angular tolerance
                                )
        // Some errors
        if(wr === 1){ throw new Error(`Shell::fromWireFrame: No edges found in input!`); }
        if(wr === 2){ throw new Error(`Shell::fromWireFrame: Could not combine edges!`); }

        const resultFaces = new this._oc.TopoDS_Shape();
        const fr = this._oc.BOPAlgo_Tools.WiresToFaces(ocResultWires, resultFaces, ANG_TOL);

        if(!fr)
        { 
            // Some effort to still get some Faces from Wires. Might work for simple Wireframes
            const resWires = new ShapeCollection(new Shape()._fromOcShape(ocResultWires))
                                .filter( w => w.edges().length > 2) // Filter wires that can not be closed for robustness
            
            const faces = resWires.map( w => (w as Wire)._toFace()).filter( w => w)
                
            if (faces.length > 0)
            {  
                this.fromFaces(faces) 
                return this;
            }
            else {
                throw new Error(`Shell::fromWireFrame: Could not get any Faces from Wires!`)
            }

        }
        const faces = new ShapeCollection(new Shape()._extractShapesFromOcCompound(resultFaces)); // one of more faces
        this.fromFaces(faces);
        
        return this;
    }


    _fromOcShell(ocShell:any):Shell // TODO: OC typing
    {
        if (ocShell && (ocShell instanceof this._oc.TopoDS_Shell || ocShell instanceof this._oc.TopoDS_Shape) && !ocShell.IsNull())
        {
            // For easy debug, always make sure the wrapped OC Shape is TopoDS_Shell
            ocShell = this._makeSpecificOcShape(ocShell, 'Shell');
            this._ocShape = ocShell;
            this._ocId = this._hashcode();
            this.round(); // round to tolerance

            return this;
        }
        else {
            throw new Error(`Shell::_fromOcShell: Incoming ocShape is not a TopoDS_Shell! Check not null, OC Shape type and if empty`);
        }
    }

    //// TRANSFORMATIONS ////

    /** Get the outer Wire of Shell (private) */
    _toWire():Wire
    {
        return this.outerWire();    
    }

    /** Get the outer Wire of Shell */
    @addResultShapesToScene
    toWire():Wire
    {
        return this._toWire();
    }

    /** Returns the first Face. Handy for one Face Shells (private) */
    _toFace():Face
    {
        return this.faces()[0];
    }

    @addResultShapesToScene
    toFace():Face
    {
        return this._toFace();
    }

    _toSolid():ISolid
    {
        return new Solid().fromShell(this);
    }

    @addResultShapesToScene
    toSolid():ISolid
    {
        return new Solid().fromShell(this);
    }

    _setToOc()
    {
        // we only direct OC creation methods
    }

    ocGeom():any 
    {
        /** This returns the most specified subclass of Shape */
        let s = this._makeSpecificOcShape(this._ocShape, 'Shell');
        return s;
    }

    _ocGeom():any 
    {
        this._ocShape;
    }

    //// COMPUTED PROPERTIES ////

    /** Get outer Wire of this Shell  */
    outerWire():Wire
    {
        // Shell is only one Face, then the ShapeAnalysis tool does not work. Revert back to the one on Face
        if(this.faces().length == 1)
        {
            return this.faces()[0].outerWire();
        }
        else {
            let ocAnalysor = new this._oc.ShapeAnalysis_FreeBounds_2(this._ocShape, 1e-3, false, true);
            let ocOuterWire = ocAnalysor.GetClosedWires(); // gives back a Compound of outerwires, but _fromOcShape will make this into one Wire
        
            const wires = new Shape()._fromOcShape(ocOuterWire);
            // Make sure we get one closed Wire
            return (ShapeCollection.isShapeCollection(wires)) 
                    ? (wires as ShapeCollection).filter(w => w.closed()).sort((a,b) => b.length - a.length).first() as Wire 
                    : wires as Wire;
        }
    }
    
    /** Calculated center of Surface (not middle!) */
    center():Point
    {
        /** OC docs: 
         *      - GProps_GProps: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_g_prop___g_props.html 
         *      - BRepGProp: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep_g_prop.html#abd91b892df8d0f6b8571deed5562ca1f
         * */

        let ocProps = new this._oc.GProp_GProps_1();
        let BRepGProp = this._oc.BRepGProp.prototype.constructor;
        
        BRepGProp.SurfaceProperties_1(this._ocShape, ocProps, false, false);

        return new Point()._fromOcPoint(ocProps.CentreOfMass());
        
    }

    is2DXY(): boolean 
    {
        return this.vertices().every(v => (v as Vertex).z <= this._oc.SHAPE_TOLERANCE)
    }

    // !!!! TODO !!!!
    normal():Vector
    {
        console.warn('Shell::normal: Not implemented yet! Using method on first Face!');
        return (this.faces().first() as Face).normal(); // NOTE: Don't use center because it might not be on the Shell
    }

    /** Get normal at a given Point on the surface */
    // !!!! TODO !!!!
    normalAt(point:Point):Vector
    {
        console.warn('Shell::normalAt: Not implemented yet! Use method on first Face!');
        return (this.faces().first() as Face).normalAt(point);
    }

    //// OPERATIONS ON SHELL ////

    /*
        Shape._offsetted
        Shape.offset
        Shape.offsetted
    */ 

    /** Thicken the shell to create a Solid (private: without adding to Scene) */
    @checkInput([Number,'ThickenDirection'],['auto','auto'])
    _thickened(amount:number, direction:ThickenDirection):ISolid
    {   
        /*
        *  NOTE: OC changing: we might need to update here. Looks like this will be direct functions without constructor
        *  OC docs: 
        *   - https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_offset_a_p_i___make_offset_shape.html
        *   - https://dev.opencascade.org/doc/occt-7.5.0/refman/html/_b_rep_offset___mode_8hxx.html#a660437f6c00ce59d43e4a930fba2f84c
        */

        // NOTE: same API as thickened everywhere else!
        // NOTE: amount - or + does not really matter

        // special default case: centered thickening
        if(direction == 'center' || direction == null)
        {
            let oneSideShell = this._offsetted(amount/2);
            let otherSideShell = this._offsetted(-amount/2);

            let newSolid = (oneSideShell as Shell)._bridge(otherSideShell as Shell);

            return newSolid;
        }
        else {
            // we got a direction indication: either a string or real Point
            let directionPosition:Point;

            if (typeof direction == 'string')
            {   
                // direction indications using the bbox indication              
                let percXYZ = this._alignStringToAlignPerc(direction);
                let bbox = this.bbox().enlarged(10); // make a bigger bbox just to avoid zero dimensions for horizontal/vertical lines
                directionPosition = bbox.getPositionAtPerc(percXYZ[0], percXYZ[1], percXYZ[2]);
            }
            else {
                directionPosition = new Vector().fromAll(direction);
            }

            // we got a direction to thicken to
            let oneSideSolid = this._bridgeThickened(amount);
            let otherSideSolid = this._bridgeThickened(-amount);

            let d1 = directionPosition._toVertex().distance(oneSideSolid.center()._toVertex());
            let d2 = directionPosition._toVertex().distance(otherSideSolid.center()._toVertex());

            if(d1 <= d2)
            {
                return oneSideSolid;
            }
            else {
                return otherSideSolid;
            }
        }
    }

    /** Thicken the shell to create a Solid (private: without adding to Scene) */
    @checkInput([Number,'ThickenDirection'],['auto','auto'])
    thickened(amount:number, direction:ThickenDirection):ISolid
    {
        return this._thickened(amount,direction);
    }

    /** Private method that is used by thickened */
    @checkInput(Number, 'auto')
    _bridgeThickened(amount:number):ISolid
    {        
        let result = this._offsetted(amount);

        // !!!! OC does not produce Solids with this algorithm. CadQuery uses BRepOffset_MakeOffset() which is not available in opencascade.js
        // This is a workaround by finding two outerwires for the original shell and offsetted shell, then create extra Shell for sides by lofting the two outer wires
        if (result.type() == 'Shell')
        {
            // We get an offset Shell in the result
            let newSolid = this._bridge(result as Shell);
            return newSolid;
        }
        else {
            console.error(`Shell:thickened: Offsetted failed in thicken operation. Check validity of given Shell!`);
            return null;
        }
            
    }

    /** Stitch two Shells together to create a Solid (EXPERIMENTAL) */
    @protectOC([`This is an experimental method. Might not work!`])
    @checkInput(Shell, 'auto')
    _bridge(other:Shell):ISolid
    {
        let offsetShellWire = (other as Shell).outerWire();
        let originaShellWire = this.outerWire();
        let sideShell = originaShellWire._lofted(offsetShellWire, false) as Shell;
        let newSolid = new Solid().fromShells(new ShapeCollection(this, other as Shell,sideShell));
        return newSolid;
    }

    //// OUTPUT ////
    
    /** Export entity and minimal data as string (used for outputting on console and hashing ) */
    toString():string
    {
        return `<Shell numFaces="${this.faces().length}">`;
    }

}
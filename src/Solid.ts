/** 
 * 
 *  Face.ts - A collection of Wires that form the (inner and outher) enclosure of a surface: together form a shell

 * 
 */

import { SOLID_MAKEBOX_SIZE, SOLID_MAKESPHERE_RADIUS, SOLID_MAKESPHERE_ANGLE, SOLID_MAKECONE_BOTTOM_RADIUS, SOLID_MAKECONE_TOP_RADIUS,
    SOLID_MAKECONE_HEIGHT, SOLID_CYLINDER_RADIUS, SOLID_CYLINDER_HEIGHT, SOLID_CYLINDER_ANGLE, SOLID_FILLET_RADIUS, SOLID_CHAMFER_DISTANCE,
    SOLID_THICKEN_AMOUNT, SOLID_THICKEN_DIRECTION } from './internal'
import { Vector, Point, Shape, Vertex, Edge, Wire, Face, Shell, ShapeCollection } from './internal'
import { cacheOperation } from './internal'; // decorators
import { toRad } from './internal';
import { AnyShapeSequence, AnyShapeOrCollection, PointLike, isPointLike, AnyShape, isThickenDirection, ThickenDirection } from './internal';
import { addResultShapesToScene, checkInput, protectOC } from './decorators'; //  Direct import to avoid error in ts-node/jest
import { MakeSolidInput, isMakeSolidInput, AnyShapeOrCollectionOrSelectionString, isSelectionString, SelectionString } from './internal'; // types

export class Solid extends Shape
{   
    
    /* 
    Inherited from Shape:
    + _ocShape
    + _ocId
    Inheritec from Obj
    + _position:Vector
    + _oc
    */

    constructor(o?:any, ...args)
    {   
        super();

        if (o){
            this.fromAll(o,...args);
        }
    }

    @checkInput(isMakeSolidInput, ShapeCollection)
    fromAll(shells:MakeSolidInput, ...args):Solid // args are used in decorator to create ShapeCollection
    {   
        let shapes = shells as ShapeCollection; // auto converted
        let checkedShells = shapes.getShapesByType('Shell');

        if (checkedShells.length == 0)
        {
            console.error('Solid::fromAll: Cannot make Solid without Shells! Empty Solid created!');
            return null;
        }
        else if (checkedShells.length == 1)
        {
            return this.fromShell(checkedShells.first() as Shell)
        }
        else if (checkedShells.length > 1)
        {
            return this.fromShells(checkedShells);
        }
    }

    /** Created an solid out of closed Shell */
    @checkInput(Shell, 'auto')
    fromShell(shell: Shell) 
    {
        let ocSolid = new this._oc.ShapeFix_Solid_1().SolidFromShell(shell._ocShape);

        return this._fromOcShape(ocSolid) as Solid;
    }

    /** Create Solid by sewing multiple Shells */
    @checkInput('AnyShapeOrCollection', 'ShapeCollection')
    fromShells(shells:AnyShapeOrCollection):Solid
    {
        // We need to sew the Shells together to create a valid Solid
        let ocSew = new this._oc.BRepBuilderAPI_Sewing(1e-6, true, true, true, true);
        (shells as ShapeCollection).forEach( curShell => {
            if(curShell.type() == 'Shell')
            {
                ocSew.Add(curShell._ocShape);
            }
        });
            
        ocSew.Perform( new this._oc.Message_ProgressRange_1());
        let ocSewedShapeOrCompound = ocSew.SewedShape();

        if( ocSewedShapeOrCompound.ShapeType() == 0) // Compound
        {
            console.warn(`Solid::fromShells: Sew failed: we still got multiple Shapes (probably Shells). Output will be ShapeCollection!`);
        }

        let ocSolidBuilder = new this._oc.BRepBuilderAPI_MakeSolid_1();
        let ocShapeShells = this._getOcShapesByType(ocSewedShapeOrCompound, 'Shell');
        ocShapeShells.forEach( ocShell => 
        {
            // add to Solid
            ocSolidBuilder.Add(ocShell);
        });

        let ocSolid = ocSolidBuilder.Solid();

        let finalSolid = new Shape()._fromOcShape(ocSolid) as Solid;
        
        if(finalSolid.valid())
        {
            console.geom(`Solid::fromShell: Succesfully created a Solid out of ${shells.length} Shells!`);
            return finalSolid;
        }
        else 
        {
            console.warn(`Solid::fromShell: We created a Solid out of ${shells.length} Shells but validation was not succesfull. Be careful with this Solid!`);
            return null;
        }
        
    }

    _fromOcSolid(ocSolid:any, fix:boolean=true):Solid // TODO: TS typing
    {
        if (ocSolid && (ocSolid instanceof this._oc.TopoDS_Solid || ocSolid instanceof this._oc.TopoDS_Shape) && !ocSolid.IsNull())
        {
            // For easy debug, always make sure the wrapped OC Shape is TopoDS_Solid
            ocSolid = this._makeSpecificOcShape(ocSolid, 'Solid');
                
            // NOTE: orientation is set to FORWARD automatically
            this._ocShape = ocSolid;
            this._ocId = this._hashcode();

            if(fix)
            {
                this._fix();
            }
            return this;
        }
        else {
            throw new Error(`Solid::_fromOcSolid: Could not make a valid Solid. Check if not null, is the right OC Shape and is not null!`)
        }
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


    //// MAKE SPECIFIC SOLIDS ////

    /** Creates a box of size given by width, depth and height and position */
    @cacheOperation
    @checkInput([ [Number,SOLID_MAKEBOX_SIZE],[Number,null], [Number, null],['PointLike',[0,0,0]] ], ['auto', 'auto','auto', 'Point']) // this automatically transforms Types
    makeBox(width?:number, depth?:number, height?:number, position?:PointLike):Solid
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_prim_a_p_i___make_box.html
        // NOTE: dropped Box(10) because of the structure with decorators now
        depth = depth || width;
        height = height || width;

        let ocBox = new this._oc.BRepPrimAPI_MakeBox_2( width, depth, height).Shape();
        this._fromOcSolid(ocBox);

        // translate
        let centerVec = new Vector(width/2, depth/2, height/2);
        this.move( (position as Point).toVector().subtracted(centerVec));

        return this;
    }

    /** Creates a Box by giving two extreme points ( not the same, and not on the same axis ) */
    @cacheOperation
    @checkInput(['PointLike', 'PointLike'], ['Point','Point'] ) // this automatically transforms Types
    makeBoxBetween(from:PointLike, to:PointLike): Solid
    {
        let fromP = from as Point; // auto converted by checkInput
        let toP = to as Point;
        
        if (fromP.x == toP.x || fromP.y == toP.y || fromP.z == toP.z )
        {
            console.warn(`Solid::makeBoxBetween: Failed to create a Box. Please supply two seperate Points (${fromP} and ${toP}) that are not coplanar! Use Rect for 2D! Returned null!`);
            return null;
        }
        
        const ocBox = new this._oc.BRepPrimAPI_MakeBox_4( fromP._toOcPoint(), toP._toOcPoint() ).Shape();
        this._fromOcSolid(ocBox);

        return this;
    }  

    /** Creates a Sphere Solid */
    @cacheOperation   
    @checkInput([ [Number,SOLID_MAKESPHERE_RADIUS],['PointLike',[0,0,0]],[Number,SOLID_MAKESPHERE_ANGLE]], ['auto', 'Point', 'auto']) // this automatically transforms Types
    makeSphere( radius?:number, position?:PointLike, angle?:number): Solid
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_prim___sphere.html
        let angleRad = toRad(angle);
        let ocSphere = (new this._oc.BRepPrimAPI_MakeSphere_6((position as Point)._toOcPoint(), radius, angleRad)).Shape();
        this._fromOcSolid(ocSphere);
        
        return this;
    }
    
    /** Creates a Cone Solid */
    @cacheOperation
    @checkInput([ [Number,SOLID_MAKECONE_BOTTOM_RADIUS],[Number, SOLID_MAKECONE_TOP_RADIUS],[Number, SOLID_MAKECONE_HEIGHT],['PointLike', [0,0,0]]], 
                ['auto','auto','auto', Point, 'auto'])
    makeCone( bottomRadius?:number, topRadius?:number, height?:number, position?:PointLike, angle?:number):Solid
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_prim_a_p_i___make_cone.html#afd899db3f2bc7e2b570305678ba8b40b
        let angleRad = toRad(angle);
        let ocCone = (new this._oc.BRepPrimAPI_MakeCone_2( bottomRadius, topRadius, height, angleRad)).Shape();
        
        this._fromOcSolid(ocCone);
        this.move(position as Point); // auto converted to Point

        return this
    }

    /** Creates a Cylinder with a given radius, height and position */
    @cacheOperation
    @checkInput([ [Number, SOLID_CYLINDER_RADIUS], [Number,SOLID_CYLINDER_HEIGHT], ['PointLike', [0,0,0]], [Number, SOLID_CYLINDER_ANGLE]],
            ['auto','auto','Point','auto']
        ) // TODO: these long parameter sequences are good candidates for using input models
    makeCylinder(radius?:number, height?:number, position?:PointLike, angle?:number):Solid
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_prim_a_p_i___make_cylinder.html
        let angleRad = toRad(angle);
        let ocCone = (new this._oc.BRepPrimAPI_MakeCylinder_2( radius, height, angleRad )).Shape();

        this._fromOcSolid(ocCone);
        this.move(position as Point) as Solid;

        return this
    }


    //// CALCULATED PROPERTIES ////

    /** Determine if Solid is a primitive type */
    solidType():string
    {   
        // Box
        if ( this.faces().length == 6 && this.faces().every(f => (f as Face).orthogonal())){ return 'Box' }
        // Sphere
        else if ( this.edges().length == 3 && this.edges().find( e => e.edgeType() == 'Circle')){ return 'Sphere' } // Sphere has actually 3 Edges with one of them a Circle
        // Cylinder
        else if ( this.edges().filter( e => e.edgeType() == 'Circle').length == 2 && this.faces().length == 3 ){ return 'Cylinder' }
        // Cone
        else if ( this.edges().filter( e => e.edgeType() == 'Circle').length == 1 && this.faces().length == 2 ){ return 'Cone' }
        // TODO: more
    }

    /** Get center of mass of Solid */
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

    /** Is 2D and on XY plane */
    is2DXY(): boolean 
    {
        // NOTE: Solids can not be 2D by definition
        return false
    }

    //// OPERATIONS ON SHAPE ////

    _fix():Solid
    {
        let ocSolid = this._makeSpecificOcShape(this._ocShape);
        let ocShapeFix = new this._oc.ShapeFix_Solid_2(ocSolid);
        ocShapeFix.SetPrecision(this._oc.SHAPE_TOLERANCE); // does not seem to work
        ocShapeFix.SetMaxTolerance(this._oc.SHAPE_TOLERANCE);
        ocShapeFix.SetMinTolerance(this._oc.SHAPE_TOLERANCE);

        ocShapeFix.Perform(new this._oc.Message_ProgressRange_1());
        let fixedOcSolid = this._makeSpecificOcShape(ocShapeFix.Shape()); // make sure it is a TopoDS_Solid 
        this._fromOcSolid(fixedOcSolid, false); // avoid infinite loops by avoiding fix
        return this;
    }

    _fixReversedFaces():Solid
    {   
        // !!!! NOT WORKING !!!!
        /*  OC docs:
            - https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_tools___re_shape.html
            - 
        */
        let ocReShape = new this._oc.BRepTools_ReShape();

        this.faces().forEach( face => {
            if( face._ocShape.Orientation_1() === this._oc.TopAbs_Orientation.TopAbs_REVERSED )
            {
                let newOcFace = face._ocShape.Complemented();
                ocReShape.Replace(face._ocShape, newOcFace);
            }
        })
        let newOcSolid = ocReShape.Apply(this._ocShape, this._oc.TopAbs_ShapeEnum.TopAbs_FACE );
        
        this._fromOcShape(newOcSolid); // Replace current with new Solid

        return this;
    }

    /** Give the Solid rounded corners at its Edges with a given radius */
    @protectOC(['Fillet size cannot be bigger then length of filleted Edge'])
    @checkInput([[Number,SOLID_FILLET_RADIUS], ['AnyShapeOrCollectionOrSelectionString',null]], ['auto','auto'])
    fillet(radius?:number, edges?:AnyShapeOrCollectionOrSelectionString):Solid
    {
        /* OC Docs: 
            - https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_fillet_a_p_i___make_fillet.html
            - https://dev.opencascade.org/doc/occt-7.5.0/refman/html/_ch_fi3d___fillet_shape_8hxx.html#a67d35e4ad580d2f3924c79d007e9a39aa8b47d35de13ac07a245aa220cd335d6d
            
            NOTE: interesting custom Shapes possible as fillet
        */

        // make an effort to check and include Edges
        let filletEdges = new ShapeCollection();
        let solidEdges = this.edges();

        if (edges === null)
        {
            filletEdges = solidEdges; // all
        }
        else if(isSelectionString(edges))
        {
            let selectionString = edges as SelectionString;

            let selectedShapes = new ShapeCollection(this.select(selectionString)); // select might return Shape or ShapeCollection
            if (selectedShapes == null)
            {
                throw new Error(`Solid::fillet: ERROR\n Could not get any Shapes with selection string: ${selectionString}!`)
            }
            else {
                // we got some Shapes
                // if Vertices we need to convert to Edges
                if(selectedShapes.every(shape => shape.type() === 'Vertex'))
                {
                    filletEdges = this._intersections(selectedShapes);
                }
                else {
                    filletEdges = selectedShapes.getSubShapes('Edge');
                }
            }
        }
        else {
            // just a collection
            filletEdges = new ShapeCollection(edges);
        }

        // now check
        let checkedFilletEdges = new ShapeCollection();

        filletEdges.forEach(shape =>
        {
            let shapeType = shape.type();
            if (shapeType == 'Edge')
            {
                checkedFilletEdges.add(shape as Edge);
            }
            else if (['Face','Shell','Solid'].includes(shapeType))
            {
                checkedFilletEdges.add(shape.edges());
            }
            else if (shapeType == 'Vertex')
            {
                // even make Vertex work
                let intersectingEdges = solidEdges.intersecting(shape as Vertex);
                if (intersectingEdges.length > 0)
                {
                    checkedFilletEdges.add(intersectingEdges);
                }
            }
        })
        checkedFilletEdges = checkedFilletEdges.unique(); // filter out double geometries

        let checkedOfShapeFilletEdges = new ShapeCollection();
        
        // make sure all edges are directly actually part of Solid or equal (in that case convert to the Edge of Solid)
        checkedFilletEdges.forEach(edge => 
        {
            if (solidEdges.has(edge))
            {
                checkedOfShapeFilletEdges.add(edge)
            }
            else {
                let equalEdges = solidEdges.getEquals(edge)
                if(equalEdges.length > 0)
                {
                    checkedOfShapeFilletEdges.add(equalEdges.first());
                }
                else {
                    console.warn(`Skipped edge ${edge} that is not part of Solid or equal to a Edge in it!`)
                }
            } 
        });

        checkedOfShapeFilletEdges = checkedOfShapeFilletEdges.unique(); // again make sure we don't get doubles
        if (checkedOfShapeFilletEdges.length == 0)
        {
            throw new Error(`Solid::fillet: ERROR\nCould not get any valid Edges for filleting. Check given edges!`)
        }
        
        let ocMakeFillet = new this._oc.BRepFilletAPI_MakeFillet(this._ocShape, this._oc.ChFi3d_FilletShape.ChFi3d_Rational );
        checkedOfShapeFilletEdges.forEach( edge => ocMakeFillet.Add_2(radius, edge._ocShape) );
        ocMakeFillet.Build(new this._oc.Message_ProgressRange_1());
        if (ocMakeFillet.IsDone())
        {
            let ocShape = ocMakeFillet.Shape();
            let newSolid = this._fromOcShape(ocShape) as Solid; // automatically converts the returned Compound with only one Solid Shape to that Solid
            this._fromOcSolid(newSolid._ocShape); // replace old Solid with new one            
            
            return this;
        }
        else {
            throw new Error(`Solid::fillet: ERROR\nError generating filleted Solid. Check given Edge. Do the belong to Solid?`);
        }   
    }

    /** Alias for filleted but with making copy  */
    @checkInput([[Number,SOLID_FILLET_RADIUS], ['AnyShapeOrCollectionOrSelectionString',null]], ['auto','auto'])
    filleted(radius?:number, edges?:AnyShapeOrCollectionOrSelectionString):Solid
    {
        return (this.copy() as Solid).fillet(radius, edges);
    }

    /** Chamfer Solid at given Edges with given size */
    @checkInput([[Number, SOLID_CHAMFER_DISTANCE],['AnyShapeOrCollectionOrSelectionString',null]], ['auto','auto'])
    chamfer(distance?:number, edges?:AnyShapeOrCollectionOrSelectionString, ):Solid
    {
         /* OC Docs: 
            - https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_fillet_a_p_i___make_chamfer.html
        */
         // make an effort to check and include Edges
         let chamferEdges = new ShapeCollection();
         let solidEdges = this.edges();
 
         if (edges === null)
         {
            chamferEdges = solidEdges; // all
         }
         else if(isSelectionString(edges))
         {
             const selectionString = edges as SelectionString;
 
             let selectedShapes = new ShapeCollection(this.select(selectionString));
             if (selectedShapes == null)
             {
                 throw new Error(`Solid::chamfer: ERROR\n Could not get any Shapes with selection string: ${selectionString}!`)
             }
             else {
                 // we got some Shapes
                 // if Vertices we need to convert to Edges
                 if(selectedShapes.every(shape => shape.type() === 'Vertex'))
                 {
                    chamferEdges = this._intersections(selectedShapes);
                 }
                 else {
                    chamferEdges = selectedShapes.getSubShapes('Edge');
                 }
             }
         }
         else {
             // just a Shape or Collection
             chamferEdges = new ShapeCollection(edges);
         }
 
         // now check
         let checkedChamferEdges = new ShapeCollection();
 
         chamferEdges.forEach(shape =>
         {
             let shapeType = shape.type();
             if (shapeType == 'Edge')
             {
                checkedChamferEdges.add(shape as Edge);
             }
             else if (['Face','Shell','Solid'].includes(shapeType))
             {
                checkedChamferEdges.add(shape.edges());
             }
             else if (shapeType == 'Vertex')
             {
                 // even make Vertex work
                 let intersectingEdges = solidEdges.intersecting(shape as Vertex);
                 if (intersectingEdges.length > 0)
                 {
                    checkedChamferEdges.add(intersectingEdges);
                 }
             }
         })
         checkedChamferEdges = checkedChamferEdges.unique(); // filter out double geometries
 
         let checkedOfShapeChamferEdges = new ShapeCollection();
         
         // make sure all edges are directly actually part of Solid or equal (in that case convert to the Edge of Solid)
         checkedChamferEdges.forEach(edge => 
         {
             if (solidEdges.has(edge))
             {
                checkedOfShapeChamferEdges.add(edge)
             }
             else {
                 let equalEdges = solidEdges.getEquals(edge)
                 if(equalEdges.length > 0)
                 {
                    checkedOfShapeChamferEdges.add(equalEdges.first());
                 }
                 else {
                     console.warn(`Skipped edge ${edge} that is not part of Solid or equal to a Edge in it!`)
                 }
             } 
         });
 
         checkedOfShapeChamferEdges = checkedOfShapeChamferEdges.unique(); // again make sure we don't get doubles
         if (checkedOfShapeChamferEdges.length == 0)
         {
             throw new Error(`Solid::chamfer: ERROR\nCould not get any valid Edges for filleting. Check given edges!`)
         }
         
        let ocMakeChamfer = new this._oc.BRepFilletAPI_MakeChamfer(this._ocShape );
        checkedOfShapeChamferEdges.forEach( edge => ocMakeChamfer.Add_2(distance, edge._ocShape) );
        ocMakeChamfer.Build(new this._oc.Message_ProgressRange_1());
        if (ocMakeChamfer.IsDone())
        {
            let ocShape = ocMakeChamfer.Shape();
            let newSolid = this._fromOcShape(ocShape) as Solid; // automatically converts the returned Compound with only one Solid Shape to that Solid
            this._fromOcSolid(newSolid._ocShape); // replace old Solid with new one
            
            return this;
        }
        else {
            throw new Error(`Solid::chamfer: ERROR\n Error generating chamfered Solid`);
        }   

    }

    /** Same of chamfer but with a copied Shape */
    @checkInput([[Number, SOLID_CHAMFER_DISTANCE],['AnyShapeOrCollectionOrSelectionString',null]], ['auto','auto'])
    chamfered(distance?:number, edges?:AnyShapeOrCollectionOrSelectionString, ):Solid
    {
        return (this.copy() as Solid).chamfer(distance, edges);
    }

    /** Alias for chamfer */
    @checkInput([[Number, SOLID_CHAMFER_DISTANCE],'AnyShapeOrCollection'], ['auto','ShapeCollection'])
    bevel(distance?:number, edges?:AnyShapeOrCollection):Solid
    {
        return this.chamfer(distance, edges);
    }

    /** Alias for chamfered */
    @checkInput([[Number, SOLID_CHAMFER_DISTANCE],'AnyShapeOrCollection'], ['auto','ShapeCollection'])
    beveled(distance?:number, edges?:AnyShapeOrCollection):Solid
    {
        return this.chamfered(distance, edges);
    }

    /** Alias for shelled with same API as thicken in Wire/Edge and Shell */
    @checkInput([[Number,SOLID_THICKEN_AMOUNT],['ThickenDirection',SOLID_THICKEN_DIRECTION],['AnyShapeOrCollectionOrSelectionString', []] ], ['auto','auto'])
    thickened(amount?:number, direction?:ThickenDirection, excludeFaces?:AnyShapeOrCollectionOrSelectionString):Solid
    {   
        // TODO: implement thicken direction
        return this.shelled(amount, excludeFaces);
    }

    @checkInput([[Number,SOLID_THICKEN_AMOUNT],['ThickenDirection',SOLID_THICKEN_DIRECTION],['AnyShapeOrCollectionOrSelectionString', []] ], ['auto','auto'])
    thicken(amount:number, direction?:ThickenDirection, excludeFaces?:AnyShapeOrCollectionOrSelectionString):Solid
    {
        return this.shell(amount,excludeFaces);
    }

    //// COMPUTED PROPERTIES ////

    normalAt(point:Point):Vector
    {
        console.error('Solid::normalAt: Not yet implemented. Try to extract a specific Face!')
        return null;
    }

    /** Even for Volume we try to calculate length
     *  For now just the largest size of the bbox
     *  Works well for boxes, but not more complex
     */
    length():number
    {
        return [this.bbox().width(),this.bbox().height(), this.bbox().depth()].sort((a,b) => b -a )[0]
    }

    area():number
    {
        return this.faces().reduce( ( sum,f) => sum + f.area(), 0 )
    }

    //// OUTPUT ////
    
    /** Export entity and minimal data as string (used for outputting on console and hashing ) */
    toString():string
    {
        return `<Solid:${this.solidType()} numShells="${this.shells().length}">`;
    }

}
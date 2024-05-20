/** 
 * 
 *  Shape.ts - Defines a Shape in Archiyou (and Opencascade )
 *  Inherites very basic properties from Obj ( like name, id, position, rotation)
 *  Wraps all other shapes like: Vertex, Edge, Wire, Face, Shell, Solid, Compound Solid and Compound 
 *  We follow the inheritance from OC; Shape is main class, subclasses are Vertex, Edge etc that inherit the properties
 *  Subclasses overload the Shape interface methods (move,bbox,overlaps etc) and add some specific methods for accessing the geometry directly if needed
 * 
 *  OC lib TopoDS_Shape: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_topo_d_s___shape.html
 *  Creation of different Shapes: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep_builder_a_p_i___make_shape.html
 *  see https://github.com/CadQuery/cadquery/blob/master/cadquery/occ_impl/shapes.py:361 for inspiration
 */

import { MESHING_MAX_DEVIATION, MESHING_ANGULAR_DEFLECTION, MESHING_MINIMUM_POINTS, MESHING_TOLERANCE, MESHING_EDGE_MIN_LENGTH, 
            DEFAULT_WORKPLANE, SHAPE_ARRAY_DEFAULT_OFFSET, SHAPE_EXTRUDE_DEFAULT_AMOUNT, SHAPE_SWEEP_DEFAULT_SOLID,
            SHAPE_SWEEP_DEFAULT_AUTOROTATE, SHAPE_SCALE_DEFAULT_FACTOR, SHAPE_ALIGNMENT_DEFAULT, SHAPE_SHELL_AMOUNT, toSVGOptions} from './internal'

 import { AXIS_TO_VECS } from './internal'
import { isPointLike, SelectionString, isSelectionString, CoordArray, isAnyShape,isAnyShapeOrCollection,isColorInput,isPivot,isAxis,isMainAxis,isAnyShapeCollection, isPointLikeOrAnyShapeOrCollection,isLinearShape, isSide} from './internal' // types
import { PointLike,PointLikeOrAnyShape,Coord,AnyShape,AnyShapeOrCollection,ColorInput,Pivot,Axis,MainAxis,AnyShapeCollection,PointLikeOrAnyShapeOrCollection,LinearShape, ShapeType, Side } from './internal' // types
import { Obj, Vector, Point, Bbox, Vertex, Edge, Wire, Face, Shell, Solid, ShapeCollection } from './internal'

import { Link, Selection, SelectionShapeTargetSetting, SelectorSetting, SelectorPointRange, SelectorAxisCoord, SelectorBbox,SelectorIndex } from './internal' // InternalModels
import { ShapeAttributes, isShapeAttributes } from './internal' // attributes
import { ObjStyle } from './internal'
import { MeshShape, FaceMesh, EdgeMesh, VertexMesh } from './internal' // see: ExportModels
import { Selector } from './internal' // see: Selectors
import { toRad, isNumeric, roundToTolerance } from './internal' // utils
import { checkInput, addResultShapesToScene, protectOC } from './decorators'; // Import directly to avoid error in ts-node
import { Alignment, isAlignment, isShapeType, AnyShapeOrCollectionOrSelectionString, MeshingQualitySettings } from './internal'
import { Annotation, DimensionOptions, DimensionLine } from './internal'
import { Obbox, BeamLikeDims } from './internal'

// this can disable TS errors when subclasses are not initialized yet
type IVertex = Vertex
type IEdge = Edge
type ISolid = Solid
type IWire = Wire
type IDimensionLine = DimensionLine
 
export class Shape
{
    _oc:any; // avoids TS errors in filling CLASSNAME_TO_SHAPE_ENUM
    _geom:any;
    _obj:Obj; // Obj container this Shape belongs to
    _parent:Shape; // With selecting subshapes we keep the reference to parent    
    _ocShape:any = null; // instance of OC Shape subclass: Vertex, Edge, Wire etc. - NOTE: we have to set a value here: otherwise it will not be set 
    _ocId:string = null;
    _isTmp:boolean = false; // Flag to signify if a Shape is temporary (for example for construction)
    
    attributes:ShapeAttributes = {}; // data attributes that can be added to Shapes (NOT STYLING)
    annotations:Array<Annotation> = []; // array of annotations associated with this Shape

    //// SETTINGS ////
    CLASSNAME_TO_SHAPE_ENUM_STATIC: {[key:string]:string} =  {
        // NOTE: these will be really initialized if _oc is present!
        'Vertex' : 'TopAbs_VERTEX',
        'Edge' : 'TopAbs_EDGE',
        'Wire' : 'TopAbs_WIRE',
        'Face' : 'TopAbs_FACE',
        'Shell' : 'TopAbs_SHELL',
        'Solid' : 'TopAbs_SOLID',
        'CompSolid' : 'TopAbs_COMPSOLID',
        'Compound' : 'TopAbs_COMPOUND',
    };
    CLASSNAME_TO_SHAPE_ENUM: {[key:string]:any} = {}; // to be filled. 
    OC_SHAPE_ENUM_TO_CLASSNAME: {[key:string]:string} = {}; // set with CLASSNAME_TO_SHAPE_ENUM


    //// CREATION METHODS ////

    constructor()
    {
        this._setShapeEnumToClassName(); // Some groundwork        
    }

    /** Update _OcShape from Shape properties */
    _updateOcShape()
    {
        // override by different classes where needed, for example in Vertex
    }

    /** Update properties from current OC Shape */
    _updateFromOcShape(ocShape?:any) // TODO: TopoDS_Shape
    {
        // Can be overriden by subclass
    }

    /** Do an effort to create a Shape */
    fromAll(value:any):AnyShape
    {
        // Overrides by subclasses
        
        if (value === null || value === undefined)
        {
            return null;
        }
        // already a Shape
        if (Shape.isShape(value))
        {
            return value; // original Shape
        }
        else if (isPointLike(value))
        {
            return new Point(value as PointLike)._toVertex(); // Vertex
        }
        else if (value instanceof Bbox)
        {
            return (value as Bbox).box(); // Solid
        }
        else {
            console.warn(`_convertToShape: Could not convert "${value}" to a Shape! Returned null`);
        }
        
    }

    /** Class method for ease of use */
    static fromAll(value:any):AnyShape
    {
        return new Shape().fromAll(value);
    }

    //// MANAGING ATTRIBUTES ////

    attribute(key?:string, value?:any):any|AnyShape
    {
        // NOTE: this is an awkward repetition of these attributes (see typeguards): TODO: better
        const SHAPE_ATTRIBUTE_KEYS = ['hidden','outline', 'visible'];

        // getter
        if (typeof key === 'string' && value === undefined)
        {
            return this.attributes[key]
        }

        const attr = {};
        attr[key] = value;

        if(!key || value === undefined){ throw new Error(`Shape::attribute: Please use attribute(key:string,value) to set attribute!`) }
        if(!isShapeAttributes(attr)){ console.warn(`Shape::attribute: Unofficial attribute. Use any of these "${SHAPE_ATTRIBUTE_KEYS.join('", "')}", or know what you are doing!`) }

        this.attributes[key] = value;

        return this;
    }

    /** Alias for attribute() */
    attr(key?:string, value?:any):any|AnyShape
    {   
        return this.attribute(key, value);
    }

    /** Get attributes of Shape */
    attrs():ShapeAttributes
    {
        return this.attributes;
    }

    /** Copy attributes from other Shape */
    @checkInput('AnyShape', 'auto')
    _copyAttributes(from:Shape)
    {
        this.attributes = { ...from.attrs() }
    }

    //// CURSOR ////

    getCursor()
    {
        // This method is overloaded on subshape
        console.warn(`Shape::getCursor: **** NOT IMPLEMENTED **** Shape: "${this.type()}"`);
    }

    /** Check and fix Shape after operation: can get overloaded in subclasses */
    checkAndFix():AnyShape
    {
        // This is a very generic fixer algoritm
        // OC docs: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_shape_fix___shape.html
        // NOTE: this might be very slow: use only when really needed!
        
        try 
        {
            let ocFixer = new this._oc.ShapeFix_Shape_2(this._ocShape);
            ocFixer.Perform( new this._oc.Message_ProgressRange_1() );
            const ocShape = ocFixer.Shape();
            if (ocShape && !ocShape.IsNull())
            {
                // success
                this._ocShape = this._makeSpecificOcShape(ocFixer.Shape(), this.type());
            }
        }
        catch(e)
        {
            console.warn(`Shape::checkAndFix: Failed to check and fix Shape of type ${this.type()}: ${e}!`);
        }
        finally
        {
            return this;
        }
        
    }

    /** Unify Shapes that are lying on the same plane and can be combined */
    _unifyDomain():AnyShape
    {
        // OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_shape_upgrade___unify_same_domain.html
        let fusor = new this._oc.ShapeUpgrade_UnifySameDomain_2(this._ocShape, true, true, false); // unify edges, unify faces, concat bsplines
        fusor.Build();
        let fusedOcShape = new Shape()._fromOcShape(fusor.Shape()) as AnyShape;
        this._ocShape = fusedOcShape._ocShape;

        return this;
    }


    /** Make Shape from OC Shape if given, otherwise update properties based on current _ocShape */
    /* !!!! Important: This method is not consistent with _fromOcWire, _fromOcSolid etc because it does not affect original 
        So: this does NOT update current Shape with an Oc Shape. For now we do that manually in every operator
    */

    _fromOcShape(ocShape:any):AnyShapeOrCollection
    {
        ocShape = ocShape || this._ocShape;

        if (ocShape === null || ocShape?.IsNull())
        {
            console.error('Shape::_fromOcShape: No valid OC Shape given!')
            return null;
        }

        let shapeType = this._getShapeTypeFromOcShape(ocShape);
        
        let newShape:any;

        switch(shapeType)
        {
            // NOTE: We round every new Shape to the global tolerance - that's done in _fromOC<<TYPE>> methods
            case 'Vertex':
                newShape = new Vertex()._fromOcVertex(this._makeSpecificOcShape(ocShape, shapeType));
                break;
            case 'Edge':
                newShape = new Edge()._fromOcEdge(this._makeSpecificOcShape(ocShape, shapeType));
                break;
            case 'Wire':
                newShape = new Wire()._fromOcWire(this._makeSpecificOcShape(ocShape, shapeType));
                break;
            case 'Face':
                newShape = new Face()._fromOcFace(this._makeSpecificOcShape(ocShape, shapeType));
                break;
            case 'Shell':
                newShape = new Shell()._fromOcShell(this._makeSpecificOcShape(ocShape, shapeType));
                break;
            case 'Solid':
                newShape = new Solid()._fromOcSolid(this._makeSpecificOcShape(ocShape, shapeType));
                break;
            case 'Compound':
            case 'CompSolid':
                let shapeOrCollection = this._extractShapesFromOcCompound(ocShape);
                newShape = (ShapeCollection.isShapeCollection(shapeOrCollection)) ? (shapeOrCollection as ShapeCollection).collapse() : shapeOrCollection;
                break;
            default:
                console.warn(`Shape::_fromOcShape: Unknown OC Shape. Found type "${shapeType}"`);
                newShape = null;
        }

        // Removed: Check downgrade to avoid Shells with only one Face, or Wires with only one Edge
        // Too slow: apply checkDowngrade() after operations where it these kind of Shapes can be created
    
        return newShape;
    }

    //// OPERATIONS ON SHAPE AND RELATED OBJECT  ////

    /** For now we don't have a sense of a pivot and thus clear position of an object, we calculate its center 
        We can override this in the individual subclasses. 
        TODO: For example an position of a Wire is probably more intuitive as its start Vertex
    */
    position():Point
    {
        return this.center();
    }

    /** Attach obj to Shape for adding it to the scene and styling */
    object(forceNew:boolean=false):Obj
    {
        // don't make Obj if already exists
        if (!forceNew && this._obj)
        {
            return this._obj;
        }
        let obj = new Obj(this);
        this._obj = obj; // set Obj on Shape
        return this._obj;
    }

    /** Set color on the Object of this Shape */
    @checkInput('ColorInput', 'auto')
    color(value:string|number):this
    {
        this.object().color(value);
        return this;
    }

    /** Set dashed lines on the Object of this Shape */
    dashed():this
    {
        this.object().dashed();
        return this;
    }

    /** Set stroke width of lines of Shape */
    @checkInput(Number, 'auto')
    strokeWidth(n:number):this
    {
        this.object().strokeWidth(n);
        return this;
    }

    /** Get the color of this Shape as defined in its Obj container */
    getColor():number
    {
        return this?._obj?.getColor();
    }

    _getColorRGBA():[number,number,number,number]
    {
        return this?._obj?._getColorRGBA()
    }

    /** check if Shape is co-planar and return the normal of the workingplane if so! */
    workPlaneNormal():Vector
    {
        if (this.edges().length < 2 )
        {
            console.warn(`Shape::workPlanNormal:: This Shape has only 1 Edge or less, so it's not possible to determine a workplane!`);
            return null;
        }

        let allEdgesClosed = new Wire().fromEdges(this.edges()).close().edges();

        let prevEdgeVec = allEdgesClosed[0].direction();
        let prevNormal;
        let normal;
        for (let i = 1; i < allEdgesClosed.length - 1; i++)
        {
            try { // protect against cross products of same Vectors or zero length Vectors
                
                let nextEdgeVec = allEdgesClosed[i+1].direction();
                
                normal = prevEdgeVec.crossed(nextEdgeVec).normalized().round().abs();

                if(prevNormal)
                {
                    if (!normal.equals(prevNormal))
                    {
                        // immediately when a normal is not the same: quit - there is no clear workplane
                        return null;
                    }
                }

                prevNormal = normal;

            }
            catch(e){
                // TODO
            }
        }

        return normal;
    }

    /** 
     *   Some operations on Shape actually create new Shape types: For example Shape.intersections(other)
     *   To Updating those in place we use the Obj container of the Shape 
     */
    @checkInput('AnyShapeOrCollection', 'auto')
    replaceShape(newShapes:AnyShapeOrCollection):AnyShapeOrCollection
    {
        // if it's not in the Scene add it
        if(!this._obj)
        {
            this.addToScene();
        }

        this._obj._updateShapes(newShapes);

        return newShapes;
    }

    /** We can delete a Shape from the Scene by removing it's Obj container */
    removeFromScene()
    {
        if(this._obj)
        {
            this._geom.removeObj(this._obj);
        }
    }

    isEmpty():boolean
    {
        if (!this._ocShape){ return true };
        return this._ocShape.IsNull();
    }

    _setShapeEnumToClassName()
    {
        // see: http://jcae.sourceforge.net/occjava-doc/index.html?org/jcae/opencascade/jni/TopAbs_ShapeEnum.html
        
        // really initialize the values
        for ( const [ key,value] of Object.entries(this.CLASSNAME_TO_SHAPE_ENUM_STATIC))
        {
            this.CLASSNAME_TO_SHAPE_ENUM[key] = this._oc.TopAbs_ShapeEnum[value];
        }
        Object.entries(this.CLASSNAME_TO_SHAPE_ENUM).forEach(([className, ocShapeEnum]) => this.OC_SHAPE_ENUM_TO_CLASSNAME[ocShapeEnum.value as string] = className); // TS fix
    }

    //// TRANSFORMATION METHODS ////

    /** Convert Shape to Wire (private) */
    _toWire():IWire // Cannot use Wire because it's not initialized
    { 
        let wire:Wire;

        switch(this.type())
        {
            case 'Edge':
                wire = this._toWire();
                break;
            case 'Wire':
                wire = this as any as Wire; // avoid TS errors
                break;
            case 'Face':
                wire = this.wires()[0];
                break;
            default:
                console.warn(`Shape::lofted: Cannot convert to wire this Shape of type ${this.type()}`);
        }

        return wire;
    }
    
    /** Try to convert the current Shape to a Wire */
    @addResultShapesToScene
    toWire():IWire // Cannot use Wire because it's not initialized
    {
        return this._toWire() as Wire
    }

    //// COMPUTED PROPERTIES ////

    /**  To have consistent API between Shape and ShapeCollection instances */
    isShape(obj:any):boolean
    {
        return true; 
    }

    /**  To have consistent API between Shape and ShapeCollection instances */
    isShapeCollection():boolean
    {
        return false;
    }

    /* Test if a given object is a single Shape */
    static isShape(obj:any)
    {
        return (!obj) ? false : obj.hasOwnProperty('_ocShape');
    }

    /** Create hash for this Shape: can be used to check if an Shape is the same instance (NOTE: not that is has equal geometry!) */
    _hashcode():string
    {
        let h = (this._ocShape) ? this._ocShape.HashCode(2147483647) : null;
        return h;
    }

    ocGeom():any 
    {
        /** as implemented by subclass */
        return null;
    }
    
    type(): ShapeType
    {
        // fall back on name of Class: this might not be accurate: but better than nothing
        let type = (this._ocShape) ? 
                        this._shapeTypeEnumLookup(this._ocShape.ShapeType().value) : 
                        this.constructor.name;
        return type as ShapeType;
    }

    _getShapeTypeFromOcShape(ocShape:any):string // TODO: OC typing
    {
        if(!ocShape.ShapeType)
        {
            console.error(`Shape::_getShapeTypeFromOcShape: Please supply a ocShape!`);
            return null;
        }

        let shapeType:string = this._shapeTypeEnumLookup(ocShape.ShapeType().value) ;
        
        return shapeType;
    }

    /** Returns subType of current Shape: For example Edge::Line */
    subType(): string
    {        
        const SUBTYPE_METHOD_BY_TYPE = {
            'Edge' : 'edgeType', // methods of specific children of Shape, like Edges, Faces etc.
            'Wire' : 'wireType',
            'Face' : 'faceType',
            'Solid' : 'solidType',
        }

        let shapeType = this.type();
        if (!SUBTYPE_METHOD_BY_TYPE[shapeType])
        {
            console.error(`Shape::subType: Shape of type "${shapeType}" has not subType!`);
            return null;
        }
        else {
            let subTypeFunc = this[SUBTYPE_METHOD_BY_TYPE[shapeType]];
            if (subTypeFunc)
            {
                return this[SUBTYPE_METHOD_BY_TYPE[shapeType]](); // needs to be bounded on Shape
            }
            return null;   
        }
    }

    //// SPECIAL TYPES ////

    /** If Shape is beam-like */
    beamLike():boolean
    {
        if (this.type() !== 'Solid')
            return false;

        const obboxDims = this._getOBbox() as Obbox;
        const obbox = new Solid().makeBox(obboxDims.width, obboxDims.depth, obboxDims.height);
        return (this.volume() / obbox.volume() > 0.95) 
    }

    beamDims():BeamLikeDims
    {
        if(this.beamLike())
        {
            const bbox = this._getOBbox() as Obbox; // data of obbox() not Shape
            const dimsSorted = [bbox.width, bbox.height, bbox.depth].sort((a,b) => a - b )
            return {
                small : dimsSorted[0],
                mid : dimsSorted[1],
                length : dimsSorted[2],
            } as BeamLikeDims
        }

        return null;
    }

    /** is this Shape 2D */
    is2D():boolean
    {
        if (!this.isEmpty() && this.valid())
        {
            return this.bbox().is2D();
        }
        else {
            return null;
        }
        
    }

    /** is this Shape 2D on XY plane (used for SVG export for example) */
    is2DXY():boolean 
    {
        // will be overriden by specific classes if they can be 2D
        console.warn(`Shape::is2DXY(): Shape can not be 2D: "${this.type()}"`)
        return false;
    }

    /** Test if a Shape is valid */
    valid(ocShape?:any)
    {
        try {
            ocShape = ocShape || this._ocShape;
            let ocChecker = new this._oc.BRepCheck_Analyzer(ocShape, true, false);
            const result = ocChecker.IsValid_2();
            ocChecker.delete();
            return result;
        }
        catch (e)
        {
            return false;
        }
    }

    /** For compatibility with ShapeCollection */
    count():number
    {
        return 1;
    }

    /** Length of a Shape (depending on specific class) */
    length():number 
    {
        // overloaded by appropriate subclasses
        return null;
    }

    /** The top surface area of Shape - for example the area of a Box is the top part */
    area():number
    {
        /* OC docs:
            - https://dev.opencascade.org/doc/refman/html/class_g_prop___g_props.html
            - https://dev.opencascade.org/content/calculate-surface-and-volume-topodsshape
        */
        let ocSystem = new this._oc.GProp_GProps_1();
        this._oc.BRepGProp.SurfaceProperties_1(this._ocShape, ocSystem, false, false);
        return ocSystem.Mass(); 
    }

    /** The total surface Area of a Shape - for example the total surface area of Sphere is 4πr2 */
    surface():number
    {
        // overloaded by appropriate subclasses
        // NOTE: this distinction is not made in OC - area() gives all surface
        // - either select specific Faces or remove
        return null;
    }

    /** Calculate the volume of this Shape */ 
    volume():number
    {
        let ocSystem = new this._oc.GProp_GProps_1();
        this._oc.BRepGProp.VolumeProperties_1(this._ocShape, ocSystem, false, false, false);
        return ocSystem.Mass(); 
    }

    /** Get all Vertices of this Shape */
    vertices(): AnyShapeCollection
    {
        let vertices = new ShapeCollection();
        let shapeEdges = this.edges();  // test if this Shape has any Edges

        if (shapeEdges.length == 0)
        {
            vertices.add(this._getEntities("Vertex")); // This can result in different starting vertices
        }
        else 
        {
            // !!!! IMPORTANT: have beginning of sequence for vertices() and edges() the same! 
            let vertexPresent = {}; // hash
            shapeEdges.forEach( e =>
            {
                // always start with first
                if(vertices.length == 0)
                {
                    let sv = e.start();
                    vertices.add(sv);
                    vertexPresent[sv._hashcode()] = true;
                }

                let vertex = e.end();
                if (!vertexPresent[vertex._hashcode()])
                {
                    vertices.add(vertex);
                    vertexPresent[vertex._hashcode()] = true;
                }
            })
        }

        return vertices;
    }

    /** Get all Edges of this Shape */
    edges(): AnyShapeCollection
    {
        return this._getEntities("Edge");
    }

    /** Get all Wires of this Shape */
    wires():AnyShapeCollection
    {
        // TODO
        return this._getEntities("Wire");
    }

    /** Get all Faces of this Shape */
    faces():AnyShapeCollection
    {
        let faces = this._getEntities("Face");

        return faces;
    }

    /** Get all Shells of this Shape */
    shells():AnyShapeCollection
    {
        return this._getEntities("Shell");
    }

    /** Get all Solids of this Shape */
    solids():AnyShapeCollection
    {
        return this._getEntities("Solid");
    }
 
    /** Calculate and set Bounding Box of Shape  */
    bbox(withAnnotations:boolean=false):Bbox
    {
        // OC docs: https://dev.opencascade.org/doc/refman/html/class_b_rep_bnd_lib.html

        if(this._ocShape)
        {
            let newBbox = new Bbox();
            this._oc.BRepBndLib.AddOptimal(this._ocShape, newBbox._ocBbox, true, false); // useTriangulation, useShapeTolerance
            newBbox.updateFromOcBbox();
    
            if(withAnnotations && this.annotations.length > 0)
            {
                const annotationShapes = new ShapeCollection(this.annotations.map(a => a.toShape()));
                newBbox = newBbox.added(annotationShapes.bbox())
            }

            return newBbox;
        }
    }

    _getOBbox():Obbox
    {
        let ocOBbox = new this._oc.Bnd_OBB_1();
        this._oc.BRepBndLib.prototype.constructor.AddOBB(this._ocShape, ocOBbox, true, false, false); // useTriangulation, isOptimal, theIsShapeToleranceUsed
        
        let obbox:Obbox = { 
            center: new Point()._fromOcPoint(ocOBbox.Position().Location()),
            width: roundToTolerance(ocOBbox.XHSize())*2,
            depth: roundToTolerance(ocOBbox.YHSize())*2,
            height: roundToTolerance(ocOBbox.ZHSize())*2,
            xDirection: new Point()._fromOcXYZ(ocOBbox.XDirection()).toVector(),
            yDirection: new Point()._fromOcXYZ(ocOBbox.YDirection()).toVector(),
            zDirection: new Point()._fromOcXYZ(ocOBbox.ZDirection()).toVector(),
        }

        return obbox;
    }

    /** Calculate Orientated Bounding Box of Shape (returning a Solid or Face) 
     *  NOT YET IMPLEMENTED
    */
    obbox():AnyShape
    {
        /**
            OC docs:
                - Bnd_OBB: https://dev.opencascade.org/doc/refman/html/class_bnd___o_b_b.html
                - BRepBndLib: https://dev.opencascade.org/doc/refman/html/class_b_rep_bnd_lib.html
         */
        if(this._ocShape)
        {
            let obbox = this._getOBbox();
            console.warn('Shape.obbox(): Not yet implemented!')

            return null;
        }
    }

    /** Calculate center of this Shape */
    center():Point  // TODO: Point output?
    {
        // this gets overloaded in specific Shape type classes
        return null;
    }

    /** Get max Point coordinate of Bbox of this Shape */
    max():Point
    {
        return this.bbox().max()
    }

    /** Get min Point of Bbox of this Shape */
    min():Point
    {
        return this.bbox().min()
    }


    //// BASIC OPERATIONS ////

    /** Round geometry to globally set (in OC) tolerance */
    round():Shape
    {
        /* docs:
            - https://dev.opencascade.org/doc/refman/html/class_shape_fix___shape_tolerance.html
            - https://dev.opencascade.org/doc/refman/html/class_shape_fix___shape.html
            - https://opencascade.blogspot.com/2009/02/topology-and-geometry-in-open-cascade_09.html
            - https://dev.opencascade.org/content/shape-tolerance
            
        */
        try
        {
            let ocShapeFix = new this._oc.ShapeFix_Shape_2(this._ocShape);
            ocShapeFix.SetPrecision(this._oc.SHAPE_TOLERANCE);
            ocShapeFix.Perform(new this._oc.Message_ProgressRange_1());
            this._ocShape = this._makeSpecificOcShape(ocShapeFix.Shape());
            return this;
        }
        catch(e)
        {
            console.warn(`Shape.round(): Failed rounding this Shape. Returned original!`);
            return this;
        }
        
    }

    /** Copy the Shape and add it to the Scene (private) */
    _copy(): this
    {
        const newShape = this.copy(false);
        return newShape;
    }

    /** Copy the Shape and add it to the Scene */
    // @addResultShapesToScene
    copy(addToScene:boolean=true):this
    {
        // OC docs: https://dev.opencascade.org/doc/refman/html/class_b_rep_builder_a_p_i___copy.html
        // Copying does take 10-15ms for even simple geometries like Boxes!
        let ocBuilderCopy = new this._oc.BRepBuilderAPI_Copy_1();
        ocBuilderCopy.Perform(this._ocShape, true, false); // TopoDS_Shape &S, copyGeom=Standard_True, copyMesh=Standard_False
        let newShape = new Shape()._fromOcShape(ocBuilderCopy.Shape()) as this;
        
        newShape._copyAttributes(this); 
        newShape._parent = this._parent; // also take over _parent

        if(addToScene)
        {
            newShape.addToScene();
        }

        return newShape;
    }

    /** Move Shape to a position by offsetting all Geometry with a Vector */
    // This is a good candidate for variable class return
    @checkInput('PointLike','Vector') // this automatically transforms Types
    move(vector:PointLike, ...args):this // also allows flattened input move(10,20,30)
    {
        this._ocShape.Move( (vector as Vector)._toOcLocation(), true );

        if (this._updateFromOcShape)
        { 
            // For example in Vertex: Needed to get data from OC into class properties
            this._updateFromOcShape();
        } 
        
        if (this.type() == 'Wire')
        {
            // checking is important: Wires for example will have Edges unordered
            // !!!! checking takes a lot time (10-15ms), don't use it for simple operations like move
            this.checkAndFix(); 
        }

        // bring annotation along
        this._updateAnnotations();
        
        return this;
    }

    /** Aliass for move along x-direction */
    @checkInput(Number, 'auto')
    moveX(distance:number):this
    {
        this.move(distance)
        return this;
    }

    /** Aliass for move along x-direction */
    @checkInput(Number, 'auto')
    moveY(distance:number):this
    {
        this.move(0,distance,0)
        return this;
    }

    /** Aliass for move along x-direction */
    @checkInput(Number, 'auto')
    moveZ(distance:number):this
    {
        this.move(0,0,distance)
        return this;
    }

    /** Move a copy of the Shape */
    @addResultShapesToScene
    @checkInput('PointLike','Vector')
    moved(v:PointLike, ...args):this
    {
        // move a copy 
        return this._copy().move(v as Vector); // return specific Shape class
    }

    /** Move Shape to a specific location using the pivot as center */
    @checkInput('PointLike','Vector')
    moveTo(to:PointLike, ...args):this
    {
        let moveVec = (to as Vector).subtracted(this.center());
        this.move(moveVec);
        return this;
    }

    /** Move Shape to specific x coordinate while keeping the other coords the same */
    @checkInput([['Number', 0], ['Alignment', 'center']],['auto', 'auto'])
    moveToX(x:number, pivot:Alignment):this
    {
        const pivotPoint = (isPointLike(pivot)) ? new Point(pivot) : this.pointAtSide(pivot);
        this.move(x - pivotPoint.x );
        return this;
    }

    /** Move Shape to specific y coordinate while keeping the other coords the same */
    @checkInput([['Number', 0], ['Alignment', 'center']],['auto', 'auto'])
    moveToY(y:number, pivot:Alignment):this
    {
        const pivotPoint = (isPointLike(pivot)) ? new Point(pivot) : this.pointAtSide(pivot);
        this.move(y - pivotPoint.y );
        return this;
    }

    /** Move Shape to specific z coordinate while keeping the other coords the same */
    @checkInput([['Number', 0], ['Alignment', 'center']],['auto', 'auto'])
    moveToZ(z:number, pivot:Alignment):this
    {
        const pivotPoint = (isPointLike(pivot)) ? new Point(pivot) : this.pointAtSide(pivot);
        this.move(z - pivotPoint.z );
        return this;
    }

    /** Move copy of the Shape to a Point in space */
    @checkInput('PointLike','Vector')
    movedTo(to:PointLike, ...args):this
    {
        let moveVec = (to as Vector).subtracted(this.center()); // auto convert to Vector
        let newShape = this.copy().move(moveVec);
        return newShape;
    }

    /** Center Shape so that the center of the Shape is at the origin */
    moveToOrigin():this
    {
        return this.moveTo(0,0,0);
    }

    /** Resize Shape with a given factor 
        TODO: different scaling factors per axis? scale(0.5,1,2)
    */
    @checkInput([[Number,SHAPE_SCALE_DEFAULT_FACTOR], ['PointLike', null]],[Number, 'Point'])
    scale(factor?:number, pivot?:PointLike):this
    {
        /* OC docs: 
            - gp_Trsf https://dev.opencascade.org/doc/occt-7.5.0/refman/html/classgp___trsf.html
            - BRepBuilderAPI_Transform: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/class_b_rep_builder_a_p_i___transform.html
        */
        let ocTransform = new this._oc.gp_Trsf_1();
        pivot = pivot as Point || this.center();
        ocTransform.SetScale(pivot._toOcPoint(), factor);
        let ocBuilder = new this._oc.BRepBuilderAPI_Transform_2(this._ocShape, ocTransform, true);
        this._ocShape = ocBuilder.Shape(); // 
        return this;
    }

    /** Same as scale but returning a copy of Shape */
    @checkInput([[Number,SHAPE_SCALE_DEFAULT_FACTOR], ['PointLike', null]],[Number, 'Point'])
    _scaled(factor?:number, pivot?:PointLike):this
    {
        return this._copy().scale(factor,pivot);
    }

    @addResultShapesToScene
    @checkInput([[Number,SHAPE_SCALE_DEFAULT_FACTOR], ['PointLike', null]],[Number, 'Point'])
    scaled(factor?:number, pivot?:PointLike):this
    {
        return this._scaled(factor, pivot);
    }

    /** 
     *   Rotation around X,Y,Z axis with a given pivot (default: center) 
     *   NOTE: because the order of these rotations if very important we don't call it just rotate. 
     *   Use rotateX, rotateY and rotateZ to rotate around the main axis
     */
    @checkInput([ [Number,0],[Number,0], [Number,0], ['Pivot', 'center']], [Number,Number,Number,'auto']) // IMPORTANT: not able to directly convert Pivot to Vector because pivot needs current Shape (can that be accessed in decorator?)
    rotateEuler(degX:number, degY?:number, degZ?:number, pivot?:Pivot):this
    {
        // Due to our algoritm in Vector.rotationTo we work with YZX Euler angles, so we apply the rotations in this order.
        return this.rotateY(degY, pivot).rotateZ(degZ,pivot).rotateX(degX,pivot);
    }

    /** Same as rotateEuler but makes a copy */
    @checkInput([ [Number,0],[Number,0], [Number,0], ['Pivot', 'center']], [Number,Number,Number,'auto']) 
    rotatedEuler(degX:number, degY:number = 0, degZ:number = 0, pivot:Pivot):this
    {
        return this.copy().rotateEuler(degX, degY, degZ, pivot);
    }

    /** 
     *   Rotate sequencely around the x,y and z axis.
     *   !!!! IMPORTANT: this is not the same as supplying the independant angles around the axis!
     */
    @checkInput('PointLike', 'Vector')
    rotate(r:PointLike, ...args) // allows flattened notation rotate(180,0,-90)
    {
        r = r as Vector; // automatically converted to Vector
        return this.rotateX(r.x).rotateY(r.y).rotateZ(r.z);
    }

    /** Rotate this Shape around the x-axis with a given angle and pivot (default: center) */
    @checkInput([Number,['Pivot','center']], [Number, 'auto'])
    rotateX(deg:number, pivot?:Pivot):this
    {
        return this.rotateAround(deg, [1,0,0], pivot);
    }

    /** Rotate this Shape around the y-axis with a given angle and pivot (default: center) */
    @checkInput([Number,['Pivot','center']], [Number, 'auto'])
    rotateY(deg:number, pivot?:Pivot):this
    {
        return this.rotateAround(deg, [0,1,0], pivot);
    }

    /** Rotate this Shape around the y-axis with a given angle and pivot (default: center) */
    @checkInput([Number,['Pivot','center']], [Number, 'auto'])
    rotateZ(deg:number, pivot?:Pivot):this
    {
        return this.rotateAround(deg, [0,0,1], pivot);
    }

      /** Rotates a Shape a given angle in degrees along a axis (default: Z) */
    @checkInput([Number,['PointLike',[0,0,1]],['Pivot','center'] ], [Number, Vector, 'auto'])
    rotateAround(angle:number, axis?:PointLike, pivot?:Pivot):this
    {
        /* !!!! IMPORTANT: OC uses righthand rotation from given Vector 

            - Rotating around x-axis in positive direction is from Y to Z axis
            - Rotating around y-axis in positive direction goes from Z to X (counterintuitive!)
            - Rotation around z-axis is from X to Y axis
        */

        /* OC docs:
            - gp_Trsf - https://dev.opencascade.org/doc/refman/html/classgp___trsf.html
            - gp_Pnt - https://dev.opencascade.org/doc/refman/html/classgp___pnt.html
            - gp_Vec - https://dev.opencascade.org/doc/refman/html/classgp___vec.html
            - gp_Dir - https://dev.opencascade.org/doc/refman/html/classgp___dir.html
            - gp_Ax1 - https://dev.opencascade.org/doc/refman/html/classgp___ax1.html
            - TopLoc_Location - https://dev.opencascade.org/doc/refman/html/class_top_loc___location.html
        */  

        let pivotVec:Vector;
        let axisVec = axis as Vector; // automatically converted

        if (typeof pivot === 'string' || pivot == null)
        {
            pivotVec = this.pointAtSide(pivot as string).toVector();
        }
        else {
            pivotVec = new Vector(pivot);
        }
    
        let ocTransformation = new this._oc.gp_Trsf_1();
        ocTransformation.SetRotation_1( 
                new this._oc.gp_Ax1_2(
                    pivotVec._toOcPoint(),
                    axisVec._toOcDir()
                ),
                toRad(angle)
                );
        let ocRotation = new this._oc.TopLoc_Location_2(ocTransformation);

        this._ocShape.Move(ocRotation, true);
        this._updateFromOcShape(); // needed for certain classes like Vertex to update class properties
        
        this._updateAnnotations(); // bring annotation along

        return this;
    }

    /** Rotate Shape so that its orientated bounding box is aligned with the axes */
    rotateToAxesBbox():this
    { 
        // this.moveTo(0,0,0); // move to center
        let obbox = this._getOBbox();

        this.alignByPoints(
            [
                obbox.center, 
                obbox.center.toVector().add(obbox.xDirection), 
                obbox.center.toVector().add(obbox.zDirection)
            ],
            [
                obbox.center, 
                obbox.center.moved(1), 
                obbox.center.moved(0,0,1)
            ],
            
        )
        return this;
    }

    /** Rotate Shape to place flat on XY plane. Keeps x,y position */
    @checkInput([['String', 'vertical'],['Boolean',true]], ['auto', 'auto'])
    rotateToLayFlat(direction?:'horizontal'|'vertical', autoRotate?:boolean):this
    {
        // autoRotate to align shape with Axes
        if(autoRotate)
        {
            this.rotateToAxesBbox();
        }
        // now get bbox and find the largest face and lay it on the given plane
        let biggestFace;
        let biggestFaceArea = 0;

        const shapeBbox = this.bbox().box() || this.bbox().rect(); // Shape can already be 2D

        if(!shapeBbox)
        {
            console.error('Shape::rotateToLayFlat(): Failed. Returned original Shape.')
            return this;
        }

        shapeBbox.faces().forEach(f =>
        {
            let area = f.area();
            if(area > biggestFaceArea)
            {
                biggestFace = f;
                biggestFaceArea = area;
            }
        })
        if(!biggestFace)
        {
            throw new Error(`rotateToLayFlat::Could not find a Face to lay flat on!`)
        }
        
        this.rotateVecToVec(biggestFace.normal(), new Vector(0,0,1),this.center());

        // finally check alignment: horizontal or vertical
        // keep x,y center
        let bbox = this.bbox();
        if( (direction == 'vertical' && bbox.width() > bbox.depth())
                || (direction == 'horizontal' && bbox.width() < bbox.depth()))
        {
            this.rotateZ(90);
        }
        // move up to lie on XY plane
        this.move(0,0,-bbox.bottom().center().z)

        return this;
    }

    /** Flatten a Solid into a Face */
    // !!!! TMP METHOD !!!! Needs a lot of work
    _flattened():AnyShape
    {
        if(this.type() !== 'Solid')
        {
            console.warn(`Shape::flatten: Does not yet work on non-Solids! Returned original`);
            return this._copy();
        }

        const selected = this.select('F||bottom');
        let bottomFace = ShapeCollection.isShapeCollection(selected) ? (selected as AnyShapeCollection).first() : selected as AnyShape;
        
        if(bottomFace && bottomFace.type() === 'Face')
        {
            return bottomFace._copy() as Face;
        }
        return null;
    }

    /** 
     *   Move, rotate and (later) scale a Shape based on given points on the Shape and destination points
     *   NOTE: you need two points for 2D alignment, 3 points for 3D alignment with rotation
     *   TODO: Add scaling
     */
    // TODO: @inputCheck - but its a bit tricky with the Alignment strings
    alignByPoints(fromPoints:Array<Vector|Vertex|Point|Array<number>|string>, toPoints:Array<Vector|Vertex|Point|Array<number>>):this
    {
        // TODO: test if we can align - we have/can get 3 vertices?

        if (!(fromPoints instanceof Array) || !(toPoints instanceof Array))
        {
            console.error(`Shape::alignByPoints: Please supply Array of PointLikes`)
            return this;
        }

        let fp1 = (typeof fromPoints[0] == 'string') ? this.pointAtSide(fromPoints[0]) : (fromPoints[0]) ? new Vector().fromAll(fromPoints[0]) : null;
        let fp2 = (typeof fromPoints[1] == 'string') ? this.pointAtSide(fromPoints[1]) : (fromPoints[1]) ? new Vector().fromAll(fromPoints[1]) : null;  // can be null
        let fp3 = (typeof fromPoints[2] == 'string') ? this.pointAtSide(fromPoints[2]) : (fromPoints[2]) ? new Vector().fromAll(fromPoints[2]) : null; // can be null

        let tp1 = (toPoints[0]) ? new Vector().fromAll(toPoints[0]) : null;
        let tp2 = (toPoints[1]) ? new Vector().fromAll(toPoints[1]) : null; 
        let tp3 = (toPoints[2]) ? new Vector().fromAll(toPoints[2]) : null; 

        if(!fp1 && !fp1)
        {
            console.error(`Shape::alignByPoints: Please supply at least a destination and target Point! Shape unchanged!`);
            return this;
        }

        // keep track of operations (mainly for last step)
        let gizmo = (fp2 && tp2 && fp3 && tp3) ? new Face().fromVertices([fp1,fp2,fp3]) : null;
        
        // move shape from point to target point
        let moveVec = tp1.subtracted(fp1);
        this.move(moveVec);
        // update gizmo if 3D
        if (gizmo) gizmo.move(moveVec);

        // rotate using first and second points ( if any )
        if (fp2 && tp2)
        {
            let fv = fp2.toVector().subtracted(fp1);
            let tv = tp2.toVector().subtracted(tp1);

            /*
            let angles = fv.rotationsTo(tv); // Get Euler rotations

            this.rotateEuler(angles[0],angles[1],angles[2],tp1); // we rotate around the first destination point
            // update gizmo if 3D
            if (gizmo) gizmo.rotateEuler(angles[0],angles[1],angles[2],tp1);
            */

            this.rotateVecToVec(fv,tv,tp1);
            if (gizmo) gizmo.rotateVecToVec(fv, tv, tp1);
        }

        // With 2x2 points we can never really align Solids in 3D (only in 2D on a given workplane )- a third set is needed
        // !!!! STILL A BUG HERE !!!! - skip previous steps and directly align to normals?
        if (fp3 && tp3)
        {
            // in the previous steps we aligned the two Vectors (fv and tv): we now need to align [fp2,fp3] with [tp2, tp3] ...
            // NOTE1: previous step might change orientation of original Shape so we transform the gizmo with it and get the last Vector from that
            // NOTE2: We need to have the difference in the normals between the gizmo and the 'target Face'

            let gn = gizmo.normal();
            let tn = new Face().fromVertices([tp1,tp2,tp3]).normal();
            let rv = tp2.subtracted(tp1);  // by rotating around [fp1,fp2] (or [tp2, tp3])

            let angle = gn.angleRef(tn, rv.reverse()); // angleRef works right-handed - we need to make this left-handed
            this.rotateAround(angle, rv, tp1); // rotatingAround is left-handed
        }

        return this;
    }   

    /** Same as alignByPoint but returns a copy and does not affect original */
    // TODO: @checkInput
    alignedByPoints(fromPoints:Array<Vector|Vertex|Point|Array<number>>, toPoints:Array<Vector|Vertex|Point|Array<number>>):this
    {
        return this.copy().alignByPoints(fromPoints, toPoints)
    }

    /** Rotate this Shape by a Quaternion made by two Vectors */
    @checkInput(['PointLike', 'PointLike', ['PointLike',[0,0,0]]], ['Vector', 'Vector', 'Vector']) // auto convert
    rotateVecToVec(from:PointLike, to:PointLike, pivot?:PointLike):this
    {
        let fromVec= from as Vector; // auto converted
        let toVec = to as Vector; 
        let pivotVec = pivot as Vector;

        let ocQuaternion = new this._oc.gp_Quaternion_3(fromVec._ocVector, toVec._ocVector).Normalized();

        let ocTransformation = new this._oc.gp_Trsf_1();
        ocTransformation.SetRotation_2( ocQuaternion ); // Rotation is done around the origin - so we need to first move the Shape from pivot to origin

        this.move(pivotVec.reversed());
        // Then rotate
        let ocRotation = new this._oc.TopLoc_Location_2(ocTransformation); 
        this._ocShape.Move(ocRotation, true); // Apply the Quaternion rotation around origin
        // and move back
        this.move(pivotVec);


        return this;
    }

    /** 
     *   Mirror Shape
     *   @param planeNormal The normal of the Mirror plane (not direction of orthogonal plane) !!!! different from Vector.mirror()
     *   origin: Origin of mirror plane
     */
    @checkInput([ ['PointLike', [0,0,0]], ['PointLike', 'x']], ['Vector', 'Vector']) // the default mirror plane is the YZ plane with normal +X-axis at [0,0,0]
    _mirrored(origin?:PointLike, normal?:PointLike):this
    {
        /* OC docs:
            - gp_Trsf https://dev.opencascade.org/doc/refman/html/classgp___trsf.html
            - BRepBuilderAPI_Transform: https://dev.opencascade.org/doc/refman/html/class_b_rep_builder_a_p_i___transform.html#a36c59897770510a452e6200e2d714399
        */
        
        let mirrorPlaneNormal = (normal as Vector).normalize(); // auto converted
        let mirrorPlaneOrigin = (origin as Vector);

        let ocMirrorTransform = new this._oc.gp_Trsf_1();
        let ocMirrorPlaneNormal = mirrorPlaneNormal._toOcDir();
        let ocMirrorOrigin = mirrorPlaneOrigin._toOcPoint();

        ocMirrorTransform.SetMirror_3( new this._oc.gp_Ax2_3(ocMirrorOrigin, ocMirrorPlaneNormal));

        let newShape = new Shape()._fromOcShape(new this._oc.BRepBuilderAPI_Transform_2(this._ocShape, ocMirrorTransform, true).Shape()) as AnyShape; // cast needed
        
        newShape._copyAttributes(this); // copy attributes over
        newShape._parent = this._parent; // also take over _parent

        return newShape as this;

    }

    @addResultShapesToScene
    @checkInput([ ['PointLike', [0,0,0]], ['PointLike', 'x']], ['Vector', 'Vector']) // the default mirror plane is the YZ plane with normal +X-axis at [0,0,0]
    mirrored(origin?:PointLike, normal?:PointLike):this
    {
        return this._mirrored(origin,normal);
    }
    
    /** Mirror Shape relative to XZ plane with its center as pivot or given offset y-coord */
    @checkInput([[Number,null]], 'auto')
    mirrorX(offset?:number):this
    {
        let mirroredShape = this._mirroredX(offset); 
        this.replaceShape(mirroredShape);
        return mirroredShape;
    }

    /** Create mirrored copy relative to XZ plane with its center as pivot or given offset y-coord */
    @checkInput([[Number,null]], 'auto')
    _mirroredX(offset?:number):this
    {
        return this._mirrored( (offset !== null) ? [0,offset,0] : this.center(), [0,1,0]);
    }

    @addResultShapesToScene
    @checkInput([[Number,null]], 'auto')
    mirroredX(offset?:number):this
    {
        return this._mirroredX(offset);
    }
    
    /** Mirror Shape relative to YZ plane with its center as pivot or given offset x-coord */
    @checkInput([[Number,null]], 'auto')
    mirrorY(offset?:number):this
    {
        let mirroredShape = this._mirroredY(offset); 
        this.replaceShape(mirroredShape);
        return mirroredShape;
    }

    /** Create mirrored copy relative to the YZ plane with its center as pivot or given offset x-coord  */
    @checkInput([[Number,null]], 'auto')
    _mirroredY(offset?:number):this
    {
        return this._mirrored( (offset !== null) ? [offset,0,0] : this.center(), [1,0,0]);
    }

    @addResultShapesToScene
    @checkInput([[Number,null]], 'auto')
    mirroredY(offset?:number):this
    {
        return this._mirroredY(offset);
    }

    /** Mirror Shape relative to XY plane with its center as pivot or given offset z-coord */
    @checkInput([[Number,null]], 'auto')
    mirrorZ(offset?:number):this
    {
        let mirroredShape = this._mirroredZ(offset); 
        this.replaceShape(mirroredShape);
        return mirroredShape;
    }

    /** Create mirrored copy relative to XY plane with its center as pivot */
    @checkInput([[Number,null]], 'auto')
    _mirroredZ(offset?:number):this
    {
        return this._mirrored((offset !== null) ? [0,0,offset] : this.center(), [0,0,1]);
    }

    /** Create mirrored copy relative to XY plane with its center as pivot and add to Scene */
    @addResultShapesToScene
    @checkInput([[Number,null]], 'auto')
    mirroredZ(offset?:number):this
    {
        return this._mirroredZ(offset);
    }

    //// MODELLING OPERATIONS ////

    @checkInput([ [Number, SHAPE_EXTRUDE_DEFAULT_AMOUNT], ['PointLike', null ]], [Number, 'Vector'])
    extrude(amount?:number, direction?:PointLike):IEdge|Face|Shell|ISolid
    {
       let directionVec = direction as Vector; // auto converted

       // auto extrusion Vector
       if (!directionVec)
       {
            if(['Edge','Wire', 'Face', 'Shell'].includes(this.type()))
            {
                directionVec = (this as any).normal();
            }
            else {
                // default: z-axis
                directionVec = new Vector(0,0,1);
            }
       }       
       
       let newShape = this.extruded(amount, directionVec); // auto converted to Vector
       this.replaceShape(newShape as AnyShapeOrCollection);

       return newShape; // return the new Shape, not the original!
    }

    /** 
     *   Generic Shape extrude: basically meaning pulling a shape along a Vector for a distance to create a new Shape with higher dimensions
     *   For example: Extrude a straight Line along a the z-axis to create a Rectangular Face    
     *   TODO: solid flag
     */
    
    @checkInput([ [Number, SHAPE_EXTRUDE_DEFAULT_AMOUNT], ['PointLike', [0,0,1] ]], [Number, 'Vector'])
    _extruded(amount?:number, direction?:PointLike):IEdge|Face|Shell|Solid
    {
        /* OC docs:
            - MakePrism: https://dev.opencascade.org/doc/refman/html/class_b_rep_prim_a_p_i___make_prism.html
        */
        let extrudeVec = (direction as Vector).normalized().scale(amount);
        let ocPrismBuilder = new this._oc.BRepPrimAPI_MakePrism_1(this._ocShape, extrudeVec._toOcVector(), false, true);
        let ocShape = ocPrismBuilder.Shape();
        if (ocShape.IsNull())
        {
            console.error(`Shape::extruded: Extrusion failed! Return original`);
            return null;
        }
        let newShape = (new Shape()._fromOcShape(ocShape) as AnyShape).specific(); // Can return only one Shape

        return newShape as Edge|Face|Shell|Solid;
    }

    @addResultShapesToScene
    @checkInput([ [Number, SHAPE_EXTRUDE_DEFAULT_AMOUNT], ['PointLike', [0,0,1] ]], [Number, 'Vector'])
    extruded(amount?:number, direction?:PointLike):IEdge|Face|Shell|Solid
    {
        return this._extruded(amount, direction);
    }

    /** Extrude this Shape towards a given Point or other Shape - we do keep the normal of the Shape if available */
    // TODO: Add ShapeCollection as input
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    extrudedTo(other:PointLikeOrAnyShapeOrCollection, ...args):null|AnyShape
    {
        let distance:number;
        let toVertex:Vertex;

        if (isPointLike(other))
        {
            other = new Point(other as PointLike, ...args)._toVertex();
        }

        if(!Shape.isShape(other))
        {
            console.error(`**** extrudedTo ShapeCollection: TODO ****`)
            return null;
        }
        else {
            // we have a Shape: use distanceEdge to get closest Point on that Shape
            let shape = other as AnyShape;
            let link = this.distanceLink(shape as any); // TODO: play nice with types
            if (link.distance == 0){
                console.warn(`extrudedTo: You supplied a Shape that has no distance to original!`);
            }
            toVertex = link.to._toVertex();
            distance = link.distance;
            // convert all simple Point like geometries to Vector
            toVertex = new Vertex().fromAll(shape as any);
            distance = this.distance(toVertex);
        }
            
        let normal = this.workPlaneNormal() || new Vector(DEFAULT_WORKPLANE); // if present otherwise it's the default axis (mostly Z-axis)
        let v1 = this.center().toVector().added(normal)._toVertex();
        let v2 = this.center().toVector().subtracted(normal)._toVertex();
        let extrudeAmount = (v1.distance(toVertex) < v2.distance(toVertex)) ? distance : -distance; // flip amount if needed
        
        return this.extruded(extrudeAmount);
        
    }

    /** Offset Shape to create a new version parallel to original with a given distance and by corners of given type (arc, intersection)  */
    // This is overriden in simpler topologies (Edge, Wire)
    @protectOC(['Offsetting to inside (-amount) is more robust'])
    @checkInput([[Number,null],[String,null],['PointLike', null]], ['auto', 'auto', 'Vector'])
    _offsetted(amount?:number, type?:string, onPlaneNormal?:PointLike):AnyShapeOrCollection // NOTE: type is used here are join type (not offset type)
    {
        const DIRECTION_TYPES = {
            skin : this._oc.BRepOffset_Mode.BRepOffset_Skin, // over the surface of the shell ( or inside with -amount)
            pipe : this._oc.BRepOffset_Mode.BRepOffset_Pipe, // !!!! NOT IMPLEMENTED IN OC 7.6
            center : this._oc.BRepOffset_Mode.BRepOffset_RectoVerso, // equally divided - NOT IMPLEMENTED
        }

        const JOIN_TYPES = {
            arc: this._oc.GeomAbs_JoinType.GeomAbs_Arc,
            tangent: this._oc.GeomAbs_JoinType.GeomAbs_Tangent, // does not really work
            intersection: this._oc.GeomAbs_JoinType.GeomAbs_Intersection 
        }

        if(!['Face','Shell','Solid'].includes(this.type()))
        {
            throw new Error(`Shape::offset: Cannot offset Shape type ${this.type()}. Check if it makes sense!`);
        }
        
        let ocMakeOffsetShape = new this._oc.BRepOffsetAPI_MakeOffsetShape();

        let joinType;
        if (['arc','intersection'].includes(type))
        {
            joinType = JOIN_TYPES[type];
        }
        else
        {
            joinType = JOIN_TYPES.arc;
            if(type){ console.warn(`${this.type()}::offset: You supplied an unknown join type: "${type}". Please use either "arc" [default] or "intersection"`);}
        }

        ocMakeOffsetShape.PerformByJoin(this._ocShape, amount, 0.001, DIRECTION_TYPES.skin, false, false, joinType, false, new this._oc.Message_ProgressRange_1()); // tolerance, construction method, intersection, self intersection, join type, remove internal edges

        let ocNewShape = ocMakeOffsetShape.Shape();

        if(ocNewShape.IsNull())
        {
            throw new Error(`${this.type()}::_offsetted: Offset Failed with empty Shape. Check Shape continuity. ${(type == 'intersection') ? 'Try again with type to "arc". Intersection is rather unstable' : ''}`);
            // NOTE: simple calculation does weird things, so avoid here
        }
        let newShape = new Shape()._fromOcShape(ocNewShape);
        return newShape;
        
    }

    /** Offset Shape to create a new version parallel to original with a given distance and by corners of given type (arc, intersection)  */
    // This is overriden in simpler topologies (Edge, Wire)
    @checkInput([[Number,null],[String,null],['PointLike', null]], ['auto', 'auto', 'Vector'])
    offset(amount?:number, type?:string, onPlaneNormal?:PointLike):AnyShapeOrCollection
    {
        if(!['Face','Shell','Solid'].includes(this.type()))
        {
            throw new Error(`Shape::offset: Cannot offset Shape type ${this.type()}. Check if it makes sense!`);
        }

        let newShape = this._offsetted(amount); 
        this.replaceShape(newShape);
        return newShape;
    }

    @addResultShapesToScene
    @checkInput([[Number,null],[String,null],['PointLike', null]], ['auto', 'auto', 'Vector'])
    offsetted(amount?:number, type?:string, onPlaneNormal?:PointLike):AnyShapeOrCollection
    {
        if(!['Face','Shell','Solid'].includes(this.type()))
        {
            throw new Error(`Shape::offset: Cannot offset Shape type ${this.type()}. Check if it makes sense!`);
        }
        return this._offsetted(amount); 
    }

    /** Thicken Shell or Solid to create a hollow Solid (private) */
    @protectOC(['Check thickness of Shell does not create self-intersection', 
                'Shelling Solids to the inside (-amount) is more robust',
                'Shelling Spheres is tricky. A simple move() might break it. Try to avoid Spheres',
                'Shelling Shells is sometimes unstable. Try offsetted()'])
    @checkInput([ [Number,SHAPE_SHELL_AMOUNT],['AnyShapeOrCollectionOrSelectionString', null],[String,'arc']],['auto','auto', 'auto'])
    _shelled(amount:number, excludeFaces?:AnyShapeOrCollectionOrSelectionString, type?:string):ISolid
    {
        /* NOTE: OC changing: we might need to update here. Looks like this will be direct functions without constructor
        *  OC docs: 
        *          - https://dev.opencascade.org/doc/occt-7.6.0/refman/html/class_b_rep_offset_a_p_i___make_thick_solid.html
        *          - https://dev.opencascade.org/doc/occt-7.6.0/refman/html/_b_rep_offset___mode_8hxx.html#a660437f6c00ce59d43e4a930fba2f84c
        *
        * NOTE: Shelling complex lofts quickly goes into very long computation - is there a way to protect or optimize this?
        * */
        // taken from CadQuery https://github.com/CadQuery/cadquery/blob/4c45eb20e3576a2cff74f30c76bc96bf0f58561a/cadquery/occ_impl/shapes.py

        if(!['Shell','Solid'].includes(this.type()))
        {
            throw new Error(`Shape::offset: Cannot offset Shape type ${this.type()}. It only works on Faces, Shells or Solids!`);
        }

        let excludeFacesCollection:AnyShapeCollection;

        if(isSelectionString(excludeFaces))
        {
            const selected = this.select(excludeFaces as SelectionString); // Can be Shape or ShapeCollection
            if (selected === null)
            {
                console.warn(`Shape::_shelled: No Faces found for exclusion with selection string: "${excludeFaces}. Fell back to none!`);
                excludeFacesCollection = new ShapeCollection();
            }
            else {
                excludeFacesCollection = new ShapeCollection(selected.faces());
                if (excludeFacesCollection.length == 0)
                {
                    console.warn(`Shape::_shelled: No Faces found for exclusion with selection string: "${excludeFaces}. Check if you supplied Faces in your SelectionString!`);
                }
            }
        }
        else {
            excludeFacesCollection = (excludeFaces as ShapeCollection == null) ? new ShapeCollection() : excludeFaces as ShapeCollection; // NOTE: See decorator: We don't check inputs not coming in
        }

        const DIRECTION_TYPES = {
            'skin' : this._oc.BRepOffset_Mode.BRepOffset_Skin, // over the surface of the shell ( or inside with -amount)
            'pipe' : this._oc.BRepOffset_Mode.BRepOffset_Pipe, // not implemented yet
            'center' : this._oc.BRepOffset_Mode.BRepOffset_RectoVerso, // not implemented yet
        }
        const DIRECTION_TYPE_DEFAULT = 'skin';

        const JOIN_TYPES = {
            'arc': this._oc.GeomAbs_JoinType.GeomAbs_Arc,
            'intersection': this._oc.GeomAbs_JoinType.GeomAbs_Intersection,
        }
        const JOIN_TYPE_DEFAULT = 'arc';

        let ocBuilder = new this._oc.BRepOffsetAPI_MakeThickSolid();
        
        excludeFacesCollection = excludeFacesCollection.getShapesByType('Face');
        let ocExcludeFaces = new this._oc.TopTools_ListOfShape_1(); // none for now
        if (excludeFacesCollection && excludeFacesCollection.length > 0)
        {
            excludeFacesCollection.forEach( face => ocExcludeFaces.Append_1(face._ocShape));
        }

        let directionType =  DIRECTION_TYPES[DIRECTION_TYPE_DEFAULT];
        let joinType = JOIN_TYPES[type] || JOIN_TYPES[JOIN_TYPE_DEFAULT];
        
        ocBuilder.MakeThickSolidByJoin(this._ocShape, ocExcludeFaces, amount, 0.001, directionType, false, false, joinType, false, new this._oc.Message_ProgressRange_1()); // mode, intersection, selfInter, join type, removeIntEdges

        if (ocBuilder.IsDone())
        {
            let ocResult = ocBuilder.Shape(); 
            let tmpResult = new Shape()._fromOcShape(ocResult);

            if (excludeFaces && tmpResult.type() === 'Solid')
            {
                return tmpResult as Solid;
            }
            else // Either as offsetted Solid or Shell
            {   
                let offsettedShell = tmpResult.shells()[0]._copy() as Shell;
                let origShell = this.shells()[0]._copy();

                let newOcShape:any;
                // watertight Solid: resulted offsetted Shape inside or outside of original
                if(tmpResult.type() == 'Solid')
                {
                    if (amount > 0)
                    {
                        newOcShape = new this._oc.BRepBuilderAPI_MakeSolid_4(offsettedShell._ocShape, origShell._ocShape).Shape();
                    }
                    else {
                        newOcShape = new this._oc.BRepBuilderAPI_MakeSolid_4(origShell._ocShape, offsettedShell._ocShape).Shape();
                    }
                    let newShape = new Shape()._fromOcShape(newOcShape) as Solid;
                    if (newShape.type() == 'Solid')
                    {
                        newShape._fix(); // needed
                        return newShape as Solid;
                    }
                }

                // tmpResult was a Shell. Try to make a Solid by bridging the original Shell and the offsetted one
                // We do some extra effort to make into a Solid
                return origShell._bridge(offsettedShell);
            }
        }
        else {
            throw new Error(`Shape::_shelled: Failed to generate Shelled Shape!`);
        }
    }

    /** Thicken Face, Shell or Solid to create a hollow Solid (private) */
    @addResultShapesToScene
    @checkInput([ [Number,SHAPE_SHELL_AMOUNT],['AnyShapeOrCollectionOrSelectionString', null],[String,'arc']],['auto','auto', 'auto'])
    shelled(amount:number, excludeFaces?:AnyShapeOrCollectionOrSelectionString, type?:string):ISolid
    {
        return this._shelled(amount,excludeFaces,type);
    }
    
    /** Same as shelled but with replacing the original */
    @checkInput([ [Number,SHAPE_SHELL_AMOUNT],['AnyShapeOrCollectionOrSelectionString', null],[String,'arc']],['auto','auto', 'auto'])
    shell(amount:number, excludeFaces?:AnyShapeOrCollectionOrSelectionString, type?:string):ISolid
    {   
        let newShape = this._shelled(amount, excludeFaces, type);
        this.replaceShape(newShape);
        return newShape;
    }

     /** Thicken a Shape depending on its type
    *  @param direction - all (grow from center), bottom, left, right, top
    */
    @checkInput([Number, String], [Number, String]) // TODO: more
    _thickened(amount:number, direction:string='all'):AnyShape
    {
        // method to be overrided in subclasses
        // implemented in Edge and Wire ( closed Wires untested !)
        console.warn(`Shape::thickened: Not implemented yet in Shape type ${this.type()}`);
        return null;
    }

    /** Thicken a Shape depending on its type
    *  @param direction - all (grow from center), bottom, left, right, top
    */
    @checkInput([Number, String], [Number, String]) // TODO: more
    thickened(amount:number, direction:string='all'):AnyShape
    {
        // method to be overrided in subclasses
        // implemented in Edge and Wire ( closed Wires untested !)
        console.warn(`Shape::thickened: Not implemented yet in Shape type ${this.type()}`);
        return null;
    }
    
    @checkInput([Number, String], [Number, String]) // TODO: more
    thicken(amount:number, direction:string='all'):AnyShape
    {
        // overriden by subclass
        console.warn(`Shape::thicken: Not implemented yet in Shape type ${this.type()}`);
        return null;
    }

    /** Make a new Shape by revolving a non-solid Shape around an axis given by two Points (Private) */
    @protectOC([]) // TODO: hints
    @checkInput([['Number', 360],['PointLike',[0,0,0]],['PointLike',[0,0,1]]],['auto','Vector','Vector'])
    _revolved(angle?:number,axisStart?:PointLike,axisEnd?:PointLike)
    {
        /* OC docs:
            - Make_Revol: https://dev.opencascade.org/doc/refman/html/class_b_rep_prim_a_p_i___make_revol.html
            - gp_Ax1: https://dev.opencascade.org/doc/refman/html/classgp___ax1.html
        */

        if(this.type() == 'Solid')
        {
            throw new Error('Shape._revolved: Cannot revolve a solid Shape!');
        }

        let axisStartVec = axisStart as Vector;
        let axisEndVec = axisEnd as Vector;

        // TODO: some automatic axis detection

        let axisDirection = axisEndVec.subtracted(axisStartVec);
        let ocAxis = new this._oc.gp_Ax1_2(axisStartVec._toOcPoint(), axisDirection._toOcDir());
        let ocMakeRevol = new this._oc.BRepPrimAPI_MakeRevol_1(this._ocShape, ocAxis, toRad(angle), true);
        let newOcShape = ocMakeRevol.Shape();
        let revolvedShape = new Shape()._fromOcShape(newOcShape);

        // NOTE: Often the result is a Shellm which intuitively should be a Solid to the user
        // Try to upgrade
        if(revolvedShape.type() === 'Shell')
        {
            const solidRevolvedShape = (revolvedShape as Shell)._toSolid();
            revolvedShape = solidRevolvedShape || revolvedShape; // upgraded to Solid if not null
        }
        
        return revolvedShape
    }

    /** Make a new Shape by revolving a non-solid Shape around an axis given by two Points */
    @addResultShapesToScene
    @checkInput([['Number', 360],['PointLike',[0,0,0]],['PointLike',[0,0,1]]],['auto','Vector','Vector'])
    revolved(angle?:number,axisStart?:PointLike,axisEnd?:PointLike):AnyShapeOrCollection
    {
        return this._revolved(angle,axisStart,axisEnd);
    }
    
    //// OPERATIONS WITH OTHER SHAPES ////

      
    /* 
     *   Create a Shell or Solid by linearly exterpolation one Shape through others 
     *   NOTE: that we use the method of Wire class and doing the needed conversions and checks
     *   We can use this method on Shapes: Edges, Wires and Faces. For Shells and Solids lofting does not make much sense
     *   @param sections: Can be a Vertex,Edge,Wire,Face or an Array of those
     */
    _lofted(sections:AnyShapeOrCollection, solid?:boolean):Shell|Solid 
    {   
        // if not overriden by subclass (Edge,Wire,Face): we give this error
        throw new Error(`Shape::lofted: Sorry, cannot loft a Shape of type '${this.type()}'!`);
    }

    lofted(sections:AnyShapeOrCollection, solid?:boolean)
    {
        this._lofted(sections, solid);
    }

    loft(sections:AnyShapeOrCollection, solid?:boolean):Shell|Solid 
    {   
        // if not overriden by subclass (Edge,Wire,Face): we give this error
        throw new Error(`Shape::lofted: Sorry, cannot loft a Shape of type '${this.type()}'!`);
    }

    /** Create a new Shape by sweeping a the Shape's Wire representation through a Wire Path */
    @checkInput([ 'LinearShape', [Boolean,SHAPE_SWEEP_DEFAULT_SOLID ], [Boolean, SHAPE_SWEEP_DEFAULT_AUTOROTATE],[String, null]], ['Wire', Boolean, Boolean, String ] )
    _sweeped(path:LinearShape, solid?:boolean, autoRotate?:boolean, alignToPath?:string):Face|Shell|Solid 
    {
        // TODO: add holes
        path = path as Wire;
        let sweepWire = this._toWire(); // works on Edge, Face...
        return sweepWire._sweeped(path, solid, autoRotate, alignToPath);        
    }

    /** Sweep and add result to Scene */
    @addResultShapesToScene
    @checkInput([ 'LinearShape', [Boolean,SHAPE_SWEEP_DEFAULT_SOLID ], [Boolean, SHAPE_SWEEP_DEFAULT_AUTOROTATE],[String, null]], ['Wire', Boolean, Boolean, String ] )
    sweeped(path:LinearShape, solid?:boolean, autoRotate?:boolean, alignToPath?:string):Face|Shell|Solid 
    {
        return this._sweeped(path, solid, autoRotate, alignToPath);
    }

    /** Is the same Shape in OC */
    @checkInput('AnyShape','auto')
    same(other:AnyShape):boolean
    {
        return (this._hashcode() === other._hashcode())
    }

    /** Is exactly the same Shape based on its topology/geometry 
     *  IMPORTANT: this will not always work!
    */
    @checkInput('PointLikeOrAnyShape', 'auto')
    equals(other:PointLikeOrAnyShape):boolean
    {
        let otherShape:AnyShape;

        if (isPointLike(other))
        {
            otherShape = new Vertex(other as PointLike);
        }
        else {
            otherShape = other as AnyShape; 
        }
        
        if(this.type() != otherShape.type()){ return false;}

        const vertices = this.vertices().all(); 
        const otherVertices = otherShape.vertices().all();
        
        if (vertices.length != otherVertices.length)
        {
            return false;
        }
        
        else {
            for (let c = 0; c < vertices.length; c++)
            {
                let v1 = vertices[c];
                let vertexIsPresent = otherVertices.find( v => v1.equals(v as Vertex)) != null
                if (!vertexIsPresent)
                {
                    return false;
                }
            }
            return true;
        }
       
    }

    /** Calculate the distance between this Shape and other */
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    distance(other:PointLikeOrAnyShapeOrCollection, ...args):number
    {
        /* OC docs:
            - BRepExtrema_DistShapeShape: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep_extrema___dist_shape_shape.html#a010ce80337165794fe167170564a9905
        */

        // convert PointLike to Vertex
        if (isPointLike(other))
        {
            other = new Point((other as Point), ...args)._toVertex();
        }

        if (isAnyShape(other))
        {
            return this._distanceToShape(other);
        }
        
        if (ShapeCollection.isShapeCollection(other))
        {
            let others = other as ShapeCollection;
            let distances = others.toArray().map( shape => this._distanceToShape(shape)).filter( d => d != null);
            return distances.sort( (a,b) => b - a )[0];
        }

    }

    /** Internal method that really calculates distance between two single Shapes */
    @checkInput('AnyShape', 'auto')
    _distanceToShape(other:AnyShape):number
    {
        const ocShapeDistanceCalculator = new this._oc.BRepExtrema_DistShapeShape_2(this._ocShape, other._ocShape,
            this._oc.Extrema_ExtFlag.prototype.constructor.Extrema_ExtFlag_MINMAX, // NOTE: maximum distance can not be calculated with this!
            this._oc.Extrema_ExtAlgo.prototype.constructor.Extrema_ExtAlgo_Grad,
            new this._oc.Message_ProgressRange_1(),
            );
        ocShapeDistanceCalculator.Perform(new this._oc.Message_ProgressRange_1());

        if (ocShapeDistanceCalculator.IsDone())
        {
            if(ocShapeDistanceCalculator.NbSolution() > 0)
            {
                // NOTE: returns only one but there might be multiple solutions
                return roundToTolerance(ocShapeDistanceCalculator.Value());
            }
        }

        ocShapeDistanceCalculator.delete();

        return null;
    }


     /** Calculate the closest distance between two Shapes: returns one or more straight Link Object, where start is from the first Shape 
     *      NOTE: If two Shapes are the same and parallel ( for example two Edges ) two links for each Vertex are returned
    */
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    _closestLinks(other:PointLikeOrAnyShapeOrCollection):Array<Link>
    {
        // see OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/_b_rep_extrema___support_type_8hxx.html#a8988c48b5bdfea2011304a322a4e78b7
        const SUPPORT_TYPE_TO_AY_TYPE = ['Vertex', 'Edge', 'Face'];

        let otherShape:AnyShape; 
        if (isPointLike(other))
        {
            otherShape = new Vertex(other as PointLike);
        }
        else if(isAnyShapeCollection(other))
        {
            console.warn(`Shape:_closestLinks: Links with ShapeCollections not fully implemented!`)
            otherShape = (other as ShapeCollection).first();
        }
        else {
            otherShape = other as AnyShape;
        }
        
        // no distance
        if(this.distance(otherShape) == 0)
        {
            console.warn(`Shape::_closestLinks: The two Shapes are touching! Used the center of intersection geometry`)
            let touchPoint = this.closest(other as AnyShapeOrCollection);
            let link:Link = {
                from: touchPoint,
                to: touchPoint,
                fromSupport: null, // TODO
                toSupport: null, // TODO
                fromParams : null, // TODO
                toParams : null, // TODO
                distance: 0
            }
            return [link];
        }

        // OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_b_rep_extrema___dist_shape_shape.html 
        // interesting: The algoritm can give the type of point ( on Vertex, Edge etc ). See: SupportOnShapeX
        let shapeDistanceCalculator = new this._oc.BRepExtrema_DistShapeShape_2(
            this._ocShape, 
            otherShape._ocShape,
            this._oc.Extrema_ExtFlag.prototype.constructor.Extrema_ExtFlag_MINMAX, 
            this._oc.Extrema_ExtAlgo.prototype.constructor.Extrema_ExtAlgo_Grad,
            new this._oc.Message_ProgressRange_1()
            );


        let links:Array<Link> = [];

        shapeDistanceCalculator.Perform(new this._oc.Message_ProgressRange_1());

        if (shapeDistanceCalculator.IsDone())
        {
            for( let i = 0; i < shapeDistanceCalculator.NbSolution(); i++ )
            {

                // !!!! PARAM DATA DISABLED: SAME BUG WITH WRITING TO NUMBERS !!!!
                
                let fromU:number = -1.0;
                let toU:number = -1.0;
                let fromV:number = -1.0;
                let toV:number = -1.0;

                let link:Link = {
                    from: new Point()._fromOcPoint(shapeDistanceCalculator.PointOnShape1(i+1)),
                    to: new Point()._fromOcPoint(shapeDistanceCalculator.PointOnShape2(i+1)),
                    fromSupport: new Shape()._fromOcShape(shapeDistanceCalculator.SupportOnShape1(i+1)).specific() as Vertex|Edge|Face,
                    toSupport: new Shape()._fromOcShape(shapeDistanceCalculator.SupportOnShape2(i+1)).specific() as Vertex|Edge|Face,
                    fromParams: [fromU, fromV],
                    toParams: [toU, toV],
                    distance: shapeDistanceCalculator.Value()
                }
                links.push(link);
            }

        }

        if (links.length == 0)
        {
            console.error(`Shape::links: No links between the two Shapes!`);
        }
        
        return links;

    }

    /** Returns a Link that is the shortest path from current Shape to the other  */
    // TODO: Add also ShapeCollection
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    distanceLink(other:PointLikeOrAnyShapeOrCollection):Link
    {
        if (isPointLike(other))
        {
            other = new Point(other as PointLike)._toVertex();
        }

        if (isAnyShape(other)) // single Shape
        {

        }
        let links = this._closestLinks(other as PointLikeOrAnyShapeOrCollection);
        return  (links.length > 0) ? links[0] : null; 
    }

    /** Returns the Vector of closest path from current Shape to the other */
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    distanceVec(other:PointLikeOrAnyShapeOrCollection):Vector
    {
        let link = this.distanceLink(other);
        
        if (!link)
        {
            console.error(`Shape::distanceVec: Could not get the link from this Shape to the other!`);
            return null;
        }

        return link.to.toVector().subtracted(link.from);
    }

    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    distanceX(other:PointLikeOrAnyShapeOrCollection):number
    {
        return this._distanceAxis(other, 'x');
    }

    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    distanceY(other:PointLikeOrAnyShapeOrCollection):number
    {
        return this._distanceAxis(other, 'y');
    }

    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    distanceZ(other:PointLikeOrAnyShapeOrCollection):number
    {
        return this._distanceAxis(other, 'z');
    }

    @checkInput(['PointLikeOrAnyShapeOrCollection', isMainAxis], ['auto','auto'])
    _distanceAxis(other:PointLikeOrAnyShapeOrCollection, axis:MainAxis):number
    {
        let dv = this.distanceVec(other);
        return (dv) ? dv[axis as keyof Vector] : null;
    }

    /** Get the shortest lines from Shape to the other */
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    links(other:PointLikeOrAnyShapeOrCollection):Array<Link>
    {
        return this._closestLinks(other);
    }

    /** Get closest Point on the other Shape */
    @checkInput('AnyShapeOrCollection', 'auto')
    closest(other:AnyShapeOrCollection):Point
    {
        // if intersecting
        let intersections = this._intersections(other);
        if (intersections != null)
        {
            let closestShape = intersections.first(); 
            return closestShape.center().toPoint();
        }
        else {
            let links = this._closestLinks(other);

            if (links)
            {
                return links[0].to;
            }

        }
        
        return null
    }
    
    /* Closest Vertex of this Shape to another PointLike */
    @checkInput('PointLike', 'Vertex')
    closestVertex(to:PointLike):IVertex
    {
        let v = to as Vertex; // auto converted

        let allVerts = this.vertices().toArray(); // convert ShapeCollection to Array
        let closestVertex = allVerts[0];
        let closestDistance = 99999999;
        allVerts.forEach( curVert => { 
            let d = curVert.distance(v); 
            if (d < closestDistance )
            {
                closestDistance = d;
                closestVertex = curVert
            }
        })
        
        return closestVertex as Vertex;
    }

    /* Private Subtract Shapes from this Shape and return a new Shape */
    @protectOC('')
    @checkInput('AnyShapeOrCollection', 'ShapeCollection')
    _subtracted(others:AnyShapeOrCollection):AnyShapeOrCollection
    {
        // IMPORTANT: subtract can yield multiple Shapes in a ShapeCollection
        let cutShapesCollection:AnyShapeCollection = others as ShapeCollection; // auto converted

        // Hack a little height for operant Faces
        this._solidifyOperantFaces(cutShapesCollection);
        
        let result = this._ocShape;
        // subtract every Shape from the main and update the result
        cutShapesCollection.forEach(shape => 
        {

            // protect against weird crashed of OC under heavy load
            let ocCutter = new this._oc.BRepAlgoAPI_Cut_3(result, shape._ocShape,  new this._oc.Message_ProgressRange_1());
            ocCutter.SetRunParallel(false); // Does not seem to work!
            ocCutter.SetFuzzyValue(0.1);
            ocCutter.Build(new this._oc.Message_ProgressRange_1());
            
            if (ocCutter.HasErrors())
            {
                console.warn('Shape::_subtracted: Error cutting: Returned original Shape!');
            }
            else {
                result = ocCutter.Shape();
            }
        });

        let fusor = new this._oc.ShapeUpgrade_UnifySameDomain_2(result, true, true, false); 
        fusor.Build();
        let newOcShape:any = fusor.Shape();

        let newShape = new Shape()._fromOcShape(newOcShape) as AnyShape; // we expect only a single Shape

        return newShape;
    }

    /* Subtract Shapes from this Shape and return a new Shape */
    @addResultShapesToScene
    @checkInput('AnyShapeOrCollection', 'ShapeCollection')
    subtracted(others:AnyShapeOrCollection):AnyShapeOrCollection
    {
        return this._subtracted(others);
    }

    /* Subtract Shapes from this Shape and update current Shape */
    @checkInput('AnyShapeOrCollection', 'ShapeCollection')
    subtract(others:AnyShapeOrCollection, removeOthers=false):AnyShapeOrCollection
    {
        let newShape = this._subtracted(others);
        
        // Subtracted never changes the Shape type, we can just replace the OC geometry
        if (newShape == null)
        {
            console.warn(`Shape::cut: Cut operation gave back a empty Shape!`);
            return this;
        }

        this._ocShape = (newShape as Shape)._ocShape;

        // remove the operants if set
        if (removeOthers)
        {   
            (others as ShapeCollection).removeFromScene();
        }

        return this;
    }


    /** Cutting in OC with two Faces does not work
     *  We hack a little by giving a slight height to the operants 
     */
    @checkInput('AnyShapeCollection', 'ShapeCollection')
    _solidifyOperantFaces(others:AnyShapeCollection):AnyShapeCollection
    {
        const EXTRUDE_HEIGHT = 0.1;

        let extrudedOthers = new ShapeCollection();

        // We got a possible Face-Face cut: Extrude operant faces and little bit
        others.forEach( shape => 
        {
            if(this.type() == 'Face' && shape.type() == 'Face')
            {
                extrudedOthers.add(shape._extruded(EXTRUDE_HEIGHT));
            } 
            else {
                extrudedOthers.add(shape);
            }
        });

        return extrudedOthers;
    }

    /** Unions one with another Shape (Private method without adding to Scene) */
    @checkInput('AnyShape', 'auto')
    _unioned(other:AnyShape):AnyShapeOrCollection
    {
        // NOTE: Face Face operations don't work (anymore) - even with solidifying the operants: now use a own method
        
        let otherShape:AnyShape = other as AnyShape;
        if(this.type() == 'Face' && other.type() == 'Face')
        {
            // check normals
            let thisFace = this as any as Face;
            let otherFace = other as Face;
            if (thisFace.isPlanar() && otherFace.isPlanar())
            {
                if( thisFace.normal().reversed().equals(otherFace.normal()))
                {
                    // reverse other
                    otherFace.reverse();
                }
            }
        }
        else if (this.type() != 'Face' && other.type() == 'Face')
        {
            otherShape = this._solidifyOperantFaces(new ShapeCollection(other)).first(); 
        }

        if (!otherShape)
        {
            console.error(`Shape::unioned: Error checking operants for Faces. Returned original!`)
            return null;
        }

        let fuser = new this._oc.BRepAlgoAPI_Fuse_3(this._ocShape, otherShape._ocShape, new this._oc.Message_ProgressRange_1());
        fuser.SetFuzzyValue(0.001);
        fuser.Build(new this._oc.Message_ProgressRange_1());
        let combined = fuser.Shape();

        let s = new Shape()._fromOcShape(combined)
        if (!s)
        {
            console.warn(`Shape::unioned: No correct result for union! Returned original Shape`);
            return this;
        }
        
        s = s.specific(); // can be a Shape or ShapeCollection
        
        // test the result
        if (isAnyShape(s))
        {
            return (s as AnyShape)._unifyDomain();
        }
        else {
            // 1 or multiple Shapes
            if( (s as ShapeCollection).count() > 1)
            {
                let shapeCollection = s as ShapeCollection;
                console.warn(`Shape::union: Union resulted in multiple Shapes: trying to sew!`);
                let sewedShape = shapeCollection._sewed();

                if ( !(sewedShape instanceof ShapeCollection))
                {
                    // successfull sew
                    (sewedShape as Shape)._unifyDomain(); // fuse Face and Edges that are in the same domain
                }
                else 
                {
                    console.warn(`Shape::Union: sew was unsuccesfull: this Shape changes into a ShapeCollection after union`);
                }
                
                // Replace original Shape or ShapeCollection
                return sewedShape.checkDowngrade(); // avoid Shells with one Face
            }
        }

    }

    /** Unions one with another Shape */
    @addResultShapesToScene
    @checkInput('AnyShape', 'auto')
    unioned(other:AnyShape):AnyShapeOrCollection
    {
        return this._unioned(other);
    }

    /** Alias for unioned */
    @addResultShapesToScene
    @checkInput('AnyShape', 'auto')
    combined(other:AnyShape):AnyShapeOrCollection
    {
        return this._unioned(other);
    }

    /** Alias for unioned */
    @addResultShapesToScene
    @checkInput('AnyShape', 'auto')
    added(other:AnyShape):AnyShapeOrCollection
    {
        return this._unioned(other);
    }

    /** Alias for unioned */
    @addResultShapesToScene
    @checkInput('AnyShape', 'auto')
    fused(other:AnyShape):AnyShapeOrCollection
    {
        return this._unioned(other);
    }

    /** Alias for unioned */
    @addResultShapesToScene
    @checkInput('AnyShape', 'auto')
    merged(other:AnyShape):AnyShapeOrCollection
    {
        return this._unioned(other);
    }

    /** Same as unioned but replacing current Shape in Obj */
    @checkInput('AnyShape', 'auto')
    union(other:AnyShape):AnyShapeOrCollection
    {
        let unionedShape = this._unioned(other);
        this.replaceShape(unionedShape);
        return unionedShape;
    }

    /** Alias for union */
    @checkInput('AnyShape', 'auto')
    combine(other:AnyShape):AnyShapeOrCollection
    {
        return this.union(other);
    }

    /** Alias for union */
    @checkInput('AnyShape', 'auto')
    add(other:AnyShape):AnyShapeOrCollection
    {
        return this.union(other);
    }

    /** Alias for union */
    @checkInput('AnyShape', 'auto')
    merge(other:AnyShape):AnyShapeOrCollection
    {
        return this.union(other);
    }

    /** Alias for union */
    @checkInput('AnyShape', 'auto')
    fuse(other:AnyShape):AnyShapeOrCollection
    {
        return this.union(other);
    }

    /** Split current Shape into multiple ones using the given other Shapes (Private method: without adding to Scene)
     *     The other Shapes are removed after the operation
     */
    @checkInput([['AnyShapeOrCollection', null],['Boolean', false]], ['ShapeCollection', 'auto'])
    _splitted(others:AnyShapeOrCollection, excludeOverlapping?:boolean):AnyShapeOrCollection
    {
        /* OC docs:
            * https://dev.opencascade.org/doc/refman/html/class_b_o_p_algo___splitter.html
            * https://documentation.help/Open-Cascade/occt_user_guides__boolean_operations.html#occt_algorithms_8
        */

        const OVERLAP_PERC_TOLERANCE = 0.05; // For filtering out results that overlap with operants

        let thisCollection = new ShapeCollection(this);
        let otherCollection = others as ShapeCollection; // auto-converted by @checkInput

        let ocSplitter = new this._oc.BOPAlgo_Splitter_1();
        
        ocSplitter.SetArguments(thisCollection._toOcListOfShape()); // the main Shape(s)
        ocSplitter.SetTools(otherCollection._toOcListOfShape());
        ocSplitter.Perform(new this._oc.Message_ProgressRange_1());
        let ocShape = ocSplitter.Shape();
        
        let splitShapes = new ShapeCollection(new Shape()._fromOcShape(ocShape));

        // if flag set, don't include the results that overlap with operant others
        if(splitShapes.length && excludeOverlapping)
        {
            return new ShapeCollection((splitShapes as ShapeCollection)
                    .filter((s) => {
                        // filter out result splitted Shapes that overlap with any of the operant Shapes
                        return !otherCollection.toArray().some( o => s.overlapPerc(o) > OVERLAP_PERC_TOLERANCE)
                    }))
                    .checkSingle();
        }
        
        return splitShapes.checkSingle();
    }

    /** Split current Shape into multiple ones using the given other Shapes */
    @addResultShapesToScene
    @checkInput([['AnyShapeOrCollection', null],['Boolean', false]], ['ShapeCollection', 'auto'])
    splitted(others:AnyShapeOrCollection,  excludeOverlapping?:boolean):AnyShapeOrCollection
    {
        return this._splitted(others, excludeOverlapping);
    }

    @checkInput([['AnyShapeOrCollection', null],['Boolean', false]], ['ShapeCollection', 'auto'])
    split(others:AnyShapeOrCollection, excludeOverlapping:boolean):AnyShapeOrCollection
    {
        let splittedShape = this._splitted(others, excludeOverlapping);
        this.replaceShape(splittedShape)
        return splittedShape;
    }

    /** Limit a Shape by others: Always returns a single Shape of the same type 
     *   @param others - If not given we get all intersecting Shapes
    */
    // @checkInput(isAnyShapeOrCollection, ShapeCollection) - For now do this by manually - TODO: implement allowing nulls in check func values
    capped(others:AnyShapeOrCollection = null):AnyShape
    {
        let othersCollection = new ShapeCollection();

        if( isAnyShape(others) && others.type() == 'Solid')
        {
            console.error(`Shape::capped: Not implemented for Solids yet!!`);
            return null;
        }

        if(others == null)
        {
            othersCollection = this.intersecting(); // Getting all Shapes that intersect with current
        }
        else {
            othersCollection = new ShapeCollection(others); // Convert Shape, Arrays to ShapeCollection
        }

        // do a split
        let splittedShapes = new ShapeCollection(this.splitted(othersCollection)); // can result single or ShapeCollection: convert to ShapeCollection

        /* A split operation can result in a higher order Shape, like Face => Shell
            We need to get the original Shape type and return the biggest one! */ 
        let originalTypeShapes:AnyShapeCollection = splittedShapes.getShapesByType(this.type());

        if (originalTypeShapes.length == 0)
        {
            console.warn(`Shape::capped: No intersecting Shapes found: returned original Shape!`);
            return this;
        }

        let orderFunc = (['Edge', 'Wire'].includes(this.type())) ? 'length' : 'area';

        let sortedShapes = originalTypeShapes.sort( (s1:AnyShape,s2:AnyShape) => (s2 as any)[orderFunc]() - (s1 as any)[orderFunc]() ); // descending - NOTE: some any to fix TS errors (for now)

        return sortedShapes[0]; // return the first

    }

    /** Cut off Shapes orthogonally by a plane with normal parallel to axis and at level and keep the largest piece */
    @checkInput([['MainAxis', 'x'],['Number', 0]], ['auto', 'auto'])
    cutoff(axisNormal?:MainAxis, level?:number)
    {
        const bb = this.bbox();
        if(!bb.hasAxes().includes(axisNormal)){ throw new Error(`Shape::cutoff: Shape can not be cut off: It has no size on axis "${axisNormal}"!`);}

        const minLevel = bb.min()[axisNormal];
        const maxLevel = bb.max()[axisNormal];

        if(level <= minLevel || level >= maxLevel){ 
            console.error(`Shape::cutoff: Shape can not be cut off: level "${level}" not between "${minLevel}" and "${maxLevel}". Returned original`);
            return this
        }

        const cutDirection = ((maxLevel - level) < (level - minLevel)) ? 1 : -1; // NOTE: take off part of Shape with least size
        const planeSizes = ['x','z','y'].filter(a => a !== axisNormal); // NOTE: order is important

        const pw = bb.sizeAlongAxis(planeSizes[0] as MainAxis) || 100; // make sure cutplane has size on both axis
        const pd = bb.sizeAlongAxis(planeSizes[1] as MainAxis) || 100;
        const cutPlaneNormal = new Vector(AXIS_TO_VECS[axisNormal]).scaled(cutDirection)
        const cutPlane = new Face().makePlane(
            pw,
            pd,
            bb.center()['set'+ axisNormal.toUpperCase()](level), // a bit ugly - setting the {axisNormal} coordinate to level using Point.setX/Y/Z() methods
            cutPlaneNormal
            )
        const extrudeAmount = Math.abs(level - this.bbox()[((cutDirection === 1) ? 'max' : 'min') + axisNormal.toUpperCase()]());
        const cutSolid = cutPlane._extruded(extrudeAmount + 1, cutPlaneNormal); // NOTE: make cutSolid a bit bigger
        return this.subtract(cutSolid);
    }


    //// ALIGNMENTS WITH OTHER SHAPES ////

    _alignPerc(a:Alignment='center'):Array<number>
    {
        return (!isPointLike(a)) ? 
                this._alignStringToAlignPerc(a as string) : 
                new Point(a).toArray();
    }

    /** 
     *  Align a given Shape to another by supplying a pivot for current Shape, another Shape and the alignment
     *  For the pivot and alignment you can supply either a string with the combinations of sides (left,right,front,back,bottom,top)
     *  or a array of percentage offsets to [left,front,bottom] corner or Shape
     *  and for linear Shapes (Edge,Wire) also start and end !!!! TODO !!!!
     */
    @checkInput(['AnyShape',['Pivot','center'],['Alignment', 'center']],['auto','auto','auto'])
    align(other:AnyShape, pivot?:Pivot, alignment?:Alignment):this
    {
        const pivotAlignPerc:Array<number> = this._alignPerc(pivot);
        const alignmentPerc:Array<number> = this._alignPerc(alignment); // alignment inside other Shape

        let fromPosition = this.bbox().getPositionAtPerc(pivotAlignPerc).toVector();
        let toPosition = other.bbox().getPositionAtPerc(alignmentPerc).toVector();

        this.move(toPosition.subtracted(fromPosition)); //.move(pivotOffsetVec);

        return this;
    }

    /** Copy and then align */
    @checkInput(['AnyShape',['Pivot','center'],['Alignment', 'center']],['auto','auto','auto'])
    aligned(other:AnyShape, pivot?:Pivot, alignment?:Alignment):this
    {
        return this.copy().align(other, pivot, alignment);
    }

    @checkInput('Alignment', 'auto')
    _alignStringToAlignPerc(alignment:Alignment): Array<number>
    {
        const ALIGNMENT_TO_AXIS_OFFSET = {
            left : { axis : 'x', perc : 0.0},
            right : { axis : 'x', perc : 1.0},
            front : { axis : 'y', perc : 0.0},
            back : { axis : 'y', perc : 1.0},
            bottom : { axis : 'z', perc : 0.0},
            top : { axis : 'z', perc : 1.0},
        }
        const AXIS_TO_INDEX: {[key:string]:number} = { 'x' : 0, 'y' : 1, 'z' : 2 };
        const DEFAULT_ALIGNMENT: Array<number> = [0.5,0.5,0.5];

        if (!alignment)
        {
            return DEFAULT_ALIGNMENT;
        }

        alignment = (alignment as string).toLowerCase();
        let alignmentPerc = [...DEFAULT_ALIGNMENT];

        for (const [alignKey, alignConf] of Object.entries(ALIGNMENT_TO_AXIS_OFFSET))
        {
            if ( alignment.includes(alignKey) )
            {
                alignmentPerc[AXIS_TO_INDEX[alignConf.axis]] = alignConf.perc;
            }
        }

        return alignmentPerc;
    }

    /** Returns Point at percentage of Shape Bbox */
     @checkInput('PointLike', Vector) 
    _pointAtPerc(uvw:PointLike):Point
    {
        let uvwv = uvw as Vector; // auto converted

        let shapeBboxDiagonal:Vertex|Edge = this.bbox().diagonal();

        let diagonalVec = (shapeBboxDiagonal instanceof Edge ) ? 
                                shapeBboxDiagonal.direction(): 
                                new Vector(0,0,0);

        let startVec = this.bbox().corner('leftfrontbottom').toVector(); // TODO
        let pointAt = startVec.added( diagonalVec.scaled(uvwv)).toPoint();

        return pointAt;
    }

    /** Get a Point at a specific alignment (topbottom, left etc) */
    @checkInput([['Alignment',SHAPE_ALIGNMENT_DEFAULT]], ['auto'])
    pointAtSide(alignment:Alignment='center'):Point
    {
        // start and end on linear Shapes
        if ( ['start', 'end'].includes(alignment as string) && isLinearShape(this))
        {
            return this[alignment as keyof AnyShape]().toPoint();
        }
        else {
            let alignmentPerc:Array<number> = this._alignStringToAlignPerc(alignment);
            return this._pointAtPerc(alignmentPerc)
        }
    }

    //// CONTEXT PREDICATES ////

    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    intersects(other:PointLikeOrAnyShapeOrCollection):boolean
    {
        let intersections = this._intersections(other);
        
        return intersections != null && intersections.length > 0; // NOTE: all intersections return ShapeCollection
    }
    
    /** Returns the shared Shape between two Shapes (private) */
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    _intersections(others:PointLikeOrAnyShapeOrCollection):AnyShapeCollection // NOTE: we call it intersections() because user needs to expect multiple results
    {
        /**  
         *   IMPORTANT: OC does not offer a generic interface (unlike GEOS/JTS): we need to check the types and implement some special algorithms
         *   We tried a lot of things. Within specific Shapes there are specific methods ( Edge <-> Edge ) - these might be faster
         *   But for simplicy we decided on combined two methods:
         *      + _intersectionSection - using BRrepAlgoAPI_Section - for all Shapes that lower hierarchy than Face ( Vertex, Shapes )
         *      + _intersectionCommon - using BrepAlgoAPI_Common - if both Shapes are a Face or higher
         **/
        
        const TYPES_FOR_SECTION =  ['Vertex', 'Edge', 'Wire'];
        
        if(isPointLike(others))
        {
            others = new Point(others as Point)._toVertex(); 
        }

        if(isAnyShapeCollection(others))
        {
            let otherCollection = others as ShapeCollection;
            return otherCollection._intersections(this as any); // TODO: fix TS typing
        }
        
        if (TYPES_FOR_SECTION.includes(this.type()) && TYPES_FOR_SECTION.includes((others as AnyShape).type()))
        {
            return this._intersectionsSection(others as AnyShapeOrCollection);
        }
        else
        {
            // IMPORTANT: from intersections with Faces onward ( Shells, Solids ) the BRepAlgoAPI_Common_3 algorithm works 
            return this._intersectionsCommon(others as AnyShapeOrCollection);
        }  
    }

    /** Returns the shared Shape between two Shapes */
    @addResultShapesToScene
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    intersections(others:PointLikeOrAnyShapeOrCollection):AnyShapeCollection // NOTE: we call it intersections() because user needs to expect multiple results
    {
        return this._intersections(others);
    }

    @addResultShapesToScene
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    intersection(others:PointLikeOrAnyShapeOrCollection):AnyShape
    {
        let i = this._intersections(others)?.first();
        return (!i) ? null : i;
    }

    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    _intersection(others:PointLikeOrAnyShapeOrCollection):AnyShape
    {
        let i = this._intersections(others)?.first();
        return (!i) ? null : i;
    }

    /** Return first Shape of intersections as copy */
    @addResultShapesToScene
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    intersected(others:PointLikeOrAnyShapeOrCollection):AnyShape
    {
        let intersections = this._intersections(others);
        return intersections.first();
    }

    /** Return first Shape of intersections and replace current Shape */
    @addResultShapesToScene
    @checkInput('PointLikeOrAnyShapeOrCollection', 'auto')
    intersect(others:PointLikeOrAnyShapeOrCollection):AnyShape
    {
        let intersections = this._intersections(others);
        if (intersections)
        {
            let newShape = intersections.first();
            this.replaceShape(newShape);
            return newShape;
        }
        return null;
    }

    /** Calculate intersection with Section algorithm: This works for all Shape types but only returns Vertices or Edges */
    @checkInput('AnyShapeOrCollection', 'auto')
    _intersectionsSection(other:AnyShapeOrCollection):AnyShapeCollection
    {
        if(other instanceof ShapeCollection)
        {
            console.error('Shape::_intersectionSection: intersection with ShapeCollection not implemented yet!');
            return null;
        }

        // if Shapes are the same instance return itself (OC returns null)
        if(this.same(other))
        {
            return new ShapeCollection(this);
        }

        // OC docs: https://dev.opencascade.org/doc/refman/html/class_b_rep_algo_a_p_i___section.html#a5980af65e4ecfd71403072430555eaf4
        let ocSectionBuilder = new this._oc.BRepAlgoAPI_Section_3(this._ocShape, other._ocShape, false); // PerformNow
        ocSectionBuilder.SetNonDestructive(true);
        ocSectionBuilder.SetFuzzyValue(0.1);
        ocSectionBuilder.Build(new this._oc.Message_ProgressRange_1());

        /* NOTE: we can actually have a lot of result types here: 
            - single Shapes: Vertex or Edges
            - multiple Shapes extracted from ShapeCompound
            
            Use the magic of ShapeCollections to bring all those into one API

        */

        let ocShape = ocSectionBuilder.Shape();
        let intersected = new Shape()._fromOcShape(ocShape); // _fromOcShape: can return AnyShape or ShapeCollection or null

        return (intersected == null) ? null : new ShapeCollection(intersected); // even a ShapeCollection as arg is flattened

    }

    /** Calculate intersection between Shapes ( from Face onward ) based on Common algoritm */
    @checkInput('AnyShapeOrCollection', 'auto')
    _intersectionsCommon(other:AnyShapeOrCollection):AnyShapeCollection
    {
        if(other instanceof ShapeCollection)
        {
            console.error('Shape::_intersectionsCommon: intersection with ShapeCollection not implemented yet!');
            return null;
        }

        let intersectedCommon = new this._oc.BRepAlgoAPI_Common_3(this._ocShape, other._ocShape, new this._oc.Message_ProgressRange_1());
        intersectedCommon.SetOperation( this._oc.BOPAlgo_Operation.prototype.constructor.BOPAlgo_COMMON );
        intersectedCommon.SetFuzzyValue(0.1);
        intersectedCommon.Build(new this._oc.Message_ProgressRange_1());

        let ocShape = intersectedCommon.Shape();
        let intersected = new Shape()._fromOcShape(ocShape); // can be a single Shape or ShapeCollection or null


        // It looks like this also does not work if intersection of Faces is a Vertex or Edges: backup with the Section method
        return (intersected === null) ? this._intersectionsSection(other) : new ShapeCollection(intersected);
        
    }

    /** Tests if two Shape overlap: meaning the two Shapes have at least on Vertex in common  */
    @checkInput('AnyShape', 'auto')
    overlaps(other:AnyShape):boolean 
    {
        return (this._intersections(other) != null ) ? true : false;
    }

    /** Get amount of overlap [0-1] between this shape and given other */
    @checkInput('AnyShape', 'auto')
    overlapPerc(other:AnyShape):number
    {
        let overlappingVolume = 0.0;
        const intersections = this._intersections(other);
        // NOTE: Shapes can have multiple intersections
        if(!intersections){  return overlappingVolume; }

        intersections.forEach(intersectionShape => 
        {
            overlappingVolume += intersectionShape.volume();
        })

        const thisVolume = this.volume();
        return (thisVolume) ? overlappingVolume / this.volume() : 0.0; // avoid divide by zero
    }

    /** Test if a one Shape completely contains the other. 
     *  If other is ShapeCollection test if all its Shapes are contained by current Shape 
     * */
    /* !!!! IMPORTANT: This is not tolerance proof
        Can we use something like maxDistance()?
        or: BRepExtrema_DistShapeShape

        TODO: optimize this for performance. It's slow!
    */
    @checkInput('AnyShapeOrCollection', 'auto')
    contains(other:AnyShapeOrCollection):boolean
    {
        let others = new ShapeCollection(other);
        let intersectionShapes = this._intersections(others);

        return intersectionShapes.equals(others)
    }

    /** Check if this Shape is parallel with the other - the specific meaning of this is different for each Shape Type */
    @checkInput('AnyShape', 'auto')
    parallel(other:any):boolean
    {
        console.warn(`Shape::parallel: Parallel is not implemented for this Shape of type ${this.type()}. It probably does not make sense`);
        return false;
    }
    
    /** Get all Shapes in Scene that are intersecting with this Shape */
    @checkInput('AnyShape', 'auto')
    intersecting():AnyShapeCollection
    {
        let sceneShapes:AnyShapeCollection = this._geom.allShapes(); // get all Shapes in scene
        let intersectingShapeCollection = sceneShapes.filter(shape => (shape as AnyShape)._intersections(this) != null );

        return intersectingShapeCollection;
    }

    @checkInput('AnyShape', 'auto')
    overlapping():AnyShapeCollection
    {
        // Alias for now
        return this.intersecting();
    }

    /** Cast a 'Ray' (infinite Line) towards the Shape and Link information ( the hit point and support topography: Vertex, Edge, Face) */
    @checkInput('Edge', 'auto')
    raycast(ray:IEdge):Link
    {
        const SCAN_LENGTH = 1000;

        let rayEdge = ray.extended(SCAN_LENGTH); // BEWARE: make a copy: or it will interfere with rendering!

        let closestIntersection:Vertex = null;
        let closestDistance:number = null;
        let closestSupportEdge:IEdge = null;
        
        this.edges().forEach( curEdge => 
        {
            let intersections = rayEdge._intersections(curEdge);
            if (intersections != null)
            {
                let firstShape = intersections.first();
                if(intersections.first() instanceof Edge)
                {
                    // edge of Shape is overlapping with rayEdge: don't add this Edge: It's not in view
                }
                else 
                {
                    // first iteration
                    if ( (firstShape as Vertex).equals(curEdge.start()) || (firstShape as Vertex).equals(curEdge.end()))
                    {
                        // !!!! ONLY WORKS FOR STRAIGHT EDGES !!!!
                        // we hit an Edge directly on it's start or end Vertices
                        console.warn(`Shape::raycast: Hit on a Vertex: Counts as no hit!`);
                    }
                    else 
                    {
                        if (closestIntersection == null)
                        {
                            closestIntersection = (firstShape as Vertex);
                            closestDistance = rayEdge.start().distance(firstShape as Vertex);
                            closestSupportEdge = curEdge;
                        }
                        else {
                            let d = (firstShape as Vertex).distance(rayEdge.start());
                            if (closestDistance >  d){
                                closestDistance = d;
                                closestIntersection = (firstShape as Vertex);
                                closestSupportEdge = curEdge;
                            }
                        }
                    }
                }

            }
        })

        if (closestIntersection == null)
        {
            console.warn(`Shape::raycast: No hit found!`)
            return null;
        }

        // we pack all information in a Link
        let link:Link = {
            from: rayEdge.start().toPoint(),
            to: closestIntersection.toPoint(),
            fromSupport: rayEdge.start(),
            toSupport: closestSupportEdge,
            fromParams: null,  // TODO
            toParams: null, // TODO
            distance: closestDistance
        } 

        return link;
    }

    //// REPEATING SHAPES AND GENERATING ONES ////

    /** 
     *  Populate Shape (linear: Edge/Wire, planar: Face, Shell and solid) with Vertices
     *  Resulting Vertices include start and end Vertices
     */
    @checkInput( [ [Number,10] ], [ Number] )
    populated(num?:number):AnyShapeCollection 
    {
        // This method get overriden by subclasses - otherwise show error message!
        console.error(`Shape::populate: **** TO BE IMPLEMENTED ****. Sorry population does not yet work with Shape type "${this.type()}"!`);
    
        return null;
    }

    /** Copy current Shape a number of times along X,Y,Z axis with a given spacing */
    @checkInput([ ['PointLike', [2,1,1] ], ['PointLike', [0,0,0]] ], ['Point', 'Point'])
    array(sizes?:PointLike, offsets?:PointLike):AnyShapeCollection
    {
        /* 
            usage:
            shape.array(5,500); // 5 in x-axis offset 500
            shape.array([5,3,10],[500,300,400])
        */

        let sizesPoint =  sizes as Point;
        let offsetsPoint = offsets as Point;
        
        // default size 
        sizesPoint.x = sizesPoint.x || 1; // always at least 1
        sizesPoint.y = sizesPoint.y || 1; 
        sizesPoint.z = sizesPoint.z || 1;

        offsetsPoint.x = offsetsPoint.x || SHAPE_ARRAY_DEFAULT_OFFSET;
        offsetsPoint.y = offsetsPoint.y || 1;
        offsetsPoint.z = offsetsPoint.z || 1;

        let xArrColl = this._array1D(sizesPoint.x, new Vector(1,0,0).scaled(offsetsPoint.x) );
        let yArrColl = xArrColl._array1D(sizesPoint.y, new Vector(0,1,0).scaled(offsetsPoint.y) );
        let zArrColl = new ShapeCollection([xArrColl, yArrColl])._array1D(sizesPoint.z, new Vector(0,0,1).scaled(offsetsPoint.z) );

        return new ShapeCollection(zArrColl); // combine all directions

    }

    /** Copy Shape a number of times by spacing by a certain offset Vector  */
    @checkInput([ Number, 'PointLike' ], [Number, 'Vector'])
    _array1D(size:number, offset:PointLike):AnyShapeCollection
    {
        let shapes = new ShapeCollection();
        shapes.add(this) // Don't include original Shape (start at index 1), but do add to array
        for(let i = 1; i < size; i++) 
        {
            let newShape = this.moved( (offset as Vector).scaled(i)); // offset is auto converted
            shapes.add(newShape);
        }

        return shapes;
    }

    /** Alias for array along x-axis */
    @checkInput([[Number, 5],[Number, 100]], [Number, Number])
    arrayX(size?:number, offset?:number)
    {
        return this._array1D(size, new Vector(1,0,0).scale(offset))
    }

    /** Alias for array along y-axis */
    @checkInput([[Number, 5],[Number, 100]], [Number, Number])
    arrayY(size?:number, offset?:number)
    {
        return this._array1D(size, new Vector(0,1,0).scale(offset))
    }

    /** Alias for array along z-axis */
    @checkInput([[Number, 5],[Number, 100]], [Number, Number])
    arrayZ(size?:number, offset?:number)
    {
        return this._array1D(size, new Vector(0,0,1).scale(offset))
    }

    /** Copies a Shape along a linear path */
    @checkInput(['LinearShape', Number, Boolean], ['auto','auto','auto'])
    arrayAlong(path:IEdge|Wire, num:number, align:boolean=false)
    {
        if( !['Edge','Wire'].includes(path.type()))
        {
            // another path Shape then a linear one
            console.error(`Shape::arrayAlong: Sorry for not this can only work on an Edge or a Wire path! Given a ${this.type()}`);
            return this;
        }

        let arrayCollection = new ShapeCollection();
        let verticesOnPath:AnyShapeCollection = path.populated(num);

        verticesOnPath.forEach( vertex => 
        {
            let newShape = this.copy().moveTo(vertex) as Shape;
            arrayCollection.add(newShape);
            // align to path
            // !!!! VERY SLOW !!!!
            if(align)
            {
                let normalAtVertex = path.normalAt(vertex);
                newShape.alignByPoints(
                        [ newShape.center(),newShape.center().add([1,0,0])], // x-axis
                        [ vertex,vertex.toVector().add(normalAtVertex)],
                    )
            }
        });

        return arrayCollection;
    }

    //// SHAPECOLLECTION API ////
    /** TODO: offer some forgiveness for treating a Shape like a ShapeCollection? 
     *      - filter
     *      - first()
    */
    

    //// UTILS ////

    /** Get all geometries in this shape, you can specify the types (Vertex, Edge, Wire etc) */
    @checkInput('ShapeType', 'auto')
    _getEntities(type:ShapeType):AnyShapeCollection
    {
        if (this.isEmpty())
        { 
            console.warn('Shape::_getEntities: Cannot give entities of empty Shape!');
            return null;
        }
        
        let ocShapes:Array<any> = this._getOcShapesByType(this._ocShape, type);
        let shapes:Array<Shape> = [];

        ocShapes.forEach( ocShape => {
            let specifiedShape = this._fromOcShape(ocShape) as any;  // NOTE: avoid TS errors
            // NOTE: we keep track of main Shape in _parent
            specifiedShape._parent = this;
            shapes.push(specifiedShape as Shape);
        });

        let shapeCollection = new ShapeCollection(shapes);

        return shapeCollection;
    }

    /** Get all subshapes of given type and those of lower types */
    _getEntitiesDownFromType(type:ShapeType):AnyShapeCollection
    {
        const SHAPE_TYPES_DOWN = ['Solid', 'Shell', 'Face', 'Wire', 'Edge', 'Vertex'];
        let selectTypes = SHAPE_TYPES_DOWN.slice(SHAPE_TYPES_DOWN.indexOf(type));
        let subShapes = new ShapeCollection();
        selectTypes.forEach(subShapeType => {
            subShapes.add(this._getEntities(subShapeType as ShapeType))
        })
        return subShapes;
    }

    /** Returns type of Shape in Archiyou class name: Vertex, Edge, Wire, Face, Shell etc */
    _shapeTypeEnumLookup(i:any):any
    {
        // see OC type enum: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/_top_abs___shape_enum_8hxx.html#a67b8aa38656811eaee45f9df08499667
        // We patched this in for Opencascade.js 2.0
        
        if (!Number.isInteger(i))
        {
            // probably a OC type enum
            try 
            {
                i = i.value;
            }
            catch (e)
            {   
                // do nothing
            }
        }

        return this.OC_SHAPE_ENUM_TO_CLASSNAME[i];
        
    }

    /** 
     * Make specific from general Shape
     * @param shape: oc.TopoDS_Shape
     * 
     **/
    _makeSpecificOcShape(ocShape:any, type:string=null):any // TODO: OC typing
    {
        const OC_CONSTUCTOR_BY_TYPE:{[key:string]:any} = {
            'Vertex' : this._oc.TopoDS.prototype.constructor.Vertex_1,
            'Edge' : this._oc.TopoDS.prototype.constructor.Edge_1,
            'Wire' : this._oc.TopoDS.prototype.constructor.Wire_1,
            'Face' : this._oc.TopoDS.prototype.constructor.Face_1,
            'Shell' : this._oc.TopoDS.prototype.constructor.Shell_1,
            'Solid' : this._oc.TopoDS.prototype.constructor.Solid_1,
        }

        const OC_SHAPE_TYPE_CLASSES:{[key:string]:any} = {
            'Vertex' : this._oc.TopoDS_Vertex,
            'Edge' : this._oc.TopoDS_Edge,
            'Wire' : this._oc.TopoDS_Wire,
            'Face' : this._oc.TopoDS_Face,
            'Shell' : this._oc.TopoDS_Shell,
            'Solid' : this._oc.TopoDS_Solid,
        }

        if(!type)
        {
            type = this.type();
        }

        // already the right instance
        if (ocShape instanceof OC_SHAPE_TYPE_CLASSES[type])
        {
            return ocShape;
        }

        if(!OC_CONSTUCTOR_BY_TYPE[type])
        {
            console.error(`Shape::_makeSpecificOcShape: Unknown type ${type}`);
            return null;
        }

        // avoid special cases where we got an Compound ocShape
        let ocShapeType = this._getShapeTypeFromOcShape(ocShape);

        if (ocShapeType === 'Compound' || ocShapeType === 'CompSolid')
        {
            return ocShape; // return original - will be picked up by _fromOcShape
        }

        if (ocShapeType != type)
        {
            throw new Error(`Shape::_makeSpecificOcShape: Cannot force Shape type ${type} on OC Shape of type ${ocShapeType}.`);
        }

        let specificOcTypeShape = OC_CONSTUCTOR_BY_TYPE[type](ocShape); // return specific Shape
        
        return specificOcTypeShape;
    }

    /** Sometimes we get a Shape instance - we can update that to the specific Shape class  */
    specific():AnyShape
    {
        const SPECIFIC_CLASS_BY_TYPE:{[key:string]:any} = {  // TODO: OC typing
            'Vertex' : Vertex,
            'Edge' : Edge,
            'Wire' : Wire,
            'Face' : Face,
            'Shell' : Shell,
            'Solid' : Solid
        }
        const FROM_OC_FUNC:{[key:string]:string} = {
            'Vertex' : '_fromOcVertex',
            'Edge' : '_fromOcEdge',
            'Wire' : '_fromOcWire',
            'Face' : '_fromOcFace',
            'Shell' : '_fromOcShell',
            'Solid' : '_fromOcSolid',
        }

        let SpecificClass = SPECIFIC_CLASS_BY_TYPE[this.type()];
        // !!!! IMPORTANT to call this function and not the generic _fromOcShape to set internal variables right !!!!
        let specificMakeFunc = FROM_OC_FUNC[this.type()]; 

        let specificShape = new SpecificClass()[specificMakeFunc](this._makeSpecificOcShape(this._ocShape, this.type()));

        return specificShape;
    }

    /** Sometimes we get a certain Shape with only one subshape: 
     *  like a Shell with only one Face, 
     *      - A Wire with only one Edge
     *      - An Edge with only one Vertex
     *   Then downgrade and return a new Shape
     *  */
    checkDowngrade():AnyShape
    {
        if(this instanceof Shell && this.faces().length == 1)
        {
            return new Face()._fromOcFace(this.faces().at(0)._ocShape); // faces() return ShapeCollection
        }
        else if(this instanceof Wire && this.edges().length == 1)
        {
            return new Edge()._fromOcEdge(this.edges().at(0)._ocShape);
        }
        else if(this instanceof Edge &&  this.vertices().length == 1 )
        {   
            return new Vertex()._fromOcVertex(this.vertices().at(0)._ocShape);
        }
        else {
            return this;
        }
    }

    /** Get the Shapes that this Shape consists of
     * 
     *  For example: Wire => [ Edge, Edge, Edge ]
     *                Shell => [ Face, Face ]
    */
    @checkInput('ShapeType', 'auto')
    getSubShapes(type:ShapeType):Array<Shape>
    {
        const TYPE_TO_FUNC:{[key:string]:string} = {
            'Vertex' : 'vertices',
            'Edge' : 'edges',
            'Wire' : 'wires',
            'Face' : 'faces',
            'Shell' : 'shells',
            'Solid' : 'solids',
         }

         return this[TYPE_TO_FUNC[type] as keyof Shape]();
    }

    
    /** Sometimes (for example in intersections) OCE returns a Compound Shape: Try to get real singular Shape */
    _extractShapesFromOcCompound(ocShape:any):AnyShapeOrCollection
    {
        let vertices = this._getOcShapesByType(ocShape, 'Vertex');
        let edges = this._getOcShapesByType(ocShape, 'Edge');
        let wires = this._getOcShapesByType(ocShape, 'Wire');
        let faces = this._getOcShapesByType(ocShape, 'Face');
        let shells = this._getOcShapesByType(ocShape, 'Shell');
        let solids = this._getOcShapesByType(ocShape, 'Solid');

        if (ocShape.IsNull() || ocShape.NbChildren() == 0)
        {
            //console.warn(`Shape::_extractShapesFromOcCompound: Encountered a empty OC Compound Shape! No Shape was created!`);
            return null;
        }
        else if (ocShape.NbChildren() == 1)
        {
            // clearly a Vertex
            if (edges.length == 0 && vertices.length == 1)
            {
                return this._fromOcShape(vertices[0]);
            }
            // clearly an Edge
            if (wires.length == 0 && edges.length == 1)
            {
                return this._fromOcShape(edges[0]);
            }
            // clearly a Wire
            if (faces.length == 0 && wires.length == 1)
            {
                return this._fromOcShape(wires[0]);
            }
            // clearly a Face
            if (faces.length == 1 && shells.length == 0)
            {
                return this._fromOcShape(faces[0]);
            }
            // clearly a Shell
            if (shells.length == 1 && solids.length == 0)
            {
                return this._fromOcShape(shells[0]);
            }
            // clearly a Solid
            if (solids.length == 1)
            {
                return this._fromOcShape(solids[0]);
            }
            else {
                console.error(`Shape::_extractShapesFromOcCompound: Cannot get real Shape in Compound!`);
                return null;
            }
            // TODO: more
        }
        else 
        {
            // we have multiple Shapes in this Compound
            // !!!! TODO: allow Compound Shape !!!!
            return this._shapeCollectionFromOcCompound(ocShape);
        }
    }

    _getOcShapesByType(ocShape:any, type?:string):Array<any> // TODO: OC typing
    {
          /* OC docs: 
                https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_top_exp___explorer.html 
                Also see about order of Vertices in Wire: https://dev.opencascade.org/content/exploring-vertices-topodsface
            */

          let ocShapeTypeEnum = (type) ? this.CLASSNAME_TO_SHAPE_ENUM[type] : this._oc.TopAbs_ShapeEnum.TopAbs_VERTEX; // all Shape types

          let shapeExplorer = new this._oc.TopExp_Explorer_2(ocShape, ocShapeTypeEnum, this._oc.TopAbs_ShapeEnum.TopAbs_SHAPE ); 
          
          let shapesHash:{[key:string]:boolean} = {}; // check to see if we got an specific entity already - TODO: OC typing
          let ocShapes = [];
  
          for (shapeExplorer.ReInit(); shapeExplorer.More(); shapeExplorer.Next()) 
          {
              let foundShape = shapeExplorer.Current(); // really make sure we have a specific OC shape like Shell etc, not TopoDS_Shape
              let hash = foundShape.HashCode(2147483647).toString();
              
              if(!shapesHash[hash])
              {
                let ocShape = this._makeSpecificOcShape(foundShape, type);
                ocShapes.push(ocShape)
                shapesHash[hash] = true; // really make sure we have a specific OC shape like Shell etc, not TopoDs_SHape
              }
          }

          return ocShapes;
    }


    _shapeCollectionFromOcCompound(ocShapeCompound:any)
    {
        /** OC Docs 
         * 
         *  - TopoDS_Iterator: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_topo_d_s___iterator.html
        */

        if(ocShapeCompound.NbChildren() <= 1)
        {
            console.error(`Shape:: _shapeCollectionFromOcCompound: Given Shape is not a Compound or has no Shapes within!`)
            return null;
        }

        let ocShapeIterator = new this._oc.TopoDS_Iterator_2(ocShapeCompound, true, true);
        let shapes = []; // gather AY Shapes here to form ShapeCollection

        while(ocShapeIterator.More())
        {
            let curOcShape = ocShapeIterator.Value();
            let shape = new Shape()._fromOcShape(curOcShape);
            shapes.push(shape);

            ocShapeIterator.Next()
        }

        if (shapes.length == 0)
        {
            console.error(`Shape::_shapeCollectionFromOcCompound: No Shapes in Compound detected!`);
        }

        return new ShapeCollection(shapes);

    }

    /** Check is a given string is a axis */
    _checkAxis(axis:string):boolean
    {
        const AXIS = ['x','y','z'];
        axis = axis.toLowerCase(); // don't care about capitalization
        axis = axis.replace('-', '');  // don't care about the minus sign
        if (!AXIS.includes(axis))
        {  
            console.error(`Shape::_checkAxis: Wrong axis. You supplied "${axis}" but only one of these : (${AXIS.join(',')}) are allowed!`);
            return false;
        }

        return true;
    }

    //// SELECTORS ////

    /** 
     *   Select parts of this Shape
     *
     *   examples: 
     *       cube.select('Edges|Z')
     *       cube.select('F>|front and F>|back) - multiple
     *   
     */
    @checkInput(String,'auto')
    select(selectString:string=null):AnyShape|AnyShapeCollection // NOTE: always return ShapeCollection for clarity
    {
        let selectedShapes:AnyShapeCollection = new Selector(this).select(selectString);
        selectedShapes.forEach( shape => shape._parent = this ); // keep reference to parent Shape

        return selectedShapes.checkSingle(); // return either ShapeCollection or single Shape
    }

    _axisAndPlanesToVector(axis:string):Vector
    {
        const AXIS_TO_VEC = {
            'xy' : [0,0,1],
            'yz' : [1,0,0],
            'xz' : [0,1,0],
            'x' : [1,0,0],
            'y' : [0,1,0],
            'z' : [0,0,1],
        }

        if ( (typeof axis) != 'string')
        {
            console.warn(`Shape::_axisAndPlanesToVector: Please supply a axis string: Use one of these: (${Object.keys(AXIS_TO_VEC).join(',')})`);
            return null;
        }

        axis = axis.toLowerCase().replace('-', ''); // remove minus sign also
        let vArr = AXIS_TO_VEC[axis];
        if (!vArr)
        {
            console.warn(`_axisAndPlanesToVector: Unknown axis given: "${axis}! Use one of these: (${Object.keys(AXIS_TO_VEC).join(',')})`);
            return null;
        }

        let vec = new Vector().fromAll(vArr);

        // use can also reverse with minus sign
        if(axis.includes('-'))
        {
            vec.reverse();
        }

        return vec;
        
    }

    /** Selector: ParallelTo 
        @param to - string with axis name (X|Y|Z) or Array with coords [X,Y,Z]
    */
    _selectorParallelTo(shapes:AnyShapeCollection, to:MainAxis|CoordArray):AnyShapeCollection
    {
        let toVec:Vector = (Array.isArray(to)) ? new Vector((to as Array<number>)) : this._axisAndPlanesToVector(to as string);

        let selectedShapes = (shapes.filter( s => s.parallel(toVec)));

        return new ShapeCollection(selectedShapes)
    }

    /** Selector: BiggestAlongAxis 
        Selects the Shape(s) that has the biggest coordinate along a certain axis - we use center and max
        @param alongAxis: x,y or z or -x,-y,-z
    */
    // TODO: @checkInput (own SelectorInput Type?)
    // TODO: NEEDS REFACTOR
    _selectorDistanceAlongAxis(shapes:AnyShapeCollection, alongAxis:string):AnyShapeCollection
    {
        if (shapes.length == 0 || !this._checkAxis(alongAxis))
        {
            return null;
        }

        alongAxis = alongAxis.toLowerCase();
        let minus = alongAxis.includes('-');
        alongAxis = alongAxis.replace('-', '');

        let sortedShapes:Array<AnyShape> = shapes._copy().sort( (s1,s2) => {
            let m1 = s1.max()[alongAxis] + s1.center()[alongAxis]; // NOTE: working only with max gives not really what we want
            let m2 = s2.max()[alongAxis] + s2.center()[alongAxis];

            return (!minus) ? (m2 - m1) : (m1 - m2); // descending order when not minus otherwise reverse
        }).all();  // convert to real array for robustness
        
        // We can actually have multiple Shapes that have the same max coordinate
        let selectedShapes = new ShapeCollection();
        let prevFurthest = null;
        for (let i = 0; i < sortedShapes.length; i++)
        {    
            let curShape = sortedShapes[i];
            let curFurthest = curShape.max()[alongAxis] + curShape.center()[alongAxis]

            if (i == 0 || curFurthest == prevFurthest)
            { 
              selectedShapes.add(curShape);
              prevFurthest = curFurthest;
            }
            else {
                break; 
            }
        }

        return selectedShapes;
    }
    
    @checkInput(['ShapeCollection', 'MainAxis'],['auto', 'auto'])
    _selectorOuterAlongAxis(shapes:AnyShapeCollection, alongAxis:MainAxis):AnyShapeCollection
    {
        return this._selectorDistanceAlongAxis(shapes, alongAxis);
    }   

    @checkInput(['ShapeCollection', 'MainAxis'],['auto', 'auto'])
    _selectorSmallestAlongAxis(shapes:AnyShapeCollection, alongAxis:MainAxis):AnyShapeCollection
    {
        return this._selectorDistanceAlongAxis(shapes, '-' + alongAxis);
    }

    /** Selects all Shapes that have positive coordinates along given axis */
    @checkInput(['ShapeCollection', 'MainAxis'],['auto', 'auto'])
    _selectorPositiveOnAxis(shapes:AnyShapeCollection, axis:MainAxis):AnyShapeCollection
    {
        return new ShapeCollection(shapes.filter( shape => shape.min(axis) >= 0 )); // force returning ShapeCollection
    }

    /** Selects all Shapes that have negative coordinates along given axis */
    @checkInput(['ShapeCollection', 'MainAxis'],['auto', 'auto'])
    _selectorNegativeOnAxis(shapes:AnyShapeCollection, axis:MainAxis):AnyShapeCollection
    {
        return new ShapeCollection(shapes.filter( shape => shape.max(axis) < 0 )); // force returning ShapeCollection
    }

    /** Selects shapes of a certain subtype  */
    @checkInput(['ShapeCollection',String], ['auto','auto'])
    _selectorOfSubType(shapes:AnyShapeCollection, subType:string):AnyShapeCollection
    {
        const SHAPE_SUBTYPES = {
            'Edge' : { method: 'edgeType', values: ['Line', 'Circle', 'Ellipse', 'Hyperbola', 'Parabola', 'BezierCurve', 'BSplineCurve', 'OffsetCurve', 'OtherCurve'] },
            'Wire' : { method: 'wireType', values: ['Planar', 'Closed', 'CoplanarClosed', 'OtherWire']},
            'Face' : { method : 'faceType', values: ['Planar', 'Curved'] },
            // 'Shell' - TODO
            'Solid' : { method: 'solidType', values: ['Box','Sphere','Cone','Cylinder'] }
        }

        let targetShapeType = null; // the main Shape Type belonging to given subtype
        for ( const [shapeType,subTypeSetting] of Object.entries(SHAPE_SUBTYPES) )
        {
            let subTypeValues = subTypeSetting.values.map( v => v.toLowerCase()); // case-insensitive
            if (subTypeValues.includes(subType.toLowerCase()))
            {
                targetShapeType = shapeType;
                break;
            }
        }

        if (!targetShapeType)
        {
            let allSubTypes = [];
            Object.values(SHAPE_SUBTYPES).forEach(o => allSubTypes = allSubTypes.concat(o.values))
            console.error(`Shape::_selectorOfSubType: Cannot find subType "${subType}". Choose one of the following: (${allSubTypes.join(',')})`);
            return null;
        }
        
        let selectedShapes = shapes.getShapesByType(targetShapeType).filter( shape => 
            {
                let curShapeSubType = shape.subType();
                if (curShapeSubType)
                {
                    return curShapeSubType.toLowerCase() == subType.toLowerCase(); // NOTE: case-insensitive
                }
                else {
                    console.warn(`Shape::_selectorOfSubType: No subType on Shape type "${shape.type()}"`);
                    return false;
                }
            });

        console.info(`Shape::_selectorOfSubType: Selected ${selectedShapes.length} of subtype ${subType}`);

        return new ShapeCollection(selectedShapes); // force collection (filter can return single)
        
    }

    /** Sort and select Shapes based on distance to a Point - this method combines closest or furthest */
    @checkInput(['ShapeCollection','PointLike'], ['ShapeCollection','Vector'])
    _selectorClosestOrFurtherstTo(shapes:AnyShapeCollection, to:PointLike, type:string='closest'):AnyShapeCollection
    {   
        let toVec = to as Vector // auto converted by @checkInput

        let sortedShapes:Array<AnyShape> = shapes._copy().sort( (s1,s2) => 
        {
            return s1.distance(toVec._toVertex()) - s2.distance(toVec._toVertex()) // ascending
        }).all(); 


        // furthest is just reversed
        if (type != 'closest')
        {
            sortedShapes.reverse();
        }
        
        // We can actually have multiple Shapes that have the same distance
        let selectedShapes = new ShapeCollection();
        let prevDistance = null;
        for (let i = 0; i < sortedShapes.length; i++)
        {    
            let curShape = sortedShapes[i];
            let curDistance = curShape.distance(toVec._toVertex());

            if (i == 0 || curDistance == prevDistance)
            { 
              selectedShapes.add(curShape);
              prevDistance = curDistance;
            }
            else {
                break; 
            }
        }

        console.info(`Shape::_selectorClosestOrFurtherstTo: Selected ${selectedShapes.length} shapes that are ${prevDistance} from Vertex (${toVec.toArray()})`);

        return selectedShapes;
    }

    @checkInput(['ShapeCollection', 'PointLike'], ['auto', 'Point'])
    _selectorClosestTo(shapes:AnyShapeCollection, to:PointLike):AnyShapeCollection
    {
        return this._selectorClosestOrFurtherstTo(shapes,(to as Point),'closest'); // to is auto converted to Point
    }

    @checkInput(['ShapeCollection', 'PointLike'], ['auto', 'Point'])
    _selectorFurthestTo(shapes:AnyShapeCollection, to:PointLike):AnyShapeCollection
    {
        return this._selectorClosestOrFurtherstTo(shapes,to as Point,'furthest'); // to is auto converted to Point
    }

    @checkInput(['ShapeCollection', 'SelectorPointRange'], ['auto', 'auto'])
    _selectorWithinRange(shapes:AnyShapeCollection, pointRange:SelectorPointRange):AnyShapeCollection
    {  
        const RANGE_OPERATORS = ['<', '>', '<=', '>=', '='];
        const RANGE_OPERATORS_TO_COMPARATORS = {
            '<' : (a,b) => a < b,
            '>' : (a,b) => a > b,
            '<=' : (a,b) => a <= b,
            '>=' : (a,b) => a >= b,
            '=' : (a,b) => a == b,
        }
        
        // test input
        if( !pointRange.point || !pointRange.operator || !pointRange.range || !Array.isArray(pointRange.point) || !isNumeric(pointRange.range) || !RANGE_OPERATORS.includes(pointRange.operator) )
        {
            console.error(`Shape::_selectorWithinRange: Invalid pointRange given: "${pointRange}". Please make sure you supply an Point [x,y,z], operator [<,>,<=,>=] and range value!`);
            return null;
        }

        const point = new Vector(pointRange.point);
        pointRange.range = Math.abs(pointRange.range); // negative range does not make sense
        const comparatorFunc = RANGE_OPERATORS_TO_COMPARATORS[pointRange.operator];
        const selectedShapes = new ShapeCollection(
                                shapes.filter( shape => comparatorFunc(shape.distance(point._toVertex()), pointRange.range )));

        console.info(`Shape::_selectorWithinRange: Selected ${selectedShapes.length} shapes that are within (${pointRange.operator}) of range ${pointRange.range} from Vertex (${point.toArray()})`);

        return selectedShapes;

    }

    /** Selects Shapes that intersect with the sides of the Bbox
     *  example: "V||fronttop"
     */
    @checkInput(['ShapeCollection', String], ['auto', 'auto'])
    _selectorSide(shapes:AnyShapeCollection, sidesString:string):AnyShapeCollection
    {
        let sideShape = this._getSide(sidesString);

        if (!sideShape)
        {
            console.warn(`Shape::_selectorSide: Cannot find side Shape. No shapes selected!`)
            return new ShapeCollection();
        }

        let selectedShapes = new ShapeCollection(shapes.filter( shape => 
        {
            // more robust than contains dealing with tolerances
            // use Shape.center() instead of real Shape otherwise touching Shapes also get selected
            if (sideShape.distance(shape.center()._toVertex()) < this._oc.SHAPE_TOLERANCE) 
            {
                return true
            }
            return false;
        })); // force collection, filter can return single Shape

        console.info(`Shape::_selectorSide: Selected ${selectedShapes.length} shapes that belong to given sides "${sidesString}" of main Shape.`);

        return selectedShapes; 
    }

    /** Select Shapes that have _all_ vertices at a specific coordinate within a certain tolerance 
        NOTE: we might introduce a selector later where we select Shapes that intersect a certain coordinate plane
    */
    // TODO: @checkInput
    _selectorAtAxisCoord(shapes:AnyShapeCollection, axisCoord:SelectorAxisCoord):AnyShapeCollection
    {
        let tolerance = axisCoord.tolerance || 0;

        let selectedShapes = new ShapeCollection(shapes.filter( shape => {
            // search negatively - when we encounter a Vertex not with that coordinate: quit 
            let vertexNotOnCoord = shape.vertices().toArray().find(v =>  !((v[axisCoord.axis] >= axisCoord.coord - tolerance) && (v[axisCoord.axis] <= axisCoord.coord + tolerance))  ) 
            return vertexNotOnCoord == undefined;
        }))

        console.info(`Shape::_selectorAtAxisCoord: Selected ${selectedShapes.length} shapes that have all vertices on coordate "${axisCoord.axis}"=${axisCoord.coord} with tolerance ${tolerance}`);

        return selectedShapes;
    }

    /** Select Shapes of which all the Vertices fit inside the given Bbox coordinates: We use Bbox.contains */
    // TODO: @checkInput
    _selectorInBbox(shapes:AnyShapeCollection, bboxSelector: SelectorBbox):AnyShapeCollection
    {
        let bbox = new Bbox(bboxSelector.from, bboxSelector.to);
        
        let selectedShapes = new ShapeCollection(shapes.filter( shape => bbox.contains(shape ))).unique(); // avoid doubles (based on geometry)

        console.info(`Shape::_selectorInBbox: Selected ${selectedShapes.length} shapes that are within BoundingBox [${bboxSelector.from}][${bboxSelector.to}]`);

        return selectedShapes;

    }

    /** Select SubShapes by index or indices */
    _selectorIndex(shapes:AnyShapeCollection, index: SelectorIndex):AnyShapeCollection
    {
        let selectedShapes = new ShapeCollection();
        shapes.forEach( (shape, i) => {
            if( index.indices.includes(i))
            {
                selectedShapes.add(shape);
            }
        });

        return selectedShapes;
    }

    //// !!!! TODO: DEPRECATE !!!!
    /** Sorts objects by distance in a certain axis (X,Y,Z) and direcion (- or +)
     * @param axisAndDirection - string with axis, direction and count: X, -Z - TODO num (unique results)[2] 
     */
    directionMinMaxSelector(shapes:AnyShapeCollection, axisAndDirection:string):Shape
    {
        const AXIS = ['x','y','z'];

        let axis = AXIS.find( a => axisAndDirection.toLowerCase().indexOf(a) != -1)
        let reverse = (axisAndDirection.indexOf('-') == -1) ? true : false;
        
        let sortedShapes = shapes.toArray().sort( (a,b) => a.center()[axis] - b.center()[axis] );

        if (reverse)
        {
            sortedShapes = sortedShapes.reverse();
        }
        
        return sortedShapes[0]; // TODO: count
    }

    /** Getting Side sub shapes that clearly overlaps Side of bbox 
     *  @param sideString combination of Sides. Example: 'lefttop'
    */
    // NOTE: Getting sides for Shapes is not trivial, see below for an attempt based on raycasting
    @checkInput('String', 'auto')
    _getSide(sidesString:string):AnyShape
    {
        const SIDE_FUZZYNESS = 0.5;
        const SIDE_SCALE_FUZZYNESS = 1.02;
        const SEARCH_SORT_FUNC = ((a,b) => 
                a.center()._toVertex().distance(bboxSideShape.center()._toVertex()) 
                - b.center()._toVertex().distance(bboxSideShape.center()._toVertex()) );

        // We are looking for the same of as bboxSide type 
        let bboxSideShape = this.bbox().getSidesShape(sidesString); // can be Vertex, Edge or Face
        
        if(!bboxSideShape)
        {
            console.error(`Shape::_getSide: Failed to get a bbox for this Shape.`)
            return null;
        }

        /* We need to introduce some robustness for tolerances, 
           by introducing a certain 'thickness' to the BboxSideShape
           For now we do that on a per type basis
           We then order by overlap percentage 
        */
        let fuzzySideShape;
        switch(bboxSideShape.type())
        {
            case 'Face':
                fuzzySideShape = bboxSideShape._thickened(SIDE_FUZZYNESS, 'center' ).scale(SIDE_SCALE_FUZZYNESS); // Solid
                break;
            case 'Edge':
                // TODO: fuzzyness
                fuzzySideShape = bboxSideShape; // Edge
                break;
            case 'Vertex':
                fuzzySideShape = new Solid().makeSphere(SIDE_FUZZYNESS/2, (bboxSideShape as Vertex)); // Solid Sphere
                break;
            default:
                fuzzySideShape = bboxSideShape;
        }

        // Go from bigger to smaller subshapes
        const SHAPE_TYPES:Array<ShapeType> = ['Solid', 'Shell', 'Face', 'Wire', 'Edge', 'Vertex'];
        let curShapeType = bboxSideShape.type();
        let testShapes:AnyShapeCollection = this._getEntities(curShapeType);
        let evaluatedShapes:Array<any> = [];

        // optimize search by ordering on distance to bbox side shape
        testShapes.sort(SEARCH_SORT_FUNC);

        while(true)
        {
            
            testShapes.toArray().every( testShape => 
                {
                    let overlap = 0;
                    let size = 0;
                    if(fuzzySideShape.contains(testShape))
                    {
                        // direct match - end loop
                        overlap = 1.0;
                        evaluatedShapes.push({ shape: testShape, overlap: overlap, size: size });
                        return false; // quit loop
                    }
                    // Do extra effort of Faces
                    else 
                    {
                        // TODO: more shape types and a measure of overlap
                        if(testShape.type() === 'Face')
                        {
                            let intersectingShape = fuzzySideShape._intersections(testShape)?.first();
                            if(intersectingShape)
                            {
                                size = testShape.area();
                                overlap = intersectingShape.area() / size;
                                evaluatedShapes.push({ shape: testShape, overlap: overlap, size: size });
                            }
                        }
                    }

                    return true;
                });
            
            if (evaluatedShapes.length > 0) // results for this shapeType
            {
                evaluatedShapes.sort( (a,b) => 
                {
                    let r = b.overlap - a.overlap;
                    if (r == 0)
                    {
                        r = b.size - a.size;
                    }
        
                    return r;
                })

                return evaluatedShapes[0]?.shape || null;
            }
            else 
            {
                // no results yet, test shapes of lower level type
                // optimize search by ordering on distance to bbox side shape
                curShapeType = SHAPE_TYPES[SHAPE_TYPES.indexOf(curShapeType) + 1];
                if (!curShapeType)
                {
                    return null; // end
                }
                testShapes = this._getEntities(curShapeType); // new testShapes to start new while loop
                // again sort
                testShapes.sort(SEARCH_SORT_FUNC);
            }
            
        }
    }

    /** Get 'side view' Edges, Wire or (TODO) Shells and Solid: 
     *  !!!! REFACTOR NEEDED - WORKS ONLY FOR 2D !!!!
     *  NOTE: Sides really only make sense with closed Shapes: but we keep it in also for Wires
    */
    @checkInput('Side', 'auto')
    _getSideReal(side:Side):Vertex|Edge|Wire|Face
    {
        const NUM_RAYCAST_POINTS_PER_LENGTH_UNIT = 1/5; // TODO: better formule - also related to number of Edges
        const SIDES = { 
            'front' :  [0,1,0],
            'back' : [0,-1,0],
            'top' : [0,0,-1], 
            'bottom' : [0,0,1],
            'left' : [1,0,0],
            'right' : [-1,0,0] };

        const SIDES_TO_SIZE = {
            front : 'depth',
            back : 'depth',
            left : 'width',
            right : 'width',
            top: 'height',
            bottom: 'height'
        }

        if (!Object.keys(SIDES).includes(side))
        {
            throw new Error(`Shape::_getSide: Please supply one of these sides: ${Object.keys(SIDES).join()}`);
            return null;
        }

        if( this.type() == 'Vertex' || this.type() == 'Edge'){
            throw new Error(`Shape::_getSide: Getting a side does not make sense with one Vertex or Edge!`);
            return null;
        }
        if( this.type() == 'Wire'){
            console.warn(`Shape::_getSide: Getting a side of a Wire could not make sense!`);
        }

        // ==== 2D or 3D ====
        let bbox = this.bbox();
        if (bbox.is2D())
        {
            // 2D Side: return a Edge or Wire
            let bboxSideEdge = bbox[side as keyof Bbox](); // a box has functions like 'front', 'back' etc

            // We use a raycast method to select basically the Edges 'in view' from this side
            let rayCastPointsCollection = bboxSideEdge.populated(Math.round(bboxSideEdge.length() * NUM_RAYCAST_POINTS_PER_LENGTH_UNIT));
            let rayCastPoints = rayCastPointsCollection.all(); 
            let rayCastEdges = rayCastPoints.map( p => new Edge(p as Point, (p as Point).added( SIDES[side]))   );

            let hitEdges:Array<Edge> = [];
            rayCastEdges.forEach( rayCastEdge => 
            {
                let link = this.raycast(rayCastEdge);
                if (link)
                {
                    if (link.toSupport instanceof Edge)
                    {
                        let exists = false;
                        // TODO: we are generating new Edges from raycast - we need to give back the existing ones!
                        for(let i = 0; i < hitEdges.length; i++)
                        {
                            let curHitEdge = hitEdges[i];
                            if (curHitEdge.equals(link.toSupport)){
                                exists = true;
                                break;
                            }
                        }

                        if(exists == false)
                        {
                            hitEdges.push(link.toSupport);
                        }
                    }
                }
            });

            // We have all hit Edges: make them contineous
            // TEST: Raycast to shared Vertex (corner)
            // !!!! REFACTOR !!!!
            let hitEdgesCollection = new ShapeCollection(hitEdges);
            let edgesInShape = new ShapeCollection(this.edges());
            let edgesInShapeHit = edgesInShape.getEquals(hitEdgesCollection).toArray();
            let edgeIndexStart = Math.min(...edgesInShapeHit.map( e => edgesInShape.indexOf(e as Shape)));
            let edgeIndexEnd = Math.max(...edgesInShapeHit.map( e => edgesInShape.indexOf(e as Shape)));

            let sideEdgesContinueous = new ShapeCollection();
            let direction = ( edgeIndexEnd - edgeIndexStart > edgesInShape.count() - edgeIndexEnd + edgeIndexStart ) ? 'reverse' : 'normal';
            
            if (direction == 'reverse')
            {
                let i = edgeIndexEnd;
                while(i != edgeIndexStart + 1)
                {
                    sideEdgesContinueous.push(edgesInShape[i]);
                    i++;
                    if (i >= edgesInShape.count()){
                        i = 0;
                    }
                }
            }
            else {
                sideEdgesContinueous = edgesInShape.slice(edgeIndexStart,edgeIndexEnd + 1);
            }

            // evaluate results and return 
            if(sideEdgesContinueous.length == 0)
            {
                console.warn(`Shape::_getSide: Could not get '${side}' Side geometry!`);
                return null;
            }
            else if(sideEdgesContinueous.length == 1)
            {
                return sideEdgesContinueous.first() as Vertex|Edge|Wire|Face;
            }
            else {
                return new Wire().fromEdges(sideEdgesContinueous.all() as Array<Edge>);
            }
        

        }
        else {
            // 3D Side: return Face(s)
            // TODO
        }
    }

    //// SHAPE ANNOTATIONS API ////

    @checkInput([['DimensionOptions',null]], ['auto'])
    dimension(dim?:DimensionOptions):IDimensionLine // TODO: unit typing
    {
        throw new Error(`Shape::dimension(): No implementation of dimension method in Shape of type ${this.type()}!`);
    }

    _addAnnotation(a:Annotation):boolean
    {
        // add dimension to annotations of this shape
        // TODO: check for doubles etc
        this.annotations.push(a)
        return true;
    }

    _updateAnnotations()
    {
        this.annotations.forEach(a => a.update());
    }

    //// API to forward to _Obj ////

    /** Adds current Shape by wrapping it into an object and adding it either to root Obj (=scene) or adding  */
    addToScene(force:boolean=false):Shape
    {
        // TODO: avoid double adding to scene?

        this._geom.addToActiveLayer(this.object());

        return this;
    }

    checkObj():Obj
    {
        if(!this._obj)
        {
            this.object();
        }
        return this._obj;
    }

    _getObjStyle():ObjStyle
    {
        // TODO: we can avoid copying the style by refering to another Obj that is its parent layer
        let objStyle = this.object()._style;
        let parentObjStyle = this.object()?._parent?._style;
        // TODO: recurse to above layers?
        return (objStyle || parentObjStyle) as ObjStyle;
    }

    style(newStyle:ObjStyle):Shape 
    {
        this.checkObj().style(newStyle);

        return this;
    }

    /** NOTE: We don't use set/get here, because it doesnt play well with chaining */
    name(n?:string):this|string
    {
        return (n) ? this.setName(n) : this.getName();
    }

    /** Get name of container Obj */
    setName(newName?:string):this
    {   
        if (!newName || (typeof newName !== 'string')){ throw new Error('Please supply a string for the name!') };
        this.checkObj().name(newName);  
        return this;
    }

    /** Get name of container Obj */
    getName():string|undefined
    {
        const r = this?._obj?.name();
        return (typeof r === 'string') ? r : undefined;
    }

    /** Get name of container Obj */
    getId():string
    {
        return this?._obj?._id;
    }

    hide():this
    {
        this.checkObj().hide();
        return this;
    }

    show():this
    {
        this.checkObj().show();
        return this;
    }

    /** Return if the Shape Obj is set visible or not */
    visible():boolean
    {
        return this.checkObj()._visible;
    }

    //// PROJECTIONS ////

    /** Project this 3D Shape onto the XY Plane given by a normal Vector (up is the z-axis)
     *  It groups the different Edge types in the returning Collection for easy extractions
     *  Include flag all=true to include hidden Edges
     * 
     *  IMPORTANT: Projection of a Solid that contains a certain Edge results in different alignment when projecting that Edge individually
     *  
     *  TODO: find a way to identify edges/vertices from before and after projection
     *          for example to preserve dimensions
     *  */
     @checkInput([['PointLike',[0,1,0]], ['Boolean', false]],['Vector', 'auto'])
    _project(planeNormal?:PointLike, all?:boolean):AnyShapeCollection
    {
        /* OC docs:
            - HLRBRep_Algo: https://dev.opencascade.org/doc/refman/html/class_h_l_r_b_rep___algo.html#details
            - HLRBRep_InternalAlgo: https://dev.opencascade.org/doc/refman/html/class_h_l_r_b_rep___internal_algo.html#aef401192a7b5f910dc8682a1b8426f05
            - HLRAlgo_Projector: https://dev.opencascade.org/doc/refman/html/class_h_l_r_algo___projector.html
            - HLRBRep_HLRToShape: https://dev.opencascade.org/doc/refman/html/class_h_l_r_b_rep___h_l_r_to_shape.html#a7c587980991a24c4a36dd60c1f8b8f60

            
            IMPORTANT: Outlines in OC are not what normally is considered an outline. 
            Outlines in OC are edges that don't overlap with existing 3D Edges of the shape (like the contour of a sphere, but NOT sides of a box)
            NOTE: Looks like Y axis of 3D space is always aligned with the projected Y axis


        */
        
        let ocHiddenLineRemoval = new this._oc.HLRBRep_Algo_1();
        ocHiddenLineRemoval.Add_2(this._ocShape, 0); // Shape and number of isoparameters
        let ocProjector = new this._oc.HLRAlgo_Projector_2(new this._oc.gp_Ax2_3(new Point()._toOcPoint(), (planeNormal as Vector)._toOcDir()));
        ocHiddenLineRemoval.Projector_1(ocProjector); // NOTE: different between OC versions
        ocHiddenLineRemoval.Update(); // compute outlines
        ocHiddenLineRemoval.Hide_1(); // compute hidden lines

        let groupedProjectedEdges = new ShapeCollection();

        let ocHiddenLinesToShape =  new this._oc.HLRBRep_HLRToShape(new this._oc.Handle_HLRBRep_Algo_2(ocHiddenLineRemoval));
        
        let visibleOutlines = new Shape()._fromOcShape(ocHiddenLinesToShape.OutLineVCompound_1()); // outlines are edges that are not lying on existing edges of the shape (like the outline of a sphere)
        let visibleSharpEdges = new Shape()._fromOcShape(ocHiddenLinesToShape.VCompound_1()); // sharp edges are between discontinuous faces
        if (visibleSharpEdges){ groupedProjectedEdges.addGroup('sharp', visibleSharpEdges) };
        let visibleSmoothEdges = new Shape()._fromOcShape(ocHiddenLinesToShape.Rg1LineVCompound_1()); // smooth edges are between continuous surfaces
        if(visibleSmoothEdges){ groupedProjectedEdges.addGroup('smooth', visibleSmoothEdges) }; 

        if(visibleOutlines)
        {  
            visibleOutlines.attribute('outline', true); // for later reference (toSvg())
            groupedProjectedEdges.addGroup('outlines', visibleOutlines);
        };
        
        // main two groups (hidden and visible)
        const visibleEdges = new ShapeCollection(visibleSharpEdges,visibleSmoothEdges,visibleOutlines);        
        groupedProjectedEdges._defineGroup('visible', visibleEdges);
        visibleEdges.attribute('visible', true); // for later reference (toSvg())
        
        // add invisible too
        if(all)
        {
            let hiddenEdges = new Shape()._fromOcShape(ocHiddenLinesToShape.HCompound_1());
            if (hiddenEdges)
            { 
                hiddenEdges.attribute('hidden', true);
                groupedProjectedEdges.addGroup('hiddenedges', hiddenEdges);
            }
            
            let hiddenOutlines = new Shape()._fromOcShape(ocHiddenLinesToShape.OutLineHCompound_1());
            if (hiddenOutlines)
            { 
                hiddenOutlines.attribute('hidden', true);
                hiddenOutlines.attribute('outline', true);
                groupedProjectedEdges.addGroup('hiddenoutlines', hiddenOutlines);
            }   
            
            groupedProjectedEdges._defineGroup('hidden', new ShapeCollection(hiddenEdges,hiddenOutlines));
        }

        // IMPORTANT: For some reason we need to fix the Edges, otherwise OC crashes when using the Edges
        groupedProjectedEdges.forEach( edge => (edge as Edge)._buildCurves());

        // clean up OC classes
        ocHiddenLineRemoval.delete();
        ocProjector.delete();
        ocHiddenLinesToShape.delete();
        
        return groupedProjectedEdges;
    }

    /** Project this 3D Shape onto the XY Plane given by a normal Vector (up is the z-axis)
     *  It groups the different Edge types in the returning Collection for easy extractions */
    @addResultShapesToScene
    @checkInput([['PointLike',[0,1,0]], ['Boolean', false]],['Vector', 'auto'])
    project(planeNormal?:PointLike, all?:boolean):AnyShapeCollection
    {
        return this._project(planeNormal, all);
    }

    /** Generate elevation from a given side without adding to Scene */
    @checkInput([['Side', 'top'], ['Boolean', false]], ['auto', 'auto'])
    _elevation(side?:Side, all?:boolean):AnyShapeCollection
    {
        // to make sure we always have the projection on XY plane, with +Y is top
        const SIDE_NORMAL_ROTATION = {
            front : { planeNormal: [0,-1,0], rotateZ: -90 },
            back : { planeNormal: [0,1,0], rotateZ: 90 },
            left : { planeNormal: [-1,0,0], rotateZ: -90 },
            right : { planeNormal: [1,0,0], rotateZ: 90 },
            top : { planeNormal: [0,0,1], rotateZ: 0 },
            bottom : { planeNormal: [0,0,-1], rotateZ: 180 },
        }   

        const sidePlaneNormal = SIDE_NORMAL_ROTATION[side].planeNormal;
        const rotationZ = SIDE_NORMAL_ROTATION[side].rotateZ;

        let resultCollection = this._project(sidePlaneNormal, all).rotateZ(rotationZ);
        let capitalizedSide = side.charAt(0).toUpperCase() + side.slice(1);
        resultCollection.setName(`Elevation${capitalizedSide}Collection`);
        resultCollection.moveToOrigin(); // for easy of handling make sure the result is centered on origin

        return resultCollection;
    }

    /** Generate elevation from a given side and add to Scene */
    @addResultShapesToScene
    @checkInput([['Side', 'top'], ['Boolean', false]], ['auto', 'auto'])
    elevation(side?:Side, all?:boolean):AnyShapeCollection
    {
        return this._elevation(side, all);
    }

    /** Generate isometric view from Side or corner of ViewCube ('frontlefttop') or PointLike coordinate
     *      Use showHidden=true to output with hidden lines
     */
    _isometry(viewpoint:string|PointLike, showHidden:boolean=false, transferDimensions:boolean=true):AnyShapeCollection
    {
        const DEFAULT_VIEWPOINT = [-1,-1,1]; 
        
        if(!viewpoint){ viewpoint = DEFAULT_VIEWPOINT as PointLike };

        let projShapes:ShapeCollection;
        let rotateProjShapes:number = 0;

        if (typeof viewpoint === 'string')
        {
            const b = new Solid().makeBox(100,100,100);
            let viewpointShape = b._getSide(viewpoint as string);
            if(viewpointShape && viewpointShape.type() == 'Vertex')
            {
                let viewVec = viewpointShape.center().toVector().normalize();
                let r = this._project(viewVec,showHidden);
                // We use some heuristics to transform limited values so that UP (prev Z) is aligned to 2D Y
                let rotation = (viewpoint.includes('front')) ? 60 : 120;
                if (viewpoint.includes('right')){ rotation *= -1; }
                rotateProjShapes = rotation;
                projShapes = r
            }
            else {
                console.warn(`Shape:_isometry: Invalid side string "${viewpoint}". Make sure you signify a point on the ViewCube! Defaulted to "frontleftop". `)
                viewpoint = DEFAULT_VIEWPOINT; // if not valid 
            }
        }
        // viewpoint is a PointLike
        // NOTE: This is not yet so rotated that UP (prev Z axis) is aligned Y axis (TODO)
        // We know that Y axis of 3D is always aligned to Y axis of 2D, but we need figure this out more later!
        if(isPointLike(viewpoint))
        {
            const p = new Point(viewpoint).toVector().normalize();
            projShapes = this._project(p, showHidden);
            rotateProjShapes = 60; // NOTE: we simply rotate 60 degrees now
        }
        
        // Handle results
        if (projShapes)
        {
            // we have the projected Shape now check if the original 
            // had dimensions associated with it and transfer them to the 2D projected Shape
            let newDimLines = [];
            if(transferDimensions)
            { 
                newDimLines = this._addDimensionsToProj(viewpoint, projShapes); 
            }
            projShapes.rotateZ(rotateProjShapes); // rotate 
            projShapes.moveToOrigin(); // center resulting isometry on origin
            newDimLines.forEach( dim => dim.updatePosition()); // after translate/rotate update position of dim line (but not value!)

            return projShapes;
        }
        else {
            throw new Error(`Shape._isometry(): Invalid input: Use a string of sides ('topleftfront') or PointLike ([-1,-1,1])!`)
        }
    }

    /** Generate isometric view from Side or corner of ViewCube ('frontlefttop') or PointLike coordinate
     *      Use showHidden=true to output with hidden lines
     */
    @addResultShapesToScene
    isometry(viewpoint:string|PointLike, showHidden:boolean=false):AnyShapeCollection
    {
        return this._isometry(viewpoint, showHidden)
    }

    /** Alias for isometry() */
    iso(viewpoint:string|PointLike, showHidden:boolean=false):AnyShapeCollection
    {
        return this.isometry(viewpoint, showHidden)
    }
    
    /** Take Dimensions associated with current Shape to the projected 2D shape
     *  NOTE: We can not yet associate dimensions with ShapeCollections, 
     *  so we link it to the specific Shape within this collection
     */
    _addDimensionsToProj(viewpoint:string|PointLike, projShapes:AnyShapeCollection):Array<DimensionLine>
    {
        const dimLines = this.annotations.filter(a => a.type() === 'dimensionLine');
        const newDimLines = [];

        dimLines.forEach( dimLine => {
            const dimEdge = dimLine.toEdge();
            const projDimEdge = dimEdge._project(viewpoint, false).first();
            // IMPORTANT: results of projection can be translated anywhere (there is no consistency in world-position => projected-position)
            // This means that getEqualsTranslated() can return multiple if there are same Edges around ( for example in box geometries)
            const projEdge = projShapes.getEqualsTranslated(new ShapeCollection(projDimEdge)).first();

            if (projEdge)
            {
                const newProjDimLine = projEdge.dimension();
                newProjDimLine.setValue(dimLine.value); // get value from old to new dimension line
                newDimLines.push(newProjDimLine);
            }
            else {
                console.warn('Shape._addDimensionsToProj(): Failed to map dimension line to project Edge')
            }
        })

        return newDimLines;
    }

    //// OUTPUTS ////

    /** Output all Vertices of this Shape into an Array for further processing */
    toMeshVertices():Array<VertexMesh>
    {
        let meshVertices:Array<VertexMesh> = []
        this.vertices().forEach( (curVertex, curVertexIndex) =>
        {
            meshVertices.push({ vertices : curVertex.toArray(), objId: this._obj.id, ocId: curVertex._hashcode(), indexInShape: curVertexIndex });
        });

        return meshVertices;
    }

    toMeshEdges(quality:MeshingQualitySettings):Array<EdgeMesh>
    {
        let meshEdges:Array<EdgeMesh> = [];

        this.edges().forEach( (curEdge, curEdgeIndex) => 
        {   
            let vertexCoords = [];
            let ocLocation = new this._oc.TopLoc_Location_1(); // see OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_top_loc___location.html

            if(curEdge._ocShape == null)
            {
                console.warn(`Shape::toMeshShape: null Edge detected!`);
            }
            else if (!curEdge.valid())
            {
                console.warn(`Shape::toMeshShape: Invalid Edge detected!`);
            }
            else 
            {   
                let ocAdaptorCurve = new this._oc.BRepAdaptor_Curve_2(curEdge._ocShape);
                let ocTangDef = new this._oc.GCPnts_TangentialDeflection_2(ocAdaptorCurve, 
                    quality?.linearDeflection || MESHING_MAX_DEVIATION, 
                    quality?.angularDeflection || MESHING_ANGULAR_DEFLECTION, 
                    quality?.edgeMinimalPoints || MESHING_MINIMUM_POINTS, 
                    quality?.tolerance || MESHING_TOLERANCE, 
                    quality?.edgeMinimalLength || MESHING_EDGE_MIN_LENGTH ); // see OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_g_c_pnts___tangential_deflection.html

                vertexCoords = new Array(ocTangDef.NbPoints() * 3);
                for(let j = 0; j < ocTangDef.NbPoints(); j++) 
                {
                    let ocVertex = ocTangDef.Value(j+1).Transformed(ocLocation.Transformation()); // world coords
                    vertexCoords[(j * 3) + 0] = ocVertex.X();
                    vertexCoords[(j * 3) + 1] = ocVertex.Y();
                    vertexCoords[(j * 3) + 2] = ocVertex.Z();
                    ocVertex.delete();
                }
                // Output all Edges data as sequential vertices
                meshEdges.push({ vertices : vertexCoords, objId: this._obj.id, ocId: curEdge._hashcode(), indexInShape: curEdgeIndex });

                // clean up
                ocAdaptorCurve.delete();
                ocTangDef.delete();
            }
        });

        return meshEdges;
    }

    /** Output triangulated Mesh of Faces of this Shape */
    toMeshFaces(quality:MeshingQualitySettings): Array<FaceMesh>
    {
        // OC Faces to meshed Faces:

        // taken from: https://github.com/zalo/CascadeStudio/blob/master/js/CADWorker/CascadeStudioShapeToMesh.js

        /* OC Docs:
            - BREPMesh_IncrementalMesh Docs: https://dev.opencascade.org/doc/occt-7.6.0/refman/html/class_b_rep_mesh___incremental_mesh.html
            - BRep_Tool: https://dev.opencascade.org/doc/occt-7.6.0/refman/html/class_b_rep___tool.html
            - Poly_Connect: https://dev.opencascade.org/doc/occt-7.6.0/refman/html/class_poly___connect.html
        */

        const ocMesher = new this._oc.BRepMesh_IncrementalMesh_2(
            this._ocShape, 
            quality?.linearDeflection || MESHING_MAX_DEVIATION, 
            false, 
            quality?.angularDeflection || MESHING_ANGULAR_DEFLECTION,
            false);  // NOTE: this is needed to start triangulation

        let meshFaces: Array<FaceMesh> = [];

        this.faces().forEach( (curFace, curFaceIndex) => 
        {
            let ocLocation = new this._oc.TopLoc_Location_1();
            let ocTriangulation = new this._oc.BRep_Tool.prototype.constructor.Triangulation(curFace._ocShape, ocLocation, 0); // OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_poly___triangulation.html 
            // TODO: Poly_MeshPurpose.Poly_MeshPurpose_NONE

            if (ocTriangulation.IsNull()) 
            { 
                console.warn(`Shape:toMeshShape: Got Null Face: skipped!`)    
            }
            else 
            {
                let faceMesh = {
                    ocId: curFace._ocId,
                    objId : this._obj.id,
                    vertices: [],
                    uvCoords: [],
                    normals: [],
                    triangleIndices: [],
                    numTriangles: 0,
                    indexInShape: curFaceIndex,
                };
    
                let ocPolyConnect = new this._oc.Poly_Connect_2(ocTriangulation);
                const numNodes = ocTriangulation.get().NbNodes();
    
                //// Write vertex buffer ////
                faceMesh.vertices = new Array(numNodes * 3);
                for(let i = 0; i < numNodes; i++) 
                {
                    let p = ocTriangulation.get().Node(i+1).Transformed(ocLocation.Transformation());
                    faceMesh.vertices[(i * 3) + 0] = p.X();
                    faceMesh.vertices[(i * 3) + 1] = p.Y();
                    faceMesh.vertices[(i * 3) + 2] = p.Z();
                }
    
                //// UV coordinate buffer ////

                // Important: Face orientation will be used in coming calculations
                let faceOrientation = curFace._ocShape.Orientation_1().value; // 0 = forward, 1 = backward

                if (ocTriangulation.get().HasUVNodes()) 
                {
                    // Get UV Bounds
                    let UMin = 0, UMax = 0, VMin = 0, VMax = 0;
            
                    // let UVNodes = ocTriangulation.get().InternalUVNodes();
                    let UVNodesLength = ocTriangulation.get().NbNodes();

                    faceMesh.uvCoords = new Array(UVNodesLength * 2);

                    for(let i = 0; i < UVNodesLength; i++)
                    {
                        //let p = UVNodes.Value(i + 1);
                        let p = ocTriangulation.get().UVNode(i + 1);
                        let x = p.X(), y = p.Y();
                        faceMesh.uvCoords[(i * 2) + 0] = x;
                        faceMesh.uvCoords[(i * 2) + 1] = y;
            
                        // Compute UV Bounds
                        if(i == 0){ UMin = x; UMax = x; VMin = y; VMax = y; }
                        if (x < UMin) { UMin = x; } else if (x > UMax) { UMax = x; }
                        if (y < VMin) { VMin = y; } else if (y > VMax) { VMax = y; }
                    }
            
                    // Normalize each face's UVs to 0-1
                    for (let i = 0; i < UVNodesLength; i++) 
                    {
                        let x = faceMesh.uvCoords[(i * 2) + 0],
                            y = faceMesh.uvCoords[(i * 2) + 1];
                        
                        x = ((x - UMin)/(UMax - UMin));
                        y = ((y - VMin)/(VMax - VMin));
                        
                        // Flip if Face is orientated not Forward
                        // !!!! DISABLED !!!!
                        // if (faceOrientation != 0) { x = 1.0 - x; } // this._oc.TopAbs_FORWARD = 0
            
                        faceMesh.uvCoords[(i * 2) + 0] = x;
                        faceMesh.uvCoords[(i * 2) + 1] = y;
                    }

                }
            
                //// Face Vertex normals ////

                // We create a TColgp_Array10fDir here, which is a subclass of NCollection_Array1
                // Which has a constructor documented here: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_n_collection___array1.html
                let myNormal = new this._oc.TColgp_Array1OfDir_2(1, numNodes); // see: https://dev.opencascade.org/doc/occt-7.5.0/refman/html/classgp___dir.html
                let ocTriangulateTool = this._oc.StdPrs_ToolTriangulatedShape.prototype.constructor; // OC docs: https://dev.opencascade.org/doc/occt-7.4.0/refman/html/class_std_prs___tool_triangulated_shape.html
                ocTriangulateTool.Normal(curFace._ocShape, ocPolyConnect, myNormal);
                faceMesh.normals = new Array(myNormal.Length() * 3);

                for(let i = 0; i < myNormal.Length(); i++)
                {
                    let d = myNormal.Value(i + 1).Transformed(ocLocation.Transformation());

                    /*
                    // Fix reversed orientation of Face
                    if(faceOrientation == 1) // not FORWARD
                    {
                        //console.info(`Shape::toMeshShape: Flipped Vertex Normal for this Face because orientation is not FORWARD`);
                        d = d.Reversed(); // reverse normal
                    }
                    */

                    faceMesh.normals[(i * 3)+ 0] = d.X();
                    faceMesh.normals[(i * 3)+ 1] = d.Y();
                    faceMesh.normals[(i * 3)+ 2] = d.Z();
                }
            
                //// Face triangles ////

                let triangles = ocTriangulation.get().Triangles();
                faceMesh.triangleIndices = new Array(triangles.Length() * 3);
                let validFaceTriCount = 0;

                for(let nt = 1; nt <= ocTriangulation.get().NbTriangles(); nt++) 
                {
                    let t = triangles.Value(nt);
                    let n1 = t.Value(1);
                    let n2 = t.Value(2);
                    let n3 = t.Value(3);

                    // Reverse order of Face Vertices if orientation of Face is Backward
                    if(faceOrientation == 1)
                    { 
                        let tmp = n1;
                        n1 = n2;
                        n2 = tmp;
                    }
                
                    faceMesh.triangleIndices[(validFaceTriCount * 3) + 0] = n1 - 1;
                    faceMesh.triangleIndices[(validFaceTriCount * 3) + 1] = n2 - 1;
                    faceMesh.triangleIndices[(validFaceTriCount * 3) + 2] = n3 - 1;
                    validFaceTriCount++;
                }
                
                faceMesh.numTriangles = validFaceTriCount;
                meshFaces.push(faceMesh);
                
                // clean up Face data
                ocTriangulation.delete();
                ocPolyConnect.delete();


            } // end not null Face
            
        }); // end faces iteration

        // clean up
        ocMesher.delete()

        return meshFaces;
    }

    /**
     *  Exports OC data to verbose mesh data for Three JS. 
     *  To avoid clear seperation between AY Geom library and Three we output here raw data
     *  There are interfaces defined in ExportModels.ts for clarity
     */
    @protectOC()
    toMeshShape(quality:MeshingQualitySettings): MeshShape
    {
        // As taken from https://github.com/zalo/CascadeStudio/blob/e90565990bc4131a6bbc2aa5334341bb350c8467/js/CADWorker/CascadeStudioShapeToMesh.js
        
        if (this.isEmpty())
        {
            console.error(`Shape::toMeshShape: null wrapped ocShape! Aborted mesh output`);
            return null;
        }
    
        let shapeMesh:MeshShape = { 
            objId: this._obj.id,
            vertices: this.toMeshVertices(),
            edges: this.toMeshEdges(quality),
            faces: this.toMeshFaces(quality),
            style : this._getObjStyle(),
         };

        return shapeMesh;

    }

    //// Export ////

    toData():Object
    {
        // override by individual Shape type
        return null;
    }

    /** Output all properties of this Obj including that of its Shapes into a { key value } row. This is where Calc gets its main data from */
    toTableData():Object
    {
        return {
            ocId : this._ocId,
            objId : (this._obj) ? this._obj._id : null,
            // typing
            isCollection: false,
            type : this.type(),
            // geometry properties
            isValid: this.valid(),
            bbox : this.bbox().toData(), 
            bboxWidth : this.bbox().width(),
            bboxDepth : this.bbox().depth(),
            bboxHeight : this.bbox().height(),
            center: this.center().toData(), // Vector as data
            numVertices : this.vertices().length,
            numEdges : this.edges().length,
            numWires : this.wires().length,
            numFaces : this.faces().length,
            numShells : this.shells().length,
            numSolids : this.solids().length,
            length : this.length(), 
            surface : this.surface(), // TODO
            area : this.area(), // TODO
            volume : this.volume(), // TODO
            // TODO: add programmatic instances in here, to do advanced calculations - for example distances
            // TODO: serialize BREP data?
        }
    }

    /** Export 2D Shape to SVG */
    toSvg(options?:toSVGOptions):string
    {
        // for now use ShapeCollection.toSvg()
        // NOTE: this method will be overwriten in Edge
        return new ShapeCollection(this).toSvg(options);
    }

}
/**
 * 
 *  Archiyou Obj is the abstract object container for one or more Shapes (Shape or ShapeCollection) 
 *  and builds the whole Scenegraph. Scene is also just a Obj
 *  All coordinates of underlying shapes are in world coordinates (not local Object coordinates); 
 *  We only use position and rotation (and its transformations: move and rotate ) to transform them
 *
 */

import chroma from 'chroma-js' // direct import like in documentation does not work - fix with @types/chroma

import { Point, Vector, Shape, Vertex, Edge, Wire, Face, Shell, Solid, ShapeCollection, Geom} from './internal'
import { AnyShape, isAnyShape } from './internal' // types
import { checkInput } from './decorators'; // decorators - use direct import to avoid error in jest / ts-node 
import { v4 as uuidv4 } from 'uuid' // fix TS warning with @types/uuid
import { MeshShape, MeshShapeBuffer } from './internal' // ExportModels.MeshShape
import { SceneGraphNode, SceneGraphNodeDetails, BaseStyle, ObjStyle } from './internal' // InternalModels
import { isNumeric, ColorHexToInt } from './internal'
import { PointLike, isPointLike, AnyShapeOrCollection, MeshingQualitySettings } from './internal';


export class Obj
{
    _oc:any; // holds a reference to loaded opencascade.js: needs to be public
    _geom:Geom; // reference to Geom API instance
    
    _id:string; 
    _name:string;
    _shapeType:string; // for introspection: type of Shape

    // NOTE: removed _position and _rotation for now

    _isLayer:boolean = false;
    _visible:boolean = true;
    _style:ObjStyle = null;
    
    _shapes:ShapeCollection = new ShapeCollection(); // one or more Shapes: ShapeCollection offers the same API as Shape
    _parent:Obj = null; // parent Obj of this Obj instance
    _children:Array<Obj> = []; // Obj children of current Obj: this enables a branching scene graph
    

    constructor(shapes:AnyShapeOrCollection=null)
    {
        if (shapes)
        {
            if (isAnyShape(shapes))
            {
                this.addShape(shapes);
            }
            else {
                // ShapeCollection
                this._shapes.concat(shapes)
            }
        }
        this._id = uuidv4();

        this._setProps();
    }

    /** Try to get as many properties for easy introspection */
    _setProps()
    {
        this.shapeType();
        this.isLayer();
    }

    /** Set this Obj as a child of another */
    setParent(parent:Obj)
    {
        // TODO
    }

    /** Get or set style
     *  NOTE: We don't use get/setters because we want to be able to return Obj for setter
     */
    style(newStyle:any):Obj
    {
        this._style  = this._compileStyle(newStyle);
        return this;
    }

    /** set Color for Obj/Layer. Shortcut of style */
    color(newColor:string|number|Array<number>):Obj
    {
        return this.style( { color: newColor });
    }

    /** Get current Obj color or the one that is defined by one of the parents up the hierarchy */
    getColor():number
    {
        let foundColor = (this._style && this._style.fill) ? this._style.fill.color: null;

        if (!foundColor)
        {
            if (this._parent)
            {
                return this._parent.getColor(); // go up the hierarchy of parents
            }
            else {
                // we cannot look futher
                return null;
            }
        }
        else {
            if (isNumeric(foundColor))
            {
                return foundColor as number;
            }
            else {
                // convert string hex to number
                return ColorHexToInt(foundColor);
            }
            
        }
        
    }

    /** Internal: get RGBA values of current color in  range [0-1] for RGB and A*/
    _getColorRGBA():[number,number,number,number]
    {
        const c = this.getColor();
        return (c !== null)  ?
            chroma(c).rgba(true).map((v,i) => (i < 3) ? v/255 : v ) as [number,number,number,number]
            : null
    }

    /** set Lines dashed */
    dashed()
    {
        this.style({ line: { dashed: true }});
    }

    /** Compile different parameters into a ObjStyle instance 
     *  we can have different levels of detail:
     *  - baseStyle: { color, opacity, size } which translates to all geometries (point, line, fill)
     *  - objStyle: { point: BaseStyle, fill: BaseStyle, line: BaseStyle } which we just copy directly over after checking
     *  NOTE: baseStyle params can also be directly set on the Obj: box.color = 'red'
    */
    _compileStyle(style:any):ObjStyle // NOTE: needs be to be any, not Object
    {
        // target ObjStyle
        let objStyle:ObjStyle = { 'point' : null, 'line' : null, 'fill' : null }; // set these to avoid TS warnings
     
        // given style Obj is a ObjStyle ( full config )
        if( style.hasOwnProperty('point') || style.hasOwnProperty('line') || style.hasOwnProperty('fill') )
        {
            objStyle = this._checkObjStyle(style)
        }
        // BaseStyle ( simplified config )
        else if( style.hasOwnProperty('color') || style.hasOwnProperty('opacity') || style.hasOwnProperty('size') )
        {
            // base style over all geometries
            objStyle.point = { ...style };
            objStyle.line = { ...style };
            objStyle.fill = { ...style };
            // then check
            objStyle = this._checkObjStyle(objStyle);
        }

        return objStyle as ObjStyle;
    }


    _checkObjStyle(style:any):ObjStyle
    {
        /** !!!! IMPORTANT !!!! Typescript typing with Object.entries and Object.keys :
            - https://stackoverflow.com/questions/55012174/why-doesnt-object-keys-return-a-keyof-type-in-typescript
            - https://www.typescriptlang.org/docs/handbook/2/generics.html
            - We can avoid the complex generic typing by substituting of (const [k,v] of Object.entries(obj)) for  Object.entries(obj).forEach(([k, v]) => {..}

         */
        const OBJ_STYLE_TYPE_PARAMS:Array<string> = [ 'point', 'line', 'fill']; // basic structure of an ObjStyle
        const BASE_STYLE_PARAMS:Array<string> = ['color', 'opacity', 'size', 'dashed']; // allowed properites per Object type

        let objStyle:ObjStyle = { point: style.point, 
                                  line: style.line, 
                                  fill: style.fill };
        
        // check base styles
        Object.entries(objStyle).forEach(([geomType, geomStyle]) =>
        {
            // copy over the style params
            let baseStyle:BaseStyle = { color: null, opacity: null, size: null };
            let geomStyleObj = (geomStyle || {});
            let inputStyle:BaseStyle = { color: geomStyleObj.color, 
                                            opacity: geomStyleObj.opacity, 
                                            size: geomStyleObj.size };
            let objStyle = { ...baseStyle, ...inputStyle };
            
            // important: handle a variety of color inputs with Chroma

            if (geomStyle.color)
            {
                if( chroma.valid(geomStyle.color) )
                {   
                   geomStyle.color = chroma(geomStyle.color).num();
                }
                else if ( geomStyle.color == 'random' )
                {
                    geomStyle.color = chroma.random().num();
                }
                else {
                    console.warn(`Obj::_checkObjStyle: Got a unknown color value ${geomStyle.color}: Defaulted to base color`);
                    geomStyle.color = null;
                }
            }
            
        });

        return objStyle as ObjStyle;

    }



    // ==== basic transformations: most are overloaded by subclasses ====

    @checkInput(isPointLike, Vector)
    move(v:PointLike)
    {
        let moveVec = v as Vector;
        this._shapes.move(moveVec);
    }

    rotate(t:any)
    {
        // TODO
    }

    /** get/setter method for name property */
    name(name?:string):string|Obj
    {
        if(!name)
        {
            return this._name;
        }
        else {
            if(typeof name == 'string')
            {
                this._name = name;
                return this;
            }
        }
    }

    get id()
    {
        return this._id;
    }

    // ==== Visibility and Styling ====

    hide():any
    {
        this._visible = false;
        return this;
    }

    show():any
    {
        this._visible = true;
        return this;
    }

    // ==== Managing children Objs ====

    add(o:Obj):Obj
    {
        if(!(o instanceof Obj))
        {
            console.warn(`Obj::add: Can only add Obj type. Got ${typeof o}!`);
        }
        else 
        {
            this._children.push(o);
            o._parent = this;
            this._setProps(); // changed structure so recalculate 
            console.log(`Obj::add: Added object of type "${o.shapeType()}" to Obj container "${this.name()}"`);
        }

        return this;
    }

    /** Remove an object from children */
    remove(o:Obj)
    {
        this._children.forEach(curObj =>
        {
            if (curObj === o)
            {
                let i = this._children.indexOf(o);
                this._children.splice(i, 1);
            }
        })
    }

    has(o:Obj):boolean
    {
        if(o instanceof Obj)
        {
            return this._children.includes(o);
        }
        else 
        {
            // block all non-Obj
            console.warn(`Obj::has: Cannot check of presence of this type ${typeof o}: Only Obj allowed as children in Obj!`);
            return true;
        }   
    }

    /** Gets the direct children of this Obj  */
    children():Array<Obj>
    {
        return this._children;
    }

    /** Alias for children() */
    nodes():Array<Obj>
    {
        return this.children();
    }

    /** Recursively get all Objs in this Obj container */
    descendants():Array<Obj>
    {
        let children = this._children;
        for(let c = 0; c < children.length; c++)
        {
            let childChildren = children[c].descendants();
            children = children.concat(childChildren);
        }

        return children;
    }

    /** Return Obj ShapeCollection: NOTE: use allShapes() to also get the Shapes of children. 
        For example layers don't have Shapes of their own! 
        !!!! IMPORTANT: returns reference. So don't change the return value !!!!*/
    shapes():ShapeCollection 
    {
        return this._shapes; // all children of ShapeCollection _shapes
    }

    /** Get all shapes of this Obj including its descendant Obj's returned as grouped ShapeCollection */
    allShapesCollection():ShapeCollection
    {
        let collection = this.shapes().shallowCopy(); // IMPORTANT: don't change reference this._shapes

        this.children().forEach((child,i) => 
        {
            // add as layers
            if(child.isLayer())
            {
                const groupShapes = new ShapeCollection(child.allShapes());
                collection.addGroup( child?.name() as string || `obj${i}`, groupShapes);
            }
            else {
                collection.add(child.shapes())
            }
        });
 
        return collection;
    }

    /** Get all Shapes within this Obj and its children Objs */
    allShapes():Array<AnyShape>
    {
        // NOTE: shapes is a ShapeCollection, to get its Shapes use getShapes()
        let shapes:Array<AnyShape> = this.shapes().getShapes();
        this.descendants().forEach(obj => 
        {
            shapes = shapes.concat( obj.shapes().getShapes()) 
        });

        return shapes;
    }

    getObjByName(name?:string): Obj
    {
        if(!name || (typeof name !== 'string')) return null;

        let obj = this.descendants().find( d => d.name() == name );   
        return obj;
    }

    isEmpty():Obj
    {
        this._shapes = new ShapeCollection();
        this._children = [];

        return this;
    }

    // ==== Managing Shapes ====
    /** Add a Shape to this object */
    @checkInput('AnyShape', 'auto')
    addShape(shape:AnyShape):Obj
    {
        this._shapes.push(shape);
        this._setProps();
        
        return this;
    }

    /** Remove all Shapes */
    clearShapes():Obj
    {
        this._shapes = new ShapeCollection();

        return this;
    }

    /** Get type of Shape(s) in this Object */
    shapeType():string
    {
        let shapeCollapsed = this._shapes.collapse(); // will be null if empty ShapeCollection, single Shape if only one or ShapeCollection
        this._shapeType = (shapeCollapsed == null) ? 'container' : shapeCollapsed.type(); 
        
        return this._shapeType;
    }

    /** Does this Obj contain multiple Shapes */
    isLayer():boolean
    {
        this._isLayer = this._children.length > 0;
        return this._isLayer;
    }

    /** 
     * Sometimes a Shape changes - it can then change its own reference inside a Obj container 
     *  @param newShape Can be both a Shape and ShapeCollection - that will be converted by ShapeCollection()
     * 
     * */
    _updateShapes(newShape:Shape|Vertex|Edge|Wire|Face|Shell|Solid|ShapeCollection)
    {
        if ( new Shape().isShape(newShape) )
        {
            // console.geom(`Obj::_updateShapes: from type "${this._shapes.type()}" to "${newShape.type()}"`);
            this._shapes = new ShapeCollection(newShape);
            this._shapes.setObj(this); // place reference of current Obj into new Shape
        }
    }

    // ==== Output all mesh data from Shape in this Obj and its children ====

    toMeshShapes(quality?:MeshingQualitySettings):Array<MeshShape>
    {
        let meshes = (this._visible && this._shapes != null) ? this._shapes.toMeshShapes(quality) : [];

        // recurse to children Objs
        if (this._children.length > 0)
        {
             this._children.forEach( childObj => {
                 meshes = meshes.concat( childObj.toMeshShapes()); // recurve into the scene graph Objs to get the Mesh Data out of the Shapes
             });
             
        }
        return meshes;
    }

    toMeshShapeBuffer(quality:MeshingQualitySettings ): MeshShapeBuffer
    {
        let allShapes = new ShapeCollection(this.allShapes());
        allShapes = allShapes.filter( s => s?._obj._visible); // filter out hidden Obj

        return allShapes.toMeshShapeBuffer(quality);        
    }

    /** Turn Obj containing shape/shapeCollection of other Objs into a graph which we can use to show in a menu */
    toGraph():SceneGraphNode
    {
        const OUTPUT_SHAPE_STATS = false; // NOTE: outputting statistics takes almost 300ms! Can we do these calculations more efficient?

        // set current node information
        let curNode:SceneGraphNode = { name : null, type: null, nodes: [], details: { color: this.getColor() } };
        
        if (this.isLayer()) // It's a layer not having any geometry but having children that might
        {
            curNode.name = this._name || `Unnamed Layer`;
            curNode.type = 'layer'
            curNode.nodes = this.children().map(child => child.toGraph() );
        }
        else 
        {
            // is an Obj
            curNode.name = this._name || `Unnamed Obj`;
            curNode.type = 'object';

            let shapeDetails:SceneGraphNodeDetails = { visible: this._visible, color : this.getColor() };

            curNode.details = shapeDetails; // set details also on Obj
            
            // big overview (but heavy to calculate)
            if (OUTPUT_SHAPE_STATS)
            {
                // If this Object has only one Shape in its ShapeCollection ._shapes then output more details of it!
                if(this._shapes.length == 1 && Shape.isShape(this._shapes.first()))
                {
                    let singleShape = this._shapes.first() as Shape;
                    shapeDetails = { ...shapeDetails, 
                                    ...{  
                                    subType : singleShape.subType(), 
                                    numVertices : singleShape.vertices().length, 
                                    numEdges : singleShape.edges().length,
                                    numWires : singleShape.wires().length,
                                    numFaces : singleShape.faces().length,
                                }}
                }
            }
            

            // end node = single child of current node
            curNode.nodes = [ { name: this.shapeType(), 
                                type: this.shapeType(), 
                                nodes: null,
                                details: shapeDetails,
                                } ]
        }

        return curNode; 
    }

    /** Output all properties of this Obj including that of its Shapes into a { key value } row */
    toData():Object
    {
        return {
            id : this._id,
            name : this._name,
            isLayer: this._isLayer,
            visible : this._visible,
            style : this._style,
            color: (this._style) ? (this._style as any).color : null, // TODO
            parentId: ( this._parent ) ? this._parent._id : null,
            childrenIds: ( this._children ) ? this._children.map(child => child._id) : [],
            shapeIds : [] // TODO
        }
    }

    toString():string
    {
        let shapeStrings = [];
        this.shapes().forEach(s => 
            { 
                shapeStrings.push(s.toString())
            } 
        );
        return `<Obj id="${this.id}, name="${this._name}", shapes: ${shapeStrings}>`;
    }

}
/**
 * 
 *  Archiyou Obj is the abstract object container for one or more Shapes (Shape or ShapeCollection) 
 *  and builds the whole Scenegraph. Scene is also just a Obj
 *  All coordinates of underlying shapes are in world coordinates (not local Object coordinates); 
 *  We only use position and rotation (and its transformations: move and rotate ) to transform them
 *  
 *  NOTES:
 *      - Problems with BindingErrors: As containers Obj's are sensitive to OC Shapes that for some reason are garbage collected
 *          The strong function Shape.valid() check if pointers are valid. Use that above Shape.isEmpty() because it not really works in this case
 *
 */

import chroma from 'chroma-js' // direct import like in documentation does not work - fix with @types/chroma

import { Point, Vector, Shape, Vertex, Edge, Wire, Face, Shell, Solid, ShapeCollection, Geom, isObjStyle, isBaseStyle} from './internal'
import { AnyShape, isAnyShape } from './internal' // types
import { checkInput } from './decorators'; // decorators - use direct import to avoid error in jest / ts-node 
import { uuidv4 } from './internal' // utils
import { MeshShape, MeshShapeBuffer } from './internal' // ExportModels.MeshShape
import { SceneGraphNode, SceneGraphNodeDetails, BaseStyle, ObjStyle } from './internal' // InternalModels
import { isNumeric, colorHexToInt } from './internal'
import { PointLike, isPointLike, AnyShapeOrCollection, MeshingQualitySettings } from './internal';
import type { RunnerScriptScopeState } from './internal' 


export class Obj
{
    //// SETTINGS ////
    DEFAULT_OBJ_STYLE:ObjStyle = { point : {}, line: {}, fill: {} }
    DEFAULT_BASE_STYLE:BaseStyle = { 
        color: null, // null: let viewer decide
        opacity: null, 
        size: null,
        dashed: null, 
    }

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
        // NOTE: We don't init a default style for every Obj because it will try to get it from a parent obj (layer)
        this.shapeType();
        this.isLayer();
    }

    /** Set this Obj as a child of another */
    setParent(parent:Obj)
    {
        // TODO
    }

    /** Add Obj with its children to active layer */
    addToScene()
    {
        this._geom.addToActiveLayer(this);
    }

    /** Get or set style
     *  NOTE: We don't use get/setters because we want to be able to return Obj for setter
     */
    style(newStyle:BaseStyle|ObjStyle):Obj
    {
        this._style  = this._compileStyle(newStyle);
        return this;
    }

    /** set Color for Obj/Layer. Shortcut of style */
    color(newColor:string|number|Array<number>):Obj
    {
        return this.style( { color: newColor } as BaseStyle);
    }

    /** set Lines to dashed (keeps existing styling) */
    dashed():Obj
    {
        return this.style({ line: { dashed: true }} as ObjStyle );
    }

    /** set strokeWidth in mm while keeping the rest of existing styling */
    lineWidth(n:number):Obj
    {
        return this.style({ line: { width: n }} as ObjStyle );
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
                return colorHexToInt(foundColor as string);
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


    /** Compile different parameters into a ObjStyle instance */
    _compileStyle(newStyle?:ObjStyle|BaseStyle):ObjStyle // NOTE: needs be to be any, not Object
    {
        let newObjStyle = { ...this.DEFAULT_OBJ_STYLE, ...(this._style || {}) };
     
        // given newStyle is a config ObjStyle in format { line: { BaseStyle }, point : ..., fill: ... }
        if( isObjStyle(newStyle))
        {
            // newStyle can have fragmented form: { line : dashed }: Make sure we keep original structure
             Object.keys(newStyle).forEach(k => {
                newObjStyle[k] = { ...newObjStyle[k], ...newStyle[k] }
            })
        }
        // or a simplified BaseStyle
        else if( isBaseStyle(newStyle))
        {
            // base style over all geometries
            newObjStyle.point = { ...newObjStyle.point, ...newStyle };
            newObjStyle.line = { ...newObjStyle.line, ...newStyle };
            newObjStyle.fill = { ...newObjStyle.fill, ...newStyle };
        }
        
        const s = this._checkObjStyle(newObjStyle as ObjStyle);
        
        return s;
    }

    /** Check and normalize ObjStyle values (mostly colors) in place */
    _checkObjStyle(style:ObjStyle):ObjStyle
    {
        // check base styles per geomType in place
        Object.entries(style).forEach(([geomType, geomStyle]) =>
        {
            // Normalize colors with Chroma
            if (geomStyle?.color)
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
        return style
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
            // Some sanity tests here by id
            childChildren.forEach( cc => 
            {
                if(!children.find( c => c.id === cc.id))
                {
                    children.push(cc)
                }
            });
        }

        return children;
    }

    /** Return shapes of this Obj
        @param all (default:true) also those of descendant Objs
    */
    shapes(all:boolean=true):ShapeCollection 
    {
        return (all) ? this.allShapes() : this._shapes; // all children of ShapeCollection _shapes
    }

    /** Get all shapes of this Obj including its descendant Obj's returned as grouped ShapeCollection 
     *  TODO: Do we need Shape.valid() - It's slow!
    */
    allShapesCollection():ShapeCollection
    {
        // IMPORTANT: don't change reference this._shapes
        //const collection = this._shapes.shallowCopy().filter(s => s.valid()); // GC: valid() only needed with GC - but slows down a lot!
        const collection = this._shapes.shallowCopy();

        this.children().forEach((child,i) => 
        {
            // add as layers
            if(child.isLayer())
            {
                const groupShapes = child.allShapes(); // .filter(s => s.valid()); // GC 
                collection.addGroup( child?.name() as string || `obj${i}`, groupShapes);
            }
            else {
                collection.add(child._shapes); // .filter(s => s.valid()));
            }
        });
 
        return collection;
    }

    /** DEBUG:  Sometimes weird Objs are created */
    isCircular():boolean
    {
        try {
            JSON.stringify(this._shapes)
            return false;
        }   
        catch(e)
        {
            return true;
        }
    }

    /** Get all Shapes within this Obj and its children Objs */
    allShapes():ShapeCollection
    {   
        const shapes = new ShapeCollection();
    
        this.descendants().forEach(obj => 
        {
            obj._shapes.forEach((s) => 
            {
                // TMP DISABLED - SLOW!
                //if(s.valid()) // Protect against empty shapes for example
                //{
                    shapes.add(s);
                //}
            })
        });

        return shapes;
    }

    getObjByName(name?:string): Obj
    {
        if(!name || (typeof name !== 'string')) return null;

        let obj = this.descendants().find( d => d.name() == name );   
        return obj;
    }

    /** Empty Obj container by releasing all OC Shapes and then removing JS references */
    empty():Obj
    {
        // this.clearOcShapes(); // Since we got automatic garbage collection we don't need to manually delete OC objects
        this.clearShapes();
        this._children = [];
        this._parent = null;

        return this;
    }

    // ==== Managing Shapes ====
    /** Add a Shape to this object */
    @checkInput('AnyShape', 'auto')
    addShape(shape:AnyShape):Obj
    {
        this._shapes.add(shape);
        this._setProps();
        
        return this;
    }

    /** Remove all Shapes */
    clearShapes():Obj
    {
        this._shapes = new ShapeCollection();
        return this;
    }

    /** Delete Shapes
     *  Mostly removing OC classes, JS objects are picked up by garbage collection
     */
    clearOcShapes():this
    {
        this.allShapes().forEach(s => s._clearOcShape());
        return this;
    }
  

    /** Get type of Shape(s) in this Object */
    shapeType():string
    {
        //.filter(s => s.valid()) 
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
    _updateShapes(shapes:AnyShapeOrCollection)
    {
        if (!Shape.isShape(shapes) && !ShapeCollection.isShapeCollection(shapes))
        {
            console.error(`Obj::_updateShapes: Got a unknown type of shape or ShapeCollection: ${typeof shapes}`);
        }
        
        this._shapes = new ShapeCollection(shapes);
        this._shapes.setObj(this); // place reference of current Obj into new Shape
    }

    //// EXPORTS ////

    /** Output all mesh data from Shape in this Obj and its children */
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
        allShapes = new ShapeCollection(allShapes.filter( s => s?._obj._visible)); // filter out hidden Obj. NOTE: filter can return a single Shape!

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
            curNode.nodes = this.children().map(child => child.toGraph() ); // Recurse into children
        }
        else 
        {
            // is an Obj wrapping a Shape
            curNode.name = this._name || `Unnamed Obj`;
            curNode.type = 'object';

            let shapeDetails:SceneGraphNodeDetails = { visible: this._visible, color : this.getColor() };

            curNode.details = shapeDetails; // set details also on Obj
            
            // big overview (but heavy to calculate)
            if (OUTPUT_SHAPE_STATS)
            {
                // If this Obj has only one Shape in its ShapeCollection ._shapes then output more details of it!

                if(this._shapes.length == 1) // this._shapes.first()?.valid()
                {
                    let singleShape = this._shapes.first() as Shape;
                    shapeDetails = { 
                                    ...shapeDetails, 
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
        this._shapes.forEach(s => 
            { 
                shapeStrings.push(s.toString())
            } 
        );
        return `<Obj id="${this.id}, name="${this._name}", shapes: ${shapeStrings}>`;
    }

    /** 
     *  Export Obj tree structure with raw shapes that will be recreated in other scope
     * */
    toComponentGraph(component:string, parentNode:Object=null):Object
    {
        const curNode = {
            _entity : 'ObjData',
            name : this._name,
            shapes:  this.shapes(false) as ShapeCollection, // NOTE: geom is still current scope instance!
            children : [],
        }

        // Recurse through children if any
        this.children().forEach(childObj =>
        {
            childObj.toComponentGraph(component, curNode); // pass parent to child
        });

        // if child 
        if(parentNode)
        {
            curNode.name = `${component}_${this.name()}`;
            (parentNode as any).children.push(curNode); // add to to new parent Obj
        }
        // root
        else {
            curNode.name = component;
        } 

        return curNode;
    }

    

}
/**
 * 
 *  Geom.ts - the main Geom creating API of AY
 */

import { PointLike, isPointLike, SelectionString,PointLikeSequence, isPointLikeSequence, MakeWireInput, isMakeWireInput,
        MakeFaceInput, isMakeFaceInput, Axis, isAxis, MakeShellInput, isMakeShellInput, MakeSolidInput, isMakeSolidInput,
        AnyShapeOrCollection, AnyShapeOrCollectionOrSelectionString, MeshingQualitySettings, ModelUnits, isModelUnits, DocUnits} from './internal' // types
import { Vector, Point, Obj, Shape, Vertex, Edge, Wire, Face, Shell, Solid, Bbox, ShapeCollection, VertexCollection, Sketch } from './internal'
import { SketchPlaneName, SketchPlane } from './internal' // Sketch
import { Pipeline } from './internal'
import { checkInput, asSketch } from './decorators'; // Direct import to avoid error in ts-node/jest

//// DEFAULTS FROM SHAPE CLASSES ////
import { FACE_PLANE_WIDTH, FACE_PLANE_DEPTH, FACE_PLANE_NORMAL, FACE_PLANE_POSITION, FACE_BASEPLANE_AXIS, FACE_BASEPLANE_SIZE, FACE_CIRCLE_RADIUS } from './internal'
import { SOLID_MAKEBOX_SIZE, SOLID_MAKESPHERE_RADIUS, SOLID_MAKESPHERE_ANGLE,
        SOLID_MAKECONE_BOTTOM_RADIUS, SOLID_MAKECONE_TOP_RADIUS, SOLID_MAKECONE_HEIGHT, SOLID_CYLINDER_RADIUS, SOLID_CYLINDER_HEIGHT,  // Face
        SOLID_CYLINDER_ANGLE} from './internal' // Solid
import {  SKETCH_FILLET_SIZE, SKETCH_CHAMFER_DISTANCE, SKETCH_CHAMFER_ANGLE } from './internal' // Sketch

import { Annotator } from './internal';

import { isNumeric, isBrowser, isWorker, roundToTolerance } from './utils';

// import Arrangement2D from '../libs/arrangement-2d-js' // DISABLED FOR NOW
const Arrangement2D = null
import { Arr2DPolygon } from './internal'

//// OWN DEFAULTS
const DEFAULT_UNITS = 'mm';
const CIRCLE_RADIUS = 50;

/* Extend Console to avoid TS errors */
declare global {

    interface Console {
        geom:any,
        user:any,
    }
}

export class Geom
{
  _oc:any; // is set on prototype when Opencascade.js is loaded
  _annotator:Annotator;
  _console:any; // reference to console - avoid using type Console to seperate ties between ui components 
  _cache:{(key:string):any} = {} as any; // operations cache - avoid TS errors
  _units:ModelUnits = DEFAULT_UNITS;
  scene:Obj;
  activeLayer:Obj;
  layerStack:Array<Obj> = [];
  activeSketch:Sketch; // if we are in Sketch mode
  _captureShapesStart:ShapeCollection = null;
  _activeLayerGroup:Obj = null;
  _activeLayerGroupInObj:Obj = null;
  _pipelines:Array<Pipeline> = []; // keep track of defined pipelines
  // NOTE: meshingQuality is either in Main or Webworker scope
  _Arr2D:any; // holds class Reference to Arrangements2D module


  constructor()
  {
    // set link to OC for all subclass Shapes
    Vector.prototype._oc = this._oc;
    Point.prototype._oc = this._oc;
    Bbox.prototype._oc = this._oc;
    Shape.prototype._oc = this._oc; // set for all Shapes: this is inherited to Vertex, Edge etc
    ShapeCollection.prototype._oc = this._oc;
    Sketch.prototype._oc = this._oc;
    Pipeline.prototype._oc = this._oc;
    
    // tie all Classes to this Geom instance ( handles for example registering of copied shapes )
    //Vector.prototype._geom = this;
    //Point.prototype._geom = this;
    Bbox.prototype._geom = this;
    Obj.prototype._geom = this; 
    Shape.prototype._geom = this;
    ShapeCollection.prototype._geom = this;
    Sketch.prototype._geom = this;
    Pipeline.prototype._geom = this;

    Annotator.prototype._geom = this;
    this._annotator = new Annotator();


    this.scene = new Obj().name("scene") as Obj; // create empty Collection
    this.setActiveLayer(this.scene);

    this._loadArr2D(); // Load the arrangements-2d wasm module
  }

  //// ADMIN METHODS ////

  @checkInput([['ModelUnits',null]], 'auto')
  units(u?:ModelUnits):ModelUnits
  {
    // getter
    if(!u){ return this._units }
    this._units = u;
    return this._units;
  }

  //// CREATION METHODS ////

  /** Creates a 2D/3D Point */
  @checkInput([['PointLike', [0,0,0]]], 'Point')
  Point(p:PointLike, ...args):Point
  {
    let pnt = p as Point; // auto converted
    if (!pnt){ pnt = new Point().fromPointLike(p,...args)}
    return pnt;
  }

  /** Creates a 2D/3D Vector */
  @checkInput([['PointLike',[1,0,0]]], 'Vector') // allow null and fix later
  Vector(p:PointLike, ...args):Vector
  {
    let v = p as Vector; // auto converted
    if (!v){ v = new Vector().fromPointLike(p,...args)}
    console.geom(`Geom::Vector: Created a Vector with coordinates ${v.x},${v.y},${v.z}`);
    return v;
  }

  /** Creates a 2D/3D Point */
  @checkInput([['PointLike', [0,0,0]]], 'Vertex')
  Vertex(p:PointLike, ...args):Vertex
  {
    const v = p as Vertex; // auto converted
    v.addToScene();
    v.name((this.getNextObjName('Vertex'))); // auto name
    console.geom(`Geom::Vertex: Created a Vertex at ${v.x},${v.y},${v.z}`);
    return v;
  }

  /** Creates a Line Edge */
  @checkInput(['PointLike','PointLike'], ['Vertex','Vertex'])
  Edge(start:PointLike, end:PointLike):Edge
  {
    // NOTE: we don't allow creating empty Edges from geom. use new Edge() instead.
    let edge = new Edge(start as Vertex,end as Vertex);
    edge.addToScene();
    edge.setName(this.getNextObjName('Edge')); // auto name
    
    console.geom(`Geom::Edge: Created a Edge with length ${edge.length()}`);

    return edge;
  }

  /** Create a Line Edge */
  @checkInput(['PointLike','PointLike'], ['Vertex','Vertex'])
  Line(start:PointLike, end:PointLike):Edge
  {
    let edge = new Edge(start as Vertex, end as Vertex);
    edge.addToScene();
    edge.name(this.getNextObjName('Line')); // auto name
    console.geom(`Geom::Line: Created a Line Edge with length ${edge.length()}`);
    return edge;
  }

  /** Make an Arc with start, mid and end Point */
  @checkInput(['PointLike','PointLike','PointLike'], ['Vertex','Vertex','Vertex'])
  Arc(start:PointLike, mid:PointLike, end:PointLike):Edge
  {
    let startVertex = start as Vector; // auto converted
    let midVertex = mid as Vector;
    let endVertex = end as Vector;

    let edge = new Edge().makeArc(startVertex, midVertex, endVertex);
    edge.addToScene();
    edge.name(this.getNextObjName('Arc')); // auto name

    console.geom(`Geom::Arc: Created a Arc Edge with start [${startVertex.x},${startVertex.y},${startVertex.z}], mid [${midVertex.x},${midVertex.y},${midVertex.z}] and end [${endVertex.x},${endVertex.y},${endVertex.y}]`);
    return edge;
  }

  /** Make a Spline going through given Points */
  @checkInput('PointLikeSequence', 'VertexCollection')
  Spline(points:PointLikeSequence, ...args):Edge
  {
    let vertices = points as VertexCollection; // auto converted
    let edge = new Edge().makeSpline(vertices);
    edge.addToScene();
    edge.name(this.getNextObjName('Spline')); // auto name

    console.geom(`Geom::Spline: Created a Spline Edge through ${vertices.length} points with length "${edge.length()}"`);
    return edge;
  }

  /** Creates a Wire out of sequence of Points, Edges */
  @checkInput('MakeWireInput', 'auto')
  Wire(entities:MakeWireInput, ...args):Wire
  {
    // NOTE: We don't allow empty wires here, use new Wire() instead
    let wire = new Wire(entities, ...args);
    wire.addToScene();
    wire.name(this.getNextObjName('Wire')); // auto name
    
    console.geom(`Geom::Wire: Created a Wire with ${wire.edges().length} Edges and total length ${wire.length()}`);
    
    return wire;
  }

  /** Make Line Wire by supplying multiple points */
  @checkInput('MakeWireInput', 'auto')
  Polyline(entities:MakeWireInput, ...args):Wire
  {
    let w = this.Wire(entities);
    w.name(this.getNextObjName('Polyline')); // auto name
    return w;
  }

  /** Make 2D Spiral */
  @checkInput([[Number,100],[Number,50],[Number,360],[Boolean, false]], ['auto','auto','auto'])
  Spiral(firstRadius:number, secondRadius:number, angle:number, lefthand:boolean)
  {
    let spiral = new Wire().makeSpiral(firstRadius, secondRadius, angle, lefthand);
    spiral.addToScene();
    spiral.name(this.getNextObjName('Spiral')); // auto name
    
    console.geom(`Geom::Wire: Created a Spiral`);
    
    return spiral;
  }

  @checkInput([[Number,50],[Number,100],[Number,360],['PointLike',[0,0,0]],['PointLike',[0,0,1]],[Boolean, false],[Number, null]], ['auto','auto','auto','Point','Vector', 'auto', 'auto'])
  Helix(radius?:number, height?:number, angle?:number, pivot?:PointLike, direction?:PointLike, lefthand?:boolean, coneSemiAngle?:number)
  {
    const helix = new Wire().makeHelix(radius, height, angle, pivot, direction, lefthand, coneSemiAngle);
    helix.addToScene();
    helix.name(this.getNextObjName('Helix')); // auto name
    
    console.geom(`Geom::Wire: Created a Helix`);
    
    return helix;
  }

  /** Creates an Face */
  @checkInput('MakeFaceInput', 'auto')
  Face(entities:MakeFaceInput, ...args):Face|Shell
  {
    let face = new Face(entities, ...args);
    /* Important: Sometimes we can get a Shell instead of a Face - for example when making a non-planar Face from Edges
        This geom.Face method is handy in that case, because we can change it before assignment
    */
    const faceOrShell = face._toShellWhenOcShell();
    faceOrShell.addToScene();
    faceOrShell.name(this.getNextObjName('Face')); // auto name
    console.geom(`Geom::Face: Created a ${faceOrShell.type()} with ${faceOrShell.vertices().length} vertices`);
    return faceOrShell;
  }

  /** Create a planar Face with width and depth and optional position */
  @checkInput([ [Number, FACE_PLANE_WIDTH], [Number, FACE_PLANE_DEPTH], ['PointLike', FACE_PLANE_NORMAL], ['PointLike', FACE_PLANE_POSITION]], ['auto','auto',Vector, Point])
  Plane(width?:number, depth?:number, normal?:PointLike, position?:PointLike):Face
  {
    const plane = new Face().makePlane(width, depth, position, normal); // NOTE: other way around. TODO: fix inconsistency
    plane.addToScene();
    plane.name(this.getNextObjName('Plane')); // auto name
    console.geom(`Geom::Plane: Created a Plane Face with area ${plane.area()}`);
    return plane;
  }

  /** Create a planar Face between two Points */
  @checkInput([ 'PointLike', 'PointLike' ], ['Point','Point'])
  PlaneBetween(from:PointLike, to:PointLike):Face
  {
    const plane = new Face().makePlaneBetween(from as Vector, to as Vector);
    plane.addToScene();
    plane.name(this.getNextObjName('Plane')); // auto name
    console.geom(`Geom::Plane: Created a Plane Face with area ${plane.area()}`);
    return plane;
  }

   /** Create a 2D planar Face */
  @checkInput([ [Number, FACE_PLANE_WIDTH], [Number, FACE_PLANE_DEPTH],['PointLike', FACE_PLANE_POSITION]], ['auto','auto','Point'])
  Rect(width?:number, depth?:number, position?:PointLike):Face
  {
    return this.Plane(width, depth, position);
  }

  /** Creates a rectangular Face */
  @checkInput(['PointLike','PointLike'],['Point', 'Point'])
  RectBetween(from:PointLike, to:PointLike):Face
  {
    let rect = new Face().makeRectBetween(from as Point,to as Point);
    rect.addToScene();
    rect.name(this.getNextObjName('Rect')); // auto name
    console.geom(`Geom::Rect: Created a Rect Face with size [${rect.bbox().width()},${rect.bbox().depth()}]`);
    return rect;
  }

  /** Create the basic planes along the main axis */
  @checkInput([['Axis', FACE_BASEPLANE_AXIS], [Number, FACE_BASEPLANE_SIZE]], ['Axis','auto'] )
  BasePlane(axis?:string, size?:number):Face
  {
    let plane = new Face().makeBasePlane(axis as Axis,size);
    plane.addToScene(); // new API (TODO: update others)
    plane.name(this.getNextObjName('Plane')); // auto name
    console.geom(`Geom::Plane: Created a Plane Face with size [${plane.bbox().width()},${plane.bbox().depth()}]`);
    return plane;
  }

  /** Create circular Face */
  @checkInput([[Number, CIRCLE_RADIUS]], ['auto'])
  Circle(radius?:number):Face|Shell
  {
    let circleFace = new Face().fromWire(new Edge().makeCircle(radius)._toWire());
    circleFace.addToScene();
    circleFace.name(this.getNextObjName('Circle')); // auto name
    console.geom(`Geom::Circle: Created a Circular Face with radius ${radius}`);
    return circleFace;
  }

  /** Create a Shell */
  @checkInput('MakeShellInput', 'ShapeCollection')
  Shell(entities: MakeShellInput, ...args):Shell
  {
    let shell = new Shell(entities as ShapeCollection); // auto converted and combined
    shell.addToScene();
    console.geom(`Geom::Shell: Created a Shell with ${shell.faces().length} Faces`);
    return shell;
  }

  /** Create a Solid */
  @checkInput('MakeSolidInput', 'ShapeCollection')
  Solid(shells:MakeSolidInput, ...args):Solid
  {
    // NOTE: We don't allow creating empty Solid in Geom. Use new Solid() instead
    let solid = new Solid(shells as ShapeCollection); // auto converted and combined into 
    solid.addToScene();
    console.geom(`Geom::Shell: Created a Solid with ${solid.shells().length} Shells and ${solid.faces().length} Faces`);
    return solid;
  }

  /** Create a Solid Box with width, depth and height and optional a position */
  @checkInput([ [Number,SOLID_MAKEBOX_SIZE],[Number,null], [Number, null],['PointLike',[0,0,0]] ], ['auto', 'auto','auto', 'Point']) // this automatically transforms Types
  Box(width?:number, depth?:number, height?:number, position?:PointLike):Solid
  {
    let box = new Solid().makeBox(width, depth, height, position as Point);
    box.addToScene();
    box.name(this.getNextObjName('Box')); // auto name
    console.geom(`Geom::Box: Created a Box Solid with size [${width}, ${depth||width}, ${height||width}] at [${box.center().x},${box.center().y},${box.center().z}]`);
    return box;
  }
  
  /** Alias for a Solid Box with width, depth and height and optional a position */
  @checkInput([ [Number,SOLID_MAKEBOX_SIZE],[Number,null], [Number, null],['PointLike',[0,0,0]] ], ['auto', 'auto','auto', 'Point']) // this automatically transforms Types
  Cube(width?:number, depth?:number, height?:number, position?:PointLike):Solid
  {
    return this.Box(width,depth,height,position);
  }

  @checkInput(['PointLike', 'PointLike'], ['Point','Point'] ) // this automatically transforms Types
  BoxBetween(from:PointLike, to:PointLike):Solid
  {
    let box = new Solid().makeBoxBetween(from as Point,to as Point);
    if (!box)
    {
      throw Error(`Geom::Box: Failed to create Box between points ${from} and ${to}. Check if Point span a 3D space!`);
    }
    box.addToScene();
    box.name(this.getNextObjName('Box')); // auto name
    console.geom(`Geom::Box: Created a Box Solid with size [${box.bbox().width()}, ${box.bbox().depth()}, ${box.bbox().height()}] at [${box.center().x},${box.center().y},${box.center().z}]`);
    return box;
  }

  /** Create a Solid Sphere */
  @checkInput([ [Number,SOLID_MAKESPHERE_RADIUS],['PointLike',[0,0,0]],[Number,SOLID_MAKESPHERE_ANGLE]], ['auto', 'Point', 'auto']) // this automatically transforms Types
  Sphere(radius?:number, position?:PointLike): Solid
  {
    let sphere = new Solid().makeSphere(radius, position);
    sphere.addToScene();
    sphere.name(this.getNextObjName('Sphere')); // auto name
    console.geom(`Geom::Sphere: Created a Sphere Solid with radius ${radius} at [${sphere.center().x},${sphere.center().y},${sphere.center().z}]`);
    return sphere;
  }

  /** Create a Solid Cone */
  @checkInput([ [Number,SOLID_MAKECONE_BOTTOM_RADIUS],[Number, SOLID_MAKECONE_TOP_RADIUS],[Number, SOLID_MAKECONE_HEIGHT],['PointLike', [0,0,0]]], 
    ['auto','auto','auto', 'Point'])
  Cone( bottomRadius?:number, topRadius?:number, height?:number, position?:PointLike):Solid
  {
    let cone = new Solid().makeCone(bottomRadius, topRadius, height, position, 360).move(0,0,-height/2);
    cone.addToScene();
    cone.name(this.getNextObjName('Cone')); // auto name
    console.geom(`Geom::Cone: Created a Cone Solid with radii [${bottomRadius},${topRadius}] at [${cone.center().x},${cone.center().y},${cone.center().z}]`);
    return cone as Solid;
  }

  /** Create a Solid Cylinder */
  @checkInput([ [Number, SOLID_CYLINDER_RADIUS], [Number,SOLID_CYLINDER_HEIGHT], ['PointLike', [0,0,0]], [Number, SOLID_CYLINDER_ANGLE]],
    ['auto','auto',Point,'auto'])
    Cylinder(radius?:number, height?:number, position?:PointLike, angle?:number):Solid
  {
    let cylinder = new Solid().makeCylinder(radius, height, position, angle).move(0,0,-height/2);
    cylinder.addToScene();
    cylinder.name(this.getNextObjName('Cone')); // auto name
    console.geom(`Geom::Cylinder: Created a Cylinder Solid with radius ${radius} at [${cylinder.center().x},${cylinder.center().y},${cylinder.center().z}]`);
    return cylinder as Solid;
  }

  //// SKETCH API ////
  /*
      These Sketch commands are forwarded to the activeSketch (if any)
  */

  /** Start sketching a 2D Shape on a given plane, face, or plane given by xAxis and yAxis */
  sketch(plane?:SketchPlaneName|Face|PointLike, yAxis?:PointLike)
  {
     this.activeSketch = new Sketch(plane,yAxis);
     return this.activeSketch;
  }

  // Sketch navigation
  // TODO: Fix collision with geom.all()
  /*
  @asSketch
  all()
  {
    this.activeSketch.all();
  }
  */

  @asSketch
  isTemp()
  {
    this.activeSketch.isTemp();
  }

  @asSketch
  @checkInput('SelectionString', 'auto')
  select(selectionString:SelectionString):void
  {
    this.activeSketch.select(selectionString);
  }

  @asSketch
  atVertices()
  {
    this.activeSketch.atVertices();
  }

  // Sketch Edge Drawing API

  @asSketch
  @checkInput('PointLike', 'auto')
  moveTo(point:PointLike, ...args)
  {
      this.activeSketch.moveTo(point, ...args)
  }
  
  @asSketch
  @checkInput('PointLike', 'auto')
  lineTo(point:PointLike, ...args)
  {
      this.activeSketch.lineTo(point, ...args)
  }

  @asSketch
  @checkInput('PointLikeSequence', 'VertexCollection')
  splineTo(points:PointLikeSequence, ...args)
  {
      this.activeSketch.splineTo(points)
  }

  @asSketch
  @checkInput(['PointLike','PointLike'], ['auto', 'auto'])
  arcTo(mid:PointLike, end:PointLike)
  {
      this.activeSketch.arcTo(mid, end)
  }

  // Sketch Face Drawing API

  @asSketch
  @checkInput('PointLike', 'auto') 
  rectTo(point:PointLike, ...args)
  {
      this.activeSketch.rectTo(point, ...args)
  }

  @asSketch
  @checkInput([[Number,FACE_PLANE_WIDTH], [Number,FACE_PLANE_DEPTH]], ['auto','auto'])
  rect(width?:number, height?:number)
  {
      this.activeSketch.rect(width,height)
  }

  @asSketch
  @checkInput('PointLike', 'Point')
  circleTo(point:PointLike, ...args)
  {
      this.activeSketch.circleTo(point, ...args)
  }

  @asSketch
  @checkInput([[Number,FACE_CIRCLE_RADIUS]], ['auto'])
  circle(radius:number)
  {
      this.activeSketch.circle(radius)
  }

  // Sketch Operations

  @asSketch
  close()
  {
    this.activeSketch.close();
  }

  @asSketch
  combine()
  {
      this.activeSketch.combine();
  }
   
  @asSketch
  @checkInput([ ['PointLike',[0,0]], ['PointLike', [0,1]], ['Boolean', true]], ['Point','Vector', 'auto'])
  mirror(origin?:PointLike, direction?:Vector, autoOp?:boolean)
  {
      this.activeSketch.mirror(origin, direction,autoOp);
  }

  @asSketch
  @checkInput([[Number,null],[String, null], [Boolean,true]], ['auto', 'auto', 'auto'])
  offset(amount?:number, type?:string)
  {
      this.activeSketch.offset(amount, type);
  }

  @asSketch
  @checkInput([[Number,null],[String, null], [Boolean,true]], ['auto', 'auto', 'auto'])
  offsetted(amount?:number, type?:string)
  {
      this.activeSketch.offsetted(amount, type);
  }

  @asSketch
  @checkInput([ [Number, SKETCH_FILLET_SIZE], ['AnyShapeOrCollectionOrSelectionString', null]], ['auto', 'auto'])
  fillet(size?:number, vertices?:AnyShapeOrCollectionOrSelectionString)
  {
      this.activeSketch.fillet(size, vertices);
  }

  @asSketch
  @checkInput([[Number,SKETCH_CHAMFER_DISTANCE],[Number,SKETCH_CHAMFER_ANGLE],['AnyShapeOrCollectionOrSelectionString', null]],['auto','auto', 'auto'])
  chamfer(distance?:number, angle?:number, vertices?:AnyShapeOrCollectionOrSelectionString)
  {
      this.activeSketch.chamfer(distance,angle,vertices);
  }

  @asSketch
  @checkInput(Number,'auto')
  thicken(distance?:number)
  {
      this.activeSketch.thicken(distance);
  }

  @asSketch
  @checkInput(Number,'auto')
  thickened(distance?:number)
  {
      this.activeSketch.thickened(distance);
  }

  // End Sketch

  @asSketch
  importSketch():AnyShapeOrCollection
  {
     return this.activeSketch.import();
  }

  //// BASIC OPERATIONS WITH SHAPES ////

  /** Group Shapes into a ShapeCollection */
  group(shapes:AnyShapeOrCollection, ...args:any[]):ShapeCollection
  {
    return new ShapeCollection(shapes, ...args);
  }

  /** Group Shapes into a ShapeCollection */
  collection(shapes:AnyShapeOrCollection, ...args:any[]):ShapeCollection
  {
    return new ShapeCollection(shapes, ...args);
  }

  /** Group Shapes into a ShapeCollection */
  Collection(shapes:AnyShapeOrCollection, ...args:any[]):ShapeCollection
  {
    return new ShapeCollection(shapes, ...args);
  }
  
  addToActiveLayer(obj:Obj):Geom
  {
    // NOTE: activeLayer is scene when no other layer Obj is set
    let activeLayer = this._activeLayerGroup || this.activeLayer;

    if(activeLayer && !activeLayer.has(obj))
    {
      activeLayer.add(obj);
    }
    else {
      console.warn(`geom::addToActiveLayer: Obj is already in the scene!`);
    }
    return this;
  }

  /** Add layer Obj to parent */
  addToActiveLayerParent(layer:Obj)
  { 
      // Add to layer group
      if(this._activeLayerGroup)
      {
        this._activeLayerGroup.add(layer)
      }
      else if(this.activeLayer._parent) // !!!! TODO !!!! actually this is never set
      {
        this.activeLayer._parent.add(layer);
      }
      else {
        // probably the root Scene
        this.scene.add(layer);
      }
  }
  
  /** Recursively get all objects within the scene Obj */
  allObjs()
  {
      return this.scene.descendants();
  }
  
  /** Remove Obj from Scene */
  removeObj(o:Obj)
  {
    this.scene.remove(o);
  }

  //// Some convenience methods ////

  /** Return all Shapes in Scene as ShapeCollection */
  all():ShapeCollection
  {
    return this.scene.allShapesCollection();
  }

  /** Return all shapes on the active layer */
  layerShapes():ShapeCollection
  {
    return this.activeLayer.allShapesCollection()
  }

  //// SCENE MANAGEMENT ////

  /** Create and/or activate a layer as sibling to active layer (or Scene) 
   *  IMPORTANT: a layer is always a direct child of the Scene root
  */
  layer(name?:string):Obj
  {
      if(!name)
      {
        return this.activeLayer;  
      }

      if(name === 'scene' || !name)
      {
        return this.resetLayers();
      }

      let layerObj = this.scene.getObjByName(name); // We start searching from root node = scene
      
      // new layer Obj
      if (!layerObj)
      {
        let newLayerObj = new Obj().name(name) as Obj;
        layerObj = newLayerObj;
        this.setActiveLayer(layerObj); // switch active layer to this new object
        this.addToActiveLayerParent(layerObj);  // IMPORTANT: Don't add to activeLayer, but the one above
        console.geom(`Geom::layer:: Created new layer "${name}"`);
      }
      else 
      {
        this.setActiveLayer(layerObj);
      }
      
      return this.activeLayer;
  }

  getLayerNames():Array<string>
  {
      return this.scene.children().filter( obj => obj.isLayer()).map( obj => obj.name()) as Array<string>;
  }

  getObjNames():Array<string>
  {
    let objs = this.scene.descendants().filter( obj => !obj.isLayer() && obj.name()); // make sure we don't get unnamed objects
    let objNames = objs.map( obj => obj.name()) as Array<string>; 
    return objNames;
  }

  /** Set Layer Obj as active */
  setActiveLayer(layerObj:Obj):Obj
  {
      let latestLayerOnStack = this.getLatestLayerOnStack(); // should always have scene on stack

      if(!latestLayerOnStack || (latestLayerOnStack && layerObj.name() != latestLayerOnStack.name())) // make sure we dont add doubles
      {
        this.activeLayer = layerObj;
        this.layerStack.push(layerObj); // place on layer stack
      }
      else 
      {
        // given layerObj is already last on the stack - just update activeLayer
        this.activeLayer = layerObj;
      }
      console.info(`Geom::setActiveLayer: Set "${this.activeLayer.name()}" as active! All object newly created will be on that layer`);
      
      return this.activeLayer;
  }

  getLayer(layerName:string=null):Obj
  {
    let layer:Obj;
    layer = (!layerName) ? this.activeLayer : 
            (this._activeLayerGroup) ? this._activeLayerGroup.getObjByName(layerName) : this.scene.getObjByName(layerName)
    return layer;
  }

  /** get Shapes of given/active layer */
  getLayerShapes(layerName:string=null):ShapeCollection
  {
    let layer = this.getLayer(layerName);

    if(!layer)
    {
      throw Error(`geom::getLayerShapes: Cannot get layer "${layerName}": Check if it exists!`);
    }

    return layer.allShapesCollection();
  }

  deleteLayer(layerName:string=null):boolean
  {
    let layer = this.getLayer(layerName); // or activeLayer

    if (layer)
    {
      if(layer._parent)
      {
        // remove reference from its parent 
        layer._parent._children = layer._parent._children.filter(c => c !== layer );
      }

      // if active layer return to previous layer
      if (layer.name() == this.activeLayer.name() && layer.name() == this.layerStack[this.layerStack.length-1].name())
      {
          // return to previous layer
          this.returnToPreviousLayer();
      }
      return true;
    }
    else 
    {
      throw Error(`geom::deleteLayer: No layer found with name "${layerName}`);
    }
    
  }

  getLatestLayerOnStack(): Obj
  {
    return (this.layerStack.length >= 1) ? this.layerStack[this.layerStack.length-1] : null;
  }

  returnToPreviousLayer():Obj
  {
    if(this.layerStack.length > 1) // always keep scene as root
    {
      this.layerStack.pop();
    }

    let curLayerOnStack = this.getLatestLayerOnStack();
    this.setActiveLayer(curLayerOnStack);

    return curLayerOnStack;
  }

  /** return to Scene root Obj */
  resetLayers():Obj
  {
    this.layerStack = []; // reset whole stack
    this.setActiveLayer(this.scene);
    return this.activeLayer;
  }

  /** clean out the scene and reset stuff if needed */
  reset()
  {
    this.resetLayers();
    this._annotator.reset();
    this.scene.isEmpty();
    this._pipelines = [];
  }

  /** Get a name for a layer based on existing ones and a pattern */
  getNextLayerName(name:string):string
  {
    // strip possible numbering from name
    let baseName = name.replace(/_[0-9]+$/, '');

    let layersWithBaseName = this.getLayerNames().filter( name => name.includes(baseName));
    if(layersWithBaseName.length == 0)
    {
      return `${baseName}`;
    }
    else 
    {
      let max = 0;
      layersWithBaseName.forEach( ln => 
      {
        let m = ln.match(`${baseName}_([0-9]+)*$`);
        if(m)
        {
          let n = m[1] || 0;
          if (isNumeric(n))
          {
            let i = (typeof(n) == 'string') ?  parseInt(n) : n;
            if (i > max){ max = i };
          }
        }
      })

      const layerName = `${baseName}_${max+1}`; 

      return layerName;
    }
  }

  /** Get unique name based on current names in Scene */
  getNextObjName(name:string):string
  {
    // strip possible numbering from name
    let baseName = name.replace(/_[0-9]+$/, '');

    let objsWithBaseName = this.getObjNames().filter( name => name.includes(baseName));

    if(objsWithBaseName.length == 0)
    {
      return `${baseName}`;
    }
    else 
    {
      let max = 0;
      objsWithBaseName.forEach( ln => 
      {
        let m = ln.match(`${baseName}_([0-9]+)*$`);
        if(m)
        {
          let n = m[1] || 0;
          if (isNumeric(n))
          {
            let i = (typeof(n) == 'string') ?  parseInt(n) : n;
            if (i > max)
            { 
              max = i; 
            };
          }
        }
      })

      return `${baseName}_${max+1}`; 
    }
  }

  /** Start combining new layers into another layer with given name 
   *  Call endLayerGroup() to stop grouping layers
   *  TODO: For later advanced use we can even supply a name of a parent Obj
  */
  layerGroup(name:string, inObjName?:string):Obj
  {
      this._activeLayerGroup = new Obj().name(name) as Obj;
      const parent = this.scene.getObjByName(inObjName) || this.scene;
      parent.add(this._activeLayerGroup);

      console.info(`Geom::groupLayers: Started grouping layers under name "${name}"`);
      return this._activeLayerGroup;
  }

  /** end grouping of Layer. Layers are now again created on scene root */
  endLayerGroup():Obj
  {
    let tmpLayerGroup = this._activeLayerGroup;
    this._activeLayerGroup = null;
    return tmpLayerGroup;
  }

  //// PIPELINES ////

  /** Make a new pipeline. Use .execute(fn) to set function later */
  pipeline(name?:string, fn?:() => ShapeCollection):Pipeline
  {
    const p = new Pipeline(name);
    if (fn){ p.does(fn); }
    if(!this._pipelines.includes(p)) this._pipelines.push(p);
    return p;
  }

  getPipelineNames():Array<string>
  {
      return Array.from( new Set(this._pipelines.map( p => p.name)))
  }

  //// CAPTURE SHAPES STATE ////

  /** Start capturing of all new Shapes  */
  _captureShapes():ShapeCollection
  {
    this._captureShapesStart = this.all() || new ShapeCollection(); // make sure we always have a ShapeCollection (although empty sometimes)

    return this._captureShapesStart;
  }

  /** Capture all created shapes between points in time by comparing current to _captureShapesStart */
  _captureShapesEnd():ShapeCollection
  {
    if(!this._captureShapesStart)
    { 
      throw new Error(`Geom::_captureShapesEnd(): Please use '_captureShapes()' to start capture first!`) 
    }

    const curShapes = this.all();
    let capturedShapes = new ShapeCollection();
    capturedShapes = new ShapeCollection(curShapes.filter(shape => !this._captureShapesStart.has(shape)));
    this._captureShapesStart = null;

    return capturedShapes.unique();
  }

  //// Operations with OC geometry in Scene ////

  sceneToOCCompound()
  {

  }

  //// Some special geometric operations ////

  /** Load the CGAL arrangement wasm module 
   *  NOTE: We place this in the libs directory because it gave problems in node_modules with transpilation
   *  TODO: We can probably make this work in node_modules
  */
  async _loadArr2D()
  {
    if(isBrowser() || isWorker())
    {
        if(!Arrangement2D)
        {
            console.error(`Geom::loadArr2D(): Please import Arrangement2D from 'arrangement-2d-js`);
            return;
        }
        const arrLibPath = '../libs/arrangement-2d-js/build/Arrangement2D.esm.wasm';
        const loadedWasmModule = await import(arrLibPath);
        const mainWasm = loadedWasmModule.default;

        this._Arr2D = await Arrangement2D({
          locateFile(path){
              if (path.endsWith('.wasm'))
              {
                return mainWasm;
              }
              return path;
          }
        })
        console.info('**** Loaded Arrangment2D wasm module ****');
    }
    else {
        // TODO
        const arrLibPath = 'arrangement-2d-js'; 
        this._Arr2D = await import(arrLibPath); // Use path as variable to keep Node happy
    }  
  }

  /** From 2D shapes consisting of Line Edges try to find closed polygons
   *  Using CGAL Arrangement2D
   *  @returns Arr2DPolygon { area, points } ordered by area descending
   *  NOTE: This is pretty fast. The following OC routines are not! 
   */
  _getArrangementPolys(shapesOrPoints:ShapeCollection|Array<Point>, smallestArea?:number):Array<Arr2DPolygon>
  {
    const AREA_FILTER = 50 ;
    smallestArea = smallestArea || AREA_FILTER

    if(!this._Arr2D)
    {
      console.error(`Geom::_getArrangementPolys(): Arrangement2D not loaded!`)  
      return [];
    }

    const Arr2D = this._Arr2D;
    
    const points = new Arr2D.PointList();

    if(ShapeCollection.isShapeCollection(shapesOrPoints))
    {
      const lines = shapesOrPoints.filter( s => s.type() === 'Edge' && s.edgeType() === 'Line');

      if(shapesOrPoints.length !== lines.length)
      {
        console.warn(`Geom::_getArrangmentPolys: Filterd out ${shapesOrPoints.length - lines.length} shapes. Arrangements only work with line Edges on XY plane!`)
      }
      lines.forEach(l => {
          // NOTE: roundToTolerance to get better results!
          points.push_back(new Arr2D.Point(roundToTolerance(l.start().x), roundToTolerance(l.start().y)))
          points.push_back(new Arr2D.Point(roundToTolerance(l.end().x), roundToTolerance(l.end().y)))
      })
    }
    else {
      if(Array.isArray(shapesOrPoints) && shapesOrPoints.every(p => Point.isPoint(p)))
      {
        shapesOrPoints.forEach(p => points.push_back(new Arr2D.Point(roundToTolerance(p.x), roundToTolerance(p.y))))
      }
      else {
        console.error(`Geom::_getArrangmentPolys: Detected non-Point in input. Cancelled`);
        return [];
      }
    }

    const arrBuilder = new Arr2D.ArrangementBuilder();
    const arrPolys = arrBuilder.getPolygons(points);
    const polys = [] as Array<Arr2DPolygon>

    for (let i=0; i<arrPolys.size(); i++)
    {
      const arrPoly = arrPolys.at(i);
      const poly = {
        area: arrPoly.getPolyTristripArea(),
        points: [] as Array<Point>
      } as Arr2DPolygon
      polys.push(poly)    

      for (let c=0; c<arrPoly.contour.size(); c++)
      {
        const point = arrPoly.contour.at(c);
        poly.points.push(new Point(point.x, point.y));
      }
    }

    return polys.filter(p => p.area > smallestArea).sort((a,b) => b.area - a.area);
  }

  arrange2DShapesToFaces(shapesOrPoints:ShapeCollection|Array<Point>):ShapeCollection
  {
    const polys = this._getArrangementPolys(shapesOrPoints);
    return new ShapeCollection(polys.map( p => new Wire().fromPoints(p.points)._toFace() ));
  }

  /** Arrange 2D Shapes into closed boundaries (Shells or Faces) */
  arrange2DShapesToBoundaries(shapesOrPoints:ShapeCollection|Array<Point>):ShapeCollection
  {
      const faces = this.arrange2DShapesToFaces(shapesOrPoints);
      const shapes = (faces.length) ? new ShapeCollection(new Shell().fromFaces(faces)) : null;

      return shapes.filter(s => ['Shell','Face'].includes(s.type()) )
  }

  /** Arrange 2D Shapes and get the outer contours
   *  NOTE: To get outlines we force Faces into Shells and use outerWire to get the outer Wire
   */
  arrange2DShapesToContours(shapesOrPoints:ShapeCollection|Array<Point>):ShapeCollection
  {
    try {
      const shellOrFaces = this.arrange2DShapesToBoundaries(shapesOrPoints);
      
      const faces = shellOrFaces.filter(s => s.type() === 'Face')
      const shells = shellOrFaces.filter(s => s.type() === 'Shell');
      const remainingFaces = faces.shallowCopy();
      
      const contours = new ShapeCollection();

      // Try to combine loose Faces with Shells
      shells.forEach(shell => {
        const overlapFaces = faces.filter(f => shell.overlaps(f))
        const facesToCombine = shell.faces().concat(overlapFaces);
        remainingFaces.remove(facesToCombine);
        const forcedShell = new Shell().fromFaces(facesToCombine, true) as Shell;
        const contour = forcedShell.outerWire();
        if(contour.closed()) // TODO: more tests
        {
          contours.add(contour)
        }
      })

      // Remaining isolated Faces
      contours.add(remainingFaces.map(f => (f as Face).outerWire()))

      return contours;
    }
    catch (e)
    {
      return new ShapeCollection();
    }
    
  }


}
  
  

  
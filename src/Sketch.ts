/**
 *  Sketch.ts
 *      Draw 2D Shapes on either Planes (with local coordinate system) 
 *       or on (curved) surfaces (using UV coordinates)
 *      
 *      Features:
 *          - Use one or more cursors as starting points for powerful and fast drawing 
 *                 (for example: corners() sets cursors at corner and allows to draw at those)
 *          - Use selectors and selection stack to apply operations to specific parts
 */

// constants
import { FACE_CIRCLE_RADIUS, FACE_PLANE_WIDTH, FACE_PLANE_DEPTH } from './internal'

import type { PointLike, Cursor, AnyShape, SketchPlaneName, PointLikeSequence, 
    AnyShapeCollection, VertexCollection, isSketchPlaneName, ShapeType, 
    AnyShapeOrCollection, SelectionString,
    AnyShapeOrCollectionOrSelectionString } from './internal'

import { isPointLike, isAnyShape, isSelectionString } from './internal' // typeguards

import { Point, Vector, ShapeCollection, Vertex, Edge, Wire, Face, Brep } from './internal'

import { gp_Ax3, gp_Trsf } from './wasm/archiyou-opencascade' // OC

import { checkInput } from './decorators' // NOTE: needs to be direct



//// SETTINGS ////
export const SKETCH_FILLET_SIZE = 5;
export const SKETCH_CHAMFER_DISTANCE = 10;
export const SKETCH_CHAMFER_ANGLE = 45;

export interface SketchPlane
{
    origin?: Point,
    xDir: Vector,
    yDir: Vector,
    zDir: Vector,
}

interface Operation
{ 
    type: 'union' | 'subtract' | 'intersection' | 'fillet' | 'bevel'
    resetOps?: boolean // Reset pendingOperations when done
    params?: Object // Object
}

const OPERATION_TYPE_ON_SHAPE_TYPES: {[key:string]:Array<ShapeType>} = {
    union: ['Face'],
    subtract: ['Face'],
    intersection: ['Face'], 
}

export class Sketch
{
    //// SETTINGS ////
    DEFAULT_PLANE_XDIR = [1,0,0];
    DEFAULT_PLANE_YDIR = [0,1,0];
    DEFAULT_PLANE_ZDIR = [0,0,1];
    DEFAULT_PLANE_ORIGIN = [0,0,0];
    DEFAULT_CURSOR = { point: new Point(), direction: new Vector(1,0,0) };

    PLANE_NAME_TO_PLANE: {[key:string]:SketchPlane } = {
        'xy' : { xDir: new Vector([1,0,0]), yDir: new Vector([0,1,0]), zDir: new Vector([0,0,1]) },
        'xz' : { xDir: new Vector([1,0,0]), yDir: new Vector([0,0,1]), zDir: new Vector([0,-1,0]) },
        'yz' : { xDir: new Vector([0,1,0]), yDir: new Vector([0,0,1]), zDir: new Vector([1,0,0]) },
        'left' : { xDir: new Vector([0,-1,0]), yDir: new Vector([0,0,1]), zDir: new Vector([-1,0,0]) },
        'right' : { xDir: new Vector([0,1,0]), yDir: new Vector([0,0,1]), zDir: new Vector([1,0,0]) },
        'top' : { xDir: new Vector([1,0,0]), yDir: new Vector([0,1,0]), zDir: new Vector([0,0,1]) },
        'bottom' : { xDir: new Vector([1,0,0]), yDir: new Vector([0,-1,0]), zDir: new Vector([0,0,-1]) },
        'front' : { xDir: new Vector([1,0,0]), yDir: new Vector([0,0,1]), zDir: new Vector([0,-1,0]) },
        'back' : { xDir: new Vector([-1,0,0]), yDir: new Vector([0,0,1]), zDir: new Vector([0,1,0]) },
    }
    
    //// END SETTINGS ////

    _oc; // is set in constructor prototype when Brep once OC is loaded - IMPORTANT: Don't assign here!
    _brep:Brep;
    
    mode:string = 'plane'; // or surface
    workplane:SketchPlane; // normal and main directions of Sketch Workplane
    cursors:Array<Cursor>;; // cursor stack in world coordinates
    activeCursor:Cursor; // active cursor (when iterating over multiple)
    prevLocalCursor:Cursor; // cursor on point level used for resolving relative coords - automatically set when cursor is set or manually when Point is added
    shapes:ShapeCollection = new ShapeCollection(); // Shapes in local coordinate system
    
    pendingShapes = new ShapeCollection(); // Shapes that in current scope (last created for example)
    pendingOperations:Array<Operation> = []; // Active operations
    pendingSelections = new ShapeCollection(); // Current selected Sub Shapes used in arguments of operations

    _autoOp:boolean = true; // smart automatic operations
    
    ocLcs:gp_Ax3;
    ocGcs:gp_Ax3;
    ocLocalToWorldTransform:gp_Trsf = null;
    ocWorldToLocalTransform:gp_Trsf = null;

    /** Start a 2D sketch on specific Plane */
    constructor(plane?:SketchPlaneName|Face|PointLike, yAxis?:PointLike)
    {   
        // set default workplane
        this.workplane = { 
            xDir: new Vector(this.DEFAULT_PLANE_XDIR),
            yDir: new Vector(this.DEFAULT_PLANE_YDIR),
            zDir: new Vector(this.DEFAULT_PLANE_ZDIR),
            origin: new Vector(this.DEFAULT_PLANE_ORIGIN) 
        };

        // set cursor
        this.cursors = [this.DEFAULT_CURSOR];
        this.activeCursor = this.DEFAULT_CURSOR;

        // raw x and y vector
        if (isPointLike(plane) && isPointLike(yAxis) )
        {
            this._makeWorkplaneFromXY(plane as PointLike, yAxis);
        }
        else if(isAnyShape(plane) && (plane as AnyShape).type() == 'Face') 
        {
            this._faceToWorkplane(plane as AnyShape)
        }
        else if(isSketchPlaneName(plane))
        {
            this._planeNameToWorkplane((plane as string).toLocaleLowerCase() as SketchPlaneName);
        }
        else {
            console.error(`Sketch: Unknown input: ${plane}! Please supply a plane name (xy, front etc), a Face or an x and y Vector`);
        }

        this._createSketchLayer();
        this._brep.activeSketch = this;
    }

    /** Set autoOps on or off */
    autoOp(v:boolean):Sketch
    {
        this._autoOp = v;
        return this;
    }

    _createSketchLayer()
    {
        this._brep.layer('sketch').color('blue');
    }

    _removeSketchLayer()
    {
        this._brep.deleteLayer('sketch');
        this._brep.activeSketch = null;
    }

    /** Set workplane from x and y coordinate */
    @checkInput('PointLike','Vector')
    _makeWorkplaneFromXY(x:PointLike,y:PointLike)
    {
        let xVec = (x as Vector).normalize();
        let yVec = (y as Vector).normalize();
        let zVec = xVec.crossed(yVec).normalize();
        this.workplane = { ...this.workplane, ... { xDir : xVec, yDir: yVec, zDir: zVec } };
        this._setWorkplaneTransforms();
    }

    /** Set workplane of Sketch from plane string (xy,xz,yz) or side (top, bottom, left, right, front, back) */
    _planeNameToWorkplane(plane:SketchPlaneName)
    {
        let workplane = this.PLANE_NAME_TO_PLANE[plane]

        if(!workplane)
        {
            console.warn(`Sketch::_planeNameToWorkplane: No known plane with name "${plane}! Defaulted to XY plane!`); 
        }
        else {
            this.workplane = { ...this.workplane, ...workplane };
            this._setWorkplaneTransforms();
        }
        
    }

    /** Start a 2D Sketch workplane at a Face 
     *  !!!! Not to be confused with on(Shape) which draws on a curved surface using UV coordinates !!!! */
     _faceToWorkplane(shape:AnyShape)
    {
        console.warn(`Sketch::_faceToWorkplane: TODO`);
    }

    /** Drawing directly on a curved surface with UV coords */
    on(surface:Face)
    {
        // TODO
        this.mode = 'surface';
    }

    /** Prepare transformations needed for turning local coords into world ones */
    _setWorkplaneTransforms()
    {
        /* 
            OC docs: 
                - gp_Ax3: https://dev.opencascade.org/doc/refman/html/classgp___ax3.html
                - gp_Trsf: https://dev.opencascade.org/doc/refman/html/classgp___trsf.html
                - 

        */
        this.ocGcs = new this._oc.gp_Ax3_1(); // default coordinate system
        this.ocLcs = new this._oc.gp_Ax3_3( this.workplane.origin._toOcPoint(), 
                                                    this.workplane.zDir._toOcDir(),
                                                    this.workplane.xDir._toOcDir());
        let lt = new this._oc.gp_Trsf_1();
        lt.SetTransformation_1(this.ocLcs, this.ocGcs);
        let gt = new this._oc.gp_Trsf_1();
        gt.SetTransformation_1(this.ocGcs, this.ocLcs);

        this.ocLocalToWorldTransform = lt;
        this.ocWorldToLocalTransform = gt;
    }

    /** Set origin of sketch */
    @checkInput('PointLike', 'Point')
    origin(point:PointLike):Sketch
    {
        this.workplane.origin = point as Point; // auto converted
        this._setWorkplaneTransforms();
        
        return this;
    }

    // TODO: 

    //// TRANSFORMATIONS ////

    /** This is the active cursor of all cursors in this.cursors */
    // NOTE: always in world coords
    _setActiveCursor(cursor?:Cursor)
    {
        if (!cursor)
        {
            cursor = (this.cursors.length > 0) ? this.cursors[this.cursors.length-1] : { point: new Point(), direction: new Vector(1,0,0) };
        }
        this.activeCursor = cursor;
        this.prevLocalCursor = this._toLocalCursor(cursor);
    }

    /** Set given Cursor as all cursors - in world coordinates */
    _setCursor(cursor:Cursor|PointLike)
    {
        if (isPointLike(cursor))
        {
            cursor = { point: new Point(cursor as PointLike), direction: new Vector(1,0,0) } as Cursor;
        }
        this.cursors = [cursor];
        this.prevLocalCursor = this._toLocalCursor(cursor);
    }

    /** Update cursor based on (just created) Shape */
    @checkInput('AnyShape', 'auto')
    _setCursorByShape(shape:AnyShape)
    {
        if(!shape)
        {
            console.warn(`Sketch::_setCursorByShape: No shape to set Cursor!`)
            return;
        }

        let cursor = shape.getCursor();
        if (!cursor)
        {
            console.warn(`Sketch::_setCursorByShape: Could not get cursor from shape: ${shape}!`)
        }
        else {
            this.cursors = [cursor];
            this._setActiveCursor(cursor);
        }
    }

    /** Used for relative coordinates between arguments. 
     *  Like arcTo([100,100],['+100','+100']) - second Point is relative to [100,100], so we need to set it!
     *  NOTE: problem with using relative polar coordinates because we don't know arc tangent yet!
     * */
    @checkInput('PointLike', 'Point')
    _setPrevLocalPoint(point:PointLike)
    {
        this.prevLocalCursor = { point: new Point(point), direction: new Vector(1,0,0) }; // auto converted
    }

    /** Resolve PointLike based on prevLocalPoint or Cursor */
    @checkInput(['PointLike', ['PointLike',null]], ['auto', 'Point'])
    _resolvePointLikeToLocalPoint(point:PointLike, ...args) // local Point
    {
        // We keep track of prev local Point in this.prevLocalCursor, either automatically or manually
        return new Point().cursor(this.prevLocalCursor).fromPointLike(point, ...args)
    }
    
    /** Transform PointLike to absolute World coordinate with:
     *      
     *      - Resolve relative coordinates (cartesian and polar) - if not the same as cursor, can be set by prevLocalPoint
     *      - Transform local coords to world coordinates
    */
    @checkInput(['PointLike'], ['Point']) // IMPORTANT: ('auto','auto'): cannot resolve here: need to be in method for the right prevLocalPoint
    _transformPointToWorld(point:PointLike):Point
    {
        
        let p = this._toWorld(point as Point); // auto converted
        return p;
    }

    /** Transform local coordinate Point to world coordinates */
    _toWorld(point:Point):Point
    {        
        let transformedPoint = new Point()._fromOcPoint( point._toOcPoint().Transformed(this.ocLocalToWorldTransform));

        return transformedPoint;
    }

    @checkInput('PointLike', Point)
    _toLocal(p:PointLike):Point
    {
        let point = p as Point; // auto converted
        let transformedPoint = new Point()._fromOcPoint( point._toOcPoint().Transformed(this.ocWorldToLocalTransform));

        return transformedPoint;
    }

    @checkInput('Cursor', 'auto')
    _toLocalCursor(cursor:Cursor):Cursor
    {
        return { point: this._toLocal(cursor.point), direction: this._toLocal(cursor.direction).toVector() };
    }

    //// OPERATIONS ////

    /** Everything after a new Edge */
    _processNewEdge(newEdge:Edge)
    {
        if (!newEdge)
        {
            return;
        }
        // add it to this.shapes
        this.shapes.add(newEdge);
        this._doPendingOps(newEdge);
        this._setPendingShapes(newEdge);
    }

    /** After creating a new Shape we see if we need to run operations on them */
    _doPendingOps(newShapes:AnyShapeOrCollection)
    {
        if(this.pendingOperations.length > 0)
        {
            this.pendingOperations.forEach( op => this._doOperation(op, newShapes))
        }
        // after finishing the ops: if any op want reset: reset pending ops
        if ( this.pendingOperations.some( op => op.resetOps === true))
        {
            this.pendingOperations = [];
        }
    }

    /** Do pending operation */
    _doOperation(op:Operation, newShapes:AnyShapeOrCollection)
    {
        const OP_TYPE_TO_DO_METHOD = {
            'union' : 'doUnion',
            'subtract' : 'doSubtract',
            'intersect' : 'doIntersect',
            'fillet' : 'doFillet',
            'chamfer' : 'doChamfer',
            // TODO MORE
        }
        
        //const ALL_SKETCH_SHAPES = ['Edge','Wire','Face'];
        //let shapeTypeOp = OPERATION_TYPE_ON_SHAPE_TYPES[op.type];

        let methodName = OP_TYPE_TO_DO_METHOD[op.type];
        if (!methodName)
        {
            console.warn(`Sketch::_doOperation: Cannot do operation of type "${op.type}". Check OP_TYPE_TO_DO_METHOD to have a method bound to it!`);
        }
        else {
            this[methodName](newShapes, op.params); // do operation
        }
    }
    

    /** Convenience method combining smartFaceOps and afterNewShapes */
    _processNewFace(newFace:Face, autoOp:boolean=true)
    {
        this.shapes.add(newFace);
        this._doFaceOps(newFace, autoOp);
        this._setPendingShapes(newFace);
    }

    /** Apply union or subtraction based on relation of new Shape with existing ones in this.shapes  */
    _doFaceOps(newFace:Face, autoOp:boolean=true)
    {   
        // Smart operations based on position of new Shape(s) in others
        // NOTE: the new Face is already added to this.shapes
        // TODO: both ways of containing: newShapes contain previous
        
        // NOTE: Use all Shapes here, not only pendingShapes, exclude isTmp Shapes
        let prevShapes = new ShapeCollection(this.shapes.not(newFace).filter( s => !s._isTmp));  // force collection

        if(this.pendingOperations.length == 0)
        {
            if (this._autoOp && autoOp)
            {
                let intersections = prevShapes._intersections(newFace);

                if (intersections.length > 0)
                {
                    let containers = new ShapeCollection(prevShapes.containers(newFace)); // Shape or ShapeCollection            

                    // NOTE: containers entirely contains the other Shape, also use bbox
                    let bboxContain = prevShapes.toArray().some( s => s.bbox()._containsBbox(newFace.bbox()))

                    if (containers.length > 0 || bboxContain)
                    {
                        this.shapes = prevShapes._subtracted(newFace);
                    }
                    else // just union
                    {
                        this.shapes = new ShapeCollection(prevShapes.unioned(newFace));
                    }
                }
            }
        }
        else 
        {
            // pending ops
            this._doPendingOps(newFace);
        }
    }

    /** Update pending Shapes after new Shapes */
    _setPendingShapes(newShapes:AnyShapeOrCollection)
    {
        this.pendingShapes = new ShapeCollection(newShapes);
    }

    //// EDGE DRAWING API ////

    /*
        The Sketcher makes it easy to create 2D Shapes with:

        - All basic 2D Shapes (line, rect, circle )
        - Shape creation is simplified with a cursor logic (including the last Point if not otherwise stated):
            - line([0,0],[100,0]) - like in 3D
            - lineTo(100,0) - extra in Sketcher in 2D
        - Multiple 2D Operations ( fillet, chamfer, mirror, extend)
        - naming logic to identify and reuse elements in Sketch
        - A selection stack and related navigation

    */

    /** Combine All linear Shapes into Wires */
    combine()
    {
        this.shapes = this.shapes.upgrade();
    }

    /** Move cursor to local coordinate */
    @checkInput('PointLike', 'auto') // let original input through
    moveTo(point:PointLike, ...args):Sketch
    {
        let localPoint = this._resolvePointLikeToLocalPoint(point, ...args);
        let toPointWorld = this._transformPointToWorld(localPoint);

        this._setCursor({ 
            point: toPointWorld,  // auto converted
            direction: new Vector(1,0,0) }); 

        return this;
    }

    /** Line from active cursors to given point */
    @checkInput('PointLike', 'auto') // don't resolve just yet
    lineTo(point:PointLike, ...args):Sketch
    {
        let localPoint:Point;
        let worldPoint:Point;
        let line:Edge;
        this.cursors.forEach( c => 
        {
            this._setActiveCursor(c);
            localPoint = this._resolvePointLikeToLocalPoint(point, ...args)
            worldPoint = this._transformPointToWorld(localPoint);
            line = new Edge(c.point, worldPoint);
            this._processNewEdge(line)
        });

        // update cursor with line Edge
        this._setCursorByShape(line);

        return this;
    }

    /** Make Arc from active cursors to given Point */
    @checkInput(['PointLike','PointLike'], ['auto', 'auto'])
    arcTo(mid:PointLike, end:PointLike):Sketch
    {  
        let arc:Edge;
        this.cursors.forEach( c => 
            {
                this._setActiveCursor(c);
                let midPointLocal = this._resolvePointLikeToLocalPoint(mid);
                this._setPrevLocalPoint(midPointLocal);
                let midPointWorld = this._transformPointToWorld(midPointLocal);
                let endPointWorld = this._transformPointToWorld(this._resolvePointLikeToLocalPoint(end)); // IMPORTANT: given relative coordinates are resolved in relationship to the last given Point
                arc = new Edge().makeArc(c.point, midPointWorld, endPointWorld);
                this.shapes.push(arc);
            });

        this._setCursorByShape(arc);

        return this;
    }

    /** Make Spline from active cursors to given Point */
    // NOTE: we need to parse the given PointLikes one by one and resolve relative coords sequentially
    @checkInput('PointLikeSequence', 'auto') 
    splineTo(points:PointLikeSequence, ...args):Sketch
    {
        let spline;
        this.cursors.forEach( c => 
        {
            this._setActiveCursor(c);
            // We have a PointLikeSequence - so either a ShapeCollection/VertexCollection of Vertices or Array of PointLikes
            let transformedVertices:AnyShapeCollection = new ShapeCollection();
            if (ShapeCollection.isShapeCollection(points))
            {
                let vertices = new VertexCollection(points); 
                let verticesWithCursor = vertices.prepended(c.point._toVertex());
                // NOTE: no need to resolve here!
                transformedVertices = verticesWithCursor.map( v => this._transformPointToWorld(v as PointLike)._toVertex());
            }
            else if(Array.isArray(points))
            {
                // Here we need to resolve possible relative coordinates with last point
                let allPoints = points.concat(args);
                transformedVertices.add(c.point._toVertex());
                let prevWorldPoint:Point = null;
                allPoints.forEach( p => 
                {
                    let localPoint = this._resolvePointLikeToLocalPoint(p);
                    this._setPrevLocalPoint(localPoint);
                    let worldPoint = this._transformPointToWorld(localPoint);
                    if(worldPoint)  
                    {
                        transformedVertices.add(worldPoint._toVertex());
                        prevWorldPoint = worldPoint;
                    }
                })
            }
            else {
                // just throw error
                throw new Error('ERROR: Sketch::splineTo: Either supply a ShapeCollection of Vertices or an array of PointLikes!')
            }

            spline = new Edge().makeSpline(transformedVertices);
            this.shapes.push(spline);
        })

        // set cursor to new position
        this._setCursorByShape(spline);

        return this;
    }

    /** Combine all Edges and Wires and try to close it into single Shapes */
    // TODO: more advanced ways of combining? For example two Wires?
    close():Sketch
    {   
        let upgradedCollection = this.shapes.upgrade(); // combines Edges into Wires
        
        // Close all created Wires
        let oldWires = new ShapeCollection();
        let newFaces = new ShapeCollection();

        upgradedCollection.forEach(s => 
        {
            if(s.type() == 'Wire')
            { 
                oldWires.add(s);
                let closedWireFace = (s as Wire)._toFace()
                if(closedWireFace)
                {
                    newFaces.add( closedWireFace );
                }
            };
        });
        upgradedCollection.replace(oldWires, newFaces);
        this.shapes = upgradedCollection;

        this._brep.activeSketch = null; 

        return this;
    }

    //// FACE DRAWING API ////

    /*
        Faces are created on the XY plane and then rotated towards normal of workplane
    */

    /** Some created Faces need to be rotated to face workplane */
    _rotateFaceToWorkplane(face:Face)
    {
        if( !(face instanceof Face))
        {
            console.warn(`Sketch::rotateFaceToWorkplane: ${face} is not a Face!`);
            return;
        }
        face.rotateTo(this.workplane.zDir); // this.workplane.origin
    }

    @checkInput('PointLike', 'auto') 
    rectTo(point:PointLike, ...args):Sketch
    {
        let face:Face;
        let resolvedPoint;
        this.cursors.forEach( c => 
        {
            this._setActiveCursor(c);
            resolvedPoint = new Point().cursor(c).fromPointLike(point); // IMPORTANT: resolve relative Point coordinates with cursor
            face = new Face().makePlaneBetween(c.point, resolvedPoint); 
            this._rotateFaceToWorkplane(face);
            this._processNewFace(face);
        })

        // set cursor to new position (not use _setCursorByShape because it will return center of Rect)
        this._setCursor(resolvedPoint);
        

        return this;

    }

    @checkInput([[Number,FACE_PLANE_WIDTH], [Number,FACE_PLANE_DEPTH]], ['auto','auto'])
    rect(width?:number, height?:number):Sketch
    {
        let face:Face; 
        this.cursors.forEach( c => 
        {
            this._setActiveCursor(c);
            face = new Face().makePlane(width, height, c.point, [0,0,1]);
            this._rotateFaceToWorkplane(face);
            this._processNewFace(face);
        })

        // set cursor to position of last Face
        this._setCursorByShape(face);

        return this;
    }

    @checkInput('PointLike', 'Point')
    circleTo(point:PointLike, ...args):Sketch
    {
        let face:Face; 
        this.cursors.forEach( c => 
        {
            this._setActiveCursor(c);
            let resolvedPoint = new Point().cursor(c).fromPointLike(point); // IMPORTANT: resolve relative Point coordinates with cursor
            let radius = c.point.distance(resolvedPoint);
            face = new Face().makeCircle(radius, c.point); // cursor is already world coordinate
            this._rotateFaceToWorkplane(face);
            this._processNewFace(face);
        })

        // set cursor to new position
        this._setCursor(point);

        return this;
    }

    @checkInput([[Number,FACE_CIRCLE_RADIUS]], ['auto'])
    circle(radius:number):Sketch
    {
        let face:Face; 
        this.cursors.forEach( c => 
        {
            this._setActiveCursor(c); // cursor world position is already resolved by for example moveTo()
            face = new Face().makeCircle(radius, c.point);
            this._rotateFaceToWorkplane(face);
            this._processNewFace(face);    
        })

        // cursor is unchanged by circle()
        

        return this;
    }

    //// EDGE AND FACE OPERATIONS ////

    /** Make all shapes pending */
    all():Sketch
    {
        this.pendingShapes = this.shapes.shallowCopy();
        return this;
    }

    /** Set pendingShapes as temporary (will not be imported) */
    isTemp():Sketch
    {
        this.pendingShapes.forEach( s => s._isTmp = true);
        return this;
    }

    /** Select certain parts of pendingShapes for operations to use */
    @checkInput('SelectionString', 'auto')
    select(selectionString:SelectionString):Sketch
    {
        this.pendingSelections = this.pendingShapes.select(selectionString);
        return this
    }

    /** Set vertices of pendingShapes as cursors */
    atVertices():Sketch
    {
        let vertices = this.pendingShapes.vertices() as VertexCollection;
        this.cursors = vertices.toArray().map(v => ({ point: new Point(v as Vertex), direction: new Vector(1,0,0) }) );

        return this;
    }

    /** Get and reset pending selections */
    _getPendingSelections():ShapeCollection
    {
        let p = this.pendingSelections.shallowCopy();
        this.pendingSelections = new ShapeCollection(); // reset
        return p
    }

    /** Mirror all Shapes in Sketch */
    @checkInput([ ['PointLike',[0,0]], ['PointLike', [0,1]], ['Boolean', true]], ['Point','Vector', 'auto'])
    mirror(origin?:PointLike, direction?:Vector, autoOp?:boolean):Sketch // NOTE: this is different then Shape.mirrored(): axis instead of normal
    {
        let localNormal = (direction as Vector).rotated(90);
        let localOrigin = origin as Point;

        let worldNormal = this._toWorld(localNormal);
        let worldOrigin = this._toWorld(localOrigin);
        
        this.shapes = this.shapes.mirrored(worldOrigin, worldNormal);
        
        // automatic operations based on shape types: upgrade/close and union
        if (autoOp)
        {
            if(this.shapes.getShapesByTypes(['Edge', 'Wire']).length >= 2)
            {
                // Check for Wires to combine
                this.shapes.upgrade();
            }
            if(this.shapes.getShapesByType('Face').length >= 2)
            {
                // Faces to union
                this.shapes = new ShapeCollection(this.shapes.unioned());
            }
        }

        return this;
    }

    /** Offset pendingShapes a given amount with a specific type (tangent, arc, intersection) */
    @checkInput([[Number,null],[String, null]], ['auto', 'auto'])
    offset(amount?:number, type?:string):Sketch
    {
        // Offset for Faces just offsets the pendingShapes
        // You can offset all shapes by using all() to set pendingShapes to all
        this.combine(); // // for Wires/Edges: combine them into Wires and offset the one Wire that is attached to pendingShapes

        let offsetShapes = new ShapeCollection();

        this.pendingShapes.forEach( shape => 
        {
            if (shape.type() == 'Face')
            {
                shape.offset(amount, type, null);            
            }
            else if(shape.type() == 'Edge' || shape.type() == 'Wire')
            {
                let intersectors = this.shapes.intersectors(shape); // NOTE: at minimum we get a the same Shape as pendingShape
                
                if (intersectors)
                {
                    offsetShapes.add(intersectors.getShapesByTypes(['Wire','Edge']).offset(amount, null, this.workplane.zDir));
                }
            }
        })
        
        this.pendingShapes = offsetShapes;
        

        return this;
        
    }

    /** Offset pendingShapes of Sketch Shapes a given amount with a specific type (tangent, arc, intersection) */
    @checkInput([[Number,null],[String, null], [Boolean,true]], ['auto', 'auto', 'auto'])
    offsetted(amount?:number, type?:string):Sketch
    {
        this.combine(); // // for Wires/Edges: combine them into Wires and offset the one Wire that is attached to pendingShapes

        let newShapes = new ShapeCollection();

        this.pendingShapes.forEach( shape => 
        {
            if (shape.type() == 'Face')
            {
                newShapes.add(shape.offsetted(amount, type, null));            
            }
            else if(shape.type() == 'Edge' || shape.type() == 'Wire')
            {
                let intersectors = this.shapes.intersectors(shape); // NOTE: at minimum we get a the same Shape as pendingShape
                if (intersectors)
                {
                    let offsetShapes = intersectors.getShapesByTypes(['Wire','Edge']).offsetted(amount, null, this.workplane.zDir);
                    newShapes.add(offsetShapes);
                }
            }
        })

        this.shapes.add(newShapes);
        this.pendingShapes = newShapes;

        return this;
    }

    @checkInput([Number], [Number])
    thicken(amount:number)
    {
        this.combine(); // // for Wires/Edges: combine them into Wires and offset the one Wire that is attached to pendingShapes

        let thickenShapes = new ShapeCollection();

        this.pendingShapes.forEach( shape => 
        {
            if (shape.type() == 'Face')
            {
                shape.thicken(amount, 'center');            
            }
            else if(shape.type() == 'Edge' || shape.type() == 'Wire')
            {
                let intersectors = this.shapes.intersectors(shape); // NOTE: at minimum we get a the same Shape as pendingShape
                
                if (intersectors)
                {
                    /* NOTE: We need to replace the old Shape with the thickened one 
                        (normally this works with Obj and Scene but for Sketch that does not apply)
                        We only need to do this if a Shape really changes type (and thus becomes a new Shape instance)
                    */
                    let oldShapes = intersectors.getShapesByTypes(['Wire','Edge']);
                    let newShapes = oldShapes.thickened(amount, 'center');
                    this.shapes.remove(oldShapes);
                    this.shapes.add(newShapes);
                    thickenShapes.add(newShapes);
                }
            }
        })
        
        
        this.pendingShapes = thickenShapes;
        return this;
    }

    @checkInput([Number], [Number]) 
    thickened(amount:number)
    {
        this.combine(); // // for Wires/Edges: combine them into Wires and offset the one Wire that is attached to pendingShapes

        let thickenShapes = new ShapeCollection();

        this.pendingShapes.forEach( shape => 
        {
            if (shape.type() == 'Face')
            {
                shape.thicken(amount, 'center');            
            }
            else if(shape.type() == 'Edge' || shape.type() == 'Wire')
            {
                let intersectors = this.shapes.intersectors(shape); // NOTE: at minimum we get a the same Shape as pendingShape
                
                if (intersectors)
                {
                    thickenShapes.add(intersectors.getShapesByTypes(['Wire','Edge']).thickened(amount, 'center'));
                }
            }
        })
        
        this.shapes.add(thickenShapes);
        this.pendingShapes = thickenShapes;
        return this;
    }

    /** Apply fillet to Edges or Faces */
    @checkInput([ [Number, SKETCH_FILLET_SIZE], ['AnyShapeOrCollectionOrSelectionString', null]], ['auto', 'auto'])
    fillet(size?:number, vertices?:AnyShapeOrCollectionOrSelectionString):Sketch
    {
        if (this.pendingShapes.every(s => s.type() == 'Edge' ||  s.type() == 'Wire'))
        {
            // For Edges fillet is applied after the next Edge: set pendingOperations
            this.pendingOperations.push({ type: 'fillet', params: { size: size, vertices: vertices }, resetOps: true });
        }

        else if(this.pendingShapes.every(s => s.type() == 'Face'))
        {
            // For Faces, fillet is applied on last created Face
            let selectedVertices:VertexCollection;
            if(vertices === null)
            {
                // check pending selected sub Shapes
                let selections = this._getPendingSelections();
                if(selections)
                {
                    selectedVertices = selections.getShapesByType('Vertex') as VertexCollection;    
                }
                else {
                    selectedVertices = null;
                }
            }
            else if (isSelectionString(vertices))
            {   
                selectedVertices = this.pendingShapes.select(vertices as SelectionString).getShapesByType('Vertex') as VertexCollection; // accept any selector strings but make sure the selection contains Vertices
            }
            else {
                
            }
            // Do fillet directly
            this.pendingShapes.forEach( shape => 
            {
                shape.fillet(size, selectedVertices); // NOTE: Vertices not in Shape are automatically skipped
            });
        }
        else {
            console.error(`Sketch::fillet: Pending Shapes "${this.pendingShapes} can not be filleted!`);
        }

        return this;
    }

    /** Do fillet operation on last added Edge */
    // NOTE: new Edge is already in this.shapes
    doFillet(newEdge:Edge, params)
    {
        // we have a new Edge, and want to add to an existing linear Shape with a fillet
        let linearShapes = this.shapes.getShapesByTypes(['Edge', 'Wire']).not(newEdge);

        let lastLinearShape = linearShapes.last();
        // first test if the two Edges are connected
        let connectingVertex = lastLinearShape._intersections(newEdge).first();
        if(!connectingVertex)
        {
            console.error(`Sketch::doFillet: Last and current Edge don't connect to do fillet! No fillet is applied.`);
            return;
        }
        // Now first combine both linear Shapes into one Wire: Note that we convert any existing Wire to edges()
        let wireCombination = new ShapeCollection(lastLinearShape.edges().add(newEdge)).upgrade(); 
        let combinedWire = wireCombination.first();

        if (combinedWire.type() == 'Wire')
        {
            let filletWire = (combinedWire as Wire).fillet(params.size, connectingVertex as Vertex)
            this.shapes.remove(lastLinearShape,newEdge);
            this.shapes.add(filletWire);
        }
        else {
            console.error(`Sketch::doFillet: Something went wrong combining the two linear Shapes into one Wire before filleting!`)
        }

    }

    @checkInput([[Number,SKETCH_CHAMFER_DISTANCE],[Number,SKETCH_CHAMFER_ANGLE],['AnyShapeOrCollectionOrSelectionString', null]],['auto','auto', 'auto'])
    chamfer(distance?:number, angle?:number, vertices?:AnyShapeOrCollectionOrSelectionString):Sketch
    {
        if (this.pendingShapes.every(s => s.type() == 'Edge' ||  s.type() == 'Wire'))
        {
            // For Edges fillet is applied after the next Edge: set pendingOperations
            this.pendingOperations.push({ type: 'fillet', params: { distance: distance, angle: angle }, resetOps: true });
        }

        else if(this.pendingShapes.every(s => s.type() == 'Face'))
        {
            // For Faces, chamfer is applied on last created Face
            let selectedVertices:VertexCollection;
            if(vertices === null)
            {
                // check pending selected sub Shapes
                let selections = this._getPendingSelections();
                if(selections)
                {
                    selectedVertices = selections.getShapesByType('Vertex') as VertexCollection;    
                }
                else {
                    selectedVertices = null;
                }
            }
            else if (isSelectionString(vertices))
            {   
                selectedVertices = this.pendingShapes.select(vertices as SelectionString).getShapesByType('Vertex') as VertexCollection; // accept any selector strings but make sure the selection contains Vertices
            }
            else {
                
            }

            // Do fillet directly
            this.pendingShapes.forEach( shape => 
            {
                shape.chamfer(distance, angle, selectedVertices); // NOTE: Vertices not in Shape are automatically skipped
            });
        }
        else {
            console.error(`Sketch::chamfer: Pending Shapes "${this.pendingShapes} can not be chamfered!`);
        }

        return this;
    }

    /** Do chamfer operation on last added Edge */
    doChamfer(newEdge:Edge, params:{[key:string]:any})
    {
        let linearShapes = this.shapes.getShapesByTypes(['Edge', 'Wire']).not(newEdge);
        let lastLinearShape = linearShapes.last();
        let connectingVertex = lastLinearShape._intersections(newEdge).first();
        if(!connectingVertex)
        {
            console.error(`Sketch::doChamfer: Last and current Edge don't connect to do chamfer! No chamfer is applied.`);
            return;
        }
        let wireCombination = new ShapeCollection(lastLinearShape.edges().add(newEdge)).upgrade(); 
        let combinedWire = wireCombination.first();

        if (combinedWire.type() == 'Wire')
        {
            let chamferWire = (combinedWire as Wire).chamfer(params.distance, params.angle, connectingVertex as Vertex);
            this.shapes.remove(lastLinearShape,newEdge);
            this.shapes.add(chamferWire);
        }
        else {
            console.error(`Sketch::doFillet: Something went wrong combining the two linear Shapes into one Wire before filleting!`)
        }

    }
    
    //// FACE API OPERATIONS ////

    /** Combine Face Shapes into new one(s) */
    union():Sketch
    {
        this.pendingOperations.push({ type: 'union' });

        return this;
    }

    doUnion(newShapes:ShapeCollection, params)
    {
        this.shapes = new ShapeCollection(this.pendingShapes.concat(newShapes).unioned());
    }

    /** Alias for union: Combine Face Shapes into one(s) */
    add():Sketch
    {
        return this.union();
    }

    subtract():Sketch
    {
        this.pendingOperations.push({ type: 'subtract' });
        return this;
    }

    doSubtract(newShapes:ShapeCollection, params)
    {
        this.shapes = this.shapes.subtracted(newShapes);
    }

    cut():Sketch
    {
        return this.subtract();
    }

    intersection():Sketch
    {
       this.pendingOperations.push({ type: 'intersection' });
       return this;
    }

    overlap()
    {
       return this.intersection();
    }


    //// FINISHING SKETCHES ////

    /** Just get Shapes without adding to Scene (used by IO) */
    getShapes():ShapeCollection|AnyShape
    {
        this.combine();
        return new ShapeCollection(this.shapes.filter(s => !s._isTmp)).checkSingle(); // force collection from filter
    }

    import():ShapeCollection|AnyShape
    {
        this.combine(); // check if we can combine/upgrade Shapes. Mostly Edges to Wires
        let sketchShapes = new ShapeCollection(this.shapes.filter(s => !s._isTmp)).checkSingle();

        let isCollection = ShapeCollection.isShapeCollection(sketchShapes);
        
        // combine incoming Shapes into layer or single Shape
        let sketchName = this._brep.getNextLayerName('Sketch');
        
        this._removeSketchLayer(); // remove original sketch layer
        
        let importedShapeOrCollection = sketchShapes.copy(); // automatically added to Scene
        
        if (isCollection)
        { 
            importedShapeOrCollection.setName(sketchName);
        }
        else {
            importedShapeOrCollection.setName(sketchName + 'Shape')
        }


        console.geom(`Sketch::import(): Imported ${ isCollection ? importedShapeOrCollection.length : 1 } Shapes on layer "${this._brep.getLayer().name()}"`);
        
        return importedShapeOrCollection;

    }

    /** Alias for import */
    importSketch():ShapeCollection|AnyShape
    {
        return this.import();
    }

    /** Alias for import */
    end():ShapeCollection|AnyShape
    {
        return this.import();
    }

    //// OPERATIONS THAT TURN SKETCH INTO A SHAPE ////

    



    



    

    

    
    

    





}

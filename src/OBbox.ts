/**
 *      OBbox.ts - Orientated Orientated Bounding Box
 * */

import { Point, Vector, Shape, Obj, Vertex, Edge, Face, Shell, Solid, AnyShape, ShapeCollection } from './internal'
import { PointLike, isPointLike, MainAxis, Side } from './internal' // types
import { checkInput, addResultShapesToScene } from './decorators'; // Import directly to avoid error in ts-node
import { roundToTolerance } from './utils'

import { SIDES, SIDE_TO_AXIS } from './internal'

export class OBbox
{
    //// PROPERTIES

    _oc:any;
    _geom:any;
    _ocOBbox:any = null;

    position:Point; // center of obbox

    /** Create 2D or 3D Bbox from a Shape */
    constructor(shape:AnyShape)
    {
        if(shape)
        {
            this.create(shape)
        }
        else {
            console.warn(`OBbox(): Please supply a shape to create OBbox. Or set later with create(shape)`)
        }
    }
    
    create(shape:AnyShape):this
    {
        this._ocOBbox = new this._oc.Bnd_OBB_1();
        this._oc.BRepBndLib.prototype.constructor.AddOBB(
            shape._ocShape, this._ocOBbox, true, false, false); // useTriangulation, isOptimal, theIsShapeToleranceUsed                    

        return this;
    }

    /** Set public properties from _ocOBbox */
    _setFromOcOBbox()
    {
        if(this._ocOBbox)
        {
            this.position = this.center();
        }
    }
    
    /** Get center of Orientated Bounding Box */
    center():Point
    {
        return new Point()._fromOcXYZ(this._ocOBbox.Center());
    }

    /** Get corner Points of Bbox in global coordinate system */
    corners():Array<Point>
    {
        const xAxisWidthHalf = this.xDir().scaled(this.width()/2); // normal of OBbox x axis
        const yAxisDepthHalf = this.yDir().scaled(this.depth()/2); // 
        const zAxisHeightHalf = this.zDir().scaled(this.height()/2);

        return [
            this.center().moved(xAxisWidthHalf.reversed()).move(yAxisDepthHalf).move(zAxisHeightHalf), // in local: leftbottomfront
            this.center().moved(xAxisWidthHalf).move(yAxisDepthHalf).move(zAxisHeightHalf), // rightbottomfront
            this.center().moved(xAxisWidthHalf).move(yAxisDepthHalf.reversed()).move(zAxisHeightHalf), // rightbottomback
            this.center().moved(xAxisWidthHalf.reversed()).move(yAxisDepthHalf.reversed()).move(zAxisHeightHalf), // leftbottomback

            this.center().moved(xAxisWidthHalf.reversed()).move(yAxisDepthHalf).move(zAxisHeightHalf.reversed()), //  lefttopfront
            this.center().moved(xAxisWidthHalf).move(yAxisDepthHalf).move(zAxisHeightHalf.reversed()), // righttopfront
            this.center().moved(xAxisWidthHalf).move(yAxisDepthHalf.reversed()).move(zAxisHeightHalf.reversed()), // righttopback
            this.center().moved(xAxisWidthHalf.reversed()).move(yAxisDepthHalf.reversed()).move(zAxisHeightHalf.reversed()), // lefttopback
        ]
    }

    /** Return X axis normal of this OBbox, mostly along global x-axis */
    xDir():Vector
    {
        return new Point()._fromOcXYZ(this._ocOBbox.XDirection()).toVector();
    }

    /** Return Y axis normal of this OBbox */
    yDir():Vector
    {
        return new Point()._fromOcXYZ(this._ocOBbox.YDirection()).toVector();
    }

    /** Return Z axis normal of this OBbox */
    zDir():Vector
    {
         return new Point()._fromOcXYZ(this._ocOBbox.ZDirection()).toVector();
    }

    width():number
    {
        return roundToTolerance(this._ocOBbox.XHSize()*2)
    }

    depth():number
    {
        return roundToTolerance(this._ocOBbox.YHSize()*2)
    }

    height():number
    {
        return roundToTolerance(this._ocOBbox.ZHSize()*2)
    }

    copy()
    {
        // TODO: For BBox compat
    }

    /** Get Point of left, front, bottom corner in global coordinate system */
    min():Point
    {
        return this.corners()[0]
    }

    @checkInput('MainAxis', 'auto')
    minAtAxis(a:MainAxis)
    {
        // TODO: For BBox compat
    }

    @checkInput('MainAxis', 'auto')
    maxAtAxis(a:MainAxis)
    {
        // TODO: For BBox compat
    }

    /** Get maximum point (right,top,back) */
    max():Point
    {
        return this.corners()[6]
    }

    minX():number
    {
        return this.min().x;
    }

    maxX():number
    {
        return this.max().x;
    }

    minY():number
    {
        return this.min().y;
    }

    maxY():number
    {
        return this.max().y;
    }

    minZ():number
    {
        return this.min().z;
    }

    maxZ():number
    {
        return this.max().z;
    }


    /** Maximum size of Bbox */
    maxSize():number
    {
        return [this.width(), this.height(),this.depth()].sort((a,b) => b - a )[0];
    }

    /** Maximum size of Bbox */
    minSize():number
    {
        return [this.width(), this.height(),this.depth()]
                    .sort((a,b) => a - b )
                    .filter(s => s !== 0)[0]; // 0 sizes (when Bbox is 2D/1D) are not used
    }

    /** Get frontal Face (3D) or Edge (2D) */
    front()//:Vertex|Edge|Face
    {
        // TODO
       // return this._getSide('front');
    }

    /** Get back Face (3D) or Edge (2D) */
    back()//:Vertex|Edge|Face
    {
        // TODO
       //return this._getSide('back');
    }

    /** Get left Face (3D) or Edge (2D) */
    left()//:Vertex|Edge|Face
    {
        // TODO
        //return this._getSide('left');
    }

    /** Get left Face (3D) or Edge (2D) */
    right()//:Vertex|Edge|Face
    {
        // TODO
        //return this._getSide('right');
    }

    /** Get left Face (3D) or Edge (2D) */
    top()//:Vertex|Edge|Face
    {
        // TODO
        //return this._getSide('top');
    }

    /** Get left Face (3D) or Edge (2D) */
    bottom()//:Vertex|Edge|Face
    {
        // TODO
        //return this._getSide('bottom');
    }

    /** Get one of the 8 Vertices of the Bbox 
     *  @param - a string like 'leftfront', 'bottomright'
     *  Order of sides does not matter
    */
    corner(where:string)//:Point // TODO: change to Point
    {
        // TODO
    }

    /** Get the diagonal of Orientated Bounding Box as Vertex (zero size Bbox) or Edge */
    diagonal()//:Vertex|Edge
    {
        // TODO
    }

    /** Get position of Bbox based on percentages of x,y,z */
    @checkInput('PointLike', 'Point')
    getPositionAtPerc(p:PointLike, ...args)//:Point
    {
        // TODO
    }

    /** Enlarge by offsetting current Bbox in all direction a given amount. Returns a new Bbox. */
    enlarged(amount:number)//:OBbox
    {
      // TODO
    }

    /** Return a new Bbox by adding another */
    added(other:OBbox)//:OBbox
    {
        // TODO
    }


    //// CALCULATED PROPERTIES ////

    /** Check if Orientated Bounding Box of zero size so a Point */
    isPoint():boolean
    {
        return (this.width() <= this._oc.SHAPE_TOLERANCE 
                    && this.depth() <= this._oc.SHAPE_TOLERANCE 
                    && this.height() <= this._oc.SHAPE_TOLERANCE);
    }
    
    /** Check if Orientated Bounding Box is 2D */
    is2D():boolean
    {
        // IMPORTANT: Bbox can be pretty inaccurate! Sometimes 1 unit on each axis for flat Shapes.
        // We introduce this TOLERANCE_2D
        const TOLERANCE_2D = 0.4;
        
        return (this.width() <= TOLERANCE_2D + this._oc.SHAPE_TOLERANCE 
                    || this.depth() <= TOLERANCE_2D + this._oc.SHAPE_TOLERANCE 
                    || this.height() <= TOLERANCE_2D + this._oc.SHAPE_TOLERANCE);
        
    }

    /** Check if Orientated Bounding Box is 3D */
    is3D()
    {
        const TOLERANCE_3D = 0.4;
        return this.width() > TOLERANCE_3D
                &&  this.depth() > TOLERANCE_3D
                &&  this.height() > TOLERANCE_3D
    }

    /** Checks if sizes along axis are zero */
    _sizesAreZero():Array<boolean|boolean|boolean>
    {
        const TOLERANCE = 0.4;
        return [
            (this.width() <= TOLERANCE + this._oc.SHAPE_TOLERANCE),
            (this.depth() <= TOLERANCE + this._oc.SHAPE_TOLERANCE), 
            (this.height() <= TOLERANCE + this._oc.SHAPE_TOLERANCE)
        ];
    }

    /** Bbox has only one size dimension (the others are zero) */
    is1D():boolean
    {
        return this._sizesAreZero().filter(dim => dim).length === 2
    }

    /** The axis that is missing in 2D bbox */
    axisMissingIn2D():MainAxis|null
    {
        if(!this.is2D()){ return null;}

        if (this.height() <= this._oc.SHAPE_TOLERANCE)
        {
            return 'z';
        }
        else if(this.width() <= this._oc.SHAPE_TOLERANCE)
        {
            return 'x';
        }
        else {
            return 'y';
        }
    }

    /** Along what axis is this 1D Bbox */
    sizeAxis1D():MainAxis|null
    {
        if(!this.is1D()){ return null };
        const axisIndex = this._sizesAreZero().findIndex(isZero => !isZero);
        return (axisIndex !== -1) ? ['x','y','z'][axisIndex] as MainAxis : null;
    }

    /** Axis on which the bbox has a size */
    hasAxes():Array<MainAxis>
    {
        const axes:Array<MainAxis> = [];
        if(this.width() >= this._oc.SHAPE_TOLERANCE){ axes.push('x'); }
        if(this.depth() >= this._oc.SHAPE_TOLERANCE){  axes.push('y'); }
        if(this.height() >= this._oc.SHAPE_TOLERANCE){ axes.push('z'); }
        return axes;
    }

    /** Get size of current Bbox along given axis */
    @checkInput([['MainAxis', 'x']], ['auto'])
    sizeAlongAxis(axis:MainAxis):number
    {
        const AXIS_TO_SIDE = { 
            x : 'width',
            y : 'depth',
            z : 'height',
        }

        return this[AXIS_TO_SIDE[axis]]();
    }   

    /** Get Shape from this Orientated Bounding Box */
    shape():Edge|Face|Solid|null
    {
        // TODO: point or line?
        return (this.is1D()) ? this.line() :
                            (this.is2D()) ? this.rect() : (this.is3D()) 
                                ? this.box() : null
    }

    /** Alias for shape() */
    toShape():Edge|Face|Solid|null
    {
        return this.shape();
    }

    /** Make Line from 1D Bbox */
    line():Edge|null
    {
        if(!this.is1D())
        { 
            console.warn(`Bbox::line: Bbox is not 1D, so can't turn into a single Line!`);
            return null; 
        }
        return new Edge().makeLine(this.min(), this.max());
    }

    /** Create 2D Rectangle Face from Bbox */
    rect():Face
    {
        if(!this.is2D())
            { 
                console.warn(`Bbox::rect: Bbox is not 2D, so can't turn into a rectangle Face!`);
                return null; 
        }
        return new Face().fromVertices(this.corners().slice(0,4));
    }

    /** returns a Box Shape for this Bbox if not 2D, otherwise null */
    box():Solid|null
    {
        // NOTE: not always robust!
        return new Face().fromVertices(this.corners().slice(0,4)).extrude(this.height())
    }   

    /** Return flipped Bbox that is mirrored in x-axis. For certain 2D ops */
    flippedY()//:Bbox
    {
        // TODO
    }

    /** Gets the Edge seperating width in two equal halves */
    @addResultShapesToScene
    widthHalfLine():Edge
    {
        const yDirWidthHalf = this.yDir().scaled(this.depth()/2);
        return new Edge().makeLine(
                this.center().moved(yDirWidthHalf.reversed()),
                this.center().moved(yDirWidthHalf),
                )
    }

    /** Gets the Edge seperating depth in two equal halves */
    @addResultShapesToScene
    depthHalfLine():Edge
    {
        const xDirWidthHalf = this.xDir().scaled(this.width()/2);
        return new Edge().makeLine(
                this.center().moved(xDirWidthHalf.reversed()),
                this.center().moved(xDirWidthHalf),
                )
    }

    /** Get Sub Shapes associated with given sides
        @param side - combinations of front|back|right|left|top|bottom
        NOTE: we use _getSide for now - but we might refactor
    */
    getSidesShape(sidesString:string)//:Face|Edge|Vertex
    {
        // TODO
    }

    /** Get individual Bbox side shapes based on sidestring
     *  @param sidesString any combination between front/back,left/right,top/bottom
     */
    _getIndividualSideShapes(sidesString:string)//:Record<Side,Face|Edge|Vertex>
    {
        // TODO
    }

    /** Get area of bbox */
    area():number|null
    {
        if(this.is2D())
        {
            return this.rect().area();
        }
        else {
            return roundToTolerance(this.box().faces().toArray().reduce( (sum, f) => sum + f.area(), 0));
        }
    }

    volume():number|null
    {
        if(this.is3D())
        {
                return this.box().volume();
        }
        return null;
    }

    //// OPERATIONS / CHECKS ////

    contains(other:Shape)//:boolean
    {
        // TODO
    }

    _containsOBbox(other:OBbox)//:boolean
    {
        // TODO
    }

    //// DATA EXPORTS ////

    toData():Array<Array<number>>
    {
        return this.corners().map(c => c.toArray());
    }

    toString():string
    {
        return `OBbox<[${this.corners()}]`;
    }

    ///// UTILS ////

    /** Get side of OBbox - NOTE: Some sides can be zero length */
    _getSide(side:string)// :Vertex|Edge|Face
    {   
       // TODO
    }



}
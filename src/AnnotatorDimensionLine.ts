
/** DimensionLine Class 
 * 
 *  NOTES:
 *      - Dimension lines will be rendered in different contexts (3D GLTF viewer, html/SVG, PDF) 
 *          so we need enough data to alter representation in every context, while at the same time 
 *          minimizing repeating calculations
 *      - offset length can be set by user in world coordinates
 * 
*/

import { Point, Vector, Shape, Edge, AnyShape, ShapeCollection, AnyShapeOrCollection, isAnyShapeOrCollection, isPointLike } from './internal'
import {  Coord, MainAxis, PointLike, ModelUnits, DimensionLineData, DimensionOptions, AnnotationType} from './internal' // types

import { checkInput } from './decorators' // NOTE: needs to be direct
import { BaseAnnotation } from './internal'
import { roundTo, roundToTolerance } from './internal' // utils

export class DimensionLine extends BaseAnnotation
{
    //// SETTINGS
    DIMENSION_OFFSET_DEFAULT = 30; // in model units
    DIMENSION_ROUND_DEFAULT = true;

    // NOTE: line start and end is calculated when exporting toData()
    _initialized:boolean = false;
    targetStart:Point; // point on Shape
    targetEnd:Point; // point on Shape
    targetShape:AnyShape = null; // the (sub)shape (mostly an Edge) the dimension line is directly generated from
    linkedTo:AnyShapeOrCollection = null; // the main parent Shape or ShapeCollection this dimension is linked to
    value:number; // the value of the dimension line, can be static - in BaseAnnotation
    static:boolean = false;
    units:ModelUnits = null;
    offsetVec:Vector; // Normalized Vector offset from Shape 
    offsetLength:number; // distance of DimensionLine to target Shape along offsetVec in world units: most of the time this is calculated based on view context

    ortho:boolean|MainAxis = false;
    _orthoAxis:MainAxis; // parallel to which axis it the ortho dimension line
    round:boolean = this.DIMENSION_ROUND_DEFAULT; 
    roundDecimals:number = 0;    
    textSize:number;

    interactive:boolean = false;
    showUnits:boolean = false;
    param:string = null; // name of bound parameter

    constructor(start:PointLike=null, end:PointLike=null, options?:DimensionOptions)
    {
        super('dimensionLine');

        if(start && end)
        {
            this.init(start,end, options)
        }
        else {
            console.warn(`DimensionLine::constructor(): DimensionLine not initialized. Use methods init(start,end,options) or fromEdge(shape, options) later!`)
        }

    }

    /** Check if a given object is a DimensionLine  */
    static isDimensionLine(o:any):boolean
    {
        return (typeof o === 'object') && o?._type == 'DimensionLine'
    }

    /** (Re)init dimension line */
    @checkInput(['PointLike','PointLike', ['DimensionOptions', null]],['Point','Point','auto'])
    init(start:PointLike, end:PointLike, options?:DimensionOptions):this
    {
        if(!start && !end){ throw new Error(`DimensionLine::init(): Please supply start and end Point!`); }

        this.targetStart = start as Point; // auto converted
        this.targetEnd = end as Point;

        this._initialized = true;
        this.setOptions(options)

        this._calculateAutoOffsetLength();
        this._calculateOffsetVec(); // don't override from options
        this.value = this._getDynamicValue();

        return this;
    }

    /** Generate a dimension line from this Edge */
    fromEdge(edge:Edge, options?:DimensionOptions):this
    {
        if(!Shape.isShape(edge)){ throw new Error(`DimensionLine::init(): Please supply an Edge Shape`); }
        if(edge.type() !== 'Edge'){ throw new Error(`DimensionLine::init(): Please supply a Edge. Other Shapes are not yet supported!`); }
        
        this.targetShape = edge;
        this.linkedTo = this._getParentShape(edge); // set main Shape
        this.linkedTo.addAnnotations(this); // make two-sided link
        return this.init(edge.start().toPoint(), edge.end().toPoint(), options)
    }

    /** Link this Annotation to given Shape or ShapeCollection 
     *  This helps with more advanced dimensioning and retrieving Dimension when exporting Shapes */
    link(to:AnyShapeOrCollection):this
    {
        this.linkedTo = (Shape.isShape(to)) 
                            ? this._getParentShape(to as Shape)
                            : (ShapeCollection.isShapeCollection(to)) ? to as ShapeCollection : null; // Make sure we always got the top Shape

        if(!this.linkedTo)
        {
            console.warn(`AnnotatorDimensionLine::link(): No valid Shape or ShapeCollection to link to. Skipped!`)
            return this;
        }

        this.linkedTo.addAnnotations(this);

        // recalculate for offset based on main shape
        this._calculateAutoOffsetLength(); 
        this._calculateOffsetVec(true);
        return this;
    }

    /** Recurse parents to find main parent Shape of given shape */
    _getParentShape(s:AnyShapeOrCollection):AnyShapeOrCollection|null
    {
        if(!isAnyShapeOrCollection(s))
        { 
            console.warn(`AnnotatorDimensionLine::_getParentShape(): Could not find a parent Shape. Did you supply a Shape to start recursion?`);
            return null;
        }
        return (s._parent) ? this._getParentShape(s._parent) : s; 
    }


    _getDynamicValue():number
    {
        return roundToTolerance(
                (!this.ortho) 
                    ? this.targetDir().length()
                    : this.dir().length()
        );
    }

    type():AnnotationType
    {
        return 'dimensionLine';
    }

    /** Vector from target start to end, not normalized */
    targetDir():Vector
    {
        return this.targetEnd.toVector().subtracted(this.targetStart)
    }

    /** Vector from dimension line start to end */
    dir():Vector
    {
        return (!this.ortho) 
            ? this.targetDir()
            : this._calculatePoint('end').toVector().subtract(this._calculatePoint('start'))
    }

    /** Middle Point of this DimensionLine */
    targetMiddle():Point
    {
        return new Edge(this.targetStart, this.targetEnd).middle()
    }

    /** Offset Vector of length offsetLength from target points to Dimension line */
    offset():Vector
    {
        return this.offsetVec.scaled(this.offsetLength as Coord)
    }

    /** Update when linked Shape is updated */
    update()
    {
        if(!this.static){ this.value = this._getDynamicValue() }
        this.updatePosition();
    }

    /** Update position after linked Shape has moved 
     *  !!!! IMPORTANT !!!! Improve this method
    */
    updatePosition()
    {
        if(this.targetShape && this.targetShape.type() === 'Edge')
        {
            const linkedEdge = (this.targetShape as Edge);
            this.targetStart = linkedEdge.start().toPoint();
            this.targetEnd = linkedEdge.end().toPoint();
            this._calculateOffsetVec(true); // force overwrite
            this._calculateAutoOffsetLength(); 
        }
    }

    /** Calculate the direction for offsetting from target  
     *  How to offset depends on dimension line type: normal, ortho
    */
    _calculateOffsetVec(overwrite:boolean=false):Vector
    {
        // Don't overwrite if already set
        if(this.offsetVec && !overwrite)
        {
            return this.offsetVec;
        }

        // If dimension line is parallel to z-axis, make offset the x-axis
        if ( this.targetDir().isParallel([0,0,1]))
        {
            this.offsetVec = new Vector(1,0,0); 
            return this.offsetVec;
        }
        else 
        {
            // Determine offset from a 2D/3D Shape: So the Shape can have an outside
            const insidePoint = (this.linkedTo?.is2D() || this.linkedTo?.is3D()) ? this.linkedTo?.center() : new Point(0,0,0);

            let newOffsetVec = this.targetDir().crossed([0,0,1]);
            
            const d1 = this.targetMiddle().moved(newOffsetVec).distance(insidePoint);
            const d2 = this.targetMiddle().moved(newOffsetVec.reversed()).distance(insidePoint);

            // Basic: newwOffsetVec points away from center
            if (d1 < d2) 
            {
                newOffsetVec.reverse(); // Make sure it points outside
            }

            newOffsetVec.normalize();

            // If ortho the offset vector is parallel to one of the 3 axis (or reversed)
            // What axis to use can be set by user
            // We first determine what axis the Shape occupy (1D/2D/3D) 
            // If no axis given by user we pick the one that has the biggest measurement
            if(this.ortho) // true, or 'x'  or 'y' 
            {
                const dimLineHasAxes = this.targetEdge().bbox().hasAxes();
                const shapeBiggestAxis = this.targetEdge().bbox().maxSizAxis();

                this._orthoAxis = (typeof this.ortho !== 'string') 
                                            ? shapeBiggestAxis // autopick biggest axis
                                            : dimLineHasAxes.includes(this.ortho) 
                                                ? this.ortho
                                                : shapeBiggestAxis;
                const orthoOffsetAxis = ['x','y','z'].find(a => a !== this._orthoAxis ) as MainAxis

                const orthoOffsetVec = new Vector(0,0,0)
                                        .setComponent(orthoOffsetAxis, 
                                            (newOffsetVec[orthoOffsetAxis] >= 0) ? 1 : -1
                                        );
        
                newOffsetVec = orthoOffsetVec;
                
            }

            this.offsetVec = newOffsetVec;
            return this.offsetVec
        }        
    }

    /** Calculate a offset length */
    _calculateAutoOffsetLength():number
    {
        // Now it is static. TODO: something dynamic based on model units?
        const l = this.DIMENSION_OFFSET_DEFAULT;
        if(!this.offsetLength){ this.offsetLength = l; } // don't override
        return l;
    }

    /** The start and end point of DimensionLine in original coordinate system  
     *  Where the points are depends on type of dimension line. Normal or othogonal
    */
    _calculatePoint(at:'start'|'end'):Point
    {   
        if(!this.offsetVec){ this._calculateOffsetVec() };
        if(!this.offsetLength) { this._calculateAutoOffsetLength(); }
        
        const curPoint = (at === 'start') ? this.targetStart.copy() : this.targetEnd.copy(); // Make sure we use copies!

        // simple offset parallel to dimension line
        if(!this.ortho)
        {
            
            return curPoint.moved(this.offsetVec.scaled(this.offsetLength))
        }
        else if(this.ortho)
        {
            // Offset from the point that has the biggest coordinate component parallel to offset vector
            const offsetAxis = this.offsetVec.largestAxis()

            const offsetMainComponent = this.offsetVec[offsetAxis]
            
            const pointsOrdered = [this.targetStart.copy(), this.targetEnd.copy()].sort((a,b) => b[offsetAxis] - a[offsetAxis]); // order DESC
            if( offsetMainComponent < 0 ){ pointsOrdered.reverse(); }
            
            const offsetFromPoint = pointsOrdered[0];
            const offsettedPoint = offsetFromPoint.moved(this.offsetVec.scaled(this.offsetLength));

            return (offsetFromPoint.equals(curPoint)) 
                        ? offsettedPoint  // curPoint is the point from which to offset
                        : curPoint.setComponent(offsetAxis, offsettedPoint[offsetAxis])
        }
    }

    
    /** Get rotation in SVG coordinate system (so mirror y!) */
    getSVGRotation():number
    {
        return this.targetEnd.toVector().mirror([0,0,0],[1,0,0])
            .subtracted(this.targetStart.toVector().mirror([0,0,0],[1,0,0])).angle2D();
    }

    //// OPERATIONS ////

    /** Set static value  */
    setValue(v:number|string):this
    {
        this.value = (typeof v === 'number') ? v : Number(v);
        this.static = true; // set this flag so we know if we need to update it in update()

        return this;
    }

    setOptions(o:DimensionOptions):this
    {
        this.ortho = o?.ortho ?? false;
        this.offsetLength = o?.offset || this.offsetLength || this._calculateAutoOffsetLength();
        const optionsOffsetVec = (isPointLike(o?.offsetVec)) ? new Vector(o.offsetVec) : null; // Transform any PointLikes of user into a Vector
        this.offsetVec = optionsOffsetVec || this.offsetVec || this._calculateOffsetVec();
        this.units = o?.units || this.units;
        this.roundDecimals = o?.roundDecimals || this.roundDecimals;
        // TODO: more: color, linethickness etc.
        return this;
    }

    @checkInput(['PointLike'],['Vector'])
    setOffsetVec(v:PointLike):this
    {
        this.offsetVec = v as Vector; // auto converted
        return this;
    }

    /** bind parameter to this dimension line and make it interactive */
    @checkInput(['String'],['auto'])
    bindParam(paramName:string)
    {
        this.param = paramName;
        this.interactive = true;
    }

    /** Generic Shape method (every Annotation class should have this!) */
    toShape():Edge 
    {
        return this.toEdge();
    }

    /** Make a Line Edge out this DimensionLine */
    toEdge():Edge
    {
        return new Edge().makeLine(this._calculatePoint('start'), this._calculatePoint('end'));
    }

    targetEdge():Edge 
    {
        return new Edge().makeLine(this.targetStart, this.targetEnd);
    }

    //// RELATIONS WITH OTHER DIMENSION LINES ////

    /* Generate an id to compare with other dimension lines */
    sameId(flags:Record<string,boolean>={}):string|null
    {
        /* 
            TODO: DimensionLines that are parallel to each other based on positioning is not taken into account!
                For now we see dimensionlines with same offset and length as same. This is a problem!
        */

        const DEFAULT_FLAGS = {
                compareOffsetAbs : true,
                compareOffsetLength : false ,
                compareValue: true,
                compareWithShape: true,
                compareProjYAxis: true, // y coord of projection of offset Vector from position
            }

        flags = { ...DEFAULT_FLAGS, ...flags }

        let ov = this.offsetVec.rounded();

        if(flags.compareOffsetAbs) ov = ov.abs();
        
        const l = (flags.compareOffsetLength) ? this.offsetLength : 1;
        const v = (flags.compareValue) ? Math.round(this.value) : ''; // round to full units by default
        const sId = (flags.compareWithShape) ? (this.linkedTo?._hashcode() || this.uuid) : '';
        const y = (flags.compareProjYAxis) ? Math.round(this._projYAxis()) : ''

        return `${ov}-${l}-${v}-${sId}-${y}`;
    }

    isSame(other:DimensionLine, flags:Record<string,boolean>={}):boolean
    {
       if(!DimensionLine.isDimensionLine(other)){ return false; }

       const id1 = this.sameId(flags);
       const id2 = other.sameId(flags);

       return id1 === id2;
    }

    /** To distinguish between Dimension Lines we can calculate the y coord of the offset projected from the position  */
    _projYAxis():number
    {
        return (this.offsetVec.abs().rounded().angleXY() === 90)
            ? 0 // exception
            : (this.offsetVec.abs().rounded().angleXY() === 0)
                ? Math.abs(this.targetMiddle().y)
                : (this.offsetVec.rounded().x === 0)
                    ? 0 
                    : (this.targetMiddle().toVector().abs().subtracted(
                        this.offsetVec.abs().scaled(this.targetMiddle().toVector().abs().x / this.offsetVec.abs().x)).rounded()).y
    }

    //// EXPORT ////

    /** Output to data (to be send from Webworker to main app) */
    toData():DimensionLineData
    {
        const d = {
            type: 'dimensionLine',
            targetStart: this.targetStart.toArray(), // raw target start
            targetEnd: this.targetEnd.toArray(), // raw target end
            targetDir: this.targetDir().toArray(),
            start: this._calculatePoint('start').toArray(), // start of real line (i.e. the arrow!)
            end: this._calculatePoint('end').toArray(),
            dir: this.dir().toArray(),
            value: this.value,
            static: this.static,
            units: this.units,
            offsetVec: this.offsetVec.toArray(),
            offsetLength: this.offsetLength,
            offset: this.offset().toArray(), // with length
            interactive: this.interactive,
            round: this.round,
            roundDecimals: this.roundDecimals,
            param: this.param,
            showUnits: this.showUnits,
        } as DimensionLineData

        return d;
    }

    /** Generate SVG for this dimension line
     *     if 3D the Dimension Line is projected to XY plane
     *     NOTE: we need to transform from Archiyou coordinate system to the SVG one (flip y)
     */
    toSvg():string
    {   
        const lineStart = this._calculatePoint('start');
        const lineEnd = this._calculatePoint('end');
        const lineMid = lineStart.moved(lineEnd.toVector().subtracted(lineStart).scaled(0.5))

        const lineStartArr = lineStart.toArray();
        const lineEndArr =  lineEnd.toArray();
        const lineMidArr =  lineMid.toArray();

        // flip y-axis for SVG coordinate system
        lineStartArr[1] = -lineStartArr[1];
        lineEndArr[1] = -lineEndArr[1];
        lineMidArr[1] = -lineMidArr[1];

        let dimText = ((this.round) ? roundTo(this.value, this.roundDecimals) : this.value).toString();
        if (this.showUnits ) dimText += this.units;

        return `<g class="dimensionline">
                ${this._makeSvgLinePath(lineStartArr,lineEndArr)}
                ${this._makeSvgArrow(lineStartArr)}
                ${this._makeSvgArrow(lineEndArr, true)}
                ${this._makeSvgTextLabel(lineMidArr,dimText)}
            </g>
        `
    }

    /** Generate a line segment in SVG (with SVG coords) */
    @checkInput(['PointLike','PointLike'], ['Point','Point'])
    _makeSvgLinePath(start:PointLike, end:PointLike)
    {  
       const startPoint = start as Point; // NOTE: auto converted to Point 
       const endPoint = end as Point;
       return `<line class="annotation line" style="stroke-width:0.5" x1="${startPoint.x}" y1="${startPoint.y}" x2="${endPoint.x}" y2="${endPoint.y}"/>`
    }

    /** Place SVG arrow on position and rotation. Tip of the arrow is pivot */
    // NOTE: Arrow itself is already in SVG space (so y-axis is pointing downwards)
    @checkInput(['PointLike', ['Boolean',false]], ['Point','auto'])
    _makeSvgArrow(at:PointLike, flip?:boolean)
    {
       /*   Arrows in raw SVG
            - Pivot of arrow is at [0,0] pointing upwards (in SVG coordinate system of course)
            - use style for fill/stroke, so we can override it later (not tags fill="..")
            - TODO: different arrow styles
        */
       const SIZE = '10 5'; // Size of non-rotated graphic, use this for scaling
       const ARROWS_SVG  = {
            default: '<path class="arrow-path" style="fill:none;stroke-width:0.5" d="M -5 5 L 0 0 L 5 5" />'
       }
       const DEFAULT_ARROW_SVG = 'default'

       const atPoint = at as Point;
        
       const rotation = (flip) ? this.getSVGRotation() - 90 + 180: this.getSVGRotation() - 90;
       
       // NOTE: underscores _ in attributes are omitted (_worldSize => worldSize)
       return `
          <g 
                class="annotation arrow ${(flip) ? 'end' : 'start'}"
                worldSize="${SIZE}"
                transform="translate(${atPoint.x} ${atPoint.y}) 
                            rotate(${rotation})
                            scale(1 1)
                            ">
                            ${ARROWS_SVG[DEFAULT_ARROW_SVG]}
          </g>`
        
    }

    @checkInput(['PointLike', 'String'], ['Point', 'auto'])
    _makeSvgTextLabel(at:PointLike, text:string): string
    {
        /* IMPORTANT: 
            This font-size is temporary: 
            We need to make the text (and background rect) scale according to page size and view scale 
             so they are always the same
        */
       
        /* IMPORTANT: because SVG are mostly in mm the difference between font size 
            and the sizes of these drawings must not be too great the text boundingbox might 
            be so small that we loose accuracy.
        */
        const TMP_FONT_SIZE = '1';  
        const atPoint = at as Point;
        
        // NOTE: We rotate later in specific rendering method (html, PDF) for maximum control
        // We place data on element itself in attribute data
        const angle = 90 - this.offsetVec.rounded().abs().angleXY(); // range [0,90] - NOTE: we reverse for SVG

        
        return `<text 
                        class="annotation text" 
                        text-anchor="middle"
                        alignment-baseline="middle"
                        font-size="${TMP_FONT_SIZE}"
                        style="fill:black;stroke-opacity:0;stroke-width:0"
                        x="${atPoint.x}"
                        y="${atPoint.y}"
                        data="{ 'angle': ${-angle} }"
                        dominant-baseline="central">${text}
                    </text>`; // NOTE: data in JSON format with "'"! TODO: Make this more elegant!
    }
    // NOTE: do very little styling here to be able to easily style with CSS. Only stroke-width is good to set (default is 1, 0.5 sets it apart from Shapes)
}

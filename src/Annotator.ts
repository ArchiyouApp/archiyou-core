/**
 *  Annotator.ts
 *      Make different annotations on the model like dimensions, labels etc.
 *      Their main purpose is offering information on top of the model - and are not part of the Shapes 
 *      Only on output they might be turned into real Shapes like text Faces etc.
 */ 

import { v4 as uuidv4 } from 'uuid' // fix TS warning with @types/uuid

import { Point, Vector, PointLike, isPointLike, ShapeCollection, Shape, Vertex, Edge, Wire, Face, Geom, ModelUnits } from './internal'
import { AnyShape,  AnyShapeOrCollection, Layout, roundToTolerance, roundTo } from './internal'
import { checkInput } from './decorators' // NOTE: needs to be direct

/** Bring all annotations in one type */
export type AnnotationType = 'base'|'dimensionLine' | 'label' // TODO MORE
export type Annotation = DimensionLine  // TODO: more: label

/** Exporting DimensionLine instances as data */
export interface DimensionLineData
{
    _id?:string, // internal id
    type:'dimensionLine'|'label', // TODO: more annotation types
    start:Array<number|number|number>
    end:Array<number|number|number>
    dir:Array<number|number|number>
    value:number
    static?:boolean // if value can be calculated from distance between start-end or is static (for example after projection)
    units?:string
    offset?:Array<number|number|number>
    interactive:boolean
    round?:boolean 
    roundDecimals?:number
    param:string // name param binded to this dimension line
    _labelPosition?:Array<number|number|number> // for internal use
    showUnits?:boolean
}

/** Used with Shape.dimension() as options 
 *  NOTE: update typeguards when adding fields to this
*/
export interface DimensionOptions 
{
    units?:ModelUnits
    offset?:number 
    roundDecimals?:number // round to number decimals. Default is 0
}

export class BaseAnnotation
{
    uuid:string;

    constructor()
    {
        this.uuid = uuidv4();
    }

    /** Type of Annotation, reimplemented in extended classes */
    type():AnnotationType
    {
        return 'base'
    }
}

/** DimensionLine Class 
 * 
 *  NOTES:
 *      - offset length can be set by user in world coordinates
 * 
*/
export class DimensionLine extends BaseAnnotation
{
    //// SETTINGS
    DIMENSION_OFFSET_DEFAULT = 10;
    DIMENSION_TEXTSIZE_DEFAULT = 10;
    DIMENSION_ROUND_DEFAULT = true;

    start:Point; // on Shape
    end:Point; // on Shape
    shape:AnyShape = null; // the Shape the dimension is linked to - needed to know if we need to export dimension lines in toSvg()
    value:number; // the value of the dimension line, can be static
    static:boolean = false;
    units:ModelUnits = null;
    offsetVec:Vector; // Normalized Vector offset from Shape 

    round:boolean = this.DIMENSION_ROUND_DEFAULT; 
    roundDecimals:number = 0;
    offsetLength:Number; // distance of DimensionLine to Shape along offsetVec in world units: most of the time this is calculated based on view context
    textSize:number;

    interactive:boolean = false;
    showUnits:boolean = false;
    param:string = null; // name of bound parameter

    constructor(start:Point, end:Point)
    {
        super();
        this.start = start as Point;
        this.end = end as Point;
        this.value = this._getDynamicValue();
    
        this._calculateOffsetVec();
    }

    _getDynamicValue():number
    {
        return roundToTolerance(this.start._toVertex().distance(this.end._toVertex()));
    }

    type():AnnotationType
    {
        return 'dimensionLine';
    }

    dir():Vector
    {
        return this.toEdge().direction();
    }

    /** Middle Point of this DimensionLine */
    middle():Point
    {
        return new Edge(this.start, this.end).middle()
    }

    /** Link to Shape so we can export DimensionLine with the shapes */
    link(shape:AnyShape):DimensionLine
    {
        if(Shape.isShape(shape)){ this.shape = shape; }

        return this;
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
        if(this.shape && this.shape.type() === 'Edge')
        {
            const linkedEdge = (this.shape as Edge);
            this.start = linkedEdge.start().toPoint();
            this.end = linkedEdge.end().toPoint();
            this._calculateOffsetVec();
        }
    }

    /** Get rotation in SVG coordinate system (so mirror y!) */
    getSVGRotation():number
    {
        return this.end.toVector().mirror([0,0,0],[1,0,0])
            .subtracted(this.start.toVector().mirror([0,0,0],[1,0,0])).angle2D();
    }

    _calculateOffsetVec()
    {
        // along x-axis is dimension line is parallel to z-axis
        if ( (this.end.x === this.start.x) && (this.end.y === this.start.y))
        {
            this.offsetVec = new Vector(1,0,0); 
        }
        else {
            // TODO: find a better strategy based on bbox of shape
            this.offsetVec = this.end.toVector().subtracted(this.start.toVector()).crossed([0,0,1]).normalized();
            // as a quick-solution align the offsetVector at the DimensionLine away from the origin
            const d1 = new Vertex(0,0,0).move(this.offsetVec).distance(this.middle());
            const d2 = new Vertex(0,0,0).move(this.offsetVec.reversed()).distance(this.middle());

            // the same (with tolerance)
            const DISTANCE_TOLERANCE = 2;
            if (Math.abs(d1 - d2) < DISTANCE_TOLERANCE)
            {
                // TEMP HACK: preference for -y
                if (this.offsetVec.y > 0){ this.offsetVec.reverse(); }
            }
            else if (d1 > d2) 
            {
                this.offsetVec.reverse();
            }
        }        
    }

    //// OPERATIONS ////

    /** Set static value  */
    setValue(v:number|string):this
    {
        this.value = (typeof v === 'number') ? v : Number(v);
        this.static = true; // set this flag so we know if we need to update it in update()

        return this;
    }

    // TODO: input checking and sane error message
    setOptions(o:DimensionOptions):this
    {
        this.offsetLength = o?.offset || this.offsetLength; // only updates when not null 
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

    /** Make a Line Edge out this DimensionLine */
    toEdge():Edge
    {
        return new Edge(this.start, this.end);
    }

    /** Output to data (to be send from Webworker to main app) */
    toData():DimensionLineData
    {
        return {
            type: 'dimensionLine',
            start: this.start.toArray(),
            end: this.end.toArray(),
            value: this.value,
            static: this.static,
            units: this.units,
            dir: this.dir().toArray(),
            offset: this.offsetVec.toArray(),
            interactive: this.interactive,
            round: this.round,
            roundDecimals: this.roundDecimals,
            param: this.param,
            showUnits: this.showUnits,
        } as DimensionLineData
    }

    /** Calculate a offset length */
    _calculateAutoOffsetLength():number
    {
        // For now keep it static
        return this.DIMENSION_OFFSET_DEFAULT;
    }

    /** Generate SVG for this dimension line
     *     if 3D the Dimension Line is projected to XY plane
     *     NOTE: we need to transform from Archiyou coordinate system to the SVG one (flip y)
     */
    toSvg()
    {   
        const offsetLength = this.offsetLength || this._calculateAutoOffsetLength();
        const offsetVec = this.offsetVec.scaled(offsetLength as PointLike);

        let lineStart = this.start.add(offsetVec).toArray();
        lineStart[1] = -lineStart[1]; // flip to svg y-axis
        
        let lineEnd = this.end.add(offsetVec).toArray();
        lineEnd[1] = -lineEnd[1];

        let lineMid = this.middle().toArray();
        lineMid[1] = -lineMid[1];

        let dimText = ((this.round) ? roundTo(this.value, this.roundDecimals) : this.value).toString();
        if (this.showUnits ) dimText += this.units;

        return `<g class="dimensionline">
                ${this._makeSvgLinePath(lineStart,lineEnd)}
                ${this._makeSvgArrow(lineStart)}
                ${this._makeSvgArrow(lineEnd, true)}
                ${this._makeSvgTextLabel(lineMid,dimText)}
            </g>
        `
    }

    /** Generate a line segment in SVG (with SVG coords) */
    @checkInput(['PointLike','PointLike'], ['Point','Point'])
    _makeSvgLinePath(start:PointLike, end:PointLike)
    {  
       let startPoint = start as Point; // NOTE: auto converted to Point 
       let endPoint = end as Point;
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
       const ARROWS_SVG  = {
            default: '<path class="annotation arrow" style="fill:none;stroke-width:0.5" d="M-5 5 L 0 0 L 5 5" />'
       }
       const DEFAULT_ARROW_SVG = 'default'

       const atPoint = at as Point;
        
       const rotation = (flip) ? this.getSVGRotation() - 90 + 180: this.getSVGRotation() - 90;
    
       return `
          <g transform="translate(${atPoint.x} ${atPoint.y}) 
                            rotate(${rotation})
                            scale(1 1)
                            ">
                            ${ARROWS_SVG[DEFAULT_ARROW_SVG]}
          </g>`
        
    }

    @checkInput(['PointLike', 'String'], ['Point', 'auto'])
    _makeSvgTextLabel(at:PointLike, text:string): string
    {
        const RECT_WIDTH_PER_CHAR = 6; // heuristic - TODO: better?
        const RECT_HEIGHT = 10;
        /* IMPORTANT: 
            This font-size is temporary: 
            We need to make the text (and background rect) scale according to page size and view scale 
             so they are almost the same
        */
        const FONT_SIZE = '50%'; 
        

        const atPoint = at as Point;
        const rectWidth = text.length*RECT_WIDTH_PER_CHAR;

        return `<rect class="annotation text-background"
                        x="${atPoint.x}" 
                        y="${atPoint.y}" 
                        width="${rectWidth}" 
                        height="${RECT_HEIGHT}"
                        style="fill:white;stroke-opacity:0;"
                        transform="translate(${-rectWidth/2} ${-RECT_HEIGHT/2})" />
                <text 
                    class="annotation text" 
                    x="${atPoint.x}"
                    y="${atPoint.y}"
                    text-anchor="middle"
                    font-size="${FONT_SIZE}"
                    style="fill:black;stroke-opacity:0;stroke-width:0"
                    dominant-baseline="central">${text}</text>`
    }
    // NOTE: do very little styling here to be able to easily style with CSS. Only stroke-width is good to set (default is 1, 0.5 sets it apart from Shapes)
}


export class Annotator
{
    //// SETTINGS ////
    DIMENSION_BOX_OFFSET_DEFAULT = 10;
    
    //// END SETTINGS ////

    _oc; // is set in constructor prototype when Geom once OC is loaded - IMPORTANT: Don't assign here!
    _geom:Geom; // also set on Pipeline prototype when making Geom
    name:string;
    dimensionLines:Array<DimensionLine> = [];
    // labels:Array<Label> = []; // TODO

    constructor()
    {   
        // TODO
    }

    /** Make dimension line */
    @checkInput(['PointLike','PointLike',['String',null],[Number, 1.0], [Number, null]],['Point','Point', 'auto', 'auto', 'auto'])
    dimensionLine(start:PointLike, end:PointLike)
    {
        let newDimension = new DimensionLine(start as Point,end as Point);
        this.dimensionLines.push(newDimension);
        return newDimension;
    }

    /** Create dimension lines for bounding box of Shape */
    // TODO: use orientated bbox too
    @checkInput(['AnyShape'],['auto'])
    dimensionBox(shape:AnyShape)
    {
        // Where to place the dimension lines by default
        const DIMENSION_BBOX_ALIGN = {
            width: 'bottomfront',
            depth: 'bottomleft',
            height: 'frontleft' 
        }
        

        let bbox = shape.bbox();

        Object.entries(DIMENSION_BBOX_ALIGN).forEach( ([dimSide,alignment]) => 
        {
            let e = bbox.getSidesShape(alignment);
            
            if(e.type() == 'Edge') // If we get a Vertex it means that we have a 2D Bbox: skip that axis
            {
                let edge = e as Edge;
                let dim = new DimensionLine(edge.start().toPoint(), edge.end().toPoint());

                if (dim.value != 0) // skip zero length dimensions
                {
                    let bboxVec = bbox.center().toVector();
                    let offsetVecDiag = e.center().toVector().subtracted(bboxVec);
                    
                    if(dimSide === 'width'){ offsetVecDiag.x = 0; offsetVecDiag.z = 0; }
                    if(dimSide === 'depth'){ offsetVecDiag.y = 0; offsetVecDiag.z = 0; }
                    if(dimSide === 'height'){ offsetVecDiag.z = 0; offsetVecDiag.y = 0; }
                    
                    // now we can safely normalize
                    let offsetVec = offsetVecDiag.normalize().scaled(this.DIMENSION_BOX_OFFSET_DEFAULT);
                    
                    dim.setOffsetVec(offsetVec);
                    this.dimensionLines.push(dim);
                }
            }
        })

    }

    /** Get all annotations in one Array. See interfaces like DimensionLineData */
    getAnnotations():Array<DimensionLineData> // TODO: more types
    {
        let annotationsData = [];
        annotationsData = annotationsData.concat(this.dimensionLines.map(d => d.toData()));

        return annotationsData;
    }

    /** Reset annotations */
    reset()
    {
        this.dimensionLines = [];
    }
}

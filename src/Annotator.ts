/**
 *  Annotator.ts
 *      Make different annotations on the model like dimensions, labels etc.
 *      Their main purpose is offering information on top of the model - and are not part of the Shapes 
 *      Only on output they might be turned into real Shapes like text Faces etc.
 */ 

import { Point, Vector, PointLike, isPointLike, ShapeCollection, Shape, Vertex, Edge, Wire, Face, Geom } from './internal'
import { AnyShape,  AnyShapeOrCollection, Layout, roundToTolerance } from './internal'
import { checkInput } from './decorators' // NOTE: needs to be direct


/** Exporting DimensionLine instances as data */
export interface DimensionLineData
{
    _id?:string, // internal id
    type:'dimensionLine'|'label', // TODO: more annotation types
    start:Array<number|number|number>
    end:Array<number|number|number>
    value:number
    static:boolean // if value can be calculated from distance between start-end or is static (for example after projection)
    units:string
    offset:Array<number|number|number>
    scale:number
    interactive:boolean
    round?:boolean 
    param:string // name param binded to this dimension line
    _labelPosition?:Array<number|number|number> // for internal use
    showUnits:boolean
}

/** Dimension Line Style */
export interface DimensionLineStyle
{
    color:any
    scale:number // general scale
    offset:number   
}

/** Dimension Class */
export class DimensionLine
{
    //// SETTINGS
    DIMENSION_OFFSET_DEFAULT = 5;
    DIMENSION_TEXTSIZE_DEFAULT = 10;
    DIMENSION_ARROWLENGTH_DEFAULT = 10;
    DIMENSION_ARROWRADIUS_DEFAULT = 5;
    DIMENSION_ROUND_DEFAULT = true;

    start:Point;
    end:Point;
    shape:AnyShape = null; // the Shape the dimension is linked to - needed to know if we need to export dimension lines in toSvg()
    value:number;
    units:string = null; // not needed?
    offsetVec:Vector; 
    scale:number = 1.0; // scale textSize and arrows uniformly

    offsetLength:number;
    textSize:number = this.DIMENSION_TEXTSIZE_DEFAULT;
    arrowLength:number = this.DIMENSION_ARROWLENGTH_DEFAULT;
    arrowRadius:number = this.DIMENSION_ARROWRADIUS_DEFAULT;

    interactive:boolean = false;
    showUnits:boolean = false;
    round:boolean = true;
    param:string = null; // name of bound parameter

    constructor(start:Point, end:Point, units?:string)
    {
        this.start = start as Point;
        this.end = end as Point;
        this.value = roundToTolerance(this.start._toVertex().distance(this.end._toVertex()));

        this.units = units || null; 
        // styling settings. Use setStyle seperately
        this.scale = 1.0;
        this.offsetLength = this.DIMENSION_OFFSET_DEFAULT;
    
        this._calculateOffsetVec();
    }

    /** Link to Shape */
    link(shape:AnyShape):DimensionLine
    {
        if(Shape.isShape(shape))
        {
            this.shape = shape;
        }

        return this;
    }

    getRotation():number
    {
        return this.end.toVector().subtracted(this.start).angle2D();
    }

    _calculateOffsetVec()
    {
        if ( (this.end.x === this.start.x) && (this.end.y === this.start.y))
        {
            this.offsetVec = new Vector(1,0,0).scale(this.offsetLength); // along x-axis is dimension line is parallel to z-axis
        }
        else {
            this.offsetVec = this.end.toVector().subtracted(this.start.toVector()).crossed([0,0,1]).normalized().scale(this.offsetLength);
        }
        
    }

    // TODO: input checking and sane error message
    setStyle(dimStyle:DimensionLineStyle)
    {
        this.scale = dimStyle?.scale || this.scale;
        this.offsetLength = dimStyle?.offset || this.offsetLength; 
        this._calculateOffsetVec();
        // TODO: more: color, linethickness etc.
    }

    @checkInput(['PointLike'],['Vector'])
    setOffset(v:PointLike)
    {
        this.offsetVec = v as Vector; // auto converted
    }

    /** bind parameter to this dimension line and make it interactive */
    @checkInput(['String'],['auto'])
    bindParam(paramName:string)
    {
        this.param = paramName;
        this.interactive = true;
    }

    /** Output to data (to be send from Webworker to main app) */
    toData():DimensionLineData
    {
        return {
            type: 'dimensionLine',
            start: this.start.toArray(),
            end: this.end.toArray(),
            value: this.value,
            static: false,
            units: this.units,
            offset: this.offsetVec.toArray(),
            scale: this.scale,
            interactive: this.interactive,
            param: this.param,
            round: this.round,
            showUnits: this.showUnits,
        } as DimensionLineData
    }

    /** Generate SVG (in world coordinates) for this dimension line
     *     if 3D the Dimension Line is projected to XY plane
     */
    toSvg(bboxHeight:number)
    {
        let lineStart = this.start.add(this.offsetVec).toArray();
        lineStart[1] = bboxHeight - lineStart[1]; // flip to svg y-axis
        
        let lineEnd = this.end.add(this.offsetVec).toArray();
        lineEnd[1] = bboxHeight - lineEnd[1];

        let dir = this.start.toVector().subtracted(this.end);
        let lineMid = this.end.moved(dir.scaled(0.5)).add(this.offsetVec).toArray();
        lineMid[1] = bboxHeight - lineMid[1];

        let dimText = ((this.round) ? Math.round(this.value) : this.value).toString();
        if (this.showUnits ) dimText += this.units;

        return `<g class="dimensionline">
            ${this._makeSvgLinePath(lineStart,lineEnd)}
            ${this._makeSvgArrow(lineStart)}
            ${this._makeSvgArrow(lineEnd, true)}
            ${this._makeSvgTextLabel(lineMid,dimText)}
            </g>
        `
    }

    @checkInput(['PointLike','PointLike'], ['Point','Point'])
    _makeSvgLinePath(start:PointLike, end:PointLike)
    {  
       // NOTE: auto converted to Point 
       // In SVG coords
       let startPoint = start as Point;
       let endPoint = end as Point;
       return `<line x1="${startPoint.x}" y1="${startPoint.y}" x2="${endPoint.x}" y2="${endPoint.y}"/>`
    }

    /** Place SVG arrow on position and rotation. Tip of the arrow is pivot */
    // NOTE: Arrow itself is already in SVG space (so y-axis is pointing downwards)
    @checkInput(['PointLike', ['Boolean',false]], ['Point','auto'])
    _makeSvgArrow(at:PointLike, flip?:boolean)
    {
       // Pivot of error is [0,0]
       const atPoint = at as Point;
        
       const rotation = (flip) ? this.getRotation() : this.getRotation() + 180;
    
       return `
          <g transform="translate(${atPoint.x} ${atPoint.y}) 
                            rotate(${rotation})
                            scale(1 1)
                            ">
                            <path style="fill:#000000" d="M0 0 L -2 6 L 2 6 Z" />
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

        return `<rect class="dimension-text-background"
                        x="${atPoint.x}" 
                        y="${atPoint.y}" 
                        width="${rectWidth}" 
                        height="${RECT_HEIGHT}"
                        fill="#FFFFFF"
                        stroke-width="0" 
                        transform="translate(${-rectWidth/2} ${-RECT_HEIGHT/2})" />
                <text 
                    class="dimension-text" 
                    x="${atPoint.x}"
                    y="${atPoint.y}"
                    text-anchor="middle"
                    font-size="${FONT_SIZE}"
                    dominant-baseline="central">${text}</text>`
    }
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
    dimensionLine(start:PointLike, end:PointLike, units?:string)
    {
        let newDimension = new DimensionLine(start as Point,end as Point, units);
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
                    
                    dim.setOffset(offsetVec);
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

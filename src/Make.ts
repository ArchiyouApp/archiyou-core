/**
 * 
 *  Make.ts
 *     Module that contains functionality to simplify making (CAM)
 * 
 */

import { ArchiyouApp, Point, Vector, Edge, Face, ShapeCollection, LayoutOptions } from './internal' // classes

//// TYPES, TYPEGUARDS AND INTERFACES ////

export type Alignment2D = 'topleft'|'topright'|'bottomleft'|'bottomright'

/** Statistics on last make operation (including waste, material efficiency etc) */
export interface MakeStats 
{
    efficiency:number // [0-100]
    wastedArea:number
    wastedVolume:number
    numStock:number // total number of stock used
    full?:ShapeCollection // full stock Shapes used
    cut?:ShapeCollection // operations must to order them
    fitted?:ShapeCollection // fitted cut Shapes inside stock
    extra?:ShapeCollection // extra stock for fitted
    waste?:ShapeCollection // Shapes that are not used but are left over
}

export interface Layout2DOptions
{
    start:Alignment2D
    direction:'horizontal'|'vertical' // direction of sequential elements (stacking direction)
    width:number, // total width of layout in model units
    height:number, // total height of layout in model units
    stockWidth?:number // the boxes that need to fit
    stockHeight?:number
    seams?:number // make sure the boxes are the right size to have their seams on given grid lines
    // !!!! TODO: seamsDirection - NOW only vertical
    seamsStartOffset?: number // let seams start later then start of layout
    leftover?:boolean
    cutMargin?:number
}

export function Layout2DOptions(o:any): o is Layout2DOptions
{
    return typeof(o) === 'object' && o?.start && o?.direction && o?.width && o?.height && o?.stockWidth && o?.stockHeight
}

//// MAIN MODULE ////

export class Make
{
    //// SETTINGS ////
    LAYOUT2D_BOX_DEFAULT_FITTING_MARGIN_SIZE = 5

    _ay:ArchiyouApp; // contains all modules
    stats:MakeStats; // stats on last operation

    constructor(ay?:ArchiyouApp)
    {
        this.setArchiyou(ay)
    }

    //// MAIN FUNCTIONS ////

    setArchiyou(ay:ArchiyouApp)
    {
        if(ay)
        {
            this._ay = ay;
        }
    }

    //// STATS HANDLING ////

    resetStats():MakeStats
    {
        this.stats = {
            efficiency : null,
            wastedArea: null,
            wastedVolume: null,
            full: new ShapeCollection(),
            cut: new ShapeCollection(),
            fitted: new ShapeCollection(),
            waste: new ShapeCollection(),   
            numStock: 0,         
        }

        return this.stats;
    }

    //// 2D LAYOUTS ////

    _alignment2DToPoint(a:Alignment2D, width:number, height:number):Point
    {
        const p = new Point(0,0);
        p.x = (a.includes('right')) ? width : 0;
        p.y = (a.includes('top')) ? height : 0;
        return p;
    }

    _checkLayoutOptions(o:Layout2DOptions):Layout2DOptions
    {
        return {
            width: o?.width || 500,
            height: o?.height || 200,
            stockWidth: o?.stockWidth || 20,
            stockHeight: o?.stockHeight || 20,
            start: o?.start || 'bottomleft',
            direction: o?.direction || 'horizontal',
            seams: o?.seams,
            leftover: o?.leftover || false,
            cutMargin: o?.cutMargin || this.LAYOUT2D_BOX_DEFAULT_FITTING_MARGIN_SIZE,
        }
    }

    _layout2DBoxesNewBox(cursor:Point, o:Layout2DOptions, leftOverSize?:number):Face
    {   
        const direction = (o.direction === 'horizontal') ? new Vector(1,0) : new Vector(0,1); // TODO: from right to left
        
        const mainAxis =  (o.direction === 'horizontal') ? 'x' : 'y'; // axis of direction
        const secAxis =  (o.direction === 'horizontal') ? 'y' : 'x'; // axis of secondary direction

        const secDirection = direction.swappedXY();
        const layoutVec = new Vector(o.width, o.height);
        const mainLimit = layoutVec.scaled(direction).length(); // limit of layout in primary direction
        const secLimit = layoutVec.scaled(secDirection).length();

        const origBoxVec = new Vector(o.stockWidth, o.stockHeight);
        let boxVec = origBoxVec.copy();

        if (leftOverSize) // left over from previous box 
        {
            boxVec[mainAxis] = leftOverSize; 
        }

        // check along secondary axis for limit
        if(cursor.moved(boxVec)[secAxis] > secLimit)
        {
            boxVec[secAxis] = secLimit - cursor[secAxis];
        }
        // check along primary axis if out of limit 
        if(cursor.moved(boxVec)[mainAxis] > mainLimit)
        {
            boxVec[mainAxis] = mainLimit - cursor[mainAxis];
        } 
        else if(o.seams) // check if box arrives in primary direction at seams as defined in o.seams
        { 
            let sizeWithSeams = Math.floor(boxVec[mainAxis]/o.seams)*o.seams;
            // can't fit box to seams (not enought size in primary axis available): register wasted Shape
            this.stats.waste.addAligned(new Face().makeRectBetween(cursor, cursor.moved(boxVec)))
            boxVec[mainAxis] = (sizeWithSeams !== 0) ? sizeWithSeams : origBoxVec[mainAxis];
        }
        // now make box
        const boxTo = cursor.moved(boxVec);
        const newBox = new Face().makeRectBetween(cursor, boxTo);

        return newBox;
    }

    _layout2DBoxes(o?:Layout2DOptions):ShapeCollection
    {
        this.resetStats();
        o = this._checkLayoutOptions(o);


        let createdElems = new ShapeCollection().name('boards'); 
        let cursor = this._alignment2DToPoint(o.start, o.width, o.height);
        
        const mainDirectionVec = (o.direction === 'horizontal') ? new Vector(1,0) : new Vector(0,1);
        const mainDirectionSide = (o.direction === 'horizontal') ? 'width' : 'height';
        const mainDirectionBboxSide = (o.direction === 'horizontal') ? 'width' : 'depth';
        const mainDirectionAxis = (o.direction === 'horizontal') ? 'x' : 'y';

        let leftOverBoxSize; // in main direction
        
        while(true)
        {
            // find next box
            const newBox = this._layout2DBoxesNewBox(cursor, o, leftOverBoxSize); // this method find a next box (where needed cut to seams or end of layout)
            leftOverBoxSize = null; // reset left over
            createdElems.add(newBox);
            
            // keep track of stats
            if (Math.round(newBox.bbox().width()) !== o.stockWidth || Math.round(newBox.bbox().depth()) !== o.stockHeight )
            {
                this.stats.cut.add(newBox); // register cut shapes, keep position
            }
            else {
                this.stats.full.add(newBox); // register full shapes, keep position
            }

            
            // move cursor
            cursor = cursor.moved(new Vector(newBox.bbox().width(),newBox.bbox().depth()).scaled(mainDirectionVec))

            // check if cursor in main direction filled up and return to next row of boxes in main direction
            if( (cursor[mainDirectionAxis] >= o[mainDirectionSide]))
            {
                cursor = new Vector(cursor.x + newBox.bbox().width(), cursor.y + newBox.bbox().depth()).scaled(mainDirectionVec.swappedXY()).toPoint();
                leftOverBoxSize = (o.leftover) ? new Vector(o.stockWidth, o.stockHeight).scaled(mainDirectionVec).length() - newBox.bbox()[mainDirectionBboxSide]() : null;
            }
          
            // check cursor in secondary direction - and break
            if( (o.direction === 'horizontal' && cursor.y >= o.height) || (o.direction === 'vertical' && cursor.x >= o.width))
            {
                break
            }
        }
        
        this._layout2DBoxesStats(o);

        return createdElems.length ? createdElems : null; 
    }

    /** Calculate stats of layout2DBoxes operation */
    _layout2DBoxesStats(o?:Layout2DOptions):MakeStats
    {
        // find number of stock to make cut shapes
        this.stats.numStock = this.stats.full.length;
        this.stats.efficiency = 100;

        if (this.stats.cut.length > 0)
        {
            this.stats.fitted = this.stats.cut.pack({ stockWidth: o.stockWidth, stockHeight: o.stockHeight, margin: o.cutMargin }, true)
            this.stats.fitted?.removeFromScene(); // don't add automatically to Scene
            this.stats.numStock += this.stats.fitted.getGroup('bins').length;
            const stockUsedArea = this.stats.numStock * o.stockWidth * o.stockHeight;
            const cutPartsArea = this.stats.fitted.getGroup('cut').reduce( (sum,shape) => sum + shape.area(), 0)
            const fullPartsArea = this.stats.full.length * (this.stats.full?.first()?.area() || 0)
            this.stats.efficiency = Math.round((fullPartsArea + cutPartsArea) / stockUsedArea * 100);
        }
        
        return this.stats;
    }

    /** Public method to generate rectangular boarding on rectangle plane on XY plane */
    boarding(o?:Layout2DOptions):ShapeCollection
    {
        return this._layout2DBoxes(o);
    }

    //// SPECIALS WITH STRUTS AND FRAMEWORKS ////
    // work in progress

    /** Find a 2D strut length and angle that exactly fits diagonally in given space 
     *   NOTE: It's easy to see how it works if you consider the special circumstances 
     *   of width=spaceWidth, width=spaceHeight and angle(spaceWidth,spaceHeight) = 45 deg
    */
    fitRectStrut(width:number, space:Array<number|number>, withSpace:boolean=false):Face|ShapeCollection
    {
        const spaceAngle = Math.atan((space[1]-width)/(space[0]-width));
        const diagAlignHeight = Math.cos(spaceAngle) * width;
        const diagAlignWidth = Math.sin(spaceAngle) * width;
        
        const strut = new Edge().makeLine([diagAlignWidth,0], [space[0], space[1]-diagAlignHeight]).extrude(width) as Face;
        
        return (!withSpace) ? 
                    strut : 
                    new ShapeCollection(strut, new Face().makeRectBetween([0,0],space).toWire().addToScene().color('blue'));
    }
}

/**
 * 
 *  Make.ts
 *     Module that contains functionality to simplify making (CAM)
 * 
 */

import { ArchiyouApp, Point, Vector, Edge, Face, ShapeCollection, LayoutOptions } from './internal' // classes

//// TYPES, TYPEGUARDS AND INTERFACES ////

export type Alignment2D = 'topleft'|'topright'|'bottomleft'|'bottomright'

export interface Layout2DOptions
{
    start:Alignment2D
    direction:'horizontal'|'vertical' // direction of sequential elements
    width:number, // total width of layout in model units
    height:number, // total height of layout in model units
    elemWidth?:number // the boxes that need to fit
    elemHeight?:number
    seamsAtSpacing?:number // make sure the boxes are the right size to have their seams on given grid lines
    startWithLeftOver?:boolean
}

export function Layout2DOptions(o:any): o is Layout2DOptions
{
    return typeof(o) === 'object' && o?.start && o?.direction && o?.width && o?.height && o?.elemWidth && o?.elemHeight
}

//// MAIN MODULE ////

export class Make
{
    _ay:ArchiyouApp = null; // contains all modules

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

    //// 2D LAYOUTS ////

    _alignment2DToPoint(a:Alignment2D, width:number, height:number):Point
    {
        const p = new Point(0,0);
        p.x = (a.includes('right')) ? width : 0;
        p.y = (a.includes('top')) ? height : 0;
        return p;
    }

    _layout2DBoxesNewBox(cursor:Point, o:Layout2DOptions):Face
    {
        let boxOffset = new Vector(o.elemWidth, o.elemHeight)
        let newBox = new Face().makeRectBetween(cursor, cursor.moved(boxOffset));
        if(o.seamsAtSpacing)
        {
            if(o.direction === 'horizontal')
            {
                newBox = new Face().makeRectBetween(
                    cursor, 
                    cursor.moved(new Vector(Math.floor(o.elemWidth/o.seamsAtSpacing)*o.seamsAtSpacing, o.elemHeight))) // in main direction
            }
            else {
                newBox = new Face().makeRectBetween(cursor, 
                    cursor.moved(new Vector(o.elemHeight, Math.floor(o.elemHeight/o.seamsAtSpacing)*o.seamsAtSpacing))) // in main direction
            }
            
        }

        return newBox;
    }

    _layout2DBoxes(o:Layout2DOptions = { start:'bottomleft', direction: 'horizontal', width:2000, height:2000, elemWidth:200, elemHeight:100, seamsAtSpacing:50, startWithLeftOver:true }):ShapeCollection
    {
        if(!Layout2DOptions(o)){ throw new Error(`Make::boarding: Invalid input for o. Make sure you supply something like: { start:'topleft', direction: 'horizontal', width:2000, height:3000, elemWidth:400, elemHeight:300, seamsAtSpacing:610, startWithLeftOver:true`) };
        
        let createdElems = new ShapeCollection().name('boards'); 
        // TODO: wasted parts of elems
        let cursor = this._alignment2DToPoint(o.start, o.width, o.height);
        
        // some checks
        if(o.elemWidth > o.width || o.elemHeight > o.height )
        {
            throw new Error(`Make::_layout2DBoxes: Boxes are too big for layout! Check elemWidth and elemHeight`)    
        }

        if (o.seamsAtSpacing && ((o.direction === 'horizontal') && o.seamsAtSpacing > o.width) || ((o.direction === 'vertical') && o.seamsAtSpacing > o.height))
        {
            throw new Error(`Make::_layout2DBoxes: 'seamsAtSpacing' is more than dimensions of boxes! This can not work!`)    
        }
        

        while(true)
        {
            // find box
            const newBox = this._layout2DBoxesNewBox(cursor, o);
            console.log(newBox.bbox().width());
            console.log(newBox.bbox().depth());
            createdElems.add(newBox);
            // move cursor
            cursor = (o.direction === 'horizontal') ? 
                        cursor.moved(newBox.bbox().width()) : 
                        cursor.moved(newBox.bbox().depth());

            console.log(cursor);
            // check if cursor in main direction filled up
            if( (o.direction === 'horizontal' && cursor.x >= o.width))
            {
                // TODO: cut box if needed
                console.log('HIERO');
                console.log(cursor.y);
                console.log(cursor.y + newBox.bbox().depth())
                cursor = new Point(0,cursor.y + newBox.bbox().depth());
            }
            else if((o.direction === 'vertical' && cursor.y >= o.height))
            {
                // TODO: cut box if needed
                cursor = new Point(cursor.x + newBox.bbox().width(), 0);
            }

            // check cursor in secondary direction - and break
            if( (o.direction === 'horizontal' && cursor.y >= o.height) || (o.direction === 'vertical' && cursor.x >= o.width))
            {
                break
            }
        }
        
        return createdElems.length ? createdElems : null; 
    }

    /** Public method to generate rectangular boarding on rectangle plane on XY plane */
    boarding(o:Layout2DOptions={ start:'bottomleft', direction: 'horizontal', width:2000, height:2000, elemWidth:200, elemHeight:100, seamsAtSpacing:50, startWithLeftOver:true }):ShapeCollection
    {
        if(!Layout2DOptions(o)){ throw new Error(`Make::boarding: Invalid input for o. Make sure you supply something like: { start:'topleft', direction: 'horizontal', width:2000, height:3000, elemWidth:400, elemHeight:300, seamsAtSpacing:610, startWithLeftOver:true`) };

        return this._layout2DBoxes(o);
    }
}

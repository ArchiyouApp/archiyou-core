type ContainerType = 'view'|'image'|'text'|'textarea'|'table'

import { Page, DocUnits, WidthHeightInput, isWidthHeightInput, ModelUnits } from './internal'

//// TYPES AND INTERFACES ////
export type ContainerAlignment = 'center'|'top'|'left'|'right'|'bottom'|'topleft'|'topright'|'bottomleft'|'bottomright'
export type ContainerSide = 'width'|'height'
export type ZoomRelativeTo = 'container'|'world'
export type ScaleInput = 'auto'|number;
export type ContainerSizeRelativeTo = 'page' | 'page-content-area'; // page-content area is page without the padding on both sides
export type Position = Array<number|number>|ContainerAlignment

export type ContainerData = { // Combine all Container types for convenience
    _entity:string
    name:string
    parent:string
    type:ContainerType
    width:number // relative to (see: widthRelativeTo)
    widthRelativeTo:ContainerSizeRelativeTo
    widthAbs?:number // in doc units (added on place)
    height:number // relative to (see: widthRelativeTo)
    heightRelativeTo:ContainerSizeRelativeTo
    heightAbs?:number // in doc units (added on place)
    position:Array<number|number> // relative to page-content-area
    pivot:Array<number|number>
    frame?:any // TODO
    index?:number
    caption?:string
    contentAlign:ContainerAlignment
    content:any; // TODO: raw content
    zoomLevel:ScaleInput, // number or 'auto
    zoomRelativeTo:ZoomRelativeTo,
    docUnits:DocUnits, 
    modelUnits:ModelUnits,
    _domElem?:HTMLDivElement, // added on placement
}

export interface Frame {
    color:string // TODO
    thickness:number
    shape:'rect'|'circle'
}

export interface ContainerContent 
{
    settings:{[key:string]:any}
    main:any; // main data
}

//// TYPEGUARDS

export function isContainerAlignment(o:any): o is ContainerAlignment
{
    return ['center','top','left','right','bottom','topleft','topright','bottomleft','bottomright'].includes(o)
}

export function isPosition(o:any): o is Position
{
    return (Array.isArray(o) && o.length === 2 && o.every(e => typeof e === 'number'))
        || isContainerAlignment(o);
}

export function isScaleInput(o:any): o is ScaleInput {
    return (typeof o === 'string' && o === 'auto') || (typeof o === 'number')
}


//// CONTAINER CLASS

export class Container
{
    //// SETTINGS ////
    WIDTH_DEFAULT = 1.0; // in perc of content area
    HEIGHT_DEFAULT = 1.0;
    PIVOT_DEFAULT:ContainerAlignment = 'center';
    POSITION_DEFAULT:ContainerAlignment = 'center';
    ALIGNMENT_TO_WPERC_HPERC = { // NOTE: [0,0] is at leftbottom
        'center' : [0.5,0.5],
        'top' : [0,1],
        'left' : [0,0.5],
        'right' : [1,0.5],
        'bottom' : [0.5,0],
        'topleft' : [0,1],
        'topright' : [1,1],
        'bottomleft' : [0,0],
        'bottomright' : [1,0],
    }

    //// END SETTINGS ////

    name:string;
    _page:Page; // through page also root doc
    _parent:Container; // if nested on other container
    _type:ContainerType;
    _width:number; // in relative coordinates [0-1] of page content area width or page width (when _widthRelativeTo = 'page')
    _height:number; // in relative coordinates [0-1] of page content area height or page height (when _heightRelativeTo = 'page')
    _widthRelativeTo:ContainerSizeRelativeTo = 'page-content-area'; // NOTE: 'page-content-area is the area that remains after page padding [DEFAULT]
    _heightRelativeTo:ContainerSizeRelativeTo = 'page-content-area';
    _position:Array<number|number>; // x,y in relative coords [0-1] of page-content-area
    _pivot:Array<number|number>; // x,y in percentage [0-1] of [containerWidth,containerHeight] - leftbottom = [0,0]
    _frame:Frame;
    _index:number; // ordering z-index
    _caption:string;
    _contentAlign:ContainerAlignment;
    _content:any; // TODO: raw content (like Svg for View, source for Image etc)
    _zoomLevel:ScaleInput;
    _zoomRelativeTo:ZoomRelativeTo;

    constructor(name:string)
    {
        this.name = name;
    }

    _setDefaults()
    {
        this.width(this.WIDTH_DEFAULT);
        this.height(this.HEIGHT_DEFAULT);
        this.pivot(this.PIVOT_DEFAULT);
        this.position(this.POSITION_DEFAULT);
    }

    on(page:Page):Container
    {
        this._page = page;
        this._setDefaults();
        page.add(this); // Add to Page

        return this;
    }

    /** Set width of this Container. Either in percentage ([0-1]) of (page or content) width or in % or units */
    width(n:WidthHeightInput)
    {
        if(!isWidthHeightInput(n)){ throw new Error(`Container::height: Invalid input "${n}": Use a number, number with units ("30mm") or string like "40%"!`)};
        [this._width, this._widthRelativeTo] = this._page._doc._resolveWidthHeightInput(n, this._page, 'width');
        console.info(`Container::width(): Set container width to ${this._width}`);
    }

    /** Set height of this Container. Either in percentage ([0-1]) of width or in % or units */
    height(n:WidthHeightInput)
    {
        if(!isWidthHeightInput(n)){ throw new Error(`Container::height: Invalid input "${n}": Use a number, number with units ("30mm") or string like "40%"!`)};
        [this._height, this._heightRelativeTo] = this._page._doc._resolveWidthHeightInput(n, this._page, 'height');
        console.info(`Container::width(): Set container height to :${this._height}`);
    }

    /** Set position with a ContainerAlignment ('top', 'topright') or percentage of width and height [x,y]  */
    position(p:Position):Container
    {
        if(!isPosition(p)){ throw new Error(`Container::pivot: Invalid input "${p}": Use [widthPerc,heightPerc] or ContainerAlignment ('center','topleft'etc)`)};
        if(isContainerAlignment(p))
        {
            this._position = this.ALIGNMENT_TO_WPERC_HPERC[p];
            return this;
        }
        else {
            this._position = p as Array<number|number>;
            return this;
        }   
    }

    /** Set pivot with a ContainerAlignment ('top', 'topright') or percentage of width and height [x,y]  */
    // TODO: enable 20%, 2cm from origin
    pivot(p:Position):Container
    {
        if(!isPosition(p)){ throw new Error(`Container::position(): Invalid input "${p}": Use [widthPerc,heightPerc] or ContainerAlignment ('center','topleft'etc)`)};
        if(isContainerAlignment(p))
        {
            this._pivot = this.ALIGNMENT_TO_WPERC_HPERC[p];
            return this;
        }
        else {
            this._pivot = p as Array<number|number>;
            return this;
        }   
    }

    /** Set zoom level (which is relative to view container size) */
    zoom(factor:number)
    {
        if(typeof factor !== 'number'){ throw new Error(`Container::zoom(): Invalid input "${factor}" for zoom relative to container: Use a number like 2 (zoom in 2x) or 1/2 (zoom out 2x)`)};        
        this._zoomLevel = factor as ScaleInput;
        this._zoomRelativeTo = 'container';
    }

    /** Set zoom level relative to world size of Shapes */
    scale(factor:ScaleInput)
    {
        if(!isScaleInput){ throw new Error(`Container::scale(): Invalid input "${factor}" to set zoom relative to world size: Use 'auto' (for automatic picking scale) or a number like 2 (2:1) or 1/10 (1:10)`)};
        this._zoomLevel = factor;
        this._zoomRelativeTo = 'world';
    }


    //// OUTPUT ////

    /** Transform from relative width (to page or page-content-area) to absolute (in DocUnits) */
    _calculateAbsWidth():number
    {
        const relToSize =  (this._widthRelativeTo === 'page-content-area') ?
            this._page._width - 2*this._page._width*this._page._padding[0] : this._page._width
        return this._width * relToSize;
    }

    /** Transform from relative height (to page or page-content-area) to absolute (in DocUnits) */
    _calculateAbsHeight():number
    {
        const relToSize = (this._heightRelativeTo === 'page-content-area') ?
            this._page._height - 2*this._page._height*this._page._padding[1] : this._page._height
        return this._height * relToSize;
    }

    /** Output raw Container data */
    // NOTE: We use toData from the subclasses of Container (they use this function)
    _toContainerData():ContainerData
    {
        return {
            _entity: 'container',
            name: this.name,
            parent: this._parent?.name,
            type: this._type,
            width: this._width, // relative to page-content-area or page
            widthRelativeTo: this._widthRelativeTo,
            widthAbs: this._calculateAbsWidth(),
            height: this._height, // relative to page-content-area or page
            heightRelativeTo: this._widthRelativeTo,
            heightAbs: this._calculateAbsHeight(), // in doc units
            position: this._position,
            pivot: this._pivot,
            frame: this._frame,
            index: this._index,
            caption: this._caption,
            contentAlign: this._contentAlign,
            content: null,
            zoomLevel: this._zoomLevel || 1,
            zoomRelativeTo: this._zoomRelativeTo || 'container',
            docUnits: this._page._units, // needed to scale the content
            modelUnits: this._page._units, // needed to scale the content
        }
    }

    toData():ContainerData
    {
        // will be overriden by subclasses
        return null;
    }
  

    //// UTILS ////


}

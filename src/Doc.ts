/**
 * 
 *  Doc.ts
 * 
 *     Define documents by code
 * 
 *      Important entities:
 *        - Doc - set of pages
 *        - Page
 *        - Containers - blocks on the page with content
 *        - Templates - set of containers with variable slots
 *        - View - container that shows CAD shapes
 *      
 *      Example:
 *          doc('myOutput')
 *          .units('mm')
 *          .page('isometry')
 *          .size('A4')
 *          .padding('10mm')
 *          .orientation('landscape')
 *          .view('isometric view')
 *            .shapes(leftfrontback) 
 *            .scale('auto')
 *            .width('100%')
 *            .height('100%')
 *            .position('topleft')         
 */

import { Geom, ModelUnits, ShapeCollection, Page, PageSize, Container, AnyContainer, View, TableOptions } from './internal' // classes
import { isPageSize, PageOrientation, isPageOrientation, PageData, ContainerSide, ContainerSizeRelativeTo,
            Position, isPosition, ScaleInput, Image, ImageOptions, Text, TextOptions, TextArea, Table } from './internal' // types and type guards

import { convertValueFromToUnit } from './internal' // utils

//// TYPES AND INTERFACES ////
export type DocUnits = 'mm'|'cm'|'inch'; 
export type PercentageString = string // 100%, 0.5%, -10%
export type ValueWithUnitsString = string
export type WidthHeightInput = number|PercentageString|ValueWithUnitsString;
export type TableInput = string|Array<{[key:string]:any}>

export interface DocData {
    name:string
    units:DocUnits
    pages:Array<PageData>
    modelUnits:ModelUnits
}

//// TYPE GUARDS ////
export function isDocUnits(o:any): o is DocUnits
{
    if(typeof o !== 'string'){ return false };
    return ['mm','cm','inch'].includes(o as string);
}

export function isPercentageString(o:any): o is PercentageString 
{
    if(typeof o !== 'string'){ return false };
    return o.match(/\-*[\d\.]+%$/) !== null;
}

export function isValueWithUnitsString(o:any): o is PercentageString 
{
    if(typeof o !== 'string'){ return false };
    return o.match(/\-*[\d\.]+mm|cm|inch|\"$/) !== null;
}

export function isWidthHeightInput(o:any): o is WidthHeightInput
{
    return typeof o === 'number' ||
        isPercentageString(o) ||
        isValueWithUnitsString(o);
}

export function isTableInput(o:any): o is TableInput
{
    return (typeof o === 'string') 
        || (Array.isArray(o) && o.every(r => typeof r === 'object'))
}

//// MAIN CLASS ////

export class Doc
{
    //// SETTINGS ////
    DOC_DEFAULT_NAME = 'doc'
    DOC_UNITS_DEFAULT:DocUnits = 'mm';
    PAGE_SIZE_DEFAULT:PageSize = 'A4';
    PAGE_ORIENTATION_DEFAULT:PageOrientation = 'landscape';

    //// END SETTINGS ////
    _geom:Geom;
    _calc:any; // Cannot use reference to Calc here, because we don't allow references outside core
    
    _docs:Array<string> = []; // multiple documents
    _activeDoc:string;

    _pageSizeByDoc:{[key:string]:PageSize} = {};
    _pageOrientationByDoc:{[key:string]:PageOrientation} = {}; // default orientation
    _pagesByDoc:{[key:string]:Array<Page>} = {};
    _unitsByDoc:{[key:string]:DocUnits} = {};

    _activePage:Page
    _activeContainer:AnyContainer
    

    constructor(geom:Geom) // null is allowed
    {
        this._geom = geom;

        //// DEFAULTS
        this._setDefaults();
    }

    /** Set reference to Calc module */
    // NOTE: this can not be typed because we don't allow reference from core to app scope
    setCalc(calc:any)
    {
        this._calc = calc;
    }

    _setDefaults():Doc
    {   
        this.reset();

        return this;
    }

    /** Make a new document with optionally a name */
    new(name?:string):Doc
    {
        this._activeDoc = `${this.DOC_DEFAULT_NAME}${this._docs.length+1}` // start a unnamed doc
        this._docs.push(this._activeDoc);

        this._unitsByDoc[this._activeDoc] = this.DOC_UNITS_DEFAULT;
        this._pageSizeByDoc[this._activeDoc] = this.PAGE_SIZE_DEFAULT;
        this._pageOrientationByDoc[this._activeDoc] = this.PAGE_ORIENTATION_DEFAULT;
        this._pagesByDoc[this._activeDoc] = [];

        if(name){ this.name(name) };

        return this;
    }

    /** Set name of active document */
    name(n:string):Doc
    {
        // check if name does not exist
        if( typeof n !== 'string' || n.length === 0 ){ throw new Error(`doc::name: Please supply a valid string as document name!`);}
        if (this._docs.includes(n)){ throw new Error(`doc::name: Document with name "${n}" already exists!`);}
        
        // replace name of current document in _docs and other byDoc attributes
        // TODO: improve by using id per document that stays the same?
        this._docs = this._docs.map( d => (d === this._activeDoc) ? n : d);

        this._pageSizeByDoc[n] = this._pageSizeByDoc[this._activeDoc];
        delete this._pageSizeByDoc[this._activeDoc];

        this._pageOrientationByDoc[n] = this._pageOrientationByDoc[this._activeDoc];
        delete this._pageOrientationByDoc[this._activeDoc];

        this._pagesByDoc[n] = this._pagesByDoc[this._activeDoc];
        delete this._pagesByDoc[this._activeDoc];
        
        this._unitsByDoc[n] = this._unitsByDoc[this._activeDoc];
        delete this._unitsByDoc[this._activeDoc];

        this._activeDoc = n;

        return this;
    }

    /** Reset state of Doc instance */
    reset()
    {
        this._pagesByDoc = {};
        this._docs = [];
        this._pageSizeByDoc = {};
        this._pageOrientationByDoc = {};
        this._pagesByDoc = {};
        this._unitsByDoc = {};
        this.new(); // make sure we have a default document
    }

    /** Set Unit for active document: 'mm','cm' or 'inch' */
    units(units:DocUnits):Doc
    {
        if(!isDocUnits(units)){ throw new Error(`doc::pageSize: Invalid units. Use 'mm', 'cm' or 'inch'`);}
        this._unitsByDoc[this._activeDoc] = units;

        return this;
    }

    /** Set general page ISO size (A0,A4 etc) for current doc */
    pageSize(size:PageSize):Doc
    {
        if(!isPageSize(size)){ throw new Error(`doc::pageSize: Invalid ISO page size. Use: A0, A4 etc!`);}
        this._pageSizeByDoc[this._activeDoc] = size;

        return this;
    }

    /** Set general page ISO size (A0,A4 etc) for current doc */
    pageOrientation(o:PageOrientation):Doc
    {
        if(!isPageOrientation(o)){ throw new Error(`doc::pageSize: Invalid page orientation. Use 'landscape' or 'portrait'`);}
        this._pageOrientationByDoc[this._activeDoc] = o;

        return this;
    }

    /** Add a new page to the doc with given name */
    page(name:string):Doc
    {
        if(!name){ throw new Error(`Doc::page: Please supply a name to a page!`)}
        if(this._pageExists(name)){ throw new Error(`Doc::page: Page name "${name}" is already taken. Please use unique names!`)}
        
        const newPage = new Page(this, this._units() , name);
        this._pagesByDoc[this._activeDoc].push(newPage);
        this._setPageDefaults(newPage);
        this._activePage = newPage;

        return this;
    }

    /** Set size of active Page */
    size(size:PageSize):Doc
    {
        this._checkPageIsActive();
        this._activePage.size(size);
        
        return this;
    }

    /** Set padding of active Page (width (left and right) and height (top and bottom)) 
     *  Use relative width/height ([0-1]), number with percentage (5%) or number with real units ('1cm','0.5"')
    */
    padding(w:WidthHeightInput, h?:WidthHeightInput):Doc // in doc units
    {
        if(!isWidthHeightInput(w)){ throw new Error(`Doc::padding: Please supply padding (width,height) as relative width/height ([0-1]), percentage string (10%) or a number with units ('1cm','0.5"')`);}
        this._checkPageIsActive();
        this._activePage.padding(w,h);

        return this;
    }

    /** Set orientation ('landscape' or 'portrait') of active page */
    orientation(o:PageOrientation):Doc
    {
        if(!isPageOrientation(o)){ throw new Error(`Doc::orientation: Invalid page orientation. Use 'landscape' or 'portrait'`);}
        this._checkPageIsActive();
        this._activePage._orientation = o;

        return this;
    }

    /** Add View Container to active Page */
    // TODO: auto name based on shapes
    view(name:string, shapes:ShapeCollection):Doc
    {
        if(typeof name !== 'string'){ throw new Error(`Doc::view: Please supply a name to the view!`);}
        this._checkPageIsActive();
        
        const newViewContainer = new View(name).on(this._activePage);
        this._activeContainer = newViewContainer;
        if(ShapeCollection.isShapeCollection(shapes)) this.shapes(shapes);

        return this;
    }

    /** Add Image Container to active Page */
    image(url:string, options?:ImageOptions):Doc
    {
        if(typeof url !== 'string'){ throw new Error(`Doc::image: Please supply a string with the image`);}
        if(!url.includes('http')){ throw new Error(`Doc::image: Please supply a url with http(s)`);}

        const newImageContainer = new Image(url, options).on(this._activePage);
        this._activeContainer = newImageContainer;
        
        return this;
    }

    /** Add Text line to active Page */
    text(text:string|number, options?:TextOptions):Doc
    {
        if( (typeof text !== 'string') && (typeof text !== 'number') ){ throw new Error('Doc::text(): Please supply a string or number for a Text Container!') }
        text = (typeof text !== 'string') ? text.toString() : text;    
      
        const newTextContainer = new Text(text, options).on(this._activePage);
        this._activeContainer = newTextContainer;
        return this;
    }

    /** Add multiline text area */
    textarea(text:string|number, options?:TextOptions):Doc
    {
        if( (typeof text !== 'string') && (typeof text !== 'number') ){ throw new Error('Doc::text(): Please supply a string or number for a Text Container!') }
        text = (typeof text !== 'string') ? text.toString() : text;    

        const newTextAreaContainer = new TextArea(text, options).on(this._activePage);
        this._activeContainer = newTextAreaContainer;
        return this;
    }

    /** Add table to active Page 
     *  @param input name of Calc table or raw data rows in format [{c1:v1,c2:v2},{...}]
     * 
    */
    table(input:TableInput, options?:TableOptions):Doc
    {
        if(!isTableInput){ throw new Error(`Doc::table: Please enter a name of existing Calc Table or data rows in format [{ col1:val1, col2:val2},{...}]`); }
        if(typeof input === 'string' && !this._calc){ throw new Error(`Doc::table: Cannot get table data from Calc module. Calc is not initialized. Use calc.init()`); }
        if(typeof input === 'string' && !this._calc.tables().includes(input as string)){ { throw new Error(`Doc::table: Cannot get table data from Calc module. No such table: '${input}'. Available tables: ${this._calc.tables().join(',')}`); } }

        // either get data from Calc or use raw data input
        const dataRows = (typeof input === 'string') ? this._calc.db.table(input as string).toDataRows() : input;

        const newTableContainer = new Table(dataRows, options).on(this._activePage);
        this._activeContainer = newTableContainer;
        
        return this;
    }


    //// DEFINE ACTIVE CONTAINER ////

    /** Set Page width or Container width based if View is active */
    width(n:WidthHeightInput):Doc
    {
        if(this._activeContainer)
        { 
             this._activeContainer.width(n)
        }
        else {
            this._checkPageIsActive();
            this._activePage.width(n);
        }

        return this;
    }

    /** Set Page width or View width based if View is active */
    height(n:WidthHeightInput):Doc
    {
        if(this._activeContainer)
        { 
             this._activeContainer.height(n)
        }
        else {
            this._checkPageIsActive();
            this._activePage.height(n);
        }
        return this;
    }

    /** Set Position of active Container
     *   - relative to page content area (0.5,0.5 => center)
     *   - Alignment: topleft, bottom(center)
     *   TODO: in world units from origin
     */
    position(x:number|Position, y?:number):Doc
    {
        if(!this._activeContainer || !this._activePage)
        {
            throw new Error(`Doc::position(): Can not set position of active container. No active container and/or Page created!`);
        }

        if (isPosition(x))
        {
            this._activeContainer.position(x)    
        }
        else if (typeof x === 'number')
        {
            this._activeContainer.position([x,y||0]);
        }
        else {
            throw new Error(`Doc::position(): Invalid position. Try Alignment like 'topleft' or coords relative ([0-1]) relative to page content area origin`);
        }
        return this;
    }

     /** Set Pivot of active Container
     *   - relative to page content area (0.5,0.5 => center)
     *   - Alignment: topleft, bottom(center)
     *   TODO: in world units from origin
     */
    pivot(x:number|Position, y?:number):Doc
    {
        if(!this._activeContainer || !this._activePage)
        {
            throw new Error(`Doc::position(): Can not set position of active container. No active container and/or Page created!`);
        }

        if (isPosition(x))
        {
            this._activeContainer.pivot(x)    
        }
        else if (typeof x === 'number')
        {
            this._activeContainer.pivot([x,y||0]);
        }
        else {
            throw new Error(`Doc::pivot(): Invalid pivot. Try Alignment like 'topleft' or coords relative ([0-1]) relative to page content area origin`);
        }
        return this;
    }

    //// Forward to active View Container ////

    /** Bind ShapeCollection to View */
    shapes(shapes:ShapeCollection):Doc
    {
        if(!this._activeContainer){ throw new Error(`Doc::shapes(): Cannot add Shapes because no View Container is active! Make a View first with view("myView")!`)};
        if(this._activeContainer._type !== 'view'){ { throw new Error(`Doc::shapes(): Cannot add Shapes because no active container is a not a View. Check the order of your statements!`)};}
        (this._activeContainer as View).shapes(shapes);

        return this;
    }

    zoom(level:number):Doc
    {
        if(!this._activeContainer){ throw new Error(`Doc::zoom(): Cannot add Shapes because no View Container is active! Make a View first with view("myView")!`)};
        if(this._activeContainer._type !== 'view'){ { throw new Error(`Doc::shapes(): Cannot add Shapes because no active container is a not a View. Check the order of your statements!`)};}        
        (this._activeContainer as View).zoom(level);

        return this;
    }

    scale(factor?:ScaleInput):Doc
    {
        if(!factor) factor = 'auto' as ScaleInput;

        if(!this._activeContainer){ throw new Error(`Doc::scale(): Cannot add Shapes because no View Container is active! Make a View first with view("myView")!`)};
        if(this._activeContainer._type !== 'view'){ { throw new Error(`Doc::shapes(): Cannot add Shapes because no active container is a not a View. Check the order of your statements!`)};}        
        (this._activeContainer as View).scale(factor);

        return this;
    }

    //// OUTPUT ////

    toData():{[key:string]:DocData}
    {
        let docs = {};
        this._docs.forEach( doc => {
            docs[doc] = {
                name: doc,
                units: this._unitsByDoc[doc],
                pages: this._pagesByDoc[doc].map(p => p.toData()) as Array<PageData>,
                modelUnits: this._geom._units, // set model units to calculate scale later
            }
        })
        return docs;
    }

    //// PRIVATE METHODS ////

    _units():DocUnits
    {
        return this._unitsByDoc[this._activeDoc];
    }

    //// UTILS ////

    _setPageDefaults(page:Page)
    {
        page._size = this._pageSizeByDoc[this._activeDoc];
        page._orientation = this._pageOrientationByDoc[this._activeDoc];

        return page
    }

    /** Check if page name exists for active document */
    _pageExists(name:string):boolean
    {
        console.log('==== PAGE EXISTS ====');
        console.log(this._pagesByDoc);
        console.log(name);
        return this._pagesByDoc[this._activeDoc].some( page => page.name === name);
    }

    _checkPageIsActive()
    {
        if(!this._activePage){ throw new Error(`Doc::padding: Cannot set page ISO size: No page added yet!`);}
        return true;
    }

     /** Transform WidthHeightInput to relative width/height */
     // NOTE: we need to return ContainerSizeRelativeTo too so to register it in the container
     _resolveWidthHeightInput(n:WidthHeightInput, page:Page, side:ContainerSide):[number,ContainerSizeRelativeTo]
     {
         if(typeof n === 'number')
         {
             return [n as number, 'page-content-area' as ContainerSizeRelativeTo];
         }
         else if(isPercentageString(n))
         {
             return [this._resolvePercentageString(n), 'page-content-area' as ContainerSizeRelativeTo];
         }
         else if(isValueWithUnitsString(n))
         {
             return [this._resolveValueWithUnitsString(n, page, side), 'page' as ContainerSizeRelativeTo]; // absolute units are relative to page (because padding might change and thus size of content area)
         }
         
         return null;
     }
     
     /** Percentage of page space, page minus padding (not entire padding) */
     _resolvePercentageString(s:PercentageString):number
     {
        // TODO: take padding into account !
        if(typeof s !== 'string'){ return null };
        const m = s.match(/(\-*[\d\.]+)%$/);
        if (m)
        {
            return parseFloat(m[1])/100;
        }
        return null; 
     }
 
     /** Return width or height in relative coords of current Page and document units */
     _resolveValueWithUnitsString(s:ValueWithUnitsString, page:Page, side:ContainerSide):number 
     {
         if(typeof s !== 'string'){ return null };
         const m = s.match(/(\-*[\d\.]+)(mm|cm|inch|\")$/);
         if (m)
         {
             let num = parseFloat(m[1]); // value in units
             let units = m[2];
             // convert if units is '"" (short hand for inch)
             if (units === '"') units = 'inch';
 
             // given unit is not the document unit
             if(units !== this._unitsByDoc[this._activeDoc])
             {
                 num = convertValueFromToUnit(num, units as DocUnits, this._unitsByDoc[this._activeDoc]);
             }

             // We have the num in doc units. Now make relative
             let sideLength = page[`_${side}`];
             let relativeValue = num / sideLength;
 
             // give a warning if it's out of the page
             if(relativeValue > 1 || relativeValue < 0)
             {
                 console.warn(`Container::_resolveValueWithUnitsString: You supplied a value ('${s}') that is outside the page size! Check if this is correct!`)
             }
 
             return relativeValue;
 
         }
         return null; 
     }

}





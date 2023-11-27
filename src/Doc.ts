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

import { Geom, ModelUnits, ShapeCollection, DataRows, Container, ContainerType, Page, PageSize, AnyPageContainer, View, TableContainerOptions, ArchiyouApp, DocPathStyle, 
            ContainerAlignment, ContainerHAlignment, ContainerVAlignment, isContainerHAlignment, isContainerVAlignment, isContainerAlignment, AnyShapeOrCollection } from './internal' // classes
import { isPageSize, PageOrientation, isPageOrientation, PageData, ContainerSide, ContainerSizeRelativeTo,
            PositionLike, isPositionLike, ScaleInput, Image, ImageOptions, Text, TextOptions, TextArea, TableContainer } from './internal' // types and type guards

import { DocSettings, DocUnits, PercentageString, ValueWithUnitsString, WidthHeightInput, 
    ContainerTableInput, DocData, isDocUnits, isPercentageString, isValueWithUnitsString, 
        isWidthHeightInput, isContainerTableInput
            } from './internal'

import { convertValueFromToUnit } from './internal' // utils

//// MAIN CLASS ////

export class Doc
{
    //// SETTINGS ////
    DOC_DEFAULT_NAME = 'doc'
    DOC_UNITS_DEFAULT:DocUnits = 'mm';
    PAGE_SIZE_DEFAULT:PageSize = 'A4';
    PAGE_ORIENTATION_DEFAULT:PageOrientation = 'landscape';
    CONTENT_ALIGN_DEFAULT:ContainerAlignment = ['left', 'top'];

    //// END SETTINGS ////
    _ay:ArchiyouApp; // all archiyou modules together
    _settings:DocSettings; // some essential settings like _settings.proxy
    _geom:Geom;
    _calc:any; // Cannot use reference to Calc here, because we don't allow references outside core
    
    _docs:Array<string> = []; // multiple documents names (see them as 'files')
    _activeDoc:string; // name of active document

    _pageSizeByDoc:{[key:string]:PageSize} = {};
    _pageOrientationByDoc:{[key:string]:PageOrientation} = {}; // default orientation
    _pagesByDoc:{[key:string]:Array<Page>} = {};
    _unitsByDoc:{[key:string]:DocUnits} = {};
    _pipelinesByDoc:{[key:string]:() => void} = {}; 

    _activePage:Page
    _activeContainer:AnyPageContainer

    _assetsCache:Record<string,any> = {}; // keep assets like images in cache to avoid reloading on every toData() call
    

    constructor(settings?:DocSettings, ay?:ArchiyouApp) // null is allowed
    {
        this.setArchiyou(ay)

        //// DEFAULTS
        this._setDefaults();

        //// SETTINGS AND CHECKS ////
        this._settings = settings; 
        if(!settings)
        {
            throw new Error(`Doc::Please supply settings with proxy URL as first parameter!`)
        }
        else {
            console.info(`Doc::constructor(settings, ay): Init Doc module with settings: "${JSON.stringify(settings)};`)
        }
        
    }

    hasDocs():boolean
    {
        return this._docs.length > 0
    }

    //// MAIN FUNCTIONS ////

    setArchiyou(ay:ArchiyouApp)
    {
        if(ay)
        {
            this._ay = ay;
            this._geom = ay?.geom;
            // TODO: calc
        }
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

    /** Execute pipeline for docs in worker scope
     *  @param include list of docs to include (if empty all)
     *  @param exclude list of docs to include (if empty exclude none)
     * 
     *  NOTE: this is pretty black magic. We should give more structure to Workers, execution and scopes.
    */
    executePipelines(include:Array<string> = [], exclude:Array<string> = [])
    {
        for (const [docName,pipelineFn] of Object.entries(this._pipelinesByDoc))
        {
            if (
                    typeof pipelineFn === 'function' && 
                    (include.length === 0 || include.includes(docName)) &&
                    (exclude.length === 0 || !exclude.includes(docName))
            )
            {
                try {
                    console.info(`==== EXECUTE DOC PIPELINE FUNCTION "${docName}" ====`)
                    this._ay.worker.funcs.executeFunc(pipelineFn)
                }
                catch(e){
                    console.error(`Doc:executePipelines(): Cannot execute a pipeline in worker scope: Error: "${e}"`);
                }
            }
        }
    }


    //// DOC API ////

    /** Make a new document with optionally a name */
    create(name?:string):Doc
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
        
        // Check if there is a doc made!
        this.checkAndMakeDefaultDoc();
        
        // replace name of current document in _docs and other byDoc attributes
        // TODO: improve by using id per document that stays the same?
        this._docs = this._docs.map( d => (d === this._activeDoc) ? n : d);

        this._pageSizeByDoc[n] = this._pageSizeByDoc[this._activeDoc];
        delete this._pageSizeByDoc[this._activeDoc];

        this._pageOrientationByDoc[n] = this._pageOrientationByDoc[this._activeDoc];
        delete this._pageOrientationByDoc[this._activeDoc];

        this._pagesByDoc[n] = this._pagesByDoc[this._activeDoc] || [];
        console.log('HIERO');
        this._pagesByDoc;
        console.log('DAN NIE')
        delete this._pagesByDoc[this._activeDoc];
        
        
        
        this._unitsByDoc[n] = this._unitsByDoc[this._activeDoc];
        delete this._unitsByDoc[this._activeDoc];

        this._activeDoc = n;

        return this;
    }

    /** Reset state of Doc instance */
    reset()
    {
        this._docs = [];
        this._pageSizeByDoc = {};
        this._pageOrientationByDoc = {};
        this._pagesByDoc = {};
        this._unitsByDoc = {};
        this._activeDoc = null;
    }

    /** Check if there is an active document, otherwise create a default one */
    checkAndMakeDefaultDoc()
    {
        if(!this._activeDoc)
        {
            this.create();
        }

        return this._activeDoc;
    }

    //// DOC API ////

    /** Set Unit for active document: 'mm','cm' or 'inch' */
    units(units:DocUnits):Doc
    {
        this.checkAndMakeDefaultDoc();
        if(!isDocUnits(units)){ throw new Error(`doc::pageSize: Invalid units. Use 'mm', 'cm' or 'inch'`);}
        this._unitsByDoc[this._activeDoc] = units;

        return this;
    }

    /** Set general page ISO size (A0,A4 etc) for current doc */
    pageSize(size:PageSize):Doc
    {
        this.checkAndMakeDefaultDoc();
        if(!isPageSize(size)){ throw new Error(`doc::pageSize: Invalid ISO page size. Use: A0, A4 etc!`);}
        this._pageSizeByDoc[this._activeDoc] = size;

        return this;
    }

    /** Set general page ISO size (A0,A4 etc) for current doc */
    pageOrientation(o:PageOrientation):Doc
    {
        this.checkAndMakeDefaultDoc();
        if(!isPageOrientation(o)){ throw new Error(`doc::pageSize: Invalid page orientation. Use 'landscape' or 'portrait'`);}
        this._pageOrientationByDoc[this._activeDoc] = o;

        return this;
    }

    /** Add a new page to the doc with given name */
    page(name:string):Doc
    {
        this.checkAndMakeDefaultDoc();
        if(!name){ throw new Error(`Doc::page: Please supply a name to a page!`)}
        if(this._pageExists(name)){ throw new Error(`Doc::page: Page name "${name}" is already taken. Please use unique names!`)}
        
        const newPage = new Page(this, this._activeDoc , name);
        this._pagesByDoc[this._activeDoc].push(newPage);
        this._setPageDefaults(newPage);
        this._activePage = newPage;

        return this;
    }

    /** Define script that is executed before active document is generated */
    pipeline(fn: () => any):Doc
    {
        this.checkAndMakeDefaultDoc();

        if(typeof fn !== 'function'){ throw new Error(`Doc::pipeline(): Please supply a function that is executed before generating active document!`); }

        this._pipelinesByDoc[this._activeDoc] = fn;

        return this;
    }

    //// PAGE API ////

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
    view(name:string, shapes?:ShapeCollection):Doc
    {
        if(typeof name !== 'string'){ throw new Error(`Doc::view: Please supply a name to the view!`);}
        this._checkPageIsActive();
        
        const newViewContainer = new View(name).on(this._activePage);
        this._activeContainer = newViewContainer;
        if(ShapeCollection.isShapeCollection(shapes))
        {
            this.shapes(shapes);
        }

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
     *  @param input name of Calc table
     * 
    */
    table(nameOrData:ContainerTableInput, options?:TableContainerOptions):Doc
    {
        if(!isContainerTableInput){ throw new Error(`Doc::table: Please enter a name of existing Calc Table or data rows in format [{ rows: [[x1,y1,z1],[x2,y2,z2]] columns: ['field1', 'field2', 'field3']}`); }
        if(typeof nameOrData === 'string' && !this._calc){ throw new Error(`Doc::table: Cannot get table data from Calc module. Calc is not initialized. Use calc.init()`); }
        if(typeof nameOrData === 'string' && !this._calc.tables().includes(nameOrData as string)){ { throw new Error(`Doc::table: Cannot get table data from Calc module. No such table: '${nameOrData}'. Available tables: ${this._calc.tables().join(',')}`); } }

        // either get data from Calc or use raw data input
        // in form: [{ col1: v1, col2: v2 }, ...]
        const dataRows = (typeof nameOrData === 'string') ?
                    this._calc.db.table(nameOrData as string).toDataRows()
                    : nameOrData as DataRows

        const newTableContainer = new TableContainer(dataRows, options).on(this._activePage);
        newTableContainer.name = (typeof nameOrData === 'string') ? nameOrData : this._generateContainerName(newTableContainer);

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
    position(x:number|PositionLike, y?:number):Doc
    {
        if(!this._activeContainer || !this._activePage)
        {
            throw new Error(`Doc::position(): Can not set position of active container. No active container and/or Page created!`);
        }

        if (isPositionLike(x)) // array with coords or alignments
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
     *   - ContainerAlignment: 'left', 'top'
     *   TODO: in world units from origin
     */
    pivot(x:number|PositionLike|string|Array<number|number>, y?:number):Doc
    {
        if(!this._activeContainer || !this._activePage)
        {
            throw new Error(`Doc::position(): Can not set position of active container. No active container and/or Page created!`);
        }
        
        const args = Array.from(arguments); // IMPORTANT: needs to be an array

        // if something like pivot('topleft') - backward compatable
        if (typeof x === 'string')
        {
            args[0] = x.match(/left|right|center/gi)?.at(0) || 'center';
            args[1] = x.match(/top|center|bottom/gi)?.at(0) || 'center';
        }
        // pivot([1,0]) - backward compatable
        else if(Array.isArray(x))
        {
            args[0] = x[0];
            args[1] = x[1];
        }
        // Some forgiveness with order of alignment strings (top,left versus left,top)
        else if(isContainerVAlignment(args[0]) && isContainerHAlignment(args[1]))
        {
            args.reverse();
        }

        if (isPositionLike(args))
        {
            this._activeContainer.pivot(args as PositionLike)    
        }
        else if (typeof x === 'number')
        {
            this._activeContainer.pivot([x,y||0]);
        }
        else {
            throw new Error(`Doc::pivot(): Invalid pivot. Try Alignment like ('topleft') or ('left', 'top') or coords relative ([0-1],[0-1]) relative to page content area origin`);
        }
        return this;
    }

    /** Turn on border on active container with optional styling */
    border(style?:DocPathStyle):Doc
    {
        if(!this._activeContainer){ throw new Error(`Doc::border(): Cannot set border on actie container! Make a container first!`)};
        (this._activeContainer as View).border(style);

        return this;
    }

    /** set contentAlign on active container */
    contentAlign(align:ContainerHAlignment|ContainerVAlignment|ContainerAlignment):Doc
    {
        if(!this._activeContainer){ throw new Error(`Doc::contentAlign(): Cannot set contentAlign. No active container. Please make one first!`)};
        let newContentAlign:ContainerAlignment = [...this.CONTENT_ALIGN_DEFAULT];
        if(isContainerHAlignment(align))
        {
            newContentAlign[0] = align;
        }
        else if(isContainerVAlignment(align))
        {
            newContentAlign[1] = align;
        }
        else if(isContainerAlignment(align))
        {
            newContentAlign = align;
        }

        this._activeContainer._contentAlign = newContentAlign;

        return this;
    }

    //// FORWARD TO SPECIFIC CONTAINER TYPES ////

    /** Bind ShapeCollection to View: either a real reference or the name of a ShapeCollection after running the doc pipeline */
    shapes(shapes:AnyShapeOrCollection|string):Doc
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

    async toData(only:Array<string>|any=[]):Promise<{[key:string]:DocData} | undefined>
    {
        // checks
        only = (Array.isArray(only)) ? only : [];
        const doFilter = only.length > 0;

        this.executePipelines();

        let docs = {};

        for(let i = 0; i < this._docs.length; i++)
        {
            const doc = this._docs[i];
            
            if(!doFilter || (doFilter && only.includes(doc)))
            {
                const docPagesData = [];
                for(let i = 0; i < this._pagesByDoc[doc].length; i++)
                {
                    docPagesData.push(await this._pagesByDoc[doc][i].toData(this._assetsCache));
                }

                docs[doc] = {
                    name: doc,
                    units: this._unitsByDoc[doc],
                    pages: docPagesData,
                    modelUnits: this._geom._units, // set model units to calculate scale later
                }
            }
        }

        return docs;
    }

    //// PRIVATE METHODS ////

    _units():DocUnits
    {
        return this._unitsByDoc[this._activeDoc];
    }

    //// UTILS ////

    /* count containers of a type on active page 
                and check how many are called table{x}, image{x} etc
                and iterate count */
    _generateContainerName(container:Container):string
    {
        const START_ITER_COUNT = 1;
        const type = container._type as ContainerType; // table, view etc
        const containersWithAutoName = this._activePage._containers.filter( c => c._type === container._type 
            && c.name.includes(type) && c.name !== type); // don't include simply 'table'

        if(containersWithAutoName.length === 0)
        {
            return `${type}${START_ITER_COUNT}`;
        }
        else {
            // look for highest iterator
            let max = START_ITER_COUNT;
            containersWithAutoName.forEach( c => 
            {
                const nums = c.name.match(/[\d]+/)
                if (nums)
                {
                    const count = parseInt(nums[0]);
                    if(count > max)
                    {
                        max = count; 
                    }
                }
            });
            return `${type}${(max+1).toString()}`; 
        }
    }

    _setPageDefaults(page:Page)
    {
        page._size = this._pageSizeByDoc[this._activeDoc];
        page._orientation = this._pageOrientationByDoc[this._activeDoc];

        return page
    }

    /** Check if page name exists in active document */
    _pageExists(name:string):boolean
    {
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
             // position like '10mm' is absolute to page (not to content)
             return [this._resolveValueWithUnitsString(n, page, side), 'page' as ContainerSizeRelativeTo]; // absolute units are relative to page (because padding might change and thus size of content area)
         }
         
         return null;
     }
     
     /** Percentage of page space, page minus page-padding (not entire padding) */
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





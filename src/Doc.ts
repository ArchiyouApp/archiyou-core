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

import { Geom, ModelUnits, ShapeCollection, DataRows, Container, ContainerType, Page, PageSize, AnyPageContainer, View, TableContainerOptions, GraphicContainer,
            ArchiyouApp, DocPathStyle, 
            ContainerAlignment, ContainerHAlignment, ContainerVAlignment, isContainerHAlignment, isContainerVAlignment, isContainerAlignment, AnyShapeOrCollection, 
            ContainerPositionLike, isContainerPositionLike, ContainerPositionRel, ContainerPositionAbs, 
            isContainerPositionCoordAbs} from './internal' // classes
import { isPageSize, PageSide, PageOrientation, isPageOrientation, PageData, ContainerSide, ContainerSizeRelativeTo,
            ScaleInput, Image, ImageOptions, Text, TextOptions, TextArea, TableContainer } from './internal' // types and type guards

import { DocSettings, DocUnits, DocUnitsWithPerc, PercentageString, ValueWithUnitsString, WidthHeightInput, 
    ContainerTableInput, DocData, isDocUnits, isPercentageString, isValueWithUnitsString, isAnyPageContainer,
        isWidthHeightInput, isContainerTableInput, DocGraphicType, DocGraphicInputBase, DocGraphicInputRect, DocGraphicInputCircle, 
                DocGraphicInputLine, DocGraphicInputOrthoLine, isContainerPositionCoordRel,
                ContainerBlock, TitleBlockInput, LabelBlockOptions
            } from './internal'

import { convertValueFromToUnit, isNumeric } from './internal' // utils

//// LOCAL INTEFACES ////

interface DocPipeline
{
    fn:() => any
    done: boolean
}


//// MAIN CLASS ////

export class Doc
{
    //// SETTINGS ////
    DOC_DEFAULT_NAME = 'doc'
    DOC_UNITS_DEFAULT:DocUnits = 'mm';
    PAGE_SIZE_DEFAULT:PageSize = 'A4';
    PAGE_ORIENTATION_DEFAULT:PageOrientation = 'landscape';
    CONTENT_ALIGN_DEFAULT:ContainerAlignment = ['left', 'top'];
    TEXT_SIZE_DEFAULT = '10mm';

    //// END SETTINGS ////
    _ay:ArchiyouApp; // all archiyou modules together
    _settings:DocSettings; // some essential settings like _settings.proxy
    _geom:Geom;
    _calc:any; // Cannot use reference to Calc here, because we don't allow references outside core
    
    _docs:Array<string> = []; // multiple documents names (see them as 'files')
    _activeDoc:string; // name of active document
    _lastBlock:ContainerBlock; // keep track of latest create block

    _pageSizeByDoc:{[key:string]:PageSize} = {};
    _pageOrientationByDoc:{[key:string]:PageOrientation} = {}; // default orientation
    _pagesByDoc:{[key:string]:Array<Page>} = {};
    _unitsByDoc:{[key:string]:DocUnits} = {};
    _pipelinesByDoc:{[key:string]:DocPipeline} = {};  // by doc name : { fn: fn, done:bool }, see DocPipeline

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
            this._calc = ay?.calc;
        }
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
        this._pipelinesByDoc = {};
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
        for (const [docName,pipelineData] of Object.entries(this._pipelinesByDoc))
        {
            const pipeline = pipelineData as DocPipeline
            const pipelineFn = pipeline.fn;
            const pipelineDone = pipeline.done;

            if (
                    !pipelineDone // avoid double execution
                    &&
                    typeof pipelineFn === 'function' && 
                    (include.length === 0 || include.includes(docName)) &&
                    (exclude.length === 0 || !exclude.includes(docName))
            )
            {
                try {
                    console.info(`==== EXECUTE DOC PIPELINE FUNCTION "${docName}" ====`)
                    this._ay.worker.funcs.executeFunc(pipelineFn)
                    pipeline.done = true; // set done
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
        this._pagesByDoc;
        delete this._pagesByDoc[this._activeDoc];
        
        
        
        this._unitsByDoc[n] = this._unitsByDoc[this._activeDoc];
        delete this._unitsByDoc[this._activeDoc];

        this._activeDoc = n;

        return this;
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

        this._pipelinesByDoc[this._activeDoc] = { fn: fn, done: false } as DocPipeline;

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
    view(name?:string, shapes?:ShapeCollection):Doc
    {
        if(typeof name !== 'string'){ throw new Error(`Doc::view: Please supply a name to the view!`);}
        this._checkPageIsActive();
        
        const newViewContainer = new View().on(this._activePage).setName(name);
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

        this._activeContainer = newTableContainer;
        
        return this;
    }


    //// GRAPHICAL ELEMENTS ////

    /** Draw rect graphic on current page
     *  @param ?input { size (when width=height), width, height, round }
     */
    rect(input?:number|string|DocGraphicInputRect, style?:DocPathStyle)
    {
        const RECT_DEFAULT_LINE_WIDTH = 3; // in pnt
        const RECT_DEFAULT_FILL_COLOR = null;
        const RECT_DEFAULT_STROKE_COLOR = 'black';

        if(typeof input === 'number' || typeof input === 'string'){ input = { width: input, height:input } as DocGraphicInputRect } // convert to DocGraphicInputRect
        else if(!(typeof input === 'object' && (input.width))){ throw new Error(`Doc::rect: Please supply at least a number (width=height) or options object { width, height, ?round, ?units, ?data }}`); }

        input.height = input.height ?? input.width; // make sure we got height or make equal sides

        // styling
        if(!style)
        {
            console.warn(`Doc::rect(input, style): You can use the argument style { lineWidth, strokeColor, fillColor } to style this rect!`)
            input.style = {};
        }
        else {
            // styling
            input.style = style;
            input.style.lineWidth = (input.style?.lineWidth) 
                                        ? convertValueFromToUnit(this._splitInputNumberUnits(input.style.lineWidth)[0], 
                                                                    this._splitInputNumberUnits(input.style.lineWidth)[1], 
                        'pnt')  : RECT_DEFAULT_LINE_WIDTH; // always in pnts
            input.style.strokeColor = input.style?.strokeColor ?? RECT_DEFAULT_STROKE_COLOR;
            input.style.fillColor = input.style?.fillColor ?? RECT_DEFAULT_FILL_COLOR;
        }

        const newGraphicContainer = new GraphicContainer('rect', input).on(this._activePage);
        this._activeContainer = newGraphicContainer;

        this.width(this._activePage._resolveValueWithUnitsStringToRel(this._splitInputNumberUnits(input.width).join(''), 'width'));
        this.height(this._activePage._resolveValueWithUnitsStringToRel(this._splitInputNumberUnits(input.height).join(''), 'height'));

        return this;
    }

    /** Draw circle graphic on current page
     *  @param input { size (=radius), radius }
     */
    circle(input?:number|string|DocGraphicInputCircle, style?:DocPathStyle):Doc
    {
        const CIRCLE_DEFAULT_LINE_WIDTH = 3; // in pnt
        const CIRCLE_DEFAULT_FILL_COLOR = null;
        const CIRCLE_DEFAULT_STROKE_COLOR = 'black'
        
        if(typeof input === 'number' || typeof input === 'string'){ input = { radius: input } as DocGraphicInputCircle }
        else if(!(typeof input === 'object' && (input.radius))){ throw new Error(`Doc::circle: Please supply at least a number (for radius) or options object { radius, ?units, ?data }}`); }

        // radius is converted into container width and height that will be used for rendering, but for later reference we set units
        input.radius =  this._splitInputNumberUnits(input.radius)[0];
        input.units = this._splitInputNumberUnits(input.radius)[1]; // will be default doc units (mm) is not given

        // styling
        if(!style){ console.warn(`Doc::circle(input, style): You can use the argument style { lineWidth, strokeColor, fillColor } to style this rect!`) }
        
        // styling
        input.style = style ?? {};
        input.style.lineWidth = (input.style?.lineWidth) 
                                    ? convertValueFromToUnit(this._splitInputNumberUnits(input.style.lineWidth)[0], this._splitInputNumberUnits(input.style.lineWidth)[1], 
                    'pnt')  : CIRCLE_DEFAULT_LINE_WIDTH; // always in pnts
        input.style.strokeColor = input.style?.strokeColor ?? CIRCLE_DEFAULT_STROKE_COLOR;
        input.style.fillColor = input.style?.fillColor ?? CIRCLE_DEFAULT_FILL_COLOR;
        

        const newGraphicContainer = new GraphicContainer('circle', input).on(this._activePage);
        this._activeContainer = newGraphicContainer;

        this.width(this._activePage._resolveValueWithUnitsStringToRel(this._splitInputNumberUnits(input.radius*2).join(''), 'width'));
        this.height(this._activePage._resolveValueWithUnitsStringToRel(this._splitInputNumberUnits(input.radius*2).join(''), 'height'));

        return this;
    }


    /** Draw ortho (horizontal|vertical) line graphic on current page
     *  @param input string (10mm), number (10, with default units, mm) or object with options
     *  @param thickness strokeWidth
     *  @param color 
     *     
     */
    _oline(type:'h'|'v', input?:string|number|DocGraphicInputOrthoLine, thickness?:number|string, color?:string):Doc
    {
        const STROKE_DEFAULT_WIDTH = 3; // in pnt
        const STROKE_DEFAULT_COLOR = 'black'

        if(!input || (typeof input === 'object' && !input.length))
        { 
            throw new Error(`Doc::hline: Please supply at least a number (length) or options object { length, ?units, ?data }}`); 
        }
        
        // verify input in object
        if (typeof input === 'object')
        {   
            // NOTE: _splitInputNumberUnits always return number and units (default if none given)
            input = { 
                        ...input, // take over attributes like thickness
                        length: this._splitInputNumberUnits(input.length)[0], 
                        units: this._splitInputNumberUnits(input.length)[1],
                    } as DocGraphicInputOrthoLine;
        }
        else {
            // or a raw number or string
            input = { length: this._splitInputNumberUnits(input)[0], units: this._splitInputNumberUnits(input)[1] } as DocGraphicInputOrthoLine;
        }

        // styling
        if(!input.style){ input.style = {}}

        // Style attributes can be in DocGraphicInputOrthoLine
        thickness = thickness ?? input?.thickness;
        color = color ?? input?.color;


        input.style.lineWidth = (thickness) 
            ? convertValueFromToUnit(
                    this._splitInputNumberUnits(thickness)[0], 
                    this._splitInputNumberUnits(thickness)[1], 
                    'pnt')  : STROKE_DEFAULT_WIDTH; // always in pnts
        input.style.strokeColor = color || STROKE_DEFAULT_COLOR;

        const newGraphicContainer = new GraphicContainer((type === 'h') ? 'hline' : 'vline', input)
                                        .on(this._activePage);

        this._activeContainer = newGraphicContainer;

        if(type === 'h')
        { 
            this.width(this._activePage._resolveValueWithUnitsStringToRel(input.length + input.units, 'width'));
            this.height(this._activePage._resolveValueWithUnitsStringToRel(input.style.lineWidth + 'pnt', 'height'));
        }
        else {
            this.height(this._activePage._resolveValueWithUnitsStringToRel(input.length + input.units, 'height'));
            this.width(this._activePage._resolveValueWithUnitsStringToRel(input.style.lineWidth + 'pnt', 'width'));
        }

        this.pivot([0,1]); // default pivot left top instead of Graphic default center ([0.5,0.5])
        

        return this;
    }

    hline(input?:string|number|DocGraphicInputOrthoLine, thickness?:number|string, color?:string):Doc
    {
        return this._oline('h', input, thickness, color);
    }

    vline(input?:string|number|DocGraphicInputOrthoLine, thickness?:number|string, color?:string):Doc
    {
        return this._oline('v', input, thickness, color);
    }

    // TODO: more graphics: ellipse, triangle, poly etc
    
    //// BLOCKS OF CONTAINERS ////

    /** Place default title block
     *  @param data:TitleBlockInput
     */
    titleblock(data?:TitleBlockInput)
    {
        const TITLE_BLOCK_NUM = 60;
        const TITLEBLOCK_WIDTH = `${TITLE_BLOCK_NUM}mm`;
        const BLOCK_MARGIN = this._activePage._resolveValueWithUnitsStringToRel('1mm', 'height'); 

        const DEFAULT_SETTINGS = {
            title : 'Untitled',
            designer : 'Unknown',
            logoUrl: 'https://cms.shopxyz.nl/uploads/archiyou_logo_header_bgwhite_d35135524b.png',
            designLicense: 'CC BY-NC',
            manualLicense: 'CC BY-NC',
        }

        if(!data){
            throw new Error('Doc::titleblock: Please provide information { title, design, logoUrl, designLicense, manualLicense }');
        }

        const settings = { ...DEFAULT_SETTINGS, ...data } as TitleBlockInput;

        // logo
        this.image(settings.logoUrl)
            .pivot(1,0) // right bottom
            .position(1,0) // right bottom
            .width('30mm')
            .height('8mm')

        // Version info left of image
        this.text(this._getVersionSummary(), { size: '2mm'})
            .width(`${TITLE_BLOCK_NUM/2}mm`)
            .height('3mm')
            .pivot(1,0)
            .position([`${297-30}mm`, '6mm'] as ContainerPositionAbs); // bit hacky

        // Metric labelblock
        this.labelblock('metrics', this._getMetricSummary(), { y: '11mm', width: TITLEBLOCK_WIDTH, numTextLines: 2 }); // TODO: dynamic param readout
        const metricsBlock = this.lastBlock();
        // Param labelblock
        this.labelblock('params', this._getParamSummary(), { y: metricsBlock.bbox[3] + BLOCK_MARGIN, width: TITLEBLOCK_WIDTH, numTextLines: 2 }); // TODO: dynamic param readout
        const paramsBlock = this.lastBlock();
        // Info labelblock
        this.labelblock(
                        ['designer', 'design license', 'manual license'], 
                        [ settings.designer, settings.designLicense, settings.manualLicense], 
                        { y: paramsBlock.bbox[3] + BLOCK_MARGIN, textSize : '3.5mm', width: TITLEBLOCK_WIDTH, numTextLines: 1 });
        const designBlock =  this.lastBlock();
        
        this.hline({ thickness: '2pnt', color: 'black', length: TITLEBLOCK_WIDTH})
            .position(1, designBlock.bbox[3] + BLOCK_MARGIN*2)
            .pivot(1,0.5)
        // header
        this.text( data?.title || DEFAULT_SETTINGS.title, { size: '8mm', bold: true })
            .pivot(1,0)
            .width(TITLEBLOCK_WIDTH)
            .position(1, designBlock.bbox[3] + BLOCK_MARGIN*2);

        

        return this;
    }

    _getParamSummary():string
    {
        const PARAM_SPLIT_CHARS = ['_','-', ' ']; // at which chars to split the param name
        const PARAM_NAME_MAXCHAR = 4;
        const PARAM_IS_VALUE_CHAR = ':'
        const PARAM_SEPERATOR_CHAR = ' '

        console.log('==== TEST PARAM SUMMARY ====');
        console.log(this?._ay);
        console.log(this?._ay?.worker);
        console.log(this?._ay?.worker?.lastExecutionRequest);
        console.log(JSON.stringify(this?._ay?.worker?.lastExecutionRequest?.params));

        let params = this?._ay?.worker?.lastExecutionRequest?.script?.params // in editor
                            || this?._ay?.worker?.lastExecutionRequest?.params // in node worker

        if (typeof params === 'object' ){ params = Object.values(params);}
        
        if (!params)
        {
            return 'no parameters'
        }
        
        return params.map(p => {
            const paramName = p.label || p.name;
            let paramSummaryName;
            if(paramName.length <= PARAM_NAME_MAXCHAR)
            {
                paramSummaryName = paramName;
            }
            // Shorten long name of param like BEAM_WIDTH = BW, SEAT-HEIGHT => SH
            else {
                const paramNameParts = this._splitStringRecurse([p.name], PARAM_SPLIT_CHARS);
                paramSummaryName = paramNameParts.slice(0,PARAM_NAME_MAXCHAR).reduce((agg,cur) => agg += cur[0].toUpperCase(), '');
            }
            
            
            return `${paramSummaryName}${PARAM_IS_VALUE_CHAR}${this._formatMetricParamValue(p.value)}`;
        }).join(PARAM_SEPERATOR_CHAR)
           
    }

    _getMetricSummary():string
    {
        const METRIC_SPLIT_CHARS = ['_','-', ' ']; // at which chars to split the param name
        const METRIC_NAME_MAXCHAR = 4;
        const METRIC_IS_VALUE_CHAR = ':'
        const METRIC_SEPERATOR_CHAR = ' '

        const metrics = Object.values(this?._ay?.calc?.metrics()); // TODO: publishScript too?
        if (!metrics)
        {
            return 'no metrics'
        }
        
        return metrics.map(m => {
            const metricName = m.label || m.name;
            let metricSummaryName;
            if(metricName.length <= METRIC_NAME_MAXCHAR)
            {
                metricSummaryName = metricName;
            }
            else {
                const metricNameParts = this._splitStringRecurse([m.label||m.name], METRIC_SPLIT_CHARS);
                metricSummaryName = metricNameParts.slice(0,METRIC_NAME_MAXCHAR).reduce((agg,cur) => agg += cur[0].toUpperCase(), '');
            }
            return `${metricSummaryName}${METRIC_IS_VALUE_CHAR}${this._formatMetricParamValue(m.data as any)} ${m?.options?.unit ?? ''}`;
        }).join(METRIC_SEPERATOR_CHAR)
    }

    _formatMetricParamValue(v:string|number):string
    {
        const MAX_LENGTH = 5;
        const TRANSFORM_REPLACE_VALUES = {
            true : 'yes',
            false : 'no',
            mm : '', // remove mm
        }

        let s = (typeof v !== 'string') ? v.toString() : v;
        Object.keys(TRANSFORM_REPLACE_VALUES)
            .forEach((r,i) => {
                if(s.includes(r))
                {
                    s = s.replace(r, TRANSFORM_REPLACE_VALUES[r]);
                }
            })
        
        return s.slice(0, MAX_LENGTH)
    }

    /** Get version in different contexts
     *  In editor we use ScriptVersion->PublishScript instances
     *  In compute worker PublishScript
     */
    _getVersion():string
    {
        const version = this?._ay?.worker?.lastExecutionRequest?.script?.published_as?.version // editor app
            || this?._ay?.worker?.lastExecutionRequest?.version // compute worker context:  OcciCadScriptRequest
            || '0'

        return `v${version}`
    }

    /** Get version string like 'v1.0 at 10-20-2025 */
    _getVersionSummary():string
    {
        return `${this._getVersion()} at ${this?._ay?.worker?.lastExecutionRequest?.createdAtString || '' }`;
    }

    _splitStringRecurse(strings:Array<string>, splitChars:Array<string>):Array<string>
    {
        if(Array.isArray(splitChars) && splitChars.length > 0)
        {
            let newStrings = [];
            strings.forEach(s => {
                    newStrings = newStrings.concat(s.split(splitChars[0]))
                }
            ); // remain flat
            if (splitChars.length > 1)
            {
                newStrings = this._splitStringRecurse(newStrings, splitChars.slice(1))
            }

            return newStrings
        }
    }

    /** Create a block with one or more label and one or more texts
     *  The first label/text pair fills half of the container
     *  Used mostly for titleblock
     */
    labelblock(labels:string|Array<string>, texts:string|Array<string>, options:LabelBlockOptions = {}):this
    {
        const MAX_ITEMS = 3; // max label/text pairs
        const LABELBLOCK_MARGIN_BETWEEN = '1mm'
        const LABELBLOCK_DEFAULTS = {
            x: 1, // right of page
            y: 0,
            width: '80mm',
            pivot: [1,0],
            textSize: '2.5mm',
            secondaryTextSize: '2mm',
            labelSize: '1.5mm',
            numTextLines: 1,
            margin: '1mm',
            line: true,
        } as LabelBlockOptions

        // Take care of multiple text/label, but no more than MAX_ITEMS
        labels = (typeof labels === 'string') ? [labels] : (Array.isArray(labels)) ? labels.slice(0,MAX_ITEMS) : null;
        texts = (typeof texts === 'string') ? [texts] : (Array.isArray(texts)) ? texts.slice(0,MAX_ITEMS) : null;

        if(!labels || !texts )
        {
            throw new Error(`Doc::labelblock(): Please supply at least one label(s) and text(s). And optional: { x, y, width, pivot, textSize, labelSize, numTextLines, margin, line }`)
        }

        options = { ...LABELBLOCK_DEFAULTS, ...options }

        // prepare all info needed to start drawing
        const blockWidthRel = this._activePage._resolveValueWithUnitsStringToRel(options.width, 'width');
        const blockMarginRel = this._activePage._resolveValueWithUnitsStringToRel(options.margin, 'height');
        const blockMarginBetweenRel = this._activePage._resolveValueWithUnitsStringToRel(LABELBLOCK_MARGIN_BETWEEN, 'height');
        
        const blockTextSizePnt = this.parseInputNumberUnitsConvertTo(options.textSize, 'pnt'); 
        const blockSecondaryTextSizePnt = this.parseInputNumberUnitsConvertTo(options.secondaryTextSize, 'pnt'); 
        const blockLabelSizePnt = this.parseInputNumberUnitsConvertTo(options.labelSize, 'pnt'); 
        const blockTextSizeRel = this._activePage._resolveValueWithUnitsStringToRel(blockTextSizePnt + 'pnt', 'height');
        const blockLabelSizeRel = this._activePage._resolveValueWithUnitsStringToRel(blockLabelSizePnt + 'pnt', 'height');

        const blockHeightRel = blockTextSizeRel*(options?.numTextLines ?? 1) + blockLabelSizeRel + 2*blockMarginRel + blockMarginBetweenRel;

        const xRel =  this._activePage._resolveValueWithUnitsStringToRel(options.x, 'width');
        const yRel = this._activePage._resolveValueWithUnitsStringToRel(options.y, 'height');

        // We always draw locally from left,bottom: shift positions based on pivot
        const blockXRel = xRel + (1-options.pivot[0])*blockWidthRel;
        const blockYRel = yRel - options.pivot[1]*blockHeightRel;

        this.hline({ thickness: '1pnt', color: 'black', length: blockWidthRel })
            .pivot(1,1)    
            .position(blockXRel, blockYRel)
        
        labels.forEach((label,i,arr) => 
        {
            // label
            this.text(label, { size: blockLabelSizePnt})
            .width(blockWidthRel)
            .pivot((i==0) ? 1 : (arr.length > 1) ? 0.5*i/(arr.length-1) : 0.5,0)
            .position(blockXRel, blockYRel+blockMarginRel+blockTextSizeRel*options?.numTextLines*1.1+blockMarginBetweenRel); // NOTE: small factor to correct for bigger height

            // main text
            this.text(texts[i] || '', { size: (i === 0) ? blockTextSizePnt : blockSecondaryTextSizePnt }) // Secondary texts are smaller
                .width(blockWidthRel)
                .pivot((i==0) ? 1 : (arr.length > 1) ? 0.5*i/(arr.length-1) : 0.5,0)
                .position(blockXRel, blockYRel+blockMarginRel+((options?.numTextLines-1)*blockTextSizeRel))
        })
        
        this._lastBlock = {
            x: blockXRel,
            y: blockYRel,
            width: blockWidthRel,
            height: blockHeightRel,
            pivot: options.pivot,
            bbox: [
                blockXRel -  blockWidthRel,
                blockXRel,
                blockYRel,
                blockYRel + blockHeightRel
            ]
        }

        return this // Return doc module to not break chaining. Use doc.lastBlock() to get block info
    }

    /** Get last created ContainerBlock */
    lastBlock():ContainerBlock
    {
        return this._lastBlock
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
     *   @param x
     *     - if 0 <= x <= 1 relative to page content area 0.5 center)
     *     - if > 1 in default document units (mostly mm)
     *     - Alignment: topleft, bottom(center)
     *     - absolute with units ('10mm')
     *     - or array [x,y]
     *   @param y see x, but without array
     */
    position(x:number|ContainerPositionLike, y?:number|string):Doc
    {
        if(!this._activeContainer)
        {
            throw new Error(`Doc::position(): Can not set position of active container. No active container`);
        }
        if(!this._activePage)
        {
            throw new Error(`Doc::position(): Can not set position of active container. No active page. Create at least one page!`);
        }

        // two parameters, combine into ContainerPositionRel array
        if(typeof y === 'number' || typeof y === 'string')
        {
            this._activeContainer.position([x,y] as ContainerPositionLike);
        }
        else if(isContainerPositionLike(x))
        {
            this._activeContainer.position(x as ContainerPositionLike)    
        }
        else {
            throw new Error(`Doc::position(): Invalid input: "[${x},${y}]". Use alignment: 'topright', relative coords [0.5,1], or ['10mm',0]`)
        }
        
        return this;
    }

     /** Set Pivot of active Container
     *   - relative to page content area (0.5,0.5 => center)
     *   - ContainerAlignment: 'left', 'top'
     *   
     *      NOTE: We won't allow offsets with units ('10mm')
     */
    pivot(x:number|ContainerPositionLike|string|Array<number|number>, y?:number):Doc
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

        if (isContainerPositionLike(args))
        {
            this._activeContainer.pivot(args as ContainerPositionLike)    
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
        if(!this._activeContainer){ throw new Error(`Doc::border(): Cannot set border on active container! Make a container first!`)};
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
    shapes(shapes:AnyShapeOrCollection|string, all:boolean=false):Doc
    {
        if(!this._activeContainer){ throw new Error(`Doc::shapes(): Cannot add Shapes because no View Container is active! Make a View first with view("myView")!`)};
        if(this._activeContainer._type !== 'view'){ { throw new Error(`Doc::shapes(): Cannot add Shapes because no active container is a not a View. Check the order of your statements!`)};}
        (this._activeContainer as View).shapes(shapes, all);

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

    /** Return names of docs present */
    docs():Array<string>
    {
        return this._docs;
    }

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
    _generateContainerName(containerOrName:string|Container):string
    {
        const START_ITER_COUNT = 0;

        const reqName = (isAnyPageContainer(containerOrName)) ? (containerOrName.name || containerOrName._type) : (typeof containerOrName === 'string') ? containerOrName as string : null;
        
        if (!reqName){ throw new Error(`Doc::_generateContainerName. Please supply a string or Container instance to get a name! Got: ${containerOrName}`); }

        const containersWithSameName = this._activePage._containers.filter( c => c.name === reqName || c.name.match(new RegExp(`${reqName}[\\d]+$`))); // match exactly the same or name{NUM}

        if(containersWithSameName.length === 0)
        {
            return reqName;
        }
        else {
            // look for highest iterator
            let max = START_ITER_COUNT;
            containersWithSameName.forEach( c => 
            {
                const nums = c.name.match(/[\d]+$/)
                if (nums)
                {
                    const count = parseInt(nums[0]);
                    if(count > max)
                    {
                        max = count; 
                    }   
                }
            });
            const reqNameClean = reqName.replace(/[\d]+$/, '')
            return `${reqNameClean}${(max+1).toString()}`; 
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
             // IMPORTANT: Even absolute coordinates (10mm) are relative to page content area - not page!
             // TODO: Do we need this to be more implicit for the user?
             return [this._resolveValueWithUnitsStringToRel(n, page, side), 'page-content-area' as ContainerSizeRelativeTo]; // absolute units are relative to page (because padding might change and thus size of content area)
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
     _resolveValueWithUnitsStringToRel(s:ValueWithUnitsString, page:Page, side:PageSide):number 
     {
        // if given number, fallback to page units (default: mm)
        if(typeof s === 'number')
        { 
            if(isContainerPositionCoordRel(s))
            {
                s = (s * 100) + '%' // relative [0-1], convert to 100%
            }
            else {
                s = s + this._units();
            }
        }
        else if(typeof s !== 'string')
        {
            console.error(`Doc::_resolveValueWithUnitsStringToRel(): Invalid input given: ${s}`);   
            return null;
        }

        // if already relative (40%)
        const percMatch = s.match(/(\-*[\d\.]+)(%)$/);

        if(percMatch)
        {
            const relNum = parseFloat(percMatch[1])/100; // back from 10% to 0.1
            return relNum
        }
        
        // if any absolute coordinate and unit
        const m = s.match(/(\-*[\d\.]+)(mm|cm|inch|\"|pnt)$/);
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
                console.warn(`Container::_resolveValueWithUnitsStringToRel: You supplied a value ('${s}') that is outside the page size! Check if this is correct!`)
            }

            return relativeValue;
 
         }
         return null; 
     }

     /** Split given string like 10mm to number and unit and do some checking 
      *     NOTE: We handle relative numbers ([0-1]) here too, in that case 
     */
     _splitInputNumberUnits(s:string|number):[number,DocUnitsWithPerc]|null
     {
        if(typeof s === 'number')
        {
            if(isContainerPositionCoordRel(s))
            {
                return [s*100, '%']; // convert 0.1 => 10%
            }
            else
            {
                // absolute numbers but without unit, we use the default doc unit (mm mostly)
                return [s, this._units()];
            }
        } 
        if(typeof s !== 'string') return null;
        
        let result:[number,DocUnitsWithPerc];

        ['mm', 'cm', 'inch', 'pnt','%'].every( unit => {
            if(s.includes(unit))
            {
                result = [parseFloat(s.replace('unit', '')), unit as DocUnitsWithPerc]
                return false;
            }
            return true;
        })

        if (result){ return result; }
        
        // other attempt
        if (!result && isNumeric(s))
        {
            return [parseFloat(s), this._units()]; // return default doc units
        }

        console.warn(`Doc::_splitInputNumberUnits(${s}): Could not split input to number and units!`)
        return null;        
     }


     parseInputNumberUnitsConvertTo(n:string|number, unit:DocUnitsWithPerc):number|null
     {
        const num = this._splitInputNumberUnits(n)[0];
        const inUnit = this._splitInputNumberUnits(n)[1];

        return convertValueFromToUnit(num, inUnit, unit)
            
     }
}





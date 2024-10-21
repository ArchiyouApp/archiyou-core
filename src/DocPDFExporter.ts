/**
 *  DocPdfExporter
 * 
 *  Takes data from Doc module and exports the documents to PDF using JsPDF
 * 
 *  IMPORTANT:
 *      Loading is dynamic. If your want to use PDF exporting add the following dependencies:
 *      - jspdf
 *      - svg2pdf.js
 *      - jspdf-autotable    
 *  
 *  IMPORTANT NOTES:  
 *      - Doc module coordinate system origin is bottom-left (This is in line with PDF itself!)
 *      - JsPDF origin of coordinate system is at top-left
 * 
 *  INFO:
 *      - see example loading of fonts for jspdf: https://raw.githack.com/MrRio/jsPDF/master/docs/index.html
 *          
 */

import { PageSize } from './internal'
import { PageData, ContainerData, Page } from './internal'
import { DocViewSVGManager } from './DocViewSVGManager'

import { arrayBufferToBase64, convertValueFromToUnit, mmToPoints, pointsToMm } from './utils'

import { Container, DataRows, DataRowsColumnValue, DocData, DocPathStyle, SVGtoPDFtransform, TableContainerOptions } from './internal' // Doc
import { PDFLinePath } from './internal' // types

import { jsPDF, GState } from 'jspdf'
import 'svg2pdf.js' // TODO: load dynamically?
import autoTable from 'jspdf-autotable' // TODO: load dynamically?

import { OutfitByteString } from '../assets/fonts/Outfit'
import { OutfitSemiBoldByteString } from '../assets/fonts/OutfitSemiBold'


declare var WorkerGlobalScope: any; // avoid TS errors with possible unknown variable

export class DocPDFExporter 
{
    //// SETTINGS ////

    DEBUG = false; // test raw PDFkit output
    
    TEXT_ALIGN_DEFAULT = 'left';
    TEXT_BASELINE_DEFAULT = 'top';
    TEXT_FONT_DEFAULT = 'Outfit';
    
    TABLE_FONTSIZE_DEFAULT = 8; // in pnts
    TABLE_BORDER_THICKNESS_MM = 0.1; // in mm
    TABLE_PADDING_MM = 1;


    //// END SETTINGS

    inDocs:Record<string, DocData> = {}; // incoming DocData by name
    
    docs:Record<string,jsPDF> = {}; // Holds internal jspdf documents
    blobs:Record<string,Blob> = {}; // Documents as blobs
    
    activeDoc:DocData 
    activePage:PageData

    activePDFDoc:jsPDF // NOTE: active page is not needed, part of activePDFDoc in JsPDF

    _jsPDF:any // the module
    _jsPDFDoc:any // doc constructor - TODO: TS typing fix
    _hasJsPDF:boolean = false;

    /** Make DocPDFExporter instance either empty or with data and onDone function */
    constructor(data?:DocData|Record<string, DocData>, onDone?:(blobs:Record<string,Blob>) => any)
    {
        if(!data)
        { 
            console.warn(`DocPDFExporter:constructor(). No data given yet. Use myDocPDFExporter.export(data,onDone) in the next step to start export!`)
        }
        else if(typeof onDone !== 'function')
        { 
            console.warn(`DocPDFExporter:constructor(). No onDone function given! If you want to do something with the result supply one! Returns the blobs by doc name!`) 
        }
        else {
            this.export(data)
                .catch((e) => console.error(e))
                .then((blobs) => 
                    {
                        if(typeof onDone === 'function' && blobs)
                        {
                            onDone(blobs);
                        }
                    })
        }
    }

    reset()
    {
        this.inDocs = {};
        this.docs = {};
        this.activeDoc = undefined;
        this.activePage = undefined;
        this.activePDFDoc = undefined;
    }

    async export(data:DocData|Record<string,DocData>): Promise<Record<string, Blob>>
    {
        this.reset();
        try {  
            await this.loadJsPDF(); 
        }
        catch(e)
        { 
            this.handleFailedImport(e);
            return new Promise((resolve) => resolve(null))
        }
        this.handleSuccesImport();
   
        if(!this.DEBUG)
        {
            const blobs = await this.run(data);
            if (this.isBrowser()) this._saveBlobToBrowserFile(); // Start file save in browser
            return blobs;
        }
        else {
            this.generateTestDoc();
        }
    }

    /** Load PdfKit as module dynamically */
    async loadJsPDF():Promise<DocPDFExporter> 
    {
        // If jsPDF already loaded
        if(this.hasJsPDF())
        {
            return new Promise((resolve) => resolve(this._jsPDF))
        }
        else {
            // Dynamically load JsPDF
            const isBrowser = this.isBrowser();
            const isWorker = this.isWorker();

            if(isWorker || isBrowser)
            {
                this._jsPDF = await import('jspdf'); // this is the module entry
                this._jsPDFDoc = this._jsPDF.jsPDF; // this is the make document function
            }
            else {
                const nodejsPDFPath = 'jspdf'; // To keep TS warnings out
                this._jsPDF = await import(nodejsPDFPath)
                this._jsPDFDoc = this._jsPDF.jsPDF; 
            }

            // Load custom fonts
            const addCustomFonts = function()
            {
                this.addFileToVFS('Outfit.ttf', OutfitByteString);
                this.addFileToVFS('OutfitBold.ttf', OutfitSemiBoldByteString); // we use semi bold as bold!
                this.addFont('Outfit.ttf', 'Outfit', 'normal');
                this.addFont('OutfitBold.ttf', 'Outfit', 'bold');
            }

            this._jsPDFDoc.API.events.push(['addFonts', addCustomFonts]);

            return this
        }

        
    }

    handleFailedImport(e)
    {
        console.error(`DocPDFExporter:loadPDFKit: Could not load module 'pdfkit'. ERROR: "${e}". Make sure it is added to the project. PdfExporter will not work!`)
    }

    handleSuccesImport()
    {
        console.info(`DocPDFExporter:loadPDFKit: PDFKit loaded!`)
        this._hasJsPDF = true;
    }

    hasJsPDF():boolean
    {
        return this._hasJsPDF;
    }

    async run(data:DocData|Record<string,DocData>) : Promise<Record<string,Blob>>
    {
        return await this.parse(data);
    }

    /** Parse raw Doc data, either DocData or a set of documents in Record<string, DocData> */
    async parse(data?:DocData|Record<string, DocData>): Promise<Record<string,Blob>>
    {
        if(!this.hasJsPDF())
        { 
            console.error(`DocPDFExporter::parse(): Cannot generate PDF. Please add 'jspdf' to your project dependencies!`)
            return new Promise((resolve) => resolve(null))
        }
        else 
        {
            // set incoming inDocs by name
            if (data?.name)
            {
                this.inDocs[(data as DocData).name] = data as DocData;            
            } 
            else 
            {
                this.inDocs = data as Record<string,DocData>;
            }

            // parse docs sequentially
            for( const docData of Object.values(this.inDocs))
            {
                await this._parseDoc(docData);
            }
            // JSPDF TODO
            return this.blobs; // { docname: blob }
        }
    }

    /** Make a simple PDF test document directly with jspdf */
    async generateTestDoc()
    {
        const doc = new this._jsPDFDoc() as jsPDF; // TODO: Fix TS typing
        doc.setFontSize(25).text('Test text', 0, 0);
        // NOTE: TS is weird with function jsPDF.output()
        this.blobs['test'] = doc.output('blob' as any, { filename: `test.pdf` } ) as any as Blob; // see: https://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html#output
        this._saveBlobToBrowserFile('test'); // output to browser (if present)
    }

    /** Save the given doc (or the first) to file  */
    async _saveBlobToBrowserFile(docName?:string)
    {
        docName = docName || Object.keys(this.docs)[0];
        const blob = this.blobs[docName];

        if(this.isBrowser() || this.isWorker())
        {
            const fileHandle = await this._getNewFileHandle("PDF", "application/pdf", "pdf");
            this._writeFile(fileHandle, blob).then(() => 
            {
                console.info("Saved PDF to " + fileHandle.name);
            });
        }

    }

    /** Parse Doc data into PDFDocument */
    async _parseDoc(d:DocData)
    {
        const newPDFDoc = new this._jsPDFDoc({ 
                                                orientation: 'landscape', 
                                                unit: 'pt',  // we use points as unit for the pdfs
                                                format: 'a4',  // TODO: make dynamic
                                                putOnlyUsedFonts: true,  }); // see: https://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html
        this.docs[d.name] = newPDFDoc;
        this.activePDFDoc = newPDFDoc;
        this.activeDoc = d;

        this.setDocDefaults(newPDFDoc);

        // NOTE: cannot use forEach because it is not sequentially!
        for (const p of this.activeDoc.pages)
        {
            await this._makePage(p)
        }
        this._endActiveDoc();

    }

    /** Set defaults of a JsPDF document */
    setDocDefaults(d:jsPDF)
    {
        d.setFont(this.TEXT_FONT_DEFAULT, 'normal');
        
        console.info(`Doc::setDocDefaults(): Available fonts: ${d.getFontList()}`);
    }
    
    /** Wait until the active Doc stream is finished and place resulting Blob inside cache for later export */
    _endActiveDoc():Blob
    {
        const doc = this.activeDoc; // Data
        const pdfDoc = this.activePDFDoc; // JsPDF Doc instance
        this.blobs[doc.name] = pdfDoc.output('blob' as any, { filename: `test.pdf` } ) as any as Blob; // NOTE: TS hack
        return this.blobs[doc.name];
    }

    /** Get first Blob */
    getBlob():Blob|null
    {
        return (Object.values(this.blobs).length) ? Object.values(this.blobs)[0] : null;
    }

    async _makePage(p:PageData):Promise<any>
    {
        // JsPDF Page docs: https://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html#addPage
        if(this.activePage) // first page is already made: so skip making a new one if activePage is not yet set
        {
            this.activePDFDoc.addPage(this.pageSizeToLowercase(p.size), p.orientation); // TODO: jsPDF uses 'a4', Archiyou A4 - need to convert?
        }
        this.activePage = p;
        
        // place containers of types like text, textarea, image, view (svg), table 
        for (const c of this.activePage.containers) // NOTE: cannot use forEach: not sequentially!
        {
            await this._placeContainer(c, p);
        }
    }

    async _placeContainer(c:ContainerData, p:PageData)
    {
        console.info(`DocPDFExporter::_placeContainer: Placing container "${c.name}" of type "${c.type}" on page "${p.name}"`)

        this._placeContainerBasics(c,p);

        switch(c.type)
        {
            case 'text':
                this._placeText(c, p)
                break;
            case 'textarea':
                this._placeText(c, p); // TextArea is the same in PDFKit
                break;
            case 'view':
                this._placeViewSVG(c, p)
                break;
            case 'image':
                await this._placeImage(c, p)
                break;
            case 'table':
                await this._placeTable(c, p);
                break;
            case 'graphic':
                this._placeGraphic(c, p);
                break;

            default:
                console.error(`DocPDFExporter::_placeContainer(): Unknown container type: "${c.type}"`);
            
        }
    }

    /** Any elements for all Containers like border */
    _placeContainerBasics(c:ContainerData, p:PageData)
    {
        /*
            NOTES:
                - TODO: container width/height based on content

        */

        const DEFAULT_BORDER_STYLE = {  strokeColor: '#999999', lineWidth: 0.5 } as DocPathStyle

        // Border rectangle border (mostly for debug for now)
        if(c.border)
        {
            this._setPathStyle({ ...DEFAULT_BORDER_STYLE, ...(c.borderStyle || {}) });
            const x = this.coordRelWidthToPoints(c.position[0] - ((c?.width) ? c.width*c.pivot[0] : 0), p);
            const y = this.coordRelHeightToPoints(c.position[1] + ((c?.height) ? c.height*c.pivot[1] : 0), p);
            const w = this.relWidthToPoints(c.width, p);
            const h = this.relHeightToPoints(c.height, p);
            this.activePDFDoc.rect(x,y,w,h, 'S');
        }
    }

    //// TEXT ////
    
    /** Place text on activePDFDoc and active page */
    _placeText(t:ContainerData, p:PageData)
    {
        /* NOTE:
            - If container width is not set we don't have a way to estimate text content yet! (unlike in HTML renderer)
         */

        this.activePDFDoc.setFontSize(t?.content?.settings?.size); // in points already

        const {x ,y } = this.containerToPDFPositionInPnts(t, p);

        // Make text bold
        if(t.content.settings.bold)
        {
            this.activePDFDoc.setFont(this.TEXT_FONT_DEFAULT, 'bold')
        }
        else {
            this.activePDFDoc.setFont(this.TEXT_FONT_DEFAULT, 'normal'); // reset
        }

        this.activePDFDoc.text(
            t?.content?.data, 
            x, // from relative page coords to absolute PDF points
            y, 
            { // jsPDF text options
                ...this._setTextOptions(t, p)
            }
        );
    }

    /** Parse TextOptions to PDF text options, set basic styling directly on activePDFDoc and return parameters for specific creation function */
    _setTextOptions(t:ContainerData, p:PageData):Record<string,any>
    {
        // Set basics directly on document
        this.activePDFDoc.setTextColor(t?.content?.settings?.color);
        this.activePDFDoc.setFontSize(t?.content?.settings?.size); // see: https://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html#setFontSize

        // Text creation params in jsPDF: https://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html#text
        const createTextOptions = {
            maxWidth: this.relWidthToPoints(t.width, p), // from Container
            align: t?.content?.settings?.align || this.TEXT_ALIGN_DEFAULT, // left is default
            baseline: t?.content?.settings?.baseline ?? this.TEXT_BASELINE_DEFAULT,
            angle: t?.content?.settings?.angle || 0,
        };

        return this.removeEmptyValueKeysObj(createTextOptions); 
    }

    //// IMAGE ////

    /** First load the SVG or Bitmap image and then supply its buffer to pdfkit */
    async _placeImage(img:ContainerData, p:PageData)
    {
        // see docs: http://pdfkit.org/docs/images.html
        /* 
            NOTES:
            - jsPDF places images with [left,top] as pivot and y-axis in [left,top]    
            - container width and height are relative to page width/height (if widthRelativeTo = 'page')
            - heightAbs/widthAbs are in docUnits
            - We use a reference to PageData here to avoid this.activePage while working with async methods

            TODO: Implement options.align[horizontal,vertical] - now default [left,top]
            IMPORTANT: Transparency in PNG's render as gray! Use white backgrounds
            
        */

        if(img?.content?.data && img?.content?.source)
        {
            const imgExt = this._getImageExt(img.content.source);    
            const { x, y } = this.containerToPDFPositionInPnts(img, p);

            // if SVG image
            if (imgExt === 'svg')
            {
                let svgRootElem;
                if (this.isBrowser())
                {
                    svgRootElem = new DOMParser().parseFromString(img.content.data, 'image/svg+xml').documentElement; 
                }
                else {
                    // TODO: node js solution replacing DOMParser
                }

                if(!svgRootElem)
                {
                    console.error(`DocPdfExporter: Can not place SVG image ${img.name}`);
                    return;
                }

                await this.activePDFDoc.svg(
                    svgRootElem as any, // TS: TXmlNode -> Element
                    {
                        // options
                        x,
                        y,
                        width: this.relWidthToPoints(img.width, p),
                        height: this.relHeightToPoints(img.height, p),
                        //preserveAspectRatio : this.getSVGPreserveAspectRatioOption(img)
                    }
                );
            }
            else 
            {
                // if a bitmap (jpg or png)
                const { width, height } = this._getImageOptions(img, p)
            
                // see: https://raw.githack.com/MrRio/jsPDF/master/docs/module-addImage.html
                this.activePDFDoc.addImage(
                    img.content.data, // already saved in base64 format
                    img.content.format.toUpperCase(), // format of file if filetype-recognition fails JPG,PNG etc
                    x, // in pnts
                    y, // in pnts
                    width,
                    height
                )    
            }
        }
        else {
            console.error(`DocPDFExporter:_placeImage: Error placing image from url "${img.content.source}"!`);
        }

        
    }

    /** Returns extension (without .) from url */
    _getImageExt(url:string):string
    {
        const VALID_IMAGE_EXTS = ['jpg', 'png', 'svg']
        const extsRe = new RegExp(VALID_IMAGE_EXTS.map((e) => `.${e}`).join('|'), 'g')
        const matches = url.match(extsRe);
        return (matches) ? matches[0].replace('.', '') : null;
    }
    

    _getImageOptions(img:ContainerData, p:PageData):Record<string,any>
    {
        // calculate width/height based on fit settings
        // cover: fill entire container with image
        // fit: fit image inside container
        let w = this.relWidthToPoints(img.width, p);
        let h = this.relHeightToPoints(img.height, p);

        const origImageProps = this.activePDFDoc.getImageProperties(img.content.data)
        const origImageRatio = origImageProps.height/origImageProps.width;
        const containerImageRatio = img.height/img.width;
        
        const fit = img?.content?.settings?.fit || 'contain'; // default is contain, co

        if(origImageRatio < containerImageRatio) // width determines fitting
        {
            if(fit === 'contain'){ h = w * origImageRatio; }
            else { w = h / origImageRatio;} // cover
        }
        else {
            // fit to height
            if(fit === 'contain'){ w = h / origImageRatio; }
            else { h = w * origImageRatio; } // cover
        }

        return { 
            width: w,
            height: h
        }
    }
    
    //// SVG VIEW ////

    /** Place View SVG on page 
     *     
     *      - view.content.data contains raw SVG string (<svg _bbox="..." _worldUnits='mm'><path .. >... )
     *      
     *      - TODO: 
     *          * Implement protection against making drawings bigger than page, resulting in weird pages etc
     *          * Implement view.zoomLevel, view.zoomRelativeTo etc. - NOW: only automatic filling of viewport/container
     * 
     * 
    */
    _placeViewSVG(view:ContainerData, p:PageData)
    {
        const svgEdit = new DocViewSVGManager();
        if (!svgEdit.parse(view))
        { 
            console.warn(`DocPDFExporter::_placeViewSVG(): No SVG data in view "${view.name}". Skipped placing that view!`);
            return;
        }

        // Transform incoming SVG Shape paths (in model space) into PDF paths in the space defined by the View Container
        const pdfLinePaths:Array<PDFLinePath> = svgEdit.toPDFDocShapePaths(this,view,p);

        // NOTE: activePDFDoc.saveGraphicsState() / activePDFDoc.restoreGraphicsState() are malfunctioning here
        if(pdfLinePaths)
        {
            pdfLinePaths.forEach( path => {
                this.activePDFDoc.stroke(); // execute commands that might be left un-executed
                // draw line onto PDF document
                this._setPathStyle(path.style);
                // jsPDF needs Line paths as [{op: m|l, c: [x,y] }]
                const pathLines = svgEdit._pdfLinePathToJsPDFPathLines(path);
                this.activePDFDoc.path(pathLines);
                this.activePDFDoc.stroke(); // do real draw with current style
            })            
        }

        // Draw annotations
        svgEdit.drawDimLinesToPDF(this);

        // Force putting to canvas
        this._drawFakePath();

    }

    /** HACK: For some reason using this.activePDFDoc.path in _placeViewSVG() 
     *  does not apply drawing and styling to canvas. By drawing this bogus empty rectangle it does!
     *  TODO: research why this works in code: https://github.com/parallax/jsPDF/blob/5d09af9135a2fe049c7d3c8b95df280d22e4a6db/src/jspdf.js#L4485
      */
    _drawFakePath()
    {  
        this.activePDFDoc.rect(0,0,0,0);
    }

    /** Set PDF styling before drawing anything */
    _setPathStyle(style?:DocPathStyle):jsPDF // doc: PDFDocument
    {
        // Convert special props that need to be get in GState instead directly on jsPDF doc in activePDFDoc
        const STYLE_PROPS_TO_GSTATE = {
            strokeOpacity : 'stroke-opacity',
            fillOpacity: 'opacity',
        }

        // Some exceptions to direct mapping from DocPathStyle to jsPDF
        const STYLE_PROPS_TRANSFORM_FOR_JSPDF = {
            strokeColor: 'drawColor', 
        }

        if (!style || typeof style !== 'object') return this.activePDFDoc;

        // style attributes translate directly into methods on doc:jsPDF or for GState
        // for example: lineWidth(...) => setLineWidth, fillOpacity(...) => setFillOpacity
        // or strokeOpacity => GState.stroke-opacity
        // https://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html#setFillColor

        for (const [styleProp,val] of Object.entries(style))
        {
            if(Object.keys(STYLE_PROPS_TO_GSTATE).includes(styleProp))
            {
                // We have to a Gstate property (strokeOpacity and fillOpacity)
                const gState = {};
                gState[STYLE_PROPS_TO_GSTATE[styleProp]] = val;
                this.activePDFDoc.setGState(new GState(gState));
            }
            else {
                const stylePropJsPDF = STYLE_PROPS_TRANSFORM_FOR_JSPDF[styleProp] ?? styleProp;
                const setFnName = `set${stylePropJsPDF.charAt(0).toUpperCase() + stylePropJsPDF.slice(1)}`; // transform from prop to set{Prop}() function

                if(typeof this.activePDFDoc[setFnName] === 'function')
                {
                    this.activePDFDoc[setFnName](val); // execute style function
                }
                else {
                    console.warn(`DocPDFExporter::_setPathStyle(): Trying to set style property "${styleProp}" with unknown jsPDF function: jsPDF.${setFnName}(). Check config!`)
                }
            }
        }

        return this.activePDFDoc;
    }

    
    //// TABLE ////

    /** Place table using jsPDF AutoTable 
     *  See: https://github.com/simonbengtsson/jsPDF-AutoTable
    */
    async _placeTable(t:ContainerData, p:PageData)
    {
        if(!Array.isArray(t?.content?.data) || t?.content?.data.length === 0)
        {
            console.error(`DocPDFExporter::_placeTable: Skipped Table "${t.name}" without data!`)
            return;
        }

        const settings = t?.content?.settings as TableContainerOptions;

        const { x, y } = this.containerToPDFPositionInPnts(t, p);
        const width = this.relWidthToPoints(t.width, p);

        // see: https://github.com/simonbengtsson/jsPDF-AutoTable
        autoTable(this.activePDFDoc,
            { 
                theme: 'plain',
                head: [Object.keys((t?.content?.data as DataRowsColumnValue)[0])],  // [[]]
                body: t?.content?.data.map( r => Object.values(r)),
                margin: { left: x, right: 0, top: 0, bottom:0 }, 
                startY: y, 
                tableWidth: width, 
                pageBreak: 'avoid',
                styles: {
                    fontSize:  settings?.fontsize ?? this.TABLE_FONTSIZE_DEFAULT, 
                    cellPadding: mmToPoints(this.TABLE_PADDING_MM),
                    lineWidth: mmToPoints(this.TABLE_BORDER_THICKNESS_MM),
                    lineColor: '#000000',
                }
            }
        )

    
        
    }

    //// GRAPHIC ////

    /** Place Graphic (hline, vline, rect, circle, etc) on active PDF page */
    _placeGraphic(g:ContainerData, p:PageData)
    {
        // Basic container position and pivot
        const { x, y } = this.containerToPDFPositionInPnts(g, p); // PDF position in pnts, with regard for pivot (also y axis switch)
        const w = this.relWidthToPoints(g.width, p);
        const h = this.relHeightToPoints(g.height, p);

        // Set style before drawing graphic
        if(g?.content?.settings?.style)
        { 
            this._setPathStyle(g.content.settings.style);
        }

        switch (g.content.settings.type)
        {
            case 'rect':
                this.activePDFDoc.rect(x,y,w,h)
                break;
            case 'hline':
                const hl = this.relWidthToPoints(g.width, p); 
                this.activePDFDoc.line(x,y,x+hl,y);
                break;
            case 'vline':
                const vl = this.relHeightToPoints(g.height, p);
                this.activePDFDoc.line(x,y,x,y+vl); // NOTE: jsPDF origin is at left,top
                break;
            case 'circle':
                const r = w/2; // radius is taken from width of container, not from g.content.radius! (which can be in different units)
                this.activePDFDoc.circle(x+r,y+r,r); // NOTE: correct for jsPDF circle position of left,top
                break;
            default:
                console.error(`DocPdfExporter::_placeGraphic: Unknown/unsupported graphic type: "${g.content.settings.type}"`)
        }

    }

    //// UTILS ////

    isBrowser():boolean
    {
        return typeof window === 'object';
    }

    isWorker():boolean
    {
        return (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
    }

    /** Convert relative page coordinate width to absolute PDF point coord of PDFKit system, also taking horizontal padding into account  */
    coordRelWidthToPoints(a:number, page:PageData, transformWithPadding:boolean=true):number
    {
        const pageHorizontalPadding = (transformWithPadding) ? ( (page.padding[0]||0) * page.width) : 0; // in page.DocUnits
        const pageContentWidth = convertValueFromToUnit(page.width - 2*pageHorizontalPadding, page.docUnits, 'mm'); // always to mm

        return mmToPoints(a*pageContentWidth + convertValueFromToUnit(pageHorizontalPadding, page.docUnits, 'mm'));
    }

    /** Convert relative page coordinate height to absolute PDF point coord of PDFKit system,  also taking vertical padding into account */
    coordRelHeightToPoints(a:number, page:PageData, transformWithPadding:boolean=true):number
    {
        const pageVerticalPadding = (transformWithPadding) ? ( (page.padding[1]||0) * page.height) : 0; // in page.docUnits
        const pageContentHeight = convertValueFromToUnit(page.height - 2*pageVerticalPadding, page.docUnits, 'mm'); // in mm

        const coordInPoints = this.pageHeightPoints()
                    - mmToPoints(a*pageContentHeight) 
                    - mmToPoints(convertValueFromToUnit(pageVerticalPadding, page.docUnits, 'mm')) // correct in pdfkit space for padding

        return coordInPoints;
    }

    /** Convert relative width (to page size or page-content) to points */
    relWidthToPoints(a:number, page:PageData, withPadding:boolean=true):number
    {
        const pageHorizontalPadding = (withPadding) ? ( (page.padding[0]||0) * page.width) : 0; // in page.DocUnits
        const pageContentWidth = convertValueFromToUnit(page.width - 2*pageHorizontalPadding, page.docUnits, 'mm'); // always to mm
        return mmToPoints(a*pageContentWidth);
    }

    /** Convert relative height (to page size or page-content) to points */
    relHeightToPoints(a:number, page:PageData, withPadding:boolean=true):number
    {
        const pageVerticalPadding = (withPadding) ? ( (page.padding[1]||0) * page.height) : 0; // in page.docUnits
        const pageContentHeight = convertValueFromToUnit(page.height - 2*pageVerticalPadding, page.docUnits, 'mm'); // in mm
        return mmToPoints(a*pageContentHeight);
    }

    pageHeightPoints():number
    {
        return mmToPoints(convertValueFromToUnit(this.activePage.height, this.activePage.docUnits, 'mm'));
    }

    /** Convert Container position data to x,y in PDF points, including taking take of pivot position and Page.padding. In PDFkit coord system
     *      NOTES: 
     *          - All incoming ContainerData data (position, width, height) is relative to page size
    */
    containerToPDFPositionInPnts(c:ContainerData, p:PageData):Record<string, number>
    {
        const x = this.coordRelWidthToPoints(
                    c.position[0] - ((c?.width) ? c.pivot[0] * c.width : 0),
                    p); 
        
        const y = this.coordRelHeightToPoints(
                c.position[1] + ((c?.height) ? (1-c.pivot[1]) * c.height : 0), // here still in Doc/PDF native coord system (origin: [left,bottom])
                p); 

        return { x : x, y : y }
    }

    removeEmptyValueKeysObj(obj:Object)
    {
        const newObj = {};
        for(const [k,v] of Object.entries(obj))
        {
            if(v)
            {
                newObj[k] = v;
            }
        }
        return newObj
    }

    //// DOWNLOAD FROM BLOB ////

    async _getNewFileHandle(desc, mime, ext, open = false)
    {
        const options = {
          types: [
            {
              description: desc,
              accept: {
                [mime]: ['.' + ext],
              },
            },
          ],
        };

        if (open) 
        {
            return await window.showOpenFilePicker(options);
        } 
        else {
            return await window.showSaveFilePicker(options);
        }
    }

    async _writeFile(fileHandle, contents)
    {
        // Create a FileSystemWritableFileStream to write to.
        const writable = await fileHandle.createWritable();
        // Write the contents of the file to the stream.
        await writable.write(contents);
        // Close the file and write the contents to disk.
        await writable.close();
    }

    //// MISC UTILS ////

    pageSizeToLowercase(s:PageSize):string
    {
        return (typeof(s) !== 'string') ? s : s.toLowerCase();
    }

    //// SVG UTILS ////

    /** Transform contentAlign on View to pdfkit-svg option preserveAspectRatio */
    getSVGPreserveAspectRatioOption(view?:ContainerData)
    {
        const DEFAULT = 'xMinYMin meet'; // NOTE: origin is [left,top]
        
        if (!view) { return DEFAULT; }
        if (!view.contentAlign) { return DEFAULT; }

        // Now map contentAlign values (like ['left','top']) to preserveAspectRatio
        const H_ALIGN_TO_PAR = {
            'left' : 'xMin',
            'center' : 'xMid',
            'right' : 'xMax',
        }
        const V_ALIGN_TO_PAR = {
            'top' : 'YMin',
            'center' : 'YMid',
            'bottom' : 'YMax',
        }

        return `${H_ALIGN_TO_PAR[view.contentAlign[0]] || 'xMid'}${V_ALIGN_TO_PAR[view.contentAlign[1]] || 'YMid'} meet`

    }



}


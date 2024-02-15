/**
 *  DocPdfExporter
 * 
 *  Takes data from Doc module and exports the documents to PDF using PDFkit
 * 
 *  IMPORTANT:
 *      Please add the following modules to use PDFExporter:
 *      - pdfkit@0.14.0
 *      - svg-to-pdfkit@0.1.8
 *      - pdfkit-table@0.1.99
 *     
 *  
 *  IMPORTANT NOTES:  
 *      - Doc module coordinate system origin is bottom-left (This is in line with PDF itself!)
 *      - PDFKit origin of coordinate system is at top-left
 * 
 *  INFO:
 *      - see example loading of fonts for pdfkit: https://github.com/foliojs/pdfkit/tree/master/examples/webpack
 * 
 */

// IMPORTANT: If problems with fontkit
//      Add this to your package.json
//      
//        "resolutions": {
//              "pdfkit/**/fontkit": "2.0.2"
//      }
//
//      to pin version of fontkit




import fs from 'fs'; // virtual pdfkit filesystem as replacement of node

import makePDFDocumentWithTables from '../libs/pdfkit-table'

import { Container, DataRows, DataRowsColumnValue, DocData, DocPathStyle, SVGtoPDFtransform, TableContainerOptions } from './internal' // Doc
import { PDFLinePath } from './internal' // types
import { convertValueFromToUnit } from './internal'
import { PageData, ContainerData, Page } from './internal'

import { DocViewSVGManager } from './DocViewSVGManager'

// import type { PDFDocument, PDFPage } from '@types/pdfkit' // disabled because it does not work
import BlobStream from 'blob-stream' // BlobStream for Web - TODO: disable for node

import { arrayBufferToBase64, mmToPoints, pointsToMm } from './utils'


// IMPORTANT: pdfkit needs fontkit ^2.0.0. Please add that requirement in package.json:
//     "resolutions": {
//    "pdfkit/**/fontkit": "2.0.2"
//  }
// 

// Load font file for pdfkit (special loader in webpack). See raw-loader nuxt.config.js
// All fonts: Courier-Bold.afm Courier-BoldOblique.afm Courier-Oblique.afm Courier.afm Helvetica-Bold.afm Helvetica-BoldOblique.afm Helvetica-Oblique.afm Helvetica.afm Symbol.afm Times-Bold.afm Times-BoldItalic.afm Times-Italic.afm Times-Roman.afm ZapfDingbats.afm
// TODO: check on Node

declare var WorkerGlobalScope: any; // avoid TS errors with possible unknown variable

export class DocPDFExporter 
{
    //// SETTINGS ////

    DEBUG = false; // test raw PDFkit output
    TABLE_BORDER_THICKNESS_MM = 0.1;
    TABLE_PADDING_MM = 3;

    //// END SETTINGS

    inDocs:Record<string, DocData> = {}; // incoming DocData by name
    
    docs:Record<string,any> = {}; // Holds internal PDFkit documents
    blobs:Record<string,Blob> = {};
    
    activeDoc:DocData
    activePage:PageData

    activePDFDoc:any // PDFDocument
    activePDFPage:any // PDFPage
    activeStream:any // TODO TS typing

    _PDFDocument:any; // PDFDocument
    _SVGtoPDF:any; // 
    _hasPDFKit:boolean = false;

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
        this.activePDFPage = undefined;
        this.activeStream = undefined;
    }

    async export(data:DocData|Record<string,DocData>): Promise<Record<string, Blob>>
    {
        this.reset();
        try {  
            await this.loadPDFKit(); 
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
            if (this.isBrowser()) this._saveBlob(); // Start file save in browser
            return blobs;
        }
        else {
            this.generateTestDoc();
        }
         
    }

    /** Load PdfKit as module dynamically */
    async loadPDFKit():Promise<any> // TODO: PDFKit typing
    {
        // If PDFKit already loaded
        if(this.hasPDFKit())
        {
            return new Promise((resolve) => resolve(this._PDFDocument))
        }
        else {
            // Load PDFKit
            // detect context of JS
            const isBrowser = this.isBrowser();
            const isWorker = this.isWorker();

            if(isWorker || isBrowser)
            {
                this._PDFDocument = await import('pdfkit');
                this._SVGtoPDF = await import('svg-to-pdfkit');

                this._PDFDocument = this._PDFDocument.default; // we need the default
                this._SVGtoPDF = this._SVGtoPDF.default;

                // some black magic to make pdfkit-table work
                this._PDFDocument = makePDFDocumentWithTables(this._PDFDocument);
                
                // load fonts in virtual fs
                // all fonts in pdfkit: 
                // Courier-Bold.afm Courier-BoldOblique.afm Courier-Oblique.afm Courier.afm Helvetica-Bold.afm Helvetica-BoldOblique.afm Helvetica-Oblique.afm Helvetica.afm Symbol.afm Times-Bold.afm Times-BoldItalic.afm Times-Italic.afm Times-Roman.afm ZapfDingbats.afm
                try {
                    /** IMPORTANT: Dynamically importing the .afm assets in webpack/brower, but not in Node 
                     *  1. For the browser: pdfkit needs the .afm assets in the virtual file system 
                     *  2. For node pdfkit has those already set up
                     *  3. Webpack has a file loader and handles the font files correctly. On node, TS tries to revolve the dynamic import of files and give an error
                     *  4. Solution here uses the capability of Webpack to parse these variable imports and loads the files
                     *      But TS doesnt bother interpreting the variable bits and skips over these imports
                    */
                    const HelveticaFile = 'Helvetica.afm';
                    const HelveticaBoldFile = 'Helvetica-Bold.afm';
                    const Helvetica = await import(`pdfkit/js/data/${HelveticaFile}` /* webpackPreload: true */);
                    const HelveticaBold = await import(`pdfkit/js/data/${HelveticaBoldFile}` /* webpackPreload: true */);
                    fs.writeFileSync('data/Helvetica.afm', Helvetica.default); // see import on top of this page
                    fs.writeFileSync('data/Helvetica-Bold.afm', HelveticaBold.default);
                }
                catch (e)
                {
                    console.error(`DocPDFExporter::loadPDFKit(): Could not find Helvetica font. "${e}"`)
                }
            }
            else {
                const nodePDFKitPath = 'pdfkit'; // To keep TS warnings out
                this._PDFDocument = await import(nodePDFKitPath)
                const svgToPDFPath = 'svg-to-pdfkit'
                this._SVGtoPDF = await import(svgToPDFPath);
                this._PDFDocument = this._PDFDocument.default; // we need the default
                this._SVGtoPDF = this._SVGtoPDF.default;

                // some black magic to make pdfkit-table work
                this._PDFDocument = makePDFDocumentWithTables(this._PDFDocument);
            }

            return this._PDFDocument;
        }

        
    }

    handleFailedImport(e)
    {
        console.error(`DocPDFExporter:loadPDFKit: Could not load module 'pdfkit'. ERROR: "${e}". Make sure it is added to the project. PdfExporter will not work!`)
    }

    handleSuccesImport()
    {
        console.info(`DocPDFExporter:loadPDFKit: PDFKit loaded!`)
        this._hasPDFKit = true;
    }

    hasPDFKit():boolean
    {
        return this._hasPDFKit;
    }

    async run(data:DocData|Record<string,DocData>) : Promise<Record<string,Blob>>
    {
        return await this.parse(data);
    }

    /** Parse raw Doc data, either DocData or a set of documents in Record<string, DocData> */
    async parse(data?:DocData|Record<string, DocData>): Promise<Record<string,Blob>>
    {
        if(!this.hasPDFKit())
        { 
            console.error(`DocPDFExporter::parse(): Cannot generate PDF. Please add 'pdfkit' to your project package.json!`)
        }

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

        return this.blobs; // { docname: blob }

    }

    /** Make a simple PDF test document directly with pdfkit */
    async generateTestDoc()
    {
        // see: https://github.com/blikblum/pdfkit-webpack-example/blob/master/src/index.js
        const doc = new this._PDFDocument();
        const blobStream = BlobStream();
        const docStream = doc.pipe(blobStream);
        doc.fontSize(25).text('Test text', 100, 80);
        doc.end();
        docStream.on('finish', function() {
          console.info('DocPDFExporter::generateTestDoc: Exporting Blob:')
          console.info(docStream.toBlob('application/pdf'));
        });
    }

    /** Save the given doc (or the first) to file  */
    async _saveBlob(docName?:string)
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
        // TODO: fix fonts. See: https://github.com/foliojs/pdfkit/blob/master/examples/webpack/webpack.config.js#L19
        // or: https://github.com/foliojs/pdfkit/issues/623#issuecomment-284625259
        const newPDFDoc = new this._PDFDocument({  autoFirstPage: false, font: 'Helvetica', margin: 0 });
        this.docs[d.name] = newPDFDoc;
        this.activePDFDoc = newPDFDoc;
        this.activeDoc = d;

        const stream = BlobStream();
        this.activeStream = this.activePDFDoc.pipe(stream)

        // NOTE: cannot use forEach because it is not sequentially!
        for (const p of this.activeDoc.pages)
        {
            await this._makePage(p)
        }
        await this._endActiveDoc();

    }
    
    /** Wait until the active Doc stream is finished and place resulting Blob inside cache for later export */
    _endActiveDoc():Promise<Blob>
    {
        const doc = this.activeDoc; 
        const pdfDoc = this.activePDFDoc;
        const docStream = this.activeStream;
        pdfDoc.end();

        return new Promise(resolve => 
            {
                docStream.on('finish', () => 
                    {
                        console.info(`DocPDFExporter::_endDoc: Finished Doc stream of ${doc.name}`)
                        this.blobs[doc.name] = docStream.toBlob('application/pdf');
                        resolve(this.blobs[doc.name]);
                    }                
                )
            }
        )
    }

    /** Get first Blob */
    getBlob():Blob|null
    {
        return (Object.values(this.blobs).length) ? Object.values(this.blobs)[0] : null;
    }

    async _makePage(p:PageData):Promise<any> // PDFPage
    {
        // PDFKit Page docs: https://github.com/foliojs/pdfkit/blob/master/lib/page.js

        this.activePage = p;
        const newPDFPage = this.activePDFDoc.addPage(
            { 
                size: p.size,
                layout: p.orientation,
                margin: 0,
            }
        )
        this.activePDFPage = newPDFPage;
        
        // place containers of types like text, textarea, image, view (svg), table 
        for (const c of this.activePage.containers) // NOTE: cannot use forEach: not sequentially!
        {
            await this._placeContainer(c, p);
        }
    }

    async _placeContainer(c:ContainerData, p:PageData)
    {
        console.info(`DocPDFExporter::_placeContainer: Placing container "${c.name}" of type "${c.type}" on page "${p.name}"`)

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

            default:
                console.error(`DocPDFExporter::_placeContainer(): Unknown container type: "${c.type}"`);
            
        }
    }

    //// TEXT ////

    _placeText(t:ContainerData, p:PageData)
    {
        // PDFKit Text: https://github.com/foliojs/pdfkit/blob/master/lib/mixins/text.js
        // More: http://pdfkit.org/docs/text.html#the_basics

        const x = this.coordRelWidthToPoints(t.position[0], p) 
                    - ((t?.width) ? t.pivot[0]/2 : 0); // correct for pivot if width is set

        this.activePDFDoc.fontSize(t?.content?.settings?.size), // in points already
        this.activePDFDoc.text(
            t?.content?.data, 
            x, // from relative page coords to absolute PDF points
            this.coordRelHeightToPoints(t.position[1], p),
            { // PDF text options
                ...this._parseTextOptions(t, p)
            }
        );
        // reset text cursor (not needed because we only use absolute coordinates)
        this.activePDFDoc.x = 0;
        this.activePDFDoc.y = 0;
    }

    /** Parse TextOptions to PDF text options */
    _parseTextOptions(t:ContainerData, p:PageData):Object
    {
        const pdfTextOptions = {
            width: this.relWidthToPoints(t.width, p), // from Container
            height: this.relHeightToPoints(t.height, p),
            fill: t?.content?.settings?.color,
            ...t?.content?.settings, // just plugin TextOptions directly into pdfkit
        };

        // NOTE: pdfkit is brittle for null values
        return this.removeEmptyValueKeysObj(pdfTextOptions); 
    }

    //// IMAGE ////

    /** First load the SVG or Bitmap image and then supply its buffer to pdfkit */
    async _placeImage(img:ContainerData, p:PageData)
    {
        // see docs: http://pdfkit.org/docs/images.html
        /* 
            NOTES:
            - PDFkit places images with [left,top] as pivot and y-axis in [left,top]    
            - container width and height are relative to page width/height (if widthRelativeTo = 'page')
            - heightAbs/widthAbs are in docUnits
            - We use a reference to PageData here to avoid this.activePage while working with async methods
            
        */

        if(img?.content?.data && img?.content?.source)
        {
            const imgExt = this._getImageExt(img.content.source);    

            // if SVG image
            if (imgExt === 'svg')
            {
                const { x, y } = this.containerToPositionInPnts(img, p);
        
                this._SVGtoPDF(
                    this.activePDFDoc, 
                    img.content.data, 
                    x,
                    y,
                    {
                        // options
                        width: this.relWidthToPoints(img.width, p),
                        height: this.relHeightToPoints(img.height, p),
                        preserveAspectRatio : this.getSVGPreserveAspectRatioOption(img)
                    }
                );
            }
            else 
            {
                // if a bitmap (jpg or png)
                const { x, y } = this.containerToPositionInPnts(img, p);
            
                this.activePDFDoc.image(
                    img.content.data, // already saved in base64 format
                    x,
                    y,
                    {
                        // options            
                        ...this._parseImageOptions(img, p)
                    }
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
    

    _parseImageOptions(img:ContainerData, p:PageData):Object
    {
        const w = this.relWidthToPoints(img.width, p);
        const h = this.relHeightToPoints(img.height, p);
        const pdfImgOptions = {
            fit: (w && h && img?.content?.settings?.fit === 'contain') ? [w,h] : null,
            cover : (w && h && img?.content?.settings?.fit === 'cover') ? [w,h] : null,
        }

        return this.removeEmptyValueKeysObj(pdfImgOptions)
    }
    
    //// SVG VIEW ////

    /** Place View SVG on page 
     *     
     *      - view.content.data contains raw SVG string (<svg _bbox="..." _worldUnits='mm'><path .. >... )
     *      - TODO: Implement view.zoomLevel, view.zoomRelativeTo etc. - NOW: only automatic filling of viewport/container
     * 
     *      see svg-to-pdfkit: https://github.com/alafr/SVG-to-PDFKit
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

        if(pdfLinePaths)
        {
            pdfLinePaths.forEach( path => {
                // draw line onto PDF document
                let d = this.activePDFDoc.path(path.path)
                        .stroke();
                d = this._applyPathStyle(d, path.style);
            })
        }

        // Draw annotations
        svgEdit.drawDimLinesToPDF(this);

        // draw border around container
        const viewPositionPnts = this.containerToPositionInPnts(view, p);
        if (view.border)
        {
            let d = this.activePDFDoc.rect(
                viewPositionPnts.x,
                viewPositionPnts.y,
                this.relWidthToPoints(view.width, p),
                this.relHeightToPoints(view.height, p),
            ).stroke();
            this._applyPathStyle(d, view?.borderStyle)
        }
    }

    _applyPathStyle(doc:any, style?:DocPathStyle) // doc: PDFDocument
    {
        if (!style || typeof style !== 'object') return doc;

        // style attributes translate directly into methods on doc:PDFDocument
        // for example: lineWidth(...), fillOpacity(...)
        // See: https://pdfkit.org/docs/vector.html#fill_and_stroke_styles
        for (const [fn,val] of Object.entries(style))
        {
            if(typeof doc[fn] === 'function')
            {
                doc = doc[fn](val); // execute style function
            }
        }

        return doc;
    }

    
    //// TABLE ////

    async _placeTable(t:ContainerData, p:PageData)
    {
        if(!Array.isArray(t?.content?.data) || t?.content?.data.length === 0)
        {
            console.error(`DocPDFExporter::_placeTable: Skipped Table "${t.name}" without data!`)
            return;
        }
        await this.activePDFDoc.table(
            { 
                title: '', // HTML rendered has no label yet! So omit here too.
                headers: Object.keys((t?.content?.data as DataRowsColumnValue)[0]).map(v => { return { label: v, headerColor: 'white'}}),
                rows: t?.content?.data.map( r => Object.values(r)),
            },
            this._parseTableSettings(t, p)
        )
    }

    _parseTableSettings(t:ContainerData, p:PageData): Object
    {
        const settings = t?.content?.settings as TableContainerOptions

        this.activePDFDoc.fontSize(settings?.fontsize);

        const x = this.coordRelWidthToPoints(t.position[0], p) 
                    - ((t?.width) ? t.pivot[0]/2 : 0); // correct for pivot if width is set
        const y = this.coordRelHeightToPoints(t.position[1], p)

        const pdfTableSettings =  
        {
            x: x,
            y: y,
            width: this.relWidthToPoints(t.width, p), // from Container
            // height: this.relHeightToPoints(t.height, p),
            // some basic settings to sync with html rendering of Docs
            padding: mmToPoints(this.TABLE_PADDING_MM),
            divider: {
                // Dividers are disabled. See custom rectangle in prepareHeader en prepareRow
                header: { disabled: true, width: mmToPoints(this.TABLE_BORDER_THICKNESS_MM), color: 'black', opacity: 1 },
                horizontal: { disabled: true, width: mmToPoints(this.TABLE_BORDER_THICKNESS_MM), color: 'black', opacity: 1 },
            },
            prepareHeader: (row, indexColumn, indexRow, rectRow, rectCell) => 
            {
                // NOTE: this uses a somewhat hacked version of this prepareHeader plug-in function
                this.activePDFDoc.font("Helvetica-Bold").fontSize(settings?.fontsize);
                this._drawTableCellRect(rectCell, true); // Here we draw special per cell styling - fix for header
            },
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                this.activePDFDoc.font("Helvetica").fontSize(settings?.fontsize);
                this._drawTableCellRect(rectCell); // Here we draw special per cell styling
            }
        }

        // NOTE: pdfkit is brittle for null values
        return this.removeEmptyValueKeysObj(pdfTableSettings); 
    }

    _drawTableCellRect(rectCell:any, header:boolean=false) // { x, y , width, height }
    {
        // !!!! IMPORTANT: Don't modify rectCell directly, because it affects all cells
        if(rectCell)
        {
            
            const lw = mmToPoints(this.TABLE_BORDER_THICKNESS_MM);
            // NOTE: We move up the rectangle lw to have them overlap fully
            // NOTE: We need to correct for header, it needs to be set lower of amount lw
            this.activePDFDoc.rect(
                    rectCell.x, rectCell.y + ((header) ? 2*lw : 0), rectCell.width, rectCell.height+lw)
            .lineWidth(lw)
            .strokeColor('#000000')
            .stroke();
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
    containerToPositionInPnts(c:ContainerData, p:PageData):Record<string, number>
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


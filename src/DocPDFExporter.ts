/**
 *  DocPdfExporter
 * 
 *  Takes data from Doc module and exports the documents to PDF using PDFkit
 *  
 *  NOTES:  
 *      - Doc module coordinate system origin is bottom-left
 *      - PDFKit origin of coordinate system is at top-left
 * 
 */

// see example loading of fonts for pdfkit: https://github.com/foliojs/pdfkit/tree/master/examples/webpack
import fs from 'fs'; // virtual pdfkit filesystem as replacement of node

import { DocData } from './Doc'
import { convertValueFromToUnit } from './utils'
import { PageData, ContainerData, Page } from './internal'

import type { PDFDocument, PDFPage } from '@types/pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'

import BlobStream from 'blob-stream' // BlobStream for Web - TODO: disable for node

import { DocViewSVGEdit } from './DocViewSVGEdit'

import { arrayBufferToBase64 } from './utils'

// all fonts in pdfkit: 
// Courier-Bold.afm Courier-BoldOblique.afm Courier-Oblique.afm Courier.afm Helvetica-Bold.afm Helvetica-BoldOblique.afm Helvetica-Oblique.afm Helvetica.afm Symbol.afm Times-Bold.afm Times-BoldItalic.afm Times-Italic.afm Times-Roman.afm ZapfDingbats.afm
import Helvetica from 'pdfkit/js/data/Helvetica.afm';
fs.writeFileSync('data/Helvetica.afm', Helvetica);

// IMPORTANT: pdfkit needs fontkit ^2.0.0. Please add that requirement in package.json:
//     "resolutions": {
//    "pdfkit/**/fontkit": "2.0.2"
//  }
// 

declare var WorkerGlobalScope: any; // avoid TS errors with possible unknown variable

export class DocPDFExporter 
{
    //// SETTINGS ////

    DEBUG = false; // test raw PDFkit output

    //// END SETTINGS

    inDocs:Record<string, DocData> = {}; // incoming DocData by name
    
    docs:Record<string,any> = {}; // Holds internal PDFkit documents
    blobs:Record<string,Blob> = {};
    
    activeDoc:DocData
    activePage:PageData

    activePDFDoc:PDFDocument
    activePDFPage:PDFPage
    activeStream:any // TODO TS typing

    _PDFDocument:any; // PDFDocument
    _hasPDFKit:boolean = false;

    constructor(data:DocData|Record<string, DocData>)
    {
        this.init(data)
    }  

    init(data:DocData|Record<string,DocData>, onDone?:() => void)
    {
        this.loadPDFKit()
            .catch(this.handleFailedImport)
            .then(async () => 
            {
                this.handleSuccesImport();

                if(!this.DEBUG)
                {
                    await this.run(data);
                    await this._export(null);
                }
                else {
                    console.info('DocPDFExporter::init: [[DEBUG]]. Data: ')
                    console.info(data);
                    this.generateTestDoc();
                }
            }) // To be in instance scope
    }

    /** Load PdfKit as module dynamically */
    async loadPDFKit():Promise<any> // TODO: PDFKit typing
    {
        // detect context of JS
        const isBrowser = typeof window === 'object'
        let isWorker = (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
        const isNode = !isWorker && !isBrowser;

        if(isWorker || isBrowser)
        {
            this._PDFDocument = await import('pdfkit');
        }
        else {
            const nodePDFKitPath = 'pdfkit'; 
            this._PDFDocument = await import(nodePDFKitPath)
        }

        this._PDFDocument = this._PDFDocument.default; // we need the default

        return this._PDFDocument;
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

    async run(data:DocData|Record<string,DocData>)
    {
        await this.parse(data);
    }

    /** Parse raw Doc data, either DocData or a set of documents in Record<string, DocData> */
    async parse(data?:DocData|Record<string, DocData>)
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

    async _export(docName:string)
    {
        docName = docName || Object.keys(this.docs)[0];
        const blob = this.blobs[docName];
        const fileHandle = await this._getNewFileHandle("PDF", "application/pdf", "pdf");
        this._writeFile(fileHandle, blob).then(() => 
        {
          console.info("Saved PDF to " + fileHandle.name);
        });
    }

    /** Parse Doc data into PDFDocument */
    async _parseDoc(d:DocData)
    {
        // TODO: fix fonts. See: https://github.com/foliojs/pdfkit/blob/master/examples/webpack/webpack.config.js#L19
        // or: https://github.com/foliojs/pdfkit/issues/623#issuecomment-284625259
        const newPDFDoc = new this._PDFDocument({  autoFirstPage: false, font: 'Helvetica' });
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

    async _makePage(p:PageData):PDFPage
    {
        // PDFKit Page docs: https://github.com/foliojs/pdfkit/blob/master/lib/page.js

        this.activePage = p;
        const newPDFPage = this.activePDFDoc.addPage(
            { 
                size: p.size,
                layout: p.orientation,
                // NOTE: omit margins because they don't really do anything
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
                this._placeViewSVG(c,p);
                break;

            case 'image':
                await this._placeImage(c, p)
                break;

            case 'table':
                // TODO
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

        this.activePDFDoc.text(
            t?.content?.main, 
            x, // from relative page coords to absolute PDF points
            this.coordRelHeightToPoints(t.position[1], p),
            { 
                // PDF text options
                ...this._parseTextOptions(t)
            }
        );
    }

    /** Parse TextOptions to PDF text options */
    _parseTextOptions(t:ContainerData):Object
    {
        const pdfTextOptions = {
            width: t?.width, // from Container
            height: t?.height, 
            size: this.mmToPoints(t?.content?.settings?.size),
            fillColor: t?.content?.settings?.color
        };

        return this.removeEmptyValueKeysObj(pdfTextOptions); 
    }

    //// IMAGE ////

    /** First load the image (async) and then supply its buffer to pdfkit */
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
        
        const url = img.content.main;
        const imgBuffer = await this._loadImage(url);
        const imgExt = this._getImageExt(url);

        if(imgExt) // imgExt
        {
            const imgUriBase64 = `data:image/${imgExt};base64,${arrayBufferToBase64(imgBuffer)}`
            const { x, y } = this.containerToPositionPoints(img, p);
            
            this.activePDFDoc.image(
                imgUriBase64,
                x,
                y,
                {
                    // options            
                    ...this._parseImageOptions(img, p)
                }
            )
        }
        else {
            console.error(`DocPDFExporter:_placeImage: Error placing image at url "${url}"!`);
        }

    }

    /** Returns extension (without .) from url */
    _getImageExt(url:string):string
    {
        const VALID_IMAGE_EXTS = ['jpg', 'png']
        const extsRe = new RegExp(VALID_IMAGE_EXTS.map((e) => `.${e}`).join('|'), 'g')
        const matches = url.match(extsRe);
        return (matches) ? matches[0].replace('.', '') : null;
    }
    
    /** Fetch with proxy for CORS headers */
    async _loadImage(url:string):Promise<ArrayBuffer>
    {
        const PROXY_URL = 'http://localhost:8090/proxy'
        let r = await fetch(PROXY_URL, 
            {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url : url })       
            }
        );

        return await r.arrayBuffer()
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
     *      - view.content.main contains raw SVG string (<svg _bbox="..." _worldUnits='mm'><path .. >... )
     *      - TODO: Implement view.zoomLevel, view.zoomRelativeTo etc. - NOW: only automatic filling of viewport/container
     * 
     *      see svg-to-pdfkit: https://github.com/alafr/SVG-to-PDFKit
    */
    _placeViewSVG(view:ContainerData, p:PageData)
    {
        const svgEdit = new DocViewSVGEdit(view);
        svgEdit.setViewBox();
        svgEdit.setNoStrokeScaling();
        const svgStr = svgEdit.export();

        const { x, y } = this.containerToPositionPoints(view, p);

        SVGtoPDF(
            this.activePDFDoc, 
            svgStr, 
            x,
            y,
            {
                // options
                width: this.relWidthToPoints(view.width, p),
                height: this.relHeightToPoints(view.height, p),
                preserveAspectRatio : this.getSVGPreserveAspectRatioOption(view)
            }
        );
    }

    //// UTILS ////

    pointsToMm(p:number):number
    {
        return p*1/72*25.4;
    }

    mmToPoints(m:number):number
    {
        return m/25.4*72
    }

    /** Convert relative page coordinate width to absolute PDF point coord of PDFKit system, also taking horizontal padding into account  */
    coordRelWidthToPoints(a:number, page:PageData, transformWithPadding:boolean=true):number
    {
        const pageHorizontalPadding = (transformWithPadding) ? ( (page.padding[0]||0) * page.width) : 0; // in page.DocUnits
        const pageContentWidth = convertValueFromToUnit(page.width - 2*pageHorizontalPadding, page.docUnits, 'mm'); // always to mm
        return this.mmToPoints(a*pageContentWidth + convertValueFromToUnit(pageHorizontalPadding, page.docUnits, 'mm'));
    }

    /** Convert relative page coordinate height to absolute PDF point coord of PDFKit system,  also taking vertical padding into account */
    coordRelHeightToPoints(a:number, page:PageData, transformWithPadding:boolean=true):number
    {
        const pageVerticalPadding = (transformWithPadding) ? ( (page.padding[1]||0) * page.height) : 0; // in page.docUnits
        const pageContentHeight = convertValueFromToUnit(page.height - 2*pageVerticalPadding, page.docUnits, 'mm'); // in mm

        const coordInPoints = this.pageHeightPoints()
                    - this.mmToPoints(a*pageContentHeight) 
                    - this.mmToPoints(convertValueFromToUnit(pageVerticalPadding, page.docUnits, 'mm')) // correct in pdfkit space for padding

        return coordInPoints;
    }

    /** Convert relative width (to page size or page-content) to points */
    relWidthToPoints(a:number, page:PageData, withPadding:boolean=true):number
    {
        const pageHorizontalPadding = (withPadding) ? ( (page.padding[0]||0) * page.width) : 0; // in page.DocUnits
        const pageContentWidth = convertValueFromToUnit(page.width - 2*pageHorizontalPadding, page.docUnits, 'mm'); // always to mm
        return this.mmToPoints(a*pageContentWidth + convertValueFromToUnit(pageHorizontalPadding, page.docUnits, 'mm'));
    }

    /** Convert relative height (to page size or page-content) to points */
    relHeightToPoints(a:number, page:PageData, withPadding:boolean=true):number
    {
        const pageVerticalPadding = (withPadding) ? ( (page.padding[1]||0) * page.height) : 0; // in page.docUnits
        const pageContentHeight = convertValueFromToUnit(page.height - 2*pageVerticalPadding, page.docUnits, 'mm'); // in mm
        return this.mmToPoints(a*pageContentHeight + convertValueFromToUnit(pageVerticalPadding, page.docUnits, 'mm'));
    }

    pageHeightPoints():number
    {
        return this.mmToPoints(convertValueFromToUnit(this.activePage.height, this.activePage.docUnits, 'mm'));
    }

    /** Convert Container position data to x,y in PDF points, including taking take of pivot position and Page.padding. In PDFkit coord system
     *      NOTES: 
     *          - All incoming ContainerData data (position, width, height) is relative to page size
    */
    containerToPositionPoints(c:ContainerData, p:PageData):Record<string, number>
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
        const DEFAULT = 'xMidYMid meet';
        
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


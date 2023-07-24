/**
 *  DocPdfExporter
 * 
 *  Takes data from Doc module and exports the documents to PDF using PDFkit
 *  
 *  NOTES:  
 *      - Doc module coordinate system origin is bottom-left
 * 
 */

import { DocData } from './Doc'
import { PageData, ContainerData } from './internal'

import { PDFDocument, PDFPage } from '@types/pdfkit'
import BlobStream from 'blob-stream'

// IMPORTANT: pdfkit needs fontkit ^2.0.0. Please add that requirement in package.json:
//     "resolutions": {
//    "pdfkit/**/fontkit": "2.0.2"
//  }
// 

declare var WorkerGlobalScope: any; // avoid TS errors with possible unknown variable

export class DocPDFExporter 
{
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

    init(data:DocData|Record<string,DocData>)
    {
        this.loadPDFKit()
            .catch(this.handleFailedImport)
            .then(() => 
            {
                this.handleSuccesImport();
                this.parse(data)
                this.export()    
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
        console.log(`DocPDFExporter:loadPDFKit: PDFKit loaded!`)
        this._hasPDFKit = true;
    }

    hasPDFKit():boolean
    {
        return this._hasPDFKit;
    }

    /** Parse raw Doc data, either DocData or a set of documents in Record<string, DocData> */
    parse(data?:DocData|Record<string, DocData>)
    {
        if(!this.hasPDFKit()){ console.error(`DocPDFExporter::parse(): Cannot generate PDF. Please add 'pdfkit' to your project package.json!`)}

        // set incoming inDocs by name
        if (data?.name)
        {
            this.inDocs[(data as DocData).name] = data as DocData;            
        } else 
        {
            this.inDocs = data as Record<string,DocData>;
        }

        // parse docs sequentially
        Object.values(this.inDocs).forEach((docData) => 
        {
            this._parseDoc(docData);
        })

    }

    export(docName?:string)
    {
        docName = docName || Object.keys(this.docs)[0];
        this._export(docName).then(() => 
        {
                this.$buefy.toast.open(
                    {
                        duration: 5000,
                        message: `Exported PDF for Doc "${docName}"!`,
                        pauseOnHover: true
                    }
                )
        })
    }

    async _export(docName:string)
    {
        console.log('==== _EXPORT _ ====')
        const blob = this.blobs[docName];
        console.log(blob);
        const fileHandle = await this._getNewFileHandle("PDF", "application/pdf", "pdf");
        this._writeFile(fileHandle, blob).then(() => 
        {
          console.info("Saved PDF to " + fileHandle.name);
        });
    }

    /** Parse Doc data into PDFDocument */
    _parseDoc(d:DocData)
    {
        // TODO: fix fonts. See: https://github.com/foliojs/pdfkit/blob/master/examples/webpack/webpack.config.js#L19
        // or: https://github.com/foliojs/pdfkit/issues/623#issuecomment-284625259
        const newPDFDoc = new this._PDFDocument({ font: 'Times-Roman' });
        this.docs[d.name] = newPDFDoc;
        this.activePDFDoc = newPDFDoc;
        this.activeDoc = d;

        this.activeStream = BlobStream();
        this.activePDFDoc.pipe(this.activeStream)

        this.activeDoc.pages.forEach((p) => this._makePage(p))
        // finish by saving stream to blob
        this.activePDFDoc.end();
        this.blobs[d.name] =  this.activeStream.toBlob('application/pdf');

    }

    _makePage(p:PageData):PDFPage
    {
        // PDFKit Page docs: https://github.com/foliojs/pdfkit/blob/master/lib/page.js
        this.activePage = p;
        const newPDFPage = this.activePDFDoc.addPage(
            { 
                size: p.size,
                layout: p.orientation,
                margins: {  
                    left: this.relWidthToPoints(p.padding[0]),
                    right: this.relWidthToPoints(p.padding[0]),
                    top: this.relHeightToPoints(p.padding[1]),
                    bottom: this.relHeightToPoints(p.padding[1]),
                }
            }
        )
        this.activePDFPage = newPDFPage;
        
        // place containers of types like text, textarea, image, view (svg), table 
        
        this.activePage.containers.forEach((c) => this._placeContainer(c))
    }

    _placeContainer(c:ContainerData)
    {
        switch(c.type)
        {
            case 'text':
                this._placeText(c)
                break;
            
            case 'textarea':
                this._placeText(c); // TextArea is the same in PDFKit
                break;

            case 'view':
                // TODO
                break;

            case 'image':
                this._placeImage(c)
                break;

            case 'table':
                // TODO
                break;

            default:
                console.error(`DocPDFExporter::_placeContainer(): Unknown container type: "${c.type}"`);
            
        }
    }

    //// TEXT ////

    _placeText(t:ContainerData)
    {
        // PDFKit Text: https://github.com/foliojs/pdfkit/blob/master/lib/mixins/text.js
        // More: http://pdfkit.org/docs/text.html#the_basics

        const x = this.relWidthToPoints(t.position[0]) - ((t?.width) ? t.pivot[0]/2 : 0); // correct for pivot if width is set

        this.activePDFDoc.text(
            t?.content?.main, 
            x, // from relative page coords to absolute PDF points
            this.relHeightToPoints(t.position[1]),
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

    _placeImage(img:ContainerData)
    {
        // see docs: http://pdfkit.org/docs/images.html
        const { x, y } = this.containerToPositionPoints(img)

        this.activePDFDoc.image(
            img?.content?.main, // url
            x,
            y,
            {
                // options            
                ...this._parseImageOptions(img)
            }
        )
    }

    _parseImageOptions(img:ContainerData):Object
    {
        const w = this.relWidthToPoints(img.width);
        const h = this.relWidthToPoints(img.height);
        const pdfImgOptions = {
            fit: (w && h && img?.content?.settings?.fit === 'contain') ? [w,h] : null,
            cover : (w && h && img?.content?.settings?.fit === 'cover') ? [w,h] : null,
        }

        return this.removeEmptyValueKeysObj(pdfImgOptions)
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

    /** Convert relative page coordinate width to absolute PDF point coord  */
    relWidthToPoints(a:number, pageData?:PageData):number
    {
        pageData = pageData || this.activePage
        return this.mmToPoints(a*pageData.width);
    }

    /** Convert relative page coordinate height to absolute PDF point coord  */
    relHeightToPoints(a:number, pageData?:PageData):number
    {
        pageData = pageData || this.activePage
        return this.mmToPoints(a*pageData.height);
    }

    /** Convert Container position data to x,y in PDF points, including taking take of pivot position */
    containerToPositionPoints(c:ContainerData):Record<string, number>
    {
        const x = this.relWidthToPoints(c.position[0]) - ((c?.width) ? c.pivot[0] * c.width : 0); 
        const y = this.relHeightToPoints(c.position[1]) - ((c?.height) ? c.pivot[1] * c.height : 0); 
        return { x : x ,y : y }
    }

    relPivotArrToPoints(p:Array<number|number>):Array<number|number>
    {
        return [
            this.relWidthToPoints(p[0]),
            this.relHeightToPoints(p[0]),
        ]
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


}


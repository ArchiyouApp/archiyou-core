/**
 *  DocPdfExporter
 * 
 *  Takes data from Doc module and exports the documents to PDF using PDFkit
 *  
 *  NOTES:  
 *      - Doc module coordinate system origin is bottom-left
 * 
 */

// see example loading of fonts for pdfkit: https://github.com/foliojs/pdfkit/tree/master/examples/webpack
import fs from 'fs'; // virtual pdfkit filesystem as replacement of node

import { DocData } from './Doc'
import { PageData, ContainerData } from './internal'

import type { PDFDocument, PDFPage } from '@types/pdfkit'
import BlobStream from 'blob-stream'

import { arrayBufferToBase64 } from './utils'

// all fonts in pdfkit: 
// Courier-Bold.afm Courier-BoldOblique.afm Courier-Oblique.afm Courier.afm Helvetica-Bold.afm Helvetica-BoldOblique.afm Helvetica-Oblique.afm Helvetica.afm Symbol.afm Times-Bold.afm Times-BoldItalic.afm Times-Italic.afm Times-Roman.afm ZapfDingbats.afm
import Helvetica from 'pdfkit/js/data/Courier.afm';
fs.writeFileSync('data/Helvetica.afm', Helvetica);

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

    init(data:DocData|Record<string,DocData>, onDone?:() => void)
    {
        this.loadPDFKit()
            .catch(this.handleFailedImport)
            .then(async () => 
            {
                this.handleSuccesImport();
                await this.run(data);
                await this._export(null);
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

    async _export(docName:string)
    {
        console.log('==== _EXPORT _ ====')
        docName = docName || Object.keys(this.docs)[0];
        const blob = this.blobs[docName];
        console.log(blob);
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

        this.activeStream = BlobStream();
        this.activePDFDoc.pipe(this.activeStream)

        // NOTE: cannot use forEach: not sequentially!
        for (const p of this.activeDoc.pages)
        {
            await this._makePage(p)
        }
        // finish by saving stream to blob
        this.activePDFDoc.end();
        this.blobs[d.name] =  this.activeStream.toBlob('application/pdf');

    }

    async _makePage(p:PageData):PDFPage
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
        for (const c of this.activePage.containers) // NOTE: cannot use forEach: not sequentially!
        {
            await this._placeContainer(c);
        }
    }

    async _placeContainer(c:ContainerData)
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
                await this._placeImage(c)
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

    /** First load the image (async) and then supply its buffer to pdfkit */
    async _placeImage(img:ContainerData)
    {
        // see docs: http://pdfkit.org/docs/images.html
        /* NOTES:
            - container width and height are relative to page width/height (if widthRelativeTo = 'page')
            - heightAbs/widthAbs are in docUnits
        */
        
        const url = img.content.main;
        const imgBuffer = await this._loadImage(url);

        const imgExt = this._getImageExt(url);

        if(imgExt)
        {
            const imgUriBase64 = `data:image/${imgExt};base64,${arrayBufferToBase64(imgBuffer)}`

            console.log(imgUriBase64);
            
            const { x, y } = this.containerToPositionPoints(img)
            
            
            this.activePDFDoc.image(
                imgUriBase64,
                x,
                y,
                {
                    // options            
                    ...this._parseImageOptions(img)
                }
            )
        }
        else {
            console.error(`DocPDFExporter:_placeImage: Error placing image at url "${url}"!`);
        }

        //const testBufferDataUri = 'data:image/png;base64,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';
        // GENERATED: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG4AAABuCAIAAABJObGsAAAN60lEQVR4nO1dQWwbxxX9IrkkTdJLiyIEMjJZ2GYayyYQyUVoQFRSJ9FBRhDAVgtYlyhBD+nBSXMKEAfJKYZVwJfCUi4tClTORbnIPlVBowJJawoIg9QuQEdSQTkoaUG0TJPmakmTXJPpYcTRarlcLndnlmrRd1qOVruDxz/z/3/zZ9iTy+Xg/yABS7c7sAfxbAUAvslW0Mftpz+uFAR0PehmDlp6oj5nIld+5oCZZXqOuxmWMXWtr03o6aJVckI9nq2uFKrxR9XVgsAJ9bb/cjbIAsBiirsc8X8U32QZ03E3M+hmIn22QTcz4DDT73VLdMEqVwrCjXQpnq1gi1MPROJiigMAt9VcqNbi2Uo8W5lb5wFgwGEe8x+I9NnG/Hby/W4H46hEDC5tPtko1fQ/bTHFnQ2y88m8uHGjVJtb5+fWeZYxjfnt5wOOiNem/10qYQSVC6nS9Xu8BhuURYqvBlzWWKZ4OcK2uocT6gup0kKqNOAwv3nUdT7oMGBWpfgCTqjPrHIv/Hnz0u08KR4BYDG1fTZ4UOXNG6XalUTh1S8fzKxyauZiPaBilZxQn1vnr98r0uh9mq8GXVYASOTKUZ8zlimq6c/s2vb1e8Wpo843j7koWSj5hy6kSue+2ppd26ZtBWi6VH8/IvTVLx8gH0UcJKlcKQhvxLKXbueJOBYFxDLFqM9ZqGp5CyfUryQK577aijeiV1IgRuXMKkejf7JYzhSRPSIXpOEJ6Fu/kigQ7BUBKjdKtTdi2dm1bf2PUglsjx25oGbMrfPnvtoi5RL1Urm0WTbMGMUoVGsBlxW7IM1YKQhTsexCqqS/S7qonFnlLsYf0XYvslhMcVGfE127rbryRU6oX7qdv3Q73/5WRWin8tLtvJGDWoJErhz22AFgPpnvyI+3wkKq9EYsq8cstMSVnFC/GM8RGdRhj129TcmGkIlc+e0TXkkGqQ3xbGUqlr0e9WoLPDumkhPqU7Esqan6csQ/0hinbdH/p4T4IzLMRK7MaYqKZIGmTm1sdkYlWR4x5pOP03wVACZDvWm+iqxvMtQbyxRR+/tD/c3/tZji3j7Rl8iVY5ni2SCL5CL90MxmB1RS4hEAPk/mEX0oEbx6Zwtd43ZZKgvVGpocxMobEWhjs4NbpxMFGjzqhE733QqIzY68kFqrvJIoEAm+ZPFJxI/mu5Mee8BlRVHOSY8dt7fCYoob8TkXUxyeNwn2aqUgTCcK08O9Ku9XZZULqRIlCUAnUDKOLtS7L/VYSJVmVtXOG+2tEn05+rrUBh/HN9GceHP8CJ4rb44fuXpnC7VvvRVWfkKar4Y9B2j0bXZt+7TXpkaNb2OVKBPoSj6jEim+imL1tFZpoy0uxnNqGGhjlbNr2wa4mpOenVUt1mrGcyVrNeN2BSBFI5Ero1RyPlkl3j1kT59G+pRvU6ISr+TRxuWIH1+HPfbJ0KHm9lYQi+qTIbUuolMsbZbn1vk3j7kU7mlJJSfUP9Cd4avE+S9+0DlXGoDZtW3l5baWf5hb52mL4aQQayjB+IIGOKGu7H7lqdwo1bqo+nSK5UZIJFbeaGAhVVIQceQH+OwasSRMDW6MH8HXIz4nThPF7QrQtsijDTNr25+1CIxkqIxnK/QSG1lokzPEQIs8ab5KI+0RA9XVyIaZMgN8xvCh/Xkyf/XO1tU7W4hHfI3b2z5BPMbp+XGEVvxIqdwo1YxfqNEPLKoXqjWWjsCBgQyzuV06wA2eJRE0yxmySOSeoMFOvqMNyM6Ye6wSVS3R6wFVYMNczhT1rOiqQTxbaY4U91jljS7xqF/OAJGoTjXtwZi7x38YdotbTJI/0+4BPaCVcfyRkiSM0Wx2u1a5UhC6ld5cCPUitTHgskZ9AEP96Bq3q0Sar6JSYCwJ0+oxACfUlzbL4vLiXSpvpLs2S2L9AgACLgbTJ25XA1RLNJ/MxzJFsqs9svhr5ok8lV2MgT6Kb97NlQHgk4g/kSt/nsyj6/lkHrWrTHuUS4GJY2mzPD28+3GHyo1SrYtLYHdzZeReuGoNZztctYbbNYB22gM7Ozx2M58dt/PNf2FYLgscEhmQ9sBe3nas8ttH3aRSp5whRixTRKK6AWkPAMQf7SYCO1R21yr1yxkY4jJBlWnPZKhXc8lRXGKVnFDvrsqrrTqjLdCyz++/f6Rwz7XRw5OhQyM+529u3dfUd1gpCINuBtBcuUrU4dCOjdsCa+ltC1kRjwAwGTp0bfSwttdhd20BoqM77LHfGD/ycTzT0ZBpJWdo64OkhAgF7c23YR4R0LUG29woPUUXFgDYfvpjx/2VA+LRbTVfGx0AAPVshkWsua3mgIsh0h9oFLI290TCI4I2NrHnsYDIRPUA84g+qmRzPvlYIXJM8TsdU6P+7v3HXVG9OSR6+0RfqzxqMnSIq9Y+im+qf9d2o9rAIv6gGW6ree6Vn0hmSTVsqrTcTqlEOlsrh6M8m4c7nFiwIZpAt1W6reYb40dkR+W10QED4uRmJHJl7HBaregWqrXlTHE5U0T3L2eKaV4XD3r3OCIeFb5JZds8G2R/faJNAYk2BFxWNE6XM8X3h/qbpY27ufK5L34AgK23wkgwfX+oX1vUxQl1ljHporItjwgKbM69EsTxOWnsTMEGLO2uFoSI16adSpU8IsiyiYIetLiouRtqYIC0AZr37XTEI0LzvHnSY0/zAm0egVohqwQarTLssXfq6QBgMnRIbJiS3dx9v5vX1hkF5H/1ep11yhayjviceMlIg27SjG4eLjPicyZyT9A1c7+zcEcl8GPRWgWNV2B0jcqAy+q2mpcbVml++JjGW6zrG+ii0334GkDgwIdCtXa3MaMHXFYUYGKOWKtZdipAe+OxK6Bkldb1+z0V4UcbI0575pOPl1unWBo8/kHGBESoxAEaAODQDLdEfU7ZmWjE57wrcqmWh7TKYpn7W9VjAwCAleA0XyXr63ZFtq4cGhX22LHP6akIJk7jGk5bWNd35AnaYxxRafQZWG6rOeyx41FGzySB/nSJDdEEACzTQ/wFyhhp7FtCHylNlAg9lSpmk+AeXQxsiCYAOM4S0wdVQpJ7WGhSCaKvCq9HEsRhsVUaP8CjPqfYh1roREIYVKfLZw6IqEQOyEiMiPIcE1fsqdDNHU1cEX1bkhItIjjdKCmwgG4qxRkYhkIZH1Ix8ACnbZIItu9/ePrzYaBQyHq8wd5OtmPk4YQSFYOqz8HAY5xsIeuAw4w3RTWo7KOy0VIWEhXDTDMSwjBxRRS6igV2/TgtMkFTcxNtiFUMMMoqQRRgArnF+hf6mqiMeG3GHEEsUTGMmSgRbN/v5LIE5Uv5+sqI17q0qVZnTvFCp6uAAJDmBYmKQTuiFMPyMG/iinXWSerYksG9R2DvUvmq74B6KtN8VQOVAHBt9LAxKoYsrOsb5eGfknra+YBD/HGX1DG/3YAxLlYxgJpM2Qpk054x/x5lfpc7dGqzzqcrQ6JiQBes8n5PRQAShawRr02iqO0xQ4nFEoeRKkYroABT/4puM1d7qGxmmiwkKkaXqNwJiTSfyAoALGOaCCpSCQDvPEdRHJWoGAZPlAiiMa79RNapozKxlJTKiaCDnmGO7M1zDJ4oMdBo0Hw0EcuYZM8jkXHZlAxTomLgTM544HycaxyQ1xGmjjplQx2ZJkqGKVExjMxzJMDTpYYTWVuZJLRaB6dhmNH9MbpBtEShIbpsZZLQisqJoIO4HixRMYxMGZuBx3hHGHCYFU5tapneSDY764RExYCuDnAQxWH4rEE1+DB8SMuRTRGvTfncrI4gVTEePqa9CKEMvESxrPqUpzG/XTkbVEq633nuICn/I6nFMEbuVQbS3FSmPSxjansmqBKVLGP6reozRZUhUTG6O7oR8HSJj21UwPRwb1utp82fI17bO8/pXQlpVjH2g1XiMb6Y2lZWgieCDjVCT3tV7d3jrM5FNImKAV3KvpthUZH2DLqZS+o8sCqB8tOIR8+kuR9UDFngJYpWhawsY/o00qdSxlV1U0dPbMZ+UDFkgZYooHXVxvWoV70NqWVn0M1cj3pV3izBPlExZKGQ9kwP93aUp3RgaINuRv0h4RgSFQP20wAH0RiXYHq4t1mRVEZnY3Yi6OiUTYmKQbUqVQMsD/NIvhTv39PAI2go6++Uzf2jYrQCCjDxdKmNR9C2Q2Ii6Lh5pl+lF+pWLYZ6iAtZNfMImjebIC/U1rs1qxj7x31joCUKljGFHTXNPIKefTuDbubmmX7l6F2iYsC+tEoAeD774OaZfp26oq4aApYxfRb1KmSWEhXDgKpUDXht/OQfp4b0CzcESqffPc6e9to+kPtR0bDHLi7N2Q8qhhgul+29iy+/Nn6SyNPIVLZEvLabZ/ol+mazirGvRvepocDcH6ZI8QgEf4mZZUwfht1jPvuVxo9FjTQF5/tBEAIAv4997+LLL42GyD6W8N4IZJ4LqdJ0ooBUDLG22nWrdLlsF35x6sIvf+ZykS/NpbLNBAl8drt9bn33Rxe6O1FSJRGB1o4dljFBrXphwNJn6p1d4zZKtW6NbgNIRKC7+QmVKU0EHUub5Vv8g79QfVkTXhoNvRgNEXQsyujJ5XLGvAkAeL7y9a3k32PJv91K0nvLqaHAi9FjL40+6/cZd1gtGEylGF9/m7r9z3Ty7sY/7qT1P+3ZUP+pocDw84dPDQVoD+RW6BqVYny38iDz72wmU/hu9YGpIvwrucXzSocXnhoKAMDw84ddLhsi0aieKmFfUPm/gf8AVBjScbJQ1QgAAAAASUVORK5CYII=
        // this.activePDFDoc.image(testBufferDataUri);
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
        const PROXY_URL = 'http://127.0.0.1:8090/proxy'
        let r = await fetch(PROXY_URL, 
            {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url : url })       
            }
        );
        console.log(r);

        return await r.arrayBuffer()
    }
    

    _parseImageOptions(img:ContainerData):Object
    {
        const w = this.relWidthToPoints(img.width);
        const h = this.relHeightToPoints(img.height);
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
        const x = this.relWidthToPoints(
                c.position[0] - ((c?.width) ? c.pivot[0] * c.width : 0)); 
        const y = this.relHeightToPoints(
                c.position[1] - ((c?.height) ? c.pivot[1] * c.height : 0)); 

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


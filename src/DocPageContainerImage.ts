import { Page, Container, ContainerData, AnyPageContainer, Pipeline, AnyShape, AnyShapeOrCollection, 
    ShapeCollection, isAnyShapeCollection, Alignment, ZoomRelativeTo, ContainerContent, ContainerAlignment, isContainerAlignment} from './internal'

import { ImageOptionsFit, isImageOptionsFit, ImageOptions} from './internal'

import { arrayBufferToBase64 } from './internal' // utils


export class Image extends Container
{
    DEFAULT_FIT:ImageOptionsFit = 'contain';
    DEFAULT_ALIGN:ContainerAlignment = ['left','top'];
    DEFAULT_BRIGHTNESS = 100;
    DEFAULT_CONTRAST = 100;
    DEFAULT_SATURATION = 1;
    DEFAULT_GRAYSCALE = 0;

    _url:string;
    _options:ImageOptions = {}

    constructor(url:string, options:ImageOptions)
    {
        super();
        this._type = 'image';
        this._url = url;
        this.setName(this.urlToName(url)); 
        this.setOptions(options);
    }

    urlToName(url:string):string
    {
        const urlElems = url.split('/');
        return urlElems[urlElems.length-1].split('.')[0]
    }

    /** Set options and defaults */
    setOptions(options:ImageOptions)
    {
        this._options.fit = isImageOptionsFit(options?.fit) ? options.fit : this.DEFAULT_FIT;
        
        // set in both options and on main container _contentAlign

        this._options.align = isContainerAlignment(options?.align) ? options.align : this.DEFAULT_ALIGN;
        this._contentAlign = this._options.align;

        this._options.brightness = (typeof options?.brightness === 'number') ? options.brightness : this.DEFAULT_BRIGHTNESS;
        this._options.contrast = (typeof options?.brightness === 'number') ? options.contrast : this.DEFAULT_CONTRAST;
        this._options.saturation = (typeof options?.brightness === 'number') ? options.contrast : this.DEFAULT_SATURATION;
        this._options.grayscale = (typeof options?.grayscale === 'number') ? options.grayscale : this.DEFAULT_GRAYSCALE;   
    }

    //// OUTPUT ////

    async toData(cache?:Record<string,any>|undefined):Promise<ContainerData> 
    {
        const format = this.getImageFormat();

        let data;
        if(format)
        {  
            data = await this.loadImageData(cache);
        }

        const containerData = {
            ...this._toContainerData(),
            content: { 
                source: this._url,
                format: format,
                data: data, 
                settings: this._options } as ContainerContent,
        }

        return containerData;
    }

    /** We want to load the raw data of the image in the ContainerContent for easy access later (in HTML and PDF exporter) */
    async loadImageData(cache?:Record<string,any>|undefined):Promise<any>
    {
        console.log('==== LOAD IMAGE DATA CALL ===');

        let data;
        if(cache && cache[this._url]) // get from cache
        {
            console.info(`DocPageContainerImage::loadImageData: Loaded image "${this._url}" data from cache`)
            data = cache[this._url];
        }
        else {
            // async load the image through a proxy (to avoid CORS issues in browser)
            const proxyUrl = this._page._doc?._settings?.proxy;
            if(!proxyUrl)
            {
                console.warn(`DocPageContainerImage::loadImageData(): No proxy given. Please supply settings with proxy url in Doc()! Querying the images directly. This might not work in the browser!`);
            }

            const fetchUrl = (proxyUrl) ? proxyUrl : this._url;
            const fetchSettings = (proxyUrl) 
                                ?  {
                                    method: 'POST',
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ url : this._url })       
                                }
                                : { 
                                    method: 'GET',
                                }
            
            // Do fetch
            try 
            {
                const r = await fetch(fetchUrl, fetchSettings);                

                if(r.status !== 200) 
                {
                    console.error(`DocPageContainerImage::loadImageData(): Could not get image. Check if it exists or proxy address: "${proxyUrl}"`)
                }
                else {
                    data = (this.getImageFormat() === 'svg') ? await r.text() : this._exportImageDataBase64(await r.arrayBuffer());                     
                    console.info(`DocPageContainerImage::loadImageData: Got data for image "${this._url}" with size ${data.length}`)
                    if (cache) cache[this._url] = data;
                }
            }
            catch(e)
            {
                console.warn(`DocPageContainerImage::loadImageData(): Could not load image at "${this._url}" fetching through proxy: "${proxyUrl}":  ERROR: "${e}".`);
            }
            

        }

        return data;
    }

    /** Export image data as DataUrl base64 string */
    _exportImageDataBase64(data:ArrayBuffer):string
    {
        return `data:image/${this.getImageFormat()};base64,${arrayBufferToBase64(data)}`
    }

    getImageFormat():'jpg'|'png'|'svg'
    {
        const urlElems = this._url.split('/');
        const file = urlElems[urlElems.length-1]
        const m = file.match(/(?<=\.)jpg|png|svg/)
        return (m) ? m[0] as 'jpg'|'png'|'svg': null;
    }

}

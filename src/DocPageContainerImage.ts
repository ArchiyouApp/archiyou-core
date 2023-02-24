import { Page, Container, AnyContainer, Pipeline, AnyShape, AnyShapeOrCollection, 
    ShapeCollection, isAnyShapeCollection, Alignment, ZoomRelativeTo, ContainerContent} from './internal'

type ImageOptionsFit = 'fill'|'contain'|'cover' // taken from CSS, see https://www.w3schools.com/css/css3_object-fit.asp
// fill is unproportianlly, contain is fit inside with margin, cover is fill proportianally

function isImageOptionsFit(o:any): o is ImageOptionsFit
{
    return ['fill','contain','cover'].includes(o);
}

export interface ImageOptions 
{
    fit?: ImageOptionsFit  
    opacity?: number // [0-100]
    brightness?:number // [0-100]
    contrast?:number // [0-100]
    saturation?:number
    grayscale?:number // [0-100]
}

export class Image extends Container
{
    DEFAULT_FIT:ImageOptionsFit = 'contain';
    DEFAULT_BRIGHTNESS = 100;
    DEFAULT_CONTRAST = 100;
    DEFAULT_SATURATION = 1;
    DEFAULT_GRAYSCALE = 0;

    _url:string;
    _options:ImageOptions = {}

    constructor(url:string, options:ImageOptions)
    {
        super('image');
        this._type = 'image';
        this._url = url;
        this.setOptions(options);
    }

    /** Set options and defaults */
    setOptions(options:ImageOptions)
    {
        this._options.fit = isImageOptionsFit(options?.fit) ? options.fit : this.DEFAULT_FIT;
        this._options.brightness = (typeof options?.brightness === 'number') ? options.brightness : this.DEFAULT_BRIGHTNESS;
        this._options.contrast = (typeof options?.brightness === 'number') ? options.contrast : this.DEFAULT_CONTRAST;
        this._options.saturation = (typeof options?.brightness === 'number') ? options.contrast : this.DEFAULT_SATURATION;
        this._options.grayscale = (typeof options?.grayscale === 'number') ? options.grayscale : this.DEFAULT_GRAYSCALE;   
    }

    //// OUTPUT ////

    toData():any // TODO
    {
        return {
            ...this._toContainerData(),
            content: { main: this._url, settings: this._options } as ContainerContent,
        }
    }

}

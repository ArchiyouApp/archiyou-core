import { Page, Container, ContainerData, ContainerContent , DocUnits, isDocUnits } from './internal'
import { convertSizeUnitsToFontPoints } from './internal'
import chroma from 'chroma-js' // direct import like in documentation does not work - fix with @types/chroma

import { TextOptions, ValueWithUnitsString } from './internal'

export class Text extends Container
{
    DEFAULT_SIZE = '7mm'; // converted to points
    DEFAULT_COLOR = 'black'; // converted to hex
    DEFAULT_TEXT_PIVOT_POSITION = [0,1]; // top left
    DEFAULT_TEXT_POSITION = [0,1]; // top left
    FONT_SIZE_TO_HEIGHT_FACTOR = 1.6; // height of container always is a bit bigger than font size

    _text:string;
    _origOptions:TextOptions = {}; // saved, to check back later, when container is added to page
    _options:TextOptions = {};

    constructor(text:string, options:TextOptions)
    {
        super();
        this._type = 'text';
        this._text = text;

        this._setDefaults();
        this._origOptions = options;
    }

    /** with Text Container width/height is less important than position and size - reflect this in setting to null by default */
    _setDefaults(): void  // overloading the function on Container
    {
        this._width = null;
        this._height = null;
        this._pivot = this.DEFAULT_TEXT_PIVOT_POSITION;
        this._position = this.DEFAULT_TEXT_POSITION;
    }

    /** Set options after added to page (overriden from parent class) */
    _onPlaced(options?:TextOptions)
    {
        options = options ?? this._origOptions ?? {};

        this._options = options; // first set, then override some

        this._setSize(  options?.size ?? this.DEFAULT_SIZE);
        this._setColor( options?.color ?? this.DEFAULT_COLOR);

        // if on page, we can make height relative to font height
        if(!this._height && this._options?.size && this._page)
        {
            // font height is container height is not set by user
            this.height(`${(this._options.size as number) * this.FONT_SIZE_TO_HEIGHT_FACTOR}pnt`);
        }
    }
    
    /** Set size of text in traditional 'points'. Real doc units (mm,cm,inch) are converted to points 
     *  NOTE: a measure relative to page height does not work here!
    */
    _setSize(size:number|string)
    {
        this._options.size = convertSizeUnitsToFontPoints(size); 
    }

    /** Convert to Color hex with chroma */
    _setColor(color:string)
    {
        // 'blue',. 
        if(chroma.valid(color))
        {
            this._options.color = chroma(color).hex();
        }
        else {
            throw new Error(`DocPageContainerText::_convertColorToHex: Cannot convert value ${color} to any color! Valid examples: 'red', [255,0,0], #FF0000`)
        }
    }

    //// OUTPUT ////

    async toData():Promise<ContainerData> // TODO
    {
        return {
            ...this._toContainerData(),
            content: { 
                data: this._text, 
                settings: this._options as TextOptions // size, color
            } as ContainerContent,
        }
    }

}

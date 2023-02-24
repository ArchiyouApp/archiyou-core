import { Page, Container, ContainerContent , DocUnits, isDocUnits } from './internal'
import { convertSizeUnitsToFontPoints } from './internal'
import chroma from 'chroma-js' // direct import like in documentation does not work - fix with @types/chroma

export interface TextOptions
{
    size?:number // saved in traditional 'point' (like in Word) - units are also allowed but converted in options
    color?:string // always converted to hex
}

export class Text extends Container
{
    DEFAULT_SIZE = '7mm'; // converted to points
    DEFAULT_COLOR = 'black'; // converted to hex
    DEFAULT_TEXT_PIVOT_POSITION = [0,1];

    _text:string;
    _options:TextOptions = {}

    constructor(text:string, options:TextOptions)
    {
        super(text);
        this._setDefaults();
        this._type = 'text';
        this._text = text;
        this.setOptions(options);
    }

    /** with Text Container width/height is less important than position and size - reflect this in setting to null by default */
    _setDefaults(): void  // overloading the function on Container
    {
        this._width = null;
        this._height = null;
        this.pivot(this.DEFAULT_TEXT_PIVOT_POSITION);
        this.position(this.POSITION_DEFAULT);
    }

    /** Set options and defaults */
    setOptions(options:TextOptions = {})
    {
        this._setSize( (options?.size) ? options.size : this.DEFAULT_SIZE);
        this._setColor((options?.color) ? options.color : this.DEFAULT_COLOR);
    }
    
    /** Set size of text in traditional 'points'. Real doc units (mm,cm,inch) are converted to points */
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

    toData():any // TODO
    {
        return {
            ...this._toContainerData(),
            content: { main: this._text, settings: this._options } as ContainerContent,
        }
    }

}

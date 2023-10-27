import { Page, Container, ContainerContent, TextOptions } from './internal'
import { TextAreaAlign, isTextAreaAlign, TextAreaOptions } from './internal'

import { convertSizeUnitsToFontPoints } from './internal'
import chroma from 'chroma-js' // direct import like in documentation does not work - fix with @types/chroma



export class TextArea extends Container
{
    DEFAULT_SIZE = '7mm'; // font size converted to points
    DEFAULT_COLOR = 'black'; // converted to hex
    DEFAULT_ALIGN:TextAreaAlign = 'left';
    DEFAULT_TEXTAREA_PIVOT_POSITION = [0,1]; // top left is most widely used as default
    DEFAULT_TEXTAREA_POSITION = [0,1]; // top left
    DEFAULT_TEXTAREA_WIDTH = '100mm'; 
    DEFAULT_TEXTAREA_HEIGHT = '60%';

    _text:string;
    _options:TextAreaOptions = {}

    constructor(text:string, options:TextAreaOptions)
    {
        super('textarea');
        this._type = 'textarea';
        this._text = text;
        this.setOptions(options);
    }

    // WARNING: some functions here use reference to page or doc, Container needs to be linked already
    _setDefaults(): void  // overloading the function on Container
    {
        this.width(this.DEFAULT_TEXTAREA_WIDTH);
        this.height(this.DEFAULT_TEXTAREA_HEIGHT);
        this.pivot(this.DEFAULT_TEXTAREA_PIVOT_POSITION);
        this.position(this.DEFAULT_TEXTAREA_POSITION);
    }

    /** Set options and defaults */
    setOptions(options:TextAreaOptions = {})
    {
        this._setSize( (options?.size) ? options.size : this.DEFAULT_SIZE);
        this._setColor((options?.color) ? options.color : this.DEFAULT_COLOR);
        this._setAlignment((options?.align) ? options.align : this.DEFAULT_ALIGN);
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

    /** Set alignment */
    _setAlignment(align:TextAreaAlign)
    {
        if(isTextAreaAlign(align))
        {
            this._options.align = align;
        }
        else {
            throw new Error(`DocPageContainerTextArea::_setAlignment: Invalid alignment '${align}. Use 'left','right','center' or 'fill'`);
        }
    }

    //// OUTPUT ////

    async toData():Promise<any> // TODO
    {
        return {
            ...this._toContainerData(),
            content: { 
                data: this._text, 
                settings: this._options 
            } as ContainerContent,
        }
    }

}

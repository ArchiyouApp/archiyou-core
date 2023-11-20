import { Page, Container, ContainerData, ContainerContent } from './internal'
import { convertSizeUnitsToFontPoints } from './internal'
import chroma from 'chroma-js' // direct import like in documentation does not work - fix with @types/chroma

import { DataRows, TableContainerOptions } from './internal'

//// MAIN CLASS ////

export class TableContainer extends Container
{
    DEFAULT_FONT_SIZE = 10; // in points
    DEFAULT_FONT_COLOR = 'black'; // converted to hex

    DEFAULT_TABLE_PIVOT_POSITION = [0,1]; // top left is most widely used as default
    DEFAULT_TABLE_POSITION = [0,1]; // top left
    DEFAULT_TABLE_WIDTH = '100mm'; 
    DEFAULT_TABLE_HEIGHT = '100mm';

    _data:DataRows; // DataRows: Array of column-values { [ {col1: val1, col2: val2 }, {...} ] }
    _options:TableContainerOptions = {}

    constructor(data:DataRows, options:TableContainerOptions)
    {
        super('table');
        this._type = 'table';
        this._data = data;
        this.setOptions(options);
    }

    /** with Text Container width/height is less important than position and size - reflect this in setting to null by default */
    // WARNING: some functions here use reference to page or doc, Container needs to be linked already
    _setDefaults(): void  // overloading the function on Container
    {
        this.width(this.DEFAULT_TABLE_WIDTH);
        this.height(this.DEFAULT_TABLE_HEIGHT);
        this.pivot(this.DEFAULT_TABLE_PIVOT_POSITION);
        this.position(this.DEFAULT_TABLE_POSITION);
    }

    /** Set options and defaults */
    setOptions(options:TableContainerOptions = {})
    {
        this._setFontSize(options?.fontsize || this.DEFAULT_FONT_SIZE);
        this._setFontColor(options?.fontcolor || this.DEFAULT_FONT_COLOR);
    }

    /** Set size of text in traditional 'points'. Real doc units (mm,cm,inch) are converted to points */
    _setFontSize(size:number|string)
    {
        this._options.fontsize = convertSizeUnitsToFontPoints(size);
    }

    /** Convert to Color hex with chroma */
    _setFontColor(color:string)
    {
        if(chroma.valid(color))
        {
            this._options.fontcolor = chroma(color).hex();
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
                data: this._data, 
                settings: this._options 
            } as ContainerContent,
        }
    }

}

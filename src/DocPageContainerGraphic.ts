import { Page, Container, ContainerData, ContainerContent, DocUnits } from './internal'
import { convertSizeUnitsToFontPoints } from './internal'
import chroma from 'chroma-js' // direct import like in documentation does not work - fix with @types/chroma

import { DocGraphicType, DocGraphicInputBase, DocGraphicInputRect, DocGraphicInputCircle, DocGraphicInputLine } from './internal'

//// MAIN CLASS ////

export class GraphicContainer extends Container
{
    DEFAULT_GRAPHIC_UNITS = 'mm' as DocUnits;
    DEFAULT_GRAPHIC_PIVOT = [0.5,0.5]; // for graphics it intuitive to have pivot at center

    _options:DocGraphicInputBase|DocGraphicInputRect|DocGraphicInputCircle|DocGraphicInputLine;

    constructor(type:DocGraphicType, input:DocGraphicInputBase|DocGraphicInputRect|DocGraphicInputCircle|DocGraphicInputLine)
    {
        super(); 
        this._type = 'graphic'; // main type
        this.setOptions({ 
                            ...input, 
                            type: type 
                        }); // give type of graphic to settings
    }

    /** Set options and defaults */
    setOptions(input:DocGraphicInputBase|DocGraphicInputRect|DocGraphicInputCircle|DocGraphicInputLine)
    {
        this._options = input; // NOTE: leave tests up to Doc.rect(), Doc.line() etc
        this._options.units = this._options.units || this.DEFAULT_GRAPHIC_UNITS; // unless given by user, we use mm as units for this graphic
        this.pivot(this.DEFAULT_GRAPHIC_PIVOT);
    }

    //// OUTPUT ////

    async toData():Promise<ContainerData> // TODO
    {
        return {
            ...this._toContainerData(),
            content: {
                data: this._options?.data, // TODO? Things like filled data in graphic  
                settings: this._options
            } as ContainerContent,
        }
    }

}

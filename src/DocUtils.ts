
/**
 *  DocUtils.ts
 *      Utility functions related to handling documents with Doc module
 *  
 */

import { isDocUnits } from './internal'


export const POINTS_TO_DOC_UNITS = {
    'mm' :  1/72*25.4,
    'cm' : 1/72*25.4/10,
    'inch' : 1/72,
}

/** Convert value with units to font point size */
export function convertSizeUnitsToFontPoints(size:number|string):number
{
    const UNITS_TO_POINTS = {
        'mm' : 1/25.4 * 72,
        'cm' : 10*1/25.4 * 72,
        'inch' : 72, 
    }

    if (typeof size === 'number')
    {
        // assume size is already given in points
        return size;
    }
    else if(typeof size === 'string')
    {
        const m = size.match(/([\d\.]+)([^$]*)/)
        if(!m){ throw new Error(`DocPageContainerText::_convertSizeUnitsToPoints: Cannot conver string ${size} to font points!`)};
        
        m[2] = (m[2] === '"') ? 'inch' : m[2]; // convert '"' to plain 'inch'
        
        if(!m[2] || m[2] === 'pt'){ return parseFloat(size) } // no units or pt given, return points

        if (!isDocUnits(m[2])){ throw new Error(`DocPageContainerText::_convertSizeUnitsToPoints: Cannot conver given units ${m[2]} to font points! Use 'mm','cm' or '"'/'inch'`) };
        return UNITS_TO_POINTS[m[2]] * parseFloat(m[1])
    }
    else {
        throw new Error(`DocPageContainerText::_convertSizeUnitsToPoints: Cannot convert given size ${size} to font points!`);
    }
    
}

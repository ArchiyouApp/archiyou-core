/**
 * 
 *  utils.ts
 * 
 */


import {isCoordArray, isAnyShape, isPointLike, PolarCoord, DocUnits, isDocUnits, ModelUnits} from './internal'

type Units = DocUnits | ModelUnits

//// Working with types ////

export function flattenEntitiesToArray(entities:any):Array<any>
{
    let flattenedEntities = [];
    if (Array.isArray(entities))
    {
        entities.forEach( e => 
        {
            if(Array.isArray(e) && !isCoordArray(e) && e.every(s => isAnyShape(s) || isPointLike(s)) )
            {
                flattenedEntities = flattenedEntities.concat(e);
            }
            else {
                flattenedEntities.push(e);
            }
        })
    }
    else {
        flattenedEntities.push(entities); // single entity
    }

    return flattenedEntities;
}

/** Alternative to the above. Faster? */
export function flattenEntities(arr:Array<any>)
{
    return arr.reduce((new_array, next) => {
        if ( next instanceof Array && !isCoordArray(next)  ) 
            new_array.push(...flattenEntities(next));
        else { 
            // if the element is not an array, it does not need expansion and can be pushed immediately
            new_array.push(next);
        }
        //return the array to the next call of the reduce lambda
        return new_array;
    }, []);
}


 
//// Working with numbers ////

// see: https://github.com/sindresorhus/round-to
export function roundTo(number:number, precision:number):number
{
	if (typeof number !== 'number') {
		throw new TypeError('Expected value to be a number');
	}

	if (precision === Number.POSITIVE_INFINITY) {
		return number;
	}

	if (!Number.isInteger(precision)) {
		throw new TypeError('Expected precision to be an integer');
	}

	const power = 10**precision;


	let result = Math.round(number * power)/power;

	return result;
}


/** Round to 3 decimals (standard for AY ) */
export function roundToTolerance(n:number):number
{
    const DECIMALS = 3; 
    return roundTo(n, DECIMALS);
}

export function toDeg(r:number):number
{
    return r * 180.0/Math.PI;
}

export function toRad(d:number):number
{
    return d * Math.PI/180.0;
}

export function isNumeric(x:any):boolean
{
    if (typeof x == 'number' ) return true;
    else if (typeof x != "string") return false; // we only process strings!  
    return !isNaN(x as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(x)) // ...and ensure strings of whitespace fail
}

export function rangeArray(min:number,max:number):Array<number>
{
    return Array.from(Array(max + 1).keys()).slice(min, max + 1)
}

export function ColorHexToInt(rrggbb):number
{
    rrggbb = rrggbb.replace('#', ''); // remove # if present
    let bbggrr = rrggbb.substr(4, 2) + rrggbb.substr(2, 2) + rrggbb.substr(0, 2);
    return parseInt(bbggrr, 16);
}

//// working with Coordinates and Points ////


/** Test is a given parameter is a relative (cartesian) coordinate */
export function isRelativeCartesianCoordString(s:any): boolean
{
    if (typeof s !== 'string')
    {
        return false
    }
    else {
        return isNumeric(s.replace('+', '').replace('-', ''))
    }
}

/** Transform cartesian or polar relative string coordinate to a real number */
export function relativeCoordToNumber(s:any): number
{
    let n = parseFloat(s) || parseInt(s);   
    return !isNaN(n) ? n : null;
}

export function parseRelativePolarCoordString(s:any): PolarCoord
{
    const RE_POLAR_COORD = /([0-9\.]+)(<<?)([+-]?[0-9\.]+)/; // 100<20 or 20<-360 or 30<<-30
    if (typeof s !== 'string')
    {
        return null
    }
    else {
        let m = s.match(RE_POLAR_COORD);
        return (m != null) ? { 
            length: relativeCoordToNumber(m[1]), 
            angle: relativeCoordToNumber(m[3]), 
            relativeAngle: (m[2] == '<<') } : null; 
    }
}

export function isRelativeCoordString(s:any):boolean
{
    return (isRelativeCartesianCoordString(s) || (parseRelativePolarCoordString(s) != null));
}

/** duplicate values in array a n number of times
 *  doubleArrayValue([1,0],1) ==> [1,1,0,0]
 * */
export function replicateArrayValues(array:Array<any>, n:number)
{
    let newArr = [];
    array.forEach( v =>
    {
        newArr.push(v);
        for(let c = 0; c < n; c++)
        {
            // replicate 1 time, 2 times etc.
            newArr.push(v); 
        }
    })

    return newArr;
}

/** Generate array of integers from start and including end */
export function intRange(start:string|number,end:string|number)
{
    if (typeof(start) == 'string'){ start = parseInt(start )};
    if (typeof(end) == 'string'){ end = parseInt(end )};

    if (end < start)
    {
        return [];
    }
    if (end == start)
    {
        return [end];
    }

    let size = end as number - start as number + 1;
    return Array.from(Array(size).keys()).map( i => i + (start as number));
}

/** Convert a value between units of measure */
export function convertValueFromToUnit(v:number, from:Units, to:Units):number
{
    const INCH_TO_MM = 25.4;
    const MM_TO_INCH = 0.0393700787;

    if( typeof v !== 'number'){ console.warn(`utils::convertValueFromToUnit(): Please supply a number!`); return null; }
    if(!isDocUnits(from) || !isDocUnits(to)){ console.warn(`utils::convertValueFromToUnit(): Please supply valid from/to units ('mm', 'cm', 'inch'). Got "${from}"=>"${to}"`); return null; } 

    if(from === to)
    {
        return v;
    }
    else if(from === 'inch')
    {
        if(to === 'mm'){ return v*INCH_TO_MM }
        if(to === 'cm'){ return v*INCH_TO_MM/10 }
    }
    else if(from === 'cm')
    {
        if(to === 'mm'){ return v*10 }
        if(to === 'inch'){ return v*10*MM_TO_INCH }
    }
    else if(from === 'mm')
    {
        if(to === 'cm'){ return v/10 }
        if(to === 'inch'){ return v*10*MM_TO_INCH }
    }

    console.warn(`Doc::_convertValueFromToUnit(): Could not convert. Check values for from ("${from}") and to ("${to}")!`);
    return null;
}

//// DATA ENCODING ////

// taken from https://github.com/niklasvh/base64-arraybuffer/blob/master/src/index.ts
export const arrayBufferToBase64 = (arraybuffer: ArrayBuffer): string => 
{
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    let bytes = new Uint8Array(arraybuffer),
        i,
        len = bytes.length,
        base64 = '';

    for (i = 0; i < len; i += 3)
    {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
    }

    if (len % 3 === 2) {
        base64 = base64.substring(0, base64.length - 1) + '=';
    } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + '==';
    }

    return base64;
};
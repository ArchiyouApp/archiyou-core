/**
 * 
 *  utils.ts
 * 
 */

import { sha256 } from '@noble/hashes/sha256'; // NOTE: use version pinning in this library: @noble/hashes@1.4.0
import { bytesToHex } from '@noble/hashes/utils';

import type { ScriptParamData } from './internal';

import { isCoordArray, isAnyShape, isPointLike, PolarCoord, Units, isDocUnits, isDocUnitsWithPerc,
        ScriptParam, isScriptParamData, isScriptParam, UnitsWithPerc, ScriptOutputDataWrapper,
        } from './internal'

//// PARAMS ////

/** Turn data ScriptParamData into Param by recreating functions 
 *  NOTE: ScriptParamData is used as data - internally make sure to use Param
*/
export function ScriptParamDataToParam(param:ScriptParam|ScriptParamData):ScriptParam
{
    if(!isScriptParamData(param))
    {
        console.warn(`ParamManager::ScriptParamDataToParam: param "${param.name}" already a Param!`)
        return param; // return original
    }

    const funcBehaviours = {};
    if(param?._behaviours && typeof param?._behaviours === 'object')
    {
        for( const [propName, funcStr] of Object.entries(param?._behaviours))
        {   
            funcBehaviours[propName] = new Function('return ' + funcStr)();
        }
    }

    const newParam = { 
        ...param, 
        _behaviours : funcBehaviours, 
    } as ScriptParam;

    return newParam;
}

/** Turn param into ScriptParamData */
export function paramToScriptParamData(param:ScriptParam|ScriptParamData):ScriptParamData
{
    if(!isScriptParam(param)){ console.error(`ParamManager:ScriptParamToScriptParamData. Please supply a valid Param. Got: "${JSON.stringify(param)}"`); } 
    if(isScriptParamData(param)){ return param }; // already ScriptParamData

    const behaviourData = {};
    for(const [k,v] of Object.entries(param?._behaviours || {})){ behaviourData[k] = v.toString(); }
    const ScriptParamData = { ...param } as ScriptParamData; 
    // remove all private fields (_{{prop}})
    Object.keys(ScriptParamData)
        .filter(prop => prop[0] === '_')
        .forEach((private_prop) => delete ScriptParamData[private_prop]);

    ScriptParamData._behaviours = behaviourData; // TODO: remove _
    
    return ScriptParamData
}

//// WORKING WITH TYPES ////

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
    return arr.reduce((newArray, next) => {
        if ( next instanceof Array && !isCoordArray(next)  ) 
            newArray.push(...flattenEntities(next));
        else { 
            // if the element is not an array, it does not need expansion and can be pushed immediately
            newArray.push(next);
        }
        //return the array to the next call of the reduce lambda
        return newArray;
    }, []);
}

//// CRYPTO ////

/** Export sha256 hasing function */
// TODO: use in Script.getVariantId
export function hash(s:string):string
{
    if(typeof s !== 'string') throw new Error('Input must be a string');
    const message = new TextEncoder().encode(s);
    const hash = sha256(message);
    return bytesToHex(hash);
}


//// WORKING WITH NUMBERS ////

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

/** Round to step size */
export function roundToStep(n:number, step:number, start:number):number
{
    return Math.ceil((n - start) / step ) * step + start;
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

export function isBoolean(x:any):boolean
{
    return x === false || x === true;
}

/** Used for Calc excel export */
export function getTypeClass(x:any):StringConstructor|NumberConstructor|BooleanConstructor
{
    return (isNumeric(x)) ? Number
                : (isBoolean(x)) ? Boolean
                    : String
}

export function rangeArray(min:number,max:number):Array<number>
{
    return Array.from(Array(max + 1).keys()).slice(min, max + 1)
}

/** String hex (#FF0000) to int 
 *  WARNING: This seems to generate wrong numbers
*/
export function colorHexToInt(rrggbb:string):number
{
    rrggbb = rrggbb.replace('#', ''); // remove # if present
    let bbggrr = rrggbb.substr(4, 2) + rrggbb.substr(2, 2) + rrggbb.substr(0, 2);
    return parseInt(bbggrr, 16);
}

export function colorIntToHex(c?:number):string
{
    return (c ?? true ) ? null : "#" + c.toString(16).padStart(6, '0');
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
export function convertValueFromToUnit(v:number, from:UnitsWithPerc, to:UnitsWithPerc, relativeToNum?:number):number
{
    // convert incoming string if numeric
    if (typeof v === 'string' && isNumeric(v))
    {
        v = parseFloat(v);
    }

    const INCH_TO_MM = 25.4;
    const MM_TO_INCH = 0.0393700787;
    const INCH_TO_PNT = 72;

    if( typeof v !== 'number'){ console.warn(`utils::convertValueFromToUnit(): Please supply a number!`); return null; }
    
    if((from === '%' || to === '%') && !relativeToNum ){ console.warn(`utils::convertValueFromToUnit(): Converting from/to % is not supported without a number to which we relate to! Returned original`); return v; } 
    if(!isDocUnitsWithPerc(from) || !isDocUnitsWithPerc(to)){ console.warn(`utils::convertValueFromToUnit(): Please supply valid from/to units ('mm', 'cm', 'inch'). Got "${from}"=>"${to}". Returned original`); return v; } 

    if(from === to)
    {
        return v;
    }
    else if(from === 'inch')
    {
        if(to === 'mm'){ return v*INCH_TO_MM }
        if(to === 'cm'){ return v*INCH_TO_MM/10 }
        if(to === 'pnt'){ return v*INCH_TO_PNT }
        if(to === '%'){ return v/relativeToNum*100 }
    }
    else if(from === 'cm')
    {
        if(to === 'mm'){ return v*10 }
        if(to === 'inch'){ return v*10*MM_TO_INCH }
        if(to === 'pnt'){ return v/10*MM_TO_INCH*INCH_TO_PNT }
        if(to === '%'){ return v/relativeToNum*100 }
    }
    else if(from === 'mm')
    {
        if(to === 'cm'){ return v/10 }
        if(to === 'inch'){ return v*10*MM_TO_INCH }
        if(to === 'pnt'){ return v*MM_TO_INCH*INCH_TO_PNT }
        if(to === '%'){ return v/relativeToNum*100 }
    }
    else if(from === 'pnt')
    {
        if(to === 'mm'){ return v/INCH_TO_PNT*INCH_TO_MM }
        if(to === 'cm'){ return v/INCH_TO_PNT*INCH_TO_MM/10 }
        if(to === 'inch'){ return v/INCH_TO_PNT }
        if(to === '%'){ return v/relativeToNum*100 }
    }
    else if(from === '%')
    {
        if(to === 'mm'){ return v/100*relativeToNum }
        if(to === 'cm'){ return v/100*relativeToNum }
        if(to === 'pnt'){ return v/100*relativeToNum }
        if(to === 'inch'){ return v/100*relativeToNum }
    }

    console.warn(`Doc::_convertValueFromToUnit(): Could not convert. Check values for from ("${from}") and to ("${to}")!`);
    return null;
}

export function pointsToMm(p:number):number
{
    return p*1/72*25.4;
}

export function mmToPoints(m:number):number
{
    return m/25.4*72
}

//// DATA ENCODING ////

 /**
 * Convert a string value to its native type if possible.
 * - "true"/"false" (case-insensitive) => boolean
 * - Numeric strings => number
 * - Otherwise, return as string
 */
export function convertStringValue(value: string): string | number | boolean {
    if (typeof value !== 'string') return value;
    const lower = value.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    if (!isNaN(Number(value)) && value.trim() !== '') return Number(value);
    return value;
}

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

export function isBrowser():boolean
{
    return typeof window === 'object';
}

export function isWorker():boolean
{
    return (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
} 

/** A simple uuid4 method */
export function uuidv4(): string 
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = Math.random() * 16 | 0; // Generate a random number between 0 and 15
        const value = char === 'x' ? random : (random & 0x3 | 0x8); // Use 4 for the version and 8-11 for the variant
        return value.toString(16); // Convert to hexadecimal
    });
}

//// ENCODING BINARY DATA ////

/**
 * Recursively transforms binary data in an object to base64 strings for JSON serialization
 *  We use an instance of ScriptOutputDataWrapper to keep track of original type and length for easy decoding
 * 
 * @param obj - The object to transform
 * @param maxDepth - Maximum recursion depth to prevent infinite loops (default: 10)
 * @param currentDepth - Current recursion depth (internal use)
 * @returns Transformed object with binary data as base64 strings
 */
export function convertBinaryToBase64<T>(obj: T, maxDepth: number = 10, currentDepth: number = 0): number|string|Array<any>|Object|ScriptOutputDataWrapper
{
    // Prevent infinite recursion
    if (currentDepth >= maxDepth) {
        console.warn('convertBinaryToBase64: Maximum recursion depth reached');
        return obj;
    }

    // Handle null or undefined
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle ArrayBuffer
    if (obj instanceof ArrayBuffer) 
    {
        return {
            type: 'ArrayBuffer',
            encoding: 'base64',
            data: arrayBufferToBase64(obj),
            length: obj.byteLength
        } as ScriptOutputDataWrapper;
    }

    // Handle Uint8Array and other TypedArrays
    if (obj instanceof Uint8Array || obj instanceof Int8Array || 
        obj instanceof Uint16Array || obj instanceof Int16Array ||
        obj instanceof Uint32Array || obj instanceof Int32Array ||
        obj instanceof Float32Array || obj instanceof Float64Array) {
        return {
            type: obj.constructor.name,
            encoding: 'base64',
            data: arrayBufferToBase64(obj.buffer.slice(obj.byteOffset, obj.byteOffset + obj.byteLength) as ArrayBuffer),
            length: obj.length
        } as ScriptOutputDataWrapper;
    }
 
    // Handle Buffer (Node.js)
    if (typeof Buffer !== 'undefined' && obj instanceof Buffer) {
        return {
            type: 'Buffer',
            encoding: 'base64',
            data: obj.toString('base64'),
            length: obj.length
        } as ScriptOutputDataWrapper;
    }

    // Don't do functions
    if (typeof obj === 'function')
    { 
        console.warn('convertBinaryToBase64: Function serialization is not supported!');
    }

    // Handle original primitives
    if (typeof obj !== 'object')
    { 
        return obj;
    }

    // Arrays - resurse
    if (Array.isArray(obj))
    {
        return obj.map(item => convertBinaryToBase64(item, maxDepth, currentDepth + 1));
    }


    // Object
    if(typeof obj === 'object')
    {
        // Avoid any instances of classes
        if (Object.getPrototypeOf(obj) !== Object.prototype)
        {
            console.warn('convertBinaryToBase64: Class instances are not supported! Returned null');
            return null;
        }

        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            // Skip non-enumerable properties and functions (unless explicitly handling them above)
            if (typeof value === 'function') {
                continue; // Skip functions in objects unless we want to serialize them
            }
            result[key] = convertBinaryToBase64(value, maxDepth, currentDepth + 1);
        }
        return result;
    }


    
}



/**
 * Restores binary data from base64 strings after JSON parsing
 * @param obj - The object to restore
 * @returns Object with restored binary data
 */
export function restoreBinaryFromBase64(obj: ScriptOutputDataWrapper, forceBuffer: boolean=false): Buffer|ArrayBuffer|Uint8Array|null
{
    if (obj === null || obj === undefined) 
    {
        console.error('utils::restoreBinaryFromBase64(): Invalid input');
        return null;
    }
    console.info(`utils::restoreBinaryFromBase64(): Restoring to binary "${obj?.type}" with length ${obj?.length}`);

    // Handle primitives
    if (typeof obj !== 'object') 
    {
        return obj;
    }
    // Check if this is a serialized binary object
    if (obj.type && obj.data !== undefined)
    {
        switch (obj.type)
        {
            case 'ArrayBuffer':
                const binaryString = atob(obj.data);
                const buffer = new ArrayBuffer(binaryString.length);
                const view = new Uint8Array(buffer);
                for (let i = 0; i < binaryString.length; i++) {
                    view[i] = binaryString.charCodeAt(i);
                }
                return (forceBuffer) 
                        ? Buffer.from(buffer)
                        : buffer as any;
            case 'Uint8Array':
                const b = restoreBinaryFromBase64({ type: 'ArrayBuffer', data: obj.data, length: obj.length }) as ArrayBuffer;
                const u8 = new Uint8Array(b, 0, obj.length)
                return (forceBuffer) 
                        ? Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)
                        : u8;
            case 'Buffer':
                if (typeof Buffer !== 'undefined')
                {
                    return Buffer.from(obj.data, 'base64') as any;
                }
                break;

            default:
                console.warn(`restoreBinaryFromBase64: Unknown type ${obj.type}`);
                return null;
        }
    }
    // Handle Arrays
    if (Array.isArray(obj)) {
        return obj.map(item => restoreBinaryFromBase64(item)) as any;
    }
    // Handle plain objects
    const result: any = {};
    for (const [key, value] of Object.entries(obj))
    {
        result[key] = restoreBinaryFromBase64(value);
    }

    return result;
}

/**
 * Converts a record object to a URL parameter string.
 * Example: { foo: 'bar', baz: 1 } => 'foo=bar&baz=1'
 * @param params Record<string, any>
 * @returns URL parameter string
 */
export function recordToUrlParams(params: Record<string, any>): string {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
}

/**
 * Converts a URL parameter string to a record object.
 * Example: 'foo=bar&baz=1' => { foo: 'bar', baz: '1' }
 * @param paramString URL parameter string
 * @returns Record<string, string>
 */
export function urlParamsToRecord(paramString: string): Record<string, string> {
    const params: Record<string, string> = {};
    if (!paramString) return params;
    paramString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    });
    return params;
}

 /**
 * Converts a data object to a JS module string with export default,
 * each key on a separate line for readability.
 * @param data The data object to export
 * @returns JS module string
 * 
*  This is used to write script.js files in the Library
 */
export function dataToModuleString(data: Record<string, any>): string {
    function serialize(val: any, indent: string = '  '): string {
        if (typeof val === 'string')
        {
            if (val.includes('${')) val = val.replace(/\$\{/g, '\\${'); // Escape ${...} to prevent evaluation when imported
            // Use backticks for multiline strings or strings with backticks
            if (val.includes('\n')) return '`' + val.replace(/`/g, '\\`') + '`';
            // Otherwise just use JSON.stringify which results in double quotes
            return JSON.stringify(val);
        }
        if (typeof val === 'number' || typeof val === 'boolean' || val === null)
        {
            return String(val);
        }
        if (Array.isArray(val))
        {
            if (val.length === 0) return '[]';
            return '[\n' + val.map(v => indent + serialize(v, indent + '  ')).join(',\n') + '\n' + indent.slice(2) + ']';
        }
        if (typeof val === 'object' && val !== null)
        {
            const entries = Object.entries(val);
            if (entries.length === 0) return '{}';
            // Don't stringify keys, assume they are valid identifiers
            return '{\n' + entries.map(([k, v]) => `${indent}${k}: ${serialize(v, indent + '  ')}`).join(',\n') + '\n' + indent.slice(2) + '}';
        }
        return undefined;
    }

    return `export default ${serialize(data)};\n`;
}

//// FUNCTIONS ////

export function _getArgNames(func:any):Array<string>
{
     // taken from: https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically?page=1&tab=votes#tab-top
     var STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
     const ARGUMENT_NAMES = /([^\s,]+)/g;
     
     let fnStr = func.toString().replace(STRIP_COMMENTS, '');
     let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
     if(result === null)
         result = [];
     return result;
}

export function analyzeFunc(func:(any) => any)
    : { argCount: number, argNames: string[], isAsync: boolean, 
        hasMainScopeParam: boolean, returnsPromise: boolean }
{
    const funcStr = func.toString();
    
    // Get argument names (reuse your existing logic)
    const argNames = _getArgNames(func);
    
    // Check if async
    const isAsync = funcStr.startsWith('async ') || funcStr.includes('async function');
    
    // Check if first parameter looks like mainScope
    const hasMainScopeParam = argNames.length > 0 && 
        (argNames[0].toLowerCase().includes('scope') || argNames[0] === 'mainScope');
    
    // Detect return statements and promises
    const returnMatches = funcStr.match(/return\s+([^;}\n]+)/g) || [];
    const returnsPromise = isAsync || returnMatches.some(r => r.includes('Promise'));
    
    return {
        argCount: argNames.length,
        argNames,
        isAsync,
        hasMainScopeParam, // this is indicative
        returnsPromise
    };
}
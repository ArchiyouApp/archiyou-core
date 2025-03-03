/** 
 *  Decorators for Geom API 
 *  
 *      See TS docs: https://www.typescriptlang.org/docs/handbook/decorators.html
 *      or https://blog.logrocket.com/a-practical-guide-to-typescript-decorators/
 * 
 * */

// Only needed for caching geometry which we disabled
// import SparkMD5 from 'spark-md5' // this is used instead of hash-wasm because spark is not async. See: https://www.npmjs.com/package/spark-md5

import { Point, Vector, Shape, Vertex, Edge, Wire, Face, Shell, Solid, ShapeCollection, VertexCollection, Sketch, Geom } from './internal'
import { isPointLike, isPivot, isAxis, isColorInput, isMainAxis, isSide, isCursor, isObjStyle, isLinearShape, isLinearShapeTail, isShapeType, isShapeTypes,
            isAnyShape, isPointLikeOrVertexCollection, isPointLikeSequence,isPointLikeOrAnyShape,  isAnyShapeSequence, isAnyShapeCollection, isMakeShapeCollectionInput, isAnyShapeOrCollection, isPointLikeOrAnyShapeOrCollection,
            isMakeWireInput, isMakeFaceInput, isAlignment, isMakeShellInput, isThickenDirection, isAnyShapeOrCollectionOrSelectionString,
            isSelectionString, isPointLikeOrAnyShapeOrCollectionOrSelectionString, isSelectorPointRange,
            isLayoutOptions, ModelUnits, isModelUnits, isDimensionOptions, isDimensionLevelSettings, isOrientationXY, isAnnotationAutoDimStrategy,
            isBeam, isBeamBaseLineAlignment } from './internal'

import { SHAPE_CACHE_ENABLED } from './internal' // constants
import { isNumeric } from './internal'
import { ALL_SHAPE_NAMES, SIDES, ALIGNMENTS_ADD_TO_SIDES } from './internal'


//// SETTINGS ////

const OC_CRASH_MESSAGE = `GEOMETRY CORE ERROR: Error during Shape generation. Please check the following for a solution: `
 
//// END SETTINGS ////

//// LOCAL TYPES ////

interface errorMessage {
    possible: Array<string>, // possible value types for this check
    hint?:string,
}

interface DecoratorCheckInfo
{
    name?:string,
    obj:any, // The real TS class or typeguard
    check:any, // any Class, typeguard or other function
    errorMessage:errorMessage,
    transformInput: any, // any function or Class 
}

function _getDecoratorTargetInfo(decoratorTarget:any):DecoratorCheckInfo
{
    // !!!! IMPORTANT: these settings need to be in a function, because at start some of the Shape constructors don't seem to be loaded! !!!!
    // !!!! Also we allow strings because of the same circular import problems !!!!

    const DECORATOR_TARGET_TO_CHECK_INFO: {[key:string]: DecoratorCheckInfo } = {
        'Boolean' : {
            name: 'Boolean',
            obj: Boolean,
            check: (v) => typeof(v) === 'boolean',
            errorMessage: { possible: ['true', 'false'] },
            transformInput: Boolean, // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
        },
        'Number': {
            name: 'Number',
            obj: Number,
            check: isNumeric,
            errorMessage: { possible: ['Number'] },
            transformInput : Number,
        },
        'Number.isInteger' :
        {
            name: 'Integer',
            obj: Number.isInteger,
            check: Number.isInteger,
            errorMessage: { possible: ['Integer'] },
            transformInput: parseInt,
        },
        'String' : {
            name: 'String',
            obj: String,
            check: 'string', // typeof
            errorMessage: { possible: ['String'] },
            transformInput : String,
        },
        'Array': {
            name: 'Array',
            obj: Array,
            check: Array, // instanceof
            errorMessage: { possible: ['Array'] },
            transformInput : Array, // Array = function(input)
        },
        'Side' : {
            name: 'Side',
            obj: isSide,
            check: isSide,
            errorMessage: { possible: SIDES },
            transformInput : null
        },
        'isPointLike' : {
            name: 'PointLike',
            obj: isPointLike,
            check: isPointLike, // function
            errorMessage:  { possible: [ "[x,y,z] or ['+x','-y','+z']", 'Point', 'Vector', 'Vertex'] },
            transformInput: v => Point.fromPointLike(v),  // NOTE: we cannot use Point.fromPointLike directly because its not yet loaded here!
        },
        'Vector' : {
            name: 'Vector',
            obj: Vector,
            check: Vector, // instanceof   
            errorMessage: { possible: ['Vector'] },
            transformInput: v => Vector.fromPointLike(v) // 
        },
        'Point' : {
            name: 'Point',
            obj: Point,
            check: Point, // instanceof   
            errorMessage: { possible: ['Vector'] },
            transformInput: v => Point.fromPointLike(v), 
        },
        'isAlignment' : 
        {
            name: 'Alignment',
            obj: isAlignment,
            check: isAlignment,
            errorMessage: { possible: SIDES.concat(ALIGNMENTS_ADD_TO_SIDES)  }, // TODO: get from types
            transformInput: null, 
        },
        'isAxis' : 
        {
            name: 'Axis',
            obj: isAxis,
            check: isAxis,
            errorMessage: { possible: ['x','y', 'z', 'xy', 'yz', 'xz'] }, // TODO: get from types
            transformInput: null, 
        },
        'isMainAxis' :
        {
            name: 'MainAxis',
            obj: isMainAxis,
            check: isMainAxis,
            errorMessage: { possible: ['x','y', 'z'] }, // TODO: get from types
            transformInput: null, // no a target
        },
        'isOrientationXY' : 
        {
            name: 'OrientationXY',
            obj: isOrientationXY,
            check: isOrientationXY,
            errorMessage: { possible: ['horizontal', 'vertical'] },
            transformInput: null,
        },
        'isPivot' : {
            name: 'Pivot',
            obj: isPivot,
            check: isPivot,
            errorMessage: {  
                possible: [ 'Array of relative ("+10") of absolute coordinates', 'Point', 'Vector', 'Vertex', 'combinations of left|right|top|bottom|left|right'] 
            },
            transformInput: null, // Pivot is not used as uniformize target
        },
        'isPointLikeSequence' : {
            name: 'PointLikeSequence',
            obj: isPointLikeSequence,
            check: isPointLikeSequence, // function
            errorMessage: { 
                possible: ['(PointLike, PointLike) and no other arguments', 'Array<PointLike>', 'Shape', 'ShapeCollection'], 
                hint: 'Also make sure you provide one or more points!' },
            transformInput: null, // isPointLikeSequence not used as target
        },
        'isObjStyle' : {
            name: 'ObjStyle',
            obj: isObjStyle,
            check: isObjStyle, // function
            errorMessage: { 
                possible: ['{ point: BaseStyle:{ color?, opacity?, style? }, line : BaseStyle, fill: BaseStyle'] },
            transformInput: null, // no target
        },
        'isColorInput': 
        {
            name: 'ColorInput',
            obj: isColorInput,
            check: isColorInput,
            errorMessage: {
                possible: ['color names: blue, red, green', 'hex: #FF0000']
            },
            transformInput: null, 
        },
        'isShapeType' :
        {
            name: 'ShapeType',
            obj: isShapeType,
            check: isShapeType,
            errorMessage: { 
                possible: ALL_SHAPE_NAMES },
            transformInput: null, // isPointLikeSequence not used as target
        },
        'isShapeTypes' :
        {
            name: 'ShapeTypes',
            obj: isShapeTypes,
            check: isShapeTypes,
            errorMessage: { 
                possible: [`An array of ${ALL_SHAPE_NAMES}`] },
            transformInput: null, // not used as target
        },
        'Shape' : {
            name: 'Shape',
            obj: Shape,
            check: Shape, // instanceof 
            errorMessage: { possible: [ 'Shape', 'PointLike'] },
            transformInput: null, // Shape not used as target
        },
        'isAnyShape' : {
            name: 'AnyShape',
            obj: isAnyShape,
            check: isAnyShape, // instanceof 
            errorMessage: { possible: ALL_SHAPE_NAMES },
            transformInput: null,
        },
        'Vertex': {
            name: 'Vertex',
            obj: Vertex,
            check: Vertex, // instanceof
            errorMessage: { possible: [ 'Coord (number or "+-number")', 'Point', 'Vector', 'Vertex']},
            transformInput: v => Vertex.fromPointLike(v), 
        },
        'Edge': {
            name: 'Edge',
            obj: Edge,
            check: Edge, // instanceof
            errorMessage: { possible: ['Edge']},
            transformInput: null, // TODO
        },
        'Wire': {
            name: 'Wire',
            obj: Wire,
            check: Wire, // instanceof
            errorMessage: { possible: ['Wire']},
            transformInput: v => Wire.fromAll(v),
        },
        'isLinearShape': 
        {
            name: 'LinearShape',
            obj: isLinearShape,
            check: isLinearShape, 
            errorMessage: { possible: ['Edge','Wire','Face', 'Shell']},
            transformInput: null, // not used
        },
        'isPointLikeOrAnyShape':
        {
            name: 'PointLikeOrAnyShape',
            obj: isPointLikeOrAnyShape,
            check: isPointLikeOrAnyShape,
            errorMessage: { possible:  
                [ 'Array of relative ("+10") or absolute coordinates', 'Point', 'Vector', 'Vertex'].concat(ALL_SHAPE_NAMES)},
            transformInput : null,
        },
        'isLinearShapeTail': 
        {
            name: 'LinearShapeTail',
            obj: isLinearShapeTail,
            check: isLinearShapeTail, 
            errorMessage: { possible: ['start', 'end']},
            transformInput: null, // not used
        },
        'isAnyShapeOrCollection': {
            name: 'AnyShapeOrCollection',
            obj: isAnyShapeOrCollection,
            check: isAnyShapeOrCollection, // function(v)
            errorMessage: { possible: ALL_SHAPE_NAMES.concat('ShapeCollection') },
            transformInput: null, // isAnyShapeOrCollection not used as target
        },
        'isAnyShapeSequence' : {
            name: 'AnyShapeSequence', 
            obj: isAnyShapeSequence,
            check: isAnyShapeSequence,
            errorMessage: { possible: ['Array<Shape>', 'ShapeCollection'] },
            transformInput: null, // no target
        },
        'isAnyShapeCollection': {
            name: 'AnyShapeCollection',
            obj: isAnyShapeCollection,
            check: isAnyShapeCollection,
            errorMessage: {  possible: ['ShapeCollection', 'VertexCollection'] },
            transformInput: v => ShapeCollection.fromAll(v), // args are automatically combined into Array, // not used as transformation target
        },
        'isMakeShapeCollectionInput' :
        {
            name: 'MakeShapeCollectionInput', 
            obj: isMakeShapeCollectionInput,
            check: isMakeShapeCollectionInput,
            errorMessage: { possible: ['PointLike', 'PointLikeSequence', 'AnyShape', 'ShapeCollection', 'Array<PointLike|AnyShape>'] },
            transformInput: null, // no target
        },
        'ShapeCollection': {
            name: 'ShapeCollection',
            obj: ShapeCollection,
            check: ShapeCollection, // instanceof
            errorMessage: { possible: ['ShapeCollection'] },
            transformInput: v => ShapeCollection.fromAll(v), // args are automatically combined into Array
        },
        'VertexCollection': {
            name: 'VertexCollection',
            obj: VertexCollection,
            check: VertexCollection, // instanceof
            errorMessage: { possible: ['ShapeCollection', 'VertexCollection'] },
            transformInput: v => VertexCollection.fromAll(v),
        },
        'PointLikeOrVertexCollection' :
        {
            name: 'PointLikeOrVertexCollection',
            obj: isPointLikeOrVertexCollection,
            check: isPointLikeOrVertexCollection,
            errorMessage: { possible: ['Vertex','VertexCollection'] },
            transformInput: v => VertexCollection.fromAll(v),
        },
        'isPointLikeOrAnyShapeOrCollection' : 
        {
            name: 'PointLikeOrAnyShapeOrCollection', 
            obj: isPointLikeOrAnyShapeOrCollection,
            check: isPointLikeOrAnyShapeOrCollection,
            errorMessage: { possible: ALL_SHAPE_NAMES.concat(['ShapeCollection','Array of relative ("+10") or absolute coordinates', 'Point', 'Vector', 'Vertex']) },
            transformInput: null, // no target
        },
        'isMakeWireInput' :
        {
            name: 'MakeWireInput', 
            obj: isMakeWireInput,
            check: isMakeWireInput,
            errorMessage: { possible: ['PointLikeSequence', 'Shape', 'ShapeCollection', 'Array of those'] },
            transformInput: null, // no target
        },
        'isMakeFaceInput' :
        {
            name: 'MakeFaceInput', 
            obj: isMakeFaceInput,
            check: isMakeFaceInput,
            errorMessage: { possible: ['Face', 'Wire', 'PointLikeSequence', 'ShapeCollection with Edges', 'Array of Edges'] },
            transformInput: null, // no target
        },
        'isMakeShellInput' :
        {
            name: 'MakeShellInput', 
            obj: isMakeShellInput,
            check: isMakeShellInput,
            errorMessage: { possible: ['Array<Face>','ShapeCollection /w Faces'] },
            transformInput: null, // no target
        },
        'Face' :
        {
            name: 'Face', 
            obj: Face,
            check: Face,
            errorMessage: { possible: ['Face'] },
            transformInput: Face,
        },
        'Shell':
        {
            name: 'Shell', 
            obj: Shell,
            check: Shell,
            errorMessage: { possible: ['Shell'] },
            transformInput: Shell, 
        },
        'Solid':
        {
            name: 'Solid', 
            obj: Solid,
            check: Solid,
            errorMessage: { possible: ['Solid'] },
            transformInput: Solid, 
        },
        'Cursor':
        {
            name: 'Cursor',
            obj: isCursor,
            check: isCursor,
            errorMessage: { possible: ['Cursor'] },
            transformInput: null, // no target
        },
        'isThickenDirection': 
        {
            name: 'ThickenDirection',
            obj: isThickenDirection,
            check: isThickenDirection,
            errorMessage: { possible: ['all/center', 'PointLike'].concat(SIDES) },
            transformInput: null, // no target
        },
        'isAnyShapeOrCollectionOrSelectionString': 
        {
            name: 'AnyShapeOrCollectionOrSelectionString',
            obj: isAnyShapeOrCollectionOrSelectionString,
            check: isAnyShapeOrCollectionOrSelectionString,
            errorMessage: { possible: ['AnyShape', 'ShapeCollection', 'SelectorString (ex: "V||front", "E[0-2]")']  },
            transformInput: null, // no target
        },
        'isPointLikeOrAnyShapeOrCollectionOrSelectionString':
        {
            name: 'PointLikeOrAnyShapeOrCollectionOrSelectionString',
            obj: isPointLikeOrAnyShapeOrCollectionOrSelectionString,
            check: isPointLikeOrAnyShapeOrCollectionOrSelectionString,
            errorMessage: { possible: ['PointLike', 'AnyShape', 'ShapeCollection', 'SelectorString (ex: "V||front", "E[0-2]")']  },
            transformInput: null, // no target
        },
        'isSelectionString' :
        {
            name: 'SelectionString',
            obj: isSelectionString,
            check: isSelectionString,
            errorMessage: { possible: ['Any selector string: "V||front", "E|Z" (see docs!)']},
            transformInput: null,
        },
        'isSelectorPointRange': 
        {
            name: 'SelectorPointRange',
            obj: isSelectorPointRange,
            check: isSelectorPointRange,
            errorMessage: { possible: ['SelectorPointRange']},
            transformInput: null,
        },
        'isLayoutOptions':
        {
            name: 'LayoutOptions',
            obj: isLayoutOptions,
            check: isLayoutOptions,
            errorMessage: { possible: ['LayoutOptions: { margin: number, flatten: boolean, stock: string, groupSame: boolean }'] }, // TODO
            transformInput: null,
        },
        'isAnnotationAutoDimStrategy' :
        {
            name: 'AnnotationAutoDimStrategy',
            obj: isAnnotationAutoDimStrategy,
            check: isAnnotationAutoDimStrategy,
            errorMessage: { possible: ['part', 'levels'] }, 
            transformInput: null,
        },
        'isDimensionOptions':
        {
            name: 'DimensionOptions',
            obj: isDimensionOptions,
            check: isDimensionOptions,
            errorMessage: { possible: ['DimensionOptions: { units:string, offset:number, offsetVec:Vector, ortho:boolean, roundDecimals:int }'] }, 
            transformInput: null,
        },
        'isDimensionLevelSettings':
        {
            name: 'DimensionLevelSettings',
            obj: isDimensionLevelSettings,
            check: isDimensionLevelSettings,
            errorMessage: { possible: ['DimensionLevelSettings: [{ axis:mainAxis, at:number, coordType?:relative|absolute, align?:min|max|auto, minDistance?:number, offset?:number } ]'] }, 
            transformInput: null,
        },
        'isModelUnits':
        {
            name: 'ModelUnits',
            obj: isModelUnits,
            check: isModelUnits,
            errorMessage: { possible: [`ModelUnits: 'mm','cm','dm','m','km','inch','feet','yd','mi'`]},
            transformInput: null,
        },
        'isBeam':
        {
            name: 'Beam',
            obj: isBeam,
            check: isBeam,
            errorMessage: { possible: ['Beam'] },
            transformInput: null,
        },
        'isBeamBaseLineAlignment':
        {
            name: 'BeamBaseLineAlignment',
            obj: isBeamBaseLineAlignment,
            check: isBeamBaseLineAlignment,
            errorMessage: { possible: ['start|end|center|middle|number']},
            transformInput: null,
        }

    } 

    let decoratorTargetInfo;

    
    for (const [typeName, typeInfoObj] of Object.entries(DECORATOR_TARGET_TO_CHECK_INFO)) 
    {   
        if (typeInfoObj.obj == decoratorTarget || typeInfoObj.name == decoratorTarget) // we can also use strings 'ShapeCollection'
        {
            decoratorTargetInfo = typeInfoObj;
            break;
        }
    }


    if (!decoratorTargetInfo)
    {
        console.warn(`checkInput: Cannot get info decorator target: "${decoratorTarget}". Make sure you supplied a string refering to a Class or an Array [Class, defaultValue] in @checkInput()`);
        
        return null;
    }
    else {
        return decoratorTargetInfo;
    }
}


/** Uniformize a given value to a given target type (typeguard function or Class) */
function _uniformize(value:any, toType:any, fromType:any):any
{
    /*
        toType can be a string or Class
    */

    // if given string (and not a real Class obj): lookup Class Object
    if(typeof toType === 'string' && toType != 'auto')
    {
        let target = _getDecoratorTargetInfo(toType)
        if (!target)
        {
            console.warn('_uniformize: Unknown target type string "{toType}": Make sure you configure with a Class or a valid string')
            return null;
        }
        else {
            toType = target.obj; // get real object
        }
        
    }

    // value is null: don't do anything
    if(value == null)
    {
        return null;
    }
     
    // check if toType is given
    if (!toType)
    {
        console.warn(`_uniformize: Cannot uniformize input ${value} without toType`);
        return value;
    }
    // don't transform
    if (toType == 'auto' || toType === null || toType === undefined || toType === fromType)
    {
        return value;
    }
    // value is instance of toType
    else if(value instanceof toType)
    {
        return value;
    }
    else {
        let targetTypeInfo = _getDecoratorTargetInfo(toType);
        if (!targetTypeInfo)
        {
            console.warn(`_uniformize: Cannot uniformize input ${value} without valid toType (${toType}): Returned original value`);
            return value;
        }
        else {
            let transformFunc = targetTypeInfo.transformInput;
            if (!transformFunc || typeof(transformFunc) !== 'function' )
            {
                console.warn(`_uniformize: No transformFunc given for ${targetTypeInfo.name}! Check: DECORATOR_TARGET_TO_CHECK_INFO`);
                return value;
            }
            else {
                let r = transformFunc(value);
                return r;
            }
        }

    }
}

 
function _getArgNames(func:any):Array<string>
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


/** 
*   Decorator for caching the results of operations and getting them when needed
*   !!!! This function does not work anymore !!!! 
*   TODO: Check TS version and see why this is not working: https://www.typescriptlang.org/docs/handbook/decorators.html
*/
export function cacheOperation(targetPrototype: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor
{
    // NOTE: we use this decorator without arguments so this structure is more simple than @checkInput
    const wrappedMethod = descriptor.value; // this is the raw function being wrapped by decorator
    const wrappedMethodName = propertyKey; // propertyKey contains the name of wrapped method

    descriptor.value = function(...args )
    {  
        // A flag can disable the cache
        if(!SHAPE_CACHE_ENABLED)
        {
            return wrappedMethod.apply(this, args); // this is the direct output 
        }
        const cache = this._geom._cache;
        const hash = _hashOp(wrappedMethodName, args)
        const cacheResult = _checkCache(cache, hash);

        if (cacheResult)
        {
            // IMPORTANT: There could be a situation where a function can return null|undefined
            // return the nullish version if so
            return cacheResult?._copy() || cacheResult; 
        }       
        else {
            const calculatedOutput = wrappedMethod.apply(this, args); // this is the direct output 
            _setCache(cache,hash,calculatedOutput?._copy()); // place a copy of the output in the cache - also nullish
            return calculatedOutput; // return real output - no cached version!
        }
        
    }
    return descriptor;
}

/** Hash arguments (parameters and values with function name) */
/* TMP DISABLED
function _hashOp(methodName:string, args):string
{
    // Taken from CascadeStudio: https://github.com/zalo/CascadeStudio/blob/e75aaf857d2e8e900e674175bd521c6dbf84d2ab/js/CADWorker/CascadeStudioStandardUtils.js#L43
    let argsString = JSON.stringify(args);
    let hashString = methodName + argsString;
    let hash = _getHash(hashString);
    return hash;
}

function _getHash(str:string):string
{
    let hash = SparkMD5.hash(str);
    return hash;
}


function _checkCache(cache:{(key:string):any} = null, hash:string):any
{
    if (!cache)
    {
        console.warn('_checkCache: Cannot check cache: No cache given!')
        return null;
    }
    return cache[hash] || null;    
}

function _setCache(cache:{(key:string):any}, hash:string, result:any)
{
    cache[hash] = result;
}
*/

/** TODO */
export function ocCheck(target:Object, method:string,  descriptor: PropertyDescriptor)
{
    // TODO
    
}


//// INPUT CHECKING ////

function getFuncParamNames(func):Array<any>
{
    // see: https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
    // TODO: do this better
    let STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
    let ARGUMENT_NAMES = /([^\s,]+)/g;
    let fnStr = func.toString().replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if(result === null)
        result = [];
    return result;
}

/**
    Decorator @checkInput(inputType, uniformizeToTypes)
    
    Is used to:

    1. Check incoming inputs and generate usefull error messages if the wrong input is supplied
    2. Apply default values if given in decorator
    3. Uniformize different inputs (sometimes given with a Union Type or Type Guard function) to skip all that checking in the real methods
    4. If everything checks out (no nulls, no invalid values) run the wrapped method with uniformized inputs

    Usage:

    @checkInput(inTypeFunc, toTypeFunc)
    @checkInput([inTypeFunc1,inTypeFunc2], [toTypeFunc1, toTypeFunc2] )
    @checkInput( [[ inTypeFunc1, defaultValue1],[inTypeFunc2,defaultValue2]], ['auto', toTypeFunc2] )

    !!!! Making sure the supplied type functions are imported !!!!

    It's recommended to use string values for the typefuncs because they might not be resolved yet. On run the strings will be transformed into 


    Examples:
    
    * @checkInput('PointLike', 'Vector') 
    
    Accept any PointLike (use isPointLike type guard function because the type itself does not really exist on runtime!)
        And turn into a Vector for use in method:

    * @checkInput(['PointLike', 'PointLike'], [Vector,Vector]) // NOTE: the direct object Class Vector can be used: but be careful it is already imported!

    Same but two PointLike inputs to Vectors

    * @checkInput( [ ['PointLike',[0,0,0]] , ['PointLike',[0,0,1]] ], [Vector, Vector])

    Same but with default values

    
    Important notes:
        * When we expect only one PointLike input and receive multiple real inputs, the arguments are used to create the PointLike
        

 */

function _generateCheckError(className:string, wrappedMethod:Function, wrappedMethodName:string, decoratorType:string, checkArgs:any|Array<any>, inputCheckIndex:number)
{
    let decoratorTypeInfo = _getDecoratorTargetInfo(decoratorType);
    
    if (decoratorTypeInfo)
    {
        checkArgs = (!Array.isArray(checkArgs)) ? [checkArgs] : checkArgs;
        // most of the time we get the arguments that failed
        let checkArgsStr = "";
        checkArgs.forEach( (inp,i) => checkArgsStr += `${Array.isArray(inp) ? `["${inp}" (type: ${ typeof(inp) == 'object' ? inp?.constructor.name : typeof(inp) })]` : `"${inp}" (type: ${ typeof(inp) == 'object' ? inp?.constructor.name : typeof(inp) })` }${(i != checkArgs.length - 1) ? ',' : ''}`);

        let msgObj = decoratorTypeInfo.errorMessage;

        if (!msgObj)
        {
            console.warn(`_generateCheckError: Could not get message config. Check _getDecoratorTargetInfo in decorators!`);
        }
        else {
            // This error is for the user and will be shown in the Editor
            const parametersOfFunc = getFuncParamNames(wrappedMethod);
            const errorAtParam = parametersOfFunc[inputCheckIndex];
            let m = `INPUT ERROR
    at ${className}.${wrappedMethodName}(${parametersOfFunc.join(', ')})
    wrong input for argument: "${errorAtParam}"
    need type "${decoratorTypeInfo.name}" 
    but got ${checkArgsStr}
    valid inputs are: 
        - ${msgObj.possible.join('\n\t- ')}
        ${msgObj.hint || ''}`;

            console.error(m); // also throw in the console
            throw new Error(m);
        }
    }
}


/** Main @checkInput decorator

    @param inputChecks - Per input the desired checks. NOTE: we can only supply typeguard functions (not types) or Classes or a Array with check and default value 
    @param uniformizeToTypes - Per input supply a type (Class or typeguard function) to convert into
 */
export function checkInput(inputChecks:any|Array<any>, uniformizeToTypes:any|Array<any>): MethodDecorator
{
    // DEBUG: try to  fix BindingError
    try 
    {
        inputChecks = !Array.isArray(inputChecks) ? [inputChecks] : inputChecks;
        uniformizeToTypes = !Array.isArray(uniformizeToTypes) ? [uniformizeToTypes] : uniformizeToTypes;
    
        return function (targetPrototype: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor
        {
            /*  target is Prototype function ( NOT instance! ): we can actually just use (this) in the descriptor function
                propertyKey is name of the wrapped method
                descriptor is all information of wrapped method { configurable, enumerable, value : function, writable }
            */
    
            const wrappedMethod = descriptor.value;
    
            // wrap method
            descriptor.value = function(...args)
            {
                // the real inputs the wrapped method gets
                let inputValues = args;
    
                // test decorator configuration consistency
                if (inputChecks.length != uniformizeToTypes.length)
                {
                    console.warn(`${propertyKey}::@checkInput: number of inputChecks(${inputChecks.length}) is not the same as uniformizeToTypes (${uniformizeToTypes.length}): Check decorator config!`);
                }
                
                /* !!!! IMPORTANT: Because we only iterate inputs, we don't check the inputs that are not coming in!
                    This might be a bit counter-intuitive 
                    TODO: Make the uniformizeToTypes leading??
                */
                // do the checks
                let allCorrect = true;
                let wrappedMethodName = propertyKey;
                //let curClassName = this.constructor.name;
                let checkedInputValues = inputValues; // all checked input values go here - we plug these later in the wrapped method
    
                // if we have a method defined with only one inputCheck and receive multiple inputValues we take it that the user provided flat inputs
                // for example shape.move(x,y,z) or new Edge().makeSpline(p1,p2,p3,p4)
                let flatInputs = inputChecks.length == 1 && inputValues.length > 1;
    
                // checking input types and uniformize
                inputChecks.some( (inputCheckType, inputCheckIndex) => 
                {   
    
                    /* inputCheckType can be:
                        - just a Class, standard type string ('string') or type guard function
                        - an Array of the above with default value [ Class/func, defaultValue ]
                    */
                    let curValue = inputValues[inputCheckIndex]; // if not there: undefined
                    let decoratorTargetType = inputCheckType;
                    let allowedNullValue = false;
    
                    // if default values given in format [ decoratorTargetType, defaultValue ]
                    if (Array.isArray(inputCheckType))
                    {   
                        curValue = (curValue === null || curValue === undefined ) ? inputCheckType[1] : curValue; // if value is null/undefined use default
                        
                        allowedNullValue = (
                            (curValue === null || curValue === undefined) 
                            && (inputCheckType[1] === null || inputCheckType[1] === undefined)) ? true : false;
                        
                        decoratorTargetType = inputCheckType[0];
                    
                    }
                    
                    let targetTypeInfo = _getDecoratorTargetInfo(decoratorTargetType);
    
                    let check = (targetTypeInfo !== null) ? targetTypeInfo.check : null;
    
                    if (!check)
                    {
                        console.warn(`Error @checkInput(${this}.${propertyKey}{ .. }). Could not get check function for given typeTarget: "${decoratorTargetType}": Check @checkInput(${propertyKey}) config! Total @checkInput checks: ${inputChecks}`)
                        allCorrect = false;
                    }
                    else
                    {
                        // start checking based on different types of checks: function, Class or string
                        if (check === null)
                        {
                            console.warn("Could not validate input: Please check given check class or function in decorator config! Check also if you don't use types! PointLike => isPointLike");
                            allCorrect = false;
                        }
                        else if (allowedNullValue)
                        {
                            // let null pass: don't check
                        }
                        else if (typeof check === 'function')  // a function (type check / type guard or Class )
                        {
                            let checkArgs = (flatInputs) ? inputValues : [curValue]; // if flat: all arguments including curValue, otherwise array so we can spread
    
                            // It's hard to distinguish between real check functions and Classes: 
                            // so we check first if a value is a instance
                            let isCheckError = false;
                            try {
    
                                isCheckError = (!(curValue instanceof check) && check(...checkArgs) === false);
                                if (isCheckError)
                                {
                                    console.error(`@checkinput at "${this.constructor.name}.${wrappedMethodName}()" failed. Wrong values "${checkArgs.join(',')}"`);
                                    allCorrect = false;
                                }
                            }
                            catch(e)
                            {
                                // this triggers when we try to use a Class function as real function. For example: Edge(..)
                                // HACK: ignore binding errors 
                                if(e.name !== 'BindingError')
                                {
                                    console.error(`@checkinput at ${this.constructor.name}.${wrappedMethodName}() failed. With inputs: ${inputValues} this error: ${e}`);
                                    allCorrect = false;
                                }
                                else {
                                    console.error(`@checkinput at ${this.constructor.name}.${wrappedMethodName}(): BindingError. Ignored. Error: ${e}. Input: ${inputValues}`);
                                }
                            }
                            finally {
                                // generate error message for both
                                if (isCheckError)
                                { 
                                    _generateCheckError(this.constructor.name, wrappedMethod, wrappedMethodName, decoratorTargetType, checkArgs, inputCheckIndex); 
                                }
                            }
    
                        }
                        else if (typeof check === 'string')
                        {
                            if (!(typeof curValue == check))
                            {
                                _generateCheckError(this.constructor.name, wrappedMethod, wrappedMethodName, decoratorTargetType, curValue, inputCheckIndex)
                                allCorrect = false;
                            }  
                        }
                        else {
                            console.warn(`Unknown check given: ${check}. Check @checkInput decorator config!`);
                            allCorrect = false;
                        }
                    }
    
                    // if error set curValue to null
                    if (!allCorrect)
                    {
                        curValue = null;   
                    }
    
                    // make sure its null and not undefined
                    curValue = (curValue === undefined) ? null : curValue;
    
                    // uniformize to given type
                    if (allowedNullValue || curValue != null) // don't use if(curValue) because first value can be 0
                    {      
                        if (flatInputs)
                        {
                            /* Special case for PointLike and Sequences of all sorts: if we have only one inputCheck and multiple real inputs (inputValues)
                                We can take it that we have a flattened point description, like move(x,y,z): 
                                Then plug all the inputValues into the _uniformize function */
                            curValue = inputValues; // these are all args
                        }
                        
                        curValue = (allowedNullValue) ? null : _uniformize(curValue, uniformizeToTypes[inputCheckIndex], inputCheckType);
                        
                        // save checked values
                        if(!flatInputs)
                        {
                            checkedInputValues[inputCheckIndex] = curValue;
                        }
                        else {
                            // We checked all flattened inputs as one - restore their original structure - and stop loop
                            checkedInputValues = [curValue];
                            return true; // break some loop
                        }
                    }
                }) // end some loop
    
                // if all inputs are correct we can continue with the execution
                if (allCorrect)
                {
                    // really run wrapped method with arguments
                    return wrappedMethod.apply(this, checkedInputValues); // arguments needs to be an Array!
                }
                else {
                    console.error(`Failed to execute decorated method: "${this.constructor?.name}.${wrappedMethodName}". This is probably due to a decorator config error! Check if all conversions went well.`)
                    return null;
                }
                
            }
    
            return descriptor;
        };
    }
    catch(e)
    {
        console.error(`checkInput: Error: ${e}`);
    }
   
}

//// SCENE MANAGEMENT ////


export function addResultShapesToScene(targetPrototype: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor
{
    // NOTE: we use this decorator without arguments so this structure is more simple than @checkInput
    const wrappedMethod = descriptor.value; // this is the raw function being wrapped by decorator
    const wrappedMethodName = propertyKey; // propertyKey contains the name of wrapped method

    descriptor.value = function(...args )
    {  
        let outputShapeOrShapes = wrappedMethod.apply(this, args); // capture Shape
        if (Shape.isShape(outputShapeOrShapes) || ShapeCollection.isShapeCollection(outputShapeOrShapes))
        {
            // add to Scene
            outputShapeOrShapes.addToScene();
            return outputShapeOrShapes;
        }
        else {
            console.warn(`@addResultShapesToScene: Method ${wrappedMethodName} did not return a Shape to add to Scene. Check config!`);
            return outputShapeOrShapes; // return the result anyway
        }
        
    }
    return descriptor;
}


//// PROTECT AGAINST OC CRASHES ////

/** 
*   Decorator to catch errors in OC and give sane error messages
*/
export function protectOC(hints?:string|Array<string>): MethodDecorator
{
    let hintsArr:Array<string> = (!Array.isArray(hints)) ? [hints] : hints;

    return function (targetPrototype: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor
    {
        /*  target is Prototype function ( NOT instance! ): we can actually just use (this) in the descriptor function
            propertyKey is name of the wrapped method
            descriptor is all information of wrapped method { configurable, enumerable, value : function, writable }
        */

        const wrappedMethod = descriptor.value;
        const wrappedMethodName = propertyKey; // propertyKey contains the name of wrapped method
    
        descriptor.value = function(...args)
        {
            try 
            {
                return wrappedMethod.apply(this, args);    
            }
            catch(e)
            {
                // two modes: just catch all errors and show info or show raw error when {{PRINT}} in message
                let errorMessage:string;
                if (!isNumeric(`${e}`))
                {
                    errorMessage = `${e}`;
                }
                else {
                    let instanceClassName = this.constructor.name;
                    let ocMessage = (typeof e === 'number') ? this._oc?.OCJS?.getStandard_FailureData(e).GetMessageString() || '' : '';
                    let wrappedMethodParams = getFuncParamNames(wrappedMethod);
                    let hintsMessage = hintsArr.reduce( (str, hint) => str += `\t\t\t* ${hint}\n`, '' );
                    let argsMessage = args.join(',');
                    errorMessage = `GEOMETRY ERROR
                        at ${instanceClassName}.${wrappedMethodName}(${wrappedMethodParams.join(',')})
                        OC kernel failed to generate Shape
                        OC message: ${ocMessage}
                        Hints:
    ${hintsMessage}
                        [original error: "${e}"]`;
                }

                throw new Error(errorMessage)
            }
        }
        
        return descriptor;
    };
}

//// SKETCHER MODE ////

function sketchIsActive(geom:Geom):boolean
{
    return geom && (geom.activeSketch instanceof Sketch);
}

export function asSketch(targetPrototype: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor
{
      const wrappedMethod = descriptor.value;
      const wrappedMethodName = propertyKey;

      descriptor.value = function(...args )
      {  
          if(!sketchIsActive(this))
          {
                // Try to forward to original geom method (like geom.Circle())
                let origGeomMethodName =  wrappedMethodName[0].toUpperCase() + wrappedMethodName.slice(1);
                if (this[origGeomMethodName])
                {
                    return this[origGeomMethodName].apply(this, args); // capture Shape
                }
                else {
                    let errorMsg = `${wrappedMethodName}: You are calling a Sketch function without having started a sketch yet! Do so with sketch()!`;
                    console.error(errorMsg)
                    throw new Error(errorMsg)
                }
          }
          else {
                // do the command and return
                return wrappedMethod.apply(this, args); // capture Shape
          }
          
      }

      return descriptor;
  }
  
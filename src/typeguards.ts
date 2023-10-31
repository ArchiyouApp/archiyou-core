import { Point, Vector, Shape, Vertex, Edge, Wire, Face, Shell, Solid, ShapeCollection, VertexCollection, DimensionLineData, PipelineType  } from './internal'
import { Side, Plane, CoordArray, Coord, Cursor, MainAxis, Axis, SketchPlaneName, ObjStyle, PointLike, ShapeType, 
          ShapeTypes, LinearShape,PointLikeOrAnyShape, AnyShape, PointLikeSequence, AnyShapeCollection, AnyShapeSequence,
          AnyShapeOrCollection, AnyShapeOrSequence, PointLikeOrAnyShapeOrCollection, ColorInput,
          Pivot, Alignment, BboxAlignment, LinearShapeTail, ThickenDirection, MakeShapeCollectionInput,
          MakeWireInput, MakeFaceInput, MakeShellInput, MakeSolidInput, SelectionString, AnyShapeOrCollectionOrSelectionString, SelectorPointRange,
          PointLikeOrAnyShapeOrCollectionOrSelectionString,
          LayoutOptions,
          PointLikeOrVertexCollection,
          ModelUnits,
          ShapeAttributes
        } from './internal' // types

import { BaseStyle, ContainerAlignment, Position, ScaleInput, 
            ImageOptionsFit, TextAreaAlign, PageSize, PageOrientation, AnyPageContainer, Container, View,
            ContainerHAlignment, ContainerVAlignment, MetricName
        } from './internal' // NOTE: Position is a DOC type

import { SIDES, ALL_SHAPE_NAMES, AXIS_TO_VECS, ALIGNMENTS_ADD_TO_SIDES, SIDE_TO_AXIS, METRICS} from './internal' // types
import { isNumeric, isRelativeCoordString } from './internal'


//// TYPE GUARD FUNCTIONS ////

/* NOTE: all the above types don't really exist on execution, that's why TS introduced type guards: 
        functions that can test for a type during execution 

  STRICT: We need to be strict here because otherwise we'll need to parse too much. 
        We need to focus on conversing different values into a consistent input type

*/

export function isModelUnits(o:any): o is ModelUnits
{
    return ['mm','cm','dm','m','km','inch','feet','yd','mi'].includes(o);
}

export function isSide(o:any): o is Side
{
    return (typeof o === 'string') && SIDES.includes(o)
}

export function isPlane(o:any): o is Plane
{
    return ['xy','xz','yz'].includes(o)
}

export function isSketchPlaneName(o:any): o is SketchPlaneName
{
    return isPlane(o) || isSide(o);
}

//// PointLike ////

export function isCoordArray(p:any): p is CoordArray
{
    return Array.isArray(p) && p.length >= 2 && p.every(n => isCoord(n))
}

export function isCoord(c:any) : c is Coord
{
    return isNumeric(c) || isRelativeCoordString(c);
}

export function isMainAxis(o:any): o is MainAxis
{
    return (typeof o === 'string') && ['x','y','z'].includes(o);
}

export function isAxis(o:any) : o is Axis
{
    return (typeof o === 'string') && Object.keys(AXIS_TO_VECS).includes(o);
}

export function isBboxAlignment(o:any) : o is BboxAlignment
{
    return (typeof o === 'string') || Array.isArray(o); // TODO: better
}

export function isPointLike(p: any=null) : p is PointLike
{
    let r =  isCoord(p) // one or more Coords in args
            || isAxis(p) // Axis: something like 'x' or 'xy
            || ( Array.isArray(p) && isCoord(p[0]) ) // one or more Coords in array
            || p instanceof Vector 
            || p instanceof Point
            || p instanceof Vertex;

    // messages are done in @checkInput for more context
    return r;
}

export function isCursor(o:any) : o is Cursor
{
    if (!o) return false;
    
    return Point.isPoint(o.point) && Vector.isVector(o.direction);
}

//// Shapes ////

export function isShapeType(o:any): o is ShapeType
{   
    return (typeof o == 'string') && ALL_SHAPE_NAMES.includes(o);
}

export function isShapeTypes(o:any): o is ShapeTypes
{
    return (Array.isArray(o) && o.every(t => isShapeType(t)))
}

export function isAnyShape(o: any) : o is AnyShape
{
    return Shape.isShape(o); // just a clear shape
}

export function isPointLikeOrAnyShape(o:any): o is PointLikeOrAnyShape
{
    return isPointLike(o) || isAnyShape(o);
}

export function isAnyShapeCollection(o:any, ...args) : o is AnyShapeCollection
{
    // NOTE: Removed allowing an Array - it creates too much confusion: see isAnyShapeSequence
    return ShapeCollection.isShapeCollection(o)
}

export function isAnyShapeSequence(o:any, ...args): o is AnyShapeSequence
{
    // This also included Arrays
    return isAnyShapeCollection(o) || 
        ( Array.isArray(o) && o.concat(args).every(s => isAnyShape(s)) ) ||
        ( o && [o,...args].every(s => isAnyShape(s)))
}

export function isAnyShapeOrCollection(o: any) : o is AnyShapeOrCollection
{
    return isAnyShape(o) ||  isAnyShapeCollection(o);
}

export function isAnyShapeOrSequence(o:any): o is AnyShapeOrSequence
{
    return isAnyShape(o) || isAnyShapeSequence(o);
}

export function isPointLikeOrAnyShapeOrCollection(o: any) : o is PointLikeOrAnyShapeOrCollection
{
    return isAnyShapeOrCollection(o) || isPointLike(o);
}

export function isPointLikeOrVertexCollection(o:any): o is PointLikeOrVertexCollection
{
    return isPointLike(o) || o instanceof VertexCollection || (o instanceof ShapeCollection && o.every( s => s.type() == 'Vertex'))
}

export function isLinearShape(o: any) : o is LinearShape
{
    return ( (o instanceof Edge) || (o instanceof Wire)) || (o instanceof Face) || (o instanceof Shell); // NOTE: we can convert Face/Shell to (outer) Wire
}

export function isLinearShapeTail(o:any): o is LinearShapeTail
{
    return (typeof o === 'string') && (o == 'start' || o == 'end')
}

export function isThickenDirection(o:any): o is ThickenDirection
{
    return o == 'center' || isPointLike(o) || isSide(o);
}

export  function isShapeAttributes(o:any): o is ShapeAttributes
{
    const SHAPE_ATTRIBUTE_KEYS = ['hidden','outline', 'visible'];

    return typeof o === 'object'
        && Object.keys(o).every(key => SHAPE_ATTRIBUTE_KEYS.includes(key))
}

//// PointLikeSequence ////

export function isPointLikeSequence(o: any, ...args) : o is PointLikeSequence
{   
    // NOTE: a sequence if 2 points or more!
    return  (Array.isArray(o) && o.filter( e => isPointLike(e)).length >= 2) || // conventional: just an array of PointLike
            (isAnyShapeCollection(o) && o.getShapesByType('Vertex').length >= 2) || 
            (isPointLike(o) && args.some(e => isPointLike(e))) // allow single PointLike too with other PointLike args

}

//// ColorInput ////

export function isColorInput(o: any): o is ColorInput
{
    return (typeof o === 'string') || isNumeric(o);
}

//// Alignment ////

export function isAlignment(o:any): o is Alignment
{
    // alignment can be a combination of SIDES and extra terms or a direct percentage point in bbox
    let aligns = SIDES.concat(ALIGNMENTS_ADD_TO_SIDES);
    return (
        (typeof(o) === 'string' && aligns.some( a => o.includes(a))) ||
        isPointLike(o)
        )
}

//// Pivot ////

export function isPivot(o: any): o is Pivot
{
    return isPointLike(o) || typeof o === 'string';
}

export function isBaseStyle(o:any):  o is BaseStyle
{
    return typeof(o) === 'object' && (o.color !== null || o.opacity !== null || o.size !== null || o.dashed !== null)
}

export function isObjStyle(o:any):  o is ObjStyle
{
    // works on fragments too: { line : { dashed: true }}
    return typeof(o) === 'object' 
        && (o.point || o.line || o.fill)
        && Object.keys(o).some(geomType => isBaseStyle(o[geomType]))

}

//// Test Shape Constructor Inputs ////
/* NOTE: Here we can really tune what input we let through to allow filtering for example
            Of course we need to make sure we parse all the values correctly in the Class constructor
*/

export function isMakeShapeCollectionInput(o:any, ...args): o is MakeShapeCollectionInput
{
    return isPointLikeSequence(o, ...args) ||  // NOTE: point sequence really is 2 or more points!
        isPointLikeOrAnyShapeOrCollection(o) ||
        (Array.isArray(o) && ( (o as Array<any>).concat(args)).every( e => 
                isPointLikeSequence(e) || isPointLikeOrAnyShapeOrCollection(e) || e === null )); // IMPORTANT: allow null to be able to filter this out
}

export function isMakeWireInput(o:any): o is MakeWireInput
{
    return isAnyShapeOrCollection(o) ||
        isPointLikeSequence(o) ||
        (Array.isArray(o) && (o as Array<any>).every( e => 
                isAnyShapeOrCollection(e) || isPointLikeSequence(e) || e === null )); // IMPORTANT: allow null to be able to filter this out        

}

export function isMakeFaceInput(o:any, ...args): o is MakeFaceInput
{
    return  (isAnyShape(o) && (o.type() == 'Wire' || o.type() == 'Face')) ||
        isPointLikeSequence(o) ||
        isAnyShapeSequence(o, ...args) || // a bit loose here
        (isAnyShapeCollection(o));
}

export function isMakeShellInput(o:any, ...args): o is MakeShellInput
{
    return Array.isArray(o) && o.every( s => isAnyShape(s) && (s.type() == 'Face' || s.type() == 'Edge')) || // NOTE: we can also make a shell out of Edges
        (isAnyShapeCollection(o) && (o.getShapesByType('Face').length >= 1 || o.getShapesByType('Edge').length >= 1)) || // NOTE: We can make a Shell out of 1 Face
        (isAnyShape(o) && (o as Shape).type() == 'Edge' && Array.isArray(args) && args.every(s => isAnyShape(s) && s.type() == 'Edge')) // flat arguments


}

export function isMakeSolidInput(o:any): o is MakeSolidInput
{
    return Array.isArray(o) && o.every( s => isAnyShape(s) && s.type() == 'Shell') ||
        isAnyShapeCollection(o) && o.getShapesByType('Shell').length >= 1 

}

export function isDimensionOptions(o:any): o is DimensionLineData
{
    return (typeof o === 'object') 
        && (o?.units && isModelUnits(o?.units))
        && (o?.offset && typeof o?.offset === 'number')
        && (o?.roundDecimals && typeof o?.roundDecimals === 'number')
}

//// SELECTIONS ////

export function isSelectionString(o:any): o is SelectionString
{
    return (typeof(o) === 'string')
}

export function isAnyShapeOrCollectionOrSelectionString(o:any): o is AnyShapeOrCollectionOrSelectionString
{
    return isAnyShape(o) ||
        isAnyShapeCollection(o) ||
        typeof(o) === 'string'  
}

export function isPointLikeOrAnyShapeOrCollectionOrSelectionString(o:any): o is PointLikeOrAnyShapeOrCollectionOrSelectionString
{
    return isAnyShapeOrCollectionOrSelectionString(o) || isPointLike(o);
}

export function isSelectorPointRange(o:any): o is SelectorPointRange
{
    return typeof(o) === 'object' // very light check
}

export function isLayoutOptions(o:any): o is LayoutOptions
{   
    return true; // TODO
}

//// PIPELINES ////

export const PIPELINE_VALID_NAMES = ['3dprint', 'cnc', 'techdraw',  'laser']; // To structurize pipelines. TODO: more
export function isPipelineType(o:any) : o is PipelineType
{
    return PIPELINE_VALID_NAMES.includes(o);
}

//// CALC ////

export function isMetricName(o:any): o is MetricName
{
    return METRICS.includes(o);
}

//// DOC ////

export function isContainerHAlignment(o:any): o is ContainerHAlignment
{
    return ['left', 'center', 'right'].includes(o)
}

export function isContainerVAlignment(o:any): o is ContainerVAlignment
{
    return ['top', 'center', 'bottom'].includes(o)
}

export function isContainerAlignment(o:any): o is ContainerAlignment
{
    return Array.isArray(o) && isContainerHAlignment(o[0]) && isContainerVAlignment(o[1])
}

export function isPosition(o:any): o is Position
{
    return (Array.isArray(o) && o.length === 2 && o.every(e => typeof e === 'number'))
        || isContainerAlignment(o);
}

export function isScaleInput(o:any): o is ScaleInput {
    return (typeof o === 'string' && o === 'auto') || (typeof o === 'number')
}

function isImageOptionsFit(o:any): o is ImageOptionsFit
{
    return ['fill','contain','cover'].includes(o);
}

export function isTextAreaAlign(o:any): o is TextAreaAlign
{
    return ['left', 'right', 'center', 'fill'].includes(o);
}

export function isPageSize(o:any): o is PageSize
{
    if(typeof o !== 'string'){ return false };
    return o.match(/A[0-7]$/) !== null;
}

export function isPageOrientation(o:any): o is PageOrientation
{
    if(typeof o !== 'string'){ return false };
    return ['landscape','portrait'].includes(o as string);
}

export function isAnyPageContainer(o:any): o is AnyPageContainer
{
    return o instanceof Container ||
            o instanceof View; // TODO: more
}

/** Things that can be turned into a Position (Array<number|number>) */
export function isPositionLike(o:any): o is Position
{
    return (Array.isArray(o) && o.length === 2 && o.every(e => typeof e === 'number'))
        || isContainerAlignment(o);
}
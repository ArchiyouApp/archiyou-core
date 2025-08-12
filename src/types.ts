import { Point, Vector, Shape, Vertex, Edge, Wire, Face, Shell, Solid, ShapeCollection, VertexCollection, Bbox, BaseAnnotation, ParamManager, Obj, Script, ScriptData  } from './internal'

import { Geom, Doc, Beams, Container, DimensionLine, CodeParser, Exporter, Make, Calc, View, Table } from './internal'

import { Console } from './Console'

//// SETTINGS ////

export const ALL_SHAPE_NAMES =  ['Vertex', 'Edge', 'Wire', 'Face', 'Shell', 'Solid']
export const AXIS_TO_VECS = {
    'x' : [1,0,0],
    '-x' : [-1,0,0],
    'y' : [0,1,0],
    '-y' : [0,-1,0],
    'z' : [0,0,1],
    '-z' : [0,0,-1],
    'xy' : [0,0,1], // plane
    'xz' : [0,1,0], // plane
    'yz' : [1,0,0], // plane
}
export const SIDES = ['left','right','front','back','top','bottom'];
export const SIDE_TO_AXIS: {[key:string]:string} = {
    front : '-y',
    back : 'y',
    left : '-x',
    right: 'x',
    top: 'z',
    bottom : '-z'
}

export const ALIGNMENTS_ADD_TO_SIDES = ['center','start','end'];

//// UNION TYPES ////

export type ModelUnits = 'mm'|'cm'|'dm'|'m'|'km'|'inch'|'feet'|'yd'|'mi'; // For now they are for administration only
export type Units = DocUnits | ModelUnits
export type UnitsWithPerc = Units | '%'
export type Coord = number|string
export type MainAxis = 'x'|'y'|'z'
export type Plane = 'xy' | 'xz' | 'yz'
export type Axis =  'x' | '-x' | 'y' | '-y' | 'z' | '-z' | Plane // Axis and Planes
export type SideX = 'left'|'right'
export type SideY = 'front'|'back'
export type SideZ = 'top'|'bottom'
export type Side = SideX|SideY|SideZ
export type SketchPlaneName = Plane | Side
export type CoordArray = [Coord,Coord,Coord]
export type PointLike = Coord|Array<Coord>|Vector|Point|Vertex // PointLike: All Datatypes that informationally could be seen as a Point
export type PointLikeSequence = Array<PointLike>|ShapeCollection // PointLikeSequence: An array of PointLike types
export type ShapeType = 'Vertex'|'Edge'|'Wire'|'Face'|'Shell'|'Solid'
export type ShapeTypes = Array<ShapeType>
export type LinearShape = Edge|Wire // LinearShape: A Shape that is linear.
export type PointLikeOrAnyShape = PointLike|AnyShape
export type AnyShape = Shape|Vertex|Edge|Wire|Face|Shell|Solid // Single Shape, excluding ShapeCollection
export type AnyShapeCollection = ShapeCollection|VertexCollection
export type AnyShapeSequence = AnyShapeCollection|Array<AnyShape> 
export type AnyShapeOrCollection = AnyShape|AnyShapeCollection
export type AnyShapeOrSequence = AnyShape|AnyShapeSequence // Both Shapes, ShapeCollection or Arrays of Shapes
export type PointLikeOrVertexCollection = PointLike|VertexCollection
export type PointLikeOrAnyShapeOrCollection = PointLike|AnyShape|AnyShapeCollection
export type ColorInput = string|number
export type Pivot = PointLike|string
export type Alignment = string|PointLike // 'leftbottomtop' or [0,0.5,1.0]
export type BboxAlignment = Array<number>|Alignment // [bbox_offset_perc_x,bbox_offset_perc_y] or combinations of left, top, front
export type LinearShapeTail = 'start'|'end'
export type ThickenDirection = 'all'|'center'|PointLike|Side
export type OrientationXY = 'horizontal'|'vertical'

export type SelectionString = string;
export type AnyShapeOrCollectionOrSelectionString = AnyShape|AnyShapeCollection|SelectionString;
export type PointLikeOrAnyShapeOrCollectionOrSelectionString = PointLikeOrAnyShapeOrCollection|SelectionString;

export type MakeShapeCollectionInput = PointLikeOrAnyShapeOrCollection|PointLikeSequence|Array<PointLikeOrAnyShapeOrCollection|PointLikeSequence>
export type MakeWireInput = PointLikeSequence|AnyShapeOrCollection|Array<PointLikeSequence|AnyShapeOrCollection>;
export type MakeFaceInput = Wire|PointLikeSequence|AnyShapeSequence
export type MakeShellInput = Array<Face|Edge>|ShapeCollection
export type MakeSolidInput = Array<Shell>|ShapeCollection

/** Pipelines are calculations that need to run to generate certain outputs */
export type PipelineType = 'docs' | '3dprint' | 'cnc' | 'techdraw' | 'laser'

//// INTERFACES ////

/** Saved Scripts by Version */
export interface ScriptVersion 
{
    id? : string,
    file_id? : string,
    user_id? : string,
    user_name? : string,
    file_name? : string,
    prev_version_id? : string,
    created_at? : string,
    updated_at? : string,
    params? : Array<Param>,
    code : string,
    shared?: boolean,
    shared_version_tag?:string,
    shared_auto_sync? : boolean,
    shared_category?: string,
    shared_description?: string
}

/** After execution of the script (on client or server) we fill in some metadata */
export interface ScriptMeta
{
    // Information after execution of script
    units: ModelUnits, // units of the script
    pipelines: Array<string>, // pipelines that are part of the script
    metrics: Array<string>, // metric names that are part of the script
    tables: Array<string>, // table names that are part of the script
    docs: Array<string>, // names of docs that are part of the script
    numShapes?: number
    bbox?: Array<number|number|number|number|number|number>, // bbox of scene [minX, minY, minZ, maxX, maxY, maxZ]
}

/** Information on how the Script is published 
 *  If null then the script is not published
 *  Before publishing the script is executed and validated, so here we also add information 
 *  that comes out of execution
*/
export interface ScriptPublished
{
    url:string // url to the published script - this anticipates different publication urls
    title:string // nice title of the script
    published:Date // Date of publication
    description:string // public description of script
    public:boolean // if the script is public or not
    params: Record<string, any>; // the parameters that are public with override configuration, others are default
}

/** A group of all modules of Archiyou for easy access  */
export interface ArchiyouApp
{
    worker?: any, // Keep track of scope of root scope of Archiyou core app - TODO: TS typing
    scope?:any // Scope where th escript is run in
    geom: Geom,
    doc?: Doc,
    console?: Console,
    executor?: CodeParser,
    exporter?: Exporter,
    calc?: Calc,
    make?: Make,
    // TODO: importer?
    gizmos?: Array<Gizmo>, // TODO: move this to Geom?
    beams?: Beams,
    paramManager?:ParamManager
    config?: Record<string,any> // all environment variables
}

export interface ArchiyouAppInfoBbox
{
    min:Array<number|number|number> // leftfrontbottom 
    max:Array<number|number|number> // rightbacktop
    width: number
    height: number
}

export type ArchiyouOutputFormatType = 'step'|'stl'|'gltf'

export interface ArchiyouOutputSettings
{
    // what to calculate/output
    metrics?:boolean
    tables?:boolean
    docs?:boolean|Array<string> // true/false, or names of included docs
    pipelines?:boolean|Array<string> // true for all, false for none, or array with names to include
    formats?:boolean|Array<ArchiyouOutputFormatType> // true for all, false for none, or names of formats to include
    messages?:boolean|Array<ConsoleMessageType> // true/false, or names of included message types
}

export type ConsoleMessageType = 'info'|'geom'|'user'|'warn'|'error'|'exec'

/** A console Message */
export interface ConsoleMessage
{
    type: ConsoleMessageType,
    time: string,
    from: string, // component
    message: string,
}

/** Special Archiyou data inserted into asset.archiyou
    TODO: We use RunnerScriptExecutionResult internally - which has a lot of overlap with this
    When we start using GLB format internally these types will merge
*/
export interface ArchiyouData
{
    scenegraph: SceneGraphNode
    gizmos: Array<Gizmo>,
    annotations: Array<DimensionLineData>, 
    docs: {[key:string]:DocData} // all documents in data and serialized content
    errors?: Array<StatementResult>, // only needed for internal use in the future
    messages?: Array<ConsoleMessage>, // NOTE: for internal use and export in GLTF
    metrics?: Record<string, Metric>,  
    tables?:{[key:string]:any}, // raw data tables
    managedParams?:Record<ParamOperation, Array<PublishParam>>
}


/** TODO */
export interface ExportSVGOptions 
{

}

export interface ExportGLTFOptions 
{
    binary?: boolean
    quality?: MeshingQualitySettings
    archiyouFormat?: boolean // use Archiyou format
    archiyouOutput?:ArchiyouOutputSettings
    includePointsAndLines?: boolean // export loose points and edges 
    extraShapesAsPointLines?: boolean // for visualization purposes seperate points and lines
}   


/** Archiyou-specific information in GLTF */
export interface ArchiyouData
{
    scenegraph: SceneGraphNode
    gizmos: Array<Gizmo>,
    annotations: Array<DimensionLineData>, 
    docs: {[key:string]:DocData} // all documents in data and serialized content
    errors?: Array<StatementResult>, // only needed for internal use in the future
    messages?: Array<ConsoleMessage>, // NOTE: for internal use and export in GLTF
    tables?:{[key:string]:any}, // raw data tables
}


export type EngineStateStatus = 'init' | 'loaded' | 'executing' | 'executed'

export interface EngineState
{
    engine: 'cloud' | 'local',
    status?: EngineStateStatus,  // TODO: error/succes??
    executionTime?: number|undefined, // duration in ms
    statements?: Array<StatementResult>
}

export interface MeshingQuality
{

}

export interface ComputeTask
{
    uuid?: string,
    type: string,  // execute, execute+export?
    user_id? : string,
    broker_id? : string,
    client_id?: string,
    created_at?: Date,
    params? : Array<Param>,
    code: string
}

/** TODO: bring in line with RunnerScriptExecutionRequest */
export interface RunnerScriptExecutionResult
{
    created_at: Date,
    status:'success'|'error',
    duration: number
    request: RunnerScriptExecutionRequest,

    scenegraph: SceneGraphNode
    gizmos?: Array<Gizmo>,
    annotations?: Array<any> // TODO: TS typing: DimensionLineData etc. 
    managedParams?:Record<ParamOperation, Array<PublishParam>>

    statements: Array<StatementResult>
    errors?: Array<StatementResult>, // seperate the error statements (for backward compat)
    messages?: Array<ConsoleMessage>,
    
    meta: ScriptMeta, // meta information on the script execution
    
    // All outputs in clear structure
    outputs?: ExecutionResultOutputs
}

/** Results of component execution */
export interface ImportComponentResult
{
    status?:'success'|'error'; // status of the execution
    errors?:Array<any>; // errors if any
    component?:string // name of component
    outputs:Record<string, ImportComponentPipelineOutputs> // outputs per pipeline name in internal format
    // for ease of use we also place the results model, metrics, tables and docs on main level
    model?:Obj, // model of default pipeline
    metrics?:Record<string, Metric>,
    tables?:Record<string, Table>,
    docs?:Record<string, Doc>,
}

/** Outputs of component execution
 *  All internal instances for internal use
 */
export interface ImportComponentPipelineOutputs
{
    model: Obj, 
    metrics: Record<string, Metric>, // metrics of the model
    tables: Record<string, Table>
    docs: Record<string, Doc>,
}


//// PARAMS ////

// NOTE: We put these in the core library because of the ParamManager 

export type ParamType = 'number'|'text'|'options'|'boolean'|'list'|'object' 

/** Target of a Param behaviour  */
export type ParamBehaviourTarget = 'visible' | 'enable' | 'value' | 'values' | 'start' | 'end' | 'options'

/** Param inside the application */
export interface Param
{ 
    id?: string
    type: ParamType
    listElem?: Param, // definition of list content (also a Param)
    name: string // always a name!
    enabled?:boolean // enabled or not
    visible?:boolean // Param is visible or not
    label: string // publically visible name
    default?: any // Default value: can be string or number
    value?: any // Can be string or number
    values?: Array<any> // active values in list
    start?: number // for ParamInputNumber
    end?: number // for ParamInputNumber
    step?: number // for ParamInputNumber
    schema?: ParamObjectSchema // object definition
    options?: Array<string> // for ParamInputOptions
    length?: number // for ParamInputText, ParamInputList    
    units?:ModelUnits
    // internal data for ParamManager
    // _manageOperation?: ParamOperation // Not used
    _definedProgrammatically?: boolean // this Param is defined programmatically in script
    // logic attached to param, triggerend anytime any param changes and applies to a specific Param attribute (ParamBehaviourTarget)
    _behaviours?: Record<ParamBehaviourTarget, (curParam:Param, params:Record<string,Param>) => any> | {} 
    
}



/** A way to define nested ParamObjects, either user in a single entry or list
 *  NOTE: For now we don't allow nested structures (so no ParamObj containing other ParamObj field)
*/
export type ParamObjectSchema = Record<string,Param> // TODO: use something like base Param here

/** All possible attributes for Shapes */
// TODO: Can we allow user attributes??
export interface ShapeAttributes
{
    hidden?:boolean // lines that are hidden behind other shapes in projection
    outline?:boolean // outlines after projection
    visible?:boolean
    dashed?:boolean
}

/** A cursor in a coordinate system. Used in Sketcher and others in the future */
export interface Cursor
{
    point: Point,
    direction?: Vector, // tangent of last Shape at Point
}

export interface PolarCoord
{
    length: number,
    angle: number,
    relativeAngle?: boolean,
}

/** Represents a link between two Shapes */
export interface Link {
    from : Point,
    to : Point,
    fromSupport: Vertex|Edge|Face, // Vertex, Edge, or Face in from Shape that contains the Point
    toSupport: Vertex|Edge|Face, // Vertex, Edge, or Face in to Shape
    fromParams : Array<number>, // NOT WORKING
    toParams : Array<number>, // NOT WORKING
    distance : number,
}

export interface SceneGraphNode {
    name: string,
    type: string,
    nodes: Array<SceneGraphNode>,
    details?: SceneGraphNodeDetails,
}

export interface SceneGraphNodeDetails {
    visible?: boolean,
    color?: number,
    subType?: string, 
    numVertices?:number,
    numEdges?:number,
    numWires?:number,
}

/** The Script seperated into statements */
export interface Statement
{
    code:string; // the real code
    startIndex?: number;
    endIndex?: number;
    lineStart?:number; // the line the statement starts (it can actually span multiple lines)
    lineEnd?:number;
    columnStartIndex?:number;
    columnEndIndex?:number;
}

export interface StatementResult extends Statement
{
    status: 'error'|'success'
    message?: string,
    duration?: number
    durationPerc?:number // Added by Archiyou app ProfilingMenu
}

export interface BaseStyle 
{
    color?: number|string,  // color int or string
    opacity? : number,
    size?: number,
    dashed?: boolean // line dashed
    width?: number // line width
}

export interface ObjStyle 
{
    point?: BaseStyle,
    line?: BaseStyle,
    fill?: BaseStyle
}

export interface Gizmo
{
    name: string, 
    _id? : string, // uuid
    axis : string, // axis the gizmo moves in [x,y,z,xy,xz,yz,xyz]
    position: Array<number>, // start position of gizmo
    domains : Array<number>, // domains per axis relative to position [xmin,xmax], [[xmin,xmax],[ymin,ymax]] or [[xmin,xmax],[ymin,ymax],[zmin,zmax]]
    step: number, // step size of gizmo - TODO: tie into param
    toParams : Object, // { axis : params } or paramName : { axis: 'x', range: [valueMin, valueMax]} }
    _curPosition?: Array<number>,
    _index?: number,
    _obj? : any // Three Object3D
    _dummy?: any, // Three Object3D
    _domainBounds?: Array<Array<any>>,
    _paramValues : Object, // { param: value }
}

/** For applying select strings */
export interface Selection
{
    string: SelectionString,
    targetShape: string, // Vertex, Edge etc.
    singleResult?: boolean, // *NOT IMPLEMENTED*Are we looking for one or more 
    paramValue?: any,
    selectorMethod?: any, // method on Shape to select (with param) the needed entities
    selectedShapes?: Shape|ShapeCollection // previously selection
}

export interface SelectionShapeTargetSetting
{
    single?: boolean,
    targetShapeType: string,
    ignoreCase?: boolean,
}

export interface SelectorSetting 
{
    testLong: string,
    testShort: string,
    params: Array<string>,
    worksOn: Array<string>,
    selectorMethod: string, // name of method
}

export interface SelectorPointRange
{
    point?: Array<number>,
    operator?: string, // < > <= >=
    range?: number,
}

export interface SelectorAxisCoord
{
    axis?: 'x'|'y'|'z',
    coord?: number,
    tolerance: number,
}

export interface SelectorBbox
{
    from?: Array<number>,
    to?: Array<number>
}

export interface SelectorIndex
{
    indices?: Array<number>, // indices of Subshapes
}

//// SHAPE CLONING ////

export interface ShapeClone
{
    from: AnyShape
    transformations:Array<any> // TODO
}

//// ANNOTATIONS ////

/** Bring all annotations in one type */
export type AnnotationType = 'base'|'dimensionLine' | 'label' // TODO MORE
export type Annotation = BaseAnnotation|DimensionLine  // TODO: more: label
export type AnnotationData = DimensionLineData // TODO
export type AnnotationAutoDimStrategy = 'part' | 'levels'

/** Exporting DimensionLine instances as data */
export interface DimensionLineData
{
    _id?:string, // internal id
    _type?:AnnotationType
    start:[number,number,number] // start point of line (ie the arrow)
    end:[number,number,number]
    targetStart:[number,number,number]
    targetEnd:[number,number,number]
    targetDir:[number,number,number]
    dir:[number,number,number]
    value:number
    static?:boolean // if value can be calculated from distance between start-end or is static (for example after projection)
    units?:string
    offsetVec?:[number,number,number]
    offsetLength?:number
    offset?:Array<number|number|number> // offset vector with length in model units
    interactive:boolean
    round?:boolean 
    roundDecimals?:number
    param:string // name param binded to this dimension line
    _labelPosition?:Array<number|number|number> // for internal use
    showUnits?:boolean
}

/** Used with Shape.dimension() as options 
 *  NOTE: update typeguards when adding fields to this
*/
export interface DimensionOptions 
{
    units?:ModelUnits
    offset?:number // offsetLength (minus for other direction)
    offsetVec?:Vector
    ortho?:boolean|MainAxis
    roundDecimals?:number // round to number decimals. Default is 0
}

export interface DimensionLevel
{
    axis:MainAxis // axis of dimension cut line. Horizontal cut is axis y, vertical is x
    at: number // coordinate on given axis, relative or absolute
    coordType?: 'relative' | 'absolute' // auto determine
    align?: 'min'|'auto'|'max'|false|true // align dimension lines to Shape/Collection. Use false to disable.
    minDistance?: number // skip when distance is less then minDistance
    offset?:number
    showLine?:boolean // show DEBUG line
}

export interface DimensionLevelSettings
{
    levels: Array<DimensionLevel>
}

//// DOC ////

export type DocUnits = 'mm'|'cm'|'inch'|'pnt' 
export type DocUnitsWithPerc = DocUnits | '%' // Percent of page (side is dependent of measure)
export type PercentageString = string // 100%, 5% etc.
export type ValueWithUnitsString = number|string // string with number and DocUnitsWithPerc
export type WidthHeightInput = number|PercentageString|ValueWithUnitsString;
export type ContainerTableInput = string | DataRows

export interface DocSettings {
    proxy: string // url of proxy
}

export interface DocData {
    name:string
    units:DocUnits
    pages:Array<PageData>
    modelUnits:ModelUnits
}


export interface DocPipeline
{
    fn:() => any
    done: boolean
}



//// DOC:PAGE ////

export type PageSize = 'A0'|'A1'|'A2'|'A3'|'A4'|'A5'|'A6'|'A7';
export type PageOrientation = 'landscape'|'portrait';
export type PageSide = 'width'|'height'
export type AnyPageContainer = Container|View

export interface PageData {
    _entity:'page'
    name:string
    size:PageSize
    width:number // in units given in docUnits
    height:number // in units given in docUnits
    orientation:PageOrientation
    padding:Array<number|number> // horizontal (left and right), vertical (top and bottom) relative to Page width/height
    containers:Array<ContainerData>
    variables?:{[key:string]:any}
    docUnits:DocUnits, // gets taken from parent doc
}   

//// DOC:PAGE:CONTAINER ////

export type ContainerType = 'view'|'image'|'text'|'textarea'|'table'|'graphic'
export type ContainerHAlignment = 'left'|'center'|'right'
export type ContainerVAlignment = 'top' | 'center' | 'bottom'
export type ContainerAlignment = [ContainerHAlignment,ContainerVAlignment] // like [left,top]
export type ContainerSide = 'width'|'height'
export type ZoomRelativeTo = 'container'|'world'
export type ScaleInput = 'auto'|number;
export type ContainerSizeRelativeTo = 'page' | 'page-content-area'; // page-content area is page without the padding on both sides

export type ContainerPositionCoordRel = number // [0-1]
export type ContainerPositionCoordAbs = number|string // >=1 or 10mm

export type ContainerPositionRel= Array<number|number> // This is relative coords [ [0,1],[0,1]] from left bottom
export type ContainerPositionAbs = Array<string|string> // '10mm', '20mm'
export type ContainerPositionLike = ContainerPositionRel|ContainerAlignment|ContainerPositionAbs

export type ContainerData = { // Combine all Container types for convenience
    _entity:string
    name:string
    parent?:string // Name of parent - NOT USED YET
    type:ContainerType
    width:number // relative to (see: widthRelativeTo)
    widthRelativeTo:ContainerSizeRelativeTo
    widthAbs?:number // in doc units (added on place)
    height:number // relative to (see: widthRelativeTo)
    heightRelativeTo:ContainerSizeRelativeTo
    heightAbs?:number // in doc units (added on place)
    position:ContainerPositionRel// relative to page-content-area
    pivot:ContainerPositionRel
    border?:boolean // border around container
    borderStyle?:DocPathStyle // style to draw border
    frame?:any // advanced shapes as border
    index?:number

    contentAlign:ContainerAlignment // alignment of content inside container
    content:any; // TODO: raw content
    zoomLevel?:ScaleInput, // number or 'auto' [default]
    zoomRelativeTo?:ZoomRelativeTo,
    docUnits:DocUnits, 
    modelUnits:ModelUnits,
    
    caption?:string
    title?:string

    _domElem?:HTMLDivElement, // added on placement
}

export interface Frame {
    color:string // TODO
    thickness:number
    shape:'rect'|'circle'
}

export interface ContainerContent 
{
    source?:string, // source url (used for quick access if possible)
    format?:'jpg'|'svg'|'png';
    data:any; // main data
    settings:{[key:string]:any}
}


//// DOC:PAGE:CONTAINER:IMAGE ////

export type ImageOptionsFit = 'fill'|'contain'|'cover' // taken from CSS, see https://www.w3schools.com/css/css3_object-fit.asp
// fill is unproportianlly, contain is fit inside with margin, cover is fill proportianally

export function isImageOptionsFit(o:any): o is ImageOptionsFit
{
    return ['fill','contain','cover'].includes(o);
}

export interface ImageOptions 
{
    fit?: ImageOptionsFit
    align?: ContainerAlignment // for example ['left', 'top]  
    opacity?: number // [0-100]
    brightness?:number // [0-100]
    contrast?:number // [0-100]
    saturation?:number
    grayscale?:number // [0-100]
}

//// DOC:PAGE:CONTAINER:TABLE ////

// NOTE: uses DataRows for input from Calc

export interface TableContainerOptions
{
    fontsize?: number
    fontcolor?: string  
}

//// DOCS:PAGE:CONTAINER:TEXT ////

export type TextAreaAlign = 'left'|'right'|'center'|'fill';
export type TextBaseline = 'alphabetic'|'ideographic'|'bottom'|'top'|'middle'|'hanging'

// see: https://raw.githack.com/MrRio/jsPDF/master/docs/jsPDF.html#text
export interface TextOptions
{
    size?:number|string // saved in 'points' (like in Word) - units are also allowed but converted in options
    color?:string // always converted to hex
    width?:number // TODO: needed?
    height?:number // TODO: needed?
    bold?:boolean
    underline?:boolean // TODO implement in renderer
    strike?:boolean // TODO implement in renderer   
    oblique?:boolean // TODO implement in renderer
    align?:TextAreaAlign // Not used. Use: Cotnainer.contentAlign
    baseline?:TextBaseline
    angle?:number // in degrees
    // NOTE: some of these parameters are plugged directly into jsPDF.text()
}

//// DOCS:PAGE:CONTAINER:GRAPHIC

export type DocGraphicType = 'rect'|'circle'|'ellipse'|'line'|'hline'|'vline'|'triangle' // Later: poly?

// Default simple input
export interface DocGraphicInputBase
{
    type?:DocGraphicType
    units?:DocUnitsWithPerc // default in mm
    style?:DocPathStyle
    data?:any // TODO later: things to put inside graphic, like label number
}

export interface DocGraphicInputRect extends DocGraphicInputBase
{
    // if size => size=width=height
    width:number
    height:number
    round?:number
}

export interface DocGraphicInputCircle extends DocGraphicInputBase
{
    // if size => size = radius
    radius:number
}

export interface DocGraphicInputLine extends DocGraphicInputBase
{
    // if size => size = length
    start:[number,number]
    end:[number,number]
}

export interface DocGraphicInputOrthoLine extends DocGraphicInputBase
{
    length:number|string // number in default units or with units
    thickness:number|string
    color:string
}


//// DOCS:PAGE:CONTAINER:VIEW ////

export interface toSVGOptions
{
    all?:boolean // also invisible
    annotations?:boolean
    fills?:boolean // Generate fills in SVG
    outlines?:boolean // Calculate the Shape outlines (Slow!)
}

export interface SVGtoPDFtransform
{
    svgUnits:string
    scale: number // SVG to PDF units scale
    translateX: number // first SVG transform to center
    translateY: number
    containerTranslateX: number // offset for container position including pivot
    containerTranslateY: number
    boundBy:'width'|'height' // content is bound by width or height
    contentOffsetX: number // Offset to align content
    contentOffsetY: number
    
}

//// DOCS:PAGE:CONTAINER:TEXTAREA ////

export interface TextAreaOptions
{
    size?:number|string // saved in 'point' (like in Word) - units are also allowed but converted in options
    color?:string // always converted to hex
    align?:TextAreaAlign
}

//// DOCS:BLOCKS

/** Important data of created ContainerBlock */
export interface ContainerBlock
{
    width:number // relative to page/content-area
    height:number // relative
    x:number // relative
    y:number // relative
    pivot:[number,number]
    bbox?:[number,number,number,number] // left,right,bottom,top (in rel coords, original left bottom)
}

export interface TitleBlockInput
{
    title ?: string
    designer ?: string
    logoUrl ?: string // default: archiyou logo
    designLicense ?: PublishLicense // license of the design
    manualLicense ?: PublishLicense // license of the manual
}

export interface LabelBlockOptions
{
    x?:string|number
    y?:string|number
    width?:string|number // 10mm, 5%, 0.5
    pivot?:[number,number]
    textSize?:string|number
    secondaryTextSize?:string|number
    labelSize?:string|number
    numTextLines?:number // number of lines of text
    margin?:number|string // between label/text and outer block
    line?:boolean
}

//// INTERFACES FOR OUTPUTS ////

export interface VertexMesh {
    objId : string,
    ocId : string,
    vertices: Array<number>, // vertices instead of vertex for consistency
    indexInShape: number
}

export interface EdgeMesh {
    objId : string,
    ocId : number,
    vertices: Array<number>, // coord buffer!
    indexInShape: number
}

export interface FaceMesh {
    objId : string,
    ocId : number,
    numTriangles : number,
    vertices: Array<number>, // triangle vertices
    normals: Array<number>, // Vertex normals
    uvCoords: Array<number>,
    triangleIndices: Array<number>,
    indexInShape: number,
}

export interface MeshCache {
    vertices:Array<VertexMesh>|null,
    edges:Array<EdgeMesh>|null,
    faces:Array<FaceMesh>|null,
}

/** MeshShape is a very verbose format in which to save Shape Mesh data
 *  Inclusing for every Vertex, Edge and Face:
 *      - objId
 *      - ocId
 *      - vertex or vertices
 * 
 *  NOTE: is it really needed?
 */
export interface MeshShape {
    objId: string,
    vertices : Array<VertexMesh>,
    edges : Array<EdgeMesh>,
    faces : Array<FaceMesh>,
    style? : ObjStyle,
}

export interface MeshInfo {
    objId: string,
    shapeId: number,
    subShapeType: 'Face'|'Edge'|'Vertex';
    indexInShape: number,
    color?: number,
    faceGroupVertexIndices?:number,
    edgeGroupLineSegmentsRange?:Array<number>,
}

export interface MeshShapeBufferStats {
    numVertices: number,
    numEdges: number, // real OC Edges
    numLines?: number, // num lines from triangulated Edges
    numTriangles: number,
    numFaces: number,
    numShapes: number, 
}

/** New optimized Mesh buffer: combines all Vertices, Edges and Face triangles in one buffer  */
export interface MeshShapeBuffer {
    verticesBuffer: Array<number>, // vertex coords buffer
    verticesInfo:Array<MeshInfo>, 
    edgesBuffer: Array<number>, // edges coords buffer
    lineEdgesInfo: Array<MeshInfo> // line edge info
    trianglesVertices: Array<number>, // faces coords buffer
    trianglesVertexColors: Array<number>, // per vertices 3 color values (RGB)
    triangleIndices: Array<number>,
    triangleNormals: Array<number>,
    triangleUVs: Array<number>,
    trianglesInfo: Array<MeshInfo>,
    stats: MeshShapeBufferStats,
}

export interface MeshingQualitySettings 
{
    linearDeflection: number,
    angularDeflection: number,
    tolerance: number,
    edgeMinimalPoints: number,
    edgeMinimalLength: number,
}

export interface SelectedMeshShapeInfo
{
    meshInfo: MeshInfo,
    stats: MeshShapeBufferStats,
}

export interface Obbox
{
    center: Point
    width: number // x
    depth: number  // y
    height: number // z
    xDirection: Vector
    yDirection: Vector
    zDirection: Vector
}

export interface BeamLikeDims
{
    small:number // smallest dimension
    mid:number
    length:number // length
}

//// DOC STYLING ////


/** Configurator on how to draw shapes on documents (HTML or PDF) 
 *  These settings correspond to the style functions of jsPDF (with some exceptions!)
*/
export interface DocPathStyle {
    // see: https://pdfkit.org/docs/vector.html
    lineWidth?:number // in pnts
    // NOTE: butt=miter, bevel=square etc. see: https://artskydj.github.io/jsPDF/docs/jspdf.js.html#line4237
    lineCap?:'butt'|'round'|'bevel'
    lineJoin?:'butt'|'round'|'bevel'
    lineDashPattern?:Array<number|number> // size, space
    strokeColor?:string // 'red', '#FF0000'
    strokeOpacity?:number // [0.0-1.0] - NOTE: on jsPDF this is (set)drawColor 
    fillColor?:string
    fillOpacity?:number
    dash?: Array<number>
}

export interface PDFLinePath 
{
    path: string // the d of SVG paths in PDF coords: M 10 10 L 200 200 ...
    style: DocPathStyle
}


//// LAYOUTS ////

export type LayoutOrderType = 'line'|'grid'|'binpack'|'nest'

export interface LayoutOptions
{
    // for all
    autoRotate?:boolean // autoRotate Shape to align with one of the Axes
    flatten?:boolean // flatten to 2D
    stockWidth?: number 
    stockHeight?: number
    groupSame?: boolean
    margin?: number
    center?: boolean // center shape
    algo?:any
    drawStock?:boolean;
}

export interface Layout
{
    type?: LayoutOrderType
    options: LayoutOptions // TODO: type
    flatten:boolean // flatten to 2D
}

//// CALC MODULE ////

export type DataRowColumnValue = {[key:string]:any} // DataRow in column-value format
export type DataRowValues = Array<any> // DataRow with values only
export type DataRowsColumnValue = Array<DataRowColumnValue> // Array of DataRow as column-value
export type DataRowsValues = Array<DataRowValues> // Array of DataRow as values only
export type DataRows = DataRowsColumnValue | DataRowsValues 

export type MetricName = 'cost_material' | 'cost_labor' | 'production_time' | 'price_est' | 'price' | 'weight' | 'volume' | 'size' | 'r-value' // TODO: more

/** Metric is a element that outputs data in some way */
export interface Metric {
    name: MetricName // standardized name of Metric
    label: string // Label to be LACE VIEW SVshown to user
    type:'text'|'bar'|'line'|'radar' // TODO: more
    data: number|string|Array<number|string> // raw data (either value, array<value> or array<object>)
    options: TextMetricOptions // some options per type of Metric
    _component:string; // name of component that created this Metric
}

export interface MetricOptionsBase
{
    label: string
}

/** Options for TextMetric */
export interface TextMetricOptions extends MetricOptionsBase {
    label:string
    icon: string // materialdesign icon name
    color: any // TODO: typing
    pre: string // string before value
    unit: string // string after value
}

export type MetricOptions = TextMetricOptions // TODO more

/** Get data from table location  */
export interface TableLocation
{
    location: string // raw table location
    table: any // TMP DISABLED: Table, // for easy access to meta data like column names later
    column?: string // name of column
    row?:number // index of row
    data: any|Array<any>, // any data - format to be defined more clear
}

export interface DbCompareStatement 
{
    column: string,
    comparator: string,
    value: any,
    combine: string,
}

export interface CalcData
{
    tables: Object // { tablename: [{col, val}] }
    metrics: Object // { name : Metric, name2: Metric }
}

//// PARAM MANAGER ////
// NOTE: See above for general types around Params

export type ParamOperation = 'new'|'updated'|'deleted'

//// PUBLISH TYPES ////

export type PublishLicense = 'unknown' | 'copyright' | 'trademarked' | 'CC BY' | 'CC BY-SA' | 'CC BY-ND' | 'CC BY-NC' | 'CC BY-NC-SA' | 'CC BY-NC-ND' | 'CC0'

/** Extentions of Param for Publishing - data only! */
export interface PublishParam extends Omit<Param, '_behaviours'>
{
    // NOTE: need to nullify private attributes (for example behavious)
    order?:number // integer, lower is in front
    iterable?:boolean // for determine param variants
    description?:string // added for the user
    _behaviours?: Record<string,string> // stringified function for save to db etc
}

export interface PublishScriptSettings extends ArchiyouOutputSettings
{
    fulFillments:Array<any> // Will be phased out
}

// NOTE: This type will superseed any old OCCI and editor app types
export type PublishScript = {
    id?:string
    name:string // always lowercase
    title?:string // public title
    author?:string // None
    org?:string
    url?:string
    description?:string
    created_at?:Date
    updated_at?:Date
    version?:string
    prev_version?:string
    safe?:boolean
    published?:boolean
    units?:string
    params?:{[key:string]:PublishParam}
    param_presets?:{[key:string]:{[key:string]:Record<string,any>}}
    public_code?:boolean // show code in public script
    public_code_url?:string // url to edit public code
    code: string
    cad_engine?:string // archiyou
    cad_engine_version?:string
    cad_engine_config?:PublishScriptSettings 
    meta?:{[key:string]:any}
}


//// RUNNER ////


//// TYPES
export type RunnerExecutionContext = 'local' | 'worker'
export type RunnerRole = 'manager' | 'worker' | 'single'

export type ModelFormat = 'buffer'|'glb'|'svg'

//// INTERFACES

export interface RunnerOptions 
{
    context?: RunnerExecutionContext
}

export interface RunnerActiveScope 
{
    name: string
    context: RunnerExecutionContext
}

/** Basic structure of scope */
export interface RunnerScriptScopeState extends ProxyConstructor
{
    _scope:string // name of scope
    ay: ArchiyouApp
    // global references
    console: Console
    geom: Geom
    doc: Doc
    calc: Calc
    exporter: Exporter
    make: Make
    // Also classes (MORE TODO)
    Vector: typeof Vector
    Point: typeof Point
    Bbox: typeof Bbox
    Edge: typeof Edge
    Vertex: typeof Vertex
    Wire: typeof Wire
    Face: typeof Face
    Shell: typeof Shell
    Solid: typeof Solid
    ShapeCollection: typeof ShapeCollection
    Obj: typeof Obj
}

/** Simplified version of Script(Version) */
export interface RunnerScript
{
    code:string // code to execute
    params?:Record<string,PublishParam> // param settings
    // variants
}

/** Request results from executing a script 
 *  
 * TODO: Will replace ExecutionRequest in the future
*/
export interface RunnerScriptExecutionRequest
{
    script:RunnerScript|Script|ScriptData // script to execute
    component?:string // name of component if any
    params?:Record<string,any> // param values
    mode?: 'main'|'component'
    // What to calculate and output
    outputs?: Array<ExecutionRequestOutputPath>
    meta?: ScriptMeta | null // Metadata on pipelines, metrics, tables, docs etc
    onDone?: ((result:RunnerScriptExecutionResult) => any) // callback
}   



// path-like structure defining what and how to calculate and output
//  basic structure: {pipeline|default}/{entity}/{entity name or all=*}/{output format}?{options}
//  examples: 
//      - default/model/glb (or model/glb)
//      - default/model/glb?data=true&metrics=false
//      - default/tables/*/xls 
//      - cnc/model/dxf?2d 
//      - default/docs/spec/pdf
//
export type ExecutionRequestOutputPath = string;
export type ExecutionRequestOutputEntityGroup = 'model'|'metrics'|'tables'|'docs';
export type ExecutionRequestOutputFormat = 'internal'|'raw'|'buffer'|'glb'|'svg'|'step'|'stl'|'pdf'|'xls'|'*'; // TODO: * = export all formats
// internal is data direct from local system (so instances, Obj/Shapes etc), raw is pure data, buffer is vertex buffer for editor viewer, glb is binary glTF, svg is 2D SVG, step is STEP file, stl is STL file, pdf is PDF file, xls is Excel file

export interface ExecutionRequestOutput 
{
    path:string // original path
    pipeline?:string // pipeline name (default)
    entityGroup?:ExecutionRequestOutputEntityGroup
    entityName?:string // name or entity or * for all
    outputFormat?:ExecutionRequestOutputFormat
    options?:Record<string,any>|ExecutionRequestOutputFormatGLTFOptions // options for output format (default)
}

export interface ExecutionRequestOutputFormatGLTFOptions
{
    binary?:boolean // if true, output is binary glTF - default is true
    data?:boolean // if true, output Archiyou data in glTF
    metrics?:boolean // if data, include metric data in output
    tables?:boolean // if data, include tables data in output
    docs?:boolean // if data, incoutputs?: ExecutionResultOutputslude docs data in output
    pointAndLines?:boolean // if true, output points and lines in glTF
    shapesAsPointAndLines?:boolean // if true, output all shapes as extra points and lines in glTF
}


/* Total execution result tree 
    example: 
    {
        state: { ... },
        pipelines: 
    	{
		    cnc: 
            {
                model: 
                {
                    dxf : 
                    { 
                        options: {},
                        data: ....					
                    }
                }   
            }		
		}
	}
*/
export interface ExecutionResultOutputs
{
    state?: any // TODO
    pipelines?:Record<string, ExecutionResultPipeline>
}

export interface ExecutionResultOutput
{
    options?: Record<string,any> // TODO?
    data: any|string|ArrayBuffer|ExecutionResultOutputDataBase64 // raw internal, string (and base64) and ArrayBuffer
}

/** For exporting raw binary data in base64 format 
 *  see utils.ts 
*/
export interface ExecutionResultOutputDataBase64
{
    type: 'ArrayBuffer'|'Uint8Array'|'Uint16Array'|'Uint32Array'|'Int8Array'|
                'Int16Array'|'Int32Array'|'Float32Array'|'Float64Array'|'Buffer' // original data type
    data: string // base64 encoded data string
    length: number // length of data in bytes
}

// outputs of a pipeline
// { model: { 
//              glb: { options: ..., data: ... } 
//           }, 
//   docs: { testdoc : pdf : { options: {}, data: ... } }, tables }
export interface ExecutionResultPipeline 
{
    model?:Partial<Record<ExecutionRequestOutputFormat, ExecutionResultOutput>>|null // {outputformat}.{options, data}
    metrics?: Record<ExecutionRequestOutputFormat,ExecutionResultOutput> // {name}.{outputformat}.{options, data} - metrics per pipeline
    tables?: ExecutionResultPipelineNamed // {name}.{outputformat}.{options, data}
    docs?: ExecutionResultPipelineNamed // {name}.{outputformat}.{options, data}
}

export type ExecutionResultPipelineNamed =  Partial<Record<string, // name of doc or table
                                                    Partial<Record<ExecutionRequestOutputFormat, ExecutionResultOutput>>>>


/** Message from Worker to Manager */
export interface RunnerWorkerMessage
{
    type: 'init'|'loaded'|'executing'|'stopped'|'executed'|'console'|'save-step'|'save-stl'|'save-gltf'|'save-svg'|'save-svg-2d'
    payload: any //Record<string, any>
}

/** Message from Manager to Worker */
export interface RunnerManagerMessage 
{
    type: 'init'|'load'|'execute'|'stop'|'export-to-step'|'export-to-stl'|'export-to-gltf'|'export-to-svg'|'export-to-svg-2d'  
    payload?: any //Record<string, any>
}
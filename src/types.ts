import { Point, Vector, Shape, Vertex, Edge, Wire, Face, Shell, Solid, ShapeCollection, VertexCollection  } from './internal'
import { Geom, Doc, Container, DimensionLine, CodeParser, Exporter, Make, Calc, View } from './internal' // TMP DISABLED: Table
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
export type Coord = number|string
export type MainAxis = 'x'|'y'|'z'
export type Plane = 'xy' | 'xz' | 'yz'
export type Axis =  'x' | '-x' | 'y' | '-y' | 'z' | '-z' | Plane // Axis and Planes
export type Side = 'left'|'right'|'front'|'back'|'top'|'bottom'
export type SketchPlaneName = Plane | Side
export type CoordArray = Array<Coord>
export type PointLike = Coord|Array<Coord>|Vector|Point|Vertex // PointLike: All Datatypes that informationally could be seen as a Point
export type PointLikeSequence = Array<PointLike>|ShapeCollection // PointLikeSequence: An array of PointLike types
export type ShapeType = 'Vertex'|'Edge'|'Wire'|'Face'|'Shell'|'Solid'
export type ShapeTypes = Array<ShapeType>
export type LinearShape = Edge|Wire // LinearShape: A Shape that is linear.
export type PointLikeOrAnyShape = PointLike|AnyShape
export type AnyShape = Shape|Vertex|Edge|Wire|Face|Shell|Solid // Single Shape, excluding ShapeCollection
export type AnyShapeCollection = ShapeCollection|VertexCollection
export type AnyShapeSequence = AnyShapeCollection|Array<AnyShape> 
export type AnyShapeOrCollection = AnyShape|ShapeCollection // All Shapes and ShapeCollections
export type AnyShapeOrSequence = AnyShape|AnyShapeSequence
export type PointLikeOrVertexCollection = PointLike|VertexCollection
export type PointLikeOrAnyShapeOrCollection = PointLike|AnyShape|AnyShapeCollection
export type ColorInput = string|number
export type Pivot = PointLike|string
export type Alignment = string|PointLike // 'leftbottomtop' or [0,0.5,1.0]
export type BboxAlignment = Array<number>|Alignment // [bbox_offset_perc_x,bbox_offset_perc_y] or combinations of left, top, front
export type LinearShapeTail = 'start'|'end'
export type ThickenDirection = 'all'|'center'|PointLike|Side

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

/** A group of all modules of Archiyou for easy access  */
export interface ArchiyouApp
{
    worker?: any, // Keep track of scope of root scope of Archiyou core app - TODO: TS typing
    geom: Geom,
    doc?: Doc,
    console?: Console,
    executor?: CodeParser,
    exporter?: Exporter,
    calc?: Calc,
    make?: Make,
    // TODO: importer?
    gizmos?: Array<Gizmo>, // TODO: move this to Geom?
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
    TODO: We use ComputeResult internally - which has a lot of overlap with this
    When we start using GLB format internally these types will merge
*/
export interface ArchiyouData
{
    scenegraph: SceneGraphNode
    gizmos: Array<Gizmo>,
    annotations: Array<DimensionLineData>, 
    docs: {[key:string]:DocData} // all documents in data and serialized content
    errors?: Array<StatementError>, // only needed for internal use in the future
    messages?: Array<ConsoleMessage>, // NOTE: for internal use and export in GLTF
    metrics?: Record<string, Metric>,  
    tables?:{[key:string]:any}, // raw data tables
}

/** Data structure on the current state of the Archiyou App (mostly inside a worker) */
export interface ArchiyouAppInfo
{
    units?:ModelUnits // units of Geom._units
    numShapes?:number
    bbox?:ArchiyouAppInfoBbox // bbox of all shapes in scene
    hasDocs?:boolean // if there are docs part of the script
}

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

export interface StatementError 
{
    lineStart: number, // NOTE: lineIndex versus this!
    lineEnd: number,
    code: string,
    message : string,
}

export interface BaseStyle 
{
    color?: number, 
    opacity? : number,
    size?: number,
    dashed?: boolean
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

//// ANNOTATIONS ////

/** Bring all annotations in one type */
export type AnnotationType = 'base'|'dimensionLine' | 'label' // TODO MORE
export type Annotation = DimensionLine  // TODO: more: label

/** Exporting DimensionLine instances as data */
export interface DimensionLineData
{
    _id?:string, // internal id
    type:'dimensionLine'|'label', // TODO: more annotation types
    start:Array<number|number|number>
    end:Array<number|number|number>
    dir:Array<number|number|number>
    value:number
    static?:boolean // if value can be calculated from distance between start-end or is static (for example after projection)
    units?:string
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
    roundDecimals?:number // round to number decimals. Default is 0
}

//// DOC ////

export type DocUnits = 'mm'|'cm'|'inch'|'pnt'; 
export type PercentageString = string // 100%, 0.5%, -10%
export type ValueWithUnitsString = string
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


//// DOC:PAGE ////

export type PageSize = 'A0'|'A1'|'A2'|'A3'|'A4'|'A5'|'A6'|'A7';
export type PageOrientation = 'landscape'|'portrait';
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

export type ContainerType = 'view'|'image'|'text'|'textarea'|'table'
export type ContainerHAlignment = 'left'|'center'|'right'
export type ContainerVAlignment = 'top' | 'center' | 'bottom'
export type ContainerAlignment = Array<ContainerHAlignment | ContainerVAlignment> // like [left,top]
export type ContainerSide = 'width'|'height'
export type ZoomRelativeTo = 'container'|'world'
export type ScaleInput = 'auto'|number;
export type ContainerSizeRelativeTo = 'page' | 'page-content-area'; // page-content area is page without the padding on both sides
export type Position = Array<number|number>
export type PositionLike = Position|ContainerAlignment

export type ContainerData = { // Combine all Container types for convenience
    _entity:string
    name:string
    parent:string
    type:ContainerType
    width:number // relative to (see: widthRelativeTo)
    widthRelativeTo:ContainerSizeRelativeTo
    widthAbs?:number // in doc units (added on place)
    height:number // relative to (see: widthRelativeTo)
    heightRelativeTo:ContainerSizeRelativeTo
    heightAbs?:number // in doc units (added on place)
    position:Position // relative to page-content-area
    pivot:Position
    border?:boolean // border around container
    borderStyle?:DocPathStyle // style to draw border
    frame?:any // advanced shapes as border
    index?:number
    caption?:string
    contentAlign:ContainerAlignment // alignment of content inside container
    content:any; // TODO: raw content
    zoomLevel:ScaleInput, // number or 'auto' [default]
    zoomRelativeTo:ZoomRelativeTo,
    docUnits:DocUnits, 
    modelUnits:ModelUnits,
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

export interface TextOptions
{
    size?:number|string // saved in 'points' (like in Word) - units are also allowed but converted in options
    color?:string // always converted to hex
    // above parameters are directly plugged into pdfkit. see: https://pdfkit.org/docs/text.html#text_styling
    // TODO: other interesting options: font type (now only Helvetica), columns
    width?:number
    height?:number
    underline?:boolean
    strike?:boolean    
    oblique?:boolean
    align?:TextAreaAlign
}

//// DOCS:PAGE:CONTAINER:VIEW ////

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

export type TextAreaAlign = 'left'|'right'|'center'|'fill';

export interface TextAreaOptions
{
    size?:number|string // saved in 'point' (like in Word) - units are also allowed but converted in options
    color?:string // always converted to hex
    align?:TextAreaAlign
}

//// INTERFACES FOR OUTPUTS ////

export interface VertexMesh {
    objId : string,
    ocId : number,
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


/** Configurator on how to draw shapes on documents (HTML or PDF) */
export interface DocPathStyle {
    // see: https://pdfkit.org/docs/vector.html
    lineWidth?:number
    lineCap?:'butt'|'round'|'square'
    lineJoin?:'miter'|'bevel'|'round'
    dash?:Array<number|number> // size, space
    strokeColor?:string // 'red', '#FF0000'
    strokeOpacity?:number // [0.0-1.0]
    fillColor?:string
    fillOpacity?:number
}

export interface PDFLinePath 
{
    path: string // the d of SVG paths in PDF coords
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
export type DataRows = DataRowsColumnValue // DataRows

export type MetricName = 'cost_material' | 'cost_labor' | 'production_time' | 'price_est' | 'price' | 'weight' | 'volume' | 'size' | 'r-value' // TODO: more

/** Metric is a element that outputs data in some way */
export interface Metric {
    name: MetricName // standardized name of Metric
    label: string // Label to be shown to user
    type:'text'|'bar'|'line'|'radar' // TODO: more
    data: number|string|Array<number|string> // raw data (either value, array<value> or array<object>)
    options: TextMetricOptions // some options per type of Metric
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


import { Point, Vector, Shape, Vertex, Edge, Wire, Face, Shell, Solid, ShapeCollection, VertexCollection  } from './internal'
import { Geom, Doc, CodeParser, Exporter } from './internal'
import Console from './Console'

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

//// INTERFACES ////

/** A group of all modules of Archiyou for easy access  */
export interface ArchiyouState
{
    geom: Geom,
    doc: Doc,
    console: Console,
    executor: CodeParser,
    exporter: Exporter, 
    // TODO: importer?
    gizmos: Array<Gizmo>, // TODO: move this to Geom?
}

/** All possible attributes for Shapes */
// TODO: Can we allow user attributes??
export interface ShapeAttributes
{
    hidden?:boolean // lines that are hidden behind other shapes in projection
    outline?:boolean // outlines after projection
    visible?:boolean
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
    algo?:'AREA'|'LONGSIDE'|'SHORTSIDE'|'BOTTOMLEFT' // TODO MORE for other order types
    drawStock?:boolean;
    // for line
    // TODO
    // for grid
    // TODO
}

export interface Layout
{
    type?: LayoutOrderType
    options: LayoutOptions // TODO: type
    flatten:boolean // flatten to 2D
}

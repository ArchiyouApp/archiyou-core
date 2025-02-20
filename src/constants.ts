//// CONSTANTS ////
// Used in all of the codebase
// Enables fine grained settings
// See App settings in settings.ts

import { DocPathStyle } from './internal'

//// IMPORTANT FLAGS ////
export const USE_GARBAGE_COLLECTION = true; // if true, we will use garbage collection for OpenCascade objects
export const SHAPE_CACHE_ENABLED = false;

//// MISC SETTINGS

export const MESHING_MAX_DEVIATION = 0.1;
export const MESHING_ANGULAR_DEFLECTION = 0.5;
export const MESHING_MINIMUM_POINTS = 2;
export const MESHING_TOLERANCE = 1e-6;
export const MESHING_EDGE_MIN_LENGTH = 1e-6;

export const DEFAULT_WORKPLANE = [0,0,1]

//// SHAPES DEFAULTS ////

export const SHAPE_ARRAY_DEFAULT_OFFSET = 100;
export const SHAPE_EXTRUDE_DEFAULT_AMOUNT = 100;
export const SHAPE_SWEEP_DEFAULT_SOLID = true;
export const SHAPE_SWEEP_DEFAULT_AUTOROTATE = true;
export const SHAPE_SWEEP_DEFAULT_ALIGNMENT_TO_PATH = 'center';
export const SHAPE_SCALE_DEFAULT_FACTOR = 2;
export const SHAPE_ALIGNMENT_DEFAULT = 'center'
export const SHAPE_SHELL_AMOUNT = 5;

export const EDGE_DEFAULT_START = [0,0,0];
export const EDGE_DEFAULT_END = [1,0,0];
export const EDGE_DEFAULT_CIRCLE_RADIUS = 50;
export const EDGE_DEFAULT_OFFSET = 10;
export const EDGE_DEFAULT_THICKEN = 50;
export const EDGE_DEFAULT_POPULATE_NUM = 10;
export const EDGE_DEFAULT_EXTEND_AMOUNT = 10;
export const EDGE_DEFAULT_EXTEND_DIRECTION = 'end';
export const EDGE_DEFAULT_ALIGNTO_FROM = 'start';
export const EDGE_DEFAULT_ALIGNTO_TO = 'end';
export const EDGE_DEFAULT_SEGMENTS_ANGLE = 10; // in deg
export const EDGE_DEFAULT_SEGMENTS_ANGLE_SVG = 2; // in deg, higher resolution
export const EDGE_DEFAULT_SEGMENTS_SIZE = 100; // in units

export const WIRE_RECT_WIDTH = 100;
export const WIRE_RECT_DEPTH = 100;
export const WIRE_RECT_POSITION = [0,0,0]; // TODO: later remove when cursors come into play
export const WIRE_POPULATE_NUM = 10;
export const WIRE_COMBINE_RADIUS = 1;
export const WIRE_LOFTED_SOLID = true;
export const WIRE_SWEEPED_SOLID = true;
export const WIRE_SWEEPED_AUTOROTATE = true;
export const WIRE_SWEEPED_ALIGNTOPATH = 'center';
export const WIRE_THICKEN_AMOUNT = 10;
export const WIRE_THICKEN_DIRECTION = null; // meaning center
export const WIRE_OFFSET_AMOUNT = 10;
export const WIRE_OFFSET_TYPE = 'tangent';
export const WIRE_ALIGNTO_TAIL = 'start';
export const WIRE_FILLET_RADIUS = 10;
export const WIRE_CHAMFER_DISTANCE = 10;
export const WIRE_CHAMFER_ANGLE = 45;

export const SOLID_MAKEBOX_SIZE = 50;
export const SOLID_MAKESPHERE_RADIUS = 50;
export const SOLID_MAKESPHERE_ANGLE = 360;
export const SOLID_MAKECONE_BOTTOM_RADIUS = 50;
export const SOLID_MAKECONE_TOP_RADIUS = 0; // because thats a basic cone
export const SOLID_MAKECONE_HEIGHT = 50;
export const SOLID_CYLINDER_RADIUS = 50;
export const SOLID_CYLINDER_HEIGHT = 50;
export const SOLID_CYLINDER_ANGLE = 360;
export const SOLID_FILLET_RADIUS = 5;
export const SOLID_CHAMFER_DISTANCE = 5;
export const SOLID_THICKEN_AMOUNT = 5;
export const SOLID_THICKEN_DIRECTION = 'center';

export const FACE_PLANE_WIDTH = 50;
export const FACE_PLANE_DEPTH = 50;
export const FACE_PLANE_POSITION = [0,0,0];
export const FACE_PLANE_NORMAL = [0,0,1];
export const FACE_BASEPLANE_AXIS = 'xy';
export const FACE_BASEPLANE_SIZE = 1000;
export const FACE_CIRCLE_RADIUS = 50;
export const FACE_EXTRUDE_AMOUNT = 100;
export const FACE_OFFSET_AMOUNT = 10;
export const FACE_OFFSET_TYPE = 'tangent';
export const FACE_THICKEN_AMOUNT = 10;
export const FACE_THICKEN_DIRECTION = 'center';
export const FACE_LOFT_SOLID = true;
export const FACE_NORMAL_EDGE_SIZE = 10;
export const FACE_FILLET_RADIUS = 5;
export const FACE_CHAMFER_DISTANCE = 10;
export const FACE_CHAMFER_ANGLE = 45;

export const DOC_DIMENSION_LINES_TEXT_HEIGHT = 2.5; // in mm
export const DOC_CONTAINER_TITLE_TEXT_HEIGHT = 6; // in mm
export const DOC_CONTAINER_CAPTION_TEXT_HEIGHT = 3; // in mm
export const DOC_CONTAINER_CAPTION_TEXT_PADDING_FACTOR = 2; // applied to text height


//// DRAWING STYLES

// units are in points (corresponding to PDF units)
export const CLASS_TO_STYLE:Record<string, DocPathStyle> = {
    // standard line
    line: { 
        lineWidth: 0.425, // 0.15 mm
        lineCap: 'butt',
        lineJoin: 'butt',
    },
    dashed: {
        lineWidth: 0.425, // 0.15 mm
        dash: [ 11.339, 11.339] // size, space in points
    },
    hidden: {
        lineWidth: 0.142, // 0.05mm
    },
    outline : {
        lineWidth: 0.709, // 0.25mm
    },
    dimensionline : {
        lineWidth: 0.709, // 0.1mm
    },
}

//// MESH QUALITY OUTPUT SETTINGS ////

export const MESH_QUALITY_PRESETS = {
    'low' : { linearDeflection: 5.0, angularDeflection: 1.0, tolerance: 0.01, edgeMinimalPoints: 2, edgeMinimalLength: 0.001 },
    'medium' : { linearDeflection: 1.0, angularDeflection: 0.3, tolerance: 0.001, edgeMinimalPoints: 2, edgeMinimalLength: 0.001 },
    'high' : { linearDeflection: 0.4, angularDeflection: 0.1, tolerance: 0.001, edgeMinimalPoints: 2, edgeMinimalLength: 0.001 },
}

//// CALC MODULE ////

export const METRICS = [
    'cost_material', 
    'cost_labor', 
    'production_time', 
    'price_est', 
    'price', 
    'weight' , 
    'volume', 
    'size', 
    'r-value', 
    'gwp', // global warming potential with CO2 sequester
    ] // TODO: more

//// WORKER UTILS ////

//// Methods from geom that are imported into global under samen name and lowercase ////
export const GEOM_METHODS_INTO_GLOBAL = [
    'Point', 'Vector', 
    'Vertex', 'Edge', 'Line', 'Arc', 'Spline', 
    'Wire', 'Polyline', 'Spiral', 'Helix',
    'Face', 'Plane', 'PlaneBetween', 'Rect', 'RectBetween', 'BasePlane', 'Circle',
    'Shell', 'Solid', 'Box', 'BoxBetween', 'Sphere', 'Cone', 'Cylinder',
    'group', 'layer', 'collection',
    'layerShapes',
    'sketch', 'all', 'isTemp', 'select', 'atVertices', 'moveTo', 'lineTo', 'splineTo', 'arcTo', 
    'rectTo', 'rect', 'circleTo', 'circle', 'mirror', 'offset', 'offsetted', 'fillet', 'chamfer', 'thicken', 'thickened','combine',
    'close', 'importSketch',
    'units',
    'pipeline',
    ];



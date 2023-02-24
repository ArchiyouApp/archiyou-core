const geom = new Geom(); // get the Geometry tool out

const LENGTH = $LENGTH || 600;
const WIDTH = 240;
const WALL_BASE_HEIGHT = 220;
const MAX_ROOF_HEIGHT = $MAX_ROOF_HEIGHT || 400;
const WALL_THICKNESS = 10;
const ROOF_MID_PERC = $ROOF_MID_PERC || 50; // in percent from left side
let ENTRANCE_WIDTH = 300;
let ENTRANCE_HEIGHT = 200;

// calculated properties
let BIGGEST_PERC = (ROOF_MID_PERC < 50) ? 100 - ROOF_MID_PERC : ROOF_MID_PERC;
let BIGGEST_LENGTH = BIGGEST_PERC/100 * LENGTH;
let ROOF_ANGLE_RAD = Math.atan((MAX_ROOF_HEIGHT - WALL_BASE_HEIGHT)/BIGGEST_LENGTH);
let ROOF_ANGLE_DEG = Math.round(ROOF_ANGLE_RAD * 180/Math.PI);
let ROOF_LEFT_HEIGHT = (ROOF_MID_PERC/100 * LENGTH)*Math.tan(ROOF_ANGLE_RAD);
let WALL_LEFT_HEIGHT = WALL_BASE_HEIGHT + ROOF_LEFT_HEIGHT;
let ROOF_RIGHT_HEIGHT = ((100-ROOF_MID_PERC)/100 * LENGTH)*Math.tan(ROOF_ANGLE_RAD);
let WALL_RIGHT_HEIGHT = WALL_BASE_HEIGHT + ROOF_RIGHT_HEIGHT;

//// VOLUME ////
geom.layer("volume").color('blue');
let outline = new Face().fromVertices([
    [0, 0, 0],
    [0, 0, WALL_LEFT_HEIGHT],
    [ROOF_MID_PERC/100*LENGTH, 0, WALL_BASE_HEIGHT],
    [LENGTH, 0, WALL_RIGHT_HEIGHT],
    [LENGTH, 0, 0]
]).move([-LENGTH/2,0,0]);
let volume = outline.extruded(WIDTH);
let walls = volume.shelled(-WALL_THICKNESS, volume.select('F||bottom')).addToScene();

//// OPENINGS/WINDOWS ////

geom.layer('openings').color(100,0,0);

// SWEEPING/THICKENING TO MAKE FRAME NOT WORKING
/*
let profile = geom.Rect(10,10).toWire();
let entranceProfile = geom.Rect(ENTRANCE_WIDTH, ENTRANCE_HEIGHT).hide().
    toWire().addToScene()

// let entranceFrame = profile.sweeped(entranceProfile).addToScene();
profile.sweeped(geom.Line([0,0,0],[100,0,0])).addToScene();
*/

// entrance
const MARGIN_BETWEEN_ENTRANCE_AND_CORNER = 30;
let MAX_ENTRANCE_WIDTH = (100-BIGGEST_PERC)/100*LENGTH*2-MARGIN_BETWEEN_ENTRANCE_AND_CORNER*2;
let entranceWidth = (ENTRANCE_WIDTH > MAX_ENTRANCE_WIDTH) ? MAX_ENTRANCE_WIDTH : ENTRANCE_WIDTH;
let entranceSolid = geom.Box(entranceWidth, WALL_THICKNESS, ENTRANCE_HEIGHT, ).hide();
let entranceSolidInset = geom.Box(entranceWidth-WALL_THICKNESS*2,20,ENTRANCE_HEIGHT-WALL_THICKNESS*2).hide();
let entranceFrame = entranceSolid.subtracted(entranceSolidInset)
    .addToScene().move([0,0,ENTRANCE_HEIGHT/2]);

let midPoint = [ROOF_MID_PERC/100*LENGTH-LENGTH/2, 0, WALL_BASE_HEIGHT ];
entranceFrame.move([midPoint[0],0,0]);

let entranceHole = entranceFrame.bbox().box().select('F||front').first().extruded(-100).addToScene().hide();
walls.subtract(entranceHole);

// left window
const WINDOW_WIDTH = 100;
const WINDOW_HEIGHT = 150;
const WINDOW_SILL_HEIGHT = 100;
let windowSolid = geom.Box(10, WINDOW_WIDTH, WINDOW_HEIGHT).hide();
let windowSolidInset = geom.Box(10, WINDOW_WIDTH-2*10, WINDOW_HEIGHT-2*10).hide();
let windowLeft = windowSolid.subtracted(windowSolidInset).addToScene();
windowLeft.moveTo([-LENGTH/2, WIDTH/2, WINDOW_SILL_HEIGHT + WINDOW_HEIGHT/2 ]);
walls.subtract(windowLeft.bbox().box().select('F||left').first().extrude(-40).hide());

windowRight = windowLeft.mirrored('y').addToScene();
walls.subtract(windowRight.bbox().box().select('F||right').first().extrude(-40).hide());

//// ROOF LIGHTS ////
const ROOF_LIGHT_WIDTH = entranceWidth/2;
const ROOF_LIGHT_DEPTH = 100;
let roofLight = geom.Box(ROOF_LIGHT_WIDTH,100,800).move([midPoint[0],WIDTH/2, 0]);
walls.subtract(roofLight.hide());

//// FLOOR ////
const FLOOR_HEIGHT = 30;
let floor = geom.Box(LENGTH, WIDTH, FLOOR_HEIGHT).move([0,WIDTH/2,-FLOOR_HEIGHT/2]);
floor.chamfer(20, floor.select('F||bottom').select('E|Y'));

new ShapeCollection(geom.scene.allShapes()).move([0,0,FLOOR_HEIGHT+WHEEL_RADIUS]); // TODO: geom.all()

//// WHEELS ////
const WHEEL_RADIUS = 20;
const WHEEL_SPACING = 25;
let wheelFrontLeft = geom.Circle(WHEEL_RADIUS).extrude(20).move([0,0,-10]).rotateX(-90);
wheelFrontLeft.fillet(5, wheelFrontLeft.edges())
let wheelFrontRight = wheelFrontLeft.copy().move([WHEEL_RADIUS+WHEEL_SPACING, 0,0]).addToScene();
let wheelsFront = new ShapeCollection([wheelFrontLeft, wheelFrontRight]).move([0,0,WHEEL_RADIUS]);
// BUG with ShapeCollection.mirrored
wheelsFront.mirrored('x', [0,WIDTH/2,0]).addToScene();




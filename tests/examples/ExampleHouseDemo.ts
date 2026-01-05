const brep = new Brep(); // get the Brepetry tool out

const WALL_HEIGHT = 520;
const DEPTH = $DEPTH;
const WIDTH = 940;
const ROOF_HEIGHT = 430; 
const WALL_THICKNESS = 50;
const APPARTMENT_HEIGHT = 280;
const APPARTMENT_WIDTH = 400;
const APPARTMENT_WALL_HEIGHT = 230;
const APPARTMENT_BALCONY = 100

// Barn volume
let top = [0,DEPTH/2,WALL_HEIGHT+ROOF_HEIGHT];

let profile = brep.Face().fromVertices([
    [0,0,0],
    [0,0,WALL_HEIGHT],
    top,
    [0,DEPTH,WALL_HEIGHT],
    [0,DEPTH,0],
    ]).hide();

let volume = profile.extruded(-WIDTH);
let baseFace = volume.directionMinMaxSelector(volume.faces(), '-z');
let shell = volume.shelled(-WALL_THICKNESS, [baseFace]).addToScene();

let purlinPointFront = profile.edges()[1].populated(4).at(2).addToScene().color('blue');
let purlinPointBack = profile.edges()[2].populated(4).at(1).addToScene().color('blue');
let distancePurlins = purlinPointFront.distance(purlinPointBack);
let topLightSolid = new Face().makeRect(
                purlinPointFront.toVector().add([WALL_THICKNESS,0,-WALL_THICKNESS*2]),
                purlinPointFront.toVector().add([WIDTH-WALL_THICKNESS-50,distancePurlins,0]) // add some extra body of roof
                ).extruded(210).addToScene().hide();

let shell.cut(topLightSolid);

// windows
brep.layer("openings").color('blue');
const OPENING_WIDTH = 90;
const OPENING_TYPE_FRONT_HEIGHT = 100;
const OPENING_TYPE_BACK_HEIGHT = 50;
const OPENING_FROM_LEFT = 220;
const OPENING_START_HEIGHT = 150;

// front
let openingFrontLeft = brep.Box(OPENING_WIDTH,OPENING_WIDTH*2,OPENING_TYPE_FRONT_HEIGHT)
.move([OPENING_FROM_LEFT,0,OPENING_START_HEIGHT+OPENING_TYPE_FRONT_HEIGHT/2]);
let openingFrontRight = openingFrontLeft.moved([450,0,0]).addToScene();
let openingFrontRightTop = brep.Box(OPENING_WIDTH,OPENING_WIDTH*2,OPENING_TYPE_FRONT_HEIGHT*1.5)
.move([OPENING_FROM_LEFT+450,0,OPENING_START_HEIGHT+OPENING_TYPE_FRONT_HEIGHT/2+200]);

// back
let openingBackLeft = brep.Box(OPENING_WIDTH,OPENING_WIDTH*2,OPENING_TYPE_BACK_HEIGHT)
.move([OPENING_FROM_LEFT,DEPTH,OPENING_START_HEIGHT+OPENING_TYPE_BACK_HEIGHT/2]);
let openingBackRight = openingBackLeft.moved([450,0,0]).addToScene();

// doors left
const DOOR_HEIGHT = 220;
// note: because of shelling there is a floor plate of WALL_THICKNESS thickness
let doorOpening= brep.Box(100,200,DOOR_HEIGHT).move([0,DEPTH/2,DOOR_HEIGHT/2]);

// subtract all openings from shell
let openings = new ShapeCollection([openingFrontLeft,openingFrontRight,openingFrontRightTop,openingBackLeft,openingBackRight,doorOpening]);

shell.cut(openings); // remove others
openings.forEach(o => o.hide());
/* openings.hide(); TODO */

// appartment
const APP_WALL_THICKNESS = 15;
brep.layer("appartment").color('green');

let arc = new Edge().makeArc(
        [0,0,APPARTMENT_WALL_HEIGHT],
        [APPARTMENT_WIDTH/2,0,APPARTMENT_WALL_HEIGHT+APPARTMENT_WIDTH/2],
        [APPARTMENT_WIDTH,0,APPARTMENT_WALL_HEIGHT]
    );

let appSolid = new Face().fromWire(new Wire().fromEdges([
    new Edge([0,0,0],[0,0,APPARTMENT_WALL_HEIGHT]),
    arc,
    new Edge([APPARTMENT_WIDTH,0,APPARTMENT_WALL_HEIGHT],[APPARTMENT_WIDTH,0,0]),
    new Edge([APPARTMENT_WIDTH,0,0], [0,0,0]),
])).extrude(DEPTH-WALL_THICKNESS+APPARTMENT_BALCONY+APP_WALL_THICKNESS); // gets auto added with extrude !!!

let appSpace = appSolid.shelled(-APP_WALL_THICKNESS).addToScene(); // TODO select face to not shell

appSpace.move([0,-APP_WALL_THICKNESS-5,0])
    .cut( new Face().makeRect([0,0,0],[DEPTH, -DEPTH, 0]).extruded(1000), false)
    .move([WALL_THICKNESS,-APPARTMENT_BALCONY,APPARTMENT_HEIGHT]);

// cut solid of shell
appSolid.move([WALL_THICKNESS,-APPARTMENT_BALCONY,APPARTMENT_HEIGHT]);
shell.cut(appSolid, false);
appSolid.hide();

brep.layer("vide").color('purple');
let videBase = brep.Rect(
    purlinPointBack.moved([WALL_THICKNESS,0,0]), // BUG in Z-axis
    [APPARTMENT_WIDTH+APP_WALL_THICKNESS*2+20, distancePurlins, 0])
    .move([0,0,-315]).hide(); // make parametric

let videVolume = videBase.extruded(340).addToScene();
appSpace.cut(videVolume,false);
videVolume.hide();

let videSpace = videVolume.shelled(-15).cut(appSolid.copy()).addToScene();
let videFloor = videBase.extruded(15).addToScene(); // floor of vide
videSpace.cut( videBase.moved([0,0,310]).extruded(300), false); // TODO: make parametric

// back arch cut
let diam = (APPARTMENT_WIDTH-APP_WALL_THICKNESS*2);
let smallArcCut = new Edge().makeArc(
        [0,0,0],
        [diam/2,0,diam/2],
        [diam,0,0]
    ).move([WALL_THICKNESS+APP_WALL_THICKNESS,0,APPARTMENT_HEIGHT+APPARTMENT_WALL_HEIGHT])
    .toWire()
    .toFace()
    .extrude(1000, [0,1,0]).hide();    
appSpace.cut(smallArcCut, true);

// appartment windows
let bathOpening = brep.Box(40,100,200).move([WALL_THICKNESS+APPARTMENT_WIDTH, DEPTH/2, APPARTMENT_HEIGHT+100+15]).hide();
let officeOpening = brep.Box(40,200,120).move([WALL_THICKNESS+APPARTMENT_WIDTH, 180, APPARTMENT_HEIGHT+60+15+75]).hide();
appSpace.cut([bathOpening,officeOpening], true);

// layout for print
let cutBoxRight = brep.BasePlane('X').move([DEPTH-WALL_THICKNESS*2.0-10,0,0]).extrude(1000).hide();
shell.cut(cutBoxRight);
// place appartement on the ground
/*  TODO: nice layout function!*/
appSpace.align( new Vertex(-700,200,-50), 'bottomleft', 'bottom'); // BUG IN VERTEX ALIGNMENT
videSpace.align( new Vertex(0,-500,30), 'bottom', 'bottom'); // BUG IN VERTEX ALIGNMENT
videSpace.align( new Vertex(0,-500,30), 'bottom', 'bottom'); // BUG IN VERTEX ALIGNMENT
videFloor.align( new Vertex(0,-500,0), 'bottom', 'bottom');
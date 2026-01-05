const brep = new Brep(); // get the Brepetry tool out

//// PARAMS ////

const ROOF_WIDTH = $ROOF_WIDTH || 500; // cm
const ROOF_HEIGHT = $ROOF_HEIGHT || 400; // cm
const ROOF_DEPTH = 400; // cm
const WALL_HEIGHT = 300; // in cm
const DIAGONAL_ON_WALL_PERC = 0.7; // from start
const DIAGONAL_ON_ROOF_PERC = 0.5; // from start
const LATERAL_BEAM_PERC_OF_ROOF = 0.5;
const GORDING_ON_ROOF_PERC = 0.33;

const ROOF_BEAM_THICKNESS = 20;
const WALL_THICKNESS = 40;

//// DIAGRAM ////

brep.layer("diagram").color('blue');

let roofLine = brep.Line([0,0,0],[ROOF_WIDTH/2,ROOF_HEIGHT, 0]).hide();
let wallLine = brep.Line([0,0,0],[0,-WALL_HEIGHT,0]).hide();
let diagonalV1 = wallLine.pointAt(DIAGONAL_ON_WALL_PERC).toVertex().hide();
let diagonalV2 = roofLine.pointAt(DIAGONAL_ON_ROOF_PERC).toVertex().hide();
let diagonal = brep.Line(diagonalV1,diagonalV2).hide();
let lateralV = roofLine.pointAt(LATERAL_BEAM_PERC_OF_ROOF);
let lateral = brep.Line(lateralV,[ROOF_WIDTH/2, lateralV.y, 0]).hide();

let roofVec90 = roofLine.direction().normalize().rotated(90);
let gording = brep.Rect(20,20).alignByPoints([[0,0,0],[10,0,0]],[[0,0,0],[ROOF_WIDTH/2,ROOF_HEIGHT, 0]])
    .move(roofLine.pointAt(GORDING_ON_ROOF_PERC)).move(roofVec90.scaled(ROOF_BEAM_THICKNESS)).hide();

let lateralWallV = diagonal.intersection( brep.Line([0,0,0],[ROOF_WIDTH/2,0,0]).hide()).moved([20,0,0]); // extend a little
let laterialWall = brep.Line([0,0,0], lateralWallV).hide();

//// 2D ////

brep.layer("beams").color('red');

let centerPoint = [ROOF_WIDTH/2,0,0];

let roofBeam = roofLine.thickened(ROOF_BEAM_THICKNESS); //.addToScene();
let wall = wallLine.thickened(WALL_THICKNESS); //.addToScene();
let diagonalBeam = diagonal.thickened(15); //.addToScene();
let lateralBeam = lateral.thickened(15); //.addToScene();
let lateralWallBeam = laterialWall.thickened(15); //.addToScene();
let gordingBeam = gording.extruded(ROOF_DEPTH); //.addToScene();
let gordingBeam2 = gordingBeam.moved(roofLine.direction().scaled(GORDING_ON_ROOF_PERC)); //.addToScene();

let topBeam = brep.Box(20,20,ROOF_DEPTH).move([ROOF_WIDTH/2, ROOF_HEIGHT,ROOF_DEPTH/2]);
let verticalBeam = brep.Box(10,ROOF_HEIGHT-lateralV.y-20,10).move([ROOF_WIDTH/2, lateralV.y+(ROOF_HEIGHT-lateralV.y-20)/2,7.5 ]);

//roofBeam.unioned(wall).unioned(diagonalBeam).unioned(lateralBeam).unioned(lateralWallBeam); //.addToScene().move([0,0,100]).extrude(100);
// EXTRUDE DOES NOT CHANGE THE OLD REFERENCE ---?
roofBeam = roofBeam.extruded(ROOF_BEAM_THICKNESS, [0,0,1]).addToScene();
wall = wall.extruded(ROOF_DEPTH, [0,0,1]).addToScene();
diagonalBeam = diagonalBeam.extruded(15, [0,0,1]).addToScene();
lateralBeam = lateralBeam.extruded(15, [0,0,1]).addToScene();
lateralWallBeam = lateralWallBeam.extruded(15, [0,0,1]).addToScene();
let roofConstrLeft = new ShapeCollection([roofBeam,diagonalBeam,lateralBeam,lateralWallBeam, gordingBeam, gordingBeam2]); 
let roofConstrRight = roofConstrLeft.mirrored('yz', [ROOF_WIDTH/2,0,0]).addToScene();
rightWall = wall.mirrored('yz',[ROOF_WIDTH/2,0,0]).addToScene();
let totalRoofPortal = new ShapeCollection([roofConstrLeft, roofConstrRight, verticalBeam]);
let totalRoofPortalFront = totalRoofPortal.mirrored('xy', [0,0,ROOF_DEPTH/2]).addToScene();
let total = new ShapeCollection([totalRoofPortal, totalRoofPortalFront, wall, rightWall, topBeam]);
total.move([0,0,200]);
total.forEach( shape => shape.rotateAround(90, [1,0,0], [0,0,0]).move([-ROOF_WIDTH/2,0,WALL_HEIGHT])); // TODO ShapeCollection.rotateAround



const brep = new Brep(); // get the Brepetry tool out

//// IN CM ////
let BASE_BOARD_WIDTH = $BASE_BOARD_WIDTH || 15; // variable: 10-24?
let BASE_BOARD_THICKNESS = 2.2; // variable: 1.8-4.4
const CHAIR_WIDTH_NUM_BOARDS = $WIDTH_NUM_BOARDS;

let SEAT_ANGLE = $SEAT_ANGLE_TEST || 10; // degrees
let SEAT_DEPTH = 45; 
let SEAT_GAP = 5;
let SEAT_BACK_HEIGHT = 45;
let SEAT_BACK_ANGLE = 10; // 0 = 90 degrees with SEAT_ANGLE

//// CALCULATED PROPERTIES ////

let TRIPLE_BOARD = BASE_BOARD_WIDTH * 3;

let seatVec = new Vector(SEAT_DEPTH,0,0).rotate(-SEAT_ANGLE); // around z-axis
let seatGapVec = seatVec.rotated(90-SEAT_BACK_ANGLE)
    .normalize().scaled(SEAT_GAP);
let seatBackVec = seatVec.rotated(90-SEAT_BACK_ANGLE)
    .normalize()
    .scaled(SEAT_BACK_HEIGHT); 

// rotate vectors from XY to XZ
seatVec.rotate(90, [1,0,0]);
seatGapVec.rotate(90, [1,0,0]);
seatBackVec.rotate(90, [1,0,0]);

let CHAIR_DEPTH = seatVec.x  + seatGapVec.x + seatBackVec.scaled(0.5).x;

///// DIAGRAM ////
brep.layer('lines').color('red');

let seatLine = brep.Line([0,0,0], seatVec);
let backLine = brep.Line( seatVec.added(seatGapVec), seatVec.added(seatGapVec).added(seatBackVec) );

let seatFace = seatLine.extruded(50,[0,1,0]).addToScene();
let backFace = backLine.extruded(50,[0,1,0]).addToScene();

brep.layer('sideRight').color('blue');

//// SIDE RIGHT ////
const HANDRAIL_WIDTH = 6.5;
/*
let sideRightHorizontal = brep.Box(CHAIR_DEPTH, BASE_BOARD_THICKNESS, BASE_BOARD_WIDTH)
                    .move([CHAIR_DEPTH/2, -2*BASE_BOARD_THICKNESS + (BASE_BOARD_THICKNESS/2),0]);
let sideRightLegFront = brep.Box(BASE_BOARD_WIDTH, BASE_BOARD_THICKNESS, TRIPLE_BOARD)
                .move([BASE_BOARD_WIDTH/2, -3*BASE_BOARD_THICKNESS + (BASE_BOARD_THICKNESS/2),0]);
let sideRightLegBack = brep.Box(BASE_BOARD_WIDTH, BASE_BOARD_THICKNESS, TRIPLE_BOARD)
                        .move([CHAIR_DEPTH-BASE_BOARD_WIDTH/2,-BASE_BOARD_THICKNESS/2,0]);
let sideRightHandrail = brep.Box(CHAIR_DEPTH, HANDRAIL_WIDTH,  BASE_BOARD_THICKNESS)
        .move([CHAIR_DEPTH/2, -2*BASE_BOARD_THICKNESS + (BASE_BOARD_THICKNESS/2), TRIPLE_BOARD/2+BASE_BOARD_THICKNESS/2]);

let sideRight = new ShapeCollection([sideRightHorizontal,sideRightLegFront,sideRightLegBack,sideRightHandrail]);

//// BACK ////
// start at the XY plane
const BACK_BOARD_SPACING = 3;

brep.layer('back').color('green');

let backBoard = brep.Box(backLine.length(),BASE_BOARD_WIDTH, BASE_BOARD_THICKNESS).move([100,0,0]);

backBoard.alignByPoints(['leftfrontbottom', 'rightfrontbottom', 'rightbackbottom'], 
   [backLine.start(),backLine.end(), backFace.vertices()[1]]); // TODO: side selector


let backBoardCollection = backBoard.hide()._array1D(CHAIR_WIDTH_NUM_BOARDS, [0,BASE_BOARD_WIDTH+BACK_BOARD_SPACING,0]).addToScene();

const CHAIR_WIDTH_BACK = CHAIR_WIDTH_NUM_BOARDS*(BASE_BOARD_WIDTH+BACK_BOARD_SPACING) - BACK_BOARD_SPACING;
let backBoardHorizontal = brep.Box(HANDRAIL_WIDTH, 
                        CHAIR_WIDTH_BACK, 
                        BASE_BOARD_THICKNESS);

backBoardHorizontal.alignByPoints(
                        ['frontrighttop', 'backrighttop', 'frontlefttop'],
                        [backFace.select('V||frontrighttop')[0], backFace.select('V||backrighttop')[0], backFace.select('V||frontleftbottom')[0]]);
// TODO: Return when only one result in select if single!
// TODO: Access tight Bbox so that we can get width of Box 
let backBoardHorizontalBottom = backBoardHorizontal.copy().move(seatBackVec.reversed().added(seatBackVec.normalized().scale(HANDRAIL_WIDTH))).addToScene();

let back = brep.group([backBoardCollection,backBoardHorizontal, backBoardHorizontalBottom]);

//// SEATING ////
brep.layer('seat').color('purple');

let seatingBoard = brep.Box(seatLine.length(), BASE_BOARD_WIDTH, BASE_BOARD_THICKNESS);
// AlignByPoint and selectors don't work very well for Faces

seatingBoard.rotateY(SEAT_ANGLE).align(seatFace, 'leftfrontbottom', 'leftfrontbottom'); 
// TODO: align same

let seatingBoards = seatingBoard.hide()
    ._array1D(CHAIR_WIDTH_NUM_BOARDS, [0,BASE_BOARD_WIDTH+BACK_BOARD_SPACING,0]).addToScene();

const CHAIR_WIDTH_SEATING = CHAIR_WIDTH_NUM_BOARDS*(BASE_BOARD_WIDTH+BACK_BOARD_SPACING) - BACK_BOARD_SPACING + BASE_BOARD_THICKNESS*2;
seatingHorizontalFront = brep.Box(HANDRAIL_WIDTH, 
                        CHAIR_WIDTH_SEATING, 
                        BASE_BOARD_THICKNESS);

// this is working. Not with previously rotated Box
seatingHorizontalFront.alignByPoints(
                            [ seatingHorizontalFront.select('V||fronttopleft')[0] ],
                            [ seatLine.start()]
                        ).rotateY(SEAT_ANGLE); // WRONG ANGLE DIRECTION
seatingHorizontalFront.move([0,-BASE_BOARD_THICKNESS,0]); // attach to side - this is different than original design
seatingHorizontalBack = seatingHorizontalFront.moved(seatVec.subtracted(seatVec.normalized().scaled(HANDRAIL_WIDTH))).addToScene();

let seating = brep.group([seatingBoards,seatingHorizontalFront,seatingHorizontalBack]);

//// LEFT - JUST MIRROR RIGHT ////
brep.layer('left').color('blue');
let sideLeft = sideRight.mirrored('x', [0,CHAIR_WIDTH_SEATING/2-BASE_BOARD_THICKNESS,0]).addToScene();

let chair = brep.group([sideRight, sideLeft, seating, back]);
chair.move([0,-(CHAIR_WIDTH_SEATING/2-BASE_BOARD_THICKNESS),TRIPLE_BOARD/2]);

seatLine.hide();
seatFace.hide();
backLine.hide();
backFace.hide();
*/
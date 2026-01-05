import { Brep, Wire,Solid, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep:Brep;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test("ExampleTinyHouse", () => 
{
    
    const brep = new Brep(); // get the Brepetry tool out

    const LENGTH = 600; 
    const WIDTH = 240;
    const WALL_BASE_HEIGHT = 220;
    const MAX_ROOF_HEIGHT = 400;
    const WALL_THICKNESS = 10;
    const ROOF_MID_PERC = 60; // in percent from left side
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
    brep.layer("volume").color('blue');
    let outline = brep.Wire(
        [0, 0, 0],
        [0, 0, WALL_LEFT_HEIGHT],
        [ROOF_MID_PERC/100*LENGTH, 0, WALL_BASE_HEIGHT],
        [LENGTH, 0, WALL_RIGHT_HEIGHT],
        [LENGTH, 0, 0]
    ).move(-LENGTH/2) as Wire;
    let volume = outline.toFace().extrude(WIDTH).hide();
    let walls = volume.shelled(-WALL_THICKNESS, 'F||bottom')
                    .color('red');


    //// ENTRANCE ////

    const MARGIN_BETWEEN_ENTRANCE_AND_CORNER = 30;
    const MAX_ENTRANCE_WIDTH = (100-BIGGEST_PERC)/100*LENGTH*2-MARGIN_BETWEEN_ENTRANCE_AND_CORNER*2;

    brep.layer('entrance').color('orange');

    let entranceWidth = (ENTRANCE_WIDTH > MAX_ENTRANCE_WIDTH) ? MAX_ENTRANCE_WIDTH : ENTRANCE_WIDTH;
    let midPoint = [ROOF_MID_PERC/100*LENGTH-LENGTH/2, 0, WALL_BASE_HEIGHT ];
    
    /*
    entranceFrame = $import('FrameBasic', 
                    {WIDTH:entranceWidth,HEIGHT:ENTRANCE_HEIGHT,THICKNESS:15,DEPTH:WALL_THICKNESS+5})
    entranceFrame.move(midPoint[0],0,ENTRANCE_HEIGHT/2);
    walls.subtract(entranceFrame.bbox().box());
    */

    //// WINDOWS ////

    brep.layer('windows').color([100,0,0]);

    // left window
    const WINDOW_WIDTH = 100;
    const WINDOW_HEIGHT = 150;
    const WINDOW_SILL_HEIGHT = 100;

    /*
    windowLeft = $import('FrameBasic', 
                    {WIDTH:WINDOW_WIDTH,HEIGHT:WINDOW_HEIGHT,THICKNESS:15,DEPTH:WALL_THICKNESS+5})
    windowLeft
        .rotateZ(-90)
        .moveTo([-LENGTH/2+5, WIDTH/2, WINDOW_SILL_HEIGHT + WINDOW_HEIGHT/2 ]);

    walls.subtract(windowLeft.bbox().box());

    windowRight = windowLeft.mirrored('y');
    walls.subtract(windowRight.bbox().box().select('F||right').first().extrude(-40).hide());
    */

    //// ROOF LIGHTS ////
    const ROOF_LIGHT_WIDTH = entranceWidth/2;
    const ROOF_LIGHT_DEPTH = 100;
    let roofLight = brep.Box(ROOF_LIGHT_WIDTH,100,800).move(midPoint[0],WIDTH/2, 0);
    walls.subtract(roofLight.hide());

    //// FLOOR ////
    brep.layer('floor').color([20,5,5])
    const FLOOR_HEIGHT = 30;
    let floor = brep.Box(LENGTH, WIDTH, FLOOR_HEIGHT).move([0,WIDTH/2,-FLOOR_HEIGHT/2]);
    (floor as Solid).chamfer(20, floor.select('F||bottom').select('E|Y'));

    let WHEEL_RADIUS = 20;
    let WHEEL_SPACING = 25;

    brep.all().move([0,0,FLOOR_HEIGHT+WHEEL_RADIUS]); 

    //// WHEELS ////
    brep.layer('wheel').color([5,5,20]);

    let wheelFrontLeft = brep.Circle(20).extrude(20).move(0,0,-10).rotateX(-90) as Solid;
    wheelFrontLeft.fillet(5); // all edges
    let wheelFrontRight = wheelFrontLeft.copy().move(WHEEL_RADIUS+WHEEL_SPACING);
    let wheelsFront = brep.Collection(wheelFrontLeft, wheelFrontRight).move(0,0,WHEEL_RADIUS);
    wheelsFront.mirrored([0,WIDTH/2,0],[0,1,0]);

});






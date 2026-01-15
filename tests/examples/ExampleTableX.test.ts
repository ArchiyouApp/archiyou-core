import { Brep, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep:Brep;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test("ExampleTableX", () => 
{
    const WIDTH = 100;
    const DEPTH = 70;
    const HEIGHT = 70;
    const LEG_SIZE = 5;
    const TOP_THICKNESS = 5;

    // leg
    const legHeight = HEIGHT-TOP_THICKNESS;
    const leg = brep.Box(LEG_SIZE, LEG_SIZE, legHeight, 
        [LEG_SIZE/2, LEG_SIZE/2,legHeight/2]) // start position of leg

    // 4 legs
    const legs = leg.array([2,2],[WIDTH-LEG_SIZE,DEPTH-LEG_SIZE]).color('green');

    // table top
    const top = brep.BoxBetween(
        [0,0,legHeight],
        [WIDTH, DEPTH, legHeight+TOP_THICKNESS])
        .color('green');

    expect(top.faces().length).toEqual(6);

    // finish table top
    top.fillet(1,'Face||top');
    expect(top.faces().length).toEqual(10);

    expect(legs.count()).toEqual(4);
    
});


test("ExampleTableXAdv", () => 
{
    
    const LEG_SIZE = 5; // in cm
    const WIDTH = 100; // from parameter menu
    const DEPTH = 70;
    const HEIGHT = 70;
    const TOP_THICKNESS = 5;
    const TOP_OVERHANG = 10;
    const TOP_CHAMFER = 3;
    const TOP_FILLET = 1;

    const contour = brep.Rect(WIDTH,DEPTH).color('grey');
    const contourInside = contour.offsetted(-TOP_OVERHANG+LEG_SIZE/2).color('grey');

    const legHeight = HEIGHT-TOP_THICKNESS;
    const leg = brep.Box(LEG_SIZE, LEG_SIZE, legHeight).hide();
    contourInside.vertices().forEach( v => leg.copy().color('green').align(v, 'bottom'))

    const tableTop = contour.extruded(TOP_THICKNESS, [0,0,1]).move(0,0,legHeight).color('green');
    expect(tableTop.faces().length).toEqual(6);

    tableTop.chamfer(TOP_CHAMFER, 'F||bottom');
    tableTop.fillet(TOP_FILLET, 'F||top')

    
});

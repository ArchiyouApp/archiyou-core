import { Geom, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let geom;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    geom = new Geom(); // needed to set oc on all other Shapes
});

test("ExampleTableX", () => 
{
    const WIDTH = 100;
    const DEPTH = 70;
    const HEIGHT = 70;
    const LEG_SIZE = 5;
    const TOP_THICKNESS = 5;

    // leg
    let legHeight = HEIGHT-TOP_THICKNESS;
    let leg = geom.Box(LEG_SIZE, LEG_SIZE, legHeight, 
        [LEG_SIZE/2, LEG_SIZE/2,legHeight/2]) // start position of leg

    // 4 legs
    let legs = leg.array([2,2],[WIDTH-LEG_SIZE,DEPTH-LEG_SIZE]).color('green');

    // table top
    let top = geom.BoxBetween(
        [0,0,legHeight],
        [WIDTH, DEPTH, legHeight+TOP_THICKNESS])
        .color('green');

    // finish table top
    top.fillet(1,'Face||top')
    expect(legs.count()).toEqual(4);
    expect(top.faces().length).toEqual(10);
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

    let contour = geom.Rect(WIDTH,DEPTH).color('grey');
    let contourInside = contour.offsetted(-TOP_OVERHANG+LEG_SIZE/2).color('grey');

    let legHeight = HEIGHT-TOP_THICKNESS;
    let leg = geom.Box(LEG_SIZE, LEG_SIZE, legHeight).hide();
    contourInside.vertices().forEach( v => leg.copy().color('green').align(v, 'bottom'))

    let tableTop = contour.extruded(TOP_THICKNESS, [0,0,1]).move(0,0,legHeight).color('green');
    tableTop.chamfer(TOP_CHAMFER, 'F||bottom');
    tableTop.fillet(TOP_FILLET, 'F||top')

    expect(tableTop.faces().length).toEqual(14);
});

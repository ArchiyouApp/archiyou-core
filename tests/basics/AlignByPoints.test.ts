import { Brep, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep: Brep;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test("AlignByPoint2", () => 
{
    let b1 = brep.Box(100,50,10).alignByPoints(
        ['leftfrontbottom','rightfrontbottom'], 
        [[0,0,0],[1,1,0]]); 
    expect(b1.edges()[1].direction().normalized().round().toArray()).toEqual([-0.707, 0.707, 0]);
});


test("AlignByPoint3", () => 
{
    let b2 = brep.Box(100,50,10).alignByPoints(
        ['leftfrontbottom','rightfrontbottom','rightbackbottom'], 
        [[0,0,0],[1,0,0],[0,1,1]]);
    expect(b2.faces()[2].normal().round().toArray()).toEqual([-0, -0.707, -0.707]);
    
});
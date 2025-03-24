import { Geom } from '../../src/internal' // import only from internal, otherwise we get circular import problems
import { OcLoader } from '../../src/OcLoader'

import { test, beforeAll, expect } from 'vitest'
let geom;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    geom = new Geom(); // needed to set oc on all other Shapes
});

test("Bbox3D", () => 
{
    const b = geom.Box(100,10,200).rotateZ(10);
    const obb = b.obbox();
    expect(obb.width()).toEqual(10);
    expect(obb.depth()).toEqual(100);
    expect(obb.height()).toEqual(200);
    expect(Array.isArray(obb.corners())).toEqual(true);
    // expect(obb.box().volume()).toEqual(100*10*200); // inaccuracy here!
    expect(obb.is3D()).toEqual(true);
    expect(obb.is2D()).toEqual(false);
})

test("Bbox2D", () => 
{
    const r = geom.Rect(100,10).moveY(-100).rotateZ(30);
    expect(r.obbox().is2D()).toEqual(true);
    expect(r.obbox().depthHalfLine().type()).toEqual('Edge');
})


//// MAIN ////





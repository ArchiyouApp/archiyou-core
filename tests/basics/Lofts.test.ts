import { Vector, Geom } from '../../src/internal' // import only from internal, otherwise we get circular import problems
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

test("LoftClosed", () => 
{
    let c = geom.Circle();
    let r = geom.Rect().move(0,0,100);
    let v = geom.Vertex(200,0,300);
    let lft1 = c.lofted([r,v], true).move(100);
    let lft2 = c.lofted([r,v], false).move(200); // don't make a solid
    expect(lft1.faces().length).toEqual(6); // 6
    expect(lft2.faces().length).toEqual(5); // 5
});


test("LoftOpen", () => 
{
    let l1 = geom.Polyline([0,0],[100,0],[100,100]).move(0,200);
    let a = geom.Arc([0,0],[0,50],[50,50]).move(0,200,300);
    let v2 = geom.Vertex(0,150,500)
    let lft3 = l1.lofted([a,v2]);
    expect(lft3.faces().length).toEqual(2) // 2
});

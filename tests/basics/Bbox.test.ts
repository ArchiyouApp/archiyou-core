import { OcLoader, Brep } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep:Brep;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test("Bbox 2D", () => 
{
    let pl = brep.Plane(100,200);
    expect(pl.bbox().area()).toEqual(20000);
    expect(pl.bbox(100,100).enlarged(10).width()).toEqual(120);
    expect(pl.bbox(100,100).enlarged(100).height()).toEqual(0); // don't scale zero height so Bbox stays 2D!
})

test("Bbox 3D", () => 
{
    let b = brep.Box(10,10);
    expect(b.bbox().area()).toEqual(600);
})


//// MAIN ////





import { Vector, Brep, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep:Brep;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test("Bbox", () => 
{
    let b1 = brep.Rect(100,100);
    let b2 = brep.Rect(100,100).move(50,50);
    let c = brep.group(b1,b2);
    expect(c.bbox().toData()).toEqual([-50,100,-50,100,0,0]);
});

test("copy", () => 
{
    const g1 = brep.group(brep.Box(10),brep.Box(20));
    const g2 = g1.copy();
    expect(g2[0].bbox().width() === g1[0].bbox().width()).toEqual(true);
}
);

test("fakeKeyIndices", () =>
{
    const g1 = brep.group(brep.Box(10),brep.Box(20));
    const g2 = g1.shallowCopy();
    console.log(g1[0]);
    console.log(g2[0]);
    expect(g2[0].equals(g1[0])).toEqual(true);
});


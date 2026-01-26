import { OcLoader, Brep, Doc  } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep:Brep;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test('Basic Alignment', () =>
{
    brep.layer("base").color('black');
    const base = brep.Box(200,200,10);

    brep.layer("tower1").color('red');
    let b1 = brep.Box(100,100,50).align(base, 'leftbottomback', 'leftbacktop');
    let b2 = brep.Box(30,20,20).align(b1, 'rightfrontbottom', 'rightfronttop');
    let s1 = brep.Sphere(30/2).align(b2, 'centerbottom', 'rightfronttop');

    const coll = brep.collection(base,b1, b2, s1);
    expect(coll).toBeDefined();
    expect(coll.length).toBe(4);
    expect(coll.bbox()?.height()).toBe(110); // 10+50+20+30
});



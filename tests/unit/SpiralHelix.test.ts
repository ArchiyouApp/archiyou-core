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

test("Spiral", () => 
{
    expect(brep.Spiral(100,100, 360).length()).toEqual(628.319); // 2*PI*100
})

test("Helix", () => 
{
    expect(brep.Helix(200,200,360).length()).toEqual(1272.453); // 2*PI*100
})


//// MAIN ////





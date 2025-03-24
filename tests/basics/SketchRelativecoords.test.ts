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

test("Sketch Relative", () => 
{
    let w = geom.sketch('left')
    .lineTo(100,100)
    .lineTo('100<<-90')
    .lineTo('-100', '+0')
    .lineTo('200<<45')
    .lineTo('100<<-90')
    .arcTo(['+0','+40'],['+100', '+100'])
    .importSketch();

    expect(Math.round(w.length())).toEqual(833);
})




//// MAIN ////





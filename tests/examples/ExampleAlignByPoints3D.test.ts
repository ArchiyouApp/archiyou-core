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

test('align', () => 
{
    brep.layer("original").color('blue');
    const box = brep.BoxBetween(
            [0,0,0],
            [-10,10,10]
            ).move(-100);

    const line = brep.Line([0,0,0],[100,100,100]);

    expect(box.distance(line)).toBe(100);

    // rotate the box aligned to the line
    box.alignByPoints(
        ['leftbottomfront', 'rightbottomfront'], 
        [line.start(), line.end()]);

    expect(box.distance(line)).toBe(0);

})

import { Shell, Geom } from '../../src/internal' // import only from internal, otherwise we get circular import problems
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

test("Shell.fromWireframe plane", () => 
{
    // Simple plane wireframe
    const edges = geom.Plane(100,50).edges().moved(150);
    const s1 = new Shell().fromWireFrame(edges);
    expect(s1.type()).toEqual('Shell');
    expect(s1.faces().length).toEqual(1);
})

test("Shell.fromWireframe box", () => 
    {
        // Box wireframe
    const edges2 = geom.Box(60,50,20).move(300).edges();
    const s2 = new Shell().fromWireFrame(edges2);
    expect(s2.type()).toEqual('Shell')
    expect(s2.faces().length).toEqual(6);
})

test("Shell.fromWireframe fragmented box", () => 
{
    // Fragmented box wireframe
    const edges3 = geom.Box(60,50,20).move(300).select('E[0-3] and E[7-11]');
    const s3 = new Shell().fromWireFrame(edges3);
    expect(s3.type()).toEqual('Shell')
    expect(s3.faces().length).toEqual(2);
})



  





//// MAIN ////





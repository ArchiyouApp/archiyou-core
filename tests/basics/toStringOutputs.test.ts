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

test("toStringOutputs", () => 
{
    expect(brep.Vertex(0).toString()).toEqual('<Vertex position="[0,0,0]">');
    expect(brep.Line([0,0,0],[100,0,0]).toString()).toEqual('<Edge:Line start="[0,0,0]" end="[100,0,0]">');
    expect(brep.Circle().toString()).toEqual('<Face:Planar numVertices="1" numEdges="1">');
    expect(brep.Rect().toString()).toEqual('<Face:Planar numVertices="4" numEdges="4">');
});


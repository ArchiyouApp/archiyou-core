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

test("toStringOutputs", () => 
{
    expect(geom.Vertex(0).toString()).toEqual('<Vertex position="[0,0,0]">');
    expect(geom.Line([0,0,0],[100,0,0]).toString()).toEqual('<Edge:Line start="[0,0,0]" end="[100,0,0]">');
    expect(geom.Circle().toString()).toEqual('<Face:Planar numVertices="1" numEdges="1">');
    expect(geom.Rect().toString()).toEqual('<Face:Planar numVertices="4" numEdges="4">');
});


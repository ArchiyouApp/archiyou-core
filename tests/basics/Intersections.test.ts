import { Vector, Geom } from '../../src/internal' // import only from internal, otherwise we get circular import problems
import OcLoader from '../../src/OcLoader'

// see Jest docs: https://jestjs.io/docs/expect

let geom;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    geom = new Geom(); // needed to set oc on all other Shapes
});

test("Intersection Basics", () => 
{
    const v1 = geom.Vertex(100,0,0);
    const v2 = geom.Vertex(100,100,100);
    const v3 = geom.Vertex(100,100,100);
    const lv = geom.Line([0,-50],[0,50])
    const lh = geom.Line([-100,0],[200,0])
    const b = geom.Box();
    const s = geom.Sphere(200);

    // vertex - vertex
    expect(v1.intersection(v2)).toEqual(null); // null
    expect(v2.intersection(v3).toArray()).toEqual([100,100,100]); // Vertex(100,100,100)
    expect(v3.intersection(v2).toArray()).toEqual([100,100,100]); // Vertex(100,100,100)
    // vertex - edge
    expect(v1.intersection(lh).toArray()).toEqual([100,0,0]); // V(100,0,0)
    // edge - edge
    expect(lv.intersection(lh).toArray()).toEqual([0,0,0]); // V(0,0,0)
    // vertex - solid
    expect(b.intersection(v1)).toEqual(null); // null
    expect(s.intersection(v1).toArray()).toEqual([100,0,0]); // vertex(100,0,0)
    // edge - solid
    expect(s.intersection(lv).length()).toEqual(100); // 100

    // TODO: intersections with ShapeCollection
    // TODO: intersections with Wires
});



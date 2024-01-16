import { Solid, Geom } from '../../src/internal' // import only from internal, otherwise we get circular import problems
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

test("Obj", () => 
{
    const b = new Solid().makeBox()
    // Basic ops
    expect(b._obj).toBeUndefined();
    b.addToScene()
    expect(b._obj).not.toBeNull();
    // Styling
    b.color('green');
    expect(b.object()._style.point.color).toEqual(32768);
    expect(b.object()._style.line.color).toEqual(32768);
    expect(b.object()._style.fill.color).toEqual(32768);
    b.strokeWidth(10);
    expect(b.object()._style.line.width).toEqual(10);
    b.dashed();
    expect(b.object()._style.line.dashed).toEqual(true);
    // Override
    b.color('blue')
    expect(b.object()._style.point.color).toEqual(255);
    // Obj naming
    b.name('mybox')
    expect(b.name()).toEqual('mybox');
})


//// MAIN ////





import { Geom } from '../../src/internal' // import only from internal, otherwise we get circular import problems
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

test("Selectors Basics", () => 
{
    const W = 10;
    const H = 20;
    const D = 30;
    const b = geom.Box(W,D,H);
    // Parallel
    expect(b.select('E|X').length).toEqual(4);
    expect(b.select('E|Z').length).toEqual(4);
    expect(b.select('E|[0,0,1]').length).toEqual(4);
    expect(b.select('E|[1,1,1]')).toEqual(null);

    // Distance Along Axis
    expect(b.select('V>>X').length).toEqual(4);
    
    // Side Selector
    expect(b.select('F||top').area()).toEqual(W*D);
    expect(b.select('E||top').length).toEqual(4);

    // TODO: More

})


//// MAIN ////





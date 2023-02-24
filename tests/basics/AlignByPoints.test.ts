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

test("AlignByPoint2", () => 
{
    let b1 = geom.Box(100,50,10).alignByPoints(
        ['leftfrontbottom','rightfrontbottom'], 
        [[0,0,0],[1,1,0]]); 
    expect(b1.edges()[1].direction().normalized().toArray()[0]).toEqual(-0.707);
    expect(b1.edges()[1].direction().normalized().toArray()[1]).toEqual(0.707);
    expect(b1.edges()[1].direction().normalized().toArray()[2]).toEqual(0);
});


test("AlignByPoint3", () => 
{
    let b2 = geom.Box(100,50,10).alignByPoints(
        ['leftfrontbottom','rightfrontbottom','rightbackbottom'], 
        [[0,0,0],[1,0,0],[0,1,1]]);
    expect(b2.faces()[2].normal().toArray()[0]).toEqual(-0);
    expect(b2.faces()[2].normal().toArray()[1]).toEqual(-0.707);
    expect(b2.faces()[2].normal().toArray()[2]).toEqual(-0.707);
    
});
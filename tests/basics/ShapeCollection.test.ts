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

test("Bbox", () => 
{
    let b1 = geom.Rect(100,100);
    let b2 = geom.Rect(100,100).move(50,50);
    let c = geom.group(b1,b2);
    expect(c.bbox().toData()).toEqual([-50,100,-50,100,0,0]);
});

test("copy", () => 
{
    const g1 = geom.group(geom.Box(10),geom.Box(20));
    const g2 = g1.copy();
    expect(g2[0].bbox().width() === g1[0].bbox().width()).toEqual(true);
}
);

test("fakeKeyIndices", () =>
{
    const g1 = geom.group(geom.Box(10),geom.Box(20));
    const g2 = g1.shallowCopy();
    console.log(g1[0]);
    console.log(g2[0]);
    expect(g2[0].equals(g1[0])).toEqual(true);
});


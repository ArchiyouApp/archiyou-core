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

test("Vector OC", () => 
{
    expect(Vector.prototype._oc).not.toBeNull();
})

test("Vector", () => 
{
    // basic zero Vector
    let v1 = new Vector(0,0,0);
    expect(v1).not.toBeNull();
    expect(v1._ocVector).not.toBeNull();
    expect(v1.toArray()).toEqual([0,0,0]);
    expect(v1.move(100).toArray()).toEqual([100,0,0]);
    // non-zero Vectors created with different methods
    expect(new Vector(100).toArray()).toEqual([100,0,0]);
    expect(new Vector(100,50).toArray()).toEqual([100,50,0]);
    expect(new Vector(100,50,150).toArray()).toEqual([100,50,150]);
    expect(new Vector([10,20,30]).toArray()).toEqual([10,20,30]);
    expect(new Vector().random().length()).toBeGreaterThan(0);
    //expect(new Vector('bla').toArray()).toEqual([0,0,0]) // with error msg
    // Vector methods
    expect(new Vector(100,0,0).magnitude()).toEqual(100);
    expect(new Vector(100,0,0).length()).toEqual(100);
    expect(new Vector(1,1,1).squareMagnitude()).toEqual(3);
    expect(new Vector(1,1,1).angles()).toEqual([45,45,45]);
    expect(new Vector(1,1,1).multiply(10).toArray()).toEqual([10,10,10]);
    //expect(new Vector(1,1,1).multiply(10,1,0).toArray()).toEqual([10,1,0]); // BUG
    expect(new Vector(100,0,0).normalize().toArray()).toEqual([1,0,0]);
    expect(new Vector(100,100,100).scale(2).toArray()).toEqual([200,200,200]);
    expect(new Vector(100,100,100).divide(2).toArray()).toEqual([50,50,50]);
    expect(new Vector(0,1,0).crossed(1,0,0).toArray()).toEqual([0,0,-1]);
    expect(new Vector(0,1,0).crossed([1,0,0]).toArray()).toEqual([0,0,-1]);
    expect(new Vector(1,3,-5).dot([4,-2,-1])).toEqual(3);
    expect(new Vector(11,12,13).reverse().toArray()).toEqual([-11,-12,-13]);
    expect(new Vector(-1,1,0).mirror().toArray()).toEqual([1,1,0]);
    expect(new Vector(-1,1,0).mirror([0,0,0],[0,-1,0]).toArray()).toEqual([1,1,-0]); // ts jest cares about diff between -0 and +0
    expect(new Vector(-1,1,0).mirror([0,0,0],[0,1,0]).toArray()).toEqual([1,1,0]);
    expect(new Vector(-1,0,0).rotate(-180).round().toArray()).toEqual([1,0,0]);
    expect(new Vector(1,0,0).isOpposite(-1,0,0)).toEqual(true);
    expect(new Vector(1,1,1).isParallel(2,2,2)).toEqual(true);
    expect(new Vector(1,0,0).angle(0,1,0)).toEqual(90);
    //expect(new Vector(1,1,1).angle('bla')).toEqual(null); // with error msg
    expect(new Vector(10,10,10).equals(new Vector(10,10,10))).toEqual(true);
    expect(new Vector(10,10,10).equals(10,10,10)).toEqual(true);
    expect(new Vector(10,10,10).equals(10,20,10)).toEqual(false);
    //expect(new Vector(10,10,10).equals(null)).toEqual(null); // with error msg
    expect(new Vector(13,0,0).isWhatAxis()).toEqual('x');
    expect(new Vector(0,0,1).isWhatAxis()).toEqual('z');
})


//// MAIN ////





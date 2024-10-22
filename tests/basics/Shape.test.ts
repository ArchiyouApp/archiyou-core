import { Point, Shape, Solid, Geom, roundToTolerance } from '../../src/internal' // import only from internal, otherwise we get circular import problems
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

test("Shape OC", () => 
{
    expect(Shape.prototype._oc).not.toBeNull();
})

test("Shape Basics", () => 
{
    const p = new Point(10,20,30);
    expect(Shape.isShape(p)).toEqual(false)

    const v = p.toVertex();
    expect(Shape.isShape(v)).toEqual(true);

    const box = geom.Box(100);
    expect(Shape.isShape(box)).toEqual(true);

    // Shape attributes
    box.attribute('hidden', true);
    expect(box.attr('hidden')).toEqual(true);

    box.attribute('someattr', 'helloattribute!');
    expect(box.attr('someattr')).toEqual('helloattribute!');

    // Basic Shape properties
    expect(box.center().toArray()).toEqual([0,0,0]);
    
    // Obj Styling
    box.color('blue');
    expect(box.object().getColor()).toEqual(255); // is converted to int

    // Shape subshapes
    expect(box.vertices().length).toEqual(8);
    expect(box.edges().length).toEqual(12);
    expect(box.faces().length).toEqual(6);

    // Bbox
    expect(box.bbox().width()).toEqual(100);
    expect(box.bbox().depth()).toEqual(100);
    expect(box.bbox().height()).toEqual(100);

    // Transformations
    expect(box.moved(100).center().toArray()).toEqual([100,0,0]);

    // Copy/Clone
    const copyBox = box.copy();
    expect(box.equals(copyBox)).toEqual(true);
    expect(box.same(copyBox)).toEqual(false);
    const cloneBox = box.clone();
    expect(cloneBox.isClone()).toEqual(true);
    expect(cloneBox.same(box)).toEqual(false);
    expect(cloneBox.clonedFrom().same(box)).toEqual(true);
    

})


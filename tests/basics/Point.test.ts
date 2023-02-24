import { Point } from '../../src/internal' // import only from internal, otherwise we get circular import problems

test("Point test", () => 
{
    console.log('test')
    let point = new Point();
    expect(point.toArray()).toEqual([0,0,0])
})

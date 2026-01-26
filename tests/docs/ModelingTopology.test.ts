import { Vector, Brep, ShapeCollection, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep:Brep;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test("ModelingTopologyEdges", () => 
{
    let l = brep.Line([0,0,0],[100,0,0]); // a straight line edge
    expect(l.type()).toEqual('Edge'); // Output: Edge
    expect(l.edgeType()).toEqual('Line'); // Output: Line
    const a = brep.Arc([0,0,0],[100,200,0],[200,0,0]); // an arc ~ half a circle 
    expect(a.edgeType()).toEqual('Arc'); // Output: OC returns this as Circle, but Archiyou overrides to more intuitive Arc
    const s = brep.Spline([[0,0,0],[100,100,0],[200,0,0],[300,0,0]]); 
    expect(s.edgeType()).toEqual('BSplineCurve');
})

test("ModelingTopologyEdgesMore", () => 
{
    let s = brep.Spline([[0,0,0],[100,100,100],[200,0,0],[300,100,0]]); 
    let l = brep.Line([0,0,0],[300,100,0]);
    let startPoints = s.populated(50); // generate 50 points on the spline
    let endPoints = l.populated(50); // generate 50 points on the line
    let lines = new ShapeCollection();
    startPoints.forEach( (curPoint,i) => { 
            let otherPoint = endPoints[i];
            if (!curPoint.equals(otherPoint)) // to avoid zero length Edges at start and end
            {
                let ll = brep.Line(curPoint, otherPoint); // make a Line between curPoint and otherPoint 
                lines.add(ll);
            }
        }
    ); 
    expect(lines.length).toEqual(48); // 50 minus starting points (zero length lines)
})

test("ModelingTopologyWires", () => 
{
    let a = brep.Arc([0,0,0],[100,50,0],[200,0,0]);
    let l = brep.Line([200,0,0],[100,-50,0]);
    let w = brep.Wire(a,l); 
    w.close();
    expect(w.edges().length).toEqual(3);
})

test("ModelingTopologyWires2", () => 
{
    let w = brep.Wire(
        [0,0,0],
        [200,100,0],
        [400,0,100],
        [600,-100,-100],
        [800,100,-50]);
    expect(w.vertices().length).toEqual(5)
})

test("ModelingTopologyFaces", () => 
{
    let triangle = brep.Wire([0,0,0],[100,100,0],[200,0,0]).close(); 
    let triangleFace = triangle.toFace(); // convert that Wire to a Face without any work   
    expect(triangleFace.type()).toEqual('Face'); 
})

test("ModelingTopologyFacesNonPlanar", () => 
{
    let a = brep.Arc([0,0,0],[100,100,50],[200,0,0]);
    let s = brep.Spline([[200,0,0],[200,-50,200],[100,150,300],[100,100,400]]);
    let l = brep.Line([100,100,400],[0,0,0]);
    let sh = brep.Face(a,s,l); // this is actually a Shell
    expect(sh.type()).toEqual('Shell');
})

test("ModelingTopologyExtruding", () => 
{
    expect(brep.Vertex(0,0,0).extrude(100).type()).toEqual('Edge');  // extruding a Vertex gives an Edge
    expect(brep.Line([100,0,0],[100,200,0]).extrude(100).type()).toEqual('Face'); // open Edge or Wire result in Face(s)
    expect(brep.Wire([300,0,0],[400,100,0],[200,100,0]).close().extrude(100).type()).toEqual('Shell'); // Extruding Wire gives Shell 
    expect(brep.Arc([500,0,0],[500,100,-20],[600,0,50]).close().toFace().extrude(100).type()).toEqual('Solid'); 
})

test("ModelingTopologyExtruding", () => 
{
    expect(Math.round(brep.Vertex(0,0,0).extrude(100,[-1,1,1]).length())).toEqual(100); // inaccuracy!
    expect(brep.Edge([100,0,0],[100,200,0]).extrude(-100, [0,-1,-1]).bbox().height()).toEqual(70.711);
    expect(brep.Wire([300,0,0],[400,100,0],[200,100,0]).close().extrude(100, [-0.5,0,1]).bbox().height()).toEqual(89.443);
    expect(brep.Rect(10,100).twistExtrude(100,360).type()).toEqual('Solid')
})

test("ModelingTopologyExtruding", () => 
{
    expect(brep.Rect(10,100).twistExtrude(100,360).type()).toEqual('Solid');
})

test("ModelingTopologySweep", () => 
{
    let profile = brep.Circle(50); // a simple circle 
    let spine = brep.Spline([0,0,0],[200,-50,300],[100,150,450],[100,100,600]); 
    let pipe = profile.sweeped(spine);
    expect(pipe.type()).toEqual('Solid');
})

test("ModelingTopologyLoft", () => 
{
    let a = brep.Arc([0,0,0],[100,100,50],[200,0,0]);
    let profile = brep.Wire([0,0,200],[0,50,200],[200,50,300],[200,0,300]);
    let l = a.lofted(profile).move(0,200,0); // make a loft and move a bit so we can see it
    expect(l.type()).toEqual('Shell'); // Open shell

    let c = brep.Circle(100).move(400,0,300); // create circle and move a bit out of the way
    let r = brep.Rect(100,50).move(400);
    expect(c.lofted(r).move(0,300,0).color('blue').type()).toEqual('Solid'); // create loft and move a bit
})

test("ModelingTopologyRevolve", () => 
{
    let s = brep.Spline([0,0,0],[50,0,50],[100,0,100],[200,0,200],[150,0,300],[150,0,400],[0,0,500]);
    expect(s.revolved(360,[0,0,0],[0,0,300]).color('red').type()).toEqual('Face'); // !!!! this needs to be fixed !!!!
    expect(s.revolved(120,[0,0,0],[0,0,300]).color('blue').move(400).type()).toEqual('Face');
})

test("ModelingTopologySubshapes", () => 
{
    const box = brep.Box(100);
    expect(box.vertices().length).toEqual(8);
    expect(box.edges().length).toEqual(12); // the 12 line edges of the box
    expect(box.edges()[0].subType()).toEqual('Line'); // console: Line
    expect(box.wires().length).toEqual(6); // the 6 closed and coplanar Wires
    expect(box.wires()[0].subType()).toEqual('PlanarClosed') // console: CoplanarClosed
    expect(box.faces().length).toEqual(6); // the 6 faces enclosing the box
    expect(box.shells().length).toEqual(1); // 1 enclosing shell
    expect(box.faces()[0].copy().move([0,0,100]).type()).toEqual('Face');
})

test("ModelingTopologySelectors", () => 
{
    const box = brep.Box(100);
    expect(box.select('E|Z').length).toEqual(4); // 4 Edges parallel to Z-axis
    expect(box.select('E||front').length).toEqual(4); // 4 Edges that are part of the front Face
    expect(box.select('F||top').type()).toEqual('Face'); // top Face
    expect(box.select('V@X=-50').length).toEqual(4); // 4 Vertices with x coordinate of -50
    expect(box.select('E::line').length).toEqual(12); // all 12 line Edges of the Box
    expect(box.select('V<<->[-100,0,0]').length).toEqual(4); // 4 Vertices closest to point [-100,0,0]
})

test("ModelingTopologyUpgrade", () => 
{
    let l = brep.Line([-100,0,0],[0,0,0]);
    let a = brep.Arc([0,0,0],[100,100,0],[0,0,200]);
    // combine and added to scene
    expect(brep.collection(l,a).upgraded().first().type()).toEqual('Wire');
})
    






//// MAIN ////





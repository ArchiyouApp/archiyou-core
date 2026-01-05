import { Vector, Brep, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep:Brep;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test("Shelling", () => 
{
    // Solid Box
    expect(brep.Box(100).shelled(5).faces().length).toEqual(32);
    expect(brep.Box(100).shelled(5, 'F||top').faces().length).toEqual(23); // top off
    expect(brep.Box(100).shelled(-5).faces().length).toEqual(12);
    expect(brep.Box(100).shelled(-5, 'F||top').faces().length).toEqual(11); // top off
    expect(brep.Box(100).shelled(5, 'F||top', 'intersection').faces().length).toEqual(11); // top off, with straight join type
    // Solid Sphere
    expect(brep.Sphere(100).shelled(5).faces().length).toEqual(2);
    expect(brep.Sphere(100).shelled(-5).faces().length).toEqual(2);
    // Face
    expect(brep.Face([0,0,0],[100,100,100],[0,100,0]).shelled(5).faces().length).toEqual(5);
    // Shell
    let a1 = brep.Arc([0,0,0],[100,0,-50],[200,0,0])
    let l = brep.Line([50,100,0],[150,100,20])
    let a2 = brep.Arc([0,200,0],[100,200,90],[200,200,0])
    let loft = a1.lofted([l,a2]).move(0,0,150);
    expect(loft.shelled(5).move(300).faces().length).toEqual(6);
});


test("ShellingBoxes", () => 
{
    let b1 = brep.Box(100).hide();
    let b2 = brep.Box(20,20,50).move(0,0,50).hide();
    let u1 = b1.unioned(b2).hide();
    let u2 = u1.filleted(3, 'V[7-10]').hide();
    let u3 = u2.shelled(-2, null).hide();
    let cutbox = brep.Box(300,300,300).move(150);
    let u4 = u3.subtracted(cutbox.hide());
    expect(u4.faces().length).toEqual(33);
});

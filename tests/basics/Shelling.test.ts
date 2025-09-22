import { Vector, Geom, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let geom;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    geom = new Geom(); // needed to set oc on all other Shapes
});

test("Shelling", () => 
{
    // Solid Box
    expect(geom.Box(100).shelled(5).faces().length).toEqual(32);
    expect(geom.Box(100).shelled(5, 'F||top').faces().length).toEqual(23); // top off
    expect(geom.Box(100).shelled(-5).faces().length).toEqual(12);
    expect(geom.Box(100).shelled(-5, 'F||top').faces().length).toEqual(11); // top off
    expect(geom.Box(100).shelled(5, 'F||top', 'intersection').faces().length).toEqual(11); // top off, with straight join type
    // Solid Sphere
    expect(geom.Sphere(100).shelled(5).faces().length).toEqual(2);
    expect(geom.Sphere(100).shelled(-5).faces().length).toEqual(2);
    // Face
    expect(geom.Face([0,0,0],[100,100,100],[0,100,0]).shelled(5).faces().length).toEqual(5);
    // Shell
    let a1 = geom.Arc([0,0,0],[100,0,-50],[200,0,0])
    let l = geom.Line([50,100,0],[150,100,20])
    let a2 = geom.Arc([0,200,0],[100,200,90],[200,200,0])
    let loft = a1.lofted([l,a2]).move(0,0,150);
    expect(loft.shelled(5).move(300).faces().length).toEqual(6);
});


test("ShellingBoxes", () => 
{
    let b1 = geom.Box(100).hide();
    let b2 = geom.Box(20,20,50).move(0,0,50).hide();
    let u1 = b1.unioned(b2).hide();
    let u2 = u1.filleted(3, 'V[7-10]').hide();
    let u3 = u2.shelled(-2, null).hide();
    let cutbox = geom.Box(300,300,300).move(150);
    let u4 = u3.subtracted(cutbox.hide());
    expect(u4.faces().length).toEqual(33);
});

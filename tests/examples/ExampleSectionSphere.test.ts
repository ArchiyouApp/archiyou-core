import { Geom, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let geom;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    geom = new Geom(); // needed to set oc on all other Shapes
});

test("ExampleSectionSphere", () => 
{
    
    geom.layer('volumes');

    let outerSphere = geom.Sphere(100).hide();
    let innerSphere = geom.Sphere(70).hide();

    geom.layer("cutplanes").color('#180c2d');

    for (let i = 0; i < 50; i++)
    {
        let rotateVec = geom.Vector().random(360);
        let randomOffsetVec = geom.Vector().random().scaled(70);
        let randomPlane = geom.Plane(400,400)
            .rotate(rotateVec.x,rotateVec.y,rotateVec.z).move(randomOffsetVec)
            ?.intersect(outerSphere)
            ?.subtract(innerSphere).extrude(1); 
    }

    geom.all().move(0,0,100)

});



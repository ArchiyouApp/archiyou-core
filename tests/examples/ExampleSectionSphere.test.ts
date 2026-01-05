import { Brep, OcLoader } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep:Brep;
console.geom = console.log;

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test("ExampleSectionSphere", () => 
{
    
    brep.layer('volumes');

    let outerSphere = brep.Sphere(100).hide();
    let innerSphere = brep.Sphere(70).hide();

    brep.layer("cutplanes").color('#180c2d');

    for (let i = 0; i < 50; i++)
    {
        let rotateVec = brep.Vector().random(360);
        let randomOffsetVec = brep.Vector().random().scaled(70);
        let randomPlane = brep.Plane(400,400)
            .rotate(rotateVec.x,rotateVec.y,rotateVec.z).move(randomOffsetVec)
            ?.intersect(outerSphere)
            ?.subtract(innerSphere).extrude(1); 
    }

    brep.all().move(0,0,100)

});



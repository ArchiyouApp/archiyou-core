import fs from 'fs';

import { OcLoader, Brep, Doc  } from '../../src/internal' // import only from internal, otherwise we get circular import problems

import { test, beforeAll, expect } from 'vitest'

let brep:Brep;
console.geom = console.log;

function checkFile(fullPath?:string)
{
    expect(fullPath).toBeDefined();
    if(fullPath)
    {
        // check size
        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(0);
        // delete if exists
        fs.unlinkSync(fullPath);
    }
}

beforeAll(async () => 
{
    let ocLoader = new OcLoader();
    await ocLoader.loadAsync(); // Jest waits for the promise to be resolved
    brep = new Brep(); // needed to set oc on all other Shapes
});

test("ExampleScript", async () => 
{
    expect(brep).toBeDefined();

    const myModel = brep.Box(100)
    .subtract( // subtract a box from the main box
        brep.Box(50,50,100)
        .move(25,-25,50)
        .hide()
    ).fillet(5); // Give it round edges

    const glb = await myModel?.save('mybox.glb'); // save directly to disk
    checkFile(glb);

    const myIso = myModel?.iso([1,-1,1]);
    const svg = await myIso?.save('myboxiso.svg');  // export as SVG file
    checkFile(svg);

    const myDoc = new Doc() // Doc module
                    .create('myDoc') // start a new document (and first page)
                    .page('myPage')
                    .text('My design')  // place text
                    .view('iso', myIso); // place view of myIso shapes

    const pdf = await myDoc.save('myboxdoc.pdf');
    checkFile(pdf);

});
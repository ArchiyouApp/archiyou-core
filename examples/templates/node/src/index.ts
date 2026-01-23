//import { init, Brep, Doc } from 'archiyou'


//// DEBUG DEVELOPMENT ////

// local build in dist
//import { init, Brep, Doc } from '../../../../dist/archiyou'

// direct from source
import { init, Brep, Doc } from '../../../../src/internal';

//// END DEBUG IMPORTS ////

await init();

const brep = new Brep();

// model a box 
const myModel = brep.Box(100)
    .subtract( // subtract a box from the main box
        brep.Box(50,50,100)
        .move(25,-25,50)
        .hide()
    ).fillet(5); // Give it round edges

// save the box as GLTF binary file in root of node project
const glb = await myModel.save('mybox.glb')
console.log(`Saved GLB file at: ${glb}`);

// make a 2D isometry projection of that box 
const myIso = myModel.iso([1,-1,1])
const svg = await myIso.save('myboxiso.svg');  // export as SVG file
console.log(`Saved SVG file at: ${svg}`);

// put it on document
const myDoc = new Doc() // Doc module
                .create('myDoc') // start a new document (and first page)
                .page('myPage')
                .text('My design')  // place text
                .view('iso', myIso); // place view of myIso shapes

// Save to PDF file
const pdf = await myDoc.save('myboxdoc.pdf');
console.log(`Saved PDF file at: ${pdf}`);

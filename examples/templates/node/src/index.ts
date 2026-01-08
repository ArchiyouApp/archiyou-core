

//// DEBUG DEVELOPMENT ////
// local build in dist
// import { init, Brep } from '../../../../dist/archiyou'

// direct from source
import { init, Brep } from '../../../../src/internal';

//// END DEBUG IMPORTS ////

await init();

const brep = new Brep();

// model a box 
const myModel = brep.Box(100)
    .subtract( // subtract a box from the main box
        brep.Box(50,50,100)
        .move(25,25,50)
        .hide()
    ).fillet(5); // Give it round edges

await myModel.save('mybox.glb')

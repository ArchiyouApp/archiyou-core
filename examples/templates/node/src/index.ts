

// DEBUG
// local build in dist
// import { init, Brep } from '../../../../dist/archiyou'

// direct to source
import { init, Brep } from '../../../../src/internal';

console.log(Brep);
console.log(init);

await init();


/*
const brep = new Brep();

// model a box 
const myModel = brep.Box(100)
    .subtract(
        brep.Box(50,50,100)
        .move(25,25,50)
        .hide()
    )

myModel.save('mybox.glb')

*/
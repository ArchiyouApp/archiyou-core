
import { init, Brep } from '../../../../dist/archiyou'

await init();

const brep = new Brep();

// model a box 
const myModel = brep.Box(100)
    .subtract(
        brep.Box(50,50,100)
        .move(25,25,50)
    )

import { LibraryConnector } from '../../../../src/internal';


//// LIBRARY OVERVIEW ////

// Connect to the default Archiyou library
const lib = new LibraryConnector();
// And print an overview of the scripts
await lib.printLibraryOverview(); 

//// GET SCRIPT FROM URL ////
// You can use your own servers

console.log(
    await lib.getScriptFromUrl('https://pubv2.archiyou.com/archiyou/simplestep') // latest
    //await lib.getScriptFromUrl('http://localhost:4000/archiyou/simplestep') // latest
    // can also use: https://pubv2.archiyou.com/archiyou/simplestep:0.9.0
);





# archiyou

![Archiyou](https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/archiyou_logo_header.png#gh-light-mode-only)
![Archiyou](https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/archiyou_logo_header_white_bg.png#gh-dark-mode-only)

Archiyou is an online platform and Typescript/Javascript library to codify design and building know-how and publish it online. 
Use our editor and community platform for free at [Archiyou.com](https://archiyou.com).

[![License](https://img.shields.io/github/license/ArchiyouApp/archiyou-core)](https://github.com/ArchiyouApp/archiyou-core/blob/main/LICENSE) [![build and test](https://github.com/ArchiyouApp/archiyou-core/actions/workflows/build.yml/badge.svg)](https://github.com/ArchiyouApp/archiyou-core/actions/workflows/build.yml) [![Docs](https://img.shields.io/badge/docs-latest-blue.svg)](https://docs.archiyou.com) [![npm version](https://img.shields.io/npm/v/archiyou.svg)](https://www.npmjs.com/package/archiyou)

## Example

This is a script on our platform:

<img width="250" align="right" src="assets/codecad_table.gif">

```js
// Parameters
WIDTH = 100;
DEPTH = 80; 
HEIGHT = 70;

legHeight = HEIGHT-TOP_THICKNESS;
leg = box(LEG_SIZE, LEG_SIZE, legHeight)
        .move(LEG_SIZE/2, LEG_SIZE/2,legHeight/2); // start position of leg
     
legs = leg.array([2,2],[WIDTH-LEG_SIZE,DEPTH-LEG_SIZE])
         .color('green');

top = boxbetween(
    [0,0,legHeight],
    [WIDTH, DEPTH, HEIGHT])
    .color('green');

top.fillet(1,'Face||top'); // finish table top

```

## Library Features

* Minimal object-orientated API that feels like describing your shape. 
* A lot of modeling techniques with our BREP and mesh kernel: CSG, 2D Sketch, surface modeling
* Exports: BREP, STEP, GLTF/GLB, DXF, PDF, Excel etc
* Generate documentation: spec sheets, plans, instructables
* Connected CAD: Import assets (SVG, JPG) from the web and use for modeling
* Assemble models by using scripts as components
* More than a model: Manage data, pipelines, components and outputs
* Publish your script as parametric model in a configurator and serve to the web

## Platform Features

* [Free Editor](https://editor.archiyou.com)
* Open Design: Share scripts and build upon others
* Project management [Coming]

## Developer Quickstart

To use Archiyou as a module to generate designs and documentation independently from our platform it's available as module on npm. 

```bash
# install with any package manager
pnpm add archiyou 
# or
npm add archiyou
# or 
yarn add archiyou
```

Now run this script in Node or browser:

```js
import { init, Brep, Doc } from 'archiyou'

await init();

const brep = new Brep();

const myModel = brep.Box(100)
    .subtract( // subtract a box from the main box
        brep.Box(50,50,100)
        .move(25,-25,50)
        .hide()
    ).fillet(5); // Give it round edges

await myModel.save('mybox.glb')

const myIso = myModel.iso([1,-1,1])
myIso.save('myboxiso.svg');  // export as SVG file

const myDoc = new Doc() // Doc module
                .create('myDoc') // start a new document (and first page)
                .page('myPage')
                .text('My design')  // place text
                .view('iso', myIso); // place view of myIso shapes

await myDoc.save('myboxdoc.pdf');
```
<img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/archiyou_start_example.png">

## Development: Starter templates

For starter-templates for some popular frameworks and build stacks see /examples/templates.

* [Node starter template](/examples/templates/node)
* [Nuxt3+](/examples/templates/nuxt)
* TODO: React
* TODO: Next

It's easiest to clone this repo, navigate to the starter template directory (examples/templates) and use the npm install, dev etc commands.

If your framework is not present, just look at the others for inspiration. Modern ones work with the same methods. Contributions are welcome. 

## Notes on the WASM file

Archiyou is a TS/JS layer on top of a WASM build of [OpenCascade](https://github.com/Open-Cascade-SAS/OCCT). 
Your application needs to be able to find the WASM file for it to work. If you experience errors during import or execution this is most probably the cause! Check starter templates how to configure build systems like Vite for WASM.


## Run scripts independently from Archiyou platform 

If you want to locally execute scripts from our Editor and get certain outputs: use the Runner.


```ts 
    import { Runner } from 'archiyou'
    // A runner executes Archiyou scripts
    const runner = new Runner()

    // First a Runner needs to load (because it uses WASM)
    runner.load().then(async (runner) => 
    {
         // Then you execute a script in the default scope
         const r = await runner.execute({ 
                     code: `b = box($SIZE)`, 
                     params: { SIZE: 100 } }, 
                     { formats: ['glb'] }
                  ); 
         const glb = r?.meshGLB; // The 3D model mesh in GLB format (default)
         console.log(`Generating a GLB box took: ${r.duration} ms`);
    });

```

Runner also offers easy ways to execute scripts in a Webworker which is the best way if you want create a larger online CAD application.

## Examples and use cases

Archiyou is focused on physical things to build - like furniture and constructions - but the Editor can do much more:

<table>
  <tr>
    <td>
        <a href="https://editor.archiyou.com/_/mark/scripts/Mascotte:0.5">
            <img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/ay_example_mascotte.png">
        </a>
    </td>
    <td>
        <a href="https://editor.archiyou.com/_/mark/scripts/Bracket:0.1">
            <img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/ay_example_bracket.png">
        </a>
    </td>
    <td>
        <a href="https://editor.archiyou.com/_/archiyou/scripts/Boat:0.6">
            <img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/ay_example_boat.png">
        </a>
    </td>
    <td>
        <a href="https://editor.archiyou.com/_/archiyou/scripts/BooleanBlob:0.1">
            <img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/ay_example_booleanblob.png">
        </a>
    </td>
  </tr>
  <tr>
    <td>
        <a href="https://editor.archiyou.com/_/archiyou/scripts/KeyChain:0.6">
            <img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/ay_example_keychain.png">
        </a>
    </td>
    <td>
        <a href="https://editor.archiyou.com/_/archiyou/scripts/GardenChair:0.5.0">
            <img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/ay_example_gardenchair.png">
    </td>
    <td>
        <a href="https://editor.archiyou.com/_/archiyou/scripts/UrBent:0.1">
            <img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/ay_example_bent.png">
        </a>
    </td>
    <td>
        <a href="https://editor.archiyou.com/_/archiyou/scripts/UrHouseAssembly:0.5">
            <img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/ay_example_house.png">
        </a>
    </td>
  </tr>
</table>

Where Archiyou really shines is handling documentation and output pipelines:

<a href="https://editor.archiyou.com/_/archiyou/scripts/MariTavolo:0.6"><img src="https://raw.githubusercontent.com/ArchiyouApp/archiyou-core/main/assets/archiyou_docs.png" width="100%"></a>

## Roadmap 2026

<img src="https://nlnet.nl/logo/banner.svg" width="20%" align="right">Thanks to [NLNET NG0 Commons Fund](https://nlnet.nl/project/Archiyou/) we can further develop the open source and open design community functionality of Archiyou. 

This is a basic roadmap:

- [x] Open design user research, strategy and UX/UI
- [x] DevX: Archiyou as module, examples, templates
- [x] New high performance (mesh) geometry kernel: [CSGRS](https://github.com/timschmidt/csgrs) and [Meshup](https://github.com/ArchiyouApp/meshup)
- [ ] Fully open source stack (including publishing)
- [ ] New lightweight viewer/configurator: portability, extendability
- [ ] New editor: more value for more users
- [ ] New open design platform

Please reach out for more information, ideas or collaboration!


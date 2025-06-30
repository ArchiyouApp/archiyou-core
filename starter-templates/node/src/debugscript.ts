//import { OcLoader } from '../../../src/internal';
//import { OcLoader } from 'archiyou-core'
import { Runner, RunnerScriptExecutionRequest, ComputeResult } from '../../../src/internal'


//// TEST REQUEST ////

const REQUEST = {
    script: {
        code: `
        // Archiyou 0.5

        BEAM_WIDTH = $BEAM_WIDTH;
        BEAM_THICKNESS = $BEAM_THICKNESS;
        HEIGHT = $HEIGHT*10; // from cm to mm
        WIDTH = $WIDTH*10;

        STEP_RATIO = 1; // riser to thread ratio
        MAX_RISE = 200;


        // Design options

        THREAD_OVERHANG = BEAM_WIDTH/4;
        THREAD_PLANK_SPACING = 5;
        THREAD_LATERALS = true;
        WITH_THREADS = $WITH_TREADS; 

        // Calculated params
        numSteps = Math.ceil(HEIGHT / MAX_RISE);
        rise = HEIGHT / numSteps;
        thread = rise * STEP_RATIO;
        depth = numSteps*thread;

        layer('diagram').color('blue');

        stepProfileSketch = sketch('front');
        console.log('******')
        console.log(numSteps);
        new Array(numSteps)
            .fill(null)
        `,
        params : {
            "HEIGHT": {
                "name": "HEIGHT",
                "label": "Height",
                "type": "number",
                "default": 60,
                "description": null,
                "units": "cm",
                "iterable": true,
                "enabled": true,
                "order": 0,
                "start": 40,
                "end": 90,
                "step": 1
            },
            "WIDTH": {
                "name": "WIDTH",
                "label": "Width",
                "type": "number",
                "default": 50,
                "description": null,
                "units": "cm",
                "iterable": true,
                "enabled": true,
                "order": 0,
                "start": 40,
                "end": 100,
                "step": 1
            },
            "BEAM_WIDTH": {
                "name": "BEAM_WIDTH",
                "label": "Beam Width",
                "type": "number",
                "default": 50,
                "description": null,
                "units": "mm",
                "iterable": true,
                "enabled": true,
                "order": 0,
                "start": 36,
                "end": 100,
                "step": 1
            },
            "BEAM_THICKNESS": {
                "name": "BEAM_THICKNESS",
                "label": "Beam Thickness",
                "type": "number",
                "default": 25,
                "description": null,
                "units": "mm",
                "iterable": true,
                "enabled": true,
                "order": 0,
                "start": 18,
                "end": 50,
                "step": 1
            },
            "WITH_TREADS": {
                "name": "WITH_TREADS",
                "label": "With threads",
                "type": "boolean",
                "default": true,
                "description": null,
                "units": null,
                "iterable": true,
                "enabled": true,
                "order": 0
            }
        }
    },
    params: {
        HEIGHT: 100, // cm
        WIDTH: 100, // cm
        BEAM_WIDTH: 50, // mm
        BEAM_THICKNESS: 25, // mm
        
        WITH_TREADS: true,
    },
    outputs: [
              'model/glb', 
            ]
} as RunnerScriptExecutionRequest


new Runner()
    .load()
    .then(
        (runner) => 
        {
            runner.execute(REQUEST)
            .then((r) => 
            {
                console.log('==== DONE ====')
                console.log(r.status);
                console.log(JSON.stringify(r.errors));
                //console.log(JSON.stringify((r as ComputeResult).outputs));
                console.log(JSON.stringify(r.outputs.pipelines.default.tables));
            })
        }
    )


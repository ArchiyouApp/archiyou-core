import { promises as fs } from 'fs';

import { Runner, RunnerScriptExecutionRequest, RunnerOps, ComputeResult } from '../../../src/internal'




//// TEST REQUEST ////

const SCRIPT_FILE = './src/debugscript.txt' // from main dir

//// MAIN ////

const code = await fs.readFile(SCRIPT_FILE, 'utf-8')


const REQUEST = {
    script: {
        code: code,
        params: {
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
          },
    },
    outputs: [
              //'model/glb',
              'default/docs/spec/pdf', 
            ]
} as RunnerScriptExecutionRequest


new Runner()
    .load()
    .then(
        (runner) => 
        {
            runner.executeInStatements(REQUEST)
            .then((r) => 
            {
                console.log('==== DONE ====')
                console.log(r.status);
                console.log(JSON.stringify(r.errors));
                console.log(JSON.stringify((r as ComputeResult).outputs));
                console.log(r.outputs.pipelines.default.docs.test?.pdf?.data);
                new RunnerOps().saveBlobToFile(r.outputs.pipelines.default.docs.spec?.pdf?.data, 'test.pdf')
            })
        }
    )


//import { OcLoader } from '../../../src/internal';
//import { OcLoader } from 'archiyou-core'
import { Runner, RunnerOps, RunnerScriptExecutionRequest, ComputeResult } from '../../../src/internal'



//// TEST REQUEST ////

const REQUEST = {
    script: {
        code: `
        b = box(10,20,30);
        // import component 
        // auto imported in scene
        component = $component('archiyou/testcomponent:0.5', { size: 100 }).get('model');
        print(component.model); // Obj
        print(component.model.shapes()); // get shapes
        `
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
               new RunnerOps().saveBlobToFile(r.outputs.pipelines.default.model.glb.data, 'test.glb')
            })
        }
    )


//import { OcLoader } from '../../../src/internal';
//import { OcLoader } from 'archiyou-core'
import { Runner, RunnerOps, RunnerScriptExecutionRequest, ComputeResult } from '../../../src/internal'



//// TEST REQUEST ////

const REQUEST = {
    script: {
        code: `
        b = box(10,20,30).color('blue');
        // import component 
        // auto imported in scene
        component = $component('./src/componentScript.json', { size: 100 })
                    .get('model'); // if only one output, directly as output?
        // component = component.model.shapes() 
        component.model.shapes().moveZ(30+$SIZE).color('red');
        //print(component.model); // Obj
        //print(component.model.shapes()); // get shapes
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


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
                    .get(['model','metrics', 'docs', 'tables']); 
        // NOTE: if only one output, directly as output?
                
        
        // Change component shapes
        // FIX?
        //component.model.shapes().moveZ(30+$SIZE).color('red');
                    
        // Inspect results
        /*
        print(component.model); // Obj
        print(component.model.shapes()); // get shapes
        print(JSON.stringify(component.metrics)); // Metrics - TODO
        print(JSON.stringify(component.docs)); // Docs  
        print(JSON.stringify(component.tables)); // Tables
        */
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
               //new RunnerOps().saveBlobToFile(r.outputs.pipelines.default.model.glb.data, 'test.glb')
            })
        }
    )


//import { OcLoader } from '../../../src/internal';
//import { OcLoader } from 'archiyou-core'
import { Runner, RunnerScriptExecutionRequest } from '../../../src/internal'

//// TEST REQUEST ////

const REQUEST = {
    script: {
        code: `
        r = rect(300, 200);
        b = box(10,20,30);
        c = circle(10);
        s = sphere(10);
        `
    },
    outputs: [
              'models/glb', 
              'tables/spec' // DOES NOT EXIST
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
                console.log(r);
            })
        }
    )


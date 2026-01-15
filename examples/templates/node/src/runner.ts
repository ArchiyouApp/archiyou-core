
//// DEBUG IMPORTS ////

import type { RunnerScriptExecutionRequest, RunnerScriptExecutionResult } from '../../../../src/internal'
import { Runner, RunnerOps, printDataInfo } from '../../../../src/internal'


//// TEST REQUEST ////

const REQUEST = {
    script: {
        code: `
            r = rect(300, 200).color('blue');
            b = box(10,20,30).color('red');
            c = circle(10).color('green');
            s = sphere(10).color('yellow');

            calc.table('test',
                [ { col1: 1, col2: 'row1'},{ col1: 2, col2: 'row2'}])

            doc.page('test')
                .text('Hello Archiyou!')
                .pivot(0,0)
                .position(0.5,0.5);    
        `
    },
    outputs: [
            // What to output: use these paths
            // {{pipeline}}/{{entity}}/{{format}}{{?options}}
            'default/model/glb', 
            'default/tables/*/json',
            'default/docs/*/pdf',
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
                console.log('**** EXECUTION RESULTS ****')
                
                if(r.status === 'error')
                {
                    console.error('**** EXECUTION ERRORS ****');
                    console.error(JSON.stringify(r.errors));
                }
                else {

                    // Print out the outputs
                    console.log('**** OUTPUTS ****');

                    r.outputs.forEach((o) => 
                    {
                        console.log(`==== Output of path: ${o.path.resolvedPath} ====`);
                        printDataInfo(o.output);

                        // Save binary files (like GLB, PDF) to view
                        /*
                        if(o.output instanceof ArrayBuffer)
                        {
                            new RunnerOps().saveBlobToFile(
                                o.output, 
                                o.path.resolvedPath.replace(/\//g, '_') + '.' + o.path.format,
                                true
                            );
                        }
                        */

                    });
                }
            })
        }
    )


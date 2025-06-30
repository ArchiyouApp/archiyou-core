//import { OcLoader } from '../../../src/internal';
//import { OcLoader } from 'archiyou-core'
import { Runner, RunnerScriptExecutionRequest, ComputeResult } from '../../../src/internal'


//// TEST REQUEST ////

const REQUEST = {
    script: {
        code: `

        console.log('==== TESTING VARS ====');
        testVar = 10.0;
        console.log(Math.ceil(testVar))

        r = rect(300, 200);
        b = box(10,20,30);
        c = circle(10);
        s = sphere(10);

        calc.table('test',
            [ { col1: 1, col2: 'row1'},{ col1: 2, col2: 'row2'}])

        doc.page('test')
            .text('Hello Archiyou!')
            .pivot(0,0)
            .position(0.5,0.5);    
        //.titleblock({ title: 'Test Doc', designer: 'Archiyou' })
            //.pipeline(() => iso = b.iso())
            //.view('iso').shapes('iso')
            //.width(0.5)
            //.height(0.5)
        
       
        
        `
    },
    outputs: [
              'model/glb', 
              // 'cnc/models/dxf?2d', // just a test with options
              'tables/*/raw',
              'docs/*/pdf',
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


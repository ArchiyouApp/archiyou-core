//import { OcLoader } from '../../../src/internal';
//import { OcLoader } from 'archiyou-core'
import { Runner, RunnerOps, RunnerScriptExecutionRequest, ComputeResult } from '../../../src/internal'



//// TEST REQUEST ////

const REQUEST = {
    script: {
        code: `
        r = rect(300, 200);
        b = box(10,20,30);
        c = circle(10);
        s = sphere(10);

        calc.table('test',
            [ { col1: 1, col2: 'row1'},{ col1: 2, col2: 'row2'}])

        doc
            .create('test')
            .page('test')
            .pipeline(function(){ this.iso = b.iso(); print(this) })
            .text('Hello Archiyou!')
            .pivot(0,0)
            .position(0.5,0.5)
            .titleblock({ title: 'Test Doc', designer: 'Archiyou' })
            .view('iso').shapes('iso')
            .width(0.5)
            .height(0.5)
            .image('https://cms.shopxyz.nl/uploads/miter_saw_cuts_4699470291.svg')
            .width(0.2)
            .height(0.2)
            .pivot(0,1)
            .position(0.65,1)
        `
    },
    outputs: [
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
                //console.log(JSON.stringify(Object.keys((r.outputs.pipelines.default.docs as any)))); // doc outputs by name
                //console.log(r.outputs.pipelines.default.docs.test?.pdf?.data);
                new RunnerOps().saveBlobToFile(r.outputs.pipelines.default.docs.test?.pdf?.data, 'test.pdf')
            })
        }
    )


/**** WIP ****/

// import { Runner, RunnerOps } from 'archiyou'

//// DEBUG IMPORTS ////
// From source
import { Runner, RunnerOps } from '../../../../src/internal'

new Runner()
    .load()
    .then(
        (runner) => 
        {
            runner.executeUrl(
                'https://pubv2.archiyou.com/archiyou/simplestep', 
                {}, 
                ['default/model/glb?data=false'])
           .then((r) => 
           {
                console.log('==== DONE ====')
                console.log(r.status);
                console.log(JSON.stringify(r.errors));

                new RunnerOps().saveBlobToFile(
                    r.outputs[0] as any, 
                    'fromurl_test.glb')
            });
        });





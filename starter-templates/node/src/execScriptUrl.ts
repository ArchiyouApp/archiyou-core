//import { OcLoader } from '../../../src/internal';
//import { OcLoader } from 'archiyou-core'

import { Runner } from '../../../src/internal'


new Runner()
    .load()
    .then(
        (runner) => 
        {
            runner.executeUrl('https://pub.archiyou.com/archiyou/simplestep')
           .then((r) => 
           {
                console.log('==== DONE ====')
                console.log(r.status);
                console.log(JSON.stringify(r.errors));
            });
        });





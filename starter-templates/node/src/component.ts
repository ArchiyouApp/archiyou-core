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
        component.model.shapes().moveZ(30+$SIZE).color('red');
                    
        // Inspect results
        console.info('**** COMPONENT RESULTS ****');
        
        console.info('==== COMPONENT MODEL ====');
        print(component.model); // Obj
        print(component.model.shapes()); // get shapes

        console.info('==== COMPONENT METRICS ====');
        print(JSON.stringify(Object.keys(component.metrics)));  // Metrics by name

        console.info('==== COMPONENT TABLES ====');
        print(JSON.stringify(Object.keys(component.tables))); // Tables by name
        // print(JSON.stringify(component.tables)); // Tables raw data

        print('==== COMPONENT DOCS ====');
        //print(JSON.stringify(Object.keys(component.docs))); // Docs names
        //print(JSON.stringify(component.docs.test._pages.length)); // Doc:Page count
        //print(JSON.stringify(await component.docs.test._pages[0].toData())); // Doc:Page
        print(JSON.stringify(await component.docs.test.toData())); // Doc - test data

        //print(JSON.stringify(component.tables)); // Tables


        //// TEST AGGREGATION OF OUPUTS INTO MAIN ////
        
        doc
            .create('main')
            .merge(component.docs.test) // merge component doc into main doc
        

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


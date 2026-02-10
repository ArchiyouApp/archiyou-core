import { Runner, RunnerOps } from '../../src/internal'
import type { ScriptData } from '../../src/internal'

import { describe, it,  beforeAll, expect } from 'vitest'


//// COMPONENTS ////
describe('Runner with components', () => 
{
    let runner: Runner;

    beforeAll(async () => {
        runner = new Runner();
        await runner.load();
    });

    /*
    it('should execute a script with a component script define by inline code', 
        async () => 
        {
            const mainScript = {
                code : `
                    // main script
                    mainBox = box(100);
                    // for testing: define component inline
                    impCompSphere = $component(
                        \`compSphere1 = sphere(10);
                          compSphere2 = sphere(5).move(15);
                        \`
                    ).model();

                    impCompSphere.move(10); // move it to see it works
                    
                    print(all().length); // get message from result to check 2 shapes
                    
                `
            } as ScriptData;

            const r = await runner.execute({ script: mainScript });
            expect(r).toBeDefined();
            expect(r.status).toBe('success');
            expect(r?.messages?.filter(m => m.type === 'user')[0].message).toBe('3');
            expect((r?.outputs?.[0].output as ArrayBuffer)?.byteLength).toBeGreaterThan(57000); // 57472 (but some small differences)
        }
    );
    */

    it('should load a local script file as component', async () => {

        // from working dir
        const LOCAL_SCRIPT_PATH = './tests/unit/RunnerComponent.js'

        const mainScript = {
                code : `
                    // Make a wall
                    wall = boxbetween([0,0,0], [4000, 200, 3000]) // leftbottom at center
                            .move(0,-100); // align with X axis

                    // Place Frame as component
                    frame = $component('${LOCAL_SCRIPT_PATH}')
                                .params({ width: 1000, height: 500, depth: 300 })
                                .model();
                    frame.moveTo(0, 0, 0) // center at origin
                        .move(2000, 0, 1500);
                    
                    // subtract frame from wall
                    wall.subtract(frame.bbox().shape());

                    print(frame.length); // ==> 1
                `
            } as ScriptData;

        const r = await runner.execute({ script: mainScript });
        expect(r).toBeDefined();
        expect(r.status).toBe('success');
        expect(r?.messages?.filter(m => m.type === 'user')[0].message).toBe('1');
        expect((r?.outputs?.[0].output as ArrayBuffer)?.byteLength).toBeGreaterThan(30000); // 30508  (but some small differences)

        // for visible check: save glb to ./tests/unit/RunnerComponent.glb
        new RunnerOps().saveBlobToFile(r?.outputs?.[0]?.output as any, './tests/unit/RunnerComponent.glb');
    })

    /*
    it('should handle recursive component scripts', async () => {
        // NOTE: make sure you nest backticks correctly or avoid!
        const mainScript = {
            code: `
                // main script
                mainBox = box(100);
                // for testing: define component inline
                impCompSphere = $component(
                    \`
                      compSphere1 = sphere(10);
                      compSphere2 = $component('subcompSphere = sphere(5).move(15);').model();
                      compCyl = cylinder(5, 10);
                    \`
                ).model();

                impCompSphere.move(10); // move it to see it works

                print(all().length); // ==> 4 shapes

            `
        } as ScriptData;
        
        const r = await runner.execute({ script: mainScript });
        expect(r).toBeDefined();
        expect(r.status).toBe('success');
        expect(r?.messages?.filter(m => m.type === 'user')[0].message).toBe('4');
        expect((r?.outputs?.[0].output as ArrayBuffer)?.byteLength).toBeGreaterThan(69000); // can vary
    });
    */

})

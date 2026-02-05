import { Runner } from '../../src/internal'
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
    it('it should execute a script with a component script define by inline code', 
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

    it('it should handle recursive component scripts', async () => {
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


})

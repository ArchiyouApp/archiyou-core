import { Runner } from '../../src/internal'
import type { ScriptData } from '../../src/internal'

import { describe, it,  beforeAll, expect } from 'vitest'

describe('Runner', () => 
{
    let runner: Runner;

    beforeAll(() => {
        runner = new Runner();
    });

    it('should be available as constructor and instance', () => 
    {
        expect(runner).toBeDefined();
    });

    it('should load BREP kernel (OC)', async () => 
    {
        const r = await runner.load();
        expect(r).toBeDefined();
    });

    it('should execute a simple single string script', async () => 
    {
        const result = await runner.execute('myBox = box(10,20,30);');
        expect(result).toBeDefined();
        expect(result?.outputs?.length).toBeGreaterThan(0);
        // default output is a GLB model
        expect(result?.outputs?.[0].path.resolvedPath).toBe('default/model/glb');
        expect(result?.outputs?.[0].path.format).toBe('glb');
        expect(result?.outputs?.[0].output).toBeDefined();
        expect(result?.outputs?.[0].output).toBeInstanceOf(ArrayBuffer);
        expect((result?.outputs?.[0].output as ArrayBuffer)?.byteLength).toBeGreaterThan(8000); // 8348
    });

    it('should report errors for invalid script code', async () => 
    {
            const errorCode = `
                myBox = box(); // works
                myOtherBox = Box(); // works
                myShape = shape('wrong');
            `
            const result = await runner.execute(errorCode)

            // Should either have errors or failed status
            expect(result.status).toBe('error');
            expect(result.errors).toBeInstanceOf(Array);
            expect(result?.errors?.length).toBeGreaterThan(0);
            expect(result?.errors?.[0].message).toContain('error: "shape is not a function"')
    }, 5000);

});


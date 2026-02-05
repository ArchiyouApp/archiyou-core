import { init, } from '../../src/internal'
import { test, beforeAll, expect } from 'vitest'

test("init", async () => 
{
    const ay = await init();
    expect(ay).toBeDefined();
    expect(ay.oc).toBeDefined();
})
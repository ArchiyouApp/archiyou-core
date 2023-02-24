// Mock.test.ts
/// <reference types="jest" />

import OcLoader from '../src/OcLoader'

function tests(oc)
{   
    console.log(oc)
}

//// MAIN ////

new OcLoader(tests)

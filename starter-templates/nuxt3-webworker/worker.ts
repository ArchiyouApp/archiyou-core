/*
    In production apps you want to run the archiyou compute in a seperate webworker
    So long calculations don't block the main thread
    This is a simple example of how to run the archiyou compute in a webworker
*/

import { Runner } from 'archiyou-core'

console.info('**** Archiyou Webworker ****');

const runner = new Runner('worker');



<script setup>

import { onMounted } from 'vue'

import Worker from './worker.ts?worker'
import { Runner } from 'archiyou-core'

onMounted(() => 
{
    console.log('==== Mounted: Archiyou app with webworker ====');
    const worker = new Worker();
    const manager = new Runner('manager').startAsManager(worker);
    manager.execute('b = box(10,20,30);')
        .then((r) => console.log(r.meshGLB))
    
})


</script>

<template>
  <div>
    <!--<NuxtRouteAnnouncer />-->
    <!--<NuxtWelcome />-->
    <h1>Archiyou test</h1>
  </div>
</template>



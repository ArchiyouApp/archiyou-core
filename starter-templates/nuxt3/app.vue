<script setup>

import { onMounted } from 'vue'
import { OcLoader } from 'archiyou-core'

onMounted(() => 
{
  console.log('**** Archiyou app mounted: Loading WASM ****')

  const ocLoader = new OcLoader();
  ocLoader.load(() => {
    console.log('**** Archiyou loaded ****')
  })



})


</script>

<template>
  <div>
    <!--<NuxtRouteAnnouncer />-->
    <!--<NuxtWelcome />-->
    <h1>Archiyou test</h1>
  </div>
</template>



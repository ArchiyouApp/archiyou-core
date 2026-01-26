<script setup lang="ts">

import { onMounted, onUnmounted, ref, computed } from 'vue'

// import { init } from 'archiyou'

//// DEBUG IMPORTS
// direct from source
import { init, Brep } from '../../../src/internal';

const ocLoaded = ref(false);
const glbData = ref(null);
let blobUrl = null;

// Create a blob URL from the GLB binary data
const gltfSourceUrl = computed(() => {
  if (!glbData.value) return null;
  
  // Revoke previous URL to prevent memory leaks
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
  
  const blob = new Blob([glbData.value], { type: 'model/gltf-binary' });
  blobUrl = URL.createObjectURL(blob);
  return blobUrl;
});

// Cleanup blob URL on unmount
onUnmounted(() => {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
});

onMounted(async () => 
{
  console.log('**** Archiyou app mounted: Loading WASM ****')

  const ay = await init();
  ocLoaded.value = !!ay;
  
  // Now make some shapes
  const t0 = performance.now();

  const brep = new Brep();
  const box = brep.Box(10,10,10);

  const myModel = box.subtract(
                      brep.Sphere(5).move(5,5,5).hide()
                    )
                    .subtract(
                      brep.Cylinder(5,15).move(-5,-5,5).hide()
                    )
                    .subtract(
                      brep.Box(2,20,2).hide()
                    )
                    .color('red');

  glbData.value = await myModel.toGLTF();

  console.log(`==== Model generation: ${performance.now() - t0} ms`)

})

</script>

<template>
  <div id="container">
    <p v-if="!ocLoaded">Loading WASM...</p>
    <model-viewer
      v-if="gltfSourceUrl"
      :src="gltfSourceUrl"
      tone-mapping="linear"
      :shadow-intensity="1"
      :shadow-softness="1"
      :exposure="0.7"
      enable-pan
      auto-rotate
      camera-controls
    ></model-viewer>
  </div>
</template>

<style scoped>

  #container {
    width: 100%;
    height: 100vh;
  }

  model-viewer {
    width: 100%;
    height: 100%;
  }
</style>



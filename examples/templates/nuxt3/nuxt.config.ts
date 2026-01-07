// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  vite: {    
    // These settings are needed to load .wasm files from archiyou module
    // see: https://github.com/vitejs/vite/issues/10761
    optimizeDeps: { 
      esbuildOptions: { target: 'esnext' },
      exclude: ['archiyou-core'], // exclude archiyou-core from optimization
    },
    assetsInclude: ['**/*.wasm'], // fix for able to load .wasm files
  }
  
})

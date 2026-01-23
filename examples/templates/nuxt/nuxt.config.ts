// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false, // disable for CAD apps
  devtools: { enabled: true },
  vue: {
        compilerOptions: {
            isCustomElement: tag => ['model-viewer'].includes(tag),
        },
  },
  vite: {    
    // These settings are needed to load .wasm files from archiyou module
    // see: https://github.com/vitejs/vite/issues/10761
    optimizeDeps: { 
      esbuildOptions: { target: 'esnext' },
      exclude: ['archiyou-core'], // exclude archiyou-core from optimization
      include: ['@google/model-viewer'], 
    },
    assetsInclude: ['**/*.wasm'], // fix for able to load .wasm files
  }
  
})

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  modules: [],
  devtools: { enabled: true },

  vite: {
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
    css: {
      preprocessorOptions: {
        scss: {},
      },
    },
  },

  typescript: {
    strict: true,
  },

  compatibilityDate: '2025-04-08',
})

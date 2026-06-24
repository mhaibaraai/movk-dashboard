export default defineNuxtConfig({
  modules: [
    '@movk/nuxt',
    '@nuxt/eslint'
  ],

  imports: {
    dirs: ['composables/**']
  },

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  ui: {
    experimental: {
      componentDetection: true
    }
  },

  runtimeConfig: {
    public: {
      cert: {
        enabled: true,
        loginPath: '/login',
        publicRoutes: ['/register']
      }
    }
  },

  compatibilityDate: 'latest',

  vite: {
    optimizeDeps: {
      include: [
        '@movk/core',
        'zod'
      ]
    }
  },

  telemetry: false,

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    customCollections: [
      { prefix: 'custom', dir: './app/assets/icons' }
    ]
  },

  movk: {
    api: {
      auth: {
        enabled: true,
        sessionTokenPath: 'jwt.access_token'
      },
      endpoints: {
        default: {
          baseURL: process.env.NUXT_API_BASE || '/api'
        }
      }
    }
  }
})

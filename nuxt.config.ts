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

  routeRules: {
    '/system': { redirect: '/system/user', prerender: false }
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

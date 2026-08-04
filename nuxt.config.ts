export default defineNuxtConfig({
  modules: [
    '@movk/nuxt',
    '@nuxt/eslint',
    '@vercel/analytics',
    '@vercel/speed-insights'
  ],

  imports: {
    dirs: ['~/composables/**']
  },

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  ui: {
    fonts: false,
    experimental: {
      componentDetection: true
    }
  },

  runtimeConfig: {
    public: {
      cert: {
        enabled: true,
        loginPath: '/login'
      }
    }
  },

  compatibilityDate: '2026-06-30',

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
    theme: {
      font: 'alibaba-puhuiti',
      fonts: [
        { name: 'alibaba-puhuiti', href: 'https://cdn.mhaibaraai.cn/fonts/alibaba-puhuiti.css' }
      ]
    },
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

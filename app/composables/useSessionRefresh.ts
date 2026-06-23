import { appendResponseHeader } from 'h3'
import { parse, parseSetCookie, serialize } from 'cookie-es'

export function isExpired(exp: string) {
  return exp ? new Date(exp).getTime() < Date.now() : true
}

// access token 过期、refresh 仍有效时静默续期；失败抛错，由调用方统一处理
// 注意：未做并发去重，多请求同时触发会各自刷新一次（可接受范围）
export function useSessionRefresh() {
  const { $api } = useNuxtApp()
  const { fetch: fetchSession } = useUserSession()

  async function refreshSession(refreshToken: string) {
    const data = await $api<LoginPayload>('/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      context: { toast: false }
    })

    if (!data) throw new Error('Failed to refresh token')

    const serverEvent = useRequestEvent()
    const runtimeConfig = useRuntimeConfig()

    await useRequestFetch()('/api/jwt/refresh', {
      method: 'POST',
      body: {
        access_token: data.access_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        refresh_expires_at: new Date(Date.now() + data.refresh_expires_in * 1000).toISOString()
      },
      onResponse({ response: { headers } }) {
        if (import.meta.server && serverEvent) {
          forwardSessionCookies(serverEvent, headers, runtimeConfig.session.name)
        }
      }
    })

    await fetchSession()
  }

  return { refreshSession }
}

// SSR 场景：将子请求的 Set-Cookie 转发到主响应，否则浏览器永远收不到新 session cookie
function forwardSessionCookies(
  event: ReturnType<typeof useRequestEvent>,
  headers: Headers,
  sessionName: string
) {
  if (!event) return
  for (const setCookieStr of headers.getSetCookie()) {
    appendResponseHeader(event, 'Set-Cookie', setCookieStr)
    const parsed = parseSetCookie(setCookieStr)
    if (!parsed) continue
    const { name, value } = parsed
    if (name !== sessionName) continue
    const cookies = parse(event.headers.get('cookie') || '')
    cookies[name] = value
    const cookieHeader = Object.entries(cookies).map(([n, v]) => serialize(n, v)).join('; ')
    event.headers.set('cookie', cookieHeader)
    if (event.node?.req?.headers) {
      event.node.req.headers['cookie'] = cookieHeader
    }
  }
}

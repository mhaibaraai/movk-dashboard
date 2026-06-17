export function useOnlineUserApi() {
  const { $api } = useNuxtApp()

  return {
    getCount: () =>
      $api<number>('/v1/monitor/online-users/count', { context: { toast: false } }),
    forceLogoutSession: (tokenId: string) =>
      $api(`/v1/monitor/online-users/sessions/${tokenId}`, { method: 'DELETE' }),
    forceLogoutUser: (userId: string) =>
      $api(`/v1/monitor/online-users/users/${userId}`, { method: 'DELETE' }),
    batchForceLogout: (tokenIds: string[]) =>
      $api('/v1/monitor/online-users/sessions', { method: 'DELETE', body: tokenIds })
  }
}

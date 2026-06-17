export function useLoginLogApi() {
  const { $api } = useNuxtApp()

  return {
    getById: (id: number) =>
      $api<LoginLogResp>(`/v1/monitor/login-logs/${id}`, { context: { toast: false } }),
    clean: (days: number) =>
      $api<number>('/v1/monitor/login-logs', { method: 'DELETE', query: { days } })
  }
}

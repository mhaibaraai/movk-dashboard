export function useOperateLogApi() {
  const { $api } = useNuxtApp()

  return {
    getById: (id: number) =>
      $api<OperateLogResp>(`/v1/monitor/operate-logs/${id}`, { context: { toast: false } }),
    clean: (days: number) =>
      $api<number>('/v1/monitor/operate-logs', { method: 'DELETE', query: { days } })
  }
}

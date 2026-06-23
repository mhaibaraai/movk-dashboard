interface MatchOptions {
  /**
   * 数组入参时是否要求全部命中
   * @defaultValue false
   */
  every?: boolean
}

function match(owned: readonly string[], value: string | string[], every: boolean): boolean {
  const required = Array.isArray(value) ? value : [value]
  if (required.length === 0) return true
  return every
    ? required.every(code => owned.includes(code))
    : required.some(code => owned.includes(code))
}

export function usePermission() {
  const { currentUser } = useCurrentUser()

  const permissions = computed(() => currentUser.value?.permissions ?? [])
  const roles = computed(() => currentUser.value?.roles ?? [])

  function hasPermission(value: string | string[], opts: MatchOptions = {}): boolean {
    return match(permissions.value, value, opts.every ?? false)
  }

  function hasRole(value: string | string[], opts: MatchOptions = {}): boolean {
    return match(roles.value, value, opts.every ?? false)
  }

  return { permissions, roles, hasPermission, hasRole }
}

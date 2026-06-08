<script setup lang="ts">
import type { DataTableColumn, RowSelectionState } from '@movk/nuxt'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ZodType } from 'zod'
import { UBadge } from '#components'
import type { UserCreateReq, UserUpdateReq } from '~/api/system/user'
import { USER_STATUS_COLOR, USER_STATUS_LABEL } from '~/constants/system'

const {
  users, total, pending, query,
  handleDelete, handleDeleteBatch, handleCreate, handleUpdate,
  handleResetPassword, getDetail, handlePagination, handleSearch
} = useUserList()

const { deptOptions, deptTreeItems, roleOptions, postOptions } = useUserFormOptions()
const { afz } = useAutoForm()
const toast = useToast()

const statusItems = [
  { label: '正常', value: 'ACTIVE' },
  { label: '禁用', value: 'DISABLED' },
  { label: '锁定', value: 'LOCKED' }
]
const genderItems = [
  { label: '未知', value: 'UNKNOWN' },
  { label: '男', value: 'MALE' },
  { label: '女', value: 'FEMALE' }
]

const pagination = useTablePagination(query.value.size ?? 20, handlePagination)
const rowSelection = ref<RowSelectionState>({})
const selectedIds = computed(() => Object.keys(rowSelection.value).filter(id => rowSelection.value[id]))

// 左侧部门树筛选
interface DeptTreeItem { label: string, value: string, children?: DeptTreeItem[] }
const selectedDept = ref<DeptTreeItem | undefined>()
watch(selectedDept, dept => handleSearch({ deptId: dept?.value }))

function clearDeptFilter() {
  selectedDept.value = undefined
}

// 顶部搜索
const searchSchema = afz.object({
  username: afz.string({ controlProps: { placeholder: '用户名' } }).optional().meta({ label: '用户名' }),
  nickname: afz.string({ controlProps: { placeholder: '昵称' } }).optional().meta({ label: '昵称' }),
  phone: afz.string({ controlProps: { placeholder: '手机号' } }).optional().meta({ label: '手机号' }),
  status: afz.enum(['ACTIVE', 'DISABLED', 'LOCKED', 'DELETED'], {
    type: 'selectMenu',
    controlProps: {
      placeholder: '状态',
      valueKey: 'value',
      items: [...statusItems, { label: '已删除', value: 'DELETED' }]
    }
  }).optional().meta({ label: '状态' })
})
const searchState = ref<Record<string, unknown>>({})

function onSearch(event: FormSubmitEvent<Record<string, unknown>>) {
  handleSearch(event.data)
}
function onSearchReset() {
  handleSearch({ username: undefined, nickname: undefined, phone: undefined, status: undefined })
}

// 新增 / 编辑
const isFormOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formRef = useTemplateRef('formRef')
const formState = reactive<Partial<UserCreateReq>>({})

function blankUserForm(): Partial<UserCreateReq> {
  return {
    username: undefined, password: undefined, nickname: undefined, email: undefined,
    phone: undefined, gender: undefined, avatar: undefined, status: undefined,
    deptId: undefined, roleIds: undefined, postIds: undefined, remark: undefined
  }
}

function resetFormState(value: Partial<UserCreateReq> = {}) {
  Object.assign(formState, blankUserForm(), value)
}

const formSchema = computed(() => {
  const passwordField: Record<string, ZodType> = isEditing.value
    ? {}
    : {
        password: afz.string({ type: 'withPasswordToggle', controlProps: { placeholder: '请输入密码' } })
          .min(6, '密码至少 6 位').meta({ label: '密码' })
      }

  const restFields: Record<string, ZodType> = {
    nickname: afz.string({ controlProps: { placeholder: '请输入昵称' } }).optional().meta({ label: '昵称' }),
    email: afz.email({ error: '邮箱格式不正确' }).optional().meta({ label: '邮箱' }),
    phone: afz.string({ controlProps: { placeholder: '请输入手机号' } }).optional().meta({ label: '手机号' }),
    gender: afz.enum(['UNKNOWN', 'MALE', 'FEMALE'], { controlProps: { valueKey: 'value', items: genderItems } })
      .default('UNKNOWN').meta({ label: '性别' }),
    status: afz.enum(['ACTIVE', 'DISABLED', 'LOCKED'], { controlProps: { valueKey: 'value', items: statusItems } })
      .default('ACTIVE').meta({ label: '状态' }),
    deptId: afz.enum([], {
      type: 'selectMenu',
      controlProps: { placeholder: '请选择部门', valueKey: 'value', items: deptOptions.value }
    }).optional().meta({ label: '部门' }),
    roleIds: afz.array(afz.string(), {
      type: 'selectMenu',
      controlProps: { placeholder: '请选择角色', multiple: true, valueKey: 'value', items: roleOptions.value }
    }).default([]).meta({ label: '角色' }),
    postIds: afz.array(afz.string(), {
      type: 'selectMenu',
      controlProps: { placeholder: '请选择岗位', multiple: true, valueKey: 'value', items: postOptions.value }
    }).default([]).meta({ label: '岗位' }),
    remark: afz.string({ type: 'textarea', controlProps: { rows: 3, placeholder: '备注信息' } })
      .optional().meta({ label: '备注' })
  }

  return afz.object({
    username: afz.string({ controlProps: { disabled: isEditing.value, placeholder: '请输入用户名' } })
      .min(1, '请输入用户名').meta({ label: '用户名' }),
    ...passwordField,
    ...restFields
  })
})

function openCreate() {
  isEditing.value = false
  editingId.value = null
  resetFormState({ status: 'ACTIVE', gender: 'UNKNOWN', roleIds: [], postIds: [] })
  isFormOpen.value = true
}

async function openEdit(id: string) {
  isEditing.value = true
  editingId.value = id
  const detail = await getDetail(id)
  resetFormState({
    username: detail.username,
    nickname: detail.nickname ?? undefined,
    email: detail.email ?? undefined,
    phone: detail.phone ?? undefined,
    gender: detail.gender,
    status: detail.status,
    deptId: detail.deptId ?? undefined,
    roleIds: detail.roleIds,
    postIds: detail.postIds,
    remark: detail.remark ?? undefined
  })
  isFormOpen.value = true
}

async function onFormSubmit(event: FormSubmitEvent<Record<string, unknown>>) {
  if (isEditing.value && editingId.value) {
    const { username: _username, password: _password, ...rest } = event.data
    await handleUpdate(editingId.value, rest as UserUpdateReq)
    toast.add({ title: '修改成功', color: 'success' })
  } else {
    await handleCreate(event.data as unknown as UserCreateReq)
    toast.add({ title: '新增成功', color: 'success' })
  }
  isFormOpen.value = false
}

// 重置密码
const isResetOpen = ref(false)
const resetUserId = ref<string | null>(null)
const resetFormRef = useTemplateRef('resetFormRef')
const resetState = reactive<{ newPassword?: string }>({})
const resetSchema = afz.object({
  newPassword: afz.string({ type: 'withPasswordToggle', controlProps: { placeholder: '请输入新密码' } })
    .min(6, '密码至少 6 位').meta({ label: '新密码' })
})

function openReset(id: string) {
  resetUserId.value = id
  resetState.newPassword = undefined
  isResetOpen.value = true
}

async function onResetSubmit(event: FormSubmitEvent<{ newPassword: string }>) {
  if (!resetUserId.value) return
  await handleResetPassword({ userId: resetUserId.value, newPassword: event.data.newPassword })
  toast.add({ title: '密码重置成功', color: 'success' })
  isResetOpen.value = false
}

const columns: DataTableColumn<UserResp>[] = [
  { type: 'selection' },
  { accessorKey: 'username', header: '用户名', size: 140 },
  { accessorKey: 'nickname', header: '昵称', size: 120, cell: ({ row }) => row.original.nickname ?? '-' },
  { accessorKey: 'phone', header: '手机号', size: 130, cell: ({ row }) => row.original.phone ?? '-' },
  { accessorKey: 'email', header: '邮箱', size: 180, cell: ({ row }) => row.original.email ?? '-' },
  { accessorKey: 'deptName', header: '部门', size: 120, cell: ({ row }) => row.original.deptName ?? '-' },
  {
    accessorKey: 'status',
    header: '状态',
    size: 90,
    cell: ({ row }) => h(
      UBadge,
      { color: USER_STATUS_COLOR[row.original.status] ?? 'neutral', variant: 'subtle' },
      () => USER_STATUS_LABEL[row.original.status] ?? row.original.status
    )
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    size: 160,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('zh-CN')
  },
  {
    type: 'actions',
    size: 150,
    maxInline: 3,
    actions: [
      {
        key: 'edit',
        buttonProps: { icon: 'i-lucide-pencil', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openEdit(row.id)
      },
      {
        key: 'reset',
        buttonProps: { icon: 'i-lucide-key-round', variant: 'ghost', size: 'xs' },
        onClick: ({ row }) => openReset(row.id)
      },
      {
        key: 'delete',
        buttonProps: { icon: 'i-lucide-trash-2', color: 'error', variant: 'ghost', size: 'xs' },
        confirm: true,
        confirmProps: ({ row }) => ({
          type: 'warning',
          title: `删除用户 ${row.username}？`,
          description: '删除后无法恢复，请确认。',
          confirmText: '确认删除'
        }),
        onClick: async ({ row }) => {
          await handleDelete(row.id)
          toast.add({ title: '删除成功', color: 'success' })
        }
      }
    ]
  }
]

async function onBatchDelete() {
  await handleDeleteBatch(selectedIds.value)
  rowSelection.value = {}
  toast.add({ title: '批量删除成功', color: 'success' })
}
</script>

<template>
  <div class="flex gap-4">
    <aside class="w-60 shrink-0">
      <div class="flex h-full flex-col gap-2 rounded-md border border-default p-2">
        <UButton
          icon="i-lucide-list"
          :variant="selectedDept ? 'ghost' : 'soft'"
          color="neutral"
          block
          class="justify-start"
          @click="clearDeptFilter"
        >
          全部部门
        </UButton>
        <UTree
          v-model="selectedDept"
          :items="deptTreeItems"
          :get-key="(item) => item.value"
          class="flex-1 overflow-auto"
        />
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <MSearchForm
        v-model="searchState"
        :schema="searchSchema"
        @submit="onSearch"
        @reset="onSearchReset"
      />

      <div class="flex items-center justify-end gap-2">
        <UButton
          v-if="selectedIds.length > 0"
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          @click="onBatchDelete"
        >
          批量删除（{{ selectedIds.length }}）
        </UButton>
        <UButton icon="i-lucide-plus" @click="openCreate">
          新增用户
        </UButton>
      </div>

      <MDataTable
        v-model:pagination="pagination"
        v-model:row-selection="rowSelection"
        row-key="id"
        :columns="columns"
        :data="users"
        :loading="pending"
        :pagination-options="{ manualPagination: true, rowCount: total }"
      />
    </div>

    <USlideover v-model:open="isFormOpen" :title="isEditing ? '编辑用户' : '新增用户'" class="w-130">
      <template #body>
        <MAutoForm
          ref="formRef"
          :schema="formSchema"
          :state="formState"
          :submit="false"
          @submit="onFormSubmit"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="isFormOpen = false">
            取消
          </UButton>
          <UButton @click="formRef?.formRef?.submit()">
            保存
          </UButton>
        </div>
      </template>
    </USlideover>

    <UModal v-model:open="isResetOpen" title="重置密码">
      <template #body>
        <MAutoForm
          ref="resetFormRef"
          :schema="resetSchema"
          :state="resetState"
          :submit="false"
          @submit="onResetSubmit"
        />
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="isResetOpen = false">
            取消
          </UButton>
          <UButton @click="resetFormRef?.formRef?.submit()">
            确认重置
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

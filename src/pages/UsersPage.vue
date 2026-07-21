<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Shield,
  User,
  Search,
  X,
  Save,
  Users,
} from 'lucide-vue-next'
import api from '../services/api'

const authUser = computed(() => {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
})

const isAdmin = computed(() => authUser.value?.role === 'admin')

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const success = ref('')
const query = ref('')

const users = ref([])

const showUserModal = ref(false)
const showDeleteModal = ref(false)
const showResetModal = ref(false)

const selectedUser = ref(null)

const userForm = ref({
  name: '',
  email: '',
  password: '',
  role: 'user',
  is_active: true,
})

const resetForm = ref({
  password: 'mkt@123',
})

const filteredUsers = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return users.value

  return users.value.filter((user) => {
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.role?.toLowerCase().includes(q)
    )
  })
})

function clearMessages() {
  error.value = ''
  success.value = ''
}

function openCreateModal() {
  clearMessages()
  selectedUser.value = null
  userForm.value = {
    name: '',
    email: '',
    password: 'mkt@123',
    role: 'user',
    is_active: true,
  }
  showUserModal.value = true
}

function openEditModal(user) {
  clearMessages()
  selectedUser.value = user
  userForm.value = {
    name: user.name || '',
    email: user.email || '',
    password: '',
    role: user.role || 'user',
    is_active: Boolean(user.is_active),
  }
  showUserModal.value = true
}

function closeUserModal() {
  showUserModal.value = false
  selectedUser.value = null
}

function openDeleteModal(user) {
  clearMessages()
  selectedUser.value = user
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  selectedUser.value = null
}

function openResetModal(user) {
  clearMessages()
  selectedUser.value = user
  resetForm.value = {
    password: 'mkt@123',
  }
  showResetModal.value = true
}

function closeResetModal() {
  showResetModal.value = false
  selectedUser.value = null
}

function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Usuário'
}

function statusLabel(isActive) {
  return isActive ? 'Ativo' : 'Inativo'
}

async function fetchUsers() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get('/api/users')
    users.value = response.data || []
  } catch (err) {
    error.value = err?.response?.data?.detail || 'Não foi possível carregar os usuários.'
  } finally {
    loading.value = false
  }
}

async function saveUser() {
  clearMessages()
  saving.value = true

  try {
    if (selectedUser.value) {
      const payload = {
        name: userForm.value.name,
        email: userForm.value.email,
        role: userForm.value.role,
        is_active: userForm.value.is_active,
      }

      if (userForm.value.password?.trim()) {
        payload.password = userForm.value.password.trim()
      }

      await api.put(`/api/users/${selectedUser.value.id}`, payload)
      success.value = 'Usuário atualizado com sucesso.'
    } else {
      await api.post('/api/users', {
        name: userForm.value.name,
        email: userForm.value.email,
        password: userForm.value.password || 'mkt@123',
        role: userForm.value.role,
      })
      success.value = 'Usuário criado com sucesso.'
    }

    closeUserModal()
    await fetchUsers()
  } catch (err) {
    error.value = err?.response?.data?.detail || 'Não foi possível salvar o usuário.'
  } finally {
    saving.value = false
  }
}

async function resetPassword() {
  if (!selectedUser.value) return

  clearMessages()
  saving.value = true

  try {
    await api.put(`/api/users/${selectedUser.value.id}`, {
      password: resetForm.value.password,
    })

    success.value = 'Senha redefinida com sucesso.'
    closeResetModal()
    await fetchUsers()
  } catch (err) {
    error.value = err?.response?.data?.detail || 'Não foi possível redefinir a senha.'
  } finally {
    saving.value = false
  }
}

async function deleteUser() {
  if (!selectedUser.value) return

  clearMessages()
  deleting.value = true

  try {
    await api.delete(`/api/users/${selectedUser.value.id}`)
    success.value = 'Usuário excluído com sucesso.'
    closeDeleteModal()
    await fetchUsers()
  } catch (err) {
    error.value = err?.response?.data?.detail || 'Não foi possível excluir o usuário.'
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  if (isAdmin.value) {
    fetchUsers()
  } else {
    error.value = 'Acesso restrito a administradores.'
  }
})
</script>

<template>
  <AppLayout title="Usuários">
    <div class="min-h-full">
      <section class="mx-auto max-w-[1500px] min-w-0">
        <div class="mb-8 flex flex-col gap-6">
          <div
            class="flex flex-col gap-5 rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-6 shadow-[var(--app-shadow)] xl:flex-row xl:items-start xl:justify-between"
          >
            <div class="min-w-0">
              <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
                <span>Noxis</span>
                <span>/</span>
                <span class="font-medium text-[var(--app-text-soft)]">Usuários</span>
              </div>

              <div class="flex items-start gap-4">
                <div
                  class="hidden h-14 w-14 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-accent-text)] sm:flex"
                >
                  <Users class="h-6 w-6" />
                </div>

                <div>
                  <h1 class="text-[34px] font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                    Usuários
                  </h1>

                  <p class="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-text-muted)]">
                    Gerencie acessos, permissões e redefinições de senha da plataforma.
                  </p>
                </div>
              </div>
            </div>

            <button
              v-if="isAdmin"
              class="inline-flex h-12 items-center justify-center gap-2 self-start rounded-2xl bg-[var(--app-primary)] px-5 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
              @click="openCreateModal"
            >
              <Plus class="h-4 w-4" />
              Novo usuário
            </button>
          </div>

          <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]">
            <div class="relative">
              <Search
                class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--app-text-subtle)]"
              />
              <input
                v-model="query"
                type="text"
                placeholder="Buscar por nome, e-mail ou perfil..."
                class="h-13 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] pl-12 pr-4 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-subtle)] focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-hover)]"
              />
            </div>
          </div>

          <div
            v-if="error"
            class="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 shadow-[var(--app-shadow)]"
          >
            {{ error }}
          </div>

          <div
            v-if="success"
            class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 shadow-[var(--app-shadow)]"
          >
            {{ success }}
          </div>
        </div>

        <div
          class="overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]"
        >
          <div
            class="hidden grid-cols-[minmax(260px,1.5fr)_minmax(260px,1.6fr)_140px_120px_220px] gap-5 border-b border-[var(--app-border)] bg-[var(--app-surface-2)] px-6 py-4 text-xs font-medium uppercase tracking-[0.16em] text-[var(--app-text-subtle)] xl:grid"
          >
            <div>Usuário</div>
            <div>E-mail</div>
            <div>Perfil</div>
            <div>Status</div>
            <div class="text-right">Ações</div>
          </div>

          <div v-if="loading" class="px-6 py-14 text-sm text-[var(--app-text-muted)]">
            Carregando usuários...
          </div>

          <div
            v-else-if="filteredUsers.length === 0"
            class="px-6 py-14 text-sm text-[var(--app-text-muted)]"
          >
            Nenhum usuário encontrado.
          </div>

          <template v-else>
            <article
              v-for="user in filteredUsers"
              :key="user.id"
              class="border-b border-[var(--app-border)] px-6 py-5 last:border-b-0 transition hover:bg-[var(--app-surface-2)]"
            >
              <div
                class="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(260px,1.5fr)_minmax(260px,1.6fr)_140px_120px_220px] xl:items-center xl:gap-5"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-4">
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)]"
                      :class="
                        user.role === 'admin'
                          ? 'text-[var(--app-accent-text)]'
                          : 'text-[var(--app-text-soft)]'
                      "
                    >
                      <component :is="user.role === 'admin' ? Shield : User" class="h-5 w-5" />
                    </div>

                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium text-[var(--app-text)]">
                        {{ user.name }}
                      </p>
                      <p class="mt-1 text-xs text-[var(--app-text-subtle)]">
                        ID {{ user.id }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="truncate text-sm text-[var(--app-text-muted)]">
                  {{ user.email }}
                </div>

                <div>
                  <span
                    class="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-1 text-xs font-medium text-[var(--app-text-soft)]"
                  >
                    {{ roleLabel(user.role) }}
                  </span>
                </div>

                <div>
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                    :class="
                      user.is_active
                        ? 'border border-emerald-500/20 bg-emerald-500/12 text-emerald-300'
                        : 'border border-red-500/20 bg-red-500/12 text-red-300'
                    "
                  >
                    {{ statusLabel(user.is_active) }}
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-2 xl:justify-end">
                  <button
                    class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    title="Editar usuário"
                    @click="openEditModal(user)"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>

                  <button
                    class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 transition hover:bg-amber-500/15"
                    title="Redefinir senha"
                    @click="openResetModal(user)"
                  >
                    <KeyRound class="h-4 w-4" />
                  </button>

                  <button
                    class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/15"
                    title="Excluir usuário"
                    @click="openDeleteModal(user)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          </template>
        </div>
      </section>

      <teleport to="body">
        <div
          v-if="showUserModal"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--app-overlay)] p-4 backdrop-blur-sm"
          @click.self="closeUserModal"
        >
          <div
            class="flex w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-strong)]"
          >
            <div class="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
              <div>
                <h2 class="text-lg font-semibold text-[var(--app-text)]">
                  {{ selectedUser ? 'Editar usuário' : 'Novo usuário' }}
                </h2>
                <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                  {{ selectedUser ? 'Atualize os dados do usuário.' : 'Crie um novo acesso para a plataforma.' }}
                </p>
              </div>

              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                @click="closeUserModal"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="grid gap-4 p-6">
              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  Nome
                </label>
                <input
                  v-model="userForm.name"
                  type="text"
                  class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  E-mail
                </label>
                <input
                  v-model="userForm.email"
                  type="email"
                  class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                    Perfil
                  </label>
                  <select
                    v-model="userForm.role"
                    class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                    Status
                  </label>
                  <select
                    v-model="userForm.is_active"
                    class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                  >
                    <option :value="true">Ativo</option>
                    <option :value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  {{ selectedUser ? 'Nova senha (opcional)' : 'Senha inicial' }}
                </label>
                <input
                  v-model="userForm.password"
                  type="text"
                  class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                  :placeholder="selectedUser ? 'Deixe em branco para manter a atual' : 'Senha inicial do usuário'"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 border-t border-[var(--app-border)] px-6 py-4">
              <button
                type="button"
                class="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                @click="closeUserModal"
              >
                Cancelar
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="saving"
                @click="saveUser"
              >
                <Save class="h-4 w-4" />
                {{ saving ? 'Salvando...' : 'Salvar usuário' }}
              </button>
            </div>
          </div>
        </div>
      </teleport>

      <teleport to="body">
        <div
          v-if="showResetModal"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--app-overlay)] p-4 backdrop-blur-sm"
          @click.self="closeResetModal"
        >
          <div
            class="w-full max-w-lg rounded-[30px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-strong)]"
          >
            <div class="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
              <div>
                <h2 class="text-lg font-semibold text-[var(--app-text)]">Redefinir senha</h2>
                <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                  Defina uma nova senha para {{ selectedUser?.name }}.
                </p>
              </div>

              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                @click="closeResetModal"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="p-6">
              <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                Nova senha
              </label>
              <input
                v-model="resetForm.password"
                type="text"
                class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                placeholder="Nova senha"
              />
            </div>

            <div class="flex items-center justify-end gap-3 border-t border-[var(--app-border)] px-6 py-4">
              <button
                type="button"
                class="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                @click="closeResetModal"
              >
                Cancelar
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="saving"
                @click="resetPassword"
              >
                <KeyRound class="h-4 w-4" />
                {{ saving ? 'Salvando...' : 'Redefinir senha' }}
              </button>
            </div>
          </div>
        </div>
      </teleport>

      <teleport to="body">
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--app-overlay)] p-4 backdrop-blur-sm"
          @click.self="closeDeleteModal"
        >
          <div
            class="w-full max-w-lg rounded-[30px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-strong)]"
          >
            <div class="border-b border-[var(--app-border)] px-6 py-4">
              <h2 class="text-lg font-semibold text-[var(--app-text)]">Excluir usuário</h2>
              <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                Esta ação removerá o usuário {{ selectedUser?.name }} permanentemente.
              </p>
            </div>

            <div class="flex items-center justify-end gap-3 px-6 py-4">
              <button
                type="button"
                class="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                @click="closeDeleteModal"
              >
                Cancelar
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="deleting"
                @click="deleteUser"
              >
                <Trash2 class="h-4 w-4" />
                {{ deleting ? 'Excluindo...' : 'Excluir usuário' }}
              </button>
            </div>
          </div>
        </div>
      </teleport>
    </div>
  </AppLayout>
</template>
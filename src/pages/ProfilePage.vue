<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import {
  User,
  Mail,
  Shield,
  Save,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  BadgeCheck,
  LockKeyhole,
} from 'lucide-vue-next'
import api from '../services/api'

const authUser = computed(() => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Erro ao ler usuário do localStorage:', error)
    return null
  }
})

const loading = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const error = ref('')
const success = ref('')

const profileForm = ref({
  id: null,
  name: '',
  email: '',
  role: '',
})

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

function clearMessages() {
  error.value = ''
  success.value = ''
}

function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Usuário'
}

function initials(name) {
  if (!name) return 'U'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

async function fetchMe() {
  loading.value = true
  clearMessages()

  try {
    const response = await api.get('/api/auth/me')
    const data = response.data || {}

    profileForm.value = {
      id: data.id ?? null,
      name: data.name || '',
      email: data.email || '',
      role: data.role || '',
    }

    localStorage.setItem(
      'user',
      JSON.stringify({
        ...(authUser.value || {}),
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      }),
    )
  } catch (err) {
    error.value = err?.response?.data?.detail || 'Não foi possível carregar seu perfil.'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  clearMessages()

  if (!profileForm.value.name?.trim()) {
    error.value = 'Informe seu nome.'
    return
  }

  savingProfile.value = true

  try {
    const response = await api.put('/api/auth/me', {
      name: profileForm.value.name.trim(),
    })

    const data = response.data || {}

    profileForm.value = {
      id: data.id ?? profileForm.value.id,
      name: data.name || profileForm.value.name,
      email: data.email || profileForm.value.email,
      role: data.role || profileForm.value.role,
    }

    localStorage.setItem(
      'user',
      JSON.stringify({
        ...(authUser.value || {}),
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      }),
    )

    success.value = 'Perfil atualizado com sucesso.'
  } catch (err) {
    error.value = err?.response?.data?.detail || 'Não foi possível atualizar seu perfil.'
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  clearMessages()

  if (!passwordForm.value.current_password || !passwordForm.value.new_password) {
    error.value = 'Preencha a senha atual e a nova senha.'
    return
  }

  if (passwordForm.value.new_password.length < 6) {
    error.value = 'A nova senha precisa ter pelo menos 6 caracteres.'
    return
  }

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    error.value = 'A confirmação da nova senha não confere.'
    return
  }

  savingPassword.value = true

  try {
    await api.put('/api/auth/me', {
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password,
    })

    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: '',
    }

    success.value = 'Senha alterada com sucesso.'
  } catch (err) {
    error.value = err?.response?.data?.detail || 'Não foi possível alterar sua senha.'
  } finally {
    savingPassword.value = false
  }
}

onMounted(() => {
  fetchMe()
})
</script>

<template>
  <AppLayout title="Meu perfil">
    <div class="min-h-full">
      <section class="mx-auto max-w-[1100px] min-w-0">
        <div class="mb-6">
          <div
            class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-5 shadow-[var(--app-shadow)]"
          >
            <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
              <span>Noxis</span>
              <span>/</span>
              <span class="font-medium text-[var(--app-text-soft)]">Perfil</span>
            </div>

            <div class="flex flex-col gap-4 md:flex-row md:items-center">
              <div
                class="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface-2)] text-lg font-semibold text-[var(--app-text-strong)] shadow-sm"
              >
                {{ initials(profileForm.name || authUser?.name) }}
              </div>

              <div class="min-w-0">
                <h1 class="text-[30px] font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Meu perfil
                </h1>

                <p class="mt-1 text-sm leading-6 text-[var(--app-text-muted)]">
                  Gerencie seus dados de conta e mantenha seu acesso seguro.
                </p>

                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <div
                    class="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-1.5 text-xs text-[var(--app-text-soft)]"
                  >
                    <BadgeCheck class="h-3.5 w-3.5" />
                    {{ roleLabel(profileForm.role || authUser?.role) }}
                  </div>

                  <div
                    class="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-1.5 text-xs text-[var(--app-text-muted)]"
                  >
                    <Mail class="h-3.5 w-3.5" />
                    {{ profileForm.email || authUser?.email || 'Sem e-mail' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-5 space-y-3">
          <div
            v-if="error"
            class="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 shadow-[var(--app-shadow)]"
          >
            <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <div
            v-if="success"
            class="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500 shadow-[var(--app-shadow)]"
          >
            <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" />
            <span>{{ success }}</span>
          </div>
        </div>

        <div v-if="loading" class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div
            class="h-[360px] animate-pulse rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]"
          />
          <div
            class="h-[360px] animate-pulse rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]"
          />
        </div>

        <div v-else class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div
            class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[var(--app-shadow)]"
          >
            <div class="mb-6 flex items-start gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] text-[var(--app-text-strong)]"
              >
                <User class="h-5 w-5" />
              </div>

              <div>
                <h2 class="text-lg font-semibold text-[var(--app-text)]">
                  Informações da conta
                </h2>
                <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                  Atualize o nome exibido no sistema.
                </p>
              </div>
            </div>

            <div class="grid gap-4">
              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  Nome
                </label>
                <div class="relative">
                  <User
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    v-model="profileForm.name"
                    type="text"
                    class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] py-3 pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-3)]"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  E-mail
                </label>
                <div class="relative">
                  <Mail
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    :value="profileForm.email"
                    type="email"
                    disabled
                    class="w-full cursor-not-allowed rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] py-3 pl-11 pr-4 text-sm text-[var(--app-text-muted)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  Perfil de acesso
                </label>
                <div class="relative">
                  <Shield
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    :value="roleLabel(profileForm.role)"
                    type="text"
                    disabled
                    class="w-full cursor-not-allowed rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] py-3 pl-11 pr-4 text-sm text-[var(--app-text-muted)] outline-none"
                  />
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="savingProfile"
                @click="saveProfile"
              >
                <Save class="h-4 w-4" />
                {{ savingProfile ? 'Salvando...' : 'Salvar alterações' }}
              </button>
            </div>
          </div>

          <div
            class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[var(--app-shadow)]"
          >
            <div class="mb-6 flex items-start gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] text-[var(--app-text-strong)]"
              >
                <LockKeyhole class="h-5 w-5" />
              </div>

              <div>
                <h2 class="text-lg font-semibold text-[var(--app-text)]">
                  Segurança
                </h2>
                <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                  Troque sua senha para manter o acesso protegido.
                </p>
              </div>
            </div>

            <div class="grid gap-4">
              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  Senha atual
                </label>
                <div class="relative">
                  <KeyRound
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    v-model="passwordForm.current_password"
                    type="password"
                    class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] py-3 pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-3)]"
                    placeholder="Digite sua senha atual"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  Nova senha
                </label>
                <div class="relative">
                  <KeyRound
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    v-model="passwordForm.new_password"
                    type="password"
                    class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] py-3 pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-3)]"
                    placeholder="Digite a nova senha"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  Confirmar nova senha
                </label>
                <div class="relative">
                  <KeyRound
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    v-model="passwordForm.confirm_password"
                    type="password"
                    class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] py-3 pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-3)]"
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="savingPassword"
                @click="savePassword"
              >
                <Save class="h-4 w-4" />
                {{ savingPassword ? 'Salvando...' : 'Alterar senha' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template> 
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  LockKeyhole,
  Mail,
  LogIn,
  ShieldCheck,
  Search,
  FolderSearch,
  Sparkles,
} from 'lucide-vue-next'
import api from '../services/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const logoSrc = computed(() => '/LOGO_ADB_2025-01.png')

async function submitLogin() {
  error.value = ''
  loading.value = true

  try {
    const response = await api.post('/api/auth/login', {
      email: email.value,
      password: password.value,
    })

    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))

    router.push('/')
  } catch (err) {
    error.value =
      err?.response?.data?.detail || 'Não foi possível entrar. Verifique suas credenciais.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
    <div class="pointer-events-none absolute inset-0">
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--app-grid-radial),transparent_28%)]"
      ></div>
      <div
        class="absolute inset-0 bg-[linear-gradient(var(--app-grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--app-grid-line)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60"
      ></div>
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-[1400px] items-center px-4 py-8 sm:px-6 lg:px-8">
      <div class="grid w-full gap-8 lg:grid-cols-[1.05fr_500px] lg:items-center">
        <section class="hidden lg:block">
          <div class="max-w-xl">
            <div
              class="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm text-[var(--app-text-soft)] shadow-[var(--app-shadow)]"
            >
              <ShieldCheck class="h-4 w-4 text-[var(--app-accent-text)]" />
              Workspace seguro do Noxis
            </div>

            <div class="mb-6 flex items-center gap-4">
              <div
                class="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[var(--app-shadow)]"
              >
                <img
                  :src="logoSrc"
                  alt="Noxis"
                  class="h-full w-full object-contain"
                />
              </div>

              <div>
                <div class="text-[34px] font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                  Noxis
                </div>
                <div class="mt-1 text-sm text-[var(--app-text-muted)]">
                  Busca e gestão inteligente de arquivos
                </div>
              </div>
            </div>

            <h1 class="text-5xl font-semibold leading-[1.04] tracking-[-0.05em] text-[var(--app-text)]">
              Acesse sua base de arquivos com rapidez, contexto e controle.
            </h1>

            <p class="mt-5 max-w-lg text-base leading-7 text-[var(--app-text-muted)]">
              Pesquise arquivos, visualize detalhes, consulte caminhos e trabalhe com metadados em um ambiente mais organizado.
            </p>

            <div class="mt-8 grid gap-4 sm:grid-cols-3">
              <div
                class="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]"
              >
                <div
                  class="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-surface-3)] text-[var(--app-accent-text)]"
                >
                  <Search class="h-5 w-5" />
                </div>
                <h2 class="text-sm font-medium text-[var(--app-text)]">Busca central</h2>
                <p class="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                  Encontre arquivos por nome, caminho e contexto.
                </p>
              </div>

              <div
                class="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]"
              >
                <div
                  class="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-surface-3)] text-[var(--app-accent-text)]"
                >
                  <FolderSearch class="h-5 w-5" />
                </div>
                <h2 class="text-sm font-medium text-[var(--app-text)]">Navegação clara</h2>
                <p class="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                  Visualize caminhos, previews e detalhes rapidamente.
                </p>
              </div>

              <div
                class="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]"
              >
                <div
                  class="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-surface-3)] text-[var(--app-accent-text)]"
                >
                  <Sparkles class="h-5 w-5" />
                </div>
                <h2 class="text-sm font-medium text-[var(--app-text)]">Fluxo moderno</h2>
                <p class="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
                  Trabalhe em uma interface mais limpa e consistente.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section class="w-full">
          <div
            class="mx-auto w-full max-w-[500px] rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[var(--app-shadow-strong)] sm:p-8"
          >
            <div class="mb-8">
              <div class="mb-5 flex items-center gap-3 lg:hidden">
                <div
                  class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-2)] p-2"
                >
                  <img
                    :src="logoSrc"
                    alt="Noxis"
                    class="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <div class="text-lg font-semibold text-[var(--app-text)]">Noxis</div>
                  <div class="text-xs text-[var(--app-text-muted)]">Workspace</div>
                </div>
              </div>

              <div
                class="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--app-text-subtle)]"
              >
                Entrar na plataforma
              </div>

              <h1 class="text-3xl font-semibold tracking-[-0.04em] text-[var(--app-text)] sm:text-4xl">
                Bem-vindo de volta
              </h1>

              <p class="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">
                Entre com seu e-mail e senha para acessar o Noxis.
              </p>
            </div>

            <div
              v-if="error"
              class="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {{ error }}
            </div>

            <form class="space-y-4" @submit.prevent="submitLogin">
              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  E-mail
                </label>
                <div class="relative">
                  <Mail
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    v-model="email"
                    type="email"
                    autocomplete="email"
                    class="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-subtle)] focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-hover)]"
                    placeholder="seuemail@empresa.com"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                  Senha
                </label>
                <div class="relative">
                  <LockKeyhole
                    class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-subtle)]"
                  />
                  <input
                    v-model="password"
                    type="password"
                    autocomplete="current-password"
                    class="h-12 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-subtle)] focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-hover)]"
                    placeholder="Sua senha"
                  />
                </div>
              </div>

              <button
                type="submit"
                class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-4 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="loading"
              >
                <LogIn class="h-4 w-4" />
                {{ loading ? 'Entrando...' : 'Entrar' }}
              </button>
            </form>

            <div class="mt-6 border-t border-[var(--app-border)] pt-5">
              <div class="flex items-start gap-3 rounded-2xl bg-[var(--app-surface-2)] px-4 py-3">
                <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-[var(--app-accent-text)]" />
                <p class="text-xs leading-5 text-[var(--app-text-subtle)]">
                  Seu acesso é protegido por autenticação e permissões por perfil para manter a plataforma segura.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
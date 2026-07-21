<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Search,
  Activity,
  FolderKanban,
  Images,
  SunMedium,
  MoonStar,
  Users,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from 'lucide-vue-next'
import { useTheme } from '../../composables/useTheme'

const route = useRoute()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const authUser = computed(() => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Erro ao ler usuário do localStorage:', error)
    return null
  }
})

const isAdmin = computed(() => authUser.value?.role === 'admin')

const userInitials = computed(() => {
  const name = authUser.value?.name || authUser.value?.nome || 'Usuário'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
})

const navSections = computed(() => {
  const mainItems = [
    {
      to: '/',
      icon: Search,
      label: 'Search',
      description: 'Buscar arquivos',
      external: false,
      exact: true,
    },
    {
      to: '/status',
      icon: Activity,
      label: 'Status',
      description: 'Monitoramento',
      external: false,
    },
  ]

  if (isAdmin.value) {
    mainItems.push({
      to: '/usuarios',
      icon: Users,
      label: 'Usuários',
      description: 'Gerenciar acessos',
      external: false,
    })
  }

  const externalItems = [
    {
      to: 'https://amigosdobem.sharepoint.com/sites/materialapoiomkt',
      icon: FolderKanban,
      label: 'Material MKT',
      description: 'SharePoint',
      external: true,
    },
    {
      to: 'http://acervo.local/auth/login',
      icon: Images,
      label: 'Immich',
      description: 'Galeria de fotos',
      external: true,
    },
  ]

  return [
    {
      title: 'Navegação',
      items: mainItems,
    },
    {
      title: 'Atalhos',
      items: externalItems,
    },
  ]
})

const logoSrc = computed(() => '/LOGO_ADB_2025-01.png')

function isActive(item) {
  if (item.external) return false

  if (item.exact) {
    return route.path === item.to
  }

  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}

function goToProfile() {
  router.push('/perfil')
}

function isProfileActive() {
  return route.path === '/perfil' || route.path.startsWith('/perfil/')
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 z-40 h-screen w-[290px] overflow-y-auto border-r border-[var(--app-border)] bg-[var(--app-sidebar)] transition-colors duration-300"
  >
    <div class="flex min-h-full flex-col px-4 py-5">
      <!-- Header -->
      <div class="mb-8">
        <div
          class="flex items-center gap-4 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-4 py-4 shadow-[var(--app-shadow)] transition-colors duration-300"
        >
          <div
            class="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-sm"
          >
            <img
              :src="logoSrc"
              alt="Noxis"
              class="h-full w-full object-contain"
            />
          </div>

          <div class="min-w-0">
            <div class="text-[20px] font-semibold tracking-[-0.03em] text-[var(--app-text)]">
              Noxis
            </div>
            <div class="mt-1 text-sm text-[var(--app-text-muted)]">
              Workspace
            </div>
          </div>
        </div>
      </div>

      <!-- Sections -->
      <div class="space-y-6">
        <section
          v-for="section in navSections"
          :key="section.title"
        >
          <div
            class="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--app-text-subtle)]"
          >
            {{ section.title }}
          </div>

          <nav class="flex flex-col gap-1.5">
            <component
              v-for="item in section.items"
              :key="item.to"
              :is="item.external ? 'a' : RouterLink"
              :to="!item.external ? item.to : undefined"
              :href="item.external ? item.to : undefined"
              :target="item.external ? '_blank' : undefined"
              :rel="item.external ? 'noopener noreferrer' : undefined"
              class="group rounded-2xl px-3 py-3 transition-all duration-200"
              :class="
                isActive(item)
                  ? 'border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text)] shadow-sm'
                  : 'text-[var(--app-text-muted)] hover:bg-[var(--app-surface-2)] hover:text-[var(--app-text)]'
              "
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--app-border)] transition"
                  :class="
                    isActive(item)
                      ? 'bg-[var(--app-surface)] text-[var(--app-text)]'
                      : 'bg-[var(--app-surface-2)] text-[var(--app-text-muted)] group-hover:bg-[var(--app-surface-3)] group-hover:text-[var(--app-text)]'
                  "
                >
                  <component :is="item.icon" class="h-[18px] w-[18px]" />
                </div>

                <div class="min-w-0 flex-1">
                  <div
                    class="flex items-center gap-2 truncate text-sm font-medium"
                    :class="
                      isActive(item)
                        ? 'text-[var(--app-text)]'
                        : 'text-[var(--app-text-strong)]'
                    "
                  >
                    <span class="truncate">{{ item.label }}</span>
                    <ExternalLink
                      v-if="item.external"
                      class="h-3.5 w-3.5 shrink-0 text-[var(--app-text-subtle)]"
                    />
                  </div>

                  <div
                    class="truncate text-xs"
                    :class="
                      isActive(item)
                        ? 'text-[var(--app-text-muted)]'
                        : 'text-[var(--app-text-subtle)]'
                    "
                  >
                    {{ item.description }}
                  </div>
                </div>
              </div>
            </component>
          </nav>
        </section>
      </div>

      <!-- Footer -->
      <div class="mt-auto space-y-3 pt-6">
        <button
          v-if="authUser"
          type="button"
          @click="goToProfile"
          class="group w-full rounded-2xl border p-3 text-left transition-all duration-200"
          :class="
            isProfileActive()
              ? 'border-[var(--app-border)] bg-[var(--app-surface-3)] shadow-sm'
              : 'border-[var(--app-border)] bg-[var(--app-surface-2)] hover:bg-[var(--app-surface-3)]'
          "
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--app-surface)] text-sm font-semibold text-[var(--app-text-strong)]"
            >
              {{ userInitials }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium text-[var(--app-text-strong)]">
                {{ authUser.name || authUser.nome || 'Usuário' }}
              </div>

              <div class="mt-0.5 flex items-center gap-1 text-xs text-[var(--app-text-muted)]">
                <ShieldCheck class="h-3.5 w-3.5" />
                <span>{{ isAdmin ? 'Administrador' : 'Usuário' }}</span>
              </div>
            </div>

            <ChevronRight
              class="h-4 w-4 shrink-0 text-[var(--app-text-subtle)] transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </div>
        </button>

        <button
          class="flex w-full items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-3 text-left transition hover:bg-[var(--app-surface-3)]"
          @click="toggleTheme"
        >
          <div>
            <div class="text-xs text-[var(--app-text-muted)]">Tema</div>
            <div class="mt-1 text-sm font-medium text-[var(--app-text-strong)]">
              {{ isDark ? 'Modo escuro' : 'Modo claro' }}
            </div>
          </div>

          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--app-surface)] text-[var(--app-primary)]"
          >
            <MoonStar v-if="isDark" class="h-5 w-5" />
            <SunMedium v-else class="h-5 w-5" />
          </div>
        </button>


        <button
          type="button"
          class="group flex w-full items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/5 px-3 py-3 text-left transition hover:bg-red-500/10"
          @click="logout"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500"
            >
              <LogOut class="h-[18px] w-[18px]" />
            </div>

            <div>
              <div class="text-sm font-medium text-red-500">
                Sair da conta
              </div>
              <div class="text-xs text-red-400/80">
                Encerrar sessão atual
              </div>
            </div>
          </div>

          <ChevronRight
            class="h-4 w-4 shrink-0 text-red-400 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </button>
      </div>
    </div>
  </aside>
</template>
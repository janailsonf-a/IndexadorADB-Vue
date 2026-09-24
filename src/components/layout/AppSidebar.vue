<template>
  <aside class="sidebar" :class="{ collapsed: ui.sidebarCollapsed }">
    <!-- Header -->
    <div class="sb-head">
      <img src="/logo.webp" alt="ADB" class="sb-logo" @error="e => e.target.style.display='none'">
      <span class="sb-word">Indexador ADB</span>
      <button class="sb-tog" @click="ui.toggleSidebar()" title="Colapsar sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>

    <nav class="sb-nav">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
        class="nav-item" :class="{ active: isActive(item.to) }"
        :title="ui.sidebarCollapsed ? item.label : undefined">
        <span class="nav-ico" v-html="item.icon"></span>
        <span class="nav-text">{{ item.label }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </RouterLink>

      <!-- Admin section -->
      <template v-if="auth.isAdmin">
        <div class="sec-heading">Sistema</div>
        <RouterLink v-for="item in adminItems" :key="item.to" :to="item.to"
          class="nav-item" :class="{ active: isActive(item.to) }"
          :title="ui.sidebarCollapsed ? item.label : undefined">
          <span class="nav-ico" v-html="item.icon"></span>
          <span class="nav-text">{{ item.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <!-- Footer -->
    <div class="sb-foot">
      <button class="nav-item theme-btn" @click="ui.toggleTheme()" :title="ui.sidebarCollapsed ? 'Alternar tema' : undefined">
        <span class="nav-ico" v-html="ui.theme === 'dark' ? ICONS.sun : ICONS.moon"></span>
        <span class="nav-text">{{ ui.theme === 'dark' ? 'Modo claro' : 'Modo escuro' }}</span>
      </button>
      <RouterLink to="/perfil" class="user-card" :title="ui.sidebarCollapsed ? auth.user?.name : undefined">
        <div class="user-av">{{ initials }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.user?.name }}</div>
          <div class="user-role">{{ roleLabel }}</div>
        </div>
      </RouterLink>
      <button class="nav-item logout-btn" @click="handleLogout">
        <span class="nav-ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </span>
        <span class="nav-text">Sair</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ICONS } from '@/lib/icons'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const ICON_GRID  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`
const ICON_CAMP  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></svg>`
const ICON_TAG   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`
const ICON_STAR  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
const ICON_COL   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`
const ICON_DUPL  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`
const ICON_STAT  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
const ICON_USR   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
const ICON_SET   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M16.95 16.95l1.41 1.41M4.93 19.07l1.41-1.41M7.05 7.05L5.64 5.64M21 12h-2M5 12H3M12 21v-2M12 5V3"/></svg>`

const ICON_RECENT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>`
const ICON_TRASH  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`
const ICON_REPORT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
const navItems = computed(() => {
  const items = [
    { to: '/acervo',    label: 'Acervo',    icon: ICON_GRID   },
    { to: '/campanhas', label: 'Campanhas', icon: ICON_CAMP   },
    { to: '/favoritos', label: 'Favoritos', icon: ICON_STAR   },
    { to: '/colecoes',  label: 'Coleções',  icon: ICON_COL    },
    { to: '/recentes',  label: 'Recentes',  icon: ICON_RECENT },
  ]
  if (auth.isEditor) {
    items.push({ to: '/lixeira', label: 'Lixeira', icon: ICON_TRASH })
    items.push({ to: '/tags', label: 'Tags', icon: ICON_TAG })
  }
  return items
})

const adminItems = computed(() => {
  if (!auth.isAdmin) return []
  return [
    { to: '/usuarios',      label: 'Usuários',      icon: ICON_USR   },
    { to: '/duplicatas',    label: 'Duplicatas',    icon: ICON_DUPL  },
    { to: '/analytics',     label: 'Analytics',     icon: ICON_REPORT },
    { to: '/status',        label: 'Sistema',       icon: ICON_STAT  },
    { to: '/configuracoes', label: 'Configurações', icon: ICON_SET   },
  ]
})

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
})

const roleLabel = computed(() => {
  const map = { admin: 'Administrador', editor: 'Editor', viewer: 'Visualizador' }
  return map[auth.user?.role] || 'Usuário'
})

function isActive(to) {
  return route.path === to || route.path.startsWith(to + '/')
}

async function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100vh;
  overflow: hidden;
  transition: width .25s cubic-bezier(.4,0,.2,1);
}
.sidebar.collapsed { width: 58px; }
.sidebar.collapsed .sb-logo,
.sidebar.collapsed .sb-word,
.sidebar.collapsed .nav-text,
.sidebar.collapsed .sec-heading,
.sidebar.collapsed .user-info,
.sidebar.collapsed .nav-badge { display: none; }
.sidebar.collapsed .sb-head { justify-content: center; }
.sidebar.collapsed .sb-tog { margin-left: 0; }
.sidebar.collapsed .nav-item { padding: 9px; justify-content: center; }
.sidebar.collapsed .user-card { padding: 9px; justify-content: center; }

.sb-head {
  height: var(--topbar-h);
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  gap: 10px;
  flex-shrink: 0;
}
.sb-logo {
  width: 44px; height: 44px; border-radius: 50%; object-fit: cover;
  flex-shrink: 0; box-shadow: 0 2px 8px rgba(255,107,0,.25);
  background: rgba(255,107,0,.1);
}
.sb-word {
  font-family: Montserrat, system-ui, sans-serif;
  font-size: 17px; font-weight: 800; letter-spacing: -.5px;
  white-space: nowrap; color: var(--accent);
}
.sb-tog {
  margin-left: auto; background: none; border: none; color: var(--faint);
  padding: 4px; border-radius: 6px; display: flex; cursor: pointer; transition: color .15s, background .15s;
}
.sb-tog:hover { color: var(--text); background: var(--elevated); }
.sb-tog svg { width: 16px; height: 16px; }

.sb-nav {
  flex: 1; padding: 10px 8px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 1px;
}
.sec-heading {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .7px; color: var(--faint); padding: 10px 8px 4px; white-space: nowrap;
}
.nav-ico {
  width: 18px; height: 18px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.nav-ico :deep(svg) { width: 16px; height: 16px; }
.nav-badge {
  margin-left: auto; background: rgba(245,158,11,.12); color: #f59e0b;
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 10px;
}


.sb-foot {
  padding: 10px 8px;
  border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 2px;
}
.theme-btn { font-size: 13px; }
.logout-btn { font-size: 13px; }
.logout-btn:hover { background: rgba(240,68,56,.08) !important; color: #ef4444 !important; }

.user-card {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border-radius: 10px; cursor: pointer; transition: background .12s; text-decoration: none;
}
.user-card:hover { background: var(--elevated); }
.user-av {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #FFD900);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.user-info { min-width: 0; }
.user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
.user-role { font-size: 11px; color: var(--faint); }
</style>

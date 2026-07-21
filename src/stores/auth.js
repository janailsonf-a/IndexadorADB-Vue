import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'

const ROLE_MAP = { user: 'editor', admin: 'admin' }
const REVERSE_ROLE_MAP = { editor: 'user', admin: 'admin' }

export function mapRole(role) {
  if (!(role in ROLE_MAP)) {
    console.warn(`[auth] role "${role}" não mapeado em ROLE_MAP — usando valor bruto do backend`)
  }
  return ROLE_MAP[role] || role
}

// Inverso de mapRole — traduz o vocabulário do frontend (editor/admin) de volta
// pro vocabulário que a API espera (user/admin), usado ao enviar payloads pro backend.
export function unmapRole(role) {
  if (!(role in REVERSE_ROLE_MAP)) {
    console.warn(`[auth] role "${role}" não mapeado em REVERSE_ROLE_MAP — usando valor bruto`)
  }
  return REVERSE_ROLE_MAP[role] || role
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('noxis_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('noxis_user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEditor = computed(() => ['admin', 'editor'].includes(user.value?.role))

  async function login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password })
    const mapped = { ...data.user, role: mapRole(data.user.role) }
    token.value = data.access_token
    user.value = mapped
    localStorage.setItem('noxis_token', data.access_token)
    localStorage.setItem('noxis_user', JSON.stringify(mapped))
  }

  async function init() {
    if (!token.value) return
    try {
      const { data } = await api.get('/api/auth/me')
      user.value = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: mapRole(data.role),
      }
      localStorage.setItem('noxis_user', JSON.stringify(user.value))
    } catch (e) {
      // só desloga em falha de autenticação real (401/403) — erro de rede transitório não deve derrubar a sessão
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        logout()
      }
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('noxis_token')
    localStorage.removeItem('noxis_user')
  }

  return { token, user, isAuthenticated, isAdmin, isEditor, login, logout, init }
})

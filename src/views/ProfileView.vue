<template>
  <div class="view-content">
    <div class="pg-hd"><h1>Meu Perfil</h1></div>
    <div class="profile-grid">

      <!-- Identity card -->
      <div class="card p-card">
        <div class="profile-hero">
          <div class="profile-av">{{ initials }}</div>
          <div>
            <div class="profile-name">{{ auth.user?.name }}</div>
            <div class="profile-email">{{ auth.user?.email }}</div>
            <span :class="roleClass">{{ roleLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Edit name -->
      <div class="card p-card">
        <h3>Informações</h3>
        <div class="field" style="margin-bottom:12px">
          <label>Nome completo</label>
          <input v-model="editName" type="text">
        </div>
        <button class="btn-primary" @click="saveName" :disabled="!nameChanged || savingName">{{ savingName ? 'Salvando…' : 'Salvar alterações' }}</button>
      </div>

      <!-- Password -->
      <div class="card p-card">
        <h3>Segurança</h3>
        <div class="field" style="margin-bottom:10px">
          <label>Senha atual</label>
          <input v-model="pwd.current" type="password" placeholder="••••••••">
        </div>
        <div class="field" style="margin-bottom:10px">
          <label>Nova senha</label>
          <input v-model="pwd.new1" type="password" placeholder="••••••••">
        </div>
        <div class="field" style="margin-bottom:14px">
          <label>Confirmar nova senha</label>
          <input v-model="pwd.new2" type="password" placeholder="••••••••">
        </div>
        <button class="btn-primary" @click="changePwd" :disabled="savingPwd">{{ savingPwd ? 'Alterando…' : 'Alterar senha' }}</button>
      </div>

      <!-- Preferences -->
      <div class="card p-card">
        <h3>Preferências</h3>
        <div class="pref-row">
          <span>Tema</span>
          <div class="pref-seg">
            <button :class="{ on: ui.theme === 'light' }" @click="ui.theme !== 'light' && ui.toggleTheme()">Claro</button>
            <button :class="{ on: ui.theme === 'dark' }" @click="ui.theme !== 'dark' && ui.toggleTheme()">Escuro</button>
          </div>
        </div>
      </div>

      <!-- Activity -->
      <div class="card p-card activity-card">
        <h3>Minhas atividades recentes</h3>
        <div v-if="loadingAct" class="act-loading">Carregando…</div>
        <div v-else-if="!activity.length" class="act-empty">Nenhuma atividade registrada.</div>
        <div v-else class="act-feed">
          <div class="act-item" v-for="(a, i) in activity" :key="i">
            <div class="act-dot" :style="{ background: actColor(a.action) }"></div>
            <div class="act-body">
              <div class="act-txt">{{ actVerb(a.action) }} <span>{{ a.filename || a.rel_path || '—' }}</span></div>
              <div class="act-time">{{ fmtTime(a.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useToastStore } from '@/stores/toast'
import api from '@/api/client'

const auth = useAuthStore()
const ui = useUiStore()
const toast = useToastStore()

const editName = ref(auth.user?.name || '')
const savingName = ref(false)
const savingPwd = ref(false)
const pwd = ref({ current: '', new1: '', new2: '' })
const activity = ref([])
const loadingAct = ref(false)

const nameChanged = computed(() => editName.value !== auth.user?.name)
const initials = computed(() => (auth.user?.name || '').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase())
const ROLE_LABELS = { admin: 'Administrador', editor: 'Editor', viewer: 'Visualizador' }
const ROLE_CLS    = { admin: 'pill-admin', editor: 'pill-ok', viewer: 'pill-user' }
const roleLabel = computed(() => ROLE_LABELS[auth.user?.role] || 'Usuário')
const roleClass = computed(() => ROLE_CLS[auth.user?.role] || 'pill-user')

async function saveName() {
  savingName.value = true
  try {
    const { data } = await api.put('/api/auth/me', { name: editName.value })
    auth.user = { ...auth.user, name: data.name }
    toast.success('Nome atualizado com sucesso.')
  } catch (e) {
    toast.error(e?.response?.data?.detail || 'Erro ao salvar nome.')
  } finally { savingName.value = false }
}

async function changePwd() {
  if (pwd.value.new1 !== pwd.value.new2) { toast.error('Senhas não conferem.'); return }
  if (!pwd.value.new1) { toast.error('Informe a nova senha.'); return }
  savingPwd.value = true
  try {
    await api.put('/api/auth/me', { current_password: pwd.value.current, new_password: pwd.value.new1 })
    toast.success('Senha alterada com sucesso.')
    pwd.value = { current: '', new1: '', new2: '' }
  } catch (e) {
    toast.error(e?.response?.data?.detail || 'Erro ao alterar senha.')
  } finally { savingPwd.value = false }
}

const ACT_COLORS = { download:'var(--accent)', preview:'#8b5cf6', edit:'#f59e0b', login:'#22c55e', metadata_update:'#f97316' }
const ACT_VERBS  = { download:'Baixou', preview:'Visualizou', edit:'Editou', login:'Entrou', metadata_update:'Editou metadados de' }
function actColor(a) { return ACT_COLORS[a] || '#60a5fa' }
function actVerb(a)  { return ACT_VERBS[a]  || a }

function fmtTime(d) {
  if (!d) return ''
  const dt = new Date(d.includes('T') ? d : d.replace(' ', 'T'))
  if (isNaN(dt.getTime())) return d
  const diff = Math.floor((Date.now() - dt.getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff/60)} min`
  if (diff < 86400) return `há ${Math.floor(diff/3600)}h`
  return dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })
}

async function loadActivity() {
  loadingAct.value = true
  try {
    const { data } = await api.get('/api/activities', { params: { limit: 20 } })
    activity.value = Array.isArray(data) ? data : (data.activities || [])
  } catch { /* non-critical */ } finally { loadingAct.value = false }
}

onMounted(loadActivity)
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 22px 20px; }
.pg-hd { margin-bottom: 20px; }
.pg-hd h1 { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); letter-spacing: -.5px; margin: 0; }
.profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.p-card { padding: 22px; }
.p-card h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 14px; font-weight: 700; color: var(--heading); margin: 0 0 16px; }
.profile-hero { display: flex; align-items: center; gap: 16px; }
.profile-av {
  width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent), #FFD900);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 700; color: #fff; font-family: Montserrat, system-ui, sans-serif;
}
.profile-name { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); margin-bottom: 2px; }
.profile-email { font-size: 13px; color: var(--muted); margin-bottom: 8px; }

.pref-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--muted); margin-bottom: 14px; }
.pref-seg { display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.pref-seg button { padding: 5px 12px; font-size: 12px; font-family: inherit; border: none; background: none; color: var(--muted); cursor: pointer; transition: all .12s; }
.pref-seg button.on { background: var(--accent); color: #fff; }

.activity-card { grid-column: span 2; }
.act-feed { display: flex; flex-direction: column; gap: 2px; }
.act-item { display: flex; align-items: flex-start; gap: 10px; padding: 7px 8px; border-radius: 8px; transition: background .1s; }
.act-item:hover { background: var(--elevated); }
.act-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.act-body { flex: 1; }
.act-txt { font-size: 12px; color: var(--muted); }
.act-txt span { color: var(--text); font-weight: 500; }
.act-time { font-size: 11px; color: var(--faint); margin-top: 1px; }
.act-loading, .act-empty { font-size: 13px; color: var(--faint); padding: 8px 0; }
</style>

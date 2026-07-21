<template>
  <div class="view-content">
    <div class="pg-hd">
      <div>
        <h1>Usuários</h1>
        <p>Gerencie o acesso à plataforma</p>
      </div>
    </div>

    <div class="usr-ctrl">
      <div class="tbl-srch">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="search" placeholder="Buscar usuários…" class="tbl-srch-i">
      </div>
      <div style="margin-left:auto;display:flex;gap:8px">
        <select v-model="roleFilter" class="tbl-filter-sel">
          <option value="">Todos os perfis</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
        </select>
        <button class="btn-primary" @click="openNew">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo usuário
        </button>
      </div>
    </div>

    <div class="tbl-wrap card">
      <table>
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Último acesso</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="5" style="padding:24px;text-align:center;color:var(--faint);font-size:13px">Carregando…</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="5" style="padding:24px;text-align:center;color:var(--faint);font-size:13px">Nenhum usuário encontrado.</td></tr>
          <tr v-for="u in filtered" :key="u.id">
            <td>
              <div class="u-td">
                <div class="u-av" :style="{ background: avColor(u.id) }">{{ initials(u.name) }}</div>
                <div>
                  <div class="u-nm">{{ u.name }}</div>
                  <div class="u-em">{{ u.email }}</div>
                </div>
              </div>
            </td>
            <td><span :class="roleClass(u.role)">{{ roleLabel(u.role) }}</span></td>
            <td><span :class="u.is_active ? 'pill-ok' : 'pill-warn'">{{ u.is_active ? '● Ativo' : '● Inativo' }}</span></td>
            <td style="color:var(--muted);font-size:12px">{{ fmtDate(u.created_at) }}</td>
            <td>
              <div class="tact">
                <button class="tbtn" title="Editar" @click="editUser(u)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="tbtn tbtn-del" title="Excluir" :disabled="deleting === u.id" @click="deleteUser(u)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- User modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-hd">
            <h3>{{ modal.mode === 'create' ? 'Novo usuário' : 'Editar usuário' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="m-field">
              <label>Nome completo</label>
              <input v-model="modal.user.name" type="text" placeholder="Nome do usuário">
            </div>
            <div class="m-field">
              <label>E-mail</label>
              <input v-model="modal.user.email" type="email" placeholder="email@empresa.com">
            </div>
            <div class="m-field">
              <label>{{ modal.mode === 'create' ? 'Senha' : 'Nova senha (deixe vazio para não alterar)' }}</label>
              <input v-model="modal.user.password" type="password" placeholder="••••••••">
            </div>
            <div class="m-field">
              <label>Perfil</label>
              <select v-model="modal.user.role">
                <option value="admin">Administrador</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <div v-if="modal.mode === 'edit'" class="m-field m-check">
              <input type="checkbox" v-model="modal.user.is_active" id="ua">
              <label for="ua" style="text-transform:none;letter-spacing:0;font-size:13px">Usuário ativo</label>
            </div>
          </div>
          <div class="modal-ft">
            <button class="tbtn-cancel" @click="closeModal">Cancelar</button>
            <button class="btn-primary" :disabled="saving" @click="saveUser">{{ saving ? 'Salvando…' : 'Salvar' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import { mapRole, unmapRole } from '@/stores/auth'
import api from '@/api/client'

const toast = useToastStore()
const search = ref('')
const roleFilter = ref('')
const loading = ref(false)
const users = ref([])
const modal = ref(null)
const saving = ref(false)
const deleting = ref(null)

const AV_COLORS = ['var(--accent)','#10b981','#f59e0b','#0047BA','#8b5cf6','#ec4899','#ef4444','#14b8a6']
function avColor(id) { return AV_COLORS[id % AV_COLORS.length] }

const filtered = computed(() =>
  users.value.filter(u => {
    const q = search.value.toLowerCase()
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchR = !roleFilter.value || u.role === roleFilter.value
    return matchQ && matchR
  })
)

const ROLE_LABELS = { admin: 'Admin', editor: 'Editor' }
const ROLE_CLS    = { admin: 'pill-admin', editor: 'pill-ok' }
function roleLabel(r) { return ROLE_LABELS[r] || r }
function roleClass(r) { return ROLE_CLS[r] || 'pill-user' }
function initials(name) { return (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() }
function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d.includes('T') ? d : d.replace(' ', 'T'))
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('pt-BR')
}

async function loadUsers() {
  loading.value = true
  try {
    const { data } = await api.get('/api/users')
    users.value = data.map(u => ({ ...u, role: mapRole(u.role) }))
  } catch (e) {
    toast.error(e?.response?.data?.detail || 'Erro ao carregar usuários.')
  } finally { loading.value = false }
}

function openNew() {
  modal.value = { mode: 'create', user: { name: '', email: '', password: '', role: 'editor', is_active: true } }
}

function editUser(u) {
  modal.value = { mode: 'edit', user: { id: u.id, name: u.name, email: u.email, password: '', role: u.role, is_active: u.is_active } }
}

function closeModal() { modal.value = null }

async function saveUser() {
  const { mode, user } = modal.value
  saving.value = true
  try {
    if (mode === 'create') {
      const { data } = await api.post('/api/users', { name: user.name, email: user.email, password: user.password, role: unmapRole(user.role) })
      users.value.unshift({ ...data, role: mapRole(data.role) })
      toast.success(`Usuário ${data.name} criado.`)
    } else {
      const payload = { name: user.name, email: user.email, role: unmapRole(user.role), is_active: user.is_active }
      if (user.password) payload.password = user.password
      const { data } = await api.put(`/api/users/${user.id}`, payload)
      const i = users.value.findIndex(x => x.id === user.id)
      if (i !== -1) users.value[i] = { ...data, role: mapRole(data.role) }
      toast.success(`Usuário ${data.name} atualizado.`)
    }
    closeModal()
  } catch (e) {
    toast.error(e?.response?.data?.detail || 'Erro ao salvar usuário.')
  } finally { saving.value = false }
}

async function deleteUser(u) {
  if (!confirm(`Excluir o usuário ${u.name}? Esta ação é irreversível.`)) return
  deleting.value = u.id
  try {
    await api.delete(`/api/users/${u.id}`)
    users.value = users.value.filter(x => x.id !== u.id)
    toast.success(`Usuário ${u.name} excluído.`)
  } catch (e) {
    toast.error(e?.response?.data?.detail || 'Erro ao excluir usuário.')
  } finally { deleting.value = null }
}

onMounted(loadUsers)
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 22px 20px; }
.pg-hd { margin-bottom: 20px; }
.pg-hd h1 { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); letter-spacing: -.5px; margin: 0 0 4px; }
.pg-hd p { font-size: 12px; color: var(--muted); margin: 0; }
.usr-ctrl { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.tbl-srch { display: flex; align-items: center; gap: 7px; background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 0 12px; max-width: 280px; flex: 1; }
.tbl-srch svg { width: 13px; height: 13px; color: var(--faint); flex-shrink: 0; }
.tbl-srch-i { background: none; border: none; outline: none; color: var(--text); font-size: 12px; padding: 8px 0; width: 100%; font-family: inherit; }
.tbl-srch-i::placeholder { color: var(--faint); }
.tbl-filter-sel { background: var(--card); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 6px 10px; font-size: 12px; font-family: inherit; cursor: pointer; outline: none; }
.tbl-wrap { overflow: hidden; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 600px; }
thead tr { background: var(--elevated); }
th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--faint); border-bottom: 1px solid var(--border); white-space: nowrap; }
tbody tr { border-bottom: 1px solid var(--border-sub); transition: background .1s; }
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--elevated); }
td { padding: 10px 14px; font-size: 12px; vertical-align: middle; }
.u-td { display: flex; align-items: center; gap: 9px; }
.u-av { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; }
.u-nm { font-size: 13px; font-weight: 600; color: var(--heading); }
.u-em { font-size: 11px; color: var(--faint); }
.tact { display: flex; gap: 4px; }
.tbtn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--faint); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .12s; }
.tbtn svg { width: 13px; height: 13px; }
.tbtn:hover { border-color: var(--accent); color: var(--accent); background: rgba(255,107,0,.08); }
.tbtn-del:hover { border-color: #ef4444 !important; color: #ef4444 !important; background: rgba(239,68,68,.08) !important; }
.tbtn:disabled { opacity: .5; cursor: not-allowed; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 300; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.modal-box { background: var(--card); border: 1px solid var(--border); border-radius: 16px; width: 440px; max-width: 94vw; box-shadow: 0 24px 60px rgba(0,0,0,.3); }
.modal-hd { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 14px; border-bottom: 1px solid var(--border-sub); }
.modal-hd h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 16px; font-weight: 700; color: var(--heading); margin: 0; }
.modal-close { background: none; border: none; color: var(--faint); font-size: 22px; cursor: pointer; line-height: 1; }
.modal-close:hover { color: var(--text); }
.modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.m-field { display: flex; flex-direction: column; gap: 4px; }
.m-field label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .3px; }
.m-field input, .m-field select { background: var(--elevated); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; color: var(--text); font-size: 13px; font-family: inherit; outline: none; transition: border-color .12s; }
.m-field input:focus, .m-field select:focus { border-color: var(--accent); }
.m-check { flex-direction: row !important; align-items: center !important; gap: 8px !important; }
.modal-ft { padding: 14px 20px 18px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-sub); }
.tbtn-cancel { height: 34px; padding: 0 14px; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--muted); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .12s; }
.tbtn-cancel:hover { border-color: var(--text); color: var(--text); }
.btn-primary { height: 34px; padding: 0 16px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity .12s; }
.btn-primary:disabled { opacity: .6; cursor: default; }

.modal-enter-active, .modal-leave-active { transition: opacity .18s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

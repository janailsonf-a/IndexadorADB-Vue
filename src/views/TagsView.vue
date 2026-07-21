<template>
  <div class="view-content">
    <div class="page-hd">
      <div>
        <h2 class="page-title">Gerenciar Tags</h2>
        <p class="page-sub">{{ filtered.length }} tags</p>
      </div>
      <button class="btn-primary" @click="showCreate = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova Tag
      </button>
    </div>

    <!-- Search -->
    <div class="tag-srch-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input v-model="search" class="tag-srch" placeholder="Filtrar tags por nome…" />
    </div>

    <!-- Empty -->
    <div v-if="!filtered.length" class="empty-state">
      <div class="empty-ico" v-html="ICONS.tag"></div>
      <h3>{{ search ? 'Nenhuma tag encontrada' : 'Nenhuma tag criada' }}</h3>
      <p>{{ search ? `para "${search}"` : 'Crie tags para categorizar seus arquivos' }}</p>
    </div>

    <!-- Tags grid -->
    <div v-else class="tags-grid">
      <div v-for="tag in filtered" :key="tag.name" class="tag-card">
        <div class="tag-top">
          <span class="tag-pill">{{ tag.name }}</span>
          <span class="tag-ct">{{ tag.count }} arquivo{{ tag.count !== 1 ? 's' : '' }}</span>
        </div>
        <div class="tag-acts">
          <button class="tag-act-btn" @click="browseTag(tag)" title="Ver arquivos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Ver arquivos
          </button>
          <button class="tag-act-btn" :disabled="busy" @click="startRename(tag)" title="Renomear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Renomear
          </button>
          <button class="tag-act-btn danger" :disabled="busy" @click="deleteTag(tag)" title="Excluir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Excluir
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Nova Tag -->
    <Transition name="modal">
      <div v-if="showCreate || renaming" class="modal-overlay" @click.self="closeModal" @keydown.esc="closeModal">
        <div class="modal" ref="modalEl" role="dialog" aria-modal="true" :aria-label="renaming ? 'Renomear Tag' : 'Nova Tag'">
          <div class="modal-hd">
            <h3>{{ renaming ? 'Renomear Tag' : 'Nova Tag' }}</h3>
            <button class="modal-close" aria-label="Fechar" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <label class="field-lbl">Nome <span class="req">*</span></label>
            <input v-model="tagName" class="field-input" placeholder="Ex: nordeste" ref="tagInput" />
          </div>
          <div class="modal-ft">
            <button class="btn-ghost" @click="closeModal">Cancelar</button>
            <button class="btn-primary" :disabled="!tagName.trim() || busy" @click="saveTag">
              {{ renaming ? 'Renomear' : 'Criar tag' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAssetsStore } from '@/stores/assets'
import { useToastStore } from '@/stores/toast'
import api from '@/api/client'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { ICONS } from '@/lib/icons'

const router = useRouter()
const assets = useAssetsStore()
const toast = useToastStore()

const search = ref('')
const showCreate = ref(false)
const renaming = ref(null)
const modalEl = ref(null)
useFocusTrap(modalEl, computed(() => showCreate.value || !!renaming.value))
const tagName = ref('')
const tagInput = ref(null)
const busy = ref(false)

// Derive tags from assets
const allTags = computed(() => {
  const map = {}
  assets.items.forEach(f => {
    f.tags?.forEach(t => {
      map[t] = (map[t] || 0) + 1
    })
  })
  return Object.entries(map).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const filtered = computed(() => {
  if (!search.value.trim()) return allTags.value
  const q = search.value.toLowerCase()
  return allTags.value.filter(t => t.name.toLowerCase().includes(q))
})

function browseTag(tag) {
  assets.searchQuery = tag.name
  router.push('/acervo')
}

function startRename(tag) {
  renaming.value = tag
  tagName.value = tag.name
  nextTick(() => tagInput.value?.focus())
}

async function deleteTag(tag) {
  if (busy.value) return
  if (!confirm(`Excluir a tag "${tag.name}"? Ela será removida de ${tag.count} arquivo${tag.count !== 1 ? 's' : ''}.`)) return
  const affected = assets.items.filter(f => f.tags?.includes(tag.name))
  busy.value = true
  try {
    // sequencial, não Promise.all: backend tem bug de concorrência em get_db()
    // (conexão sqlite criada/fechada em threads diferentes sob requests paralelos)
    for (const f of affected) {
      const newTags = f.tags.filter(t => t !== tag.name)
      await api.put(`/api/files/${f.id}/metadata`, { tags: newTags })
      f.tags = newTags
    }
    toast.success(`Tag "${tag.name}" removida de ${affected.length} arquivo(s).`)
  } catch (e) {
    toast.error(e?.response?.data?.detail || 'Erro ao excluir tag. Algumas alterações podem não ter sido salvas.')
  } finally {
    busy.value = false
  }
}

async function saveTag() {
  const name = tagName.value.trim()
  if (!name || busy.value) return

  if (!renaming.value) {
    // Tag nova sem arquivo associado: tags não são entidade própria no backend
    // (só existem via file_tags), então não há o que persistir ainda.
    closeModal()
    return
  }

  const oldName = renaming.value.name
  if (name === oldName) { closeModal(); return }

  const affected = assets.items.filter(f => f.tags?.includes(oldName))
  busy.value = true
  try {
    // sequencial, não Promise.all: backend tem bug de concorrência em get_db()
    for (const f of affected) {
      const newTags = f.tags.map(t => (t === oldName ? name : t))
      await api.put(`/api/files/${f.id}/metadata`, { tags: newTags })
      f.tags = newTags
    }
    toast.success(`Tag renomeada para "${name}" em ${affected.length} arquivo(s).`)
    closeModal()
  } catch (e) {
    toast.error(e?.response?.data?.detail || 'Erro ao renomear tag. Algumas alterações podem não ter sido salvas.')
  } finally {
    busy.value = false
  }
}

function closeModal() {
  showCreate.value = false
  renaming.value = null
  tagName.value = ''
}

onMounted(() => {
  if (!assets.items.length) assets.fetchAssets({ reset: true })
})
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 24px; }
.page-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
.page-title { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); margin: 0; }
.page-sub { font-size: 13px; color: var(--faint); margin: 2px 0 0; }
.btn-primary { display: flex; align-items: center; gap: 6px; }
.btn-primary svg { width: 14px; height: 14px; }

.tag-srch-wrap {
  display: flex; align-items: center; gap: 8px; background: var(--card);
  border: 1.5px solid var(--border); border-radius: 999px; padding: 0 16px;
  max-width: 360px; margin-bottom: 20px;
}
.tag-srch-wrap svg { width: 15px; height: 15px; color: var(--faint); flex-shrink: 0; }
.tag-srch { background: none; border: none; outline: none; font-size: 14px; color: var(--text); padding: 9px 0; width: 100%; font-family: inherit; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 40px; text-align: center; color: var(--muted);
}
.empty-ico { font-size: 40px; margin-bottom: 12px; }
.empty-ico :deep(svg) { width: 1em; height: 1em; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 17px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 13px; margin-top: 4px; }

.tags-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }

.tag-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 14px;
  transition: box-shadow .15s;
}
.tag-card:hover { box-shadow: 0 3px 12px rgba(255,107,0,.1); }

.tag-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
.tag-pill {
  background: rgba(255,107,0,.1); border: 1px solid rgba(255,107,0,.2);
  color: var(--accent); font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px;
}
.tag-ct { font-size: 11px; color: var(--faint); white-space: nowrap; }

.tag-acts { display: flex; gap: 4px; flex-wrap: wrap; }
.tag-act-btn {
  display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500;
  padding: 4px 8px; border-radius: 7px; border: 1px solid var(--border);
  background: none; color: var(--muted); cursor: pointer; transition: all .12s; font-family: inherit;
}
.tag-act-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(255,107,0,.06); }
.tag-act-btn.danger:hover { border-color: #EF4444; color: #EF4444; background: rgba(239,68,68,.06); }
.tag-act-btn svg { width: 11px; height: 11px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { background: var(--surface); border-radius: 20px; width: 100%; max-width: 380px; box-shadow: 0 24px 64px rgba(0,0,0,.18); }
.modal-hd { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-hd h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 16px; font-weight: 700; color: var(--heading); margin: 0; }
.modal-close { background: none; border: none; color: var(--faint); cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.modal-close:hover { background: var(--elevated); }
.modal-close svg { width: 16px; height: 16px; }
.modal-body { padding: 16px 24px; }
.modal-ft { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 24px; border-top: 1px solid var(--border-sub); }
.field-lbl { font-size: 12px; font-weight: 600; color: var(--muted); display: block; margin-bottom: 6px; }
.req { color: #EF4444; }
.field-input {
  width: 100%; background: var(--card); border: 1.5px solid var(--border); border-radius: 10px;
  padding: 9px 12px; font-size: 14px; color: var(--text); outline: none; font-family: inherit; box-sizing: border-box;
}
.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,107,0,.1); }
.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

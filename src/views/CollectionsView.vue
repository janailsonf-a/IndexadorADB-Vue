<template>
  <div class="view-content">
    <div class="page-hd">
      <div>
        <h2 class="page-title">Coleções</h2>
        <p class="page-sub">{{ assets.collections.length }} coleções</p>
      </div>
      <button v-if="auth.isEditor" class="btn-primary" @click="showCreate = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova Coleção
      </button>
    </div>

    <div v-if="!assets.collections.length" class="empty-state">
      <div class="empty-ico" v-html="ICONS.package"></div>
      <h3>Nenhuma coleção ainda</h3>
      <p>Agrupe arquivos em coleções para organizar seu acervo</p>
      <button v-if="auth.isEditor" class="btn-primary" @click="showCreate = true" style="margin-top:16px">
        + Criar primeira coleção
      </button>
    </div>

    <div v-else class="coll-grid">
      <div v-for="c in assets.collections" :key="c.id" class="coll-card" @click="goTo(c)">
        <div class="coll-cover" :style="{ background: coverGradient(c.color) }">
          <div class="coll-cover-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          </div>
          <button v-if="auth.isEditor" class="coll-del" title="Excluir coleção" @click.stop="remove(c)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="coll-info">
          <div class="coll-name">{{ c.name }}</div>
          <div class="coll-meta">{{ c.fileIds.length }} arquivo{{ c.fileIds.length !== 1 ? 's' : '' }}</div>
        </div>
      </div>
    </div>

    <!-- Modal: Nova Coleção -->
    <Transition name="modal">
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false" @keydown.esc="showCreate = false">
        <div class="modal" ref="modalEl" role="dialog" aria-modal="true" aria-label="Nova Coleção">
          <div class="modal-hd">
            <h3>Nova Coleção</h3>
            <button class="modal-close" aria-label="Fechar" @click="showCreate = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <label class="field-lbl">Nome <span class="req">*</span></label>
            <input v-model="form.name" class="field-input" placeholder="Ex: Melhores fotos do Nordeste" @keydown.enter="create">
            <label class="field-lbl" style="margin-top:14px">Cor de identificação</label>
            <div class="color-swatches">
              <button v-for="col in COLORS" :key="col"
                class="swatch" :style="{ background: col }"
                :class="{ active: form.color === col }"
                @click="form.color = col"></button>
            </div>
          </div>
          <div class="modal-ft">
            <button class="btn-ghost" @click="showCreate = false">Cancelar</button>
            <button class="btn-primary" :disabled="!form.name.trim()" @click="create">Criar coleção</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAssetsStore } from '@/stores/assets'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { ICONS } from '@/lib/icons'

const router = useRouter()
const auth = useAuthStore()
const assets = useAssetsStore()

const showCreate = ref(false)
const modalEl = ref(null)
useFocusTrap(modalEl, showCreate)
const form = ref({ name: '', color: '#FF6B00' })
const COLORS = ['#FF6B00', '#FFD900', '#0047BA', '#143F43', '#22C55E', '#EC4899', '#8B5CF6', '#EF4444']

function coverGradient(color) {
  return `linear-gradient(140deg, ${color} 0%, ${color}cc 100%)`
}

function goTo(c) {
  router.push(`/colecoes/${c.id}`)
}

function create() {
  const name = form.value.name.trim()
  if (!name) return
  assets.createCollection(name, form.value.color)
  showCreate.value = false
  form.value = { name: '', color: '#FF6B00' }
}

function remove(c) {
  if (!confirm(`Excluir a coleção "${c.name}"? Os arquivos não serão apagados.`)) return
  assets.deleteCollection(c.id)
}
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 24px; }
.page-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
.page-title { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); margin: 0; }
.page-sub { font-size: 13px; color: var(--faint); margin: 2px 0 0; }
.btn-primary { display: flex; align-items: center; gap: 6px; }
.btn-primary svg { width: 14px; height: 14px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--muted);
}
.empty-ico { font-size: 48px; margin-bottom: 12px; }
.empty-ico :deep(svg) { width: 1em; height: 1em; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 14px; margin-top: 4px; }

.coll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }

.coll-card {
  background: var(--card); border-radius: 16px; overflow: hidden; cursor: pointer;
  border: 1px solid var(--border); transition: box-shadow .2s, transform .2s;
}
.coll-card:hover { box-shadow: 0 6px 24px rgba(255,107,0,.14); transform: translateY(-2px); }

.coll-cover {
  aspect-ratio: 1; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.coll-cover-icon svg { width: 44px; height: 44px; color: rgba(255,255,255,.75); }
.coll-del {
  position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 7px;
  background: rgba(0,0,0,.4); border: none; color: rgba(255,255,255,.8);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  opacity: 0; transition: opacity .15s, background .15s; backdrop-filter: blur(4px);
}
.coll-card:hover .coll-del { opacity: 1; }
.coll-del:hover { background: rgba(239,68,68,.85); color: #fff; }
.coll-del svg { width: 13px; height: 13px; }

.coll-info { padding: 14px 16px; }
.coll-name { font-family: Montserrat, system-ui, sans-serif; font-size: 14px; font-weight: 700; color: var(--heading); margin-bottom: 4px; }
.coll-meta { font-size: 12px; color: var(--faint); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 200;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  background: var(--surface); border-radius: 20px; width: 100%; max-width: 420px;
  box-shadow: 0 24px 64px rgba(0,0,0,.18);
}
.modal-hd { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-hd h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 17px; font-weight: 700; color: var(--heading); margin: 0; }
.modal-close { background: none; border: none; color: var(--faint); cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.modal-close:hover { background: var(--elevated); }
.modal-close svg { width: 16px; height: 16px; }
.modal-body { padding: 16px 24px; }
.modal-ft { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border-sub); }

.field-lbl { font-size: 12px; font-weight: 600; color: var(--muted); display: block; margin-bottom: 6px; }
.req { color: #EF4444; }
.field-input {
  width: 100%; background: var(--card); border: 1.5px solid var(--border); border-radius: 10px;
  padding: 9px 12px; font-size: 14px; color: var(--text); outline: none; font-family: inherit; box-sizing: border-box;
}
.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,107,0,.1); }

.color-swatches { display: flex; gap: 8px; flex-wrap: wrap; }
.swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform .1s; }
.swatch:hover { transform: scale(1.15); }
.swatch.active { border-color: var(--text); box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--text); }

.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

<template>
  <Transition name="modal">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')" @keydown.esc="$emit('close')">
      <div class="modal" ref="modalEl" role="dialog" aria-modal="true" aria-label="Adicionar à coleção">
        <div class="modal-hd">
          <h3>Adicionar à coleção</h3>
          <button class="modal-close" aria-label="Fechar" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="hint">{{ fileIds.length }} arquivo{{ fileIds.length !== 1 ? 's' : '' }} selecionado{{ fileIds.length !== 1 ? 's' : '' }}</p>

          <div v-if="assets.collections.length" class="coll-pick-list">
            <button v-for="c in assets.collections" :key="c.id" class="coll-pick-item" @click="addTo(c.id)">
              <span class="coll-pick-dot" :style="{ background: c.color }"></span>
              <span class="coll-pick-name">{{ c.name }}</span>
              <span class="coll-pick-count">{{ c.fileIds.length }} arq.</span>
            </button>
          </div>
          <p v-else class="hint" style="margin-top:4px">Você ainda não tem coleções.</p>

          <div class="new-coll-row" v-if="!showNew">
            <button class="btn-secondary" @click="showNew = true" style="width:100%; justify-content:center">
              + Nova coleção
            </button>
          </div>
          <div v-else class="new-coll-form">
            <input v-model="newName" class="field-input" placeholder="Nome da nova coleção" @keydown.enter="createAndAdd">
            <div class="color-swatches">
              <button v-for="col in COLORS" :key="col"
                class="swatch" :style="{ background: col }"
                :class="{ active: newColor === col }"
                @click="newColor = col"></button>
            </div>
            <button class="btn-primary" :disabled="!newName.trim()" @click="createAndAdd" style="width:100%; justify-content:center">
              Criar e adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, toRef } from 'vue'
import { useAssetsStore } from '@/stores/assets'
import { useToastStore } from '@/stores/toast'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = defineProps({ open: Boolean, fileIds: { type: Array, default: () => [] } })
const emit = defineEmits(['close'])

const assets = useAssetsStore()
const toast = useToastStore()
const modalEl = ref(null)
useFocusTrap(modalEl, toRef(props, 'open'))

const COLORS = ['#FF6B00', '#FFD900', '#0047BA', '#143F43', '#22C55E', '#EC4899', '#8B5CF6', '#EF4444']
const showNew = ref(false)
const newName = ref('')
const newColor = ref('#FF6B00')

function addTo(id) {
  assets.addFilesToCollection(id, props.fileIds)
  toast.success('Arquivos adicionados à coleção.')
  reset()
  emit('close')
}

function createAndAdd() {
  const name = newName.value.trim()
  if (!name) return
  const c = assets.createCollection(name, newColor.value)
  assets.addFilesToCollection(c.id, props.fileIds)
  toast.success('Coleção criada e arquivos adicionados.')
  reset()
  emit('close')
}

function reset() {
  showNew.value = false
  newName.value = ''
  newColor.value = '#FF6B00'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 250;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  background: var(--surface); border-radius: 20px; width: 100%; max-width: 400px;
  box-shadow: 0 24px 64px rgba(0,0,0,.18); overflow: hidden;
}
.modal-hd { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-hd h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 17px; font-weight: 700; color: var(--heading); margin: 0; }
.modal-close { background: none; border: none; color: var(--faint); cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.modal-close:hover { background: var(--elevated); color: var(--text); }
.modal-close svg { width: 16px; height: 16px; }
.modal-body { padding: 16px 24px 24px; }
.hint { font-size: 12px; color: var(--faint); margin: 0 0 12px; }

.coll-pick-list { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; margin-bottom: 12px; }
.coll-pick-item {
  display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--card); cursor: pointer; text-align: left;
  font-family: inherit; transition: border-color .12s, background .12s;
}
.coll-pick-item:hover { border-color: var(--accent); background: var(--elevated); }
.coll-pick-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.coll-pick-name { flex: 1; font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.coll-pick-count { font-size: 11px; color: var(--faint); flex-shrink: 0; }

.new-coll-form { display: flex; flex-direction: column; gap: 10px; }
.field-input {
  width: 100%; background: var(--card); border: 1.5px solid var(--border); border-radius: 10px;
  padding: 9px 12px; font-size: 14px; color: var(--text); outline: none; font-family: inherit; box-sizing: border-box;
  transition: border-color .15s;
}
.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,107,0,.1); }
.color-swatches { display: flex; gap: 8px; flex-wrap: wrap; }
.swatch { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform .1s; }
.swatch:hover { transform: scale(1.15); }
.swatch.active { border-color: var(--text); box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--text); }

.btn-secondary, .btn-primary { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-secondary { border: 1px solid var(--border); background: var(--card); color: var(--text); }
.btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
.btn-primary { border: none; background: var(--accent); color: #fff; }
.btn-primary:disabled { opacity: .5; cursor: default; }

.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

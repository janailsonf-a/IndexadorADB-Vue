<template>
  <div class="view-content">
    <div class="page-hd">
      <div>
        <h2 class="page-title">Lixeira</h2>
        <p class="page-sub">Arquivos são apagados permanentemente após {{ settings.cfg.trashDays }} dias</p>
      </div>
      <button v-if="auth.isAdmin && trashedFiles.length" class="btn-danger" @click="showEmpty = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        Esvaziar lixeira
      </button>
    </div>

    <div v-if="!trashedFiles.length" class="empty-state">
      <div class="empty-ico" v-html="ICONS.trash"></div>
      <h3>Lixeira vazia</h3>
      <p>Nenhum arquivo excluído</p>
    </div>

    <div v-else class="trash-grid">
      <div v-for="file in trashedFiles" :key="file.id" class="trash-card">
        <div class="trash-thumb" :style="{ background: getFileFt(file).bg }">
          <div class="trash-overlay"></div>
          <div class="thumb-icon" v-html="getFileFt(file).icon"></div>
          <div class="expiry-badge" :class="{ urgent: file.daysLeft <= 7 }">
            <span class="expiry-ico" v-html="ICONS.alertTriangle"></span> Expira em {{ file.daysLeft }}d
          </div>
        </div>
        <div class="trash-info">
          <div class="trash-name" :title="file.name">{{ file.name }}</div>
          <div class="trash-meta">{{ file.size }} · {{ file.deletedDate }}</div>
        </div>
        <div class="trash-acts">
          <button class="tact-restore" @click="restore(file)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.61"/></svg>
            Restaurar
          </button>
          <button v-if="auth.isAdmin" class="tact-delete" @click="deletePermanent(file)" title="Apagar para sempre">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="showEmpty" class="modal-overlay" @click.self="showEmpty = false" @keydown.esc="showEmpty = false">
        <div class="modal" ref="modalEl" role="dialog" aria-modal="true" aria-label="Esvaziar lixeira">
          <div class="modal-hd">
            <h3>Esvaziar lixeira?</h3>
            <button class="modal-close" aria-label="Fechar" @click="showEmpty = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p style="font-size:14px;color:var(--text);margin:0">
              <strong>{{ trashedFiles.length }} arquivo{{ trashedFiles.length !== 1 ? 's' : '' }}</strong> serão removidos da lixeira e ocultados do acervo permanentemente. Esta ação não pode ser desfeita.
            </p>
          </div>
          <div class="modal-ft">
            <button class="btn-ghost" @click="showEmpty = false">Cancelar</button>
            <button class="btn-danger" @click="confirmEmptyTrash">Apagar tudo</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAssetsStore } from '@/stores/assets'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'
import { useFileType } from '@/composables/useFileType'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { ICONS } from '@/lib/icons'

const auth = useAuthStore()
const assets = useAssetsStore()
const settings = useSettingsStore()
const toast = useToastStore()
const showEmpty = ref(false)
const modalEl = ref(null)
useFocusTrap(modalEl, showEmpty)

const trashedFiles = computed(() => {
  return assets.items
    .filter(f => f.id in assets.trash)
    .map(f => {
      const deletedAt = new Date(assets.trash[f.id])
      const daysPassed = Math.floor((Date.now() - deletedAt.getTime()) / 86400000)
      return {
        ...f,
        deletedDate: `Excluído em ${deletedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
        daysLeft: Math.max(0, settings.cfg.trashDays - daysPassed),
      }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
})

function getFileFt(file) { return useFileType(file.type) }

function restore(file) {
  assets.restoreFromTrash(file.id)
  toast.success('Arquivo restaurado.')
}

function deletePermanent(file) {
  assets.permanentlyRemove(file.id)
  toast.success('Arquivo removido definitivamente.')
}

function confirmEmptyTrash() {
  assets.emptyTrash()
  showEmpty.value = false
  toast.success('Lixeira esvaziada.')
}

onMounted(() => {
  if (!assets.items.length) assets.fetchAssets({ reset: true })
})
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 24px; }
.page-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); margin: 0; }
.page-sub { font-size: 13px; color: var(--faint); margin: 2px 0 0; }
.btn-danger { display: flex; align-items: center; gap: 6px; }
.btn-danger svg { width: 14px; height: 14px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--muted);
}
.empty-ico { font-size: 48px; margin-bottom: 12px; }
.empty-ico :deep(svg) { width: 1em; height: 1em; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 14px; margin-top: 4px; }

.trash-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.trash-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; transition: box-shadow .2s; }
.trash-card:hover { box-shadow: 0 4px 16px rgba(239,68,68,.12); }
.trash-thumb { aspect-ratio: 4/3; position: relative; display: flex; align-items: center; justify-content: center; }
.trash-overlay { position: absolute; inset: 0; background: rgba(239,68,68,.18); }
.thumb-icon { position: relative; z-index: 1; color: rgba(255,255,255,.7); }
.thumb-icon :deep(svg) { width: 36px; height: 36px; }
.expiry-badge {
  position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,.6); color: rgba(255,255,255,.8); font-size: 10px; font-weight: 600;
  padding: 3px 8px; border-radius: 999px; white-space: nowrap; backdrop-filter: blur(4px);
}
.expiry-badge.urgent { background: rgba(239,68,68,.8); color: #fff; }
.expiry-ico { display: inline-flex; vertical-align: -2px; }
.expiry-ico :deep(svg) { width: 11px; height: 11px; }
.trash-info { padding: 10px 12px 8px; }
.trash-name { font-size: 13px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.trash-meta { font-size: 11px; color: var(--faint); margin-top: 2px; }
.trash-acts { display: flex; gap: 6px; padding: 0 12px 12px; }
.tact-restore {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
  background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.3); color: #16A34A;
  border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background .12s;
}
.tact-restore:hover { background: rgba(34,197,94,.18); }
.tact-restore svg { width: 12px; height: 12px; }
.tact-delete {
  width: 32px; display: flex; align-items: center; justify-content: center;
  background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.2); color: #EF4444;
  border-radius: 8px; cursor: pointer; flex-shrink: 0; transition: background .12s;
}
.tact-delete:hover { background: rgba(239,68,68,.18); }
.tact-delete svg { width: 13px; height: 13px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal { background: var(--surface); border-radius: 20px; width: 100%; max-width: 400px; box-shadow: 0 24px 64px rgba(0,0,0,.18); }
.modal-hd { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-hd h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 16px; font-weight: 700; color: var(--heading); margin: 0; }
.modal-close { background: none; border: none; color: var(--faint); cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.modal-close:hover { background: var(--elevated); }
.modal-close svg { width: 16px; height: 16px; }
.modal-body { padding: 16px 24px; }
.modal-ft { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 24px; border-top: 1px solid var(--border-sub); }
.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

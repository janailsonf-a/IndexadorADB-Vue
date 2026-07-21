<template>
  <div class="camp-detail">
    <!-- Banner -->
    <div class="camp-banner" :style="{ background: bannerGrad }">
      <div class="banner-inner">
        <RouterLink to="/campanhas" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Campanhas
        </RouterLink>
        <div class="banner-info">
          <h1 class="banner-title">{{ campaignName }}</h1>
          <p class="banner-meta">{{ campaignFiles.length }} arquivos · Atualizado recentemente</p>
        </div>
        <div class="banner-actions" v-if="auth.isEditor">
          <button class="bact-btn" @click="openEdit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <FilterBar :current="assets.currentFilter" @filter="v => assets.currentFilter = v" />

    <div class="view-content">
      <div v-if="!campaignFiles.length" class="empty-state">
        <div class="empty-ico" v-html="ICONS.folderOpen"></div>
        <h3>Campanha vazia</h3>
        <p>Nenhum arquivo associado a esta campanha ainda</p>
      </div>

      <div v-else class="file-grid" :style="{ '--gs': ui.gridSize + 'px' }">
        <FileCard
          v-for="file in campaignFiles"
          :key="file.id"
          :file="file"
          :is-selected="assets.selected.has(file.id)"
          @click="openLightbox(file)"
          @select="assets.toggleSelect(file.id)"
          @preview="openLightbox(file)"
          @download="downloadFile"
        />
      </div>
    </div>
  </div>

  <FileLightbox
    :file="lightboxFile"
    @close="lightboxFile = null"
    @prev="navLightbox(-1)"
    @next="navLightbox(1)"
    @download="downloadFile"
  />

  <FloatingActionBar
    :count="assets.selected.size"
    @clear="assets.clearSelection()"
    @download="bulkDownload"
    @campaign="showCampaignPicker = true"
    @collection="showCollectionPicker = true"
    @trash="bulkTrash"
  />

  <AddToCollectionModal
    :open="showCollectionPicker"
    :file-ids="[...assets.selected]"
    @close="showCollectionPicker = false"
  />

  <LinkToCampaignModal
    :open="showCampaignPicker"
    :file-ids="[...assets.selected]"
    @close="showCampaignPicker = false"
  />

  <!-- Modal: Editar Campanha -->
  <Transition name="modal">
    <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false" @keydown.esc="showEdit = false">
      <div class="modal" ref="modalEl" role="dialog" aria-modal="true" aria-label="Editar Campanha">
        <div class="modal-hd">
          <h3>Editar Campanha</h3>
          <button class="modal-close" aria-label="Fechar" @click="showEdit = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <label class="field-lbl">Nome</label>
          <input class="field-input" :value="campaignName" disabled title="Renomear exige atualizar todos os arquivos da campanha — ainda não suportado">
          <label class="field-lbl" style="margin-top:14px">Descrição</label>
          <textarea v-model="editForm.description" class="field-input field-ta" placeholder="Descreva o objetivo desta campanha…" rows="3"></textarea>
          <label class="field-lbl" style="margin-top:14px">Cor de identificação</label>
          <div class="color-swatches">
            <button v-for="col in COLORS" :key="col"
              class="swatch" :style="{ background: col }"
              :class="{ active: editForm.color === col }"
              @click="editForm.color = col"></button>
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn-ghost" @click="showEdit = false">Cancelar</button>
          <button class="btn-primary" @click="saveEdit">Salvar</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAssetsStore } from '@/stores/assets'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useZipDownload } from '@/composables/useZipDownload'
import FilterBar from '@/components/gallery/FilterBar.vue'
import FileCard from '@/components/gallery/FileCard.vue'
import FileLightbox from '@/components/gallery/FileLightbox.vue'
import FloatingActionBar from '@/components/gallery/FloatingActionBar.vue'
import AddToCollectionModal from '@/components/gallery/AddToCollectionModal.vue'
import LinkToCampaignModal from '@/components/gallery/LinkToCampaignModal.vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { ICONS } from '@/lib/icons'

const route = useRoute()
const assets = useAssetsStore()
const ui = useUiStore()
const auth = useAuthStore()
const toast = useToastStore()
const { downloadAsZip } = useZipDownload()

const COLORS = ['#FF6B00', '#FFD900', '#0047BA', '#143F43', '#22C55E', '#EC4899', '#8B5CF6', '#EF4444']

const showEdit = ref(false)
const modalEl = ref(null)
useFocusTrap(modalEl, showEdit)
const editForm = ref({ description: '', color: '#FF6B00' })
const lightboxFile = ref(null)
const lightboxIdx = ref(0)
const showCollectionPicker = ref(false)
const showCampaignPicker = ref(false)

const bannerGrad = computed(() => {
  const color = assets.campaignMeta[campaignName.value]?.color
  return color ? `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` : 'linear-gradient(135deg, #FF6B00 0%, #FFD900 100%)'
})

const campaignName = computed(() => decodeURIComponent(route.params.id || ''))

const campaignFiles = computed(() => {
  let list = assets.visibleItems.filter(f => f.campaign === campaignName.value)
  if (assets.currentFilter !== 'todos') {
    list = list.filter(f => f.type === assets.currentFilter)
  }
  // Não reaplica o filtro de campanha do FilterBar aqui — já estamos dentro de uma campanha específica.
  if (assets.dateFromFilter) list = list.filter(f => f.date && f.date.slice(0, 10) >= assets.dateFromFilter)
  if (assets.dateToFilter) list = list.filter(f => f.date && f.date.slice(0, 10) <= assets.dateToFilter)
  return list
})

function openLightbox(file) {
  lightboxFile.value = file
  lightboxIdx.value = campaignFiles.value.findIndex(f => f.id === file.id)
}

function navLightbox(dir) {
  const list = campaignFiles.value
  lightboxIdx.value = (lightboxIdx.value + dir + list.length) % list.length
  lightboxFile.value = list[lightboxIdx.value]
}

function downloadFile(file) {
  const a = document.createElement('a'); a.href = file.download_link; a.download = file.name; a.click()
}

function bulkDownload() { downloadAsZip(assets.selectedList) }

function bulkTrash() {
  const ids = [...assets.selected]
  ids.forEach(id => assets.moveToTrash(id))
  toast.success(`${ids.length} arquivo(s) movido(s) para a lixeira.`)
  assets.clearSelection()
}

function openEdit() {
  const current = assets.campaignMeta[campaignName.value]
  editForm.value = { description: current?.description || '', color: current?.color || '#FF6B00' }
  showEdit.value = true
}

function saveEdit() {
  assets.upsertCampaignMeta(campaignName.value, {
    description: editForm.value.description.trim(),
    color: editForm.value.color,
  })
  showEdit.value = false
  toast.success('Campanha atualizada.')
}

function onKey(e) {
  if (lightboxFile.value) {
    if (e.key === 'ArrowLeft') navLightbox(-1)
    if (e.key === 'ArrowRight') navLightbox(1)
    if (e.key === 'Escape') lightboxFile.value = null
    return
  }
  if (e.key === 'Delete' && assets.selected.size > 0) {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (confirm(`Mover ${assets.selected.size} arquivo(s) selecionado(s) para a lixeira?`)) bulkTrash()
  }
}

onMounted(() => {
  if (!assets.items.length) assets.fetchAssets({ reset: true })
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.camp-detail { display: flex; flex-direction: column; flex: 1; overflow: hidden; }

.camp-banner { padding: 0; flex-shrink: 0; }
.banner-inner {
  padding: 20px 24px;
  display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap;
}

.back-link {
  display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,.8); text-decoration: none; margin-right: auto;
  align-self: flex-start;
}
.back-link:hover { color: #fff; }
.back-link svg { width: 16px; height: 16px; }

.banner-info { flex: 1; }
.banner-title {
  font-family: Montserrat, system-ui, sans-serif; font-size: 26px; font-weight: 800;
  color: #fff; margin: 0; text-shadow: 0 1px 4px rgba(0,0,0,.2);
}
.banner-meta { font-size: 13px; color: rgba(255,255,255,.75); margin: 4px 0 0; }

.banner-actions { display: flex; gap: 8px; align-self: flex-end; }
.bact-btn {
  display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,.2);
  border: 1px solid rgba(255,255,255,.3); color: #fff; border-radius: 999px;
  padding: 7px 14px; font-size: 13px; font-weight: 500; cursor: pointer; backdrop-filter: blur(4px);
  transition: background .15s; font-family: inherit;
}
.bact-btn:hover { background: rgba(255,255,255,.3); }
.bact-btn svg { width: 14px; height: 14px; }

.view-content { flex: 1; overflow-y: auto; padding: 22px 20px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--muted);
}
.empty-ico { font-size: 48px; margin-bottom: 12px; }
.empty-ico :deep(svg) { width: 1em; height: 1em; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 14px; margin-top: 4px; }

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--gs, 200px), 1fr));
  gap: 12px;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 200;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  background: var(--surface); border-radius: 20px; width: 100%; max-width: 440px;
  box-shadow: 0 24px 64px rgba(0,0,0,.18); overflow: hidden;
}
.modal-hd { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-hd h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 17px; font-weight: 700; color: var(--heading); margin: 0; }
.modal-close { background: none; border: none; color: var(--faint); cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.modal-close:hover { background: var(--elevated); color: var(--text); }
.modal-close svg { width: 16px; height: 16px; }
.modal-body { padding: 16px 24px; }
.modal-ft { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border-sub); }

.field-lbl { font-size: 12px; font-weight: 600; color: var(--muted); display: block; margin-bottom: 6px; }
.field-input {
  width: 100%; background: var(--card); border: 1.5px solid var(--border); border-radius: 10px;
  padding: 9px 12px; font-size: 14px; color: var(--text); outline: none; font-family: inherit; box-sizing: border-box;
  transition: border-color .15s;
}
.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,107,0,.1); }
.field-input:disabled { opacity: .6; cursor: not-allowed; }
.field-ta { resize: vertical; min-height: 80px; }

.color-swatches { display: flex; gap: 8px; flex-wrap: wrap; }
.swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform .1s; }
.swatch:hover { transform: scale(1.15); }
.swatch.active { border-color: var(--text); box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--text); }

.btn-ghost { height: 36px; padding: 0 16px; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .12s; }
.btn-ghost:hover { border-color: var(--text); color: var(--text); }

.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

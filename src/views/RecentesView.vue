<template>
  <div class="view-content">
    <div class="page-hd">
      <h2 class="page-title">Arquivos Recentes</h2>
    </div>

    <div v-if="!assets.visibleItems.length" class="empty-state">
      <div class="empty-ico" v-html="ICONS.clock"></div>
      <h3>Nenhum arquivo recente</h3>
      <p>Os arquivos acessados recentemente aparecerão aqui</p>
    </div>

    <template v-else>
      <div v-for="group in grouped" :key="group.label" class="gal-sec">
        <div class="gal-sec-hd">
          <span class="sec-dt">{{ group.label }}</span>
          <span class="sec-ct">· {{ group.files.length }} arquivo{{ group.files.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="file-grid" :style="{ '--gs': ui.gridSize + 'px' }">
          <FileCard
            v-for="file in group.files"
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
    </template>
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAssetsStore } from '@/stores/assets'
import { useUiStore } from '@/stores/ui'
import FileCard from '@/components/gallery/FileCard.vue'
import FileLightbox from '@/components/gallery/FileLightbox.vue'
import FloatingActionBar from '@/components/gallery/FloatingActionBar.vue'
import AddToCollectionModal from '@/components/gallery/AddToCollectionModal.vue'
import LinkToCampaignModal from '@/components/gallery/LinkToCampaignModal.vue'
import { useToastStore } from '@/stores/toast'
import { useZipDownload } from '@/composables/useZipDownload'
import { ICONS } from '@/lib/icons'

const assets = useAssetsStore()
const ui = useUiStore()
const toast = useToastStore()
const { downloadAsZip } = useZipDownload()
const lightboxFile = ref(null)
const lightboxIdx = ref(0)
const showCollectionPicker = ref(false)
const showCampaignPicker = ref(false)

const grouped = computed(() => {
  const now = Date.now()
  const sorted = [...assets.visibleItems].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0
    const db = b.date ? new Date(b.date).getTime() : 0
    return db - da
  }).slice(0, 200)

  const map = { 'Hoje': [], 'Esta semana': [], 'Este mês': [], 'Mais antigos': [] }
  sorted.forEach(f => {
    const dt = f.date ? new Date(f.date) : null
    const diff = dt && !isNaN(dt) ? Math.floor((now - dt.getTime()) / 86400000) : 9999
    if (diff === 0) map['Hoje'].push(f)
    else if (diff <= 7) map['Esta semana'].push(f)
    else if (diff <= 30) map['Este mês'].push(f)
    else map['Mais antigos'].push(f)
  })

  return Object.entries(map)
    .filter(([, files]) => files.length)
    .map(([label, files]) => ({ label, files }))
})

function openLightbox(file) {
  lightboxFile.value = file
  lightboxIdx.value = grouped.value.flatMap(g => g.files).findIndex(f => f.id === file.id)
}

function navLightbox(dir) {
  const flat = grouped.value.flatMap(g => g.files)
  const idx = flat.findIndex(f => f.id === lightboxFile.value?.id)
  const next = (idx + dir + flat.length) % flat.length
  lightboxFile.value = flat[next]
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
  window.addEventListener('keydown', onKey)
  if (!assets.items.length) assets.fetchAssets({ reset: true })
})

onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 22px 20px; }
.page-hd { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
.page-title { font-family: Montserrat, system-ui, sans-serif; font-size: 20px; font-weight: 700; color: var(--heading); margin: 0; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--muted);
}
.empty-ico { font-size: 48px; margin-bottom: 12px; }
.empty-ico :deep(svg) { width: 1em; height: 1em; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 14px; margin-top: 4px; }

.gal-sec { margin-bottom: 28px; }
.gal-sec-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border-sub); }
.sec-dt { font-family: Montserrat, system-ui, sans-serif; font-size: 15px; font-weight: 700; color: var(--heading); }
.sec-ct { font-size: 12px; color: var(--faint); }

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--gs, 200px), 1fr));
  gap: 12px;
}
</style>

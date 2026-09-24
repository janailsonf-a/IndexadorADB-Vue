<template>
  <FilterBar :current="assets.currentFilter" @filter="v => assets.currentFilter = v" />

  <div class="view-content">
    <div class="page-hd">
      <h2 class="page-title">Favoritos</h2>
      <span class="page-count">{{ starred.length }} arquivo{{ starred.length !== 1 ? 's' : '' }}</span>
    </div>

    <div v-if="!starred.length" class="empty-state">
      <div class="empty-ico">⭐</div>
      <h3>Nenhum favorito ainda</h3>
      <p>Clique na estrela em qualquer arquivo para salvá-lo aqui</p>
    </div>

    <div v-else class="file-grid" :style="{ '--gs': ui.gridSize + 'px' }">
      <FileCard
        v-for="file in starred"
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
import FilterBar from '@/components/gallery/FilterBar.vue'
import FileCard from '@/components/gallery/FileCard.vue'
import FileLightbox from '@/components/gallery/FileLightbox.vue'
import FloatingActionBar from '@/components/gallery/FloatingActionBar.vue'
import AddToCollectionModal from '@/components/gallery/AddToCollectionModal.vue'
import LinkToCampaignModal from '@/components/gallery/LinkToCampaignModal.vue'
import { useToastStore } from '@/stores/toast'
import { useZipDownload } from '@/composables/useZipDownload'

const assets = useAssetsStore()
const ui = useUiStore()
const toast = useToastStore()
const { downloadAsZip } = useZipDownload()
const lightboxFile = ref(null)
const lightboxIdx = ref(0)
const showCollectionPicker = ref(false)
const showCampaignPicker = ref(false)

const starred = computed(() => {
  let list = assets.visibleItems.filter(f => f.starred)
  if (assets.currentFilter !== 'todos') {
    list = list.filter(f => f.type === assets.currentFilter)
  }
  return assets.applyCampaignDateFilter(list)
})

function openLightbox(file) {
  lightboxFile.value = file
  lightboxIdx.value = starred.value.findIndex(f => f.id === file.id)
}

function navLightbox(dir) {
  const list = starred.value
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
.view-content { flex: 1; overflow-y: auto; padding: 22px 20px; }
.page-hd { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
.page-title {
  font-family: Montserrat, system-ui, sans-serif;
  font-size: 20px; font-weight: 700; color: var(--heading); margin: 0;
}
.page-count { font-size: 13px; color: var(--faint); }
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--muted);
}
.empty-ico { font-size: 48px; margin-bottom: 12px; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 14px; margin-top: 4px; }
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--gs, 200px), 1fr));
  gap: 12px;
}
</style>

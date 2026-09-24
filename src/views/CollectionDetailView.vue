<template>
  <div class="coll-detail">
    <!-- Banner -->
    <div class="coll-banner" :style="{ background: bannerGrad }">
      <div class="banner-inner">
        <RouterLink to="/colecoes" class="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Coleções
        </RouterLink>
        <div class="banner-info">
          <h1 class="banner-title">{{ collection?.name || 'Coleção' }}</h1>
          <p class="banner-meta">{{ collectionFiles.length }} arquivos</p>
        </div>
      </div>
    </div>

    <div v-if="!collection" class="view-content">
      <div class="empty-state">
        <div class="empty-ico" v-html="ICONS.helpCircle"></div>
        <h3>Coleção não encontrada</h3>
        <p>Ela pode ter sido excluída.</p>
      </div>
    </div>

    <template v-else>
      <FilterBar :current="assets.currentFilter" @filter="v => assets.currentFilter = v" />

      <div class="view-content">
        <div v-if="!collectionFiles.length" class="empty-state">
          <div class="empty-ico" v-html="ICONS.package"></div>
          <h3>Coleção vazia</h3>
          <p>Adicione arquivos a partir do acervo (selecione e use "Coleção" na barra de ações)</p>
        </div>

        <div v-else class="file-grid" :style="{ '--gs': ui.gridSize + 'px' }">
          <FileCard
            v-for="file in collectionFiles"
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
  >
    <template #extra v-if="auth.isEditor">
      <button class="fb-btn" @click="removeSelectedFromCollection">Remover da coleção</button>
    </template>
  </FloatingActionBar>

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
import { ICONS } from '@/lib/icons'

const route = useRoute()
const assets = useAssetsStore()
const ui = useUiStore()
const auth = useAuthStore()
const toast = useToastStore()
const { downloadAsZip } = useZipDownload()

const lightboxFile = ref(null)
const lightboxIdx = ref(0)
const showCollectionPicker = ref(false)
const showCampaignPicker = ref(false)

const collection = computed(() => assets.collections.find(c => c.id === route.params.id))
const bannerGrad = computed(() => {
  const color = collection.value?.color || '#FF6B00'
  return `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
})

const collectionFiles = computed(() => {
  if (!collection.value) return []
  const ids = new Set(collection.value.fileIds)
  let list = assets.items.filter(f => ids.has(f.id))
  if (assets.currentFilter !== 'todos') list = list.filter(f => f.type === assets.currentFilter)
  return assets.applyCampaignDateFilter(list)
})

function openLightbox(file) {
  lightboxFile.value = file
  lightboxIdx.value = collectionFiles.value.findIndex(f => f.id === file.id)
}

function navLightbox(dir) {
  const list = collectionFiles.value
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

function removeSelectedFromCollection() {
  if (!collection.value) return
  const ids = [...assets.selected]
  ids.forEach(id => assets.removeFileFromCollection(collection.value.id, id))
  toast.success(`${ids.length} arquivo(s) removido(s) da coleção.`)
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
.coll-detail { display: flex; flex-direction: column; flex: 1; overflow: hidden; }

.coll-banner { padding: 0; flex-shrink: 0; }
.banner-inner { padding: 20px 24px; display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }

.back-link {
  display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,.8); text-decoration: none; margin-right: auto; align-self: flex-start;
}
.back-link:hover { color: #fff; }
.back-link svg { width: 16px; height: 16px; }

.banner-info { flex: 1; }
.banner-title { font-family: Montserrat, system-ui, sans-serif; font-size: 26px; font-weight: 800; color: #fff; margin: 0; text-shadow: 0 1px 4px rgba(0,0,0,.2); }
.banner-meta { font-size: 13px; color: rgba(255,255,255,.75); margin: 4px 0 0; }

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
</style>

<template>
  <FilterBar :current="assets.currentFilter" @filter="v => assets.currentFilter = v" />

  <div class="view-content">
    <!-- Header -->
    <div v-if="query" class="srch-hd">
      <h2 class="srch-title">
        Resultados para <em>"{{ query }}"</em>
      </h2>
      <span class="srch-count">{{ totalMatches.toLocaleString('pt-BR') }} arquivo{{ totalMatches !== 1 ? 's' : '' }}</span>
    </div>
    <div v-else class="srch-hd">
      <h2 class="srch-title">Busca</h2>
      <span class="srch-count">Use a barra de busca acima</span>
    </div>

    <!-- Loading -->
    <SkeletonGrid v-if="loading" :grid-size="ui.gridSize" />

    <!-- No query -->
    <div v-else-if="!query" class="empty-state">
      <div class="empty-ico" v-html="ICONS.search"></div>
      <h3>O que você procura?</h3>
      <p>Busque por nome, campanha ou tag</p>
    </div>

    <!-- No results -->
    <div v-else-if="!results.length" class="empty-state">
      <div class="empty-ico" v-html="ICONS.search"></div>
      <h3>Nenhum resultado encontrado</h3>
      <p>Tente termos diferentes ou remova filtros</p>
      <button class="btn-secondary" @click="clearSearch" style="margin-top:16px">Limpar busca</button>
    </div>

    <!-- Results grid -->
    <template v-else>
      <div class="file-grid" :style="{ '--gs': ui.gridSize + 'px' }">
        <FileCard
          v-for="file in results"
          :key="file.id"
          :file="file"
          :is-selected="assets.selected.has(file.id)"
          @click="openLightbox(file)"
          @select="assets.toggleSelect(file.id)"
          @preview="openLightbox(file)"
          @download="downloadFile"
        />
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssetsStore, mapItem } from '@/stores/assets'
import { useUiStore } from '@/stores/ui'
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue'
import { ICONS } from '@/lib/icons'
import FilterBar from '@/components/gallery/FilterBar.vue'
import FileCard from '@/components/gallery/FileCard.vue'
import FileLightbox from '@/components/gallery/FileLightbox.vue'
import FloatingActionBar from '@/components/gallery/FloatingActionBar.vue'
import AddToCollectionModal from '@/components/gallery/AddToCollectionModal.vue'
import LinkToCampaignModal from '@/components/gallery/LinkToCampaignModal.vue'
import { useToastStore } from '@/stores/toast'
import { useZipDownload } from '@/composables/useZipDownload'
import api from '@/api/client'

const route = useRoute()
const router = useRouter()
const assets = useAssetsStore()
const ui = useUiStore()
const toast = useToastStore()
const { downloadAsZip } = useZipDownload()

const loading = ref(false)
const results = ref([])
const lightboxFile = ref(null)
const lightboxIdx = ref(0)
const totalMatches = ref(0)
const showCollectionPicker = ref(false)
const showCampaignPicker = ref(false)

const query = computed(() => route.query.q || '')

let debounce = null
async function doSearch(q) {
  if (!q.trim()) { results.value = []; totalMatches.value = 0; return }
  loading.value = true
  try {
    const { data } = await api.get('/api/search', {
      params: { query: q, page: 1, page_size: 50, order: 'recent' }
    })
    let list = (data.results || []).map(r => mapItem(r, assets.starredIds))
    list = list.filter(f => !(f.id in assets.trash) && !assets.hiddenIds.has(f.id))
    if (assets.currentFilter !== 'todos') list = list.filter(f => f.type === assets.currentFilter)
    results.value = assets.applyCampaignDateFilter(list)
    totalMatches.value = data.meta?.total_matches || list.length
  } catch { results.value = [] } finally { loading.value = false }
}

watch(query, (q) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => doSearch(q), 300)
}, { immediate: true })

watch(() => assets.currentFilter, () => doSearch(query.value))
watch([() => assets.campaignFilter, () => assets.dateFromFilter, () => assets.dateToFilter], () => doSearch(query.value))

function openLightbox(file) {
  lightboxFile.value = file
  lightboxIdx.value = results.value.findIndex(f => f.id === file.id)
}

function navLightbox(dir) {
  const list = results.value
  lightboxIdx.value = (lightboxIdx.value + dir + list.length) % list.length
  lightboxFile.value = list[lightboxIdx.value]
}

function downloadFile(file) {
  const a = document.createElement('a'); a.href = file.download_link; a.download = file.name; a.click()
}

function bulkDownload() { downloadAsZip(results.value.filter(f => assets.selected.has(f.id))) }

function bulkTrash() {
  const ids = [...assets.selected]
  ids.forEach(id => assets.moveToTrash(id))
  toast.success(`${ids.length} arquivo(s) movido(s) para a lixeira.`)
  assets.clearSelection()
}

function clearSearch() { router.push('/acervo') }

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

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 22px 20px; }

.srch-hd { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.srch-title {
  font-family: Montserrat, system-ui, sans-serif;
  font-size: 20px; font-weight: 700; color: var(--heading); margin: 0;
}
.srch-title em { font-style: normal; color: var(--accent); }
.srch-count { font-size: 13px; color: var(--faint); }

.loading-state, .empty-state {
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

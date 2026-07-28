<template>
  <FilterBar
    :current="assets.currentFilter"
    @filter="setFilter"
  />

  <div class="view-content" ref="contentEl">
    <!-- Loading initial -->
    <SkeletonGrid v-if="assets.loading" :grid-size="ui.gridSize" />

    <!-- Empty -->
    <div v-else-if="!groupedFiles.length" class="empty-state">
      <div class="empty-ico" v-html="ICONS.search"></div>
      <h3>Nenhum arquivo encontrado</h3>
      <p v-if="assets.searchQuery">para "{{ assets.searchQuery }}"</p>
      <button class="btn-primary" @click="clearFilters" style="margin-top:16px">Limpar filtros</button>
    </div>

    <!-- Grid -->
    <template v-else>
      <div v-for="group in groupedFiles" :key="group.label" class="gal-sec">
        <div class="gal-sec-hd">
          <button
            class="sec-chk"
            :class="{ on: allGroupSelected(group.ids) }"
            @click="toggleGroupSelect(group.ids)"
            :title="allGroupSelected(group.ids) ? 'Desmarcar todos' : 'Selecionar todos'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <span class="sec-dt">{{ group.label }}</span>
          <span class="sec-ct">· {{ group.files.length }} arquivo{{ group.files.length !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Grid mode -->
        <div v-if="viewMode === 'grid'" class="file-grid" :style="{ '--gs': ui.gridSize + 'px' }">
          <FileCard
            v-for="file in group.files"
            :key="file.id"
            :file="file"
            :is-selected="assets.selected.has(file.id)"
            :show-trash="auth.isEditor"
            @click="openLightbox(file)"
            @select="assets.toggleSelect(file.id)"
            @preview="openLightbox(file)"
            @download="downloadFile(file)"
            @star="assets.toggleStar(file.id)"
            @trash="trashFile(file)"
          />
        </div>

        <!-- List mode -->
        <div v-else class="file-list">
          <div
            v-for="file in group.files"
            :key="file.id"
            class="list-row"
            :class="{ sel: assets.selected.has(file.id) }"
            @click="openLightbox(file)"
          >
            <button class="list-chk" :class="{ on: assets.selected.has(file.id) }" @click.stop="assets.toggleSelect(file.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <div class="list-ico" :style="{ background: getFileFt(file).bg }">
              <span v-html="getFileFt(file).icon"></span>
            </div>
            <div class="list-name">
              <div class="list-fname">{{ file.name }}</div>
              <div class="list-fmeta">{{ file.campaign || '—' }} · {{ file.size }}</div>
            </div>
            <span class="list-date">{{ formatDate(file.date) }}</span>
            <div class="list-acts" @click.stop>
              <button class="fc-act-sm" @click="openLightbox(file)" title="Visualizar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="fc-act-sm" @click="downloadFile(file)" title="Download">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Pagination
        v-if="assets.meta.total_pages > 1"
        :page="assets.meta.page"
        :total-pages="assets.meta.total_pages"
        :total-items="assets.meta.total_matches"
        :loading="assets.loading"
        @change="changePage"
      />
      <div v-else class="pg-single">
        {{ assets.meta.total_matches.toLocaleString('pt-BR') }} arquivo{{ assets.meta.total_matches !== 1 ? 's' : '' }} no total
      </div>
    </template>
  </div>

  <!-- Lightbox -->
  <FileLightbox
    :file="lightboxFile"
    @close="closeLightbox"
    @prev="navLightbox(-1)"
    @next="navLightbox(1)"
    @download="downloadFile"
  />

  <!-- Floating bar -->
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAssetsStore } from '@/stores/assets'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useFileType, getFileType } from '@/composables/useFileType'
import { useZipDownload } from '@/composables/useZipDownload'
import FilterBar from '@/components/gallery/FilterBar.vue'
import FileCard from '@/components/gallery/FileCard.vue'
import FileLightbox from '@/components/gallery/FileLightbox.vue'
import FloatingActionBar from '@/components/gallery/FloatingActionBar.vue'
import AddToCollectionModal from '@/components/gallery/AddToCollectionModal.vue'
import LinkToCampaignModal from '@/components/gallery/LinkToCampaignModal.vue'
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { ICONS } from '@/lib/icons'

defineProps({ viewMode: { type: String, default: 'grid' } })

const assets = useAssetsStore()
const ui = useUiStore()
const auth = useAuthStore()
const toast = useToastStore()
const { downloadAsZip } = useZipDownload()
const contentEl = ref(null)
const lightboxFile = ref(null)
const lightboxIdx = ref(0)
const showCollectionPicker = ref(false)
const showCampaignPicker = ref(false)

// Group by month
const groupedFiles = computed(() => {
  const order = [], map = {}
  assets.filtered.forEach(f => {
    const d = f.date ? new Date(f.date) : null
    const valid = d && !isNaN(d.getTime())
    const key = valid ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : 'sem-data'
    const lbl = valid ? d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()) : 'Sem data'
    if (!map[key]) { map[key] = { label: lbl, files: [], ids: [] }; order.push(key) }
    map[key].files.push(f)
    map[key].ids.push(f.id)
  })
  return order.map(k => map[k])
})

function getFileFt(file) { return useFileType(file.type || getFileType(file.name)) }

function formatDate(d) {
  if (!d) return ''
  return new Date(d.includes('T') ? d : d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function allGroupSelected(ids) { return ids.length > 0 && ids.every(id => assets.selected.has(id)) }
function toggleGroupSelect(ids) {
  if (allGroupSelected(ids)) ids.forEach(id => assets.selected.delete(id))
  else ids.forEach(id => assets.selected.add(id))
  assets.selected = new Set(assets.selected)
}

function openLightbox(file) {
  lightboxFile.value = file
  lightboxIdx.value = assets.filtered.findIndex(f => f.id === file.id)
}
function closeLightbox() { lightboxFile.value = null }
function navLightbox(dir) {
  const list = assets.filtered
  lightboxIdx.value = (lightboxIdx.value + dir + list.length) % list.length
  lightboxFile.value = list[lightboxIdx.value]
}

function setFilter(type) { assets.currentFilter = type }
function clearFilters() { assets.currentFilter = 'todos'; assets.searchQuery = '' }

function downloadFile(file) {
  const a = document.createElement('a')
  a.href = file.download_link
  a.download = file.name
  a.click()
}

function bulkDownload() { downloadAsZip(assets.selectedList) }

function trashFile(file) {
  assets.moveToTrash(file.id)
  toast.success('Arquivo movido para a lixeira.')
  if (lightboxFile.value?.id === file.id) closeLightbox()
}

function bulkTrash() {
  const ids = [...assets.selected]
  ids.forEach(id => assets.moveToTrash(id))
  toast.success(`${ids.length} arquivo(s) movido(s) para a lixeira.`)
  assets.clearSelection()
}

async function changePage(n) {
  await assets.goToPage(n)
  assets.clearSelection()
  // sem isso o usuário cai no meio da página nova, já rolado
  if (contentEl.value) contentEl.value.scrollTop = 0
}

// Keyboard nav
function onKey(e) {
  if (lightboxFile.value) {
    if (e.key === 'ArrowLeft') navLightbox(-1)
    if (e.key === 'ArrowRight') navLightbox(1)
    if (e.key === 'Escape') closeLightbox()
    return
  }
  if (e.key === 'Delete' && assets.selected.size > 0) {
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (confirm(`Mover ${assets.selected.size} arquivo(s) selecionado(s) para a lixeira?`)) bulkTrash()
  }
}

// Re-fetch when searchQuery changes (debounced via watcher)
let debounce = null
watch(() => assets.searchQuery, (q) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => {
    assets.fetchAssets({ query: q, reset: true })
  }, 300)
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (!assets.items.length) {
    assets.fetchAssets({ reset: true })
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 22px 20px; }

.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--muted);
}
.spinner {
  width: 32px; height: 32px; border: 3px solid var(--border);
  border-top-color: var(--accent); border-radius: 50%;
  animation: spin .8s linear infinite; margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-ico { font-size: 48px; margin-bottom: 12px; }
.empty-ico :deep(svg) { width: 1em; height: 1em; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 14px; margin-top: 4px; }

.gal-sec { margin-bottom: 26px; }
.gal-sec-hd {
  display: flex; align-items: center; gap: 10px; padding: 6px 0;
  position: sticky; top: -22px; background: var(--bg); z-index: 5; margin-bottom: 8px;
}
.sec-chk {
  width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--border);
  cursor: pointer; background: none; opacity: 0; transition: opacity .12s;
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
}
.gal-sec-hd:hover .sec-chk { opacity: 1; }
.sec-chk.on { opacity: 1; background: var(--accent); border-color: var(--accent); }
.sec-chk svg { width: 10px; height: 10px; color: #fff; }
.sec-dt { font-family: Montserrat, system-ui, sans-serif; font-size: 16px; font-weight: 700; letter-spacing: -.3px; text-transform: capitalize; color: var(--heading); }
.sec-ct { font-size: 12px; color: var(--faint); }

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--gs, 200px), 1fr));
  gap: 12px;
}

/* List view */
.file-list { display: flex; flex-direction: column; gap: 1px; }
.list-row {
  display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 10px;
  cursor: pointer; transition: background .1s; border: 1px solid transparent;
}
.list-row:hover { background: var(--elevated); }
.list-row.sel { background: rgba(255,107,0,.05); border-color: rgba(255,107,0,.2); }
.list-chk {
  width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--border);
  flex-shrink: 0; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .12s;
}
.list-chk.on { background: var(--accent); border-color: var(--accent); }
.list-chk svg { width: 9px; height: 9px; color: #fff; }
.list-ico {
  width: 38px; height: 38px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.list-ico span { width: 20px; height: 20px; color: rgba(255,255,255,.8); }
.list-ico :deep(svg) { width: 100%; height: 100%; }
.list-name { flex: 1; min-width: 0; }
.list-fname { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
.list-fmeta { font-size: 11px; color: var(--faint); margin-top: 1px; }
.list-date { font-size: 12px; color: var(--faint); white-space: nowrap; font-variant-numeric: tabular-nums; }
.list-acts { display: flex; gap: 4px; opacity: 0; transition: opacity .12s; }
.list-row:hover .list-acts { opacity: 1; }
.fc-act-sm {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border);
  background: var(--card); color: var(--muted); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .12s;
}
.fc-act-sm:hover { border-color: var(--accent); color: var(--accent); }
.fc-act-sm svg { width: 13px; height: 13px; }

/* Rodapé quando tudo cabe numa página só */
.pg-single {
  display: flex; justify-content: center; padding: 24px 0 8px;
  font-size: 12px; color: var(--faint);
}
</style>

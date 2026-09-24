import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import api from '@/api/client'
import { extsForType } from '@/composables/useFileType'

export const EXT_TO_TYPE = {
  jpg:'img', jpeg:'img', png:'img', gif:'img', webp:'img',
  svg:'img', bmp:'img', avif:'img', tiff:'img', tif:'img',
  heic:'img', heif:'img', raw:'img', cr2:'img', nef:'img',
  mp4:'vid', webm:'vid', mov:'vid', avi:'vid', mkv:'vid',
  wmv:'vid', flv:'vid', m4v:'vid', ogv:'vid', '3gp':'vid',
  pdf:'pdf',
  xls:'xls', xlsx:'xls', ods:'xls', csv:'xls',
  ppt:'ppt', pptx:'ppt', odp:'ppt', key:'ppt',
  doc:'doc', docx:'doc', odt:'doc', txt:'doc', rtf:'doc', md:'doc',
  mp3:'aud', wav:'aud', ogg:'aud', m4a:'aud', aac:'aud',
  flac:'aud', opus:'aud', wma:'aud',
}

export function normalizeDate(d) {
  if (!d) return ''
  // "2026-03-31 10:45" → "2026-03-31T10:45:00"
  return d.replace(' ', 'T').replace(/T(\d{2}:\d{2})$/, 'T$1:00')
}

export function formatSize(mb) {
  if (!mb && mb !== 0) return ''
  if (mb < 0.001) return '< 1 KB'
  if (mb < 1) return `${Math.round(mb * 1024)} KB`
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

export function mapItem(r, starredSet) {
  const ext = (r.ext || '').toLowerCase().replace(/^\./, '')
  const type = EXT_TO_TYPE[ext] || 'unk'
  const id = String(r.id)
  return {
    id,
    name: r.filename,
    type,
    ext: ext.toUpperCase(),
    rel_path: r.rel_path,
    size: formatSize(r.size_mb),
    sizeMb: r.size_mb ?? null,
    date: normalizeDate(r.modified_at || r.created_at || ''),
    campaign: r.campaign || '',
    tags: r.tags || [],
    title: r.title || '',
    description: r.description || '',
    is_official: !!r.is_official,
    preview_link: r.preview_link || `/files/${encodeURIComponent(r.rel_path)}`,
    download_link: r.download_link || `/download?path=${encodeURIComponent(r.rel_path)}`,
    // imagem se exibe direto; vídeo usa o JPEG do 1º quadro gerado no backend
    thumbnail: type === 'img'
      ? (r.preview_link || `/files/${encodeURIComponent(r.rel_path)}`)
      : (type === 'vid' ? (r.thumbnail_link || null) : null),
    starred: starredSet.has(id),
    contentHash: r.content_hash || null,
  }
}

export const useAssetsStore = defineStore('assets', () => {
  const items = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref(null)
  const selected = ref(new Set())
  const currentFilter = ref('todos')
  const searchQuery = ref('')
  const lightboxId = ref(null)
  const meta = ref({ total_matches: 0, total_pages: 0, page: 1, page_size: 50 })

  const starredIds = ref(new Set(JSON.parse(localStorage.getItem('noxis_starred') || '[]')))
  const campaignMeta = ref(JSON.parse(localStorage.getItem('noxis_campaign_meta') || '{}'))
  const collections = ref(JSON.parse(localStorage.getItem('noxis_collections') || '[]'))
  // trash: { [fileId]: deletedAtISOString } — soft-delete only, backend has no delete endpoint
  const trash = ref(JSON.parse(localStorage.getItem('noxis_trash') || '{}'))
  // hidden: ids the user chose to permanently remove — hidden from the main gallery forever
  const hiddenIds = ref(new Set(JSON.parse(localStorage.getItem('noxis_hidden') || '[]')))

  const campaignFilter = ref('')
  const dateFromFilter = ref('')
  const dateToFilter = ref('')

  function applyCampaignDateFilter(list) {
    if (campaignFilter.value) list = list.filter(f => f.campaign === campaignFilter.value)
    if (dateFromFilter.value) list = list.filter(f => f.date && f.date.slice(0, 10) >= dateFromFilter.value)
    if (dateToFilter.value) list = list.filter(f => f.date && f.date.slice(0, 10) <= dateToFilter.value)
    return list
  }

  const visibleItems = computed(() => items.value.filter(f => !(f.id in trash.value) && !hiddenIds.value.has(f.id)))

  // tipo/campanha/data ja vem filtrados do backend (ver fetchAssets); aqui so
  // resta esconder lixeira/ocultos, que sao estado local do navegador.
  const filtered = computed(() => visibleItems.value)

  // Campanhas derivadas ao vivo dos arquivos + campanhas vazias criadas manualmente (campaignMeta)
  const campaignsList = computed(() => {
    const map = {}
    items.value.forEach(f => {
      if (!f.campaign) return
      if (!map[f.campaign]) map[f.campaign] = { id: f.campaign, name: f.campaign, count: 0 }
      map[f.campaign].count++
    })
    Object.keys(campaignMeta.value).forEach(name => {
      if (!map[name]) map[name] = { id: name, name, count: 0 }
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  })

  const selectedList = computed(() => items.value.filter(f => selected.value.has(f.id)))
  const hasMore = computed(() => meta.value.page < meta.value.total_pages)

  // Cancela o request anterior quando um novo começa — busca rápida (digitação, troca de
  // filtro) não deixa mais resposta antiga sobrescrever resultado mais novo fora de ordem.
  let activeController = null

  async function fetchAssets({ query = '', page = 1, reset = true } = {}) {
    activeController?.abort()
    const controller = new AbortController()
    activeController = controller

    if (reset) {
      loading.value = true
    } else {
      loadingMore.value = true
    }
    error.value = null
    try {
      // Os filtros vao pro backend de proposito: a galeria e paginada, entao
      // filtrar no cliente so alcancaria os 50 itens da pagina atual — era por
      // isso que filtrar por 2023 na pagina 1 (so 2026) dizia "nenhum arquivo".
      const { data } = await api.get('/api/search', {
        params: {
          query: query || '',
          page,
          page_size: 50,
          order: 'recent',
          exts: extsForType(currentFilter.value),
          campaign: campaignFilter.value || '',
          date_from: dateFromFilter.value || '',
          date_to: dateToFilter.value || '',
        },
        signal: controller.signal,
      })
      const mapped = (data.results || []).map(r => mapItem(r, starredIds.value))
      if (reset) {
        items.value = mapped
      } else {
        items.value = [...items.value, ...mapped]
      }
      meta.value = { ...data.meta, page }
    } catch (e) {
      if (e.code === 'ERR_CANCELED' || e.name === 'CanceledError' || e.name === 'AbortError') {
        return // request superado por um mais novo — ignora silenciosamente
      }
      error.value = e.message
    } finally {
      if (activeController === controller) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  // Como os filtros agora sao resolvidos no backend, mudar um deles exige nova
  // busca — antes o `filtered` recomputava sozinho no cliente. Volta pra pagina
  // 1: ficar na pagina 500 de um filtro que rende 3 paginas nao faz sentido.
  watch(
    [currentFilter, campaignFilter, dateFromFilter, dateToFilter],
    () => { fetchAssets({ query: searchQuery.value, page: 1, reset: true }) }
  )

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    await fetchAssets({ query: searchQuery.value, page: meta.value.page + 1, reset: false })
  }

  /**
   * Troca de página substituindo os itens (não acumula como loadMore).
   * O acervo tem milhões de arquivos — acumular página após página no DOM
   * travava o navegador, por isso a galeria pagina em vez de rolar infinito.
   */
  async function goToPage(n) {
    const total = meta.value.total_pages || 1
    const target = Math.min(Math.max(1, Number(n) || 1), total)
    if (target === meta.value.page) return
    await fetchAssets({ query: searchQuery.value, page: target, reset: true })
  }

  function toggleStar(id) {
    const sid = String(id)
    const s = new Set(starredIds.value)
    if (s.has(sid)) s.delete(sid)
    else s.add(sid)
    starredIds.value = s
    localStorage.setItem('noxis_starred', JSON.stringify([...s]))
    const item = items.value.find(f => f.id === sid)
    if (item) item.starred = s.has(sid)
  }

  function toggleSelect(id) {
    const s = new Set(selected.value)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    selected.value = s
  }

  function upsertCampaignMeta(name, patch) {
    const meta = { ...campaignMeta.value, [name]: { ...campaignMeta.value[name], ...patch } }
    campaignMeta.value = meta
    localStorage.setItem('noxis_campaign_meta', JSON.stringify(meta))
  }

  function persistCollections() {
    localStorage.setItem('noxis_collections', JSON.stringify(collections.value))
  }

  function createCollection(name, color) {
    const c = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, color, fileIds: [], createdAt: new Date().toISOString() }
    collections.value = [c, ...collections.value]
    persistCollections()
    return c
  }

  function deleteCollection(id) {
    collections.value = collections.value.filter(c => c.id !== id)
    persistCollections()
  }

  function addFilesToCollection(id, fileIds) {
    collections.value = collections.value.map(c => {
      if (c.id !== id) return c
      return { ...c, fileIds: [...new Set([...c.fileIds, ...fileIds])] }
    })
    persistCollections()
  }

  function removeFileFromCollection(id, fileId) {
    collections.value = collections.value.map(c => {
      if (c.id !== id) return c
      return { ...c, fileIds: c.fileIds.filter(f => f !== fileId) }
    })
    persistCollections()
  }

  function moveToTrash(id) {
    trash.value = { ...trash.value, [id]: new Date().toISOString() }
    localStorage.setItem('noxis_trash', JSON.stringify(trash.value))
    const s = new Set(selected.value)
    s.delete(id)
    selected.value = s
  }

  function restoreFromTrash(id) {
    const t = { ...trash.value }
    delete t[id]
    trash.value = t
    localStorage.setItem('noxis_trash', JSON.stringify(t))
  }

  function permanentlyRemove(id) {
    restoreFromTrash(id)
    const h = new Set(hiddenIds.value)
    h.add(id)
    hiddenIds.value = h
    localStorage.setItem('noxis_hidden', JSON.stringify([...h]))
  }

  function emptyTrash() {
    Object.keys(trash.value).forEach(id => {
      hiddenIds.value.add(id)
    })
    hiddenIds.value = new Set(hiddenIds.value)
    localStorage.setItem('noxis_hidden', JSON.stringify([...hiddenIds.value]))
    trash.value = {}
    localStorage.setItem('noxis_trash', '{}')
  }

  function clearSelection() { selected.value = new Set() }
  function selectAll(ids) { selected.value = new Set(ids) }
  function openLightbox(id) { lightboxId.value = id }
  function closeLightbox() { lightboxId.value = null }

  return {
    items, loading, loadingMore, error, selected, currentFilter, searchQuery,
    campaignFilter, dateFromFilter, dateToFilter,
    meta, starredIds, campaignMeta, collections, trash, hiddenIds, filtered, visibleItems, campaignsList, selectedList, hasMore, lightboxId,
    fetchAssets, loadMore, goToPage, toggleStar, toggleSelect, clearSelection, selectAll,
    openLightbox, closeLightbox, upsertCampaignMeta, applyCampaignDateFilter,
    createCollection, deleteCollection, addFilesToCollection, removeFileFromCollection,
    moveToTrash, restoreFromTrash, permanentlyRemove, emptyTrash,
  }
})

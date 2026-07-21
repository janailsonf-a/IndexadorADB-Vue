<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import api from '../services/api'
import {
  Search,
  FileText,
  Image,
  FileSpreadsheet,
  Clock3,
  Eye,
  Download,
  Clipboard,
  Grid2X2,
  List,
  File,
  ChevronRight,
  X,
  FolderTree,
  Check,
  Pencil,
  Save,
  Plus,
  Trash2,
} from 'lucide-vue-next'

const authUser = computed(() => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Erro ao ler usuário do localStorage:', error)
    return null
  }
})

const isAdmin = computed(() => authUser.value?.role === 'admin')

const quickFilters = [
  { label: 'PDF', value: 'pdf', icon: FileText },
  { label: 'Planilhas', value: 'xlsx', icon: FileSpreadsheet },
  { label: 'Imagens', value: 'png', icon: Image },
  { label: 'Recentes', value: 'recent_clicks', icon: Clock3 },
]

const PREVIEWABLE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'pdf',
  'txt',
  'svg',
]

const query = ref('')
const order = ref('recent')
const page = ref(1)
const pageSize = ref(20)
const viewMode = ref('grid')

const selectedExt = ref('')
const activeQuickFilter = ref('')

const loading = ref(false)
const error = ref('')
const files = ref([])
const selectedId = ref(null)
const showDetailsModal = ref(false)
const copied = ref(false)

const showEditModal = ref(false)
const savingMetadata = ref(false)
const metadataError = ref('')
const metadataLoading = ref(false)

const metadataForm = ref({
  title: '',
  description: '',
  campaign: '',
  status: '',
  is_official: false,
  tagsText: '',
  metadataPairs: [],
})

const meta = ref({
  total_indexed: 0,
  total_matches: 0,
  query_ms: null,
  page: 1,
  total_pages: 0,
  page_size: 20,
  order: 'recent',
  pages_to_show: [],
})

let debounceTimer = null

const displayedFiles = computed(() => {
  if (activeQuickFilter.value === 'recent_clicks') {
    return sortFilesByRecentClicks(files.value)
  }

  return files.value
})

const selectedFile = computed(() => {
  return (
    displayedFiles.value.find((file) => file.id === selectedId.value) ??
    displayedFiles.value[0] ??
    null
  )
})

function shortenPath(path, max = 72) {
  if (!path || path.length <= max) return path
  const start = path.slice(0, Math.floor(max / 2) - 2)
  const end = path.slice(-(Math.floor(max / 2) - 3))
  return `${start}...${end}`
}

function formatTypeLabel(type) {
  if (!type) return 'Arquivo'
  return String(type).toUpperCase()
}

function statusLabel(status) {
  const map = {
    aprovado: 'Aprovado',
    em_revisao: 'Em revisão',
    rascunho: 'Rascunho',
    arquivado: 'Arquivado',
  }

  return map[status] || status || ''
}

function visibleTags(tags = [], limit = 3) {
  return tags.slice(0, limit)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text, term) {
  if (!text) return ''
  if (!term || term.trim().length < 1) return text

  const safeTerm = escapeRegExp(term.trim())
  const regex = new RegExp(`(${safeTerm})`, 'ig')

  return text.replace(
    regex,
    '<mark class="rounded px-1 py-0.5 bg-[var(--app-accent-bg)] text-[var(--app-accent-text)]">$1</mark>',
  )
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {}
  return metadata
}

function normalizeDisplayPath(path) {
  if (!path) return ''

  return String(path)
    .replace(/^\/?data\/indexados\//i, 'mnt-share/')
    .replace(/^data\/indexados\//i, 'mnt-share/')
    .replace(/^\/mnt\/share\//i, 'mnt-share/')
}

function normalizeFullDisplayPath(path) {
  if (!path) return ''

  return String(path)
    .replace(/^\/?data\/indexados\//i, 'mnt-share/')
    .replace(/^data\/indexados\//i, 'mnt-share/')
    .replace(/^\/mnt\/share\//i, 'mnt-share/')
}

function recentStorageKey() {
  const userId = authUser.value?.id || authUser.value?.email || 'guest'
  return `noxis_recent_clicks_${userId}`
}

function getRecentClicks() {
  try {
    const raw = localStorage.getItem(recentStorageKey())
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRecentClick(file) {
  if (!file?.id) return

  const current = getRecentClicks()
  const cleaned = current.filter((item) => String(item.id) !== String(file.id))

  cleaned.unshift({
    id: file.id,
    clickedAt: new Date().toISOString(),
  })

  localStorage.setItem(recentStorageKey(), JSON.stringify(cleaned.slice(0, 30)))
}

function sortFilesByRecentClicks(fileList) {
  const recent = getRecentClicks()

  if (!recent.length) return []

  const orderMap = new Map(recent.map((item, index) => [String(item.id), index]))

  return [...fileList]
    .filter((file) => orderMap.has(String(file.id)))
    .sort((a, b) => orderMap.get(String(a.id)) - orderMap.get(String(b.id)))
}

function normalizeFile(item, index) {
  const ext =
    item.ext ||
    item.extension ||
    (item.filename?.includes('.') ? item.filename.split('.').pop() : 'file')

  const metadata = normalizeMetadata(item.metadata)
  const rawPath = item.rel_path ?? ''
  const rawFullPath =
    item.full_path || item.fullPath || item.network_path || item.rel_path || ''

  return {
    id: item.id ?? `${rawPath}-${index}`,
    name: item.filename ?? 'Arquivo sem nome',
    title: item.title || '',
    displayName: item.title || item.filename || 'Arquivo sem nome',
    path: normalizeDisplayPath(rawPath),
    rawPath,
    fullPath: normalizeFullDisplayPath(rawFullPath),
    rawFullPath,
    size: item.size_mb != null ? `${item.size_mb} MB` : '--',
    updated: item.modified_at || '--',
    created: item.created_at || '--',
    type: String(ext || 'file').replace('.', '').toLowerCase(),
    area: item.area || rawPath?.split('/')?.[0] || 'Geral',
    description:
      item.description ||
      (rawPath ? `Arquivo localizado em ${normalizeDisplayPath(rawPath)}` : 'Arquivo indexado'),
    campaign: item.campaign || '',
    status: item.status || '',
    isOfficial: Boolean(item.is_official),
    tags: Array.isArray(item.tags) ? item.tags : [],
    metadata,
    previewLink: item.preview_link || item.previewLink || null,
    downloadLink:
      item.download_link ||
      item.downloadLink ||
      (rawPath ? `/download?path=${encodeURIComponent(rawPath)}` : null),
  }
}

function canPreview(file) {
  return PREVIEWABLE_EXTENSIONS.includes((file?.type || '').toLowerCase())
}

function isImage(file) {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(
    (file?.type || '').toLowerCase(),
  )
}

function buildEncodedPath(path) {
  if (!path) return ''
  return path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

function getImageUrl(file) {
  if (!file?.rawPath) return null
  return `http://192.168.0.162:9102/arquivos/${buildEncodedPath(file.rawPath)}`
}

function metadataEntries(file) {
  return Object.entries(file?.metadata || {})
}

async function fetchSearch() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get('/api/search', {
      params: {
        query: query.value,
        page: page.value,
        page_size: pageSize.value,
        order: order.value,
        ext: selectedExt.value,
      },
    })

    const data = response.data ?? {}

    files.value = (data.results || []).map(normalizeFile)
    meta.value = {
      ...meta.value,
      ...(data.meta || {}),
    }

    error.value = data.error || ''

    if (displayedFiles.value.length > 0) {
      const stillExists = displayedFiles.value.some((file) => file.id === selectedId.value)
      if (!stillExists) selectedId.value = displayedFiles.value[0].id
    } else {
      selectedId.value = null
      showDetailsModal.value = false
      showEditModal.value = false
    }
  } catch (err) {
    error.value = 'Não foi possível carregar os resultados da busca.'
    files.value = []
    selectedId.value = null
    showDetailsModal.value = false
    showEditModal.value = false
  } finally {
    loading.value = false
  }
}

function submitSearch() {
  page.value = 1
  fetchSearch()
}

function applyQuickFilter(value) {
  const isSame = activeQuickFilter.value === value
  activeQuickFilter.value = isSame ? '' : value

  if (value === 'recent_clicks') {
    selectedExt.value = ''
    page.value = 1

    if (isSame) {
      fetchSearch()
    }
    return
  }

  selectedExt.value = isSame ? '' : value
  page.value = 1
  fetchSearch()
}

function clearFilters() {
  activeQuickFilter.value = ''
  selectedExt.value = ''
  query.value = ''
  page.value = 1
  fetchSearch()
}

function openDetails(file) {
  if (!file) return
  saveRecentClick(file)
  selectedId.value = file.id
  showDetailsModal.value = true
}

function closeDetails() {
  showDetailsModal.value = false
}

function addMetadataPair() {
  metadataForm.value.metadataPairs.push({
    key: '',
    value: '',
  })
}

function removeMetadataPair(index) {
  metadataForm.value.metadataPairs.splice(index, 1)
}

async function openEditModal(file = selectedFile.value) {
  if (!file) return

  metadataError.value = ''
  metadataLoading.value = true

  metadataForm.value = {
    title: file.title || file.displayName || '',
    description: file.description || '',
    campaign: file.campaign || '',
    status: file.status || '',
    is_official: Boolean(file.isOfficial),
    tagsText: Array.isArray(file.tags) ? file.tags.join(', ') : '',
    metadataPairs: Object.entries(file.metadata || {}).map(([key, value]) => ({
      key,
      value: value ?? '',
    })),
  }

  showEditModal.value = true

  try {
    const response = await api.get(`/api/files/${file.id}/metadata`)
    const data = response.data || {}

    metadataForm.value = {
      title: data.title || file.title || file.displayName || '',
      description: data.description || file.description || '',
      campaign: data.campaign || file.campaign || '',
      status: data.status || file.status || '',
      is_official: Boolean(data.is_official),
      tagsText: Array.isArray(data.tags)
        ? data.tags.join(', ')
        : Array.isArray(file.tags)
          ? file.tags.join(', ')
          : '',
      metadataPairs: Object.entries(data.metadata || {}).map(([key, value]) => ({
        key,
        value: value ?? '',
      })),
    }
  } catch (err) {
    metadataError.value =
      'Não foi possível carregar os metadados completos. Você ainda pode editar e salvar manualmente.'
    console.error('Erro ao carregar metadados:', err)
  } finally {
    metadataLoading.value = false
  }
}

function closeEditModal() {
  showEditModal.value = false
  metadataError.value = ''
}

async function saveMetadata() {
  if (!selectedFile.value) return

  savingMetadata.value = true
  metadataError.value = ''

  try {
    const tags = metadataForm.value.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    const metadata = {}

    for (const pair of metadataForm.value.metadataPairs) {
      const key = String(pair.key || '').trim()
      const value = String(pair.value || '').trim()

      if (!key) continue
      metadata[key] = value
    }

    const payload = {
      title: metadataForm.value.title || null,
      description: metadataForm.value.description || null,
      campaign: metadataForm.value.campaign || null,
      status: metadataForm.value.status || null,
      is_official: Boolean(metadataForm.value.is_official),
      tags,
      metadata,
    }

    const response = await api.put(`/api/files/${selectedFile.value.id}/metadata`, payload)
    const updated = response.data || {}

    files.value = files.value.map((file) => {
      if (file.id !== selectedFile.value.id) return file

      return normalizeFile(
        {
          ...file,
          ...updated,
          title: updated.title ?? metadataForm.value.title,
          description: updated.description ?? metadataForm.value.description,
          campaign: updated.campaign ?? metadataForm.value.campaign,
          status: updated.status ?? metadataForm.value.status,
          tags: updated.tags ?? tags,
          metadata: updated.metadata ?? metadata,
          filename: file.name,
          rel_path: file.rawPath,
          full_path: file.rawFullPath,
          size_mb: file.size !== '--' ? parseFloat(String(file.size).replace(' MB', '')) : null,
          modified_at: file.updated,
          created_at: file.created,
          ext: file.type,
          is_official: updated.is_official ?? metadataForm.value.is_official,
        },
        0,
      )
    })

    closeEditModal()
  } catch (err) {
    metadataError.value = 'Não foi possível salvar os metadados.'
  } finally {
    savingMetadata.value = false
  }
}

async function copyPath(file = selectedFile.value) {
  if (!file?.fullPath) return

  try {
    await navigator.clipboard.writeText(file.fullPath)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch (err) {
    console.error('Erro ao copiar caminho:', err)
  }
}

async function openPreview(file = selectedFile.value) {
  if (!file?.rawPath) {
    error.value = 'Pré-visualização indisponível para este arquivo.'
    return
  }

  try {
    const response = await api.get('/preview', {
      params: {
        path: file.rawPath,
      },
      responseType: 'blob',
    })

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    })

    const blobUrl = window.URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 60000)
  } catch (err) {
    console.error('Erro ao abrir preview:', err)
    error.value = 'Não foi possível abrir a pré-visualização.'
  }
}

async function downloadFile(file = selectedFile.value) {
  if (!file?.rawPath) {
    error.value = 'Download indisponível para este arquivo.'
    return
  }

  try {
    const response = await api.get('/download', {
      params: {
        path: file.rawPath,
      },
      responseType: 'blob',
    })

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    })

    const blobUrl = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = file.name || 'arquivo'
    document.body.appendChild(link)
    link.click()
    link.remove()

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 60000)
  } catch (err) {
    console.error('Erro ao baixar arquivo:', err)
    error.value = 'Não foi possível baixar o arquivo.'
  }
}

function changePage(newPage) {
  const totalPages = meta.value.total_pages || 1
  if (newPage < 1 || newPage > totalPages) return
  page.value = newPage
  fetchSearch()
}

onMounted(() => {
  fetchSearch()
})

watch(order, () => {
  page.value = 1
  fetchSearch()
})

watch(query, () => {
  page.value = 1
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchSearch()
  }, 450)
})
</script>

<template>
  <AppLayout title="Arquivos">
    <div class="min-h-full">
      <section class="min-w-0">
        <div class="mb-6 flex flex-col gap-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div class="mb-2 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
                <span>Noxis</span>
                <ChevronRight class="h-4 w-4" />
                <span class="font-medium text-[var(--app-text-soft)]">Arquivos</span>
              </div>

              <h1 class="text-[34px] font-semibold tracking-[-0.04em] text-[var(--app-text)]">
                Arquivos
              </h1>

              <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                Encontre arquivos por nome, extensão, caminho, descrição, campanha ou tags.
              </p>
            </div>
          </div>

          <div
            class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]"
          >
            <div class="flex flex-col gap-4">
              <div class="relative">
                <Search
                  class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--app-text-subtle)]"
                />
                <input
                  v-model="query"
                  type="text"
                  placeholder="Buscar arquivos por nome, caminho, campanha ou tags..."
                  class="h-13 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] pl-12 pr-28 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-subtle)] focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)] focus:bg-[var(--app-surface-hover)]"
                  @keydown.enter="submitSearch"
                />
                <button
                  class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
                  @click="submitSearch"
                >
                  Buscar
                </button>
              </div>

              <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="item in quickFilters"
                    :key="item.label"
                    class="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition"
                    :class="
                      activeQuickFilter === item.value
                        ? 'border-[color:color-mix(in_srgb,var(--app-primary)_22%,transparent)] bg-[var(--app-accent-bg)] text-[var(--app-accent-text)]'
                        : 'border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]'
                    "
                    @click="applyQuickFilter(item.value)"
                  >
                    <component :is="item.icon" class="h-4 w-4" />
                    {{ item.label }}
                  </button>

                  <button
                    class="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2 text-sm text-[var(--app-text-muted)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    @click="clearFilters"
                  >
                    Limpar filtros
                  </button>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <select
                    v-model="order"
                    class="h-10 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 text-sm text-[var(--app-text-soft)] outline-none transition hover:bg-[var(--app-surface-hover)]"
                  >
                    <option value="recent" class="bg-[var(--app-surface-3)] text-[var(--app-text)]">
                      Mais recentes
                    </option>
                    <option
                      value="relevance"
                      class="bg-[var(--app-surface-3)] text-[var(--app-text)]"
                    >
                      Relevância
                    </option>
                    <option value="name_asc" class="bg-[var(--app-surface-3)] text-[var(--app-text)]">
                      Nome A-Z
                    </option>
                    <option
                      value="name_desc"
                      class="bg-[var(--app-surface-3)] text-[var(--app-text)]"
                    >
                      Nome Z-A
                    </option>
                    <option
                      value="size_desc"
                      class="bg-[var(--app-surface-3)] text-[var(--app-text)]"
                    >
                      Maior tamanho
                    </option>
                    <option value="type" class="bg-[var(--app-surface-3)] text-[var(--app-text)]">
                      Tipo
                    </option>
                  </select>

                  <div
                    class="flex items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface-3)] p-1"
                  >
                    <button
                      class="inline-flex h-8 w-8 items-center justify-center rounded-full transition"
                      :class="
                        viewMode === 'list'
                          ? 'bg-[var(--app-primary)] text-[var(--app-text)]'
                          : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
                      "
                      @click="viewMode = 'list'"
                    >
                      <List class="h-4 w-4" />
                    </button>

                    <button
                      class="inline-flex h-8 w-8 items-center justify-center rounded-full transition"
                      :class="
                        viewMode === 'grid'
                          ? 'bg-[var(--app-primary)] text-[var(--app-text)]'
                          : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]'
                      "
                      @click="viewMode = 'grid'"
                    >
                      <Grid2X2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-sm text-[var(--app-text-subtle)]"
          >
            <span>{{ meta.query_ms ?? '--' }} ms</span>
            <span>•</span>
            <span>Ordenação: {{ meta.order }}</span>
            <span>•</span>
            <span>
              Filtro:
              {{
                activeQuickFilter === 'recent_clicks'
                  ? 'recentes clicados'
                  : selectedExt || 'nenhum'
              }}
            </span>
            <span>•</span>
            <span>{{ displayedFiles.length }} itens exibidos</span>
          </div>
        </div>

        <div
          v-if="error"
          class="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {{ error }}
        </div>

        <div
          v-if="viewMode === 'list'"
          class="overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow)]"
        >
          <div
            class="hidden grid-cols-[minmax(420px,1.9fr)_90px_110px_140px_minmax(190px,0.8fr)] gap-5 border-b border-[var(--app-border)] bg-[var(--app-surface-2)] px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[var(--app-text-subtle)] xl:grid"
          >
            <div>Arquivo</div>
            <div>Tipo</div>
            <div>Tamanho</div>
            <div>Modificado</div>
            <div class="text-right">Ações</div>
          </div>

          <div v-if="loading" class="divide-y divide-white/6">
            <div v-for="n in 6" :key="n" class="animate-pulse px-5 py-4">
              <div
                class="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(420px,1.9fr)_90px_110px_140px_minmax(190px,0.8fr)] xl:items-center xl:gap-5"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 shrink-0 rounded-xl bg-[var(--app-surface-4)]"></div>
                    <div class="min-w-0 flex-1">
                      <div class="h-4 w-56 rounded bg-[var(--app-surface-hover)]"></div>
                      <div class="mt-2 h-3 w-72 rounded bg-[var(--app-surface-4)]"></div>
                    </div>
                  </div>
                </div>
                <div class="hidden xl:block">
                  <div class="h-6 w-14 rounded-md bg-[var(--app-accent-bg)]"></div>
                </div>
                <div class="hidden xl:block">
                  <div class="h-3 w-16 rounded bg-[var(--app-surface-4)]"></div>
                </div>
                <div class="hidden xl:block">
                  <div class="h-3 w-24 rounded bg-[var(--app-surface-4)]"></div>
                </div>
                <div class="flex gap-2 xl:justify-end">
                  <div class="h-9 w-9 rounded-lg bg-[var(--app-surface-hover)]"></div>
                  <div class="h-9 w-9 rounded-lg bg-[var(--app-surface-4)]"></div>
                  <div class="h-9 w-9 rounded-lg bg-[var(--app-surface-4)]"></div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="displayedFiles.length === 0"
            class="px-5 py-12 text-sm text-[var(--app-text-muted)]"
          >
            Nenhum arquivo encontrado.
          </div>

          <template v-else>
            <article
              v-for="file in displayedFiles"
              :key="file.id"
              class="cursor-pointer border-b border-[var(--app-border)] px-5 py-4 transition last:border-b-0 hover:bg-[var(--app-surface-2)]"
              @click="openDetails(file)"
            >
              <div
                class="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(420px,1.9fr)_90px_110px_140px_minmax(190px,0.8fr)] xl:items-center xl:gap-5"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-surface-4)] text-[var(--app-text-muted)]"
                    >
                      <File class="h-4 w-4" />
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <h3
                          class="truncate text-[15px] font-medium leading-5 text-[var(--app-text)]"
                          :title="file.displayName"
                          v-html="highlightText(file.displayName, query)"
                        ></h3>

                        <span
                          v-if="file.isOfficial"
                          class="inline-flex shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
                        >
                          Oficial
                        </span>
                      </div>

                      <p
                        class="mt-1 truncate text-[13px] leading-5 text-[var(--app-text-subtle)]"
                        :title="file.path"
                        v-html="highlightText(file.path, query)"
                      ></p>

                      <div
                        v-if="file.campaign || file.status || file.tags?.length"
                        class="mt-2 flex flex-wrap items-center gap-2"
                      ></div>
                    </div>
                  </div>
                </div>

                <div class="hidden xl:block">
                  <span
                    class="inline-flex rounded-md border border-[color:color-mix(in_srgb,var(--app-primary)_22%,transparent)] bg-[var(--app-accent-bg)] px-2 py-1 text-xs font-medium text-[var(--app-accent-text)]"
                  >
                    {{ formatTypeLabel(file.type) }}
                  </span>
                </div>

                <div class="hidden text-sm text-[var(--app-text-muted)] xl:block">
                  {{ file.size }}
                </div>

                <div class="hidden text-sm leading-5 text-[var(--app-text-muted)] xl:block">
                  {{ file.updated }}
                </div>

                <div class="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
                  <button
                    v-if="canPreview(file)"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--app-primary)] text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
                    title="Preview"
                    @click.stop="openPreview(file)"
                  >
                    <Eye class="h-4 w-4" />
                  </button>

                  <button
                    v-if="isAdmin"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    title="Editar metadados"
                    @click.stop="openEditModal(file)"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>

                  <button
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    title="Baixar"
                    @click.stop="downloadFile(file)"
                  >
                    <Download class="h-4 w-4" />
                  </button>

                  <button
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    title="Copiar caminho"
                    @click.stop="copyPath(file)"
                  >
                    <Clipboard class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          </template>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <template v-if="loading">
            <div
              v-for="n in 8"
              :key="n"
              class="animate-pulse rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)]"
            >
              <div class="mb-4 h-32 rounded-2xl bg-[var(--app-surface-4)]"></div>
              <div class="h-4 w-40 rounded bg-[var(--app-surface-hover)]"></div>
              <div class="mt-2 h-3 w-28 rounded bg-[var(--app-surface-4)]"></div>
              <div class="mt-4 flex items-center justify-between">
                <div class="h-3 w-16 rounded bg-[var(--app-surface-4)]"></div>
                <div class="h-5 w-14 rounded bg-[var(--app-accent-bg)]"></div>
              </div>
              <div class="mt-4 h-10 rounded-xl bg-[var(--app-surface-hover)]"></div>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <div class="h-10 rounded-xl bg-[var(--app-surface-4)]"></div>
                <div class="h-10 rounded-xl bg-[var(--app-surface-4)]"></div>
              </div>
            </div>
          </template>

          <template v-else-if="displayedFiles.length === 0">
            <div
              class="col-span-full rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-12 text-sm text-[var(--app-text-muted)] shadow-[var(--app-shadow)]"
            >
              Nenhum arquivo encontrado.
            </div>
          </template>

          <template v-else>
            <article
              v-for="file in displayedFiles"
              :key="file.id"
              class="cursor-pointer rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow)] transition hover:-translate-y-[1px] hover:bg-[var(--app-surface-2)] hover:shadow-[var(--app-shadow-strong)]"
              @click="openDetails(file)"
            >
              <div
                class="flex h-[320px] items-center justify-center overflow-hidden rounded-3xl bg-[var(--app-surface-3)]"
              >
                <img
                  v-if="isImage(file)"
                  :src="getImageUrl(file)"
                  class="h-full w-full object-contain"
                  loading="lazy"
                />
                <FileText v-else class="h-12 w-12 text-[var(--app-text-subtle)]" />
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3
                    class="truncate text-[15px] font-medium text-[var(--app-text)]"
                    :title="file.displayName"
                    v-html="highlightText(file.displayName, query)"
                  ></h3>

                  <span
                    v-if="file.isOfficial"
                    class="inline-flex shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
                  >
                    Oficial
                  </span>
                </div>

                <p
                  class="mt-1 truncate text-sm text-[var(--app-text-subtle)]"
                  :title="file.path"
                  v-html="highlightText(shortenPath(file.path, 52), query)"
                ></p>
              </div>

              <div class="mt-4 flex items-center justify-between text-sm text-[var(--app-text-subtle)]">
                <span>{{ file.size }}</span>
                <span class="font-medium text-[var(--app-accent-text)]">{{
                  formatTypeLabel(file.type)
                }}</span>
              </div>

              <div class="mt-4 grid gap-2">
                <button
                  v-if="canPreview(file)"
                  class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
                  @click.stop="openPreview(file)"
                >
                  <Eye class="h-4 w-4" />
                  Preview
                </button>

                <button
                  v-else
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-2.5 text-sm font-medium text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                  @click.stop="downloadFile(file)"
                >
                  <Download class="h-4 w-4" />
                  Baixar
                </button>

                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-if="isAdmin"
                    class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    @click.stop="openEditModal(file)"
                  >
                    <Pencil class="h-4 w-4" />
                    Editar
                  </button>

                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    @click.stop="downloadFile(file)"
                  >
                    <Download class="h-4 w-4" />
                    Baixar
                  </button>

                  <button
                    class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                    @click.stop="copyPath(file)"
                  >
                    <Clipboard class="h-4 w-4" />
                    Copiar
                  </button>
                </div>
              </div>
            </article>
          </template>
        </div>

        <div
          v-if="(meta.total_pages || 0) > 1"
          class="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.18)]"
        >
          <div class="text-sm text-[var(--app-text-muted)]">
            Página {{ meta.page || 1 }} de {{ meta.total_pages || 1 }}
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-2 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="(meta.page || 1) <= 1"
              @click="changePage((meta.page || 1) - 1)"
            >
              Anterior
            </button>

            <button
              v-for="p in meta.pages_to_show"
              :key="p"
              @click="changePage(p)"
              class="rounded-lg px-3 py-2 text-sm transition"
              :class="
                p === meta.page
                  ? 'bg-[var(--app-primary)] text-[var(--app-text)]'
                  : 'border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]'
              "
            >
              {{ p }}
            </button>

            <button
              class="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-2 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)] disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="(meta.page || 1) >= (meta.total_pages || 1)"
              @click="changePage((meta.page || 1) + 1)"
            >
              Próxima
            </button>
          </div>
        </div>
      </section>

      <teleport to="body">
        <div
          v-if="showDetailsModal"
          class="fixed inset-0 z-50 bg-[var(--app-overlay)] backdrop-blur-sm"
          @click.self="closeDetails"
        >
          <div class="flex min-h-screen items-center justify-center p-3 sm:p-5">
            <div
              class="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-strong)]"
            >
              <template v-if="selectedFile">
                <div
                  class="flex flex-col gap-3 border-b border-[var(--app-border)] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6"
                >
                  <div class="min-w-0">
                    <h2 class="text-lg font-semibold text-[var(--app-text)]">
                      Detalhes do arquivo
                    </h2>
                    <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                      Informações completas e ações rápidas.
                    </p>
                  </div>

                  <div class="flex shrink-0 items-center gap-2 self-start">
                    <button
                      v-if="isAdmin"
                      class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                      @click="openEditModal(selectedFile)"
                    >
                      <Pencil class="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                      @click="closeDetails"
                    >
                      <X class="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div class="flex-1 overflow-y-auto overflow-x-hidden">
                  <div class="grid gap-6 p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <aside class="min-w-0 space-y-4">
                      <div
                        class="overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-2)]"
                      >
                        <div
                          class="flex aspect-[4/5] items-center justify-center bg-[var(--app-surface-3)]"
                        >
                          <img
                            v-if="isImage(selectedFile)"
                            :src="getImageUrl(selectedFile)"
                            class="h-full w-full object-contain"
                            loading="lazy"
                          />
                          <FileText v-else class="h-12 w-12 text-[var(--app-text-subtle)]" />
                        </div>

                        <div class="space-y-3 p-4">
                          <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
                            <div
                              class="text-xs font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]"
                            >
                              Tipo
                            </div>
                            <div class="mt-1 text-sm font-medium text-[var(--app-text)]">
                              {{ formatTypeLabel(selectedFile.type) }}
                            </div>
                          </div>

                          <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
                            <div
                              class="text-xs font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]"
                            >
                              Tamanho
                            </div>
                            <div class="mt-1 text-sm font-medium text-[var(--app-text)]">
                              {{ selectedFile.size }}
                            </div>
                          </div>

                          <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
                            <div
                              class="text-xs font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]"
                            >
                              Última modificação
                            </div>
                            <div class="mt-1 text-sm font-medium text-[var(--app-text)]">
                              {{ selectedFile.updated }}
                            </div>
                          </div>

                          <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
                            <div
                              class="text-xs font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]"
                            >
                              Área
                            </div>
                            <div class="mt-1 text-sm font-medium text-[var(--app-text)]">
                              {{ selectedFile.area }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </aside>

                    <section class="min-w-0">
                      <div
                        class="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-5"
                      >
                        <div class="flex flex-wrap items-start gap-3">
                          <div class="min-w-0 flex-1">
                            <h3
                              class="break-words text-2xl font-semibold tracking-[-0.03em] text-[var(--app-text)]"
                              :title="selectedFile.displayName"
                              v-html="highlightText(selectedFile.displayName, query)"
                            ></h3>

                            <p
                              v-if="selectedFile.description"
                              class="mt-3 break-words text-sm leading-6 text-[var(--app-text-muted)]"
                              v-html="highlightText(selectedFile.description, query)"
                            ></p>
                          </div>

                          <span
                            v-if="selectedFile.isOfficial"
                            class="inline-flex shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/12 px-3 py-1 text-xs font-medium text-emerald-300"
                          >
                            Oficial
                          </span>
                        </div>

                        <div
                          v-if="
                            selectedFile.campaign ||
                            selectedFile.status ||
                            selectedFile.tags?.length
                          "
                          class="mt-4 flex flex-wrap items-center gap-2"
                        >
                          <span
                            v-if="selectedFile.campaign"
                            class="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-1 text-xs text-[var(--app-text-soft)]"
                          >
                            🎯 {{ selectedFile.campaign }}
                          </span>

                          <span
                            v-if="selectedFile.status"
                            class="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-1 text-xs text-[var(--app-text-soft)]"
                          >
                            {{ statusLabel(selectedFile.status) }}
                          </span>

                          <span
                            v-for="tag in selectedFile.tags"
                            :key="tag"
                            class="inline-flex rounded-full border border-[var(--app-border)] bg-[var(--app-surface-3)] px-3 py-1 text-xs text-[var(--app-text-muted)]"
                          >
                            #{{ tag }}
                          </span>
                        </div>
                      </div>

                      <div class="mt-4 grid gap-4">
                        <div
                          class="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-5"
                        >
                          <div
                            class="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]"
                          >
                            Localização no índice
                          </div>
                          <p class="break-all text-sm leading-6 text-[var(--app-text-muted)]">
                            {{ selectedFile.path }}
                          </p>
                        </div>

                        <div
                          class="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-5"
                        >
                          <div
                            class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]"
                          >
                            <FolderTree class="h-4 w-4" />
                            Caminho completo
                          </div>
                          <p
                            class="break-all text-sm leading-6 text-[var(--app-text-muted)]"
                            v-html="highlightText(selectedFile.fullPath, query)"
                          ></p>
                        </div>

                        <div
                          v-if="metadataEntries(selectedFile).length"
                          class="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-5"
                        >
                          <div
                            class="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--app-text-subtle)]"
                          >
                            Metadados adicionais
                          </div>

                          <div class="grid gap-3 sm:grid-cols-2">
                            <div
                              v-for="[key, value] in metadataEntries(selectedFile)"
                              :key="key"
                              class="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3"
                            >
                              <div
                                class="text-xs uppercase tracking-wide text-[var(--app-text-subtle)]"
                              >
                                {{ key }}
                              </div>
                              <div
                                class="mt-1 break-all text-sm leading-6 text-[var(--app-text-soft)]"
                              >
                                {{ value }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <div class="border-t border-[var(--app-border)] px-4 py-4 sm:px-6">
                  <div class="grid gap-2 sm:grid-cols-3">
                    <button
                      v-if="canPreview(selectedFile)"
                      class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-3 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
                      @click="openPreview(selectedFile)"
                    >
                      <Eye class="h-4 w-4" />
                      Abrir
                    </button>

                    <button
                      v-else
                      class="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-3 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)]"
                      @click="downloadFile(selectedFile)"
                    >
                      <Download class="h-4 w-4" />
                      Baixar
                    </button>

                    <button
                      class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                      @click="downloadFile(selectedFile)"
                    >
                      <Download class="h-4 w-4" />
                      Baixar
                    </button>

                    <button
                      class="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-4 py-3 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                      @click="copyPath(selectedFile)"
                    >
                      <component :is="copied ? Check : Clipboard" class="h-4 w-4" />
                      {{ copied ? 'Copiado' : 'Copiar caminho' }}
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </teleport>

      <teleport to="body">
        <div
          v-if="showEditModal"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--app-overlay)] p-4 backdrop-blur-sm"
          @click.self="closeEditModal"
        >
          <div
            class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-strong)]"
          >
            <div class="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
              <div class="min-w-0">
                <h2 class="text-lg font-semibold text-[var(--app-text)]">
                  Editar metadados
                </h2>
                <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                  Atualize as informações do arquivo selecionado.
                </p>
              </div>

              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                @click="closeEditModal"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-6">
              <div
                v-if="metadataError"
                class="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {{ metadataError }}
              </div>

              <div v-if="metadataLoading" class="text-sm text-[var(--app-text-muted)]">
                Carregando metadados...
              </div>

              <template v-else>
                <div class="grid gap-5">
                  <div
                    class="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-5"
                  >
                    <h3 class="text-sm font-semibold text-[var(--app-text)]">
                      Informações principais
                    </h3>

                    <div class="mt-4 grid gap-4">
                      <div>
                        <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                          Título
                        </label>
                        <input
                          v-model="metadataForm.title"
                          type="text"
                          class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                          placeholder="Título do arquivo"
                        />
                      </div>

                      <div>
                        <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                          Descrição
                        </label>
                        <textarea
                          v-model="metadataForm.description"
                          rows="4"
                          class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                          placeholder="Descreva o arquivo..."
                        ></textarea>
                      </div>

                      <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                            Campanha
                          </label>
                          <input
                            v-model="metadataForm.campaign"
                            type="text"
                            class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                            placeholder="Ex: Campanha Água 2026"
                          />
                        </div>

                        <div>
                          <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                            Status
                          </label>
                          <select
                            v-model="metadataForm.status"
                            class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                          >
                            <option value="">Selecione</option>
                            <option value="rascunho">Rascunho</option>
                            <option value="em_revisao">Em revisão</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="arquivado">Arquivado</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label class="mb-2 block text-sm font-medium text-[var(--app-text-soft)]">
                          Tags
                        </label>
                        <input
                          v-model="metadataForm.tagsText"
                          type="text"
                          class="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                          placeholder="Ex: noxis, campanha, banner"
                        />
                        <p class="mt-2 text-xs text-[var(--app-text-subtle)]">
                          Separe as tags por vírgula.
                        </p>
                      </div>

                      <label
                        class="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-3"
                      >
                        <input
                          v-model="metadataForm.is_official"
                          type="checkbox"
                          class="h-4 w-4 rounded border-[var(--app-border)]"
                        />
                        <span class="text-sm text-[var(--app-text-soft)]">
                          Marcar como arquivo oficial
                        </span>
                      </label>
                    </div>
                  </div>

                  <div
                    class="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-5"
                  >
                    <div
                      class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 class="text-sm font-semibold text-[var(--app-text)]">
                          Metadados adicionais
                        </h3>
                        <p class="mt-1 text-xs text-[var(--app-text-subtle)]">
                          Adicione quaisquer campos personalizados.
                        </p>
                      </div>

                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                        @click="addMetadataPair"
                      >
                        <Plus class="h-4 w-4" />
                        Adicionar campo
                      </button>
                    </div>

                    <div
                      v-if="metadataForm.metadataPairs.length === 0"
                      class="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-5 text-sm text-[var(--app-text-subtle)]"
                    >
                      Nenhum metadado adicional adicionado.
                    </div>

                    <div v-else class="space-y-3">
                      <div
                        v-for="(pair, index) in metadataForm.metadataPairs"
                        :key="index"
                        class="grid gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-3)] p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                      >
                        <input
                          v-model="pair.key"
                          type="text"
                          class="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                          placeholder="Chave (ex: author)"
                        />

                        <input
                          v-model="pair.value"
                          type="text"
                          class="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--app-primary)_40%,transparent)]"
                          placeholder="Valor"
                        />

                        <button
                          type="button"
                          class="inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300 transition hover:bg-red-500/15"
                          @click="removeMetadataPair(index)"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div class="flex items-center justify-end gap-3 border-t border-[var(--app-border)] px-6 py-4">
              <button
                type="button"
                class="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-3)] px-4 py-2.5 text-sm text-[var(--app-text-soft)] transition hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text)]"
                @click="closeEditModal"
              >
                Cancelar
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="savingMetadata || metadataLoading"
                @click="saveMetadata"
              >
                <Save class="h-4 w-4" />
                {{ savingMetadata ? 'Salvando...' : 'Salvar metadados' }}
              </button>
            </div>
          </div>
        </div>
      </teleport>
    </div>
  </AppLayout>
</template>
<template>
  <div class="view-content">
    <div class="page-hd">
      <div>
        <h2 class="page-title">Arquivos Duplicados</h2>
        <p class="page-sub">
          <strong class="reclaim">{{ formatGB(totalReclaimable) }}</strong> recuperáveis
          · {{ groups.length }} grupo{{ groups.length !== 1 ? 's' : '' }}
          · {{ totalFiles }} arquivos
          <span v-if="hiddenByFilter" class="page-sub-muted">
            ({{ hiddenByFilter }} grupo{{ hiddenByFilter !== 1 ? 's' : '' }} oculto{{ hiddenByFilter !== 1 ? 's' : '' }} pelo filtro)
          </span>
        </p>
      </div>
      <button class="btn-secondary" :disabled="loading" @click="rescan">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.61"/></svg>
        Escanear novamente
      </button>
    </div>

    <SkeletonGrid v-if="loading" />

    <template v-else>
      <!-- Controles: o acervo tem muito grupo pequeno; ordenar por espaço e
           filtrar por tamanho é o que traz o que vale a pena revisar pra cima -->
      <div class="dup-controls">
        <div class="ctl">
          <label class="ctl-lbl" for="dup-sort">Ordenar por</label>
          <select id="dup-sort" v-model="sortBy" class="ctl-sel">
            <option value="space">Espaço recuperável</option>
            <option value="count">Número de cópias</option>
            <option value="name">Nome do arquivo</option>
          </select>
        </div>
        <div class="ctl">
          <label class="ctl-lbl" for="dup-min">Tamanho mínimo</label>
          <select id="dup-min" v-model.number="minSizeMb" class="ctl-sel">
            <option :value="0">Todos</option>
            <option :value="1">Acima de 1 MB</option>
            <option :value="10">Acima de 10 MB</option>
            <option :value="100">Acima de 100 MB</option>
          </select>
        </div>
        <button class="ctl-link" @click="allExpanded ? collapseAll() : expandAll()">
          {{ allExpanded ? 'Recolher todos' : 'Expandir todos' }}
        </button>
      </div>

      <div v-if="!groups.length" class="empty-state">
        <div class="empty-ico" v-html="ICONS.checkCircle"></div>
        <h3>{{ rawGroups.length ? 'Nada acima desse tamanho' : 'Nenhuma duplicata encontrada' }}</h3>
        <p v-if="rawGroups.length">Diminua o filtro de tamanho mínimo para ver os grupos menores.</p>
        <p v-else>Nenhum arquivo com o mesmo conteúdo (hash) no acervo.</p>
      </div>

      <div v-else class="dup-list">
        <div v-for="group in groups" :key="group.id" class="dup-row" :class="{ open: group.expanded }">
          <!-- Linha compacta: um grupo ocupa uma linha até ser aberto -->
          <button class="dup-summary" :aria-expanded="group.expanded" @click="toggleExpand(group)">
            <span class="dup-chevron" :class="{ open: group.expanded }" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </span>

            <span class="dup-thumb" :style="{ background: typeGrad(group.type) }">
              <img v-if="group.thumb" :src="group.thumb" alt="" class="dup-thumb-img" loading="lazy" @error="group.thumb = null">
              <span v-else class="dup-thumb-ico" v-html="typeIcon(group.type)"></span>
            </span>

            <span class="dup-main">
              <span class="dup-name" :title="group.name">{{ group.name }}</span>
              <span class="dup-sub">
                {{ group.copies }} cópias · {{ group.sizeLabel }} cada
                <span class="dup-sep">·</span>
                <span class="dup-path" :title="group.commonPath">{{ group.commonPath || '/' }}</span>
              </span>
            </span>

            <span class="dup-gain">
              <span class="dup-gain-val">{{ formatMB(group.reclaimable) }}</span>
              <span class="dup-gain-lbl">recuperáveis</span>
            </span>
          </button>

          <!-- Aberto: as copias lado a lado, com previa — o hash garante que o
               conteudo e igual, mas quem vai apagar precisa ver o que e -->
          <div v-if="group.expanded" class="dup-detail">
            <div class="dup-context">
              <span class="dup-identical">
                <span class="dup-identical-ico" v-html="ICONS.check"></span>
                Conteúdo idêntico — mesmo hash SHA-256
              </span>
              <span v-if="group.commonPath" class="dup-common">
                em <code class="dup-common-path">{{ group.commonPath }}/</code>
              </span>
            </div>

            <div class="dup-compare">
              <div v-for="(f, i) in group.files" :key="f.id" class="dup-copy">
                <button class="dup-copy-prev" :style="{ background: typeGrad(f.type) }"
                        :title="`Abrir ${f.name}`" @click="openPreview(f)">
                  <img v-if="f.thumbnail" :src="f.thumbnail" alt="" class="dup-copy-img" loading="lazy">
                  <span v-else class="dup-copy-ico" v-html="typeIcon(f.type)"></span>
                  <span class="dup-copy-zoom" v-html="ICONS.search"></span>
                </button>

                <div class="dup-copy-body">
                  <div class="dup-copy-tag">Cópia {{ i + 1 }}</div>
                  <div class="dup-copy-path" :title="f.rel_path">
                    <span v-if="group.commonPath" class="dup-copy-dim">…/</span><span class="dup-copy-diff">{{ f.diffPath }}</span>
                  </div>
                  <div class="dup-copy-meta">{{ formatDate(f.date) }} · {{ f.size }}</div>
                </div>

                <div class="dup-copy-acts">
                  <button class="dup-keep" :disabled="busy" @click="keepThis(group, f)">Manter só esta</button>
                  <button class="dup-rm" :disabled="busy" @click="removeThis(f)">Remover</button>
                </div>
              </div>
            </div>

            <div class="dup-bulk">
              <button class="dup-act" :disabled="busy" @click="keepShortest(group)">
                <span class="dup-act-ico" v-html="ICONS.check"></span>
                Manter o de caminho mais curto
              </button>
              <button class="dup-act" :disabled="busy" @click="keepNewest(group)">Manter o mais recente</button>
              <button class="dup-act" :disabled="busy" @click="keepOldest(group)">Manter o mais antigo</button>
            </div>
          </div>
        </div>
      </div>

      <p class="scan-note">
        Comparação por <strong>hash de conteúdo (SHA-256)</strong> no backend — cobre o acervo inteiro.
        Arquivos vazios são ignorados, e os do servidor de mídias (somente leitura) não entram nessa
        comparação. Remover move para a lixeira; revise antes.
      </p>
    </template>
  </div>

  <FileLightbox :file="previewFile" @close="previewFile = null" @download="downloadFile" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAssetsStore, mapItem } from '@/stores/assets'
import { useToastStore } from '@/stores/toast'
import { useFileType } from '@/composables/useFileType'
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue'
import FileLightbox from '@/components/gallery/FileLightbox.vue'
import api from '@/api/client'
import { ICONS } from '@/lib/icons'

const assets = useAssetsStore()
const toast = useToastStore()
const busy = ref(false)
const loading = ref(false)
const rawGroups = ref([])
const expandedOverrides = ref({})
const previewFile = ref(null)
const sortBy = ref('space')
const minSizeMb = ref(0)

async function loadDuplicates() {
  loading.value = true
  try {
    const { data } = await api.get('/api/duplicates', { params: { limit_groups: 1000 } })
    rawGroups.value = data.groups || []
  } catch {
    rawGroups.value = []
    toast.error('Erro ao buscar duplicatas.')
  } finally {
    loading.value = false
  }
}

onMounted(loadDuplicates)

/**
 * Prefixo de pasta compartilhado por todas as cópias. As duplicatas do acervo
 * quase sempre são o mesmo arquivo em duas pastas próximas — mostrar o trecho
 * em comum uma vez só e destacar o que difere é o que deixa a escolha óbvia.
 */
function commonPrefix(paths) {
  if (paths.length < 2) return ''
  const parts = paths.map(p => p.split('/').slice(0, -1))
  const first = parts[0]
  let i = 0
  while (i < first.length && parts.every(p => p[i] === first[i])) i++
  return first.slice(0, i).join('/')
}

const allGroups = computed(() =>
  rawGroups.value
    .map(g => {
      const files = g.files
        .map(r => mapItem(r, assets.starredIds))
        .filter(f => !(f.id in assets.trash) && !assets.hiddenIds.has(f.id))
      if (files.length < 2) return null

      const paths = files.map(f => f.rel_path || '')
      const common = commonPrefix(paths)
      const sizeMb = files[0].sizeMb || 0

      return {
        id: g.content_hash,
        name: files[0].name,
        type: files[0].type,
        thumb: files[0].thumbnail,
        copies: files.length,
        sizeMb,
        sizeLabel: files[0].size,
        reclaimable: sizeMb * (files.length - 1),
        commonPath: common,
        files: files.map(f => ({
          ...f,
          // o que sobra do caminho depois de tirar a pasta em comum
          diffPath: common ? (f.rel_path || '').slice(common.length + 1) : (f.rel_path || ''),
        })),
      }
    })
    .filter(Boolean)
)

const groups = computed(() => {
  const list = allGroups.value.filter(g => g.sizeMb >= minSizeMb.value)
  const sorted = [...list].sort((a, b) => {
    if (sortBy.value === 'count') return b.copies - a.copies
    if (sortBy.value === 'name') return a.name.localeCompare(b.name, 'pt-BR')
    return b.reclaimable - a.reclaimable
  })
  // colapsado por padrão: 187 grupos abertos de uma vez é o que tornava a tela
  // impossível de percorrer
  return sorted.map(g => ({ ...g, expanded: expandedOverrides.value[g.id] ?? false }))
})

const totalFiles = computed(() => groups.value.reduce((s, g) => s + g.copies, 0))
const totalReclaimable = computed(() => groups.value.reduce((s, g) => s + g.reclaimable, 0))
const hiddenByFilter = computed(() => allGroups.value.length - groups.value.length)
const allExpanded = computed(() => groups.value.length > 0 && groups.value.every(g => g.expanded))

function toggleExpand(group) {
  expandedOverrides.value = { ...expandedOverrides.value, [group.id]: !group.expanded }
}
function expandAll() {
  const m = { ...expandedOverrides.value }
  groups.value.forEach(g => { m[g.id] = true })
  expandedOverrides.value = m
}
function collapseAll() {
  const m = { ...expandedOverrides.value }
  groups.value.forEach(g => { m[g.id] = false })
  expandedOverrides.value = m
}

function typeGrad(type) { return useFileType(type).bg }
function typeIcon(type) { return useFileType(type).icon }

function formatMB(mb) {
  if (!mb) return '0 MB'
  if (mb < 1) return `${Math.round(mb * 1024)} KB`
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}
function formatGB(mb) { return formatMB(mb) }

function formatDate(d) {
  if (!d) return 'Sem data'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? 'Sem data' : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function trashMany(ids, message) {
  busy.value = true
  ids.forEach(id => assets.moveToTrash(id))
  toast.success(message)
  busy.value = false
}

function keepOnly(group, keepId) {
  const rest = group.files.filter(f => f.id !== keepId).map(f => f.id)
  if (!rest.length) return
  trashMany(rest, `${rest.length} cópia(s) movida(s) para a lixeira.`)
}

function keepThis(group, file) { keepOnly(group, file.id) }

function keepNewest(group) {
  const s = [...group.files].sort((a, b) => new Date(b.date) - new Date(a.date))
  keepOnly(group, s[0].id)
}
function keepOldest(group) {
  const s = [...group.files].sort((a, b) => new Date(a.date) - new Date(b.date))
  keepOnly(group, s[0].id)
}
/** Caminho mais curto costuma ser o original; as cópias vivem em subpasta. */
function keepShortest(group) {
  const s = [...group.files].sort((a, b) => (a.rel_path || '').length - (b.rel_path || '').length)
  keepOnly(group, s[0].id)
}

function removeThis(file) {
  trashMany([file.id], 'Arquivo movido para a lixeira.')
}

function openPreview(f) { previewFile.value = f }

function downloadFile(f) {
  const a = document.createElement('a')
  a.href = f.download_link
  a.download = f.name
  a.click()
}

function rescan() { loadDuplicates() }
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 24px; }
.page-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; gap: 16px; flex-wrap: wrap; }
.page-title { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); margin: 0; }
.page-sub { font-size: 13px; color: var(--muted); margin: 4px 0 0; }
.reclaim { color: var(--accent); font-size: 15px; font-weight: 800; font-family: Montserrat, system-ui, sans-serif; }
.page-sub-muted { color: var(--faint); }
.btn-secondary { display: flex; align-items: center; gap: 6px; }
.btn-secondary svg { width: 14px; height: 14px; }
.btn-secondary:disabled { opacity: .5; cursor: default; }

/* Controles */
.dup-controls { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
.ctl { display: flex; flex-direction: column; gap: 4px; }
.ctl-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--faint); }
.ctl-sel {
  height: 32px; padding: 0 10px; border-radius: 8px; font-size: 13px; font-family: inherit;
  border: 1.5px solid var(--border); background: var(--card); color: var(--text); outline: none; cursor: pointer;
}
.ctl-sel:focus { border-color: var(--accent); }
.ctl-link {
  background: none; border: none; color: var(--muted); font-size: 12.5px; font-family: inherit;
  cursor: pointer; text-decoration: underline; padding: 0 0 8px;
}
.ctl-link:hover { color: var(--accent); }

/* Lista compacta */
.dup-list { display: flex; flex-direction: column; gap: 8px; }
.dup-row { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.dup-row.open { border-color: var(--accent); }

.dup-summary {
  display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 14px;
  background: none; border: none; cursor: pointer; text-align: left; font-family: inherit;
}
.dup-summary:hover { background: var(--elevated); }
.dup-chevron { color: var(--faint); display: flex; flex-shrink: 0; transition: transform .15s; }
.dup-chevron.open { transform: rotate(90deg); }
.dup-chevron svg { width: 14px; height: 14px; }

.dup-thumb {
  width: 44px; height: 44px; border-radius: 8px; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.dup-thumb-img { width: 100%; height: 100%; object-fit: cover; }
.dup-thumb-ico { width: 40%; height: 40%; color: rgba(255,255,255,.85); }
.dup-thumb-ico :deep(svg) { width: 100%; height: 100%; }

.dup-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dup-name { font-size: 13.5px; font-weight: 600; color: var(--heading); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dup-sub { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 6px; min-width: 0; }
.dup-sep { color: var(--faint); }
.dup-path { color: var(--faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; direction: rtl; text-align: left; }

.dup-gain { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.dup-gain-val { font-size: 14px; font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; font-family: Montserrat, system-ui, sans-serif; }
.dup-gain-lbl { font-size: 10.5px; color: var(--faint); }

/* Detalhe: comparacao lado a lado */
.dup-detail { border-top: 1px solid var(--border-sub); padding: 14px; background: var(--elevated); }

.dup-context { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; font-size: 12px; }
.dup-identical { display: inline-flex; align-items: center; gap: 5px; color: #16a34a; font-weight: 600; }
.dup-identical-ico :deep(svg) { width: 13px; height: 13px; }
.dup-common { color: var(--faint); min-width: 0; }
.dup-common-path { font-size: 11.5px; color: var(--muted); word-break: break-all; }

.dup-compare {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}
.dup-copy {
  display: flex; flex-direction: column;
  background: var(--card); border: 1.5px solid var(--border); border-radius: 10px; overflow: hidden;
}
.dup-copy-prev {
  position: relative; aspect-ratio: 4/3; width: 100%; border: none; padding: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.dup-copy-img { width: 100%; height: 100%; object-fit: cover; }
.dup-copy-ico { width: 34%; height: 34%; color: rgba(255,255,255,.85); }
.dup-copy-ico :deep(svg) { width: 100%; height: 100%; }
.dup-copy-zoom {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.45); color: #fff; opacity: 0; transition: opacity .15s;
}
.dup-copy-zoom :deep(svg) { width: 26px; height: 26px; }
.dup-copy-prev:hover .dup-copy-zoom, .dup-copy-prev:focus-visible .dup-copy-zoom { opacity: 1; }

.dup-copy-body { padding: 9px 11px; display: flex; flex-direction: column; gap: 3px; flex: 1; }
.dup-copy-tag {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--faint);
}
.dup-copy-path { font-size: 12px; line-height: 1.4; word-break: break-all; }
.dup-copy-dim { color: var(--faint); }
.dup-copy-diff { color: var(--heading); font-weight: 600; }
.dup-copy-meta { font-size: 11.5px; color: var(--muted); margin-top: 2px; }

.dup-copy-acts { display: flex; gap: 6px; padding: 0 11px 11px; }
.dup-copy-acts .dup-keep, .dup-copy-acts .dup-rm { margin-left: 0; flex: 1; text-align: center; }

.dup-keep, .dup-rm {
  font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 7px;
  cursor: pointer; font-family: inherit; margin-left: 6px; transition: all .12s;
}
.dup-keep { border: 1px solid rgba(34,197,94,.4); background: rgba(34,197,94,.1); color: #16a34a; }
.dup-keep:hover:not(:disabled) { background: rgba(34,197,94,.2); }
.dup-rm { border: 1px solid rgba(239,68,68,.4); background: rgba(239,68,68,.08); color: #ef4444; }
.dup-rm:hover:not(:disabled) { background: rgba(239,68,68,.18); }
.dup-keep:disabled, .dup-rm:disabled { opacity: .5; cursor: default; }

.dup-bulk { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.dup-act {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500; padding: 5px 12px; border-radius: 8px;
  border: 1px solid var(--accent); background: rgba(255,107,0,.08); color: var(--accent);
  cursor: pointer; font-family: inherit; transition: background .12s;
}
.dup-act:hover:not(:disabled) { background: rgba(255,107,0,.16); }
.dup-act:disabled { opacity: .5; cursor: default; }
.dup-act-ico :deep(svg) { width: 12px; height: 12px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 70px 40px; text-align: center; color: var(--muted);
}
.empty-ico { font-size: 48px; margin-bottom: 12px; }
.empty-ico :deep(svg) { width: 1em; height: 1em; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 14px; margin-top: 4px; }

.scan-note { font-size: 12px; color: var(--faint); margin: 22px 0 0; max-width: 720px; line-height: 1.5; }

@media (max-width: 720px) {
  .dup-gain { display: none; }
  .dup-compare { grid-template-columns: 1fr; }
}
</style>

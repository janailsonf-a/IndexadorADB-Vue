<template>
  <div class="view-content">
    <div class="page-hd">
      <div>
        <h2 class="page-title">Arquivos Duplicados</h2>
        <p class="page-sub">{{ groups.length }} grupos · {{ totalFiles }} arquivos para revisar</p>
      </div>
      <button class="btn-secondary" :disabled="loading" @click="rescan">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.61"/></svg>
        Escanear novamente
      </button>
    </div>

    <p class="scan-note">
      Comparação por <strong>hash de conteúdo (SHA-256)</strong> calculado no backend — cobre o acervo inteiro,
      não só o que já está carregado na tela. Arquivos vazios (0 bytes) são ignorados. Revise antes de remover.
    </p>

    <SkeletonGrid v-if="loading" />

    <div v-else-if="!groups.length" class="empty-state">
      <div class="empty-ico" v-html="ICONS.checkCircle"></div>
      <h3>Nenhuma duplicata encontrada</h3>
      <p>Nenhum arquivo com o mesmo conteúdo (hash) encontrado no acervo</p>
    </div>

    <div v-else class="dup-groups">
      <div v-for="group in groups" :key="group.id" class="dup-group">
        <!-- Group header -->
        <div class="dup-hd">
          <span class="dup-badge identical">Mesmo conteúdo</span>
          <span class="dup-ct">{{ group.files.length }} arquivos</span>
          <div class="dup-quick">
            <button class="dup-act" :disabled="busy" @click="keepFirst(group)">
              <span class="dup-act-ico" v-html="ICONS.check"></span> Manter primeiro
            </button>
            <button class="dup-act" :disabled="busy" @click="keepNewest(group)">Manter mais recente</button>
            <button class="dup-act ghost" @click="toggleExpand(group)">
              {{ group.expanded ? 'Recolher' : 'Revisar manualmente' }}
            </button>
          </div>
        </div>

        <!-- Files grid -->
        <div class="dup-files" v-if="group.expanded">
          <div v-for="f in group.files" :key="f.id" class="dup-file">
            <div class="dup-thumb" :style="{ background: typeGrad(f.type) }">
              <div class="dup-thumb-icon" v-html="typeIcon(f.type)"></div>
            </div>
            <div class="dup-info">
              <div class="dup-fname" :title="f.name">{{ f.name }}</div>
              <div class="dup-meta">{{ formatDate(f.date) }}</div>
              <div class="dup-meta">{{ f.size }}</div>
            </div>
            <div class="dup-row-act">
              <button class="dup-keep" :disabled="busy" @click="keepThis(group, f)">Manter</button>
              <button class="dup-rm" :disabled="busy" @click="removeThis(f)">Remover</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAssetsStore, mapItem } from '@/stores/assets'
import { useToastStore } from '@/stores/toast'
import { useFileType } from '@/composables/useFileType'
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue'
import api from '@/api/client'
import { ICONS } from '@/lib/icons'

const assets = useAssetsStore()
const toast = useToastStore()
const busy = ref(false)
const loading = ref(false)
const rawGroups = ref([])
const expandedOverrides = ref({})

async function loadDuplicates() {
  loading.value = true
  try {
    const { data } = await api.get('/api/duplicates', { params: { limit_groups: 200 } })
    rawGroups.value = data.groups || []
  } catch {
    rawGroups.value = []
    toast.error('Erro ao buscar duplicatas.')
  } finally {
    loading.value = false
  }
}

onMounted(loadDuplicates)

const groups = computed(() => {
  return rawGroups.value
    .map(g => ({
      id: g.content_hash,
      files: g.files
        .map(r => mapItem(r, assets.starredIds))
        .filter(f => !(f.id in assets.trash) && !assets.hiddenIds.has(f.id)),
    }))
    .filter(g => g.files.length > 1)
    .sort((a, b) => b.files.length - a.files.length)
    .map(g => ({ ...g, expanded: expandedOverrides.value[g.id] ?? true }))
})

const totalFiles = computed(() => groups.value.reduce((sum, g) => sum + g.files.length, 0))

function toggleExpand(group) {
  expandedOverrides.value = { ...expandedOverrides.value, [group.id]: !group.expanded }
}

function typeGrad(type) { return useFileType(type).bg }
function typeIcon(type) { return useFileType(type).icon }

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

function keepFirst(group) {
  const rest = group.files.slice(1).map(f => f.id)
  if (!rest.length) return
  trashMany(rest, `${rest.length} arquivo(s) movido(s) para a lixeira.`)
}

function keepNewest(group) {
  const sorted = [...group.files].sort((a, b) => new Date(b.date) - new Date(a.date))
  const keepId = sorted[0].id
  const rest = group.files.filter(f => f.id !== keepId).map(f => f.id)
  if (!rest.length) return
  trashMany(rest, `${rest.length} arquivo(s) movido(s) para a lixeira.`)
}

function keepThis(group, file) {
  const rest = group.files.filter(f => f.id !== file.id).map(f => f.id)
  if (!rest.length) return
  trashMany(rest, `${rest.length} arquivo(s) movido(s) para a lixeira.`)
}

function removeThis(file) {
  trashMany([file.id], 'Arquivo movido para a lixeira.')
}

function rescan() {
  loadDuplicates()
}
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 24px; }
.page-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); margin: 0; }
.page-sub { font-size: 13px; color: var(--faint); margin: 2px 0 0; }
.btn-secondary { display: flex; align-items: center; gap: 6px; }
.btn-secondary svg { width: 14px; height: 14px; }
.btn-secondary:disabled { opacity: .5; cursor: default; }
.scan-note { font-size: 12px; color: var(--faint); margin: -12px 0 20px; max-width: 640px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--muted);
}
.empty-ico { font-size: 48px; margin-bottom: 12px; }
.empty-ico :deep(svg) { width: 1em; height: 1em; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 14px; margin-top: 4px; }

.dup-groups { display: flex; flex-direction: column; gap: 16px; }

.dup-group { background: var(--card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }

.dup-hd {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  border-bottom: 1px solid var(--border-sub); background: var(--elevated); flex-wrap: wrap;
}
.dup-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.dup-badge.identical { background: rgba(239,68,68,.15); color: #DC2626; }
.dup-badge.similar { background: rgba(245,158,11,.15); color: #D97706; }
.dup-badge.near { background: rgba(255,107,0,.12); color: var(--accent); }
.dup-ct { font-size: 12px; color: var(--faint); }
.dup-quick { display: flex; gap: 6px; margin-left: auto; flex-wrap: wrap; }
.dup-act {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 500; padding: 5px 12px; border-radius: 8px;
  border: 1px solid var(--accent); background: rgba(255,107,0,.08); color: var(--accent);
  cursor: pointer; font-family: inherit; transition: background .12s;
}
.dup-act-ico :deep(svg) { width: 12px; height: 12px; }
.dup-act:hover { background: rgba(255,107,0,.16); }
.dup-act.ghost { border-color: var(--border); background: none; color: var(--muted); }
.dup-act.ghost:hover { border-color: var(--text); color: var(--text); }
.dup-act:disabled { opacity: .5; cursor: default; pointer-events: none; }

.dup-files { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px; }
.dup-file {
  width: 180px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
  transition: opacity .2s;
}
.dup-thumb { aspect-ratio: 4/3; position: relative; display: flex; align-items: center; justify-content: center; }
.dup-thumb-icon { color: rgba(255,255,255,.7); }
.dup-thumb-icon :deep(svg) { width: 30px; height: 30px; }
.dup-info { padding: 8px 10px; }
.dup-fname { font-size: 12px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dup-meta { font-size: 10px; color: var(--faint); margin-top: 1px; }
.dup-row-act { display: flex; gap: 4px; padding: 0 10px 10px; }
.dup-keep {
  flex: 1; font-size: 11px; font-weight: 600; padding: 5px; border-radius: 6px;
  border: 1px solid rgba(34,197,94,.3); background: rgba(34,197,94,.1); color: #16A34A;
  cursor: pointer; font-family: inherit;
}
.dup-rm {
  flex: 1; font-size: 11px; font-weight: 600; padding: 5px; border-radius: 6px;
  border: 1px solid rgba(239,68,68,.2); background: rgba(239,68,68,.08); color: #EF4444;
  cursor: pointer; font-family: inherit;
}
.dup-keep:disabled, .dup-rm:disabled { opacity: .5; cursor: default; }
</style>

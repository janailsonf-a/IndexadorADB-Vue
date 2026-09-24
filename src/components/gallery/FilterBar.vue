<template>
  <div class="filter-wrap">
    <!-- Trigger button -->
    <button class="filter-btn" :class="{ active: isOpen || hasActive }" @click="toggle" ref="btnRef">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
      Filtros
      <span v-if="activeCount" class="filter-count">{{ activeCount }}</span>
      <svg class="chevron" :class="{ open: isOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </button>

    <!-- Active filter chips (inline preview) -->
    <div v-if="current !== 'todos'" class="active-chip">
      <span>{{ activeTypeLabel }}</span>
      <button @click="emit('filter', 'todos')" class="chip-x">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Dropdown panel -->
    <Transition name="drop">
      <div v-if="isOpen" class="filter-panel" ref="panelRef">
        <!-- Tipo de arquivo -->
        <div class="fp-section">
          <div class="fp-label">Tipo de arquivo</div>
          <div class="fp-types">
            <button
              v-for="f in FILE_TYPES"
              :key="f.type"
              class="fp-type"
              :class="{ active: current === f.type }"
              @click="selectType(f.type)"
            >
              <span class="fp-type-ico" v-html="f.icon"></span>
              {{ f.label }}
            </button>
          </div>
        </div>

        <div class="fp-divider"></div>

        <!-- Campanha -->
        <div class="fp-section">
          <div class="fp-label">Campanha</div>
          <select v-model="localCampaign" class="fp-select">
            <option value="">Todas as campanhas</option>
            <option v-for="c in campaigns" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <!-- Tags -->
        <div class="fp-section">
          <div class="fp-label">Tag</div>
          <div class="fp-tag-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <input v-model="localTag" class="fp-tag-input" placeholder="Ex: nordeste, crianças…" />
          </div>
        </div>

        <!-- Período -->
        <div class="fp-section">
          <div class="fp-label">Período de upload</div>
          <div class="fp-dates">
            <input type="date" v-model="localDateFrom" class="fp-date" />
            <span class="fp-date-sep">até</span>
            <input type="date" v-model="localDateTo" class="fp-date" />
          </div>
        </div>

        <div class="fp-divider"></div>

        <!-- Actions -->
        <div class="fp-actions">
          <button class="fp-clear" @click="clearAll">Limpar tudo</button>
          <button class="fp-apply" @click="apply">Aplicar filtros</button>
        </div>
      </div>
    </Transition>

    <!-- Click outside overlay -->
    <div v-if="isOpen" class="filter-overlay" @click="isOpen = false"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAssetsStore } from '@/stores/assets'
import { useFileType } from '@/composables/useFileType'
import { ICONS } from '@/lib/icons'

const props = defineProps({
  current: { type: String, default: 'todos' },
})
const emit = defineEmits(['filter'])

const assets = useAssetsStore()
const isOpen = ref(false)
const btnRef = ref(null)
const panelRef = ref(null)

const localCampaign = ref(assets.campaignFilter)
const localTag = ref('')
const localDateFrom = ref(assets.dateFromFilter)
const localDateTo = ref(assets.dateToFilter)

const FILE_TYPES = [
  { type: 'todos', label: 'Todos',          icon: ICONS.folder },
  { type: 'img',   label: 'Imagens',        icon: useFileType('img').icon },
  { type: 'vid',   label: 'Vídeos',         icon: useFileType('vid').icon },
  { type: 'pdf',   label: 'PDFs',           icon: useFileType('pdf').icon },
  { type: 'xls',   label: 'Planilhas',      icon: useFileType('xls').icon },
  { type: 'ppt',   label: 'Apresentações',  icon: useFileType('ppt').icon },
  { type: 'doc',   label: 'Documentos',     icon: useFileType('doc').icon },
  { type: 'aud',   label: 'Áudio',          icon: useFileType('aud').icon },
]

// Derive campaigns from store
const campaigns = computed(() => {
  const set = new Set()
  assets.items.forEach(f => { if (f.campaign) set.add(f.campaign) })
  return [...set].sort()
})

const activeTypeLabel = computed(() => FILE_TYPES.find(f => f.type === props.current)?.label || '')

const hasActive = computed(() => props.current !== 'todos' || localCampaign.value || localTag.value || localDateFrom.value)
const activeCount = computed(() => {
  let n = 0
  if (props.current !== 'todos') n++
  if (localCampaign.value) n++
  if (localTag.value) n++
  if (localDateFrom.value) n++
  return n
})

function toggle() { isOpen.value = !isOpen.value }

function selectType(type) {
  emit('filter', type)
}

function apply() {
  assets.campaignFilter = localCampaign.value
  assets.dateFromFilter = localDateFrom.value
  assets.dateToFilter = localDateTo.value
  if (localTag.value.trim()) {
    assets.searchQuery = localTag.value.trim()
  }
  isOpen.value = false
}

function clearAll() {
  emit('filter', 'todos')
  localCampaign.value = ''
  localTag.value = ''
  localDateFrom.value = ''
  localDateTo.value = ''
  assets.campaignFilter = ''
  assets.dateFromFilter = ''
  assets.dateToFilter = ''
  assets.searchQuery = ''
  isOpen.value = false
}
</script>

<style scoped>
.filter-wrap { position: relative; display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-bottom: 1px solid var(--border-sub); background: var(--bg); flex-shrink: 0; }

/* Trigger */
.filter-btn {
  position: relative; z-index: 81;
  display: flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px;
  border: 1.5px solid var(--border); background: var(--card); color: var(--muted);
  font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .15s;
  white-space: nowrap;
}
.filter-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
.filter-btn:hover { border-color: var(--accent); color: var(--accent); }
.filter-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(255,107,0,.08); }
.filter-count {
  background: var(--accent); color: #fff; font-size: 10px; font-weight: 700;
  padding: 1px 6px; border-radius: 10px; line-height: 1.5;
}
.chevron { transition: transform .2s; }
.chevron.open { transform: rotate(180deg); }

/* Active chip */
.active-chip {
  display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px;
  background: rgba(255,107,0,.1); border: 1px solid rgba(255,107,0,.25); color: var(--accent);
  font-size: 12px; font-weight: 600;
}
.chip-x { background: none; border: none; color: var(--accent); cursor: pointer; display: flex; padding: 0; opacity: .7; }
.chip-x:hover { opacity: 1; }
.chip-x svg { width: 11px; height: 11px; }

/* Dropdown panel */
.filter-panel {
  position: absolute; top: calc(100% + 4px); left: 20px; width: 360px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,.14); z-index: 80; overflow: hidden;
}

.fp-section { padding: 14px 16px 10px; }
.fp-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--faint); margin-bottom: 10px; }

.fp-types { display: flex; flex-wrap: wrap; gap: 6px; }
.fp-type {
  display: flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: 999px;
  border: 1.5px solid var(--border); background: var(--card); color: var(--muted);
  font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .12s;
}
.fp-type:hover { border-color: var(--accent); color: var(--accent); }
.fp-type.active { border-color: var(--accent); background: rgba(255,107,0,.1); color: var(--accent); font-weight: 700; }
.fp-type-ico { display: inline-flex; }
.fp-type-ico :deep(svg) { width: 13px; height: 13px; }

.fp-divider { height: 1px; background: var(--border-sub); margin: 0 16px; }

.fp-select {
  width: 100%; background: var(--card); border: 1.5px solid var(--border); border-radius: 10px;
  padding: 8px 12px; font-size: 13px; color: var(--text); outline: none; font-family: inherit;
  transition: border-color .15s; cursor: pointer;
}
.fp-select:focus { border-color: var(--accent); }

.fp-tag-input-wrap {
  display: flex; align-items: center; gap: 8px; background: var(--card);
  border: 1.5px solid var(--border); border-radius: 10px; padding: 0 12px;
}
.fp-tag-input-wrap svg { width: 13px; height: 13px; color: var(--faint); flex-shrink: 0; }
.fp-tag-input { background: none; border: none; outline: none; font-size: 13px; color: var(--text); padding: 8px 0; width: 100%; font-family: inherit; }
.fp-tag-input-wrap:focus-within { border-color: var(--accent); }

.fp-dates { display: flex; align-items: center; gap: 8px; }
.fp-date {
  flex: 1; background: var(--card); border: 1.5px solid var(--border); border-radius: 10px;
  padding: 7px 10px; font-size: 12px; color: var(--text); outline: none; font-family: inherit;
}
.fp-date:focus { border-color: var(--accent); }
.fp-date-sep { font-size: 12px; color: var(--faint); flex-shrink: 0; }

.fp-actions { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--elevated); }
.fp-clear { background: none; border: none; font-size: 12px; color: var(--faint); cursor: pointer; font-family: inherit; transition: color .12s; }
.fp-clear:hover { color: #EF4444; }
.fp-apply {
  background: var(--accent); color: #fff; border: none; border-radius: 999px;
  padding: 7px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background .12s;
}
.fp-apply:hover { background: #E65300; }

/* Click outside */
.filter-overlay { position: fixed; inset: 0; z-index: 79; }

/* Transition */
.drop-enter-active, .drop-leave-active { transition: opacity .15s, transform .15s; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px); }
</style>

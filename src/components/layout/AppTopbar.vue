<template>
  <header class="topbar">
    <!-- Search -->
    <div class="search-wrap" ref="searchWrap">
      <div class="srch-inner" :class="{ focused: searchFocused }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          ref="inputEl"
          class="srch-input"
          v-model="query"
          placeholder="Buscar arquivos, campanhas, tags…"
          autocomplete="off"
          @focus="searchFocused = true"
          @blur="onBlur"
          @keydown.escape="clear"
          @keydown.enter="onEnter"
        >
        <button v-if="query" class="srch-clear" @mousedown.prevent="clear">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Autocomplete -->
      <Transition name="ac-fade">
        <div v-if="searchFocused && (query || recentSearches.length)" class="autocomplete">
          <template v-if="query">
            <div class="ac-group">
              <div class="ac-lbl">Campanhas</div>
              <div v-for="c in matchCampaigns" :key="c" class="ac-item" @mousedown.prevent="applySearch(c)">
                <div class="ac-ico" style="background:rgba(255,107,0,.1)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></svg>
                </div>
                <span>{{ c }}</span>
              </div>
            </div>
            <div class="ac-group" v-if="matchTags.length">
              <div class="ac-lbl">Tags</div>
              <div v-for="t in matchTags" :key="t" class="ac-item" @mousedown.prevent="applySearch(t)">
                <div class="ac-ico" style="background:rgba(255,217,0,.1)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#FFD900" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                </div>
                <span>{{ t }}</span>
              </div>
            </div>
          </template>
          <template v-else-if="recentSearches.length">
            <div class="ac-group">
              <div class="ac-lbl">Recentes</div>
              <div v-for="r in recentSearches" :key="r" class="ac-item" @mousedown.prevent="applySearch(r)">
                <div class="ac-ico" style="background:var(--elevated)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>
                </div>
                <span>{{ r }}</span>
              </div>
            </div>
          </template>
        </div>
      </Transition>
    </div>

    <!-- Right controls -->
    <div class="topbar-r">
      <!-- Grid size slider (gallery only) -->
      <div v-if="showSlider" class="slider-grp">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;color:var(--faint)"><rect x="3" y="3" width="4" height="4"/><rect x="10" y="3" width="4" height="4"/><rect x="17" y="3" width="4" height="4"/><rect x="3" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="17" y="10" width="4" height="4"/></svg>
        <input type="range" class="size-slider" min="0" max="100" :value="sliderVal" @input="onSlider">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:var(--faint)"><rect x="2" y="2" width="8" height="8"/><rect x="14" y="2" width="8" height="8"/><rect x="2" y="14" width="8" height="8"/><rect x="14" y="14" width="8" height="8"/></svg>
      </div>

      <!-- View mode toggle -->
      <div v-if="showSlider" class="view-btns">
        <button class="ico-btn" :class="{ on: viewMode === 'grid' }" @click="$emit('viewMode', 'grid')" title="Grade">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </button>
        <button class="ico-btn" :class="{ on: viewMode === 'list' }" @click="$emit('viewMode', 'list')" title="Lista">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
        </button>
      </div>

      <!-- User avatar -->
      <RouterLink to="/perfil" class="av-btn" :title="auth.user?.name">{{ initials }}</RouterLink>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useAssetsStore } from '@/stores/assets'

defineProps({ viewMode: String, showSlider: Boolean })
defineEmits(['viewMode', 'upload'])

const auth = useAuthStore()
const ui = useUiStore()
const assets = useAssetsStore()
const route = useRoute()
const router = useRouter()

const searchFocused = ref(false)
const query = ref(assets.searchQuery)

const recentSearches = ref(JSON.parse(localStorage.getItem('noxis_recent') || '[]'))

// Derivados ao vivo do acervo já carregado (antes eram arrays hardcoded, divergentes do FilterBar)
const campaignNames = computed(() => assets.campaignsList.map(c => c.name))
const tagNames = computed(() => {
  const set = new Set()
  assets.items.forEach(f => f.tags?.forEach(t => set.add(t)))
  return [...set].sort()
})

const matchCampaigns = computed(() => campaignNames.value.filter(c => c.toLowerCase().includes(query.value.toLowerCase())).slice(0, 3))
const matchTags = computed(() => tagNames.value.filter(t => t.toLowerCase().includes(query.value.toLowerCase())).slice(0, 4))

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
})

const sliderVal = computed(() => Math.round((ui.gridSize - 150) / 2))

watch(query, (v) => { assets.searchQuery = v })
// Mantém sincronizado quando algo fora daqui muda assets.searchQuery (ex: FilterBar.clearAll())
watch(() => assets.searchQuery, (v) => { if (v !== query.value) query.value = v })

function onSlider(e) {
  ui.setGridSize(150 + Number(e.target.value) * 2)
}

function clear() {
  query.value = ''
  assets.searchQuery = ''
}

function applySearch(val) {
  query.value = val
  assets.searchQuery = val
  searchFocused.value = false
  saveRecent(val)
  if (route.path !== '/acervo') router.push('/acervo')
}

function onEnter() {
  if (query.value.trim()) {
    saveRecent(query.value.trim())
    searchFocused.value = false
    if (route.path !== '/busca') router.push({ path: '/busca', query: { q: query.value } })
  }
}

function onBlur() {
  setTimeout(() => { searchFocused.value = false }, 150)
}

function saveRecent(val) {
  const list = [val, ...recentSearches.value.filter(r => r !== val)].slice(0, 5)
  recentSearches.value = list
  localStorage.setItem('noxis_recent', JSON.stringify(list))
}
</script>

<style scoped>
.topbar {
  height: var(--topbar-h);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  flex-shrink: 0;
  position: relative;
  z-index: 20;
}
.search-wrap { flex: 1; max-width: 520px; position: relative; }
.srch-inner {
  display: flex; align-items: center; gap: 8px;
  background: var(--card); border: 1.5px solid var(--border);
  border-radius: 999px; padding: 0 16px;
  transition: border-color .15s, box-shadow .15s;
}
.srch-inner.focused { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,107,0,.12); }
.srch-inner svg { width: 15px; height: 15px; color: var(--faint); flex-shrink: 0; }
.srch-input {
  background: none; border: none; outline: none;
  font-size: 14px; color: var(--text); padding: 9px 0; width: 100%; font-family: inherit;
}
.srch-input::placeholder { color: var(--faint); }
.srch-clear {
  background: none; border: none; color: var(--faint); cursor: pointer; display: flex; padding: 0;
}
.srch-clear svg { width: 13px; height: 13px; }
.srch-clear:hover { color: var(--text); }

.autocomplete {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,.12); z-index: 50; overflow: hidden;
}
.ac-group { padding: 6px 0; border-bottom: 1px solid var(--border-sub); }
.ac-group:last-child { border-bottom: none; }
.ac-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--faint); padding: 4px 14px 6px; }
.ac-item { display: flex; align-items: center; gap: 10px; padding: 8px 14px; cursor: pointer; font-size: 13px; transition: background .1s; }
.ac-item:hover { background: var(--elevated); }
.ac-ico { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ac-ico svg { width: 14px; height: 14px; }

.ac-fade-enter-active, .ac-fade-leave-active { transition: opacity .1s, transform .1s; }
.ac-fade-enter-from, .ac-fade-leave-to { opacity: 0; transform: translateY(-4px); }

.topbar-r { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.slider-grp { display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; }
.size-slider { -webkit-appearance: none; width: 72px; height: 3px; background: var(--border); border-radius: 2px; outline: none; cursor: pointer; }
.size-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; background: var(--accent); border-radius: 50%; }
.view-btns { display: flex; gap: 2px; }
.ico-btn {
  width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--card); color: var(--muted); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .12s;
}
.ico-btn svg { width: 15px; height: 15px; }
.ico-btn:hover { color: var(--text); }
.ico-btn.on { border-color: var(--accent); color: var(--accent); background: rgba(255,107,0,.1); }
.av-btn {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #FFD900);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff; border: none; cursor: pointer;
  text-decoration: none; flex-shrink: 0;
}
</style>

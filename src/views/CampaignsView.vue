<template>
  <div class="view-content">
    <!-- Header -->
    <div class="page-hd">
      <div>
        <h2 class="page-title">Campanhas</h2>
        <p class="page-sub">{{ campaigns.length }} campanhas ativas</p>
      </div>
      <button v-if="auth.isEditor" class="btn-primary" @click="showCreate = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova Campanha
      </button>
    </div>

    <!-- Empty -->
    <div v-if="!campaigns.length" class="empty-state">
      <div class="empty-ico" v-html="ICONS.folder"></div>
      <h3>Nenhuma campanha criada</h3>
      <p>Organize seus arquivos por campanhas para facilitar o acesso</p>
      <button v-if="auth.isEditor" class="btn-primary" @click="showCreate = true" style="margin-top:16px">
        + Criar primeira campanha
      </button>
    </div>

    <!-- Grid -->
    <div v-else class="camp-grid">
      <div
        v-for="c in campaigns"
        :key="c.id"
        class="camp-card"
        @click="goTo(c)"
      >
        <!-- Collage / cover -->
        <div class="camp-cover" :style="{ background: c.gradient }">
          <div class="camp-cover-grid" v-if="c.thumbs.length">
            <div v-for="t in c.thumbs.slice(0,4)" :key="t" class="cover-thumb"></div>
          </div>
          <div v-else class="camp-cover-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></svg>
          </div>
          <span class="camp-count-badge">{{ c.count }} arq.</span>
        </div>
        <!-- Info -->
        <div class="camp-info">
          <div class="camp-name">{{ c.name }}</div>
          <div class="camp-meta">{{ c.count }} arquivos · {{ c.date }}</div>
          <button class="btn-secondary camp-btn" @click.stop="goTo(c)">Ver acervo</button>
        </div>
      </div>
    </div>

    <!-- Modal: Nova Campanha -->
    <Transition name="modal">
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false" @keydown.esc="showCreate = false">
        <div class="modal" ref="modalEl" role="dialog" aria-modal="true" aria-label="Nova Campanha">
          <div class="modal-hd">
            <h3>Nova Campanha</h3>
            <button class="modal-close" aria-label="Fechar" @click="showCreate = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <label class="field-lbl">Nome <span class="req">*</span></label>
            <input v-model="form.name" class="field-input" placeholder="Ex: Natal 2025" />
            <label class="field-lbl" style="margin-top:14px">Descrição</label>
            <textarea v-model="form.desc" class="field-input field-ta" placeholder="Descreva o objetivo desta campanha…" rows="3"></textarea>
            <label class="field-lbl" style="margin-top:14px">Cor de identificação</label>
            <div class="color-swatches">
              <button v-for="col in COLORS" :key="col"
                class="swatch" :style="{ background: col }"
                :class="{ active: form.color === col }"
                @click="form.color = col"></button>
            </div>
          </div>
          <div class="modal-ft">
            <button class="btn-ghost" @click="showCreate = false">Cancelar</button>
            <button class="btn-primary" :disabled="!form.name.trim()" @click="createCampaign">Criar campanha</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAssetsStore } from '@/stores/assets'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { ICONS } from '@/lib/icons'

const router = useRouter()
const auth = useAuthStore()
const assets = useAssetsStore()

const showCreate = ref(false)
const modalEl = ref(null)
useFocusTrap(modalEl, showCreate)
const form = ref({ name: '', desc: '', color: '#FF6B00' })

const COLORS = ['#FF6B00', '#FFD900', '#0047BA', '#143F43', '#22C55E', '#EC4899', '#8B5CF6', '#EF4444']

function campaignGradient(color) {
  return color
    ? `linear-gradient(140deg, ${color} 0%, ${color}cc 100%)`
    : 'linear-gradient(140deg, #FF6B00 0%, #FFD900 100%)'
}

// Derive campaigns from real files, merged with manually-created (localStorage) campaigns
// that have no files yet — campaigns aren't a backend entity, so an empty one only
// "exists" client-side until a file is tagged with its name.
const campaigns = computed(() => {
  const map = {}
  assets.items.forEach(f => {
    if (!f.campaign) return
    if (!map[f.campaign]) {
      map[f.campaign] = { id: f.campaign, name: f.campaign, count: 0, thumbs: [], date: f.date }
    }
    map[f.campaign].count++
    if (map[f.campaign].thumbs.length < 4) map[f.campaign].thumbs.push(f.id)
    if (f.date > map[f.campaign].date) map[f.campaign].date = f.date
  })
  Object.keys(assets.campaignMeta).forEach(name => {
    if (!map[name]) {
      map[name] = { id: name, name, count: 0, thumbs: [], date: assets.campaignMeta[name].createdAt || '' }
    }
  })
  return Object.values(map)
    .map(c => ({ ...c, gradient: campaignGradient(assets.campaignMeta[c.name]?.color) }))
    .sort((a, b) => b.count - a.count)
})

function goTo(c) {
  router.push(`/campanhas/${encodeURIComponent(c.id)}`)
}

function createCampaign() {
  const name = form.value.name.trim()
  if (!name) return
  assets.upsertCampaignMeta(name, {
    description: form.value.desc.trim(),
    color: form.value.color,
    createdAt: new Date().toISOString(),
  })
  showCreate.value = false
  form.value = { name: '', desc: '', color: '#FF6B00' }
}
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 24px; }

.page-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
.page-title { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); margin: 0; }
.page-sub { font-size: 13px; color: var(--faint); margin: 2px 0 0; }
.btn-primary { display: flex; align-items: center; gap: 6px; }
.btn-primary svg { width: 14px; height: 14px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--muted);
}
.empty-ico { font-size: 48px; margin-bottom: 12px; }
.empty-ico :deep(svg) { width: 1em; height: 1em; }
.empty-state h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 700; color: var(--heading); }
.empty-state p { font-size: 14px; margin-top: 4px; }

.camp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

.camp-card {
  background: var(--card); border-radius: 16px; overflow: hidden; cursor: pointer;
  border: 1px solid var(--border); transition: box-shadow .2s, transform .2s;
}
.camp-card:hover { box-shadow: 0 6px 24px rgba(255,107,0,.14); transform: translateY(-2px); }

.camp-cover {
  aspect-ratio: 16/9; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.camp-cover-grid { display: grid; grid-template-columns: 1fr 1fr; width: 100%; height: 100%; }
.cover-thumb { background: rgba(255,255,255,.15); }
.camp-cover-icon svg { width: 48px; height: 48px; color: rgba(255,255,255,.7); }
.camp-count-badge {
  position: absolute; top: 10px; right: 10px;
  background: rgba(0,0,0,.45); color: #fff; font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 999px; backdrop-filter: blur(4px);
}

.camp-info { padding: 16px; }
.camp-name { font-family: Montserrat, system-ui, sans-serif; font-size: 15px; font-weight: 700; color: var(--heading); margin-bottom: 4px; }
.camp-meta { font-size: 12px; color: var(--faint); margin-bottom: 12px; }
.camp-btn { width: 100%; justify-content: center; font-size: 13px; padding: 7px 16px; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 200;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  background: var(--surface); border-radius: 20px; width: 100%; max-width: 440px;
  box-shadow: 0 24px 64px rgba(0,0,0,.18); overflow: hidden;
}
.modal-hd { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-hd h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 17px; font-weight: 700; color: var(--heading); margin: 0; }
.modal-close { background: none; border: none; color: var(--faint); cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.modal-close:hover { background: var(--elevated); color: var(--text); }
.modal-close svg { width: 16px; height: 16px; }
.modal-body { padding: 16px 24px; }
.modal-ft { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border-sub); }

.field-lbl { font-size: 12px; font-weight: 600; color: var(--muted); display: block; margin-bottom: 6px; }
.req { color: #EF4444; }
.field-input {
  width: 100%; background: var(--card); border: 1.5px solid var(--border); border-radius: 10px;
  padding: 9px 12px; font-size: 14px; color: var(--text); outline: none; font-family: inherit; box-sizing: border-box;
  transition: border-color .15s;
}
.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,107,0,.1); }
.field-ta { resize: vertical; min-height: 80px; }

.color-swatches { display: flex; gap: 8px; flex-wrap: wrap; }
.swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform .1s; }
.swatch:hover { transform: scale(1.15); }
.swatch.active { border-color: var(--text); box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--text); }

.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>

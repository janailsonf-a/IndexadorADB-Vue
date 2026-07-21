<template>
  <div class="view-content">
    <!-- Header -->
    <div class="page-hd">
      <h2 class="page-title">Analytics</h2>
      <div class="period-select">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <select v-model="period" class="period-sel">
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="kpi-grid">
      <div v-for="k in kpis" :key="k.label" class="kpi-card">
        <div class="kpi-ico" :style="{ background: k.bg }">
          <span v-html="k.icon"></span>
        </div>
        <div class="kpi-body">
          <div class="kpi-val">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="charts-row">
      <!-- Atividade por dia — bar chart (real: GET /api/activities) -->
      <div class="chart-card">
        <div class="chart-hd">
          <h3 class="chart-title">Atividade por dia</h3>
          <span class="chart-sub">últimos {{ period }} dias · {{ activities.length }} eventos no total</span>
        </div>
        <div v-if="!activities.length" class="chart-empty">Nenhuma atividade registrada ainda.</div>
        <template v-else>
          <div class="bar-chart">
            <div v-for="d in activityByDay" :key="d.date" class="bar-col">
              <div class="bar" :style="{ height: (d.count / maxBar * 100) + '%' }" :title="`${d.count} evento(s) em ${d.date}`"></div>
            </div>
          </div>
          <div class="bar-labels" :class="{ dense: activityByDay.length > 14 }">
            <span v-for="d in activityByDay" :key="d.date">{{ activityByDay.length > 31 ? '' : d.label }}</span>
          </div>
        </template>
      </div>

      <!-- Atividade por tipo de ação — donut (real) -->
      <div class="chart-card">
        <div class="chart-hd"><h3 class="chart-title">Atividade por ação</h3></div>
        <div v-if="!actionSegs.length" class="chart-empty">Nenhuma atividade no período selecionado.</div>
        <template v-else>
          <div class="donut-wrap">
            <svg viewBox="0 0 120 120" class="donut-svg">
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--elevated)" stroke-width="16"/>
              <circle v-for="seg in actionSegs" :key="seg.type" cx="60" cy="60" r="48"
                fill="none" :stroke="seg.color" stroke-width="16"
                :stroke-dasharray="`${seg.dash} ${seg.gap}`"
                :stroke-dashoffset="seg.offset"
                stroke-linecap="round"
              />
            </svg>
            <div class="donut-center">
              <div class="donut-total">{{ actionTotal }}</div>
              <div class="donut-sub">eventos</div>
            </div>
          </div>
          <div class="legend">
            <div v-for="s in actionSegs" :key="s.type" class="leg-item">
              <span class="leg-dot" :style="{ background: s.color }"></span>
              <span>{{ s.label }}</span>
              <span class="leg-pct">{{ s.pct }}%</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Bottom row -->
    <div class="charts-row">
      <!-- Distribuição por tipo — donut (amostra do acervo carregado) -->
      <div class="chart-card">
        <div class="chart-hd">
          <h3 class="chart-title">Distribuição por tipo</h3>
          <span class="chart-sub">amostra de {{ assets.items.length }} arquivo(s) carregado(s)</span>
        </div>
        <div v-if="!typeSegs.length" class="chart-empty">Nenhum arquivo carregado ainda.</div>
        <template v-else>
          <div class="donut-wrap">
            <svg viewBox="0 0 120 120" class="donut-svg">
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--elevated)" stroke-width="16"/>
              <circle v-for="seg in typeSegs" :key="seg.type" cx="60" cy="60" r="48"
                fill="none" :stroke="seg.color" stroke-width="16"
                :stroke-dasharray="`${seg.dash} ${seg.gap}`"
                :stroke-dashoffset="seg.offset"
                stroke-linecap="round"
              />
            </svg>
            <div class="donut-center">
              <div class="donut-total">{{ assets.items.length }}</div>
              <div class="donut-sub">arquivos</div>
            </div>
          </div>
          <div class="legend">
            <div v-for="s in typeSegs" :key="s.type" class="leg-item">
              <span class="leg-dot" :style="{ background: s.color }"></span>
              <span>{{ s.label }}</span>
              <span class="leg-pct">{{ s.pct }}%</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Top campanhas (amostra do acervo carregado) -->
      <div class="chart-card">
        <div class="chart-hd">
          <h3 class="chart-title">Top Campanhas</h3>
          <span class="chart-sub">amostra carregada</span>
        </div>
        <div v-if="!topCampaigns.length" class="chart-empty">Nenhuma campanha na amostra atual.</div>
        <div v-else class="rank-list">
          <div v-for="(c, i) in topCampaigns" :key="c.name" class="rank-row">
            <span class="rank-n">{{ i + 1 }}</span>
            <div class="rank-info">
              <div class="rank-name">{{ c.name }}</div>
              <div class="rank-bar-wrap">
                <div class="rank-bar" :style="{ width: (c.count / topCampaigns[0].count * 100) + '%', background: 'var(--accent)' }"></div>
              </div>
            </div>
            <span class="rank-ct">{{ c.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Histórico de armazenamento (real: GET /api/history) -->
    <div class="chart-card storage-card">
      <div class="chart-hd">
        <h3 class="chart-title">Histórico de armazenamento</h3>
        <span class="chart-sub" v-if="status">{{ status.disk.used_tb.toFixed(2) }} TB de {{ status.disk.total_tb.toFixed(2) }} TB usados ({{ status.disk.usage_percent.toFixed(1) }}%)</span>
      </div>
      <div v-if="historyPoints.length < 2" class="chart-empty">
        Histórico insuficiente ainda ({{ historyPoints.length }} ponto{{ historyPoints.length !== 1 ? 's' : '' }} coletado{{ historyPoints.length !== 1 ? 's' : '' }} até agora — a coleta é diária).
      </div>
      <template v-else>
        <div class="bar-chart">
          <div v-for="p in historyPoints" :key="p.date" class="bar-col">
            <div class="bar hist" :style="{ height: (p.tb / maxHistTb * 100) + '%' }" :title="`${p.tb} TB em ${p.date}`"></div>
          </div>
        </div>
        <div class="bar-labels">
          <span v-for="p in historyPoints" :key="p.date">{{ formatShortDate(p.date) }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAssetsStore } from '@/stores/assets'
import { useToastStore } from '@/stores/toast'
import api from '@/api/client'

const assets = useAssetsStore()
const toast = useToastStore()

const period = ref('30')
const totalIndexed = ref(0)
const status = ref(null)
const users = ref([])
const tagsCount = ref(0)
const activities = ref([])
const history = ref({ dates: [], values: [] })

const ICONS = {
  files: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`,
  storage: `<svg viewBox="0 0 24 24" fill="none" stroke="#0047BA" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  tags: `<svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2.41 12.4A2 2 0 0 1 2 11V3a1 1 0 0 1 1-1h8a2 2 0 0 1 1.41.59l8.18 8.18a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1"/></svg>`,
}

const kpis = computed(() => [
  { label: 'Arquivos indexados', value: totalIndexed.value.toLocaleString('pt-BR'), bg: 'rgba(255,107,0,.1)', icon: ICONS.files },
  { label: 'Armazenamento', value: status.value ? `${status.value.disk.usage_percent.toFixed(0)}% (${status.value.disk.used_tb.toFixed(2)} TB)` : '—', bg: 'rgba(0,71,186,.1)', icon: ICONS.storage },
  { label: 'Usuários cadastrados', value: String(users.value.length), bg: 'rgba(34,197,94,.1)', icon: ICONS.users },
  { label: 'Tags em uso', value: String(tagsCount.value), bg: 'rgba(139,92,246,.1)', icon: ICONS.tags },
])

// Atividade por dia, dentro do período selecionado — real, a partir de GET /api/activities
const activityByDay = computed(() => {
  const days = parseInt(period.value)
  const buckets = {}
  const order = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    buckets[key] = 0
    order.push(key)
  }
  activities.value.forEach(a => {
    const key = (a.created_at || '').slice(0, 10)
    if (key in buckets) buckets[key]++
  })
  return order.map(key => ({
    date: key,
    count: buckets[key],
    label: new Date(key + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }))
})
const maxBar = computed(() => Math.max(1, ...activityByDay.value.map(d => d.count)))

const ACTION_META = {
  download: { label: 'Download', color: 'var(--accent)' },
  preview: { label: 'Visualização', color: '#8B5CF6' },
  search: { label: 'Busca', color: '#0047BA' },
  serve_file: { label: 'Arquivo servido', color: '#22C55E' },
  vacuum: { label: 'Manutenção', color: '#6B7280' },
  clear_activities: { label: 'Limpeza de log', color: '#EF4444' },
}

function donutFromCounts(counts, metaMap) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (!total) return []
  const circ = 2 * Math.PI * 48
  let offset = -circ * 0.25
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([key, count]) => {
      const meta = metaMap[key] || { label: key, color: '#999' }
      const pct = Math.round((count / total) * 100)
      const dash = (circ * count) / total
      const seg = { type: key, label: meta.label, color: meta.color, pct, dash, gap: circ - dash, offset: -offset }
      offset += dash
      return seg
    })
    .sort((a, b) => b.pct - a.pct)
}

const activitiesInPeriod = computed(() => {
  const validDays = new Set(activityByDay.value.map(d => d.date))
  return activities.value.filter(a => validDays.has((a.created_at || '').slice(0, 10)))
})
const actionSegs = computed(() => {
  const counts = {}
  activitiesInPeriod.value.forEach(a => { counts[a.action] = (counts[a.action] || 0) + 1 })
  return donutFromCounts(counts, ACTION_META)
})
const actionTotal = computed(() => activitiesInPeriod.value.length)

const TYPE_META = {
  img: { label: 'Imagens', color: 'var(--accent)' },
  vid: { label: 'Vídeos', color: '#8B5CF6' },
  pdf: { label: 'PDFs', color: '#EF4444' },
  doc: { label: 'Documentos', color: '#3B82F6' },
  xls: { label: 'Planilhas', color: '#22C55E' },
  ppt: { label: 'Apresentações', color: '#F59E0B' },
  aud: { label: 'Áudio', color: '#EC4899' },
  unk: { label: 'Outros', color: '#6B7280' },
}
const typeSegs = computed(() => {
  const counts = {}
  assets.items.forEach(f => { counts[f.type] = (counts[f.type] || 0) + 1 })
  return donutFromCounts(counts, TYPE_META)
})

const topCampaigns = computed(() => {
  const map = {}
  assets.items.forEach(f => { if (f.campaign) map[f.campaign] = (map[f.campaign] || 0) + 1 })
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const historyPoints = computed(() =>
  (history.value.dates || []).map((d, i) => ({ date: d, tb: history.value.values[i] }))
)
const maxHistTb = computed(() => Math.max(0.01, ...historyPoints.value.map(p => p.tb)))

function formatShortDate(d) {
  const dt = new Date(d + 'T12:00:00')
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

async function loadAnalytics() {
  try {
    const [searchRes, statusRes, usersRes, tagsRes, activitiesRes, historyRes] = await Promise.all([
      api.get('/api/search', { params: { query: '', page: 1, page_size: 5 } }),
      api.get('/api/full-status'),
      api.get('/api/users'),
      api.get('/api/files/tags/suggestions', { params: { limit: 200 } }),
      api.get('/api/activities', { params: { limit: 1000 } }),
      api.get('/api/history'),
    ])
    totalIndexed.value = searchRes.data.meta?.total_indexed || 0
    status.value = statusRes.data
    users.value = usersRes.data || []
    tagsCount.value = (tagsRes.data.tags || []).length
    activities.value = Array.isArray(activitiesRes.data) ? activitiesRes.data : (activitiesRes.data.activities || [])
    history.value = historyRes.data || { dates: [], values: [] }
  } catch {
    toast.error('Erro ao carregar analytics.')
  }
}

onMounted(() => {
  if (!assets.items.length) assets.fetchAssets({ reset: true })
  loadAnalytics()
})
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.page-hd { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.page-title { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); margin: 0; }

.period-select { display: flex; align-items: center; gap: 8px; background: var(--card); border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; }
.period-select svg { width: 14px; height: 14px; color: var(--faint); flex-shrink: 0; }
.period-sel { background: none; border: none; outline: none; font-size: 13px; color: var(--text); padding: 8px 0; font-family: inherit; cursor: pointer; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.kpi-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 16px;
  display: flex; align-items: flex-start; gap: 14px;
}
.kpi-ico { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.kpi-ico :deep(svg) { width: 20px; height: 20px; }
.kpi-val { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); line-height: 1; }
.kpi-label { font-size: 12px; color: var(--muted); margin-top: 2px; }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 800px) { .charts-row { grid-template-columns: 1fr; } }

.chart-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 18px; }
.chart-hd { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.chart-title { font-family: Montserrat, system-ui, sans-serif; font-size: 14px; font-weight: 700; color: var(--heading); margin: 0; }
.chart-sub { font-size: 12px; color: var(--faint); }
.chart-empty { font-size: 13px; color: var(--faint); padding: 24px 0; text-align: center; }

/* Bar chart */
.bar-chart { height: 100px; display: flex; align-items: flex-end; gap: 4px; margin-bottom: 6px; }
.bar-col { flex: 1; height: 100%; display: flex; align-items: flex-end; }
.bar { width: 100%; background: var(--accent); border-radius: 4px 4px 0 0; min-height: 4px; transition: background .15s; }
.bar.hist { background: #0047BA; }
.bar-col:hover .bar { background: #e55e00; }
.bar-col:hover .bar.hist { background: #003a99; }
.bar-labels { display: flex; gap: 4px; }
.bar-labels span { flex: 1; font-size: 9px; text-align: center; color: var(--faint); }
.bar-labels.dense span { font-size: 0; }

/* Donut */
.donut-wrap { position: relative; width: 120px; height: 120px; margin: 0 auto 14px; }
.donut-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.donut-total { font-family: Montserrat, system-ui, sans-serif; font-size: 18px; font-weight: 800; color: var(--heading); }
.donut-sub { font-size: 10px; color: var(--faint); }

/* Legend */
.legend { display: flex; flex-direction: column; gap: 6px; }
.leg-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text); }
.leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.leg-pct { margin-left: auto; font-weight: 600; color: var(--muted); }

/* Rank list */
.rank-list { display: flex; flex-direction: column; gap: 10px; }
.rank-row { display: flex; align-items: center; gap: 10px; }
.rank-n { font-family: Montserrat, system-ui, sans-serif; font-size: 13px; font-weight: 700; color: var(--faint); width: 18px; text-align: center; flex-shrink: 0; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
.rank-bar-wrap { height: 4px; background: var(--elevated); border-radius: 2px; overflow: hidden; }
.rank-bar { height: 100%; border-radius: 2px; transition: width .3s; }
.rank-ct { font-size: 11px; color: var(--faint); white-space: nowrap; }
</style>

<template>
  <div class="view-content">
    <div class="pg-hd">
      <div>
        <h1>Status do Sistema</h1>
        <p>Monitoramento em tempo real · atualizado há {{ lastUpdate }}s</p>
      </div>
      <button class="btn-primary" @click="refresh">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Atualizar
      </button>
    </div>

    <!-- Gauges -->
    <div class="st-top">
      <div class="gauge-c" v-for="g in gauges" :key="g.label">
        <div class="g-lbl">{{ g.label }}</div>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="36" fill="none" stroke="var(--border)" stroke-width="9"/>
          <circle cx="45" cy="45" r="36" fill="none" :stroke="g.color" stroke-width="9"
            :stroke-dasharray="`${g.pct * 2.26} ${226 - g.pct * 2.26}`"
            transform="rotate(-90 45 45)" stroke-linecap="round" />
        </svg>
        <div class="g-num" :style="{ color: g.color }">{{ g.display }}</div>
      </div>
    </div>

    <div class="st-mid">
      <!-- Indexação -->
      <div class="card st-card">
        <h3>Indexação do Acervo</h3>
        <div class="prog-wrap">
          <div class="prog-lbls">
            <span>Progresso geral</span>
            <span style="color:var(--accent);font-weight:700">{{ status?.indexer?.percent || 0 }}%</span>
          </div>
          <div class="prog-track"><div class="prog-fill" :style="{ width: (status?.indexer?.percent || 0) + '%' }"></div></div>
        </div>
        <div class="idx-stats" v-if="idxStats.length">
          <div class="idx-s" v-for="s in idxStats" :key="s.label">
            <div class="idx-sv" :style="{ color: s.color }">{{ s.val }}</div>
            <div class="idx-sl">{{ s.label }}</div>
          </div>
        </div>
        <div v-else style="font-size:13px;color:var(--faint);padding:8px 0">Carregando dados do indexador…</div>
      </div>

      <!-- Serviços -->
      <div class="card st-card">
        <h3>Serviços</h3>
        <div class="svc-list">
          <div class="svc-row" v-for="svc in services" :key="svc.name">
            <span>{{ svc.name }}</span>
            <span :class="svc.on ? 'pill-ok' : 'pill-warn'">{{ svc.on ? '● Ativo' : '● Inativo' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="st-bot">
      <!-- Storage -->
      <div class="card st-card">
        <h3>Armazenamento</h3>
        <template v-if="storInfo">
          <div class="stor-row"><span>Utilizado</span><span>{{ storInfo.used }}</span></div>
          <div class="stor-row"><span>Disponível</span><span>{{ storInfo.free }}</span></div>
          <div class="stor-row"><span>Total</span><span>{{ storInfo.total }}</span></div>
          <div class="stor-seg">
            <div :style="{ width: storInfo.pct + '%', background: storInfo.pct > 90 ? '#ef4444' : 'var(--accent)', borderRadius: '3px' }"></div>
            <div style="flex:1;background:var(--elevated);border-radius:0 3px 3px 0"></div>
          </div>
          <div style="font-size:11px;color:var(--faint);margin-top:4px">{{ storInfo.pct }}% utilizado</div>
        </template>
        <div v-else style="font-size:13px;color:var(--faint)">Carregando…</div>
      </div>

      <!-- Terminal log -->
      <div class="card st-card">
        <h3>Log de Atividade</h3>
        <div class="term-log">
          <span v-if="!activities.length" class="tl" style="color:#4b5563">Sem atividades recentes.</span>
          <span class="tl" v-for="(l, i) in activities" :key="i">
            <span class="tl-t">[{{ fmtActTime(l.created_at) }}]</span>
            <span class="tl-v"> {{ l.action }}</span>
            <span class="tl-f"> {{ l.filename || l.rel_path || '' }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/api/client'

const lastUpdate = ref(0)
const loading = ref(false)
const status = ref(null)
const activities = ref([])

let ticker = null

const gauges = computed(() => {
  if (!status.value) return []
  const { metrics, disk } = status.value
  const overall = status.value.overall_status || (metrics ? 'ok' : 'unknown')
  return [
    { label: 'Sistema',  pct: overall === 'ok' ? 100 : 60,  color: overall === 'ok' ? '#10b981' : '#f59e0b', display: overall === 'ok' ? '● Online' : '● Atenção' },
    { label: 'CPU',      pct: metrics?.cpu || 0,              color: (metrics?.cpu || 0) > 85 ? '#ef4444' : '#f59e0b',  display: `${Math.round(metrics?.cpu || 0)}%` },
    { label: 'RAM',      pct: metrics?.ram || 0,              color: (metrics?.ram || 0) > 85 ? '#ef4444' : 'var(--accent)',  display: `${Math.round(metrics?.ram || 0)}%` },
    { label: 'Disco',    pct: disk?.usage_percent || 0,       color: (disk?.usage_percent || 0) > 90 ? '#ef4444' : '#10b981', display: `${Math.round(disk?.usage_percent || 0)}%` },
  ]
})

const idxStats = computed(() => {
  const idx = status.value?.indexer
  if (!idx) return []
  return [
    { val: idx.processed?.toLocaleString('pt-BR') || '0', label: 'Indexados',   color: 'var(--heading)' },
    { val: idx.last_new != null ? `+${idx.last_new}` : '—',     label: 'Novos',      color: '#10b981' },
    { val: idx.last_updated != null ? `+${idx.last_updated}` : '—', label: 'Atualizados', color: 'var(--accent)' },
    { val: idx.last_error || '0',                                label: 'Erros',      color: '#ef4444' },
    { val: idx.speed ? `${idx.speed}/s` : '—',                  label: 'Velocidade', color: 'var(--heading)' },
    { val: idx.percent ? `${idx.percent}%` : '—',               label: '% concluído', color: 'var(--muted)' },
  ]
})

const services = computed(() => {
  const s = status.value?.services
  return [
    { name: 'API Backend', on: true },
    { name: 'rclone',      on: s?.rclone_active ?? false },
  ]
})

const storInfo = computed(() => {
  const d = status.value?.disk
  if (!d) return null
  return {
    used: `${d.used_tb} TB`, free: `${d.free_tb} TB`, total: `${d.total_tb} TB`,
    pct: d.usage_percent || 0,
  }
})

function fmtActTime(d) {
  if (!d) return ''
  const dt = new Date(d.includes('T') ? d : d.replace(' ', 'T'))
  return isNaN(dt.getTime()) ? d : dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
}

async function refresh() {
  lastUpdate.value = 0
  loading.value = true
  try {
    const [s, a] = await Promise.all([
      api.get('/api/full-status'),
      api.get('/api/activities', { params: { limit: 10 } }),
    ])
    status.value = s.data
    activities.value = Array.isArray(a.data) ? a.data : (a.data.activities || [])
  } catch { /* ignore */ } finally { loading.value = false }
}

onMounted(() => {
  refresh()
  ticker = setInterval(() => lastUpdate.value++, 1000)
})

onUnmounted(() => clearInterval(ticker))
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 22px 20px; }
.pg-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.pg-hd h1 { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); letter-spacing: -.5px; margin: 0 0 4px; }
.pg-hd p { font-size: 12px; color: var(--muted); margin: 0; }

.st-top { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 14px; }
.gauge-c { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 18px 20px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,.06); }
.g-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--faint); margin-bottom: 12px; }
.g-num { font-size: 20px; font-weight: 700; margin-top: 8px; font-variant-numeric: tabular-nums; font-family: Montserrat, system-ui, sans-serif; }

.st-mid { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 12px; }
.st-bot { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.st-card { padding: 18px 20px; }
.st-card h3 { font-family: Montserrat, system-ui, sans-serif; font-size: 14px; font-weight: 700; color: var(--heading); margin: 0 0 14px; }

.prog-wrap { margin-bottom: 12px; }
.prog-lbls { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: var(--muted); }
.prog-track { background: var(--elevated); border-radius: 6px; height: 8px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg,var(--accent),#FFD900); }
.idx-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 14px; }
.idx-s { background: var(--elevated); border-radius: 10px; padding: 10px; text-align: center; }
.idx-sv { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; font-family: Montserrat, system-ui, sans-serif; }
.idx-sl { font-size: 10px; color: var(--faint); margin-top: 2px; }

.svc-list { display: flex; flex-direction: column; gap: 2px; }
.svc-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-sub); font-size: 13px; }
.svc-row:last-child { border-bottom: none; }

.stor-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; color: var(--muted); }
.stor-row span:last-child { font-weight: 600; color: var(--text); font-variant-numeric: tabular-nums; }
.stor-seg { display: flex; height: 8px; border-radius: 6px; overflow: hidden; gap: 1px; margin: 12px 0 8px; }
.stor-leg { display: flex; gap: 12px; flex-wrap: wrap; }
.leg-i { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--muted); }
.leg-d { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }

.term-log { font-family: 'Courier New', monospace; font-size: 11px; background: #050508; padding: 12px 14px; border-radius: 10px; max-height: 200px; overflow-y: auto; line-height: 1.9; }
.tl { display: block; }
.tl-t { color: #4b5563; }
.tl-u { color: var(--accent); }
.tl-v { color: #f59e0b; }
.tl-f { color: #10b981; }
</style>

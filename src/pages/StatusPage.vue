<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import api from '../services/api'
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  Terminal,
  Database,
  Clock3,
} from 'lucide-vue-next'

const loading = ref(false)
const error = ref('')

const authUser = computed(() => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Erro ao ler usuário do localStorage:', error)
    return null
  }
})

const status = ref({
  overall_status: '...',
  metrics: {
    cpu: 0,
    ram: 0,
  },
  disk: {
    usage_percent: 0,
    used_tb: 0,
    free_tb: 0,
    total_tb: 0,
  },
  services: {
    rclone_active: false,
  },
})

const indexer = ref({
  processed: 0,
  total: 0,
  percent: 0,
  speed: 0,
  eta_sec: 0,
  last_new: 0,
  last_updated: 0,
  last_deleted: 0,
  last_finished_time: null,
})

const activities = ref([])

function formatNumber(value) {
  if (value == null) return '--'
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatTerminalTime(value) {
  if (!value) return '--'
  return String(value).replace('T', ' ').slice(0, 19)
}

function formatDateTime(value) {
  if (!value) return '--'

  try {
    const timestamp = Number(value)

    if (!Number.isNaN(timestamp)) {
      const date = new Date(timestamp * 1000)
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(date)
    }

    const date = new Date(value)
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(date)
  } catch {
    return value
  }
}

function normalizeActionLabel(action) {
  if (!action) return 'evento'

const map = {
  preview: 'visualizado',
  download: 'baixado',
  search: 'busca realizada',
  open_details: 'detalhes abertos',
  copy_path: 'caminho copiado',
  test: 'teste',
}

  return map[String(action).toLowerCase()] || String(action).toLowerCase()
}

function terminalOutput(activity) {
  const action = normalizeActionLabel(activity?.action)
  const file = activity?.filename || activity?.rel_path || '--'

  return [
    '$ noxis activity',
    `> arquivo: ${file}`,
    `> ação: ${action}`,
    '> status: concluído',
    `> horário: ${formatTerminalTime(activity?.created_at)}`,
  ]
}

function belongsToLoggedUser(activity) {
  const user = authUser.value
  if (!user || !activity) return false

  const loggedId = user.id != null ? String(user.id) : null
  const loggedEmail = user.email ? String(user.email).toLowerCase() : null
  const loggedName = (user.name || user.nome) ? String(user.name || user.nome).toLowerCase() : null

  const activityUserId =
    activity.user_id ??
    activity.usuario_id ??
    activity.user?.id ??
    activity.usuario?.id

  const activityEmail =
    activity.user_email ??
    activity.email ??
    activity.user?.email ??
    activity.usuario?.email

  const activityName =
    activity.user_name ??
    activity.nome ??
    activity.user?.name ??
    activity.user?.nome ??
    activity.usuario?.name ??
    activity.usuario?.nome

  if (loggedId && activityUserId != null && String(activityUserId) === loggedId) {
    return true
  }

  if (
    loggedEmail &&
    activityEmail &&
    String(activityEmail).toLowerCase() === loggedEmail
  ) {
    return true
  }

  if (
    loggedName &&
    activityName &&
    String(activityName).toLowerCase() === loggedName
  ) {
    return true
  }

  return false
}

const userActivities = computed(() => {
  return activities.value.slice(0, 6)
})

async function fetchStatus() {
  loading.value = true
  error.value = ''

  try {
    const [statusRes, indexerRes, activitiesRes] = await Promise.all([
      api.get('/api/status'),
      api.get('/api/index-status'),
      api.get('/api/activities/me?limit=6')
    ])

    status.value = statusRes.data
    indexer.value = indexerRes.data
    activities.value = Array.isArray(activitiesRes.data) ? activitiesRes.data : []
  } catch {
    error.value = 'Não foi possível carregar os dados do status.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStatus()
})
</script>

<template>
  <AppLayout title="Status">
    <div class="grid gap-6">
      <div>
        <div class="mb-2 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
          <span>Noxis</span>
          <span>/</span>
          <span class="font-medium text-[var(--app-text-soft)]">Status</span>
        </div>

        <h1 class="text-[34px] font-semibold tracking-[-0.04em] text-[var(--app-text)]">
          Status do sistema
        </h1>

        <p class="mt-1 text-sm text-[var(--app-text-muted)]">
          Monitoramento do indexador e visão das suas atividades recentes.
        </p>
      </div>

      <section
        v-if="error"
        class="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      >
        {{ error }}
      </section>

      <section class="grid gap-4 md:grid-cols-4">
        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
            <Activity class="h-4 w-4" />
            Status geral
          </div>
          <div class="text-3xl font-semibold capitalize text-[var(--app-text)]">
            {{ status.overall_status }}
          </div>
        </div>

        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
            <Cpu class="h-4 w-4" />
            CPU
          </div>
          <div class="text-3xl font-semibold text-[var(--app-text)]">
            {{ status.metrics.cpu }}%
          </div>
        </div>

        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
            <MemoryStick class="h-4 w-4" />
            RAM
          </div>
          <div class="text-3xl font-semibold text-[var(--app-text)]">
            {{ status.metrics.ram }}%
          </div>
        </div>

        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-3 flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
            <HardDrive class="h-4 w-4" />
            Disco
          </div>
          <div class="text-3xl font-semibold text-[var(--app-text)]">
            {{ status.disk.usage_percent }}%
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-[var(--app-text)]">Indexação</h2>
            <p class="mt-1 text-sm text-[var(--app-text-muted)]">
              Visão atual do worker e do volume processado.
            </p>
          </div>

          <div class="mb-5 h-3 overflow-hidden rounded-full bg-[var(--app-surface-3)]">
            <div
              class="h-full rounded-full bg-[var(--app-primary)]"
              :style="{ width: `${indexer.percent || 0}%` }"
            ></div>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Percentual</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ indexer.percent }}%
              </div>
            </div>

            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Processados</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ formatNumber(indexer.processed) }}
              </div>
            </div>

            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Velocidade</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ formatNumber(indexer.speed) }}
              </div>
            </div>

            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Novos</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ formatNumber(indexer.last_new) }}
              </div>
            </div>

            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Atualizados</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ formatNumber(indexer.last_updated) }}
              </div>
            </div>

            <div class="rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
              <div class="text-sm text-[var(--app-text-subtle)]">Removidos</div>
              <div class="mt-1 text-xl font-semibold text-[var(--app-text)]">
                {{ formatNumber(indexer.last_deleted) }}
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-2xl bg-[var(--app-surface-3)] px-4 py-3">
            <div class="flex items-center gap-2 text-sm text-[var(--app-text-subtle)]">
              <Clock3 class="h-4 w-4" />
              Última execução
            </div>
            <div class="mt-1 text-base font-semibold text-[var(--app-text)]">
              {{ formatDateTime(indexer.last_finished_time) }}
            </div>
          </div>
        </div>

        <div class="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
          <div class="mb-4 flex items-start justify-between">
            <div>
              <h2 class="flex items-center gap-2 text-xl font-semibold text-[var(--app-text)]">
                <Terminal class="h-5 w-5 text-[var(--app-primary)]" />
                Suas atividades recentes
              </h2>
              <p class="mt-1 text-sm text-[var(--app-text-muted)]">
                Ações relacionadas à sua conta.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span class="h-3 w-3 rounded-full bg-[#FF5F57]"></span>
              <span class="h-3 w-3 rounded-full bg-[#FEBC2E]"></span>
              <span class="h-3 w-3 rounded-full bg-[#28C840]"></span>
            </div>
          </div>

          <div class="overflow-hidden rounded-[20px] border border-[var(--app-border)] bg-[var(--app-terminal)]">
            <div class="border-b border-[var(--app-border)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[var(--app-text-subtle)]">
              noxis@activity:~$
            </div>

            <div v-if="loading" class="px-4 py-8 font-mono text-sm text-[var(--app-text-subtle)]">
              <span class="text-[var(--app-primary)]">$</span> carregando atividades...
            </div>

            <div v-else-if="userActivities.length" class="space-y-0 font-mono text-sm">
              <div
                v-for="(activity, index) in userActivities"
                :key="index"
                class="border-b border-[var(--app-border-soft)] px-4 py-4 last:border-b-0"
              >
                <div
                  v-for="line in terminalOutput(activity)"
                  :key="line"
                  class="mb-1 break-all text-[var(--app-text-soft)] last:mb-0"
                >
                  <span
                    v-if="line.startsWith('$')"
                    class="text-[var(--app-primary)]"
                  >
                    {{ line }}
                  </span>
                  <span
                    v-else
                    class="text-[var(--app-text-muted)]"
                  >
                    {{ line }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="px-4 py-8 font-mono text-sm text-[var(--app-text-subtle)]">
              <span class="text-[var(--app-primary)]">$</span> nenhuma atividade encontrada para o usuário logado...
            </div>
          </div>

          <div class="mt-4 rounded-[20px] border border-[var(--app-border)] bg-[var(--app-terminal)] px-4 py-4 font-mono text-sm text-[var(--app-text-soft)]">
            <div class="mb-2 flex items-center gap-2 text-[var(--app-text-subtle)]">
              <Database class="h-4 w-4" />
              noxis status
            </div>

            <div class="space-y-1">
              <p>
                <span class="text-emerald-400">✔</span> rclone:
                {{ status.services.rclone_active ? 'ativo' : 'inativo' }}
              </p>
              <p>
                <span class="text-emerald-400">✔</span> disco usado:
                {{ status.disk.used_tb }} TB
              </p>
              <p>
                <span class="text-emerald-400">✔</span> disco livre:
                {{ status.disk.free_tb }} TB
              </p>
              <p>
                <span class="text-emerald-400">✔</span> total:
                {{ status.disk.total_tb }} TB
              </p>
              <p>
                <span class="text-emerald-400">✔</span> status geral:
                {{ status.overall_status }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
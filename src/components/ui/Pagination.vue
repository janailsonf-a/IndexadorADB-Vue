<template>
  <nav class="pg" role="navigation" aria-label="Paginação">
    <button
      class="pg-btn pg-nav"
      :disabled="page <= 1 || loading"
      aria-label="Página anterior"
      @click="go(page - 1)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      Anterior
    </button>

    <div class="pg-nums">
      <template v-for="(p, i) in pageNumbers" :key="`${p}-${i}`">
        <span v-if="p === '…'" class="pg-gap" aria-hidden="true">…</span>
        <button
          v-else
          class="pg-btn pg-num"
          :class="{ active: p === page }"
          :disabled="loading"
          :aria-current="p === page ? 'page' : undefined"
          :aria-label="`Página ${p}`"
          @click="go(p)"
        >{{ p.toLocaleString('pt-BR') }}</button>
      </template>
    </div>

    <button
      class="pg-btn pg-nav"
      :disabled="page >= totalPages || loading"
      aria-label="Próxima página"
      @click="go(page + 1)"
    >
      Próxima
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>

    <!-- com dezenas de milhares de páginas, clicar de 1 em 1 não serve -->
    <form v-if="totalPages > 10" class="pg-jump" @submit.prevent="jump">
      <label class="pg-jump-lbl" for="pg-jump-input">Ir para</label>
      <input
        id="pg-jump-input"
        v-model="jumpValue"
        class="pg-jump-input"
        type="number"
        min="1"
        :max="totalPages"
        :placeholder="String(page)"
        :disabled="loading"
      >
      <button class="pg-btn pg-jump-btn" type="submit" :disabled="loading">Ir</button>
    </form>

    <span class="pg-info">
      {{ page.toLocaleString('pt-BR') }} de {{ totalPages.toLocaleString('pt-BR') }}
      <span class="pg-info-total">· {{ totalItems.toLocaleString('pt-BR') }} arquivo{{ totalItems !== 1 ? 's' : '' }}</span>
    </span>
  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, default: 1 },
  totalItems: { type: Number, default: 0 },
  loading: Boolean,
})
const emit = defineEmits(['change'])

const jumpValue = ref('')

function go(n) {
  const target = Math.min(Math.max(1, n), props.totalPages)
  if (target !== props.page) emit('change', target)
}

function jump() {
  const n = parseInt(jumpValue.value, 10)
  if (!Number.isNaN(n)) {
    go(n)
    jumpValue.value = ''
  }
}

// janela deslizante em volta da página atual, sempre com primeira e última
const pageNumbers = computed(() => {
  const total = props.totalPages
  const cur = props.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const out = [1]
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)

  if (start > 2) out.push('…')
  for (let p = start; p <= end; p++) out.push(p)
  if (end < total - 1) out.push('…')
  out.push(total)

  return out
})
</script>

<style scoped>
.pg {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 24px 0 8px;
}

.pg-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: var(--card);
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color .12s, color .12s, background .12s;
}
.pg-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.pg-btn:disabled { opacity: .45; cursor: default; }
.pg-btn svg { width: 14px; height: 14px; }

.pg-nums { display: flex; align-items: center; gap: 4px; }
.pg-num { min-width: 34px; justify-content: center; padding: 0 8px; font-variant-numeric: tabular-nums; }
.pg-num.active {
  border-color: var(--accent);
  background: rgba(255,107,0,.1);
  color: var(--accent);
  font-weight: 700;
}
.pg-gap { color: var(--faint); padding: 0 2px; font-size: 13px; }

.pg-jump { display: flex; align-items: center; gap: 6px; margin-left: 4px; }
.pg-jump-lbl { font-size: 12px; color: var(--faint); }
.pg-jump-input {
  width: 78px;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: var(--elevated);
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  font-variant-numeric: tabular-nums;
}
.pg-jump-input:focus { border-color: var(--accent); }

.pg-info {
  font-size: 12px;
  color: var(--faint);
  margin-left: 6px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pg-info-total { color: var(--faint); }

@media (max-width: 720px) {
  .pg-nav span { display: none; }
  .pg-info { width: 100%; text-align: center; margin-left: 0; }
}
</style>

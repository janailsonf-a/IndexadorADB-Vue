<template>
  <div class="err-wrap">
    <div class="err-card">
      <div class="err-ico" v-html="ICONS.compass"></div>
      <h2>Página não encontrada</h2>
      <p>O endereço <code>{{ path }}</code> não existe ou foi movido.</p>
      <RouterLink to="/acervo" class="btn-primary">Voltar ao Acervo</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ICONS } from '@/lib/icons'
const route = useRoute()
const path = route.fullPath
</script>

<style scoped>
.err-wrap {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 40px; background: var(--bg);
}
.err-card {
  background: var(--card); border: 1px solid var(--border); border-radius: 20px;
  padding: 56px 48px; text-align: center; max-width: 420px;
}
.err-ico { font-size: 48px; margin-bottom: 16px; }
.err-ico :deep(svg) { width: 1em; height: 1em; }
.err-card h2 { font-family: Montserrat, system-ui, sans-serif; font-size: 20px; font-weight: 800; color: var(--heading); margin-bottom: 8px; }
.err-card p { font-size: 13px; color: var(--muted); line-height: 1.5; margin-bottom: 24px; word-break: break-word; }
.err-card code { background: var(--elevated); padding: 2px 6px; border-radius: 6px; font-size: 12px; }
.btn-primary { text-decoration: none; }
</style>

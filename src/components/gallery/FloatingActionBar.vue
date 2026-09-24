<template>
  <Transition name="fbar">
    <div v-if="count > 0" class="fbar">
      <span class="fb-ct">{{ count }} arquivo{{ count !== 1 ? 's' : '' }} selecionado{{ count !== 1 ? 's' : '' }}</span>
      <div class="fb-div"></div>
      <button class="fb-btn" @click="$emit('download')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download ZIP
      </button>
      <button class="fb-btn" @click="$emit('campaign')" v-if="auth.isEditor">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></svg>
        Campanha
      </button>
      <button class="fb-btn" @click="$emit('collection')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
        Coleção
      </button>
      <button class="fb-btn" @click="$emit('trash')" v-if="auth.isEditor">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        Lixeira
      </button>
      <slot name="extra"></slot>
      <div class="fb-div"></div>
      <button class="fb-btn fb-x" @click="$emit('clear')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Cancelar
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
defineProps({ count: Number })
defineEmits(['download', 'campaign', 'collection', 'trash', 'clear'])
const auth = useAuthStore()
</script>

<style scoped>
.fbar {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #1a1a1a; border: 1px solid #333; border-radius: 999px;
  padding: 12px 20px; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
  z-index: 100; white-space: nowrap;
}
.fb-ct {
  font-size: 12px; font-weight: 700; color: #fff;
  background: var(--accent); padding: 4px 10px; border-radius: 999px;
  font-variant-numeric: tabular-nums; margin-right: 2px;
}
.fb-div { width: 1px; height: 18px; background: #444; flex-shrink: 0; }
.fb-btn {
  background: none; border: none; color: rgba(255,255,255,.7); font-size: 12px; font-weight: 500;
  padding: 5px 10px; border-radius: 8px; display: flex; align-items: center;
  gap: 5px; transition: background .12s, color .12s; cursor: pointer; font-family: inherit;
}
.fb-btn:hover { background: rgba(255,255,255,.1); color: #fff; }
.fb-btn svg { width: 13px; height: 13px; }
.fb-x { color: rgba(255,255,255,.5); }
.fb-x:hover { color: #ef4444 !important; background: rgba(239,68,68,.1) !important; }

.fbar-enter-active, .fbar-leave-active { transition: opacity .2s, transform .2s; }
.fbar-enter-from, .fbar-leave-to { opacity: 0; transform: translateX(-50%) translateY(16px); }
</style>

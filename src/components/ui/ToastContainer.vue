<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast">
        <div
          v-for="t in toast.toasts"
          :key="t.id"
          class="toast-item"
          :class="`toast-${t.type}`"
          @click="toast.remove(t.id)"
        >
          <span class="toast-ico" v-html="icons[t.type]"></span>
          <span class="toast-msg">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()

const icons = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  warn:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
}
</script>

<style scoped>
.toast-stack {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px; align-items: flex-end; pointer-events: none;
}
.toast-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px; border-radius: 10px; min-width: 240px; max-width: 380px;
  font-size: 13px; font-weight: 500; font-family: inherit;
  box-shadow: 0 8px 28px rgba(0,0,0,.22); cursor: pointer; pointer-events: all;
  border: 1px solid transparent;
}
.toast-ico { width: 16px; height: 16px; flex-shrink: 0; }
.toast-ico :deep(svg) { width: 100%; height: 100%; }
.toast-msg { flex: 1; line-height: 1.4; }

.toast-success { background: var(--toast-success-bg); color: var(--toast-success-fg); border-color: var(--toast-success-bd); }
.toast-error   { background: var(--toast-error-bg); color: var(--toast-error-fg); border-color: var(--toast-error-bd); }
.toast-warn    { background: var(--toast-warn-bg); color: var(--toast-warn-fg); border-color: var(--toast-warn-bd); }
.toast-info    { background: var(--toast-info-bg); color: var(--toast-info-fg); border-color: var(--toast-info-bd); }

.toast-enter-active { transition: all .25s cubic-bezier(0.34,1.56,0.64,1); }
.toast-leave-active { transition: all .18s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(24px) scale(.92); }
.toast-leave-to     { opacity: 0; transform: translateX(24px); }
</style>

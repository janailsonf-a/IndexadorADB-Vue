<template>
  <div class="skel-grid" :style="{ '--gs': gridSize + 'px' }">
    <div v-for="i in count" :key="i" class="skel-card">
      <div class="skel-thumb"></div>
      <div class="skel-line skel-line-lg"></div>
      <div class="skel-line skel-line-sm"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 12 },
  gridSize: { type: Number, default: 200 },
})
</script>

<style scoped>
.skel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--gs, 200px), 1fr));
  gap: 12px;
}
.skel-card {
  border-radius: 12px; overflow: hidden; background: var(--card); border: 1.5px solid var(--border);
}
.skel-thumb { aspect-ratio: 4/3; background: var(--elevated); }
.skel-line { height: 10px; margin: 10px 12px; border-radius: 4px; background: var(--elevated); }
.skel-line-lg { width: 70%; }
.skel-line-sm { width: 40%; margin-top: 6px; margin-bottom: 12px; }

.skel-thumb, .skel-line {
  position: relative; overflow: hidden;
}
.skel-thumb::after, .skel-line::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent);
  animation: skel-shimmer 1.4s infinite;
}
html.dark .skel-thumb::after, html.dark .skel-line::after {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent);
}
@keyframes skel-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>

<template>
  <div
    class="fc" :class="{ sel: isSelected }" tabindex="0" role="button"
    :aria-label="`Abrir ${file.name}`"
    @click.exact="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >

    <!-- Thumbnail area -->
    <div class="fc-thumb-wrap">
      <div class="fc-bg" :style="{ background: ft.bg }">
        <img v-if="file.thumbnail" :src="file.thumbnail" class="fc-img" alt="" loading="lazy">
        <span v-else class="fc-ico" v-html="ft.icon"></span>
      </div>

      <!-- Type badge (always visible) -->
      <span class="fc-type-badge">{{ typeBadge }}</span>

      <!-- Video duration -->
      <span v-if="file.duration" class="fc-duration">{{ file.duration }}</span>

      <!-- Checkbox -->
      <button class="fc-chk" :class="{ on: isSelected }" :aria-label="isSelected ? 'Desmarcar arquivo' : 'Selecionar arquivo'" :aria-pressed="isSelected" @click.stop="$emit('select', file.id)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </button>

      <!-- Hover quick actions -->
      <div class="fc-top-acts">
        <button class="fc-act" aria-label="Visualizar" title="Visualizar" @click.stop="$emit('preview', file)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="fc-act" aria-label="Baixar arquivo" title="Baixar" @click.stop="$emit('download', file)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button v-if="showTrash" class="fc-act" aria-label="Mover para lixeira" title="Mover para lixeira" @click.stop="$emit('trash', file)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>

      <!-- Favorite star -->
      <button class="fc-star" :class="{ on: file.starred }" :aria-label="file.starred ? 'Remover dos favoritos' : 'Adicionar aos favoritos'" :aria-pressed="!!file.starred" title="Favoritar" @click.stop="$emit('star', file.id)">
        <svg viewBox="0 0 24 24" :fill="file.starred ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <!-- Info below thumbnail -->
    <div class="fc-info">
      <div class="fc-name" :title="file.name">{{ file.name }}</div>
      <div class="fc-meta">{{ file.size }} · {{ formatDate(file.date) }}</div>
      <div v-if="file.campaign" class="fc-campaign">{{ file.campaign }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFileType, getFileType } from '@/composables/useFileType'

const props = defineProps({
  file: { type: Object, required: true },
  isSelected: Boolean,
  showTrash: Boolean,
})
const emit = defineEmits(['click', 'select', 'preview', 'download', 'star', 'trash'])

const ft = computed(() => useFileType(props.file.type || getFileType(props.file.name)))

const typeBadge = computed(() => {
  const ext = props.file.name?.split('.').pop()?.toUpperCase() || props.file.type?.toUpperCase() || '—'
  return ext.length > 4 ? props.file.type?.toUpperCase() || ext : ext
})

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function handleClick() { emit('click', props.file) }
</script>

<style scoped>
.fc {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow .15s, transform .1s;
  background: var(--card);
  border: 1.5px solid var(--border);
}
.fc:hover { box-shadow: 0 8px 24px rgba(0,0,0,.1); transform: translateY(-2px); }
.fc.sel { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(255,107,0,.25); }

/* Thumbnail */
.fc-thumb-wrap {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: var(--elevated);
}
.fc-bg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.fc-img { width: 100%; height: 100%; object-fit: cover; }
.fc-ico { width: 38%; height: 38%; color: rgba(255,255,255,.85); filter: drop-shadow(0 2px 8px rgba(0,0,0,.4)); }
.fc-ico :deep(svg) { width: 100%; height: 100%; }

/* Badges */
.fc-type-badge {
  position: absolute; top: 8px; left: 8px;
  background: rgba(0,0,0,.55); color: #fff; font-size: 10px; font-weight: 700;
  padding: 2px 6px; border-radius: 5px; letter-spacing: .3px; backdrop-filter: blur(4px);
  font-family: monospace;
}

.fc-duration {
  position: absolute; bottom: 8px; left: 8px;
  background: rgba(0,0,0,.6); color: #fff; font-size: 10px; font-weight: 600;
  padding: 2px 6px; border-radius: 5px; backdrop-filter: blur(4px);
}

/* Checkbox */
.fc-chk {
  position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,.8); background: rgba(0,0,0,.35);
  opacity: 0; transition: opacity .15s, background .15s, border-color .15s;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.fc:hover .fc-chk, .fc.sel .fc-chk { opacity: 1; }
.fc-chk.on { background: var(--accent); border-color: var(--accent); }
.fc-chk svg { width: 11px; height: 11px; color: #fff; }

/* Quick actions */
.fc-top-acts {
  position: absolute; bottom: 8px; left: 8px; display: flex; gap: 4px;
  opacity: 0; transition: opacity .15s;
}
.fc:hover .fc-top-acts { opacity: 1; }
.fc-act {
  width: 26px; height: 26px; border-radius: 7px; background: rgba(0,0,0,.5); border: none;
  color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; backdrop-filter: blur(4px); transition: background .12s;
}
.fc-act:hover { background: rgba(0,0,0,.8); }
.fc-act svg { width: 12px; height: 12px; }

/* Star */
.fc-star {
  position: absolute; top: 36px; right: 8px; width: 24px; height: 24px;
  background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .15s, color .15s; color: rgba(255,255,255,.7);
}
.fc:hover .fc-star { opacity: 1; }
.fc-star.on { opacity: 1; color: #FFD900; }
.fc-star svg { width: 14px; height: 14px; filter: drop-shadow(0 1px 3px rgba(0,0,0,.5)); }

/* Info below */
.fc-info { padding: 10px 12px 11px; }
.fc-name {
  font-size: 12px; font-weight: 500; color: var(--text); line-height: 1.4;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px;
}
.fc-meta { font-size: 11px; color: var(--faint); }
.fc-campaign { font-size: 11px; color: var(--accent); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>

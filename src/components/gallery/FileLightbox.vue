<template>
  <Teleport to="body">
    <Transition name="lbox">
      <div v-if="file" class="lbox" @keydown.esc="$emit('close')" tabindex="-1" ref="lboxEl">
        <!-- Top bar -->
        <div class="lbox-top">
          <div class="lbox-inf">
            <div class="lbox-fn">{{ file.name }}</div>
            <div class="lbox-meta">{{ file.size }} · {{ ft.label }} · {{ fmtDate(file.date) }}</div>
          </div>
          <div class="lbox-acts">
            <button class="lbox-btn" @click="copyLink" :class="{ active: linkCopied }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              {{ linkCopied ? 'Copiado!' : 'Copiar link' }}
            </button>
            <button class="lbox-btn" @click="$emit('download', file)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
            <button v-if="auth.isEditor" class="lbox-btn" :class="{ active: editing }" @click="toggleEdit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {{ editing ? 'Cancelar' : 'Editar' }}
            </button>
            <button class="lbox-btn lbox-x" @click="$emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Fechar
            </button>
          </div>
        </div>

        <!-- Viewer -->
        <div class="lbox-viewer">
          <button class="lbox-nav prev" @click="$emit('prev')" title="Anterior (←)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="lbox-file">
            <!-- tipo antes de thumbnail: vídeo também tem thumbnail agora, e aqui
                 tem que abrir o player, não o quadro estático -->
            <video
              v-if="file.type === 'vid'"
              :src="file.preview_link"
              :poster="file.thumbnail || undefined"
              controls
              preload="metadata"
              class="lbox-video"
            ></video>
            <img v-else-if="file.type === 'img' || file.thumbnail" :src="file.thumbnail || '/placeholder.jpg'" class="lbox-img" alt="">
            <iframe v-else-if="file.type === 'pdf'" :src="file.preview_link" class="lbox-pdf"></iframe>
            <div v-else-if="file.type === 'aud'" class="lbox-icon-view" :style="{ background: ft.bg }">
              <span class="lbox-type-ico" v-html="ft.icon"></span>
              <audio :src="file.download_link" controls class="lbox-audio"></audio>
            </div>
            <div v-else class="lbox-icon-view" :style="{ background: ft.bg }">
              <span class="lbox-type-ico" v-html="ft.icon"></span>
              <div class="lbox-open-hint">
                <a v-if="file.preview_link" :href="file.preview_link" target="_blank" class="btn-primary" style="text-decoration:none">Abrir arquivo</a>
                <button class="btn-primary" style="margin-left:8px" @click="$emit('download', file)">Download</button>
              </div>
            </div>
          </div>
          <button class="lbox-nav next" @click="$emit('next')" title="Próximo (→)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- Bottom panel -->
        <div class="lbox-bot" :class="{ 'lbox-bot-edit': editing, 'lbox-bot-audit': showAudit }">
          <template v-if="!editing">
            <div class="lbox-sec">
              <h4>Detalhes</h4>
              <div class="lbox-row"><span>Tamanho</span><span>{{ audit?.indice?.tamanho_humano || file.size }}</span></div>
              <div class="lbox-row"><span>Tipo</span><span>{{ ft.label }}</span></div>
              <div class="lbox-row" v-if="audit?.tecnico?.dimensoes">
                <span>Dimensões</span><span>{{ audit.tecnico.dimensoes }}</span>
              </div>
              <div class="lbox-row" v-if="audit?.tecnico?.proporcao">
                <span>Proporção</span><span>{{ audit.tecnico.proporcao }}<template v-if="audit.tecnico.megapixels"> · {{ audit.tecnico.megapixels }} MP</template></span>
              </div>
              <div class="lbox-row" v-if="audit?.tecnico?.duracao">
                <span>Duração</span><span>{{ audit.tecnico.duracao }}<template v-if="audit.tecnico.fps"> · {{ audit.tecnico.fps }} fps</template></span>
              </div>
              <div class="lbox-row"><span>Data</span><span>{{ fmtDate(file.date) }}</span></div>
              <div class="lbox-row" v-if="audit?.origem">
                <span>Origem</span>
                <span :title="audit.origem.detalhe">
                  {{ audit.origem.rotulo }}
                  <span v-if="audit.origem.somente_leitura" class="lbox-ro">somente leitura</span>
                </span>
              </div>
              <div class="lbox-row" v-if="file.rel_path"><span>Caminho</span><span class="lbox-path">{{ file.rel_path }}</span></div>

              <button class="lbox-audit-toggle" @click="showAudit = !showAudit">
                {{ showAudit ? 'Ocultar auditoria técnica' : 'Ver auditoria técnica' }}
              </button>

            </div>
            <div class="lbox-sec">
              <h4>Campanha &amp; Info</h4>
              <div class="lbox-row"><span>Título</span><span>{{ metaLoaded?.title || file.title || '—' }}</span></div>
              <div class="lbox-row"><span>Campanha</span><span>{{ metaLoaded?.campaign || file.campaign || '—' }}</span></div>
              <div class="lbox-row" v-if="metaLoaded?.description"><span>Descrição</span><span style="max-width:160px;text-align:right">{{ metaLoaded.description }}</span></div>
              <div class="lbox-row" style="margin-top:6px">
                <span>Oficial</span>
                <span :class="metaLoaded?.is_official ? 'pill-ok' : 'pill-draft'">{{ metaLoaded?.is_official ? 'Sim' : 'Não' }}</span>
              </div>
            </div>
            <div class="lbox-sec">
              <h4>Tags</h4>
              <div class="tag-list">
                <span v-for="t in (metaLoaded?.tags || file.tags || [])" :key="t" class="tag-p">{{ t }}</span>
                <span v-if="!(metaLoaded?.tags?.length || file.tags?.length)" style="color:rgba(255,255,255,.3);font-size:12px">Sem tags</span>
              </div>
            </div>

            <!-- Auditoria ocupa a largura toda: caminho absoluto nao cabe numa coluna de 1/3. -->
            <div v-if="showAudit" class="lbox-audit">
              <div v-if="auditLoading" class="lbox-audit-load">Lendo o arquivo…</div>
              <template v-else-if="audit">
                <div class="lbox-audit-cols">
                  <div>
                    <div class="lbox-audit-grp">Conteúdo</div>
                    <div class="lbox-row" v-if="audit.mime"><span>MIME</span><span>{{ audit.mime }}</span></div>
                    <div class="lbox-row" v-if="audit.tecnico.formato"><span>Formato</span><span>{{ audit.tecnico.formato }}</span></div>
                    <div class="lbox-row" v-if="audit.tecnico.codec_video"><span>{{ audit.mime?.startsWith('image/') ? 'Codec' : 'Codec vídeo' }}</span><span>{{ audit.tecnico.codec_video }}</span></div>
                    <div class="lbox-row" v-if="audit.tecnico.codec_audio"><span>Codec áudio</span><span>{{ audit.tecnico.codec_audio }}<template v-if="audit.tecnico.canais"> · {{ audit.tecnico.canais }} canais</template></span></div>
                    <div class="lbox-row" v-if="audit.tecnico.taxa_amostragem"><span>Amostragem</span><span>{{ audit.tecnico.taxa_amostragem }}</span></div>
                    <div class="lbox-row" v-if="audit.tecnico.bitrate"><span>Bitrate</span><span>{{ audit.tecnico.bitrate }}</span></div>
                  </div>
                  <div>
                    <div class="lbox-audit-grp">Armazenamento</div>
                    <div class="lbox-row"><span>Servidor</span><span class="lbox-path lbox-wrap">{{ audit.origem.detalhe }}</span></div>
                    <div class="lbox-row"><span>Caminho absoluto</span><span class="lbox-path lbox-wrap">{{ audit.indice.caminho_absoluto }}</span></div>
                    <div class="lbox-row"><span>Bytes exatos</span><span>{{ audit.indice.tamanho_bytes?.toLocaleString('pt-BR') }}</span></div>
                    <div class="lbox-row" v-if="audit.disco.existe">
                      <span>Permissões</span><span>{{ audit.disco.permissoes }} · inode {{ audit.disco.inode }}</span>
                    </div>
                    <div class="lbox-row" v-if="audit.disco.modificado_em">
                      <span>Modificado (disco)</span><span>{{ fmtDateTime(audit.disco.modificado_em) }}</span>
                    </div>
                  </div>
                  <div>
                    <div class="lbox-audit-grp">Índice</div>
                    <div class="lbox-row"><span>ID no Indexador</span><span>{{ audit.indice.id }}</span></div>
                    <div class="lbox-row"><span>Indexado como</span><span>{{ fmtDateTime(audit.indice.criado_em) }}</span></div>
                    <div class="lbox-row"><span>Caminho no acervo</span><span class="lbox-path lbox-wrap">{{ audit.indice.caminho_relativo }}</span></div>
                    <div class="lbox-row">
                      <span>Hash do conteúdo</span>
                      <span class="lbox-path lbox-wrap">{{ audit.indice.hash_conteudo || audit.indice.hash_observacao || '—' }}</span>
                    </div>
                  </div>
                </div>

                <!-- divergencia entre indice e disco = indice desatualizado -->
                <div v-if="!audit.disco.existe" class="lbox-audit-warn">
                  Arquivo não encontrado no disco{{ audit.disco.erro ? ` (${audit.disco.erro})` : '' }} — índice desatualizado.
                </div>
                <div v-else-if="audit.disco.difere_do_indice" class="lbox-audit-warn">
                  Tamanho em disco ({{ audit.disco.tamanho_humano }}) difere do índice
                  ({{ audit.indice.tamanho_humano }}) — o arquivo mudou desde a última indexação.
                </div>
              </template>
              <div v-else class="lbox-audit-warn">Não foi possível ler os dados técnicos.</div>
            </div>
          </template>

          <template v-else>
            <div class="lbox-edit-grid">
              <div class="edit-field">
                <label>Título</label>
                <input v-model="form.title" class="lbox-input" placeholder="Título do arquivo">
              </div>
              <div class="edit-field">
                <label>Campanha</label>
                <input v-model="form.campaign" class="lbox-input" placeholder="Nome da campanha">
              </div>
              <div class="edit-field span2">
                <label>Descrição</label>
                <textarea v-model="form.description" class="lbox-input lbox-textarea" rows="2" placeholder="Descrição opcional"></textarea>
              </div>
              <div class="edit-field span2">
                <label>Tags</label>
                <div class="tag-edit">
                  <div class="tag-chips">
                    <span v-for="t in form.tags" :key="t" class="tag-p">
                      {{ t }}<button class="tag-rm" @click="removeTag(t)">×</button>
                    </span>
                  </div>
                  <div style="position:relative">
                    <input
                      v-model="tagInput"
                      class="lbox-input"
                      placeholder="Adicionar tag (Enter para confirmar)"
                      @keydown.enter.prevent="addTagFromInput"
                      @input="onTagInput"
                      autocomplete="off"
                    >
                    <div v-if="tagSuggestions.length" class="tag-sugg">
                      <button v-for="s in tagSuggestions" :key="s" class="tag-sugg-item" @mousedown.prevent="pickSuggestion(s)">{{ s }}</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="edit-field check-row">
                <input type="checkbox" v-model="form.is_official">
                <label style="text-transform:none;font-size:12px;letter-spacing:0;color:#eeeef5">Arquivo oficial</label>
              </div>
              <div class="edit-actions">
                <button class="btn-ghost" @click="toggleEdit">Cancelar</button>
                <button class="btn-primary-sm" :disabled="saving" @click="saveMetadata">{{ saving ? 'Salvando…' : 'Salvar alterações' }}</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useFileType, getFileType } from '@/composables/useFileType'
import api from '@/api/client'

const props = defineProps({ file: Object })
defineEmits(['close', 'prev', 'next', 'download'])

const auth = useAuthStore()
const toastStore = useToastStore()
const lboxEl = ref(null)
const linkCopied = ref(false)

const editing = ref(false)
const saving = ref(false)
const metaLoaded = ref(null)
const audit = ref(null)
const auditLoading = ref(false)
const showAudit = ref(false)
const form = ref({ title: '', campaign: '', description: '', tags: [], is_official: false })
const tagInput = ref('')
const tagSuggestions = ref([])
const allTags = ref([])

const ft = computed(() => props.file ? useFileType(props.file.type || getFileType(props.file.name)) : {})

function fmtDateTime(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })
}

async function copyLink() {
  const path = props.file?.preview_link || props.file?.download_link
  if (!path) return
  const url = path.startsWith('http') ? path : `${window.location.origin}${path}`
  try {
    await navigator.clipboard.writeText(url)
    linkCopied.value = true
    toastStore.success('Link copiado.')
    setTimeout(() => { linkCopied.value = false }, 2000)
  } catch {
    toastStore.error('Não foi possível copiar o link.')
  }
}

async function loadMeta(fileId) {
  metaLoaded.value = null
  try {
    const { data } = await api.get(`/api/files/${fileId}/metadata`)
    metaLoaded.value = data
  } catch { /* non-critical */ }
}

/**
 * Dossiê técnico: dimensões, codec, origem, permissões. O backend roda ffprobe
 * pra montar isso, então é uma chamada separada — não atrasa a abertura do
 * visualizador, e as dimensões aparecem assim que chegam.
 */
async function loadAudit(fileId) {
  audit.value = null
  auditLoading.value = true
  try {
    const { data } = await api.get(`/api/files/${fileId}/audit`)
    audit.value = data
  } catch { audit.value = null } finally { auditLoading.value = false }
}

async function loadTagSuggestions() {
  if (allTags.value.length) return
  try {
    const { data } = await api.get('/api/files/tags/suggestions', { params: { limit: 100 } })
    allTags.value = data.tags || []
  } catch { /* ignore */ }
}

function toggleEdit() {
  if (editing.value) { editing.value = false; return }
  form.value = {
    title:       metaLoaded.value?.title       ?? props.file?.title       ?? '',
    campaign:    metaLoaded.value?.campaign    ?? props.file?.campaign    ?? '',
    description: metaLoaded.value?.description ?? props.file?.description ?? '',
    tags:        [...(metaLoaded.value?.tags   ?? props.file?.tags        ?? [])],
    is_official: metaLoaded.value?.is_official ?? props.file?.is_official ?? false,
  }
  loadTagSuggestions()
  editing.value = true
}

async function saveMetadata() {
  saving.value = true
  try {
    const { data } = await api.put(`/api/files/${props.file.id}/metadata`, form.value)
    metaLoaded.value = data
    editing.value = false
    toastStore.success('Metadados salvos com sucesso.')
  } catch (e) {
    toastStore.error(e?.response?.data?.detail || 'Erro ao salvar metadados.')
  } finally {
    saving.value = false
  }
}

function removeTag(t) { form.value.tags = form.value.tags.filter(x => x !== t) }
function addTagFromInput() {
  const v = tagInput.value.trim()
  if (v && !form.value.tags.includes(v)) form.value.tags.push(v)
  tagInput.value = ''
  tagSuggestions.value = []
}
function onTagInput() {
  const q = tagInput.value.trim().toLowerCase()
  tagSuggestions.value = q < 1 ? [] :
    allTags.value.filter(t => t.toLowerCase().includes(q) && !form.value.tags.includes(t)).slice(0, 8)
}
function pickSuggestion(s) {
  if (!form.value.tags.includes(s)) form.value.tags.push(s)
  tagInput.value = ''
  tagSuggestions.value = []
}

watch(() => props.file, (f) => {
  if (f) { lboxEl.value?.focus(); editing.value = false; showAudit.value = false; loadMeta(f.id); loadAudit(f.id) }
})
</script>

<style scoped>
.lbox {
  position: fixed; inset: 0; background: rgba(0,0,0,.95);
  z-index: 200; display: flex; flex-direction: column;
  backdrop-filter: blur(10px); outline: none;
}
.lbox-top {
  position: absolute; top: 0; left: 0; right: 0; z-index: 201;
  padding: 14px 20px; display: flex; align-items: center; gap: 14px;
  background: linear-gradient(to bottom,rgba(0,0,0,.85) 0%,transparent 100%);
}
.lbox-inf { flex: 1; min-width: 0; }
.lbox-fn { font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
.lbox-meta { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 2px; }
.lbox-acts { display: flex; gap: 6px; flex-shrink: 0; }
.lbox-btn {
  height: 34px; padding: 0 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.07); color: rgba(255,255,255,.7); font-size: 12px; font-weight: 500;
  display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all .12s; white-space: nowrap; font-family: inherit;
}
.lbox-btn svg { width: 14px; height: 14px; }
.lbox-btn:hover { background: rgba(255,255,255,.12); color: #fff; }
.lbox-btn.active { background: rgba(255,107,0,.18); border-color: rgba(255,107,0,.4); color: var(--accent); }
.lbox-x:hover { background: rgba(240,68,56,.18) !important; border-color: rgba(240,68,56,.35) !important; color: #F04438 !important; }

.lbox-viewer {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 80px 60px; position: relative;
}
.lbox-file { border-radius: 12px; overflow: hidden; max-width: 80vw; max-height: 70vh; display: flex; align-items: center; justify-content: center; box-shadow: 0 24px 80px rgba(0,0,0,.5); }
.lbox-img { max-width: 80vw; max-height: 70vh; object-fit: contain; border-radius: 12px; display: block; }
.lbox-video { max-width: 80vw; max-height: 70vh; border-radius: 12px; }
.lbox-icon-view { width: 320px; height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; border-radius: 12px; }
.lbox-type-ico { width: 96px; height: 96px; color: rgba(255,255,255,.85); }
.lbox-type-ico :deep(svg) { width: 100%; height: 100%; }
.lbox-open-hint { display: flex; gap: 8px; }
.lbox-pdf { width: 80vw; height: 78vh; border: none; border-radius: 12px; background: #fff; box-shadow: 0 24px 80px rgba(0,0,0,.5); }
.lbox-audio { width: 280px; }

.lbox-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 46px; height: 46px; border-radius: 50%;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.1);
  color: rgba(255,255,255,.7); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .12s;
}
.lbox-nav:hover { background: rgba(255,255,255,.16); color: #fff; }
.lbox-nav svg { width: 20px; height: 20px; }
.prev { left: 16px; }
.next { right: 16px; }

.lbox-bot {
  background: #111118; border-top: 1px solid #2e2e3e;
  padding: 18px 24px; display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 24px; flex-shrink: 0; max-height: 220px; overflow-y: auto;
}
.lbox-bot-edit { grid-template-columns: 1fr; max-height: 280px; }
/* auditoria aberta e alta; sem isso ela fica espremida na faixa de 220px */
.lbox-bot-audit { max-height: 46vh; }
.lbox-sec h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #55556a; margin-bottom: 10px; }
.lbox-row { display: flex; justify-content: space-between; align-items: flex-start; font-size: 12px; margin-bottom: 5px; color: #eeeef5; gap: 8px; }
.lbox-row span:first-child { color: #8888a8; flex-shrink: 0; }
.lbox-ro {
  display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 999px;
  background: rgba(255,255,255,.12); color: rgba(255,255,255,.75); font-size: 10px; font-weight: 600;
}
.lbox-audit-toggle {
  margin-top: 10px; background: none; border: 1px solid rgba(255,255,255,.2); border-radius: 7px;
  color: rgba(255,255,255,.75); font-size: 11.5px; font-family: inherit; padding: 4px 10px; cursor: pointer;
  transition: all .12s;
}
.lbox-audit-toggle:hover { border-color: var(--accent); color: var(--accent); }
.lbox-audit {
  grid-column: 1 / -1; margin-top: 4px;
  border-top: 1px solid rgba(255,255,255,.12); padding-top: 10px;
}
.lbox-audit-cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; align-items: start; }

.lbox-audit-grp {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
  color: rgba(255,255,255,.4); margin: 10px 0 4px;
}
.lbox-audit-cols > div > .lbox-audit-grp:first-child { margin-top: 0; }
.lbox-audit-load { font-size: 12px; color: rgba(255,255,255,.5); padding: 6px 0; }
.lbox-audit-warn {
  margin-top: 10px; padding: 7px 9px; border-radius: 7px;
  background: rgba(251,191,36,.12); border: 1px solid rgba(251,191,36,.3);
  color: #fbbf24; font-size: 11.5px; line-height: 1.45;
}
.lbox-path { font-family: monospace; font-size: 11px; color: #8888a8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
/* caminho e hash tem que aparecer inteiros — e o motivo da auditoria existir */
.lbox-path.lbox-wrap { white-space: normal; overflow: visible; overflow-wrap: anywhere; max-width: 100%; text-align: right; }
.tag-list { display: flex; flex-wrap: wrap; gap: 5px; }
.tag-p { padding: 3px 9px; border-radius: 999px; font-size: 11px; background: rgba(255,107,0,.15); color: var(--accent); border: 1px solid rgba(255,107,0,.25); display: inline-flex; align-items: center; gap: 5px; }
.tag-rm { background: none; border: none; color: inherit; cursor: pointer; font-size: 13px; line-height: 1; padding: 0; opacity: .7; }
.tag-rm:hover { opacity: 1; }

/* Edit mode */
.lbox-edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.edit-field { display: flex; flex-direction: column; gap: 4px; }
.edit-field label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #55556a; }
.span2 { grid-column: span 2; }
.check-row { flex-direction: row !important; align-items: center !important; gap: 8px !important; }
.lbox-input {
  background: #1a1a28; border: 1px solid #2e2e3e; border-radius: 7px;
  padding: 7px 10px; color: #eeeef5; font-size: 12px; font-family: inherit;
  outline: none; transition: border-color .12s; width: 100%; box-sizing: border-box;
}
.lbox-input:focus { border-color: rgba(255,107,0,.6); }
.lbox-textarea { resize: none; }
.tag-edit { display: flex; flex-direction: column; gap: 6px; }
.tag-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.tag-sugg {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: #1a1a28; border: 1px solid #2e2e3e; border-radius: 8px;
  z-index: 10; max-height: 140px; overflow-y: auto;
}
.tag-sugg-item { display: block; width: 100%; padding: 6px 12px; text-align: left; background: none; border: none; color: #eeeef5; font-size: 12px; cursor: pointer; font-family: inherit; }
.tag-sugg-item:hover { background: rgba(255,107,0,.1); color: var(--accent); }
.edit-actions { display: flex; justify-content: flex-end; gap: 8px; align-items: center; }
.btn-ghost { height: 32px; padding: 0 14px; border-radius: 7px; border: 1px solid #2e2e3e; background: none; color: #8888a8; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .12s; }
.btn-ghost:hover { border-color: #555; color: #eeeef5; }
.btn-primary-sm { height: 32px; padding: 0 14px; border-radius: 7px; border: none; background: var(--accent); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity .12s; }
.btn-primary-sm:disabled { opacity: .6; cursor: default; }
.btn-primary { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }

.lbox-enter-active, .lbox-leave-active { transition: opacity .2s; }
.lbox-enter-from, .lbox-leave-to { opacity: 0; }
</style>

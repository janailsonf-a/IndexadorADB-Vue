<template>
  <div class="view-content">
    <div class="page-hd">
      <h2 class="page-title">Configurações</h2>
    </div>

    <div class="settings-layout">
      <!-- Tabs sidebar -->
      <nav class="settings-nav">
        <button
          v-for="tab in TABS" :key="tab.id"
          class="stab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span v-html="tab.icon"></span>
          {{ tab.label }}
        </button>
      </nav>

      <!-- Content -->
      <div class="settings-body">

        <!-- Geral -->
        <div v-if="activeTab === 'geral'" class="stab-content">
          <div class="scard">
            <h3 class="scard-title">Identidade do Sistema</h3>
            <div class="sfield">
              <label class="field-lbl">Nome do sistema</label>
              <input v-model="cfg.systemName" class="field-input" />
            </div>
            <div class="sfield">
              <label class="field-lbl">Organização</label>
              <input v-model="cfg.orgName" class="field-input" />
            </div>
            <div class="sfield">
              <label class="field-lbl">Logo</label>
              <div class="logo-preview">
                <div class="logo-thumb">
                  <img v-if="cfg.logoUrl" :src="cfg.logoUrl" alt="logo" />
                  <span v-else>ADB</span>
                </div>
                <button class="btn-secondary logo-btn" @click="logoInput.click()">Trocar logo</button>
                <button v-if="cfg.logoUrl" class="btn-ghost logo-btn" @click="cfg.logoUrl = ''">Remover</button>
                <input ref="logoInput" type="file" accept="image/*" style="display:none" @change="onLogoPick">
              </div>
            </div>
          </div>

          <div class="scard">
            <h3 class="scard-title">Modo Manutenção</h3>
            <div class="toggle-row">
              <div>
                <div style="font-size:14px;color:var(--text);font-weight:500">Ativar modo manutenção</div>
                <div style="font-size:12px;color:var(--faint);margin-top:2px">Desabilita login para usuários não-Admin</div>
              </div>
              <button class="toggle-btn" :class="{ on: cfg.maintenance }" @click="cfg.maintenance = !cfg.maintenance">
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>

          <div class="scard-footer">
            <button class="btn-primary" @click="save">Salvar alterações</button>
          </div>
        </div>

        <!-- Armazenamento -->
        <div v-if="activeTab === 'armazenamento'" class="stab-content">
          <div class="scard">
            <h3 class="scard-title">Limites de Upload</h3>
            <div class="sfield">
              <label class="field-lbl">Tamanho máximo por arquivo</label>
              <div class="input-with-unit">
                <input v-model="cfg.maxUploadMB" type="number" min="1" class="field-input" style="width:100px" />
                <select v-model="cfg.maxUploadUnit" class="unit-sel">
                  <option value="MB">MB</option>
                  <option value="GB">GB</option>
                </select>
              </div>
            </div>
            <div class="sfield">
              <label class="field-lbl">Retenção na lixeira</label>
              <div class="retention-opts">
                <button v-for="days in [7,14,30,60,90]" :key="days"
                  class="ret-opt" :class="{ active: cfg.trashDays === days }"
                  @click="cfg.trashDays = days">{{ days }}d</button>
              </div>
            </div>
          </div>
          <div class="scard">
            <h3 class="scard-title">Qualidade de Thumbnails</h3>
            <div class="quality-opts">
              <button v-for="q in ['Baixa','Média','Alta']" :key="q"
                class="quality-opt" :class="{ active: cfg.thumbQuality === q }"
                @click="cfg.thumbQuality = q">{{ q }}</button>
            </div>
          </div>
          <div class="scard-footer">
            <button class="btn-primary" @click="save">Salvar alterações</button>
          </div>
        </div>

        <!-- Notificações -->
        <div v-if="activeTab === 'notificacoes'" class="stab-content">
          <div class="scard">
            <h3 class="scard-title">E-mail</h3>
            <div v-for="notif in notifications" :key="notif.key" class="toggle-row" style="padding:10px 0;border-bottom:1px solid var(--border-sub)">
              <div>
                <div style="font-size:14px;color:var(--text);font-weight:500">{{ notif.label }}</div>
                <div style="font-size:12px;color:var(--faint);margin-top:2px">{{ notif.desc }}</div>
              </div>
              <button class="toggle-btn" :class="{ on: notif.on }" @click="notif.on = !notif.on">
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>
          <div class="scard-footer">
            <button class="btn-primary" @click="save">Salvar alterações</button>
          </div>
        </div>

        <!-- Workflow -->
        <div v-if="activeTab === 'workflow'" class="stab-content">
          <div class="scard">
            <h3 class="scard-title">Aprovação e Status</h3>
            <div class="toggle-row" style="padding:10px 0;border-bottom:1px solid var(--border-sub)">
              <div>
                <div style="font-size:14px;color:var(--text);font-weight:500">Exigir aprovação antes de arquivar</div>
                <div style="font-size:12px;color:var(--faint);margin-top:2px">Arquivo deve ter status "Aprovado" antes de ser arquivado</div>
              </div>
              <button class="toggle-btn" :class="{ on: cfg.requireApproval }" @click="cfg.requireApproval = !cfg.requireApproval">
                <span class="toggle-knob"></span>
              </button>
            </div>
            <div class="sfield" style="margin-top:14px">
              <label class="field-lbl">Papel mínimo para aprovar arquivos</label>
              <select v-model="cfg.minApproveRole" class="field-input" style="max-width:200px">
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="scard-footer">
            <button class="btn-primary" @click="save">Salvar alterações</button>
          </div>
        </div>

        <!-- Integrações -->
        <div v-if="activeTab === 'integracoes'" class="stab-content">
          <div class="scard">
            <h3 class="scard-title">API</h3>
            <div class="sfield">
              <label class="field-lbl">URL base da API (via proxy)</label>
              <input :value="cfg.apiUrl" class="field-input" readonly style="font-family:monospace;font-size:12px" />
            </div>
            <p style="font-size:12px;color:var(--faint);margin:0">
              O backend atual não expõe um sistema de chaves de API — autenticação é feita por login (JWT), não por chave.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToastStore } from '@/stores/toast'

const settings = useSettingsStore()
const toast = useToastStore()

const activeTab = ref('geral')
const logoInput = ref(null)
const cfg = settings.cfg
const notifications = settings.notifications

const TABS = [
  { id: 'geral', label: 'Geral', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M4.93 4.93A10 10 0 0 0 19.07 19.07"/></svg>` },
  { id: 'armazenamento', label: 'Armazenamento', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>` },
  { id: 'notificacoes', label: 'Notificações', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>` },
  { id: 'workflow', label: 'Workflow', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` },
  { id: 'integracoes', label: 'Integrações', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>` },
]

function onLogoPick(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { cfg.logoUrl = reader.result }
  reader.readAsDataURL(file)
}

function save() {
  settings.saveCfg(cfg)
  settings.saveNotifications(notifications)
  toast.success('Configurações salvas.')
}
</script>

<style scoped>
.view-content { flex: 1; overflow-y: auto; padding: 24px; }
.page-hd { margin-bottom: 20px; }
.page-title { font-family: Montserrat, system-ui, sans-serif; font-size: 22px; font-weight: 800; color: var(--heading); margin: 0; }

.settings-layout { display: flex; gap: 20px; align-items: flex-start; }

.settings-nav {
  width: 200px; flex-shrink: 0; background: var(--card); border: 1px solid var(--border);
  border-radius: 14px; padding: 8px; display: flex; flex-direction: column; gap: 2px; sticky: top 0;
}
.stab {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px;
  border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 500;
  color: var(--muted); text-align: left; font-family: inherit; transition: background .1s, color .1s; width: 100%;
}
.stab :deep(svg) { width: 15px; height: 15px; flex-shrink: 0; }
.stab:hover { background: var(--elevated); color: var(--text); }
.stab.active { background: rgba(255,107,0,.1); color: var(--accent); }

.settings-body { flex: 1; min-width: 0; }
.stab-content { display: flex; flex-direction: column; gap: 16px; }

.scard { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
.scard-title { font-family: Montserrat, system-ui, sans-serif; font-size: 14px; font-weight: 700; color: var(--heading); margin: 0 0 16px; }
.scard-footer { display: flex; justify-content: flex-end; }

.sfield { margin-bottom: 14px; }
.sfield:last-child { margin-bottom: 0; }
.field-lbl { font-size: 12px; font-weight: 600; color: var(--muted); display: block; margin-bottom: 6px; }
.field-input {
  width: 100%; background: var(--elevated); border: 1.5px solid var(--border); border-radius: 10px;
  padding: 9px 12px; font-size: 14px; color: var(--text); outline: none; font-family: inherit; box-sizing: border-box;
  transition: border-color .15s;
}
.field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(255,107,0,.1); }

.logo-preview { display: flex; align-items: center; gap: 14px; }
.logo-thumb {
  width: 56px; height: 56px; border-radius: 10px; background: var(--elevated); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--faint); overflow: hidden;
}
.logo-thumb img { width: 100%; height: 100%; object-fit: contain; }
.logo-btn { font-size: 13px; }

.input-with-unit { display: flex; gap: 8px; align-items: center; }
.unit-sel { background: var(--elevated); border: 1.5px solid var(--border); border-radius: 10px; padding: 9px 10px; font-size: 13px; color: var(--text); outline: none; font-family: inherit; }

.retention-opts, .quality-opts { display: flex; gap: 8px; flex-wrap: wrap; }
.ret-opt, .quality-opt {
  padding: 6px 16px; border-radius: 999px; border: 1.5px solid var(--border);
  background: none; color: var(--muted); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .12s;
}
.ret-opt:hover, .quality-opt:hover { border-color: var(--accent); color: var(--accent); }
.ret-opt.active, .quality-opt.active { border-color: var(--accent); background: rgba(255,107,0,.1); color: var(--accent); }

.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.toggle-btn { width: 44px; height: 24px; border-radius: 999px; background: var(--border); border: none; cursor: pointer; position: relative; transition: background .2s; flex-shrink: 0; }
.toggle-btn.on { background: var(--accent); }
.toggle-knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { transform: translateX(20px); }

@media (max-width: 680px) {
  .settings-layout { flex-direction: column; }
  .settings-nav { width: 100%; flex-direction: row; overflow-x: auto; }
}
</style>

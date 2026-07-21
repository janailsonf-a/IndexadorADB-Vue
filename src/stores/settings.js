import { defineStore } from 'pinia'
import { ref } from 'vue'

const DEFAULT_CFG = {
  systemName: 'Noxis 2.0',
  orgName: 'Amigos do Bem',
  logoUrl: '',
  maintenance: false,
  maxUploadMB: 500,
  maxUploadUnit: 'MB',
  trashDays: 30,
  thumbQuality: 'Média',
  requireApproval: false,
  minApproveRole: 'editor',
  apiUrl: '/',
}

const DEFAULT_NOTIFICATIONS = [
  { key: 'upload', label: 'Novo upload', desc: 'Notificar quando novos arquivos forem enviados', on: true },
  { key: 'review', label: 'Revisão pendente >48h', desc: 'Alertar editor quando arquivo ficar em revisão por mais de 48h', on: true },
  { key: 'quota', label: 'Armazenamento acima de 80%', desc: 'Avisar administradores sobre uso de armazenamento', on: false },
]

export const useSettingsStore = defineStore('settings', () => {
  const cfg = ref({ ...DEFAULT_CFG, ...JSON.parse(localStorage.getItem('noxis_settings_cfg') || '{}') })
  const notifications = ref(JSON.parse(localStorage.getItem('noxis_settings_notifications') || 'null') || DEFAULT_NOTIFICATIONS)

  function saveCfg(patch) {
    Object.assign(cfg.value, patch)
    localStorage.setItem('noxis_settings_cfg', JSON.stringify(cfg.value))
  }

  function saveNotifications(list) {
    if (list !== notifications.value) notifications.value = list
    localStorage.setItem('noxis_settings_notifications', JSON.stringify(notifications.value))
  }

  return { cfg, notifications, saveCfg, saveNotifications }
})

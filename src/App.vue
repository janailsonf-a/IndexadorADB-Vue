<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const ui = useUiStore()
const auth = useAuthStore()
const toast = useToastStore()

function onOffline() { toast.error('Você está sem conexão com a internet.', 8000) }
function onOnline() { toast.success('Conexão restabelecida.') }

onMounted(() => {
  ui.initTheme()
  auth.init()
  window.addEventListener('offline', onOffline)
  window.addEventListener('online', onOnline)
})
onUnmounted(() => {
  window.removeEventListener('offline', onOffline)
  window.removeEventListener('online', onOnline)
})
</script>

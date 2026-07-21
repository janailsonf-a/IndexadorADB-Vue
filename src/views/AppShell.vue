<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="main-area">
      <AppTopbar
        :view-mode="viewMode"
        :show-slider="route.name === 'gallery' || route.name === 'favorites'"
        @view-mode="viewMode = $event"
        @upload="showUpload = true"
      />
      <RouterView :view-mode="viewMode" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

const route = useRoute()
const viewMode = ref('grid')
const showUpload = ref(false)
</script>

<style scoped>
.app-shell { display: flex; height: 100vh; overflow: hidden; }
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
</style>

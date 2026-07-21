import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const theme = ref(localStorage.getItem('noxis_theme') || 'light')
  const gridSize = ref(200)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('noxis_theme', theme.value)
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  function initTheme() {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  function setGridSize(size) {
    gridSize.value = size
  }

  return { sidebarCollapsed, theme, gridSize, toggleSidebar, toggleTheme, initTheme, setGridSize }
})

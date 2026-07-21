import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'noxis-theme'
const theme = ref('dark')
const initialized = ref(false)

function getPreferredTheme() {
  if (typeof window === 'undefined') return 'dark'

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(value) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', value)
}

function initTheme() {
  if (initialized.value) return
  theme.value = getPreferredTheme()
  applyTheme(theme.value)
  initialized.value = true
}

if (typeof window !== 'undefined') {
  initTheme()
}

watch(theme, (value) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, value)
  }
  applyTheme(value)
})

export function useTheme() {
  initTheme()

  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(value) {
    if (value !== 'dark' && value !== 'light') return
    theme.value = value
  }

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  }
}

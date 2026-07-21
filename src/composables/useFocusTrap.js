import { watch, nextTick, onUnmounted } from 'vue'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(containerRef, isOpen) {
  let previouslyFocused = null

  function handleKeydown(e) {
    if (e.key === 'Escape') return
    if (e.key !== 'Tab' || !containerRef.value) return
    const focusables = containerRef.value.querySelectorAll(FOCUSABLE)
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(isOpen, async (open) => {
    if (open) {
      previouslyFocused = document.activeElement
      await nextTick()
      containerRef.value?.querySelector(FOCUSABLE)?.focus()
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('keydown', handleKeydown)
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}

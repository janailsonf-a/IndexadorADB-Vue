import { defineStore } from 'pinia'
import { ref } from 'vue'

let _id = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function push(message, type = 'info', duration = 3500) {
    const id = ++_id
    toasts.value.push({ id, message, type })
    setTimeout(() => remove(id), duration)
    return id
  }

  function success(msg, dur) { return push(msg, 'success', dur) }
  function error(msg, dur)   { return push(msg, 'error', dur || 5000) }
  function info(msg, dur)    { return push(msg, 'info', dur) }
  function warn(msg, dur)    { return push(msg, 'warn', dur) }

  function remove(id) {
    const i = toasts.value.findIndex(t => t.id === id)
    if (i !== -1) toasts.value.splice(i, 1)
  }

  return { toasts, push, success, error, info, warn, remove }
})

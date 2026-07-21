import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import router from '@/router'

const api = axios.create({
  baseURL: '/',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

let lastOfflineToastAt = 0

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const auth = useAuthStore()
      auth.logout()
      router.push('/login')
    } else if (!err.response) {
      // sem resposta do servidor = rede caiu ou backend fora do ar (falha de transporte, não 4xx/5xx)
      const now = Date.now()
      if (now - lastOfflineToastAt > 8000) {
        lastOfflineToastAt = now
        useToastStore().error('Sem conexão com o servidor. Verifique sua rede.')
      }
    }
    return Promise.reject(err)
  }
)

export default api

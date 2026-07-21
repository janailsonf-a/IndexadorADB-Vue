<template>
  <div class="login-wrap">
    <div class="login-card">
      <img src="/logo.webp" alt="Amigos do Bem" class="login-logo" @error="logoFallback" ref="logoEl">
      <h1>Noxis</h1>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field mb-4">
          <label>E-mail</label>
          <input v-model="email" type="email" placeholder="seu@amigosdobem.org" required autocomplete="email">
        </div>
        <div class="field mb-2">
          <label>Senha</label>
          <input v-model="password" type="password" placeholder="••••••••" required autocomplete="current-password">
        </div>

        <p v-if="errorMsg" class="text-red-500 text-xs mt-2 mb-1">{{ errorMsg }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="loading">Entrando…</span>
          <span v-else>Entrar</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const logoEl = ref(null)

function logoFallback() {
  if (logoEl.value) logoEl.value.style.display = 'none'
}

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/acervo')
  } catch {
    errorMsg.value = 'E-mail ou senha inválidos.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--bg);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 56px 72px;
  box-shadow: 0 4px 24px rgba(0,0,0,.06);
}

.login-logo {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
  background: var(--elevated);
}

.login-card h1 {
  font-family: Montserrat, system-ui, sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--heading);
  letter-spacing: -.5px;
  margin: 0 0 28px;
}

.login-form { width: 100%; }

.btn-login {
  width: 100%;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 13px;
  font-size: 14px;
  font-weight: 700;
  font-family: Montserrat, system-ui, sans-serif;
  letter-spacing: .2px;
  cursor: pointer;
  margin-top: 16px;
  transition: background .15s, transform .1s;
}
.btn-login:hover:not(:disabled) { background: #E65300; transform: translateY(-1px); }
.btn-login:active:not(:disabled) { transform: scale(.99); }
.btn-login:disabled { opacity: .6; cursor: not-allowed; }
</style>

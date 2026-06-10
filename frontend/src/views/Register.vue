<template>
  <div class="login-container">
    <div class="login-card">
      <h1>注册账号</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <input v-model="form.username" class="input" placeholder="用户名 (3-30位字母或数字)" required />
        </div>
        <div class="form-group">
          <input v-model="form.email" type="email" class="input" placeholder="邮箱" required />
        </div>
        <div class="form-group">
          <input v-model="form.password" type="password" class="input" placeholder="密码（至少6位）" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <div v-if="result" :class="['result-box', result.code === 201 ? 'success' : 'error']">
          <p>{{ result.message }}</p>
          <div v-if="result.code === 201" class="user-info">
            <p>用户名：{{ result.data?.username }}</p>
            <p>邮箱：{{ result.data?.email }}</p>
            <p class="redirect-hint">2秒后跳转到登录页...</p>
          </div>
        </div>
        <p class="switch-link">已有账号？<router-link to="/login">直接登录</router-link></p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const router = useRouter()
const auth = useAuthStore()
const form = ref({ username: '', email: '', password: '' })
const loading = ref(false)
const result = ref(null)

async function handleRegister() {
  if (form.value.password.length < 6) {
    result.value = { code: 400, message: '密码至少需要6位' }
    return
  }
  if (form.value.username.length < 3) {
    result.value = { code: 400, message: '用户名至少需要3位' }
    return
  }

  loading.value = true
  result.value = null

  try {
    const response = await api.post('/auth/register', {
      username: form.value.username,
      email: form.value.email,
      password: form.value.password
    })
    result.value = response

    if (response.code === 201) {
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  } catch (error) {
    console.error('注册错误:', error)
    result.value = { code: 500, message: error?.message || '注册请求失败' }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 380px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
h1 { font-size: 24px; text-align: center; margin-bottom: 24px; }
.form-group { margin-bottom: 16px; }
.btn-block { width: 100%; justify-content: center; padding: 12px; }
.switch-link { text-align: center; margin-top: 16px; font-size: 14px; color: #6b7280; }
.switch-link a { color: var(--primary); text-decoration: none; }
.result-box {
  margin-top: 16px;
  padding: 12px;
  border-radius: var(--radius);
  text-align: center;
}
.result-box.success { background: #d1fae5; color: #065f46; }
.result-box.error { background: #fee2e2; color: #991b1b; }
.user-info { margin-top: 8px; font-size: 13px; }
.redirect-hint { margin-top: 8px; font-size: 12px; opacity: 0.7; }
</style>
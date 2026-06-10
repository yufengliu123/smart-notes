<template>
  <div class="login-container">
    <div class="login-card">
      <h1>智能学习助手</h1>
      <p class="subtitle">笔记摘要 · 知识图谱 · 艾宾浩斯复习</p>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <input v-model="form.account" type="text" class="input" placeholder="邮箱或用户名" required />
        </div>
        <div class="form-group">
          <input v-model="form.password" type="password" class="input" placeholder="密码" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p class="switch-link">还没有账号？<router-link to="/register">立即注册</router-link></p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const form = ref({ account: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  if (!form.value.account.trim()) { alert('请输入账号'); return }
  if (!form.value.password) { alert('请输入密码'); return }
  loading.value = true
  try {
    const result = await auth.login(form.value.account, form.value.password)
    if (result.code === 200) {
      router.push('/')
    } else {
      alert(result.message || `登录失败`)
    }
  } catch (e) {
    console.error('登录错误:', e, e?.response?.data)
    alert('登录失败: ' + (e?.response?.data?.message || e?.message || '未知错误'))
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
h1 { font-size: 24px; text-align: center; margin-bottom: 8px; }
.subtitle { text-align: center; color: #6b7280; font-size: 14px; margin-bottom: 32px; }
.form-group { margin-bottom: 16px; }
.btn-block { width: 100%; justify-content: center; padding: 12px; }
.switch-link { text-align: center; margin-top: 16px; font-size: 14px; color: #6b7280; }
.switch-link a { color: var(--primary); text-decoration: none; }
</style>
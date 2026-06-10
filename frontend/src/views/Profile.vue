<template>
  <div class="page-wrapper">
    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
        <h2>个人中心</h2>
      </div>
    </header>

    <div class="profile-content">
      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar">{{ user?.username?.charAt(0).toUpperCase() || 'U' }}</div>
          <div class="user-info">
            <h3>{{ user?.username }}</h3>
            <p>{{ user?.email }}</p>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stat-card">
          <span class="stat-icon">📝</span>
          <div class="stat-detail">
            <span class="stat-num">{{ totalNotes }}</span>
            <span class="stat-label">总笔记</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🔥</span>
          <div class="stat-detail">
            <span class="stat-num">{{ reviewStats.continuousDays || 0 }}</span>
            <span class="stat-label">连续复习天数</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📊</span>
          <div class="stat-detail">
            <span class="stat-num">{{ reviewStats.totalReviews || 0 }}</span>
            <span class="stat-label">总复习次数</span>
          </div>
        </div>
      </div>

      <div class="memory-insight">
        <h3>🧠 记忆曲线分析</h3>
        <div class="insight-content">
          <p v-if="reviewStats.continuousDays >= 7" class="insight-text good">
            🌟 太棒了！你已经连续学习 {{ reviewStats.continuousDays }} 天，记忆力持续提升中。
          </p>
          <p v-else-if="reviewStats.continuousDays >= 3" class="insight-text normal">
            💪 不错的开始！继续保持，你正在养成良好的学习习惯。
          </p>
          <p v-else class="insight-text hint">
            📚 开始今天的第一次复习，建立你的学习节奏！
          </p>
        </div>
        <div class="curve-preview" ref="curveRef"></div>
      </div>

      <div class="settings-section">
        <h3>⚙️ 设置</h3>
        <div class="settings-list">
          <div class="setting-item">
            <span>每日复习提醒</span>
            <label class="switch">
              <input type="checkbox" v-model="settings.dailyReminder" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <span>复习完成通知</span>
            <label class="switch">
              <input type="checkbox" v-model="settings.reviewNotification" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="feedback-section">
        <h3>💬 意见反馈</h3>
        <div class="feedback-form">
          <div class="feedback-type">
            <button v-for="t in feedbackTypes" :key="t.value" :class="['type-btn', { active: feedbackType === t.value }]" @click="feedbackType = t.value">{{ t.label }}</button>
          </div>
          <textarea v-model="feedbackContent" class="feedback-textarea" :placeholder="placeholderMap[feedbackType]" rows="4" autocomplete="off" spellcheck="false"></textarea>
          <div class="feedback-submit">
            <button class="btn btn-primary" :disabled="!feedbackContent.trim() || submitting" @click="submitFeedback">提交反馈</button>
            <span v-if="submitSuccess" class="submit-success">✓ 感谢您的反馈！</span>
          </div>
        </div>
        <div v-if="feedbackList.length > 0" class="feedback-list">
          <h4>我的反馈历史</h4>
          <div v-for="f in feedbackList" :key="f.id" class="feedback-item">
            <div class="feedback-item-header">
              <span class="feedback-type-tag">{{ typeLabelMap[f.type] }}</span>
              <span class="feedback-status" :class="f.status">{{ statusLabelMap[f.status] }}</span>
            </div>
            <p class="feedback-content">{{ f.content }}</p>
            <div class="feedback-footer">
              <span class="feedback-time">{{ new Date(f.created_at).toLocaleString() }}</span>
              <button class="delete-btn" @click="deleteFeedback(f.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <div class="logout-section">
        <button class="btn btn-danger" @click="handleLogout">退出登录</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useReviewStore } from '../stores/auth'
import { useNoteStore } from '../stores/notes'
import * as echarts from 'echarts'
import api from '../services/api'

const router = useRouter()
const auth = useAuthStore()
const reviewStore = useReviewStore()
const noteStore = useNoteStore()
const curveRef = ref(null)

const user = computed(() => auth.user)
const totalNotes = computed(() => noteStore.total || 0)

const reviewStats = ref({ continuousDays: 0, totalReviews: 0 })

const settings = ref({
  dailyReminder: true,
  reviewNotification: true
})

const feedbackContent = ref('')
const feedbackType = ref('suggestion')
const submitting = ref(false)
const submitSuccess = ref(false)
const feedbackList = ref([])
const feedbackTypes = [
  { label: '💡 建议', value: 'suggestion' },
  { label: '🐛 缺陷', value: 'bug' },
  { label: '👍 表扬', value: 'praise' },
  { label: '❓ 其他', value: 'other' }
]
const placeholderMap = {
  suggestion: '请写下您的改进建议，我们会认真考虑每一个想法...',
  bug: '请描述您遇到的bug，包括操作步骤和现象...',
  praise: '请分享您喜欢的功能，帮助我们做得更好...',
  other: '请写下您的其他想法或问题...'
}
const typeLabelMap = { suggestion: '建议', bug: '缺陷', praise: '表扬', other: '其他' }
const statusLabelMap = { pending: '待处理', reviewed: '已查看', resolved: '已解决' }

async function submitFeedback() {
  if (!feedbackContent.value.trim()) return
  submitting.value = true
  submitSuccess.value = false
  try {
    const res = await api.post('/feedback', { content: feedbackContent.value, type: feedbackType.value })
    if (res.code === 201) {
      feedbackContent.value = ''
      submitSuccess.value = true
      setTimeout(() => { submitSuccess.value = false }, 3000)
      await loadFeedback()
    } else {
      alert(res.message || '提交失败')
    }
  } catch (e) {
    alert('提交失败: ' + e.message)
  } finally {
    submitting.value = false
  }
}

async function loadFeedback() {
  try {
    const res = await api.get('/feedback')
    if (res.code === 200) feedbackList.value = res.data?.list || []
  } catch (e) { feedbackList.value = [] }
}

async function deleteFeedback(id) {
  if (!confirm('确定删除这条反馈？')) return
  try {
    const res = await api.delete('/feedback/' + id)
    if (res.code === 200) {
      feedbackList.value = feedbackList.value.filter(f => f.id !== id)
    } else {
      alert(res.message || '删除失败')
    }
  } catch (e) {
    console.log('delete error:', e)
    alert('删除失败: ' + JSON.stringify(e))
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

function handleLogout() {
  if (!confirm('确定退出登录？')) return
  auth.logout()
  router.push('/login')
}

function loadReviewHistory() {
  const history = JSON.parse(localStorage.getItem('review_history') || '[]')
  reviewStats.value.totalReviews = history.length
  if (history.length === 0) {
    reviewStats.value.continuousDays = 0
    return
  }
  const dates = [...new Set(history.map(h => h.reviewDate))].sort().reverse()
  let days = 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 && dates[i] !== today && dates[i] !== yesterday) break
    if (i > 0) {
      const diff = new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()
      if (diff > 86400000) break
    }
    days++
  }
  reviewStats.value.continuousDays = days
}

function renderMemoryCurve() {
  if (!curveRef.value) return
  const history = JSON.parse(localStorage.getItem('review_history') || '[]')
  if (history.length === 0) return

  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    const count = history.filter(h => h.reviewDate === day).length
    last7Days.push([i, count])
  }

  const chart = echarts.init(curveRef.value)
  chart.setOption({
    grid: { top: 10, left: 40, right: 15, bottom: 30 },
    xAxis: { type: 'value', name: 'Days ago', nameLocation: 'center', nameGap: 25, max: 6, axisLabel: { fontFamily: 'Arial' } },
    yAxis: { type: 'value', name: 'Reviews', nameLocation: 'center', nameGap: 30, min: 0, axisLabel: { fontFamily: 'Arial' } },
    series: [{
      data: last7Days,
      type: 'line',
      smooth: true,
      areaStyle: { color: 'rgba(102, 126, 234, 0.15)' },
      lineStyle: { color: '#667eea', width: 3 },
      symbol: 'circle',
      symbolSize: 8
    }]
  })
}

onMounted(async () => {
  await noteStore.fetchNotes({ pageSize: 100 })
  await reviewStore.fetchStats()
  loadReviewHistory()
  loadFeedback()
  nextTick(() => renderMemoryCurve())
})
</script>

<style scoped>
.page-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-left h2 {
  font-size: 22px;
  margin: 0;
  font-weight: 600;
  color: #1e293b;
}
.back-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  color: white;
  font-size: 14px;
  font-weight: 500;
}
.back-btn:hover {
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(102,126,234,0.4);
}
.back-icon { font-size: 16px; }

.profile-content { display: flex; flex-direction: column; gap: 20px; }

.profile-card { background: white; border-radius: 14px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.avatar-section { display: flex; align-items: center; gap: 20px; }
.avatar { width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.user-info h3 { font-size: 20px; margin: 0 0 4px 0; color: #1e293b; }
.user-info p { font-size: 14px; color: #94a3b8; margin: 0; }

.stats-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.stat-card { background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: flex; align-items: center; gap: 14px; }
.stat-icon { font-size: 28px; }
.stat-detail { display: flex; flex-direction: column; }
.stat-num { font-size: 24px; font-weight: bold; color: #1e293b; line-height: 1; }
.stat-label { font-size: 12px; color: #94a3b8; margin-top: 4px; }

.memory-insight { background: white; border-radius: 14px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.memory-insight h3 { font-size: 15px; margin: 0 0 16px 0; font-weight: 600; color: #1e293b; }
.insight-text { padding: 12px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 16px; }
.insight-text.good { background: #d1fae5; color: #065f46; }
.insight-text.normal { background: #fef3c7; color: #d97706; }
.insight-text.hint { background: #eef2ff; color: #4f46e5; }
.curve-preview { height: 180px; }

.settings-section { background: white; border-radius: 14px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.settings-section h3 { font-size: 15px; margin: 0 0 16px 0; font-weight: 600; color: #1e293b; }
.settings-list { display: flex; flex-direction: column; gap: 12px; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #475569; }
.setting-item:last-child { border-bottom: none; }

.switch { position: relative; width: 48px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; inset: 0; background: #ccc; border-radius: 26px; transition: 0.3s; }
.slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
input:checked + .slider { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
input:checked + .slider:before { transform: translateX(22px); }

.logout-section { padding: 20px 0; }
.btn { padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 14px; transition: all 0.2s; border: none; }
.btn-danger { background: #fee2e2; color: #ef4444; }
.btn-danger:hover { background: #fecaca; }

.feedback-section { background: white; border-radius: 14px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.feedback-section h3 { font-size: 15px; margin: 0 0 16px 0; font-weight: 600; color: #1e293b; }
.feedback-form { display: flex; flex-direction: column; gap: 12px; }
.feedback-type { display: flex; gap: 8px; flex-wrap: wrap; }
.type-btn { padding: 6px 14px; border-radius: 20px; border: 1.5px solid #e2e8f0; background: white; cursor: pointer; font-size: 13px; color: #64748b; transition: all 0.2s; }
.type-btn:hover { border-color: #667eea; color: #667eea; }
.type-btn.active { border-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.feedback-textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 14px; resize: vertical; font-family: inherit; box-sizing: border-box; display: block; }
.feedback-textarea:focus { outline: none; border-color: #667eea; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 10px; border: none; cursor: pointer; font-size: 14px; }
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.feedback-submit { display: flex; align-items: center; justify-content: center; gap: 16px; }
.submit-success { font-size: 13px; color: #10b981; font-weight: 500; }
.feedback-list { margin-top: 20px; }
.feedback-list h4 { font-size: 13px; color: #64748b; margin: 0 0 12px 0; }
.feedback-item { padding: 14px; border-radius: 10px; background: #f8fafc; margin-bottom: 10px; }
.feedback-item-header { display: flex; gap: 8px; margin-bottom: 8px; }
.feedback-type-tag { padding: 2px 8px; border-radius: 10px; font-size: 11px; background: #eef2ff; color: #4f46e5; }
.feedback-status { padding: 2px 8px; border-radius: 10px; font-size: 11px; }
.feedback-status.pending { background: #fef3c7; color: #d97706; }
.feedback-status.reviewed { background: #dbeafe; color: #2563eb; }
.feedback-status.resolved { background: #d1fae5; color: #065f46; }
.feedback-content { font-size: 14px; color: #334155; margin: 0 0 8px 0; white-space: pre-wrap; }
.feedback-footer { display: flex; justify-content: space-between; align-items: center; }
.feedback-time { font-size: 11px; color: #94a3b8; }
.delete-btn { background: none; border: none; color: #ef4444; font-size: 12px; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
.delete-btn:hover { background: #fee2e2; }
</style>
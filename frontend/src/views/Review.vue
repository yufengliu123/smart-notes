<template>
  <div class="page-wrapper">
    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
        <h2>复习计划</h2>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="openAddModal">
          <span class="btn-icon">+</span> 添加复习
        </button>
      </div>
    </header>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card-lg blue">
        <div class="stat-icon">📝</div>
        <div class="stat-info">
          <span class="stat-num">{{ allNotes.length }}</span>
          <span class="stat-desc">总笔记</span>
        </div>
      </div>
      <div class="stat-card-lg purple">
        <div class="stat-icon">📋</div>
        <div class="stat-info">
          <span class="stat-num">{{ reviewStore.reviewItems.length }}</span>
          <span class="stat-desc">已计划</span>
        </div>
      </div>
      <div class="stat-card-lg orange">
        <div class="stat-icon">⏰</div>
        <div class="stat-info">
          <span class="stat-num">{{ todayItems.length }}</span>
          <span class="stat-desc">待复习</span>
        </div>
      </div>
      <div class="stat-card-lg green">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-num">{{ reviewStore.todayReviews }}</span>
          <span class="stat-desc">今日已复习</span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="review-grid">
      <!-- Left: Review Tasks -->
      <div class="review-main">
        <!-- Today Review Section -->
        <div class="section-card">
          <div class="section-header">
            <h3>📌 今日复习任务</h3>
            <span class="section-count" v-if="todayItems.length > 0">{{ todayItems.length }} 项</span>
          </div>

          <div v-if="loading" class="loading-state">
            <div class="skeleton-list">
              <div class="skeleton-item" v-for="i in 3" :key="i"></div>
            </div>
          </div>

          <div v-else-if="todayItems.length === 0" class="empty-tasks">
            <div class="empty-icon">🎉</div>
            <p class="empty-main">今日复习任务已完成！</p>
            <p class="empty-sub" v-if="upcomingItems.length > 0">明日待复习：{{ upcomingItems.length }} 篇</p>
          </div>

          <div v-else class="task-list">
            <div v-for="item in todayItems" :key="item.id" class="task-card">
              <div class="task-info">
                <div class="task-title-row">
                  <h4>{{ getNoteTitle(item.note_id) }}</h4>
                  <span class="task-status" :class="isOverdue(item.next_review_date) ? 'overdue' : 'today'">
                    {{ isOverdue(item.next_review_date) ? '已逾期' : '今日' }}
                  </span>
                </div>
                <div class="task-meta">
                  <span>🔁 已复习 {{ item.repetitions || 0 }} 次</span>
                  <span>📅 上次 {{ formatDate(item.last_review_date || item.next_review_date) }}</span>
                </div>
                <div v-if="item.expired" class="expired-warning">
                 ⚠️ 已超过复习窗口期，请尽快复习！
                </div>
                <div class="memory-bar">
                  <div class="memory-bar-fill" :style="{ width: getMemoryPercent(item) + '%' }"></div>
                  <span class="memory-label">记忆强度 {{ getMemoryPercent(item) }}%</span>
                </div>
              </div>
              <div class="task-actions">
                <button class="btn btn-outline btn-sm" @click="removeItem(item)">移除</button>
                <button class="btn btn-primary btn-sm" @click="openReviewModal(item)">开始复习</button>
            </div>
          </div>
        </div>

        <!-- Review Stats -->
        <div class="section-card">
          <div class="section-header">
            <h3>📊 复习统计</h3>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-icon">🔥</span>
              <div class="stat-detail">
                <span class="stat-value">{{ continuousDays }}</span>
                <span class="stat-label">连续复习天数</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📈</span>
              <div class="stat-detail">
                <span class="stat-value">{{ totalReviews }}</span>
                <span class="stat-label">历史总复习</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">✅</span>
              <div class="stat-detail">
                <span class="stat-value">{{ reviewStore.todayReviews }}</span>
                <span class="stat-label">今日已完成</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📋</span>
              <div class="stat-detail">
                <span class="stat-value">{{ reviewStore.scheduledNotes }}</span>
                <span class="stat-label">计划中笔记</span>
              </div>
            </div>
          </div>
          <div class="weekly-progress">
            <div class="progress-header">
              <span>📅 本周进度：{{ weeklyCompleted }} / {{ weeklyGoal }} 次</span>
              <div class="goal-edit">
                <span v-if="!editingGoal" class="edit-btn" @click="startEditGoal">✏️ 设置目标</span>
                <span v-else>
                  <input v-model="goalInput" class="goal-input" type="number" min="1" max="100" @keyup.enter="saveGoal" />
                  <button class="save-btn" @click="saveGoal">✓</button>
                  <button class="cancel-btn" @click="cancelEditGoal">✕</button>
                </span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min((weeklyCompleted / weeklyGoal) * 100, 100) + '%' }"></div>
            </div>
            <p class="progress-tip" v-if="weeklyCompleted >= weeklyGoal">🎉 本周目标已达成！</p>
            <p class="progress-tip" v-else>还差 {{ weeklyGoal - weeklyCompleted }} 次即可完成本周目标</p>
          </div>
          <div class="trend-chart-container" ref="trendChartRef"></div>
          <div class="trend-chart-tip">
            <p>📊 本图展示近8次复习记录的趋势变化，仅保留最近8条数据</p>
          </div>
        </div>
      </div>

        <!-- Upcoming Section -->
        <div class="section-card" v-if="upcomingItems.length > 0">
          <div class="section-header">
            <h3>📅 即将复习</h3>
            <span class="section-count">{{ upcomingItems.length }} 篇</span>
          </div>
          <div class="upcoming-list">
            <div v-for="item in upcomingItems.slice(0, 3)" :key="item.id" class="upcoming-item">
              <span class="upcoming-title">{{ getNoteTitle(item.note_id) }}</span>
              <div class="upcoming-right">
                <span class="upcoming-date">{{ formatDate(item.next_review_date) }}</span>
                <button class="upcoming-delete" @click.stop="removeItem(item)" title="移除">✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Review History -->
        <div class="section-card">
          <div class="section-header">
            <h3>📋 最近复习记录</h3>
            <span class="section-count" v-if="reviewHistory.length > 0">{{ reviewHistory.length }}/8 条</span>
          </div>
          <div v-if="reviewHistory.length === 0" class="empty-history">
            <div class="empty-icon">📝</div>
            <p class="empty-main">暂无复习记录</p>
            <p class="empty-sub">完成复习后这里会显示记录</p>
          </div>
          <div v-else class="history-list">
            <div v-for="(item, index) in reviewHistory.slice(0, 8)" :key="index" class="history-item">
              <div class="history-info">
                <span class="history-title">{{ item.noteTitle }}</span>
                <span class="history-meta">{{ item.reviewDate }}</span>
              </div>
              <span class="history-quality" :class="getQualityClass(item.quality)">
                {{ getQualityLabel(item.quality) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Chart + Tips -->
      <div class="review-aside">
        <!-- Forgetting Curve Chart -->
        <div class="section-card">
          <div class="section-header">
            <h3>📈 遗忘曲线</h3>
          </div>
          <div class="chart-container" ref="curveChartRef"></div>
          <div class="curve-tip">
            <div class="tip-title">📖 什么是遗忘曲线？</div>
            <p>遗忘曲线展示了我们不复习时知识遗忘的速度。红色虚线显示自然遗忘——仅1天后就会忘记66%！</p>
            <p>绿色线条展示间隔复习的力量——通过科学复习，30天后仍能保持65%的记忆。</p>
            <div class="tip-title" style="margin-top: 12px;">📌 推荐复习周期</div>
            <p>基于艾宾浩斯研究：<strong>1天 → 2天 → 4天 → 7天 → 15天 → 30天</strong></p>
            <p>按此周期复习，可以用最少的精力达到最佳长期记忆效果。</p>
          </div>
        </div>

        <!-- Memory Tips -->
        <div class="section-card tips-card">
          <div class="section-header">
            <h3>🧠 记忆技巧</h3>
          </div>
          <div class="tips-list">
            <div class="tip-item">
              <span class="tip-num">1</span>
              <span>主动回忆比被动阅读记忆效果高50%，尝试闭眼回想要点</span>
            </div>
            <div class="tip-item">
              <span class="tip-num">2</span>
              <span>分散学习比集中学习记忆更持久，每天复习一点</span>
            </div>
            <div class="tip-item">
              <span class="tip-num">3</span>
              <span>睡前复习可显著提升长期记忆，醒来后记忆更清晰</span>
            </div>
            <div class="tip-item">
              <span class="tip-num">4</span>
              <span>联想记忆法：将新知识与熟悉的事物关联起来</span>
            </div>
            <div class="tip-item">
              <span class="tip-num">5</span>
              <span>间隔重复是最有效的记忆方式，遵循艾宾浩斯曲线</span>
            </div>
            <div class="tip-item">
              <span class="tip-num">6</span>
              <span>笔记内容图像化更容易记忆，使用图表和颜色</span>
            </div>
            <div class="tip-item">
              <span class="tip-num">7</span>
              <span>教会别人是最好的学习方式，讲出来记得更牢</span>
            </div>
          </div>
        </div>

        <!-- Today's Progress -->
        <div class="section-card">
          <div class="section-header">
            <h3>📅 今日进度</h3>
          </div>
          <div class="today-stats">
            <div class="today-stat">
              <span class="today-num">{{ reviewStore.todayReviews }}</span>
              <span class="today-label">已完成复习</span>
            </div>
            <div class="today-divider"></div>
            <div class="today-stat">
              <span class="today-num">{{ todayItems.length }}</span>
              <span class="today-label">待复习笔记</span>
            </div>
            <div class="today-divider"></div>
            <div class="today-stat">
              <span class="today-num">{{ upcomingItems.length }}</span>
              <span class="today-label">即将复习</span>
            </div>
          </div>
        </div>

        <!-- Quick Tips -->
        <div class="section-card tips-card">
          <div class="section-header">
            <h3>💡 复习小贴士</h3>
          </div>
          <div class="tips-list">
            <div class="tip-item">
              <span class="tip-icon">🌙</span>
              <span>早晨大脑最清醒，适合复习难点知识</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">🎵</span>
              <span>复习时听轻音乐可提升专注力</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">✍️</span>
              <span>手写笔记比打字更能加深记忆</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">🧘</span>
              <span>深呼吸有助于强化记忆巩固</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">☕</span>
              <span>每隔45分钟休息5分钟效率最高</span>
            </div>
          </div>
        </div>

        <!-- Optimal Conditions -->
        <div class="section-card">
          <div class="section-header">
            <h3>🌟 最佳学习状态</h3>
          </div>
          <div class="condition-list">
            <div class="condition-item">
              <span class="condition-icon">⏰</span>
              <div class="condition-text">
                <strong>番茄工作法</strong>
                <span>25分钟专注 + 5分钟休息</span>
              </div>
            </div>
            <div class="condition-item">
              <span class="condition-icon">💧</span>
              <div class="condition-text">
                <strong>保持水分</strong>
                <span>每小时喝一口水促进循环</span>
              </div>
            </div>
            <div class="condition-item">
              <span class="condition-icon">🌿</span>
              <div class="condition-text">
                <strong>新鲜空气</strong>
                <span>每20分钟远眺20秒缓解疲劳</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Motivation -->
        <div class="section-card motivation-card">
          <div class="motivation-quote">"重复是记忆的母亲，理解是记忆的父亲"</div>
          <div class="motivation-author">— 艾宾浩斯</div>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="closeReviewModal">
      <div class="modal-content">
        <h2>复习评分</h2>
        <p class="review-tip">你对这条笔记的掌握程度如何？</p>
        <div class="rating-grid">
          <button v-for="score in [0,1,2,3,4,5]" :key="score"
            :class="['rating-btn', { selected: selectedScore === score }]"
            @click="selectedScore = score">
            <span class="rating-score">{{ score }}</span>
            <span class="rating-label">{{ getRatingLabel(score) }}</span>
          </button>
        </div>
        <div class="modal-actions">
          <button v-if="relatedNotes.length > 0" class="btn btn-ghost" @click="backToRelated">← 返回相关笔记</button>
          <button class="btn btn-ghost" @click="closeReviewModal">取消</button>
          <button class="btn btn-primary" :disabled="selectedScore === null" @click="submitReview">
            提交并更新计划
          </button>
        </div>
      </div>
    </div>

    <!-- Add Review Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3>添加到复习计划</h3>
        <div class="notes-select">
          <div v-if="allNotes.length === 0" class="no-notes">暂无笔记可添加</div>
          <div v-else v-for="note in allNotes" :key="note.id"
            class="note-select-item"
            :class="{ selected: selectedNoteId === note.id, already: isAlreadyScheduled(note.id) }"
            @click="selectedNoteId = note.id">
            <div class="note-select-info">
              <span class="note-select-title">{{ note.title }}</span>
              <span class="note-select-cat">{{ note.category || '未分类' }}</span>
            </div>
            <span v-if="isAlreadyScheduled(note.id)" class="already-badge">已在计划中</span>
          </div>
        </div>
        <div class="window-select" v-if="selectedNoteId">
          <span class="window-label">复习计划有效期：</span>
          <div class="window-options">
            <button v-for="d in [3, 7, 14, 30]" :key="d" :class="['window-btn', { active: selectedWindowDays === d }]" @click="selectedWindowDays = d">{{ d }}天</button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" :disabled="!selectedNoteId" @click="addToReview">添加</button>
        </div>
      </div>
    </div>
    <div v-if="showRelatedModal" class="modal-overlay" @click.self="closeRelatedModal">
      <div class="modal-content">
        <h3>🔗 相关笔记推荐</h3>
        <p class="review-tip">根据关键词关联，以下笔记可能也值得复习：</p>
        <div class="related-list">
          <div v-for="note in relatedNotesToAdd" :key="note.id" class="related-item">
            <div class="related-info">
              <span class="related-title">{{ note.title }}</span>
              <span class="related-match">匹配关键词: {{ note.matchScore }} 个</span>
            </div>
            <div class="related-actions">
              <button class="btn btn-sm btn-ghost" @click="viewRelatedNote(note)">查看</button>
              <button v-if="!reviewStore.reviewItems.some(i => i.note_id === note.id)" class="btn btn-sm btn-primary" @click="addRelatedToReview(note.id); relatedNotesToAdd = relatedNotesToAdd.filter(n => n.id !== note.id)">加入复习</button>
              <span v-else class="already-added">已在计划中</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="closeRelatedModal">关闭</button>
          <button v-if="relatedNotesToAdd.length > 0" class="btn btn-primary" @click="goToRating">开始评分 →</button>
        </div>
      </div>
    </div>

    <!-- View Note Modal -->
    <div v-if="viewingNote" class="modal-overlay" @click.self="viewingNote = null">
      <div class="modal-content view-modal">
        <div class="modal-header">
          <h3>{{ viewingNote.title }}</h3>
          <button class="close-btn" @click="viewingNote = null">×</button>
        </div>
        <div class="modal-body">
          <div class="note-meta">
            <span class="tag tag-primary">{{ viewingNote.category || '未分类' }}</span>
            <span v-for="kw in (viewingNote.keywords || '').split(',').filter(Boolean)" :key="kw" class="tag">{{ kw }}</span>
          </div>
          <div class="note-content" v-html="viewingNote.content"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="viewingNote = null">关闭</button>
          <button class="btn btn-primary" @click="closeViewingNote">复习结束 →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useReviewStore } from '../stores/auth'
import { useNoteStore as useNotesStore } from '../stores/notes'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import api from '../services/api'

const router = useRouter()
const reviewStore = useReviewStore()
const notesStore = useNotesStore()
const curveChartRef = ref(null)

const allNotes = ref([])
const loading = ref(false)
const showReviewModal = ref(false)
const showAddModal = ref(false)
const currentItem = ref(null)
const selectedScore = ref(null)
const selectedNoteId = ref(null)
const selectedWindowDays = ref(7)
const reviewHistory = ref([])
const trendChartRef = ref(null)
const continuousDays = ref(0)
const totalReviews = ref(0)
const weeklyGoal = ref(parseInt(localStorage.getItem('weekly_goal') || '5'))
const weeklyCompleted = ref(0)
const trendData = ref([0, 0, 0, 0, 0, 0, 0])
const showRelatedModal = ref(false)
const relatedNotesToAdd = ref([])
const viewingNote = ref(null)
const editingGoal = ref(false)
const goalInput = ref(weeklyGoal.value)

function startEditGoal() {
  goalInput.value = weeklyGoal.value
  editingGoal.value = true
}

function saveGoal() {
  const val = parseInt(goalInput.value)
  if (val > 0 && val <= 100) {
    weeklyGoal.value = val
    localStorage.setItem('weekly_goal', val)
  }
  editingGoal.value = false
}

function cancelEditGoal() {
  editingGoal.value = false
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const todayItems = computed(() => {
  const now = new Date()
  return reviewStore.reviewItems.filter(i => new Date(i.next_review_date) <= now)
})

const upcomingItems = computed(() => {
  const now = new Date()
  return reviewStore.reviewItems.filter(i => new Date(i.next_review_date) > now)
})

const personalCurveParams = computed(() => {
  if (reviewHistory.length < 3) return null
  const points = reviewHistory.map(h => ({
    interval: 1,
    recallRate: h.quality >= 4 ? 0.9 : h.quality >= 2 ? 0.6 : 0.3
  }))
  return fitExponentialDecay(points)
})

function fitExponentialDecay(points) {
  const n = points.length
  if (n < 2) return { a: 1, b: 0.1 }
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let p of points) {
    const x = p.interval
    const y = Math.log(Math.max(0.1, p.recallRate))
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  }
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return { a: 1, b: 0.1 }
  const b = Math.max(0.05, Math.min(2, (n * sumXY - sumX * sumY) / denom))
  const lnA = (sumY - b * sumX) / n
  const a = Math.exp(lnA)
  return { a: Math.min(1.2, a), b }
}

function predictNextReview(item) {
  if (personalCurveParams.value) {
    const { b } = personalCurveParams.value
    const baseInterval = Math.round(7 / b)
    const reps = item.repetitions || 0
    return Math.min(30, Math.max(1, baseInterval - reps))
  }
  return [1, 2, 4, 7, 15, 30][Math.min(item.repetitions || 0, 5)]
}

const relatedNotes = computed(() => {
  if (!currentItem.value) return []
  const currentNote = allNotes.value.find(n => n.id === currentItem.value.note_id)
  if (!currentNote) return []
  const currentKws = (currentNote.keywords || '').toLowerCase().split(',').filter(Boolean)
  return allNotes.value
    .filter(n => n.id !== currentItem.value.note_id)
    .map(n => {
      const kws = (n.keywords || '').toLowerCase().split(',').filter(Boolean)
      const shared = currentKws.filter(k => k.trim() && kws.some(nk => nk.includes(k.trim()) || k.trim().includes(nk)))
      return { ...n, matchScore: shared.length }
    })
    .filter(n => n.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)
})

function getNoteTitle(noteId) {
  const note = allNotes.value.find(n => n.id === noteId)
  return note?.title || '笔记已删除'
}

function getMemoryPercent(item) {
  const base = 100
  const decay = item.repetitions || 0
  return Math.max(20, Math.round(base - decay * 12))
}

function isOverdue(date) {
  return dayjs(date).isBefore(dayjs(), 'day')
}

function formatDate(date) {
  if (!date) return '-'
  const d = dayjs(date)
  const now = dayjs()
  if (d.isSame(now, 'day')) return '今天'
  if (d.isSame(now.subtract(1, 'day'), 'day')) return '昨天'
  if (d.isSame(now.add(1, 'day'), 'day')) return '明天'
  return d.format('MM/DD')
}

function getRatingLabel(score) {
  return ['完全遗忘', '错误多', '有些印象', '基本正确', '正确', '滚瓜烂熟'][score] || ''
}

function getQualityClass(quality) {
  if (quality >= 4) return 'quality-good'
  if (quality >= 2) return 'quality-fair'
  return 'quality-poor'
}

function getQualityLabel(quality) {
  if (quality >= 4) return '记得很好'
  if (quality >= 2) return '有些模糊'
  return '需要重温'
}

function calcReviewStats(history) {
  if (!history || history.length === 0) {
    continuousDays.value = 0
    totalReviews.value = 0
    weeklyCompleted.value = 0
    trendData.value = [0, 0, 0, 0, 0, 0, 0]
    return
  }
  totalReviews.value = history.length

  const dates = [...new Set(history.map(h => h.reviewDate))].sort().reverse()
  let days = 0
  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 && dates[i] !== today && dates[i] !== yesterday) break
    if (i > 0) {
      const prev = dayjs(dates[i - 1]).unix()
      const curr = dayjs(dates[i]).unix()
      if (prev - curr > 86400) break
    }
    days++
  }
  continuousDays.value = days

  const weekAgo = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
  weeklyCompleted.value = history.filter(h => h.reviewDate >= weekAgo).length

  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const day = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    const count = history.filter(h => h.reviewDate === day).length
    last7Days.push(count)
  }
  trendData.value = last7Days
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  const chart = echarts.init(trendChartRef.value)
  chart.setOption({
    grid: { top: 5, left: 5, right: 5, bottom: 5 },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', show: false },
    series: [{
      data: trendData.value,
      type: 'line',
      smooth: true,
      lineStyle: { color: '#667eea' },
      areaStyle: { color: 'rgba(102,126,234,0.15)' },
      symbol: 'circle',
      symbolSize: 4
    }]
  })
}

function openReviewModal(item) {
  currentItem.value = item
  selectedScore.value = null
  const note = allNotes.value.find(n => n.id === item.note_id)
  if (note) {
    viewingNote.value = note
  } else {
    showReviewModal.value = true
  }
}

function closeViewingNote() {
  viewingNote.value = null
  showReviewModal.value = true
}

function goToRating() {
  showRelatedModal.value = false
  showReviewModal.value = true
}

function backToRelated() {
  showReviewModal.value = false
  relatedNotesToAdd.value = relatedNotes.value
  showRelatedModal.value = true
}

function closeReviewModal() {
  showReviewModal.value = false
  currentItem.value = null
}

function onReviewComplete() {
  if (relatedNotes.value.length > 0) {
    relatedNotesToAdd.value = relatedNotes.value
    showRelatedModal.value = true
  }
  closeReviewModal()
}

function addRelatedToReview(noteId) {
  if (reviewStore.reviewItems.some(i => i.note_id === noteId)) return
  reviewStore.reviewItems.push({
    id: Date.now(),
    note_id: noteId,
    next_review_date: dayjs().add(1, 'day').toISOString(),
    last_review_date: null,
    repetitions: 0,
    ease_factor: 2.5
  })
  reviewStore.saveToStorage()
}

function closeRelatedModal() {
  showRelatedModal.value = false
  relatedNotesToAdd.value = []
}

function viewRelatedNote(note) { viewingNote.value = note }

function submitReview() {
  if (selectedScore.value === null || !currentItem.value) return
  const q = selectedScore.value
  let { ease_factor = 2.5, repetitions = 0 } = currentItem.value
  let interval = personalCurveParams.value
    ? predictNextReview(currentItem.value)
    : [1, 1, 2, 4, 7, 15][Math.min(repetitions, 5)]
  if (q < 3) {
    interval = 1
    ease_factor = Math.max(1.3, ease_factor - 0.2)
  } else {
    ease_factor = Math.max(1.3, ease_factor + (q - 3) * 0.1)
  }
  repetitions++
  const nextDate = dayjs().add(interval, 'day').toISOString()
  const idx = reviewStore.reviewItems.findIndex(i => i.id === currentItem.value.id)
  if (idx >= 0) {
    reviewStore.reviewItems.splice(idx, 1, {
      ...reviewStore.reviewItems[idx],
      last_review_date: new Date().toISOString(),
      next_review_date: nextDate,
      repetitions,
      ease_factor
    })
  }
  reviewStore.todayReviews++
  reviewStore.dueCount = todayItems.value.length
  reviewStore.scheduledNotes = reviewStore.reviewItems.length
  reviewStore.saveToStorage()

  const noteTitle = getNoteTitle(currentItem.value.note_id)
  reviewHistory.value.unshift({
    noteTitle,
    reviewDate: dayjs().format('YYYY-MM-DD'),
    quality: q
  })
  if (reviewHistory.value.length > 8) {
    reviewHistory.value = reviewHistory.value.slice(0, 8)
  }
  localStorage.setItem('review_history', JSON.stringify(reviewHistory.value))
  calcReviewStats(reviewHistory.value)

  api.post('/review/review/' + currentItem.value.id, { quality: q }).catch(e => { console.error('review sync error:', e) })

  onReviewComplete()
}

function openAddModal() {
  selectedNoteId.value = null
  selectedWindowDays.value = 7
  showAddModal.value = true
}

async function addToReview() {
  if (!selectedNoteId.value) return
  const exists = reviewStore.reviewItems.find(i => i.note_id === selectedNoteId.value)
  if (exists) { return }
  const newItem = {
    id: Date.now(),
    note_id: selectedNoteId.value,
    next_review_date: new Date().toISOString(),
    last_review_date: null,
    repetitions: 0,
    ease_factor: 2.5,
    added_at: new Date().toISOString(),
    window_days: selectedWindowDays.value
  }
  reviewStore.reviewItems.push(newItem)
  reviewStore.scheduledNotes = reviewStore.reviewItems.length
  reviewStore.dueCount = todayItems.value.length
  reviewStore.saveToStorage()
  showAddModal.value = false
  try {
    const res = await api.post('/review/schedule/' + selectedNoteId.value, { next_review_date: new Date().toISOString(), window_days: selectedWindowDays.value })
    if (res.code !== 200) { console.error('sync failed:', res.message) }
  } catch (e) { console.error('sync error:', e) }
}

function removeItem(item) {
  if (!confirm('确定移除？')) return
  reviewStore.removeItem(item.id)
}

function isAlreadyScheduled(noteId) {
  return reviewStore.reviewItems.some(i => i.note_id === noteId)
}

function toggleAddNote(noteId) {
  const already = isAlreadyScheduled(noteId)
  if (already) {
    const item = reviewStore.reviewItems.find(i => i.note_id === noteId)
    if (item) removeItem(item)
    return
  }
  const newItem = {
    id: Date.now(),
    note_id: noteId,
    next_review_date: new Date().toISOString(),
    last_review_date: null,
    repetitions: 0,
    ease_factor: 2.5,
    added_at: new Date().toISOString()
  }
  reviewStore.reviewItems.push(newItem)
  reviewStore.scheduledNotes = reviewStore.reviewItems.length
  reviewStore.dueCount = todayItems.value.length
  reviewStore.saveToStorage()
  api.post('/review/schedule/' + noteId, { next_review_date: new Date().toISOString() }).catch(e => { console.error('sync error:', e) })
}

function renderCurveChart() {
  if (!curveChartRef.value) return
  const chart = echarts.init(curveChartRef.value)
  const ebbinghausData = [
    [0, 100], [1, 44], [2, 35], [6, 25], [12, 20], [24, 18], [30, 15]
  ]
  const reviewData = [[0, 100], [1, 90], [2, 82], [7, 75], [15, 70], [30, 65]]
  chart.setOption({
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].data[0]}天后：${p[0].data[1]}%` },
    legend: { data: ['无复习', '有复习'], orient: 'horizontal', bottom: 2, left: 'center', textStyle: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 10 } },
    grid: { top: 8, left: 45, right: 15, bottom: 52 },
    xAxis: { type: 'value', name: '天数', nameLocation: 'center', nameGap: 22, min: 0, max: 30, axisLabel: { fontFamily: 'Microsoft YaHei, Arial', margin: 6 }, nameTextStyle: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 10 } },
    yAxis: { type: 'value', name: '记忆率%', nameLocation: 'center', nameGap: 30, min: 0, max: 100, axisLabel: { fontFamily: 'Microsoft YaHei, Arial', margin: 6 }, nameTextStyle: { fontFamily: 'Microsoft YaHei, Arial', fontSize: 10 } },
    series: [
      { name: '无复习', type: 'line', data: ebbinghausData, smooth: true, lineStyle: { color: '#ef4444', type: 'dashed' }, areaStyle: { color: 'rgba(239,68,68,0.1)' }, symbol: 'circle', symbolSize: 5 },
      { name: '有复习', type: 'line', data: reviewData, smooth: true, lineStyle: { color: '#10b981' }, areaStyle: { color: 'rgba(16,185,129,0.1)' }, symbol: 'circle', symbolSize: 5 }
    ]
  })
}

onMounted(async () => {
  loading.value = true
  try {
    await notesStore.fetchNotes({ pageSize: 100 })
    allNotes.value = notesStore.notes || []
    await reviewStore.fetchDueList()
    reviewStore.cleanupExpiredItems()
    await reviewStore.fetchStats()
    if (reviewStore.reviewItems.length === 0) {
      reviewStore.dueCount = 0
      reviewStore.scheduledNotes = 0
    }
    const savedHistory = localStorage.getItem('review_history')
    if (savedHistory) {
      reviewHistory.value = JSON.parse(savedHistory)
    }
    calcReviewStats(reviewHistory.value)
  } catch (e) {}
  loading.value = false
  nextTick(() => {
    renderCurveChart()
    renderTrendChart()
  })

  syncTimer = setInterval(async () => {
    await reviewStore.fetchDueList()
    reviewStore.cleanupExpiredItems()
  }, 30000)
})

let syncTimer = null
onUnmounted(() => {
  if (syncTimer) clearInterval(syncTimer)
})
</script>

<style scoped>
.page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 24px;
  min-height: calc(100vh - 60px);
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
.back-icon {
  font-size: 16px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.btn-icon { font-size: 16px; }

/* Stats Row */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card-lg { background: white; border-radius: 14px; padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid; transition: all 0.2s; }
.stat-card-lg:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.stat-card-lg.blue { border-left-color: #4361ee; }
.stat-card-lg.purple { border-left-color: #8b5cf6; }
.stat-card-lg.orange { border-left-color: #f59e0b; }
.stat-card-lg.green { border-left-color: #10b981; }
.stat-icon { font-size: 28px; }
.stat-info { display: flex; flex-direction: column; }
.stat-num { font-size: 26px; font-weight: bold; color: #1e293b; line-height: 1; }
.stat-desc { font-size: 12px; color: #94a3b8; margin-top: 4px; }

/* Grid Layout */
.review-grid { display: grid; grid-template-columns: 1fr 400px; gap: 20px; align-items: stretch; }
.review-main { display: flex; flex-direction: column; gap: 20px; }
.review-aside { display: flex; flex-direction: column; gap: 20px; justify-content: flex-start; }

/* Section Card */
.section-card { background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-header h3 { font-size: 15px; margin: 0; font-weight: 600; color: #1e293b; }
.section-count { font-size: 12px; background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 10px; }

/* Empty Tasks */
.empty-tasks { text-align: center; padding: 40px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-main { font-size: 16px; color: #10b981; font-weight: 500; margin-bottom: 8px; }
.empty-sub { font-size: 13px; color: #94a3b8; margin: 0; }

/* Task List */
.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-card { background: #f8f9ff; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eef2ff; }
.task-info { flex: 1; }
.task-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.task-title-row h4 { font-size: 15px; margin: 0; font-weight: 500; color: #1e293b; }
.task-status { font-size: 11px; padding: 2px 8px; border-radius: 10px; }
.task-status.today { background: #fef3c7; color: #d97706; }
.task-status.overdue { background: #fee2e2; color: #ef4444; }
.task-meta { display: flex; gap: 16px; font-size: 12px; color: #94a3b8; margin-bottom: 10px; }
.memory-bar { background: #e2e8f0; border-radius: 10px; height: 8px; position: relative; overflow: hidden; }
.memory-bar-fill { height: 100%; background: linear-gradient(90deg, #10b981, #6366f1); border-radius: 10px; transition: width 0.3s; }
.memory-label { font-size: 11px; color: #64748b; margin-top: 4px; }
.expired-warning { font-size: 12px; color: #ef4444; background: #fef2f2; padding: 6px 10px; border-radius: 6px; margin-top: 6px; font-weight: 500; }
.task-actions { display: flex; gap: 8px; margin-left: 16px; }
.btn-sm { padding: 5px 10px; font-size: 12px; }

/* Upcoming */
.upcoming-list { display: flex; flex-direction: column; gap: 8px; }
.upcoming-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8f9ff; border-radius: 8px; }
.upcoming-title { font-size: 13px; color: #1e293b; }
.upcoming-right { display: flex; align-items: center; gap: 8px; }
.upcoming-date { font-size: 12px; color: #94a3b8; }
.upcoming-delete { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 12px; padding: 2px 6px; border-radius: 4px; }
.upcoming-delete:hover { background: #fee2e2; color: #ef4444; }

/* History */
.empty-history { text-align: center; padding: 20px; }
.history-list { display: flex; flex-direction: column; gap: 8px; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f8f9ff; border-radius: 8px; }
.history-info { display: flex; flex-direction: column; gap: 2px; }
.history-title { font-size: 13px; font-weight: 500; color: #1e293b; }
.history-meta { font-size: 11px; color: #94a3b8; }
.history-quality { font-size: 11px; padding: 2px 8px; border-radius: 10px; }
.history-quality.quality-good { background: #d1fae5; color: #065f46; }
.history-quality.quality-fair { background: #fef3c7; color: #d97706; }
.history-quality.quality-poor { background: #fee2e2; color: #ef4444; }

/* Review Stats */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.stat-item { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8f9ff; border-radius: 10px; }
.stat-icon { font-size: 24px; }
.stat-detail { display: flex; flex-direction: column; }
.stat-value { font-size: 20px; font-weight: bold; color: #1e293b; line-height: 1; }
.stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.weekly-progress { margin-bottom: 12px; }
.progress-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; margin-bottom: 6px; }
.progress-percent { font-weight: 600; color: #667eea; }
.progress-bar { background: #e2e8f0; border-radius: 6px; height: 8px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 6px; transition: width 0.3s; }
.goal-edit { display: flex; align-items: center; gap: 4px; }
.edit-btn { cursor: pointer; font-size: 11px; opacity: 0.6; }
.edit-btn:hover { opacity: 1; }
.goal-input { width: 50px; padding: 2px 4px; border: 1px solid #667eea; border-radius: 4px; font-size: 12px; text-align: center; }
.save-btn, .cancel-btn { background: none; border: none; cursor: pointer; font-size: 11px; padding: 2px 4px; }
.save-btn { color: #10b981; }
.cancel-btn { color: #ef4444; }
.progress-tip { font-size: 12px; color: #64748b; margin: 6px 0 0 0; text-align: center; }
.trend-chart-container { height: 60px; }
.trend-chart-tip { margin-top: 6px; text-align: center; }
.trend-chart-tip p { font-size: 11px; color: #94a3b8; margin: 0; }

/* Add Notes */
.add-notes-list { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
.add-note-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: #f8fafc; cursor: pointer; transition: all 0.2s; }
.add-note-item:hover { background: #eef2ff; }
.add-note-item.already { background: #f0fdf4; }
.add-note-info { display: flex; flex-direction: column; gap: 2px; }
.add-note-title { font-size: 13px; font-weight: 500; color: #1e293b; }
.add-note-cat { font-size: 11px; color: #94a3b8; }
.already-badge { font-size: 12px; color: #10b981; font-weight: 500; }
.add-badge { font-size: 12px; color: #667eea; font-weight: 500; }

/* Chart */
.chart-container { height: 260px; }
.curve-tip { margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; }
.curve-tip .tip-title { font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
.curve-tip p { font-size: 11px; color: #64748b; margin: 0 0 6px 0; line-height: 1.4; }

/* Tips */
.tips-list { display: flex; flex-direction: column; gap: 12px; }
.tip-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #475569; line-height: 1.5; }
.tip-num { background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-size: 11px; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tip-icon { font-size: 16px; flex-shrink: 0; }

/* Today Stats */
.today-stats { display: flex; align-items: center; justify-content: space-around; padding: 8px 0; }
.today-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.today-num { font-size: 28px; font-weight: bold; color: #667eea; line-height: 1; }
.today-label { font-size: 11px; color: #94a3b8; }
.today-divider { width: 1px; height: 40px; background: #e2e8f0; }

/* Optimal Conditions */
.condition-list { display: flex; flex-direction: column; gap: 12px; }
.condition-item { display: flex; align-items: center; gap: 12px; }
.condition-icon { font-size: 20px; flex-shrink: 0; }
.condition-text { display: flex; flex-direction: column; gap: 2px; }
.condition-text strong { font-size: 13px; color: #1e293b; }
.condition-text span { font-size: 11px; color: #94a3b8; }

/* Motivation */
.motivation-card { background: linear-gradient(135deg, #667eea, #764ba2); text-align: center; padding: 20px; }
.motivation-quote { font-size: 13px; color: white; font-style: italic; line-height: 1.5; }
.motivation-author { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 8px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-content { background: white; border-radius: 16px; padding: 24px; width: 460px; max-width: 90vw; }
.modal-content h2, .modal-content h3 { margin: 0 0 8px 0; font-size: 18px; font-weight: 600; }
.review-tip { color: #94a3b8; font-size: 14px; margin-bottom: 20px; }
.rating-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
.rating-btn { display: flex; flex-direction: column; align-items: center; padding: 14px; border: 2px solid #e4e7ed; border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s; }
.rating-btn:hover { border-color: #667eea; }
.rating-btn.selected { border-color: #667eea; background: #eef2ff; }
.rating-score { font-size: 22px; font-weight: bold; color: #667eea; }
.rating-label { font-size: 11px; color: #94a3b8; margin-top: 4px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; }

.notes-select { max-height: 280px; overflow-y: auto; margin-bottom: 16px; }
.note-select-item { padding: 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
.note-select-item:hover { background: #f8f9ff; }
.note-select-item.selected { background: #eef2ff; }
.note-select-item.already { opacity: 0.5; }
.note-select-info { display: flex; flex-direction: column; gap: 2px; }
.note-select-title { font-size: 14px; font-weight: 500; color: #1e293b; }
.note-select-cat { font-size: 11px; color: #94a3b8; }
.already-badge { font-size: 11px; color: #10b981; background: #d1fae5; padding: 2px 8px; border-radius: 10px; }
.no-notes { text-align: center; padding: 40px; color: #94a3b8; }
.window-select { margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; }
.window-label { font-size: 13px; color: #475569; display: block; margin-bottom: 8px; }
.window-options { display: flex; gap: 8px; }
.window-btn { flex: 1; padding: 8px; border: 1.5px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; font-size: 13px; color: #64748b; transition: all 0.2s; }
.window-btn:hover { border-color: #667eea; color: #667eea; }
.window-btn.active { border-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }

/* Buttons */
.btn { padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; transform: none; box-shadow: none; }
.btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
.btn-ghost:hover { background: #f1f5f9; }
.btn-outline { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
.btn-outline:hover { background: #f1f5f9; }
.btn-sm { padding: 5px 10px; font-size: 12px; }

.related-list { max-height: 300px; overflow-y: auto; margin-bottom: 16px; }
.related-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f1f5f9; }
.related-item:last-child { border-bottom: none; }
.related-info { display: flex; flex-direction: column; gap: 4px; }
.related-title { font-size: 14px; font-weight: 500; color: #1e293b; }
.related-match { font-size: 11px; color: #667eea; }
.related-actions { display: flex; gap: 8px; align-items: center; }
.already-added { font-size: 11px; color: #10b981; }

.view-modal { background: white; border-radius: 16px; padding: 24px; width: 600px; max-width: 90vw; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #eee; }
.modal-header h3 { margin: 0; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #999; }
.modal-body { flex: 1; overflow-y: auto; padding: 16px 0; }
.note-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.note-content { font-size: 14px; line-height: 1.8; }
.note-content :deep(p) { margin: 0 0 12px 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 12px; border-top: 1px solid #eee; }
.tag { background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: #666; }
.tag-primary { background: #eef2ff; color: #4f46e5; }
</style>
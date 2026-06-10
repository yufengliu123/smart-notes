<template>
  <div class="home-layout">
    <header class="header">
      <div class="header-left">
        <h2>📚 智能学习助手</h2>
      </div>
      <div class="header-right">
        <span class="badge" v-if="reviewStore.dueCount > 0">{{ reviewStore.dueCount }} 待复习</span>
        <span class="username">👤 {{ auth.user?.username }}</span>
        <button class="btn btn-ghost" @click="handleLogout">退出</button>
      </div>
    </header>

    <div class="main-content">
      <aside class="sidebar">
        <nav class="nav-menu">
          <router-link to="/" class="nav-item" active-class="active">
            <span class="icon">🏠</span> 首页概览
          </router-link>
          <router-link to="/notes" class="nav-item" active-class="active">
            <span class="icon">📝</span> 笔记列表
          </router-link>
          <router-link to="/graph" class="nav-item" active-class="active">
            <span class="icon">🕸️</span> 知识图谱
          </router-link>
          <router-link to="/review" class="nav-item" active-class="active">
            <span class="icon">📅</span> 复习计划
            <span v-if="reviewStore.dueCount > 0" class="badge-small">{{ reviewStore.dueCount }}</span>
          </router-link>
          <router-link to="/profile" class="nav-item" active-class="active">
            <span class="icon">👤</span> 个人中心
          </router-link>
        </nav>

        <div class="sidebar-stats">
          <div class="stat-card" @click="$router.push('/notes')">
            <span class="stat-value">{{ noteStore.total }}</span>
            <span class="stat-label">总笔记</span>
          </div>
          <div class="stat-card" @click="$router.push('/review')">
            <span class="stat-value highlight">{{ reviewStore.dueCount }}</span>
            <span class="stat-label">待复习</span>
          </div>
        </div>
      </aside>

      <main class="content">
        <div class="dashboard">
          <!-- Stats Row -->
          <div class="stats-row">
            <div class="stat-card-lg blue">
              <div class="stat-icon">📝</div>
              <div class="stat-info">
                <span class="stat-num">{{ noteStore.total }}</span>
                <span class="stat-desc">总笔记</span>
              </div>
            </div>
            <div class="stat-card-lg orange">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <span class="stat-num">{{ reviewStore.dueCount }}</span>
                <span class="stat-desc">待复习</span>
              </div>
              <span v-if="reviewStore.dueCount > 0" class="stat-badge">需关注</span>
            </div>
            <div class="stat-card-lg purple">
              <div class="stat-icon">🏷️</div>
              <div class="stat-info">
                <span class="stat-num">{{ categoryStats.length }}</span>
                <span class="stat-desc">笔记分类</span>
              </div>
            </div>
            <div class="stat-card-lg green">
              <div class="stat-icon">📋</div>
              <div class="stat-info">
                <span class="stat-num">{{ reviewStore.scheduledNotes }}</span>
                <span class="stat-desc">已计划复习</span>
              </div>
            </div>
          </div>

          <div class="dashboard-grid">
            <!-- Left Column -->
            <div class="left-col">
              <!-- Recent Notes -->
              <div class="dashboard-card">
                <div class="card-header">
                  <h3>📖 最近笔记</h3>
                  <router-link to="/notes" class="card-link">查看全部 →</router-link>
                </div>
                <div v-if="recentNotes.length === 0" class="empty-state-centered">
                  <div class="empty-illustration">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="36" fill="#eef2ff"/>
                      <path d="M28 30h24M28 38h24M28 46h16" stroke="#667eea" stroke-width="2.5" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <p class="empty-tip">还没有笔记，开始记录学习吧</p>
                  <button class="btn btn-primary" @click="$router.push('/notes')">+ 创建第一篇笔记</button>
                </div>
                <div v-else class="recent-list">
                  <div v-for="note in recentNotes" :key="note.id" class="recent-item" @click="goToEditor(note.id)">
                    <div class="recent-info">
                      <span class="recent-title">{{ note.title }}</span>
                      <span class="recent-date">🕐 {{ formatDate(note.updated_at) }}</span>
                    </div>
                    <span class="recent-category">{{ note.category || '未分类' }}</span>
                  </div>
                </div>
              </div>

              <!-- Heatmap (only when notes exist) -->
              <div v-if="noteStore.notes.length > 0" class="dashboard-card heatmap-card">
                <div class="card-header">
                  <h3>📊 学习热力图</h3>
                  <div class="range-selector">
                    <span class="range-btn" :class="{ active: rangeDays === 30 }" @click="changeRange(30)">30天</span>
                    <span class="range-btn" :class="{ active: rangeDays === 60 }" @click="changeRange(60)">60天</span>
                  </div>
                </div>
                <div class="chart-wrapper">
                  <div class="heatmap-chart" ref="heatmapRef"></div>
                </div>
                <div class="heatmap-legend">
                  <span class="legend-item"><span class="legend-dot" style="background:#ebedf0"></span>无</span>
                  <span class="legend-item"><span class="legend-dot" style="background:#c6e48b"></span>1-2</span>
                  <span class="legend-item"><span class="legend-dot" style="background:#7bc96f"></span>3-4</span>
                  <span class="legend-item"><span class="legend-dot" style="background:#239a3b"></span>5+</span>
                </div>
                <div class="heatmap-stats">
                  <div class="hstat-item">
                    <span class="hstat-icon">🔥</span>
                    <div class="hstat-info">
                      <span class="hstat-num">{{ heatmapStats.maxDay.count }}</span>
                      <span class="hstat-label">最高单日</span>
                    </div>
                    <span class="hstat-detail">{{ heatmapStats.maxDay.date }}</span>
                  </div>
                  <div class="hstat-divider"></div>
                  <div class="hstat-item">
                    <span class="hstat-icon">📈</span>
                    <div class="hstat-info">
                      <span class="hstat-num">{{ heatmapStats.avgDaily }}</span>
                      <span class="hstat-label">日均次数</span>
                    </div>
                  </div>
                  <div class="hstat-divider"></div>
                  <div class="hstat-item">
                    <span class="hstat-icon">⚡</span>
                    <div class="hstat-info">
                      <span class="hstat-num">{{ heatmapStats.continuousDays }}</span>
                      <span class="hstat-label">连续学习</span>
                    </div>
                  </div>
                  <div class="hstat-divider"></div>
                  <div class="hstat-item">
                    <span class="hstat-icon">⭐</span>
                    <div class="hstat-info">
                      <span class="hstat-num">{{ heatmapStats.weeklyActivity }}%</span>
                      <span class="hstat-label">本周活跃</span>
                    </div>
                  </div>
                </div>
                <div v-if="hotKeywords.length > 0" class="hot-keywords">
                  <span class="hk-label">🏷️ 本周热点关键词</span>
                  <div class="hk-tags">
                    <span v-for="(kw, i) in hotKeywords" :key="kw.text" class="hk-tag" :style="{ '--hue': i * 50 }">
                      {{ kw.text }} <span class="hk-count">{{ kw.count }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="right-col">
              <!-- Quick Actions -->
              <div class="dashboard-card actions-card">
                <div class="action-buttons">
                  <button class="action-btn primary" @click="$router.push('/notes')">
                    <span class="action-icon">+</span>
                    <span>新建笔记</span>
                  </button>
                  <button class="action-btn secondary" @click="$router.push('/review')" v-if="reviewStore.dueCount > 0">
                    <span class="action-icon">📅</span>
                    <span>开始复习</span>
                  </button>
                </div>
              </div>

              <!-- Note Categories -->
              <div class="dashboard-card" v-if="categoryStats.length > 0">
                <div class="card-header">
                  <h3>📂 笔记分类</h3>
                </div>
                <div class="category-list">
                  <div v-for="cat in categoryStats" :key="cat.name" class="category-item">
                    <div class="cat-info">
                      <span class="cat-dot" :style="{ background: cat.color }"></span>
                      <span class="cat-name">{{ cat.name }}</span>
                    </div>
                    <span class="cat-count">{{ cat.count }}篇</span>
                  </div>
                </div>
              </div>

              <!-- Mini Graph Preview -->
              <div class="dashboard-card" v-if="noteStore.notes.length > 0">
                <div class="card-header">
                  <h3>🕸️ 知识图谱预览</h3>
                  <router-link to="/graph" class="card-link">查看大图 →</router-link>
                </div>
                <div class="mini-graph" ref="miniGraphRef"></div>
                <div class="graph-meta">
                  <span>{{ noteStore.notes.length }} 个节点</span>
                </div>
              </div>

              <!-- Today's Review -->
              <div class="dashboard-card">
                <div class="card-header">
                  <h3>⏰ 今日复习</h3>
                </div>
                <div v-if="todayReviews.length === 0" class="review-empty">
                  <div class="review-empty-icon">🎉</div>
                  <p>今日复习任务已完成！</p>
                  <span class="review-next" v-if="upcomingReviews.length > 0">明日待复习：{{ upcomingReviews.length }} 篇</span>
                </div>
                <div v-else class="review-today-list">
                  <div v-for="item in todayReviews" :key="item.id" class="review-today-item">
                    <div class="rt-info">
                      <span class="rt-title">{{ item.title }}</span>
                      <span class="rt-date" :class="{ overdue: item.overdue }">{{ item.dateLabel }}</span>
                    </div>
                    <button class="btn btn-sm btn-primary" @click="$router.push('/review')">复习</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useReviewStore } from '../stores/auth'
import { useNoteStore } from '../stores/notes'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const router = useRouter()
const auth = useAuthStore()
const reviewStore = useReviewStore()
const noteStore = useNoteStore()
const heatmapRef = ref(null)
const miniGraphRef = ref(null)
const rangeDays = ref(30)

const recentNotes = computed(() => (noteStore.notes || []).slice(0, 5))

const heatmapStats = ref({ maxDay: { date: '-', count: 0 }, avgDaily: 0, continuousDays: 0, weeklyActivity: 0 })
const hotKeywords = ref([])
let heatmapData = []
let heatmapChart = null

const categoryStats = computed(() => {
  const notes = noteStore.notes || []
  const cats = {}
  const colors = { '编程': '#4f46e5', '数学': '#10b981', '英语': '#f59e0b', '历史': '#ef4444', '其他': '#6b7280' }
  notes.forEach(n => {
    const c = n.category || '其他'
    cats[c] = (cats[c] || 0) + 1
  })
  return Object.entries(cats).map(([name, count]) => ({ name, count, color: colors[name] || '#6b7280' }))
})

const todayReviews = computed(() => {
  const now = new Date()
  return reviewStore.reviewItems
    .filter(i => new Date(i.next_review_date) <= now)
    .slice(0, 3)
    .map(i => {
      const diff = Math.floor((new Date(i.next_review_date) - now) / 86400000)
      return {
        ...i,
        title: i.note?.title || '笔记' + i.note_id,
        overdue: diff < 0,
        dateLabel: diff < 0 ? '已逾期' : '今日'
      }
    })
})

const upcomingReviews = computed(() => {
  const now = new Date()
  return reviewStore.reviewItems.filter(i => new Date(i.next_review_date) > now)
})

onMounted(async () => {
  await noteStore.fetchNotes({ pageSize: 100 })
  await reviewStore.fetchDueList()
  await reviewStore.fetchStats()
  if (reviewStore.reviewItems.length === 0) {
    reviewStore.dueCount = 0
    reviewStore.scheduledNotes = 0
  }
  buildHotKeywords()
  nextTick(() => {
    if (noteStore.notes.length > 0) {
      renderMiniGraph()
      renderHeatmap()
    }
  })
})

function buildHotKeywords() {
  const notes = noteStore.notes || []
  const kwCount = {}
  notes.forEach(n => {
    (n.keywords || '').split(',').filter(Boolean).forEach(kw => {
      kwCount[kw.trim()] = (kwCount[kw.trim()] || 0) + 1
    })
  })
  const sorted = Object.entries(kwCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  hotKeywords.value = sorted.map(([text, count]) => ({ text, count }))
}

function computeHeatmapStats(data) {
  let maxDay = { date: '-', count: 0 }
  let total = 0
  let continuous = 0
  let currentStreak = 0
  for (let i = 0; i < data.length; i++) {
    const count = data[i][1] || 0
    if (count > maxDay.count) { maxDay = { date: dayjs(data[i][0]).format('MM/DD'), count } }
    total += count
    if (count > 0) { currentStreak++; continuous = Math.max(continuous, currentStreak) }
    else { currentStreak = 0 }
  }
  const last7 = data.slice(-7)
  const activeDays = last7.filter(d => (d[1] || 0) > 0).length
  heatmapStats.value = {
    maxDay,
    avgDaily: total > 0 ? (total / data.length).toFixed(1) : 0,
    continuousDays: continuous,
    weeklyActivity: total > 0 ? Math.round((activeDays / 7) * 100) : 0
  }
}

function changeRange(days) {
  rangeDays.value = days
  renderHeatmap()
}

function goToEditor(id) { router.push(`/note/${id}`) }

function formatDate(date) {
  if (!date) return ''
  const d = dayjs(date)
  const now = dayjs()
  if (d.isSame(now, 'day')) return '今天'
  if (d.isSame(now.subtract(1, 'day'), 'day')) return '昨天'
  return d.format('MM/DD')
}

function renderMiniGraph() {
  if (!miniGraphRef.value) return
  const chart = echarts.init(miniGraphRef.value)
  const notes = noteStore.notes || []
  const nodes = notes.slice(0, 6)
  const graphNodes = nodes.map(n => ({ id: n.id, name: n.title, category: n.category || '其他' }))
  const categories = [
    { name: '编程', itemStyle: { color: '#4f46e5' } },
    { name: '数学', itemStyle: { color: '#10b981' } },
    { name: '英语', itemStyle: { color: '#f59e0b' } },
    { name: '其他', itemStyle: { color: '#6b7280' } }
  ]
  const links = []
  for (let i = 0; i < graphNodes.length; i++) {
    for (let j = i + 1; j < graphNodes.length; j++) {
      if (graphNodes[i].category === graphNodes[j].category) {
        links.push({ source: graphNodes[i].id, target: graphNodes[j].id })
      }
    }
  }
  chart.setOption({
    tooltip: { trigger: 'item', formatter: (p) => p.dataType === 'node' ? p.name : '关联' },
    series: [{
      type: 'graph', layout: 'force', symbolSize: 40, roam: false, draggable: false,
      label: { show: true, fontSize: 10 },
      data: graphNodes,
      links: links,
      categories,
      force: { repulsion: 60, edgeLength: 50 }
    }]
  })
}

function renderHeatmap() {
  if (!heatmapRef.value) return
  if (heatmapChart) { heatmapChart.dispose() }
  const notes = noteStore.notes || []
  if (notes.length === 0) return
  const now = dayjs()
  const dayActivity = {}
  notes.forEach(n => {
    const d = dayjs(n.created_at || n.updated_at).format('YYYY-MM-DD')
    dayActivity[d] = (dayActivity[d] || 0) + 1
  })
  heatmapData = []
  for (let i = rangeDays.value - 1; i >= 0; i--) {
    const date = now.subtract(i, 'day').format('YYYY-MM-DD')
    heatmapData.push([date, dayActivity[date] || 0])
  }
  computeHeatmapStats(heatmapData)
  const rangeStart = now.subtract(rangeDays.value - 1, 'day').format('YYYY-MM-DD')
  heatmapChart = echarts.init(heatmapRef.value)
  heatmapChart.setOption({
    tooltip: { formatter: (p) => `${p.data[0]}：编辑了 ${p.data[1]} 篇笔记` },
    visualMap: {
      show: false, min: 0, max: 6,
      inRange: { color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'] }
    },
    calendar: {
      range: [rangeStart, now.format('YYYY-MM-DD')],
      cellSize: ['auto', 22],
      itemStyle: { borderWidth: 2, borderColor: 'transparent' },
      dayLabel: { nameMap: 'cn', firstDay: 1, color: '#999' },
      monthLabel: { nameMap: 'cn', color: '#666' },
      yearLabel: { show: false },
      splitLine: { show: false }
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: heatmapData,
      label: { show: false }
    }]
  })
  window.addEventListener('resize', () => heatmapChart?.resize())
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.home-layout { min-height: 100vh; display: flex; flex-direction: column; }
.header { height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.header-left h2 { font-size: 20px; margin: 0; }
.header-right { display: flex; align-items: center; gap: 16px; }
.badge { background: #ef4444; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
.username { font-size: 14px; opacity: 0.9; }
.btn-ghost { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.btn-ghost:hover { background: rgba(255,255,255,0.25); }

.main-content { flex: 1; display: flex; background: #f0f2f5; }
.sidebar { width: 220px; background: #f8f9fa; padding: 20px 0; display: flex; flex-direction: column; }
.nav-menu { display: flex; flex-direction: column; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 14px 24px; color: #666; text-decoration: none; transition: all 0.2s; position: relative; border-radius: 0; }
.nav-item:hover, .nav-item.active { background: #eef2ff; color: #4f46e5; border-left: 3px solid #667eea; }
.nav-item .badge-small { margin-left: auto; background: #ef4444; color: white; font-size: 10px; padding: 2px 6px; border-radius: 8px; }
.icon { font-size: 18px; }
.sidebar-stats { margin-top: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.stat-card { background: white; padding: 16px; border-radius: 12px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); cursor: pointer; transition: all 0.2s; }
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.stat-value { font-size: 28px; font-weight: bold; color: #4f46e5; display: block; }
.stat-value.highlight { color: #f59e0b; }
.stat-label { font-size: 12px; color: #999; }
.content { flex: 1; padding: 24px; overflow-y: auto; }

.dashboard { max-width: 1200px; margin: 0 auto; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card-lg { background: white; border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: all 0.25s; position: relative; overflow: hidden; border-left: 4px solid; }
.stat-card-lg:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.stat-card-lg.blue { border-left-color: #4361ee; }
.stat-card-lg.orange { border-left-color: #f59e0b; }
.stat-card-lg.purple { border-left-color: #8b5cf6; }
.stat-card-lg.green { border-left-color: #10b981; }
.stat-icon { font-size: 30px; }
.stat-info { display: flex; flex-direction: column; }
.stat-num { font-size: 26px; font-weight: bold; color: #1e293b; line-height: 1; }
.stat-desc { font-size: 12px; color: #94a3b8; margin-top: 4px; }
.stat-badge { position: absolute; top: 10px; right: 10px; background: #fef3c7; color: #d97706; font-size: 10px; padding: 2px 8px; border-radius: 10px; }

.dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
.left-col, .right-col { display: flex; flex-direction: column; gap: 20px; }
.dashboard-card { background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-header h3 { font-size: 15px; margin: 0; font-weight: 600; color: #1e293b; }
.card-link { font-size: 12px; color: #667eea; text-decoration: none; }
.card-link:hover { text-decoration: underline; }

/* Empty State */
.empty-state-centered { text-align: center; padding: 32px 20px; }
.empty-illustration { margin-bottom: 16px; }
.empty-tip { font-size: 14px; color: #94a3b8; margin-bottom: 16px; }

/* Recent Notes */
.recent-list { display: flex; flex-direction: column; gap: 8px; }
.recent-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; background: #f8f9ff; border: 1px solid transparent; }
.recent-item:hover { background: #eef2ff; border-color: #667eea; transform: translateX(4px); }
.recent-info { display: flex; flex-direction: column; gap: 4px; }
.recent-title { font-size: 14px; font-weight: 500; color: #1e293b; }
.recent-date { font-size: 12px; color: #94a3b8; }
.recent-category { font-size: 11px; background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 4px; }

/* Heatmap */
.heatmap-card { }
.chart-wrapper { border-radius: 8px; overflow: hidden; background: #fafafa; }
.heatmap-chart { height: 240px; width: 100%; }
.heatmap-legend { display: flex; justify-content: center; gap: 16px; margin-top: 8px; font-size: 12px; color: #64748b; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot { display: inline-block; width: 12px; height: 12px; border-radius: 3px; }
.range-selector { display: flex; gap: 4px; }
.range-btn { padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; background: #f1f5f9; color: #64748b; transition: all 0.2s; }
.range-btn:hover { background: #e2e8f0; }
.range-btn.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.heatmap-stats { display: flex; align-items: center; margin-top: 16px; padding: 14px 12px; background: #f8f9ff; border-radius: 10px; gap: 8px; }
.hstat-item { display: flex; align-items: center; gap: 8px; flex: 1; }
.hstat-icon { font-size: 18px; }
.hstat-info { display: flex; flex-direction: column; }
.hstat-num { font-size: 18px; font-weight: bold; color: #1e293b; line-height: 1; }
.hstat-label { font-size: 10px; color: #94a3b8; margin-top: 2px; }
.hstat-detail { font-size: 11px; color: #64748b; margin-left: auto; }
.hstat-divider { width: 1px; height: 32px; background: #e2e8f0; }
.hot-keywords { margin-top: 16px; }
.hk-label { font-size: 12px; color: #64748b; display: block; margin-bottom: 10px; }
.hk-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.hk-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 14px; font-size: 12px; background: hsl(var(--hue), 60%, 95%); color: hsl(var(--hue), 50%, 35%); border: 1px solid hsl(var(--hue), 60%, 85%); }
.hk-count { font-size: 10px; background: hsl(var(--hue), 50%, 45%); color: white; padding: 1px 5px; border-radius: 10px; }

/* Quick Actions */
.actions-card { padding: 16px 20px; background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%); }
.action-buttons { display: flex; gap: 12px; }
.action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 10px; font-size: 14px; cursor: pointer; transition: all 0.2s; border: none; font-weight: 500; }
.action-btn.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.action-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102,126,234,0.4); }
.action-btn.secondary { background: #fef3c7; color: #d97706; }
.action-btn.secondary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(253,224,71,0.4); }

/* Category */
.category-list { display: flex; flex-direction: column; gap: 10px; }
.category-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
.category-item:last-child { border-bottom: none; }
.cat-info { display: flex; align-items: center; gap: 8px; }
.cat-dot { width: 10px; height: 10px; border-radius: 50%; }
.cat-name { font-size: 13px; color: #1e293b; }
.cat-count { font-size: 12px; color: #94a3b8; }

/* Mini Graph */
.mini-graph { height: 180px; }
.graph-meta { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 8px; }

/* Today's Review */
.review-empty { text-align: center; padding: 24px 20px; }
.review-empty-icon { font-size: 36px; margin-bottom: 12px; }
.review-empty p { font-size: 14px; color: #10b981; margin-bottom: 8px; }
.review-next { font-size: 12px; color: #94a3b8; }
.review-today-list { display: flex; flex-direction: column; gap: 8px; }
.review-today-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: 8px; background: #f8f9ff; }
.rt-info { display: flex; flex-direction: column; gap: 2px; }
.rt-title { font-size: 13px; font-weight: 500; color: #1e293b; }
.rt-date { font-size: 11px; color: #10b981; }
.rt-date.overdue { color: #ef4444; }

/* Buttons */
.btn { padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 6px; }
.btn-sm { padding: 5px 10px; font-size: 11px; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
</style>
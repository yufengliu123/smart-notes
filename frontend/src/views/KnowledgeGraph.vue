<template>
  <div class="page-wrapper">
    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
        <h2>知识图谱</h2>
      </div>
      <div class="header-right">
        <div class="view-switch">
          <button :class="['switch-btn', { active: viewMode === 'graph' }]" @click="viewMode = 'graph'">🕸️ 图谱视图</button>
          <button :class="['switch-btn', { active: viewMode === 'mindmap' }]" @click="viewMode = 'mindmap'">🌳 思维导图</button>
        </div>
      </div>
    </header>

    <div v-if="viewMode === 'graph'" class="graph-layout">
      <div class="left-panel">
        <div class="panel-card notes-library">
          <div class="panel-title">
            <span class="panel-icon">📚</span>
            <span>笔记库</span>
            <span class="note-count">{{ allNotes.length }} 篇</span>
          </div>
          <div class="search-box">
            <input v-model="searchKeyword" class="search-input" placeholder="🔍 搜索笔记或关键词..." />
          </div>
          <div class="notes-list">
            <div v-for="note in filteredNotes" :key="note.id" class="note-card"
              :class="{ selected: selectedNoteIds.includes(note.id), highlighted: searchKeyword && isHighlighted(note) }"
              @click="toggleNote(note)">
              <div class="note-card-header">
                <span class="note-title">{{ note.title }}</span>
                <span v-if="selectedNoteIds.includes(note.id)" class="check-icon">✓</span>
              </div>
              <div class="note-card-body">
                <span class="tag tag-primary">{{ note.category || '未分类' }}</span>
                <span v-if="getKeywordCount(note) > 0" class="tag">{{ getKeywordCount(note) }} 个关键词</span>
              </div>
            </div>
          </div>
          <div class="panel-footer">
            <div class="footer-stats">
              <span>已选 <strong>{{ selectedNoteIds.length }}</strong> 篇</span>
            </div>
            <div class="footer-actions">
              <button class="btn btn-ghost btn-sm" :disabled="graphNodes.length === 0" @click="clearGraph">清空图谱</button>
              <button class="btn btn-primary btn-sm" :disabled="selectedNoteIds.length === 0" @click="autoBuildFromNotes">一键全览</button>
            </div>
          </div>
        </div>
      </div>

      <div class="center-panel">
        <div class="graph-canvas">
          <div ref="chartRef" class="echarts-graph"></div>
          <div v-if="graphNodes.length === 0" class="graph-empty">
            <div class="empty-visual">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="8 4"/>
                <circle cx="60" cy="30" r="8" fill="#667eea"/>
                <circle cx="30" cy="75" r="8" fill="#10b981"/>
                <circle cx="90" cy="75" r="8" fill="#f59e0b"/>
                <line x1="60" y1="38" x2="38" y2="68" stroke="#e2e8f0" stroke-width="2"/>
                <line x1="60" y1="38" x2="82" y2="68" stroke="#e2e8f0" stroke-width="2"/>
                <line x1="38" y1="75" x2="82" y2="75" stroke="#e2e8f0" stroke-width="2"/>
              </svg>
            </div>
            <h3>知识图谱画布</h3>
            <p>从左侧选择笔记，自动生成关联图谱</p>
            <button v-if="allNotes.length > 0" class="btn btn-primary" @click="autoBuildFromNotes">
              <span>🚀</span> 一键生成图谱
            </button>
          </div>
        </div>

        <div v-if="graphNodes.length > 0" class="graph-info-bar">
          <div class="info-item">
            <span class="info-icon">🔷</span>
            <span><strong>{{ graphNodes.length }}</strong> 节点</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🔗</span>
            <span><strong>{{ graphLinks.length }}</strong> 关联</span>
          </div>
        </div>

        <div class="graph-legend">
          <div class="legend-title">图例说明</div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-dot" style="background: #4361ee;"></span>
              <span class="legend-label">📝 笔记节点</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #10b981;"></span>
              <span class="legend-label">🏷️ 关键词节点</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #8b5cf6;"></span>
              <span class="legend-label">📁 分类节点</span>
            </div>
            <div class="legend-item">
              <span class="legend-line"></span>
              <span class="legend-label">关联连线</span>
            </div>
          </div>
          <div class="legend-desc">点击笔记自动关联关键词，拖拽可调整布局</div>
        </div>
      </div>

      <div class="right-panel" v-if="hoveredNode || selectedNode">
        <div class="panel-card node-detail">
          <div class="panel-title">
            <span class="panel-icon">📌</span>
            <span>节点详情</span>
            <button class="panel-close" @click="closeNodeDetail">✕</button>
          </div>
          <div class="detail-body" v-if="hoveredNode || selectedNode">
            <h4 class="detail-title">{{ (hoveredNode || selectedNode).name }}</h4>
            <div class="detail-meta">
              <span class="tag tag-primary">{{ (hoveredNode || selectedNode).type === 'keyword' ? '🏷️ 关键词' : (hoveredNode || selectedNode).type === 'category' ? '📁 分类' : '📝 笔记' }}</span>
            </div>
            <div class="detail-info" v-if="(hoveredNode || selectedNode).value">
              <span class="info-label">出现次数：</span>
              <span class="info-value">{{ (hoveredNode || selectedNode).value }} 次</span>
            </div>
            <div class="detail-actions">
              <button v-if="(hoveredNode || selectedNode).type !== 'keyword'" class="btn btn-ghost btn-sm" @click="viewNoteDetail(hoveredNode || selectedNode)">查看笔记</button>
              <button class="btn btn-ghost btn-sm" @click="removeFromGraph((hoveredNode || selectedNode).id)">移出图谱</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="mindmap-layout">
      <div class="mindmap-sidebar">
        <div class="panel-card">
          <div class="panel-title">
            <span class="panel-icon">🎯</span>
            <span>选择中心笔记</span>
          </div>
          <div class="notes-list">
            <div v-for="note in allNotes" :key="note.id" class="note-card compact"
              :class="{ selected: centerNote?.id === note.id }"
              @click="selectCenter(note)">
              <span class="note-title">{{ note.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mindmap-main">
        <div class="mindmap-canvas" ref="mindmapContainer">
          <svg ref="svgRef" class="mindmap-svg"></svg>
          <div v-if="!centerNote" class="mindmap-empty">
            <div class="empty-visual">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6 3"/>
                <circle cx="40" cy="40" r="10" fill="#667eea" opacity="0.3"/>
              </svg>
            </div>
            <span>👈 请先选择一篇笔记作为中心</span>
          </div>
          <template v-else>
            <div class="mindmap-center-node">
              <span class="center-icon">📚</span>
              <span class="center-title">{{ centerNote.title }}</span>
            </div>
            <div v-for="(branch, idx) in mindmapBranches" :key="idx" class="mindmap-branch"
              :style="{ left: branch.bx + 'px', top: branch.by + 'px' }">
              <div class="branch-kw" :style="{ background: branch.color }">
                <span class="branch-title">{{ branch.keyword }}</span>
              </div>
            </div>
            <div v-for="(branch, idx) in mindmapBranches" :key="'d' + idx"
              :style="{ position: 'absolute', left: branch.dx + 'px', top: branch.dy + 'px', transform: 'translate(-50%, -50%)', zIndex: 6, pointerEvents: 'none' }">
              <div class="branch-desc" :style="{ borderColor: branch.color, pointerEvents: 'auto' }">{{ branch.desc }}</div>
            </div>
          </template>
        </div>
      </div>
    </div>

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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import api from '../services/api'
import { useNoteStore } from '../stores/notes'

const router = useRouter()
const notesStore = useNoteStore()
const chartRef = ref(null)
const mindmapContainer = ref(null)
const svgRef = ref(null)
const viewMode = ref('graph')
const allNotes = ref([])
const selectedNoteIds = ref([])
const graphNodes = ref([])
const graphLinks = ref([])
const centerNote = ref(null)
const mindmapBranches = ref([])
const viewingNote = ref(null)
const searchKeyword = ref('')
const hoveredNode = ref(null)
const selectedNode = ref(null)
const branchColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6']
let chart = null

const filteredNotes = computed(() => {
  if (!searchKeyword.value.trim()) return allNotes.value
  const kw = searchKeyword.value.toLowerCase()
  return allNotes.value.filter(n => n.title.toLowerCase().includes(kw) || (n.keywords || '').toLowerCase().includes(kw))
})

const graphCategories = computed(() => [...new Set(graphNodes.value.map(n => n.category || '其他'))])
const categoryColors = computed(() => {
  const colorPalette = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6', '#a855f7', '#f43f5e']
  const map = {}
  graphCategories.value.forEach((cat, i) => { map[cat] = colorPalette[i % colorPalette.length] })
  return map
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

function getKeywordCount(note) { return (note.keywords || '').split(',').filter(Boolean).length }
function isHighlighted(note) {
  if (!searchKeyword.value.trim()) return false
  const kw = searchKeyword.value.toLowerCase()
  return note.title.toLowerCase().includes(kw) || (note.keywords || '').toLowerCase().includes(kw)
}

onMounted(async () => {
  try {
    await notesStore.fetchNotes({ pageSize: 100 })
    allNotes.value = notesStore.notes || []
  } catch (e) { allNotes.value = [] }
  if (viewMode.value === 'graph') nextTick(() => initChart())
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(viewMode, (newMode) => {
  if (newMode === 'graph') nextTick(() => initChart())
})

function initChart() {
  if (!chartRef.value) return
  if (chart) chart.dispose()
  chart = echarts.init(chartRef.value)
  window.addEventListener('resize', handleResize)
  renderChart()
  chart.on('mouseover', (params) => { if (params.dataType === 'node') hoveredNode.value = params.data })
  chart.on('mouseout', () => { hoveredNode.value = null })
  chart.on('click', (params) => { if (params.dataType === 'node') selectedNode.value = params.data })
}

function handleResize() { chart?.resize() }

function toggleNote(note) {
  const idx = selectedNoteIds.value.indexOf(note.id)
  if (idx >= 0) selectedNoteIds.value.splice(idx, 1)
  else selectedNoteIds.value.push(note.id)
}

function clearSelection() { selectedNoteIds.value = [] }

function autoBuildFromNotes() {
  console.log('A selectedNoteIds:', selectedNoteIds.value)
  console.log('A graphNodes:', graphNodes.value)
  alert('A clicked, selected=' + selectedNoteIds.value.length)
  if (selectedNoteIds.value.length === 0) {
    alert('请先在左侧选择笔记，再点击一键全览')
    return
  }
  if (graphNodes.value.length > 0) {
    alert('图谱已有内容，请先清空')
    return
  }
  alert('开始构建图谱，allNotes=' + allNotes.value.length)
  graphNodes.value = []
  graphLinks.value = []
  const kwIdMap = {}
  const allCatNames = {}
  const selectedNotes = allNotes.value.filter(n => selectedNoteIds.value.includes(n.id))
  alert('filtered notes: ' + selectedNotes.length)
  selectedNotes.forEach(note => {
    const cats = (note.category || '').split(/[、,]/).filter(Boolean)
    cats.forEach(c => { allCatNames[c.trim()] = true })
  })
  const catNodes = {}
  Object.keys(allCatNames).forEach(name => {
    catNodes[name] = 'cat_' + name
    graphNodes.value.push({ id: catNodes[name], name, category: '分类', type: 'category' })
  })
  selectedNotes.forEach(note => {
    const cats = (note.category || '').split(/[、,]/).filter(Boolean)
    graphNodes.value.push({ id: 'note_' + note.id, name: note.title, category: note.category || '其他', type: 'note', keywords: note.keywords || '' })
    cats.forEach(c => {
      graphLinks.value.push({ source: 'note_' + note.id, target: catNodes[c.trim()], relation: '属于', weight: 3 })
    })
    ;(note.keywords || '').split(',').filter(Boolean).forEach(kw => {
      const k = kw.trim()
      if (!kwIdMap[k]) {
        kwIdMap[k] = 'kw_' + k
        graphNodes.value.push({ id: kwIdMap[k], name: k, category: '关键词', type: 'keyword' })
      }
      graphLinks.value.push({ source: 'note_' + note.id, target: kwIdMap[k], relation: '包含', weight: 1 })
    })
  })
  nextTick(() => renderChart())
}

function clearGraph() {
  graphNodes.value = []
  graphLinks.value = []
  selectedNode.value = null
  hoveredNode.value = null
  if (graphNodes.value.length === 0) {
    chart?.clear()
  } else {
    nextTick(() => renderChart())
  }
}

function removeFromGraph(nodeId) {
  console.log('removeFromGraph called, nodeId:', nodeId, 'graphNodes before:', graphNodes.value.map(n => n.id))
  graphNodes.value = graphNodes.value.filter(n => n.id !== nodeId)
  graphLinks.value = graphLinks.value.filter(l => l.source !== nodeId && l.target !== nodeId)
  if (selectedNode.value?.id === nodeId) selectedNode.value = null
  if (hoveredNode.value?.id === nodeId) hoveredNode.value = null
  console.log('graphNodes after:', graphNodes.value.map(n => n.id))
  if (graphNodes.value.length === 0) {
    clearGraph()
  } else {
    nextTick(() => renderChart())
  }
}

function focusNode(node) {
  selectedNode.value = node
  chart?.dispatchAction({ type: 'focusNodeAdjacency', seriesIndex: 0, dataIndex: graphNodes.value.findIndex(n => n.id === node.id) })
}

function getNodeLinks(node) {
  return graphLinks.value.filter(l => l.source === node.id || l.target === node.id)
    .map(l => { const otherId = l.source === node.id ? l.target : l.source; return graphNodes.value.find(n => n.id === otherId) })
    .filter(Boolean).slice(0, 5)
}

function renderChart() {
  console.log('renderChart called, nodes:', graphNodes.value.length, 'links:', graphLinks.value.length)
  if (!chart) return
  if (graphNodes.value.length === 0) { chart.clear(); return }
  const nodesData = graphNodes.value.map((n, i) => ({
    id: n.id, name: n.name, type: n.type,
    x: n.type === 'category' ? (chartRef.value?.offsetWidth || 800) / 2 : undefined,
    y: n.type === 'category' ? (chartRef.value?.offsetHeight || 500) / 2 : undefined,
    itemStyle: { color: n.type === 'keyword' ? '#10b981' : n.type === 'category' ? '#8b5cf6' : '#4361ee' },
    symbol: n.type === 'keyword' ? 'diamond' : 'circle',
    symbolSize: n.type === 'keyword' ? 55 : n.type === 'category' ? 48 : 55
  }))
  const linksData = graphLinks.value.map(l => ({
    source: l.source, target: l.target,
    lineStyle: { curveness: 0.15, width: l.relation === '包含' ? 1.5 : 2.5, color: l.relation === '属于' ? '#6d28d9' : l.relation === '包含' ? '#64748b' : '#d97706', type: l.relation === '包含' ? undefined : [5, 3], opacity: 0.9 }
  }))
  chart.clear()
  chart.setOption({
    animation: true,
    tooltip: { trigger: 'item', formatter: p => p.dataType === 'node' ? `<b style="font-size:13px">${p.data.name}</b><br/><span style="color:${p.data.type==='keyword'?'#10b981':p.data.type==='category'?'#8b5cf6':'#4361ee'}">${p.data.type==='keyword'?'🏷️ 关键词':p.data.type==='category'?'📁 分类':'📝 笔记'}</span>` : `<span style="color:#666">${p.data.relation}</span>` },
    series: [{
      type: 'graph', layout: 'force', roam: true, draggable: true,       label: { show: true, position: 'inside', fontSize: 10, color: '#fff', overflow: 'truncate', width: 60, ellipsis: '...' },
      data: nodesData, links: linksData,
      force: { repulsion: 300, edgeLength: 120, layoutAnimation: true, alphaDecay: 0.03, gravity: 0.1 },
      lineStyle: { color: '#94a3b8', width: 1 }
    }]
  }, true)
}

function selectCenter(note) {
  centerNote.value = note
  mindmapBranches.value = []
  if (!note.content || note.content.length < 50) return
  api.get('/notes/' + note.id + '/sections').then(res => {
    if (res.code === 200 && res.data && res.data.length > 0) {
      buildMindmapFromSections(res.data)
    }
  }).catch(() => {})
}

function buildMindmapFromSections(sections) {
  if (!mindmapContainer.value) return
  const rect = mindmapContainer.value.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2
  const count = sections.length
  const spacing = Math.max(28, 360 / count)
  const r1 = Math.min(rect.width, rect.height) * 0.15 + count * 5
  const r2 = Math.min(rect.width, rect.height) * 0.42
  mindmapBranches.value = sections.map((s, i) => {
    const angle = (spacing * i + spacing / 2) - 90
    const rad = angle * Math.PI / 180
    const bx = cx + Math.cos(rad) * r1
    const by = cy + Math.sin(rad) * r1
    const angle2 = (spacing * i + spacing * 0.75) - 90
    const rad2 = angle2 * Math.PI / 180
    const dx = cx + Math.cos(rad2) * r2
    const dy = cy + Math.sin(rad2) * r2
    return {
      keyword: s.title,
      desc: s.desc,
      color: branchColors[i % branchColors.length],
      cx, cy, bx, by, dx, dy
    }
  })
  nextTick(() => drawMindmapLines())
}

function drawMindmapLines() {
  if (!svgRef.value || !mindmapBranches.value.length) return
  const rect = mindmapContainer.value.getBoundingClientRect()
  const svg = svgRef.value
  svg.setAttribute('width', rect.width)
  svg.setAttribute('height', rect.height)
  const b = mindmapBranches.value
  let d = ''
  b.forEach(br => {
    if (br.cx == null) return
    const mx1 = br.cx + (br.bx - br.cx) * 0.5
    const my1 = br.cy + (br.by - br.cy) * 0.35
    d += `M ${br.cx} ${br.cy} C ${mx1} ${my1} ${br.bx} ${br.by} ${br.bx} ${br.by} `
    if (br.desc) {
      const angle = Math.atan2(br.dy - br.by, br.dx - br.bx)
      const offset = 65
      const ex = br.bx + Math.cos(angle) * offset
      const ey = br.by + Math.sin(angle) * offset
      const mx2 = br.bx + (ex - br.bx) * 0.5
      const my2 = br.by + (ey - br.by) * 0.5
      d += `M ${br.bx} ${br.by} C ${mx2} ${my2} ${ex} ${ey} ${br.dx} ${br.dy} `
    }
  })
  svg.innerHTML = `<path d="${d}" stroke="#667eea" stroke-width="2" fill="none" opacity="0.55" stroke-linecap="round" stroke-linejoin="round"/>`
}

function viewNote(note) { viewingNote.value = note }
function viewNoteDetail(node) {
  const note = allNotes.value.find(n => n.id === node.id)
  if (note) viewingNote.value = note
}
function closeNodeDetail() {
  hoveredNode.value = null
  selectedNode.value = null
}
</script>

<style scoped>
.page-wrapper { max-width: 1400px; margin: 0 auto; padding: 0 24px 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 0; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-left h2 { font-size: 22px; margin: 0; font-weight: 600; color: #1e293b; }
.back-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; color: white; font-size: 14px; font-weight: 500; }
.back-btn:hover { transform: translateX(-4px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
.view-switch { display: flex; gap: 4px; background: #f3f4f6; padding: 4px; border-radius: 10px; }
.switch-btn { padding: 8px 16px; border: none; background: transparent; border-radius: 8px; cursor: pointer; font-size: 14px; color: #666; transition: all 0.2s; }
.switch-btn.active { background: white; color: #4f46e5; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.graph-layout { display: flex; gap: 16px; height: calc(100vh - 100px); }
.left-panel { width: 240px; display: flex; flex-direction: column; gap: 12px; }
.center-panel { flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.right-panel { width: 200px; }

.panel-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: flex; flex-direction: column; overflow: hidden; }
.panel-title { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #1e293b; }
.panel-icon { font-size: 16px; }
.note-count { margin-left: auto; font-size: 11px; color: #94a3b8; font-weight: normal; }
.search-box { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
.search-input { width: 100%; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; outline: none; transition: all 0.2s; background: #f8fafc; }
.search-input:focus { border-color: #667eea; background: white; }
.notes-list { flex: 1; overflow-y: auto; padding: 8px; }
.note-card { padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-bottom: 6px; border: 1.5px solid transparent; background: #f8fafc; }
.note-card:hover { background: #f1f5f9; transform: translateX(4px); }
.note-card.selected { background: #eef2ff; border-color: #667eea; }
.note-card.highlighted { background: #fef3c7; border-color: #f59e0b; }
.note-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.note-title { font-size: 12px; font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.check-icon { color: #667eea; font-weight: bold; }
.note-card-body { display: flex; flex-wrap: wrap; gap: 4px; }
.panel-footer { padding: 10px 12px; border-top: 1px solid #f1f5f9; }
.footer-stats { font-size: 11px; color: #64748b; margin-bottom: 8px; text-align: center; }
.footer-stats strong { color: #667eea; }
.footer-actions { display: flex; gap: 6px; }
.footer-actions .btn { flex: 1; justify-content: center; }

.graph-canvas { flex: 1; background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: relative; overflow: hidden; min-height: 600px; }
.echarts-graph { position: absolute; inset: 0; width: 100%; height: 100%; }
.graph-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; text-align: center; padding: 24px; }
.empty-visual { margin-bottom: 16px; }
.graph-empty h3 { font-size: 16px; margin: 0 0 6px 0; color: #334155; }
.graph-empty p { font-size: 13px; margin-bottom: 16px; }
.graph-info-bar { display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: white; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.info-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
.info-icon { font-size: 14px; }
.info-item strong { color: #334155; font-weight: 600; }

.graph-legend { margin-top: 12px; padding: 12px 16px; background: white; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.legend-title { font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 8px; }
.legend-items { display: flex; flex-direction: column; gap: 6px; }
.legend-item { display: flex; align-items: center; gap: 8px; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; }
.legend-line { width: 20px; height: 2px; background: #94a3b8; }
.legend-label { font-size: 11px; color: #64748b; }
.legend-desc { font-size: 11px; color: #94a3b8; margin-top: 8px; }

.node-detail .detail-body { padding: 12px; }
.detail-title { font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: #1e293b; }
.detail-meta { margin-bottom: 12px; }
.detail-info { display: flex; align-items: center; gap: 4px; margin-bottom: 12px; font-size: 12px; }
.info-label { color: #64748b; }
.info-value { color: #334155; font-weight: 500; }
.detail-actions { display: flex; gap: 6px; margin-top: 12px; }
.detail-actions .btn { flex: 1; justify-content: center; }
.panel-close { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; margin-left: auto; padding: 2px 6px; border-radius: 4px; }
.panel-close:hover { background: #fee2e2; color: #ef4444; }

.mindmap-layout { display: flex; gap: 20px; height: calc(100vh - 160px); }
.mindmap-sidebar { width: 260px; }
.mindmap-main { flex: 1; }
.mindmap-canvas { width: 100%; height: 100%; background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: relative; overflow: visible; }
.mindmap-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
.mindmap-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; }
.mindmap-center-node { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 24px rgba(102,126,234,0.4); color: white; z-index: 10; }
.mindmap-center-node:hover { transform: translate(-50%, -50%) scale(1.05); }
.center-icon { font-size: 24px; margin-bottom: 6px; }
.center-title { font-size: 10px; text-align: center; padding: 0 10px; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3; }
.mindmap-branch { position: absolute; display: flex; flex-direction: column; align-items: center; left: 0; top: 0; transform: translate(-50%, -50%); z-index: 5; pointer-events: none; }
.branch-kw { display: flex; align-items: center; padding: 8px 14px; border-radius: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); transition: transform 0.2s; min-width: 80px; justify-content: center; flex-shrink: 0; }
.branch-kw:hover { transform: scale(1.1); }
.branch-title { font-size: 12px; font-weight: 600; color: white; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.branch-desc { position: relative; padding: 8px 12px 8px 10px; background: white; border-radius: 10px; font-size: 11px; color: #555; width: 120px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); line-height: 1.5; cursor: pointer; white-space: normal; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; transition: all 0.2s; border-left: 3px solid; }
.branch-desc:hover { white-space: normal; overflow: visible; display: block; width: 200px; z-index: 20; background: #fff; transform: scale(1.05); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-content { background: white; border-radius: 16px; padding: 24px; width: 600px; max-width: 90vw; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #eee; }
.modal-header h3 { margin: 0; font-size: 16px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #999; }
.modal-body { flex: 1; overflow-y: auto; padding: 16px 0; }
.note-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.note-content { font-size: 14px; line-height: 1.8; }
.note-content :deep(p) { margin: 0 0 12px 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 12px; border-top: 1px solid #eee; }
.tag { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 10px; color: #64748b; }
.tag-primary { background: #eef2ff; color: #667eea; }

.btn { padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 6px; }
.btn-sm { padding: 6px 10px; font-size: 11px; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
.btn-ghost:hover { background: #f1f5f9; }
</style>
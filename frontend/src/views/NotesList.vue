<template>
  <div class="page-wrapper">
    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
        <h2>我的笔记</h2>
        <span class="notes-count" v-if="notes.length > 0">{{ notes.length }} 篇笔记</span>
      </div>
      <div class="header-right">
        <div class="filter-bar">
          <input v-model="searchKeyword" class="input search-input" placeholder="🔍 搜索笔记标题或关键词..." @input="debounceSearch" />
          <select v-model="filterCategory" class="input category-select" @change="applyFilter">
            <option value="">全部分类</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <button class="btn btn-primary" @click="openCreate">新建笔记</button>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="skeleton-grid">
        <div class="skeleton-card" v-for="i in 4" :key="i">
          <div class="skeleton-title"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>

    <div v-else-if="notes.length === 0" class="empty-state">
      <div class="empty-illustration">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" fill="#f0f2ff" stroke="#667eea" stroke-width="2"/>
          <path d="M45 45 L75 45 M45 55 L75 55 M45 65 L65 65" stroke="#667eea" stroke-width="3" stroke-linecap="round"/>
          <circle cx="85" cy="75" r="12" fill="#764ba2"/>
          <path d="M81 75 L85 79 L91 71" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="empty-title">开始记录你的学习笔记</h3>
      <p class="empty-desc">创建第一篇笔记，系统将自动为你生成摘要和复习计划</p>
      <button class="btn btn-primary btn-large" @click="openCreate">
        <span class="btn-icon">+</span> 创建第一篇笔记
      </button>
      <div class="quick-tips">
        <div class="tip-item"><span class="tip-icon">💡</span> 支持富文本编辑</div>
        <div class="tip-item"><span class="tip-icon">💡</span> 自动摘要生成</div>
        <div class="tip-item"><span class="tip-icon">📅</span> 遗忘曲线复习</div>
      </div>
    </div>

    <div v-else class="notes-grid">
      <div v-for="note in notes" :key="note.id" class="note-card">
        <div class="note-card-inner" @click="viewNote(note)">
          <div class="note-header">
            <h3>{{ note.title }}</h3>
            <div class="note-actions">
              <button class="action-btn" @click.stop="viewNote(note)" title="查看">👁️</button>
              <button class="action-btn" @click.stop="editNote(note)" title="编辑">✏️</button>
              <button class="action-btn danger" @click.stop="deleteNote(note.id)" title="删除">🗑️</button>
            </div>
          </div>
          <p class="note-summary">{{ note.summary || '暂无摘要' }}</p>
          <div class="note-tags">
            <span v-for="kw in (note.keywords || note.tags || '').split(',').filter(Boolean).slice(0, 3)" :key="kw" class="tag tag-primary">{{ kw }}</span>
          </div>
          <div class="note-footer">
            <span class="note-category">🏷️ {{ note.category || '未分类' }}</span>
            <span class="note-date">🕐 {{ formatDate(note.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看笔记弹窗 -->
    <div v-if="viewingNote" class="modal-overlay" @click.self="viewingNote = null">
      <div class="modal-content view-modal">
        <div class="modal-header">
          <h3>{{ viewingNote.title }}</h3>
          <button class="close-btn" @click="viewingNote = null">×</button>
        </div>
        <div class="modal-body">
          <div class="note-meta">
            <span class="tag tag-primary">{{ viewingNote.category || '未分类' }}</span>
            <span v-for="kw in (viewingNote.keywords || viewingNote.tags || '').split(',').filter(Boolean)" :key="kw" class="tag">{{ kw }}</span>
          </div>
          <div class="note-content" v-html="viewingNote.content"></div>
          <div v-if="viewingNote.summary" class="note-summary-box">
            <strong>摘要：</strong>{{ viewingNote.summary }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="viewingNote = null">关闭</button>
          <button class="btn btn-primary" @click="startEditFromView">编辑</button>
        </div>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <div v-if="showDialog" class="modal-overlay" @click.self="closeDialog">
      <div class="modal-content">
        <h3>{{ editingNote ? '编辑笔记' : '新建笔记' }}</h3>
        <input v-model="form.title" class="input form-title" placeholder="📌 笔记标题" />
        <textarea v-model="form.content" class="input textarea" placeholder="✍️ 笔记内容..." rows="6"></textarea>
        <div class="form-row">
          <input v-model="form.category" class="input" placeholder="📂 分类" />
          <input v-model="form.keywords" class="input" placeholder="🏷️ 关键词" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="saveNote">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '../stores/notes'
import { useReviewStore } from '../stores/auth'
import dayjs from 'dayjs'

const router = useRouter()
const notesStore = useNoteStore()
const reviewStore = useReviewStore()
const notes = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const filterCategory = ref('')
const showDialog = ref(false)
const editingNote = ref(null)
const viewingNote = ref(null)
const form = ref({ title: '', content: '', category: '', keywords: '' })
let searchTimer = null

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const categories = computed(() => {
  const cats = new Set(['编程', '数学', '英语', '历史', '其他'])
  notes.value.forEach(n => { if (n.category) cats.add(n.category) })
  return Array.from(cats)
})

onMounted(() => loadNotes())

function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadNotes(), 500)
}

function applyFilter() {
  loadNotes()
}

async function loadNotes() {
  loading.value = true
  try {
    const params = { pageSize: 100 }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterCategory.value) params.category = filterCategory.value
    await notesStore.fetchNotes(params)
    console.log('store.notes after fetch:', JSON.stringify(notesStore.notes))
    notes.value = [...notesStore.notes]
    console.log('local notes after load:', JSON.stringify(notes.value))
  } catch (e) {
    console.error('loadNotes error:', e)
  }
  loading.value = false
}

function viewNote(note) {
  viewingNote.value = note
}

function startEditFromView() {
  editingNote.value = viewingNote.value
  form.value = {
    title: viewingNote.value.title,
    content: viewingNote.value.content?.replace(/<[^>]+>/g, '') || '',
    category: viewingNote.value.category || '',
    keywords: viewingNote.value.keywords || viewingNote.value.tags || ''
  }
  viewingNote.value = null
  showDialog.value = true
}

function openCreate() {
  editingNote.value = null
  form.value = { title: '', content: '', category: '', keywords: '' }
  showDialog.value = true
}

function editNote(note) {
  editingNote.value = note
  form.value = {
    title: note.title,
    content: note.content?.replace(/<[^>]+>/g, '') || '',
    category: note.category || '',
    keywords: note.keywords || note.tags || ''
  }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingNote.value = null
  form.value = { title: '', content: '', category: '', keywords: '' }
}

async function saveNote() {
  if (!form.value.title.trim()) { alert('请输入标题'); return }
  const noteData = {
    title: form.value.title,
    content: `<p>${form.value.content}</p>`,
    category: form.value.category || undefined,
    keywords: form.value.keywords || undefined
  }
  try {
    if (editingNote.value) {
      await notesStore.updateNote(editingNote.value.id, noteData)
      alert('更新成功')
      closeDialog()
      await loadNotes()
    } else {
      const res = await notesStore.createNote(noteData)
      console.log('createNote res:', JSON.stringify(res))
      const noteId = res?.data?.id || res?.id
      const code = res?.code
      console.log('noteId:', noteId, 'code:', code)
      if (noteId) {
        alert('创建成功')
        await loadNotes()
        alert('加载了 ' + notes.value.length + ' 篇笔记')
        console.log('after loadNotes, notes.value:', JSON.stringify(notes.value))
      } else {
        alert('创建失败: ' + (res?.message || `未知错误(code: ${code})`))
      }
    }
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败: ' + (e?.message || JSON.stringify(e)))
  }
}

async function deleteNote(id) {
  if (!confirm('确定删除？')) return
  try {
    await notesStore.deleteNote(id)
    reviewStore.reviewItems = reviewStore.reviewItems.filter(i => i.note_id !== id)
    reviewStore.scheduledNotes = reviewStore.reviewItems.length
    reviewStore.dueCount = reviewStore.reviewItems.filter(i => new Date(i.next_review_date) <= new Date()).length
    reviewStore.saveToStorage()
    await loadNotes()
  } catch (e) {
    console.error('删除失败:', e)
  }
}

function formatDate(date) { return dayjs(date).format('YYYY-MM-DD HH:mm') }
</script>

<style scoped>
.page-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 20px 0;
}
.header-left {
  display: flex;
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
  margin-top: 2px;
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
  align-items: flex-start;
  gap: 12px;
  padding-top: 6px;
}
.filter-bar { display: flex; gap: 12px; align-items: center; }
.search-input { width: 200px; padding: 10px 16px; font-size: 14px; border: 1px solid #e4e7ed; border-radius: 8px; outline: none; transition: border-color 0.2s; }
.search-input:focus { border-color: #667eea; }
.search-input::placeholder { color: #c0c4cc; }
.category-select { width: 200px; padding: 10px 12px; font-size: 14px; border: 1px solid #e4e7ed; border-radius: 8px; outline: none; transition: border-color 0.2s; }
.category-select:focus { border-color: #667eea; }

.skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.skeleton-card { background: white; border-radius: 12px; padding: 20px; animation: pulse 1.5s infinite; }
.skeleton-title { height: 20px; background: #e4e7ed; border-radius: 4px; margin-bottom: 12px; width: 70%; }
.skeleton-line { height: 14px; background: #f3f4f6; border-radius: 4px; margin-bottom: 8px; }
.skeleton-line.short { width: 50%; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

.empty-state { text-align: center; padding: 80px 20px; background: white; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.empty-illustration { margin-bottom: 32px; }
.empty-title { font-size: 22px; margin: 0 0 12px 0; color: #333; }
.empty-desc { font-size: 14px; color: #999; margin-bottom: 32px; }
.btn-large { padding: 12px 32px; font-size: 15px; }
.quick-tips { display: flex; justify-content: center; gap: 32px; margin-top: 40px; padding-top: 32px; border-top: 1px solid #eee; }
.tip-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; }
.tip-icon { font-size: 16px; }

.notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.note-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); cursor: pointer; transition: all 0.3s; border: 2px solid transparent; }
.note-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(102,126,234,0.15); border-color: #667eea; }
.note-card-inner { padding: 20px; cursor: pointer; }
.note-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.note-header h3 { font-size: 16px; margin: 0; flex: 1; font-weight: 500; }
.note-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
.note-card:hover .note-actions { opacity: 1; }
.action-btn { background: #f3f4f6; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { background: #e4e7ed; transform: scale(1.1); }
.action-btn.danger:hover { background: #fee2e2; }
.note-summary { font-size: 13px; color: #666; margin-bottom: 12px; min-height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.6; }
.note-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.note-footer { display: flex; justify-content: space-between; font-size: 12px; color: #bbb; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-content { background: white; border-radius: 16px; padding: 24px; width: 500px; max-width: 90vw; display: flex; flex-direction: column; gap: 12px; }
.modal-content h3 { margin: 0; font-size: 18px; font-weight: 600; }
.form-title { font-size: 16px; padding: 12px 16px; }
.textarea { resize: vertical; min-height: 120px; }
.form-row { display: flex; gap: 12px; }
.form-row .input { flex: 1; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }

.view-modal { width: 700px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #eee; }
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #999; transition: color 0.2s; }
.close-btn:hover { color: #333; }
.modal-body { flex: 1; overflow-y: auto; padding: 16px 0; }
.note-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.note-content { font-size: 14px; line-height: 1.8; }
.note-content :deep(p) { margin: 0 0 12px 0; }
.note-content :deep(ul) { margin: 0 0 12px 0; padding-left: 20px; }
.note-content :deep(li) { margin-bottom: 4px; }
.note-summary-box { margin-top: 16px; padding: 12px; background: #f8f9ff; border-radius: 8px; font-size: 13px; color: #666; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 12px; border-top: 1px solid #eee; }

.btn { padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
.btn-ghost { background: transparent; color: #666; border: 1px solid #e2e8f0; }
.btn-ghost:hover { background: #f1f5f9; }
.tag { background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: #666; }
.tag-primary { background: #eef2ff; color: #4f46e5; }
.input { border: 1px solid #e4e7ed; border-radius: 8px; padding: 8px 12px; font-size: 14px; outline: none; transition: border-color 0.2s; }
.input:focus { border-color: #667eea; }
.input::placeholder { color: #c0c4cc; }
</style>
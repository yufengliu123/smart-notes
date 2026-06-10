<template>
  <div class="page-wrapper">
    <div class="note-editor">
      <div class="editor-header">
        <button class="back-btn" @click="$router.push('/notes')">← 返回</button>
        <h1 class="editor-title">{{ noteId ? '编辑笔记' : '新建笔记' }}</h1>
      </div>
      <div class="editor-body">
        <input class="title-input" v-model="title" placeholder="输入标题..." />
        <div ref="editorRef" class="content-editor" contenteditable="true" @input="onInput"
          @selectstart="e => e.preventDefault()"></div>
      </div>
      <div class="editor-footer">
        <button class="save-btn" @click="save">保存笔记</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const title = ref('')
const editorRef = ref(null)
const noteId = ref(null)

onMounted(() => {
  const m = window.location.pathname.match(/\/note\/(\d+)/)
  if (m) {
    noteId.value = m[1]
    api.get('/notes/' + noteId.value).then(res => {
      if (res.code === 200 && editorRef.value) {
        title.value = res.data.title || ''
        editorRef.value.innerText = res.data.content || ''
      }
    }).catch(console.error)
  }
})

function onInput() {
  // no-op to track changes without reactivity
}
</script>

<style scoped>
.note-editor { max-width: 900px; margin: 0 auto; padding: 20px; }
.editor-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.back-btn { background: #f5f5f5; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.editor-title { font-size: 20px; font-weight: 600; color: #333; margin: 0; }
.editor-body { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
.title-input { width: 100%; padding: 16px; border: none; border-bottom: 1px solid #eee; font-size: 18px; outline: none; box-sizing: border-box; }
.content-editor { min-height: 400px; padding: 16px; outline: none; line-height: 1.6; white-space: pre-wrap; }
.editor-footer { display: flex; justify-content: flex-end; margin-top: 20px; }
.save-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; cursor: pointer; }
</style>
import { defineStore } from 'pinia'
import api from '../services/api'

export const useNoteStore = defineStore('notes', {
  state: () => ({
    notes: [],
    currentNote: null,
    total: 0,
    loading: false
  }),
  actions: {
    async fetchNotes(params = {}) {
      this.loading = true
      try {
        const data = await api.get('/notes', { params })
        console.log('fetchNotes raw response:', JSON.stringify(data))
        if (data.code === 200) {
          this.notes = data.data?.list || []
          this.total = data.data?.total || 0
          console.log('store.notes after fetch:', this.notes.length, 'notes')
        } else {
          this.notes = []
          this.total = 0
        }
      } catch (e) {
        console.error('fetchNotes error:', e)
        this.notes = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },
    async createNote(noteData) {
      const payload = {}
      payload.title = noteData.title
      payload.content = noteData.content
      if (noteData.category) payload.category = noteData.category
      if (noteData.keywords) payload.tags = noteData.keywords
      const res = await api.post('/notes', payload)
      return res
    },
    async updateNote(id, noteData) {
      const payload = { ...noteData }
      if (payload.keywords) { payload.tags = payload.keywords; delete payload.keywords }
      const { data } = await api.put(`/notes/${id}`, payload)
      return data
    },
    async deleteNote(id) {
      const { data } = await api.delete(`/notes/${id}`)
      return data
    },
    async getNote(id) {
      const { data } = await api.get(`/notes/${id}`)
      if (data.code === 200) this.currentNote = data.data
      return data
    }
  }
})
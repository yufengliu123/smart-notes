import { defineStore } from 'pinia'
import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 5000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.config && !error.config._retry) {
      error.config._retry = true
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        return { code: 0, data: null, message: 'offline' }
      }
    }
    if (error.response?.data) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
  }
)

export const useReviewStore = defineStore('review', {
  state: () => ({
    totalNotes: 0,
    scheduledNotes: 0,
    dueCount: 0,
    todayReviews: 0,
    reviewItems: []
  }),
  
  actions: {
    saveToStorage() {
      localStorage.setItem('review_items_data', JSON.stringify(this.reviewItems))
    },
    loadFromStorage() {
      try {
        const saved = JSON.parse(localStorage.getItem('review_items_data') || '[]')
        this.reviewItems = saved
        this.scheduledNotes = saved.length
        this.dueCount = saved.filter(i => new Date(i.next_review_date) <= new Date()).length
      } catch (e) {}
    },

    async fetchDueList() {
      try {
        const res = await api.get('/review/due')
        if (res.code === 200) {
          const serverItems = res.data || []
          if (serverItems.length > 0) {
            this.reviewItems = serverItems
            this.dueCount = serverItems.filter(i => new Date(i.next_review_date) <= new Date()).length
            this.scheduledNotes = serverItems.length
            this.saveToStorage()
          } else {
            this.loadFromStorage()
          }
        } else {
          this.loadFromStorage()
        }
      } catch (e) {
        this.loadFromStorage()
      }
    },

    async fetchStats() {
      try {
        const data = await api.get('/review/stats')
        if (data.code === 200) {
          this.updateStats(data.data)
        }
      } catch (e) {
        this.dueCount = this.reviewItems.filter(i => new Date(i.next_review_date) <= new Date()).length
        this.scheduledNotes = this.reviewItems.length
      }
    },
    
    updateReviewItems(items) {
      this.reviewItems = items
      this.dueCount = items.filter(i => new Date(i.next_review_date) <= new Date()).length
      this.scheduledNotes = items.length
      this.saveToStorage()
    },
    
    removeItem(id) {
      this.reviewItems = this.reviewItems.filter(i => i.id !== id)
      this.dueCount = this.reviewItems.filter(i => new Date(i.next_review_date) <= new Date()).length
      this.scheduledNotes = this.reviewItems.length
      this.saveToStorage()
      api.delete('/review/schedule/' + id).catch(e => { console.error('remove schedule error:', e) })
    },

    updateStats(data) {
      if (data.totalNotes !== undefined) this.totalNotes = data.totalNotes
      if (data.scheduledNotes !== undefined) this.scheduledNotes = data.scheduledNotes
      if (data.dueCount !== undefined) this.dueCount = data.dueCount
      if (data.todayReviews !== undefined) this.todayReviews = data.todayReviews
    },

    cleanupExpiredItems() {
      const now = Date.now()
      this.reviewItems.forEach(i => {
        if (!i.added_at) return
        const windowDays = i.window_days || 7
        const windowMs = windowDays * 86400000
        i.expired = (now - new Date(i.added_at).getTime()) > windowMs
      })
      this.saveToStorage()
    },
    setNotes(notes) {
      this.notes = notes
      this.totalNotes = notes.length
    }
  }
})

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  actions: {
    async login(account, password) {
      const isEmail = account.includes('@')
      const payload = isEmail ? { email: account, password } : { username: account, password }
      const res = await api.post('/auth/login', payload)
      if (res.code === 200) {
        this.token = res.data.token
        this.user = res.data.user
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
      }
      return res
    },
    async register(username, email, password) {
      const { data } = await api.post('/auth/register', { username, email, password })
      return data
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})

export default api
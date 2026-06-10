import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
})

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
    return Promise.reject(error.response?.data || error)
  }
)

export default api
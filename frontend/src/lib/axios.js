import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to attach active business ID and token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kasumkm_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const activeBusinessId = localStorage.getItem('kasumkm_active_business_id')
  if (activeBusinessId) {
    config.headers['X-Business-Id'] = activeBusinessId
  }

  return config
})

// Response interceptor for handling 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and handle session expiry if not on auth page
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('kasumkm_token')
      }
    }
    return Promise.reject(error)
  }
)

export default api


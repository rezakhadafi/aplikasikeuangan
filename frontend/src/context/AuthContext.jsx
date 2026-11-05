import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [activeBusiness, setActiveBusiness] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch authenticated user profile on initial mount
  useEffect(() => {
    const token = localStorage.getItem('kasumkm_token')
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user)
          setBusinesses(res.data.businesses || [])
          
          const savedBizId = localStorage.getItem('kasumkm_active_business_id')
          const foundBiz = (res.data.businesses || []).find(b => String(b.id) === String(savedBizId))
          const initialBiz = foundBiz || (res.data.businesses && res.data.businesses[0]) || null
          
          if (initialBiz) {
            setActiveBusiness(initialBiz)
            localStorage.setItem('kasumkm_active_business_id', initialBiz.id)
          }
        })
        .catch(() => {
          localStorage.removeItem('kasumkm_token')
          localStorage.removeItem('kasumkm_active_business_id')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user, active_business, businesses } = res.data

    localStorage.setItem('kasumkm_token', token)
    if (active_business) {
      localStorage.setItem('kasumkm_active_business_id', active_business.id)
    }

    setUser(user)
    setActiveBusiness(active_business)
    setBusinesses(businesses || [])
    return res.data
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    const { token, user, active_business } = res.data

    localStorage.setItem('kasumkm_token', token)
    if (active_business) {
      localStorage.setItem('kasumkm_active_business_id', active_business.id)
    }

    setUser(user)
    setActiveBusiness(active_business)
    setBusinesses(active_business ? [active_business] : [])
    return res.data
  }

  const switchBusiness = (business) => {
    setActiveBusiness(business)
    localStorage.setItem('kasumkm_active_business_id', business.id)
    window.location.reload()
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('kasumkm_token')
      localStorage.removeItem('kasumkm_active_business_id')
      setUser(null)
      setActiveBusiness(null)
      setBusinesses([])
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeBusiness,
        businesses,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        switchBusiness,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


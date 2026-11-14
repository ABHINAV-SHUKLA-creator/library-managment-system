import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/axios.js'
import { AuthContext } from './auth-context.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true until we know if someone is logged in

  // on first load, ask the backend who we are (works if the cookie is still valid)
  useEffect(() => {
    let cancelled = false

    api
      .get('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data.data)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // the axios interceptor fires this when the refresh token no longer works
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    setUser(res.data.data.user)
    return res.data.data.user
  }, [])

  const register = useCallback(async (form) => {
    const res = await api.post('/auth/register', form)
    return res.data.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

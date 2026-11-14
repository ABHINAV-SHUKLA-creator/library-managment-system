import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send the httpOnly cookies the backend sets
})

// when several requests fail at once, only one refresh call is made
// (the refresh token is single-use, so parallel refreshes would break)
let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const message = error.response?.data?.message

    const isAuthCall =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/refresh-token')

    const tokenExpired = status === 401 && message === 'Access token expired'

    if (tokenExpired && !original._retry && !isAuthCall) {
      original._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post('/auth/refresh-token')
            .finally(() => {
              refreshPromise = null
            })
        }
        await refreshPromise
        return api(original) // retry the request that failed
      } catch (refreshError) {
        // refresh failed: tell the app the session is over
        window.dispatchEvent(new Event('auth:expired'))
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

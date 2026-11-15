import { useCallback, useEffect, useState } from 'react'
import api from '../api/axios.js'

// empty or undefined params are not sent
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )

// GET `url` whenever url or params change. Pass url = null to do nothing.
// returns { data, error, loading, reload }
export function useFetch(url, params) {
  const [reloadCount, setReloadCount] = useState(0)
  const cleaned = clean(params)
  const key = `${url}|${JSON.stringify(cleaned)}|${reloadCount}`

  const [result, setResult] = useState({ key: null, data: null, error: '' })

  useEffect(() => {
    if (!url) return undefined
    let cancelled = false

    api
      .get(url, { params: cleaned })
      .then((res) => {
        if (!cancelled) setResult({ key, data: res.data.data, error: '' })
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ key, data: null, error: err.response?.data?.message || 'Request failed' })
        }
      })

    return () => {
      cancelled = true
    }
    // key already contains url and params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reload = useCallback(() => setReloadCount((c) => c + 1), [])

  const current = result.key === key // is the stored result for the request we want now?
  return {
    data: current ? result.data : null,
    error: current ? result.error : '',
    loading: Boolean(url) && !current,
    reload,
  }
}

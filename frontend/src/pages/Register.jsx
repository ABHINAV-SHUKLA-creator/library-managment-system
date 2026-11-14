import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export default function Register() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '', phoneNumber: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // only send phoneNumber when filled in, the backend validates its format
    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    }
    if (form.phoneNumber.trim()) payload.phoneNumber = form.phoneNumber.trim()

    try {
      await register(payload)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
  const labelClass = 'mt-4 block text-sm font-medium text-gray-700'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
        <p className="mt-1 text-sm text-gray-500">Student registration.</p>

        {error && <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <label className={labelClass} htmlFor="username">Username</label>
        <input id="username" name="username" value={form.username} onChange={handleChange} required className={inputClass} />

        <label className={labelClass} htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} />

        <label className={labelClass} htmlFor="password">Password</label>
        <input id="password" name="password" type="password" minLength={6} value={form.password} onChange={handleChange} required className={inputClass} />
        <p className="mt-1 text-xs text-gray-500">At least 6 characters.</p>

        <label className={labelClass} htmlFor="phoneNumber">Phone (optional)</label>
        <input id="phoneNumber" name="phoneNumber" placeholder="+919876543210" value={form.phoneNumber} onChange={handleChange} className={inputClass} />

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Creating...' : 'Create account'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

// temporary landing page, replaced by the real dashboard later
export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.username}</h1>
      <dl className="mt-4 space-y-1 text-gray-700">
        <div><dt className="inline font-medium">Role: </dt><dd className="inline">{user.role}</dd></div>
        <div><dt className="inline font-medium">Member ID: </dt><dd className="inline">{user.memberId}</dd></div>
        <div><dt className="inline font-medium">Email: </dt><dd className="inline">{user.email}</dd></div>
      </dl>
      <button
        onClick={handleLogout}
        className="mt-6 rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
      >
        Log out
      </button>
    </div>
  )
}

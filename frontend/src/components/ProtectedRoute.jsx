import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

// <ProtectedRoute />                      any logged-in user
// <ProtectedRoute roles={['employee', 'admin']} />   staff only
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-600">Access denied</h1>
        <p className="mt-1 text-gray-600">You do not have permission to view this page.</p>
      </div>
    )
  }

  return <Outlet />
}

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

const ALL = ['student', 'employee', 'admin']
const STAFF = ['employee', 'admin']

// add a line here for every new page; roles decides who sees the link
const links = [
  { to: '/', label: 'Books', roles: ALL },
  { to: '/my-borrows', label: 'My borrows', roles: ALL },
  { to: '/staff/issue', label: 'Issue', roles: STAFF },
  { to: '/staff/borrows', label: 'Borrows', roles: STAFF },
  { to: '/staff/students', label: 'Students', roles: STAFF },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="text-lg font-bold text-gray-900">Library</span>
          <nav className="flex flex-wrap gap-1">
            {links
              .filter((link) => link.roles.includes(user.role))
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-sm leading-tight">
            <p className="font-medium text-gray-900">{user.username}</p>
            <p className="text-xs text-gray-500">
              {user.role} · {user.memberId}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-900"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}

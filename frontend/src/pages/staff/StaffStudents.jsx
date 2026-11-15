import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useFetch } from '../../hooks/useFetch.js'

const LIMIT = 20

export default function StaffStudents() {
  const [text, setText] = useState('')
  const search = useDebounce(text.trim())
  const { data, error, loading } = useFetch('/users', { search, role: 'student', limit: LIMIT })
  const students = data?.users || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Students</h1>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search by member ID, name or email"
        className="mt-4 w-full max-w-md rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
      />

      {loading && <p className="mt-6 text-gray-500">Loading...</p>}
      {error && <p className="mt-6 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && students.length === 0 && (
        <p className="mt-6 text-gray-500">No students found.</p>
      )}

      {!loading && !error && students.length > 0 && (
        <>
          <ul className="mt-4 space-y-3">
            {students.map((s) => (
              <li
                key={s._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {s.username}
                    {!s.isActive && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {s.memberId} · {s.email}
                    {s.phoneNumber ? ` · ${s.phoneNumber}` : ''}
                  </p>
                </div>

                <div className="flex gap-2">
                  {s.isActive && (
                    <Link
                      to="/staff/issue"
                      state={{ student: s }}
                      className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                      Issue book
                    </Link>
                  )}
                  <Link
                    to={`/staff/borrows?userId=${s._id}`}
                    state={{ studentName: s.username }}
                    className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Borrows
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {data.total > LIMIT && (
            <p className="mt-4 text-sm text-gray-500">
              Showing {students.length} of {data.total}. Type more to narrow it down.
            </p>
          )}
        </>
      )}
    </div>
  )
}

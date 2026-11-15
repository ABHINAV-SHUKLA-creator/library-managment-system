import { useState } from 'react'
import { useDebounce } from '../hooks/useDebounce.js'
import { useFetch } from '../hooks/useFetch.js'

// search students by member id, name or email and pick one
export default function StudentPicker({ onSelect }) {
  const [text, setText] = useState('')
  const search = useDebounce(text.trim())
  const { data, error, loading } = useFetch('/users', { search, role: 'student', limit: 8 })
  const students = data?.users || []

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search by member ID, name or email"
        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
      />

      {loading && <p className="mt-2 text-sm text-gray-500">Searching...</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!loading && !error && students.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">No students found.</p>
      )}

      <ul className="mt-2 divide-y divide-gray-100 rounded border border-gray-200">
        {students.map((s) => (
          <li key={s._id}>
            <button
              type="button"
              disabled={!s.isActive}
              onClick={() => onSelect(s)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="font-medium text-gray-900">{s.username}</span>
              <span className="text-xs text-gray-500">
                {s.memberId} · {s.email}
                {!s.isActive && ' · inactive'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

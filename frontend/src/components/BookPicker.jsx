import { useState } from 'react'
import { useDebounce } from '../hooks/useDebounce.js'
import { useFetch } from '../hooks/useFetch.js'

// search books by title, author or category and pick one
export default function BookPicker({ onSelect }) {
  const [text, setText] = useState('')
  const search = useDebounce(text.trim())
  const { data, error, loading } = useFetch('/books', { search, limit: 8 })
  const books = data?.books || []

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search by title, author or category"
        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
      />

      {loading && <p className="mt-2 text-sm text-gray-500">Searching...</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {!loading && !error && books.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">No books found.</p>
      )}

      <ul className="mt-2 divide-y divide-gray-100 rounded border border-gray-200">
        {books.map((b) => (
          <li key={b._id}>
            <button
              type="button"
              onClick={() => onSelect(b)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-blue-50"
            >
              <span className="font-medium text-gray-900">{b.title}</span>
              <span className="text-xs text-gray-500">{b.author}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

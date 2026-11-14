import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios.js'
import BookCard from '../components/BookCard.jsx'

const PAGE_SIZE = 12

export default function Books() {
  // page and category live in the URL, so refresh and the back button keep working
  const [params, setParams] = useSearchParams()
  const page = Math.max(parseInt(params.get('page')) || 1, 1)
  const category = params.get('category') || ''

  const key = `${category}|${page}`
  const [result, setResult] = useState({ key: null, data: null, error: '' })
  const loading = result.key !== key // true until the response for the current URL arrives

  useEffect(() => {
    let cancelled = false
    const url = category ? `/books/category/${encodeURIComponent(category)}` : '/books'

    api
      .get(url, { params: { page, limit: PAGE_SIZE } })
      .then((res) => {
        if (!cancelled) setResult({ key, data: res.data.data, error: '' })
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key,
            data: null,
            error: err.response?.data?.message || 'Could not load books',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, page, category])

  const goTo = (nextPage, nextCategory = category) => {
    const next = {}
    if (nextCategory) next.category = nextCategory
    if (nextPage > 1) next.page = String(nextPage)
    setParams(next)
    window.scrollTo({ top: 0 })
  }

  const { data, error } = result
  const books = data?.books || []

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Books</h1>

        {category && (
          <button
            type="button"
            onClick={() => goTo(1, '')}
            className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 hover:bg-blue-200"
          >
            Category: {category} ✕
          </button>
        )}
      </div>

      {loading && <p className="mt-6 text-gray-500">Loading books...</p>}

      {!loading && error && (
        <p className="mt-6 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && books.length === 0 && (
        <p className="mt-6 text-gray-500">No books found.</p>
      )}

      {!loading && !error && books.length > 0 && (
        <>
          <p className="mt-1 text-sm text-gray-500">{data.totalBooks} books</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => (
              <BookCard key={book._id} book={book} onCategoryClick={(c) => goTo(1, c)} />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={!data.hasPrevPage}
              onClick={() => goTo(page - 1)}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {data.page} of {data.totalPages}
            </span>
            <button
              type="button"
              disabled={!data.hasNextPage}
              onClick={() => goTo(page + 1)}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

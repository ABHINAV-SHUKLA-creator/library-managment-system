import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios.js'
import { daysBetween, formatDate, formatMoney } from '../utils/format.js'

const TABS = [
  { status: 'borrowed', label: 'Currently borrowed' },
  { status: 'returned', label: 'History' },
]

// small coloured label for a borrow record
function StatusBadge({ borrow, now }) {
  if (borrow.status === 'returned') {
    return <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">Returned</span>
  }

  if (borrow.isOverdue) {
    const days = daysBetween(borrow.dueDate, now)
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Overdue by {days} {days === 1 ? 'day' : 'days'}
      </span>
    )
  }

  const left = daysBetween(now, borrow.dueDate)
  const text = left <= 0 ? 'Due today' : `Due in ${left} ${left === 1 ? 'day' : 'days'}`
  const colour = left <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colour}`}>{text}</span>
}

export default function MyBorrows() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') === 'returned' ? 'returned' : 'borrowed'
  const page = Math.max(parseInt(params.get('page')) || 1, 1)
  const limit = status === 'borrowed' ? 50 : 10 // current loans fit on one page

  const [now] = useState(() => Date.now()) // fixed while the page is open

  const key = `${status}|${page}`
  const [result, setResult] = useState({ key: null, data: null, error: '' })
  const loading = result.key !== key

  useEffect(() => {
    let cancelled = false

    api
      .get('/borrow/my', { params: { status, page, limit } })
      .then((res) => {
        if (!cancelled) setResult({ key, data: res.data.data, error: '' })
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key,
            data: null,
            error: err.response?.data?.message || 'Could not load your borrows',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key, status, page, limit])

  const switchTab = (nextStatus) => setParams(nextStatus === 'borrowed' ? {} : { status: nextStatus })

  const goToPage = (nextPage) => {
    setParams(nextPage > 1 ? { status, page: String(nextPage) } : { status })
    window.scrollTo({ top: 0 })
  }

  const { data, error } = result
  const borrows = data?.borrows || []

  const overdueCount = borrows.filter((b) => b.isOverdue).length
  const totalFine = borrows.reduce((sum, b) => sum + (b.currentFine || 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">My borrows</h1>

      <div className="mt-4 flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            onClick={() => switchTab(tab.status)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              status === tab.status
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-gray-500">Loading...</p>}

      {!loading && error && (
        <p className="mt-6 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && status === 'borrowed' && borrows.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500">Books out</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{borrows.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500">Overdue</p>
            <p className={`mt-1 text-2xl font-bold ${overdueCount ? 'text-red-600' : 'text-gray-900'}`}>
              {overdueCount}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500">Fine if returned today</p>
            <p className={`mt-1 text-2xl font-bold ${totalFine ? 'text-red-600' : 'text-gray-900'}`}>
              {formatMoney(totalFine)}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && borrows.length === 0 && (
        <p className="mt-6 text-gray-500">
          {status === 'borrowed' ? 'You have no borrowed books right now.' : 'No past borrows yet.'}
        </p>
      )}

      {!loading && !error && borrows.length > 0 && (
        <>
          <ul className="mt-4 space-y-3">
            {borrows.map((b) => {
              const book = b.bookCopy?.book
              return (
                <li
                  key={b._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{book?.title ?? 'Unknown book'}</p>
                    <p className="text-sm text-gray-600">
                      {book?.author}
                      {b.bookCopy ? ` · Copy #${b.bookCopy.copyNumber}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Borrowed {formatDate(b.borrowDate)}
                      {b.status === 'borrowed'
                        ? ` · Due ${formatDate(b.dueDate)}`
                        : ` · Returned ${formatDate(b.returnDate)}`}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge borrow={b} now={now} />
                    {b.currentFine > 0 && (
                      <p className="text-sm font-medium text-red-600">Fine {formatMoney(b.currentFine)}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => goToPage(page + 1)}
                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

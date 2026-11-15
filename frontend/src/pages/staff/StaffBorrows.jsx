import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import api from '../../api/axios.js'
import { useFetch } from '../../hooks/useFetch.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatDate, formatMoney } from '../../utils/format.js'

const VIEWS = [
  { key: 'overdue', label: 'Overdue', params: { overdue: 'true' } },
  { key: 'borrowed', label: 'Borrowed', params: { status: 'borrowed' } },
  { key: 'returned', label: 'Returned', params: { status: 'returned' } },
]
const LIMIT = 15

export default function StaffBorrows() {
  const location = useLocation()
  const [params, setParams] = useSearchParams()

  const view = VIEWS.find((v) => v.key === params.get('view')) || VIEWS[1]
  const page = Math.max(parseInt(params.get('page')) || 1, 1)
  const userId = params.get('userId') || ''

  const [now] = useState(() => Date.now())
  const [returningId, setReturningId] = useState('')
  const [notice, setNotice] = useState(null) // { type, text }

  const { data, error, loading, reload } = useFetch('/borrow', {
    ...view.params,
    page,
    limit: LIMIT,
    userId,
  })
  const borrows = data?.borrows || []

  // keep the other URL params when one of them changes
  const update = (next) => {
    const merged = { view: view.key, page: 1, userId, ...next }
    const out = {}
    if (merged.view !== 'borrowed') out.view = merged.view
    if (merged.userId) out.userId = merged.userId
    if (merged.page > 1) out.page = String(merged.page)
    setParams(out)
  }

  const handleReturn = async (b) => {
    const title = b.bookCopy?.book?.title ?? 'this book'
    const fineText = b.currentFine > 0 ? ` Fine to collect: ${formatMoney(b.currentFine)}.` : ''
    if (!window.confirm(`Return "${title}" from ${b.user?.username}?${fineText}`)) return

    setReturningId(b._id)
    setNotice(null)
    try {
      const res = await api.post('/borrow/return', { borrowId: b._id })
      const fine = res.data.data?.fine ?? 0
      setNotice({ type: 'success', text: `Returned "${title}". Fine collected: ${formatMoney(fine)}.` })
      reload()
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Could not return the book' })
    } finally {
      setReturningId('')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Borrows</h1>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200">
        <div className="flex gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => update({ view: v.key, page: 1 })}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                view.key === v.key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {userId && (
          <button
            type="button"
            onClick={() => update({ userId: '', page: 1 })}
            className="mb-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 hover:bg-blue-200"
          >
            {location.state?.studentName ? `Student: ${location.state.studentName}` : 'One student'} ✕
          </button>
        )}
      </div>

      {notice && (
        <p
          className={`mt-4 rounded p-3 text-sm ${
            notice.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {notice.text}
        </p>
      )}

      {loading && <p className="mt-6 text-gray-500">Loading...</p>}
      {!loading && error && <p className="mt-6 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && borrows.length === 0 && <p className="mt-6 text-gray-500">Nothing here.</p>}

      {!loading && !error && borrows.length > 0 && (
        <>
          <p className="mt-3 text-sm text-gray-500">{data.total} records</p>

          <ul className="mt-2 space-y-3">
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
                      {b.user?.username} · {b.user?.memberId}
                      {b.bookCopy ? ` · Copy #${b.bookCopy.copyNumber}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Borrowed {formatDate(b.borrowDate)}
                      {b.status === 'borrowed'
                        ? ` · Due ${formatDate(b.dueDate)}`
                        : ` · Returned ${formatDate(b.returnDate)}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge borrow={b} now={now} />
                      {b.currentFine > 0 && (
                        <p className="text-sm font-medium text-red-600">Fine {formatMoney(b.currentFine)}</p>
                      )}
                    </div>

                    {b.status === 'borrowed' && (
                      <button
                        type="button"
                        disabled={returningId === b._id}
                        onClick={() => handleReturn(b)}
                        className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-900 disabled:opacity-50"
                      >
                        {returningId === b._id ? 'Returning...' : 'Return'}
                      </button>
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
                onClick={() => update({ page: page - 1 })}
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
                onClick={() => update({ page: page + 1 })}
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

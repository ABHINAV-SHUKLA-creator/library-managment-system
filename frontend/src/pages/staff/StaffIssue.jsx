import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../../api/axios.js'
import { useFetch } from '../../hooks/useFetch.js'
import StudentPicker from '../../components/StudentPicker.jsx'
import BookPicker from '../../components/BookPicker.jsx'
import { formatDate } from '../../utils/format.js'

// small card with a step number and a title
function Step({ number, title, children }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-3 font-semibold text-gray-900">
        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

// the "selected" chip with a Change button
function Selected({ title, subtitle, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded bg-blue-50 px-3 py-2">
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-600">{subtitle}</p>
      </div>
      <button type="button" onClick={onChange} className="text-sm text-blue-700 hover:underline">
        Change
      </button>
    </div>
  )
}

export default function StaffIssue() {
  const location = useLocation()
  // "Issue book" on the Students page passes the student along
  const [student, setStudent] = useState(location.state?.student || null)
  const [book, setBook] = useState(null)
  const [copyId, setCopyId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }

  const { data, error: copiesError, loading: copiesLoading, reload } = useFetch(
    book ? `/books/${book._id}/copies` : null
  )
  const copies = data || []

  const handleIssue = async () => {
    setSubmitting(true)
    setNotice(null)
    try {
      const res = await api.post('/borrow/issue', { bookCopyId: copyId, userId: student._id })
      const copy = copies.find((c) => c._id === copyId)
      setNotice({
        type: 'success',
        text: `Issued "${book.title}" (copy #${copy?.copyNumber}) to ${student.username}. Due ${formatDate(res.data.data?.dueDate)}.`,
      })
      // keep the student so several books can be issued in a row
      setBook(null)
      setCopyId('')
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Could not issue the book' })
      reload() // the copy may have just been taken, show fresh statuses
    } finally {
      setSubmitting(false)
    }
  }

  const canIssue = Boolean(student && book && copyId) && !submitting

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Issue a book</h1>

      {notice && (
        <p
          className={`mt-4 rounded p-3 text-sm ${
            notice.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="mt-4 space-y-4">
        <Step number={1} title="Student">
          {student ? (
            <Selected
              title={student.username}
              subtitle={`${student.memberId} · ${student.email}`}
              onChange={() => setStudent(null)}
            />
          ) : (
            <StudentPicker onSelect={setStudent} />
          )}
        </Step>

        <Step number={2} title="Book">
          {book ? (
            <Selected
              title={book.title}
              subtitle={book.author}
              onChange={() => {
                setBook(null)
                setCopyId('')
              }}
            />
          ) : (
            <BookPicker onSelect={setBook} />
          )}
        </Step>

        {book && (
          <Step number={3} title="Copy (the number on the physical book)">
            {copiesLoading && <p className="text-sm text-gray-500">Loading copies...</p>}
            {copiesError && <p className="text-sm text-red-600">{copiesError}</p>}
            {!copiesLoading && !copiesError && copies.length === 0 && (
              <p className="text-sm text-gray-500">This book has no copies yet.</p>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {copies.map((c) => {
                const available = c.status === 'available'
                return (
                  <label
                    key={c._id}
                    className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${
                      available
                        ? copyId === c._id
                          ? 'cursor-pointer border-blue-500 bg-blue-50'
                          : 'cursor-pointer border-gray-200 hover:bg-gray-50'
                        : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="copy"
                        value={c._id}
                        disabled={!available}
                        checked={copyId === c._id}
                        onChange={() => setCopyId(c._id)}
                      />
                      Copy #{c.copyNumber}
                    </span>
                    <span className="text-xs">{c.status}</span>
                  </label>
                )
              })}
            </div>
          </Step>
        )}
      </div>

      <button
        type="button"
        disabled={!canIssue}
        onClick={handleIssue}
        className="mt-6 rounded bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Issuing...' : 'Issue book'}
      </button>
    </div>
  )
}

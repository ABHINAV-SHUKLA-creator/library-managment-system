import { daysBetween } from '../utils/format.js'

// small coloured label for a borrow record
export default function StatusBadge({ borrow, now }) {
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

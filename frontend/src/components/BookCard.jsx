// one book in the grid; clicking a category chip filters by that category
export default function BookCard({ book, onCategoryClick }) {
  const categories = book.category || []
  const meta = [book.pageCount ? `${book.pageCount} pages` : null, book.language?.toUpperCase()]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="flex h-48 items-center justify-center bg-gray-100">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={`Cover of ${book.title}`}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none' // broken link: keep the grey box
            }}
          />
        ) : (
          <span className="text-5xl font-bold text-gray-300">
            {book.title.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 font-semibold text-gray-900">{book.title}</h2>
        <p className="mt-1 text-sm text-gray-600">{book.author}</p>

        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCategoryClick(c)}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {meta && <p className="mt-auto pt-3 text-xs text-gray-500">{meta}</p>}
      </div>
    </article>
  )
}

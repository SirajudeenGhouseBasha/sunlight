export default function GlobalLoading() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-3 h-7 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="mb-3 aspect-square animate-pulse rounded-lg bg-gray-200" />
              <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-600">
          <span className="size-2 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.2s]" />
          <span className="size-2 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.1s]" />
          <span className="size-2 animate-bounce rounded-full bg-orange-500" />
          <span className="ml-2">Loading next page...</span>
        </div>
      </div>
    </main>
  );
}

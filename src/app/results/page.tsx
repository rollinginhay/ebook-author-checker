import Link from "next/link";
import {extractAuthorAsin} from "@/lib/utils";
import {getBooksByAuthorId} from "@/lib/amazon";
import {AmazonBook} from "@/types/types";
import {AppError} from "@/lib/errors";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;

  if (!url) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <p className="text-lg text-red-600">No URL provided.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-zinc-600 underline dark:text-zinc-400">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  let books: AmazonBook[];
  try {
    const authorId = extractAuthorAsin(url);
    books = await getBooksByAuthorId(authorId);
  } catch (e: unknown) {
    const message = e instanceof AppError ? e.message : "Something went wrong";
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <p className="text-lg text-red-600">{message}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-zinc-600 underline dark:text-zinc-400">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Results ({books.length} books)
          </h1>
          <Link href="/" className="text-sm text-zinc-600 underline dark:text-zinc-400">
            New search
          </Link>
        </div>

        {books.length > 0 && (() => {
          const publishedDates = books
            .map((b) => b.published)
            .filter((d): d is string => d !== null)
            .map((d) => new Date(d).getTime());

          const earliest = publishedDates.length > 0 ? Math.min(...publishedDates) : null;
          const now = Date.now();
          const activeYears = earliest !== null
            ? ((now - earliest) / (1000 * 60 * 60 * 24 * 365.25))
            : null;

          const ratingsWithValues = books.filter((b) => b.rating != null);
          const avgRating = ratingsWithValues.length > 0
            ? ratingsWithValues.reduce((sum, b) => sum + b.rating, 0) / ratingsWithValues.length
            : null;

          const useMonths = activeYears !== null && activeYears < 1;
          const activeMonths = activeYears !== null ? activeYears * 12 : null;

          const frequency = activeYears && activeYears > 0
            ? useMonths
              ? books.length / activeMonths!
              : books.length / activeYears
            : null;

          return (
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Active for</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {activeYears !== null
                    ? useMonths
                      ? `${activeMonths!.toFixed(1)} months`
                      : `${activeYears.toFixed(1)} years`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total books</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{books.length}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Release frequency</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {frequency !== null
                    ? useMonths
                      ? `${frequency.toFixed(1)} / month`
                      : `${frequency.toFixed(1)} / year`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Avg. rating</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {avgRating !== null ? avgRating.toFixed(2) : "—"}
                </p>
              </div>
            </div>
          );
        })()}

        {(() => {
          const booksWithLowReviews = books
            .filter((b) => b.lowReviews.length > 0)
            .map((b) => {
              const avgLow = b.lowReviews.reduce((s, r) => s + r.rating, 0) / b.lowReviews.length;
              return { book: b, avgLow };
            })
            .sort((a, b) => a.avgLow - b.avgLow)
            .slice(0, 3);

          if (booksWithLowReviews.length === 0) return null;

          return (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Most Critically Reviewed
              </h2>
              <div className="space-y-4">
                {booksWithLowReviews.map(({ book, avgLow }) => (
                  <div
                    key={book.asin}
                    className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex gap-4">
                      {book.thumbnail && (
                        <img
                          src={book.thumbnail}
                          alt={book.title}
                          className="h-20 w-auto flex-shrink-0 rounded"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <a
                          href={book.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                        >
                          {book.title}
                        </a>
                        <div className="mt-1 flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                          <span>Overall rating: <strong className="text-zinc-700 dark:text-zinc-300">{book.rating ?? "—"}</strong></span>
                          <span>Avg. review score: <strong className="text-zinc-700 dark:text-zinc-300">{book.avgReviewScore != null ? book.avgReviewScore.toFixed(2) : "—"}</strong></span>
                          <span>Avg. low review: <strong className="text-red-600">{avgLow.toFixed(1)}</strong></span>
                          <span>{book.lowReviews.length} critical review{book.lowReviews.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {book.lowReviews.map((review, i) => (
                            <div
                              key={i}
                              className="rounded border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                            >
                              <span className="mr-2 text-xs font-semibold text-red-500">
                                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} {review.rating}/5
                              </span>
                              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{review.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {books.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">No books found for this author.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Thumbnail</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Title</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Authors</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Rating</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Avg. review score</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Reviews</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Published</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.asin} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      {book.thumbnail && (
                        <img src={book.thumbnail} alt={book.title} className="h-16 w-auto rounded" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      <a href={book.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {book.title}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {book.authors?.join(", ") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {book.rating ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {book.avgReviewScore != null ? book.avgReviewScore.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {book.reviews ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {book.published
                        ? new Date(book.published).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

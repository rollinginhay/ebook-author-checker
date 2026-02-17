"use client";

import {useRouter} from "next/navigation";
import {FormEvent, useState} from "react";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    router.push(`/results?url=${encodeURIComponent(url.trim())}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-8 px-6 py-32">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Ebook Author Checker
        </h1>
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          Paste an Amazon author page URL to see all their published books.
        </p>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 sm:flex-row">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.com/stores/author/..."
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-300"
          >
            Look Up
          </button>
        </form>
      </main>
    </div>
  );
}

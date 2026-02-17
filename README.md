# Ebook Author Checker

A simple website to summarize authors' ebook releases on Amazon, with the purpose of spotting AI slop.

Enter an Amazon author page URL and get a summary of their publishing activity — how long they've been active, release frequency, average rating — along with a full table of their books.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [SerpApi](https://serpapi.com/) for Amazon data
- Tailwind CSS

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your SerpApi key:
   ```
   SERPAPI_KEY=your_key_here
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

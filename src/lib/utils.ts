// lib/extractAuthorAsin.ts

import {AppError} from "@/lib/errors";

/**
 * Extracts ASIN from Amazon author URL
 */
export function extractAuthorAsin(url: string): string {
    let pathname: string;
    try {
        pathname = new URL(url).pathname;
    } catch {
        throw new AppError("INVALID_URL", "The provided URL is not valid");
    }

    const patterns = [
        /\/stores\/author\/([A-Z0-9]{10})/,  // /stores/author/ASIN
        /\/e\/([A-Z0-9]{10})/,               // /Author-Name/e/ASIN
        /\/author\/([A-Z0-9]{10})/,          // /author/ASIN
    ];

    for (const pattern of patterns) {
        const match = pathname.match(pattern);
        if (match) return match[1];
    }

    throw new AppError("ASIN_NOT_FOUND", "Could not find an author ASIN in the URL");
}


/**
 * Extract author names of book from the "brand" field (Serpapi doesnt support easily identifying single author)
 */
export function parseAuthors(brand: string): string[] {
    // Extract the portion before "Format:"
    const authorSection = brand.match(/by (.+?)\s+Format:/)?.[1];
    if (!authorSection) {
        throw new AppError("AUTHOR_PARSE_FAILED", `Could not parse authors from brand string: "${brand}"`);
    }

    // Split by ", " and strip the "(Author)" suffix from each
    return authorSection
        .split(", ")
        .map((a) => a.replace(/\s*\(Author\)/, "").trim())
        .filter(Boolean);
}
// lib/getBooksByAuthorId.ts
import {getJson} from "serpapi";
import {AmazonBook, BookReview} from "@/types/types";
import {parseAuthors} from "@/lib/utils";
import {AppError} from "@/lib/errors";

/**
 * Get complete book details by ASIN
 */
export async function getBookDetails(asin: string): Promise<AmazonBook> {
    console.log(`Fetching details for ASIN: ${asin}`);

    // Fetch initial product data
    let data = await getJson({
        engine: "amazon_product",
        asin,
        no_cache: true,
        api_key: process.env.SERPAPI_KEY!,
    });

    // Check if this is a Kindle edition
    const isKindle = data.product_results?.brand?.includes("Format: Kindle Edition");

    if (!isKindle) {
        // Try to find Kindle ASIN in prices array
        const kindlePrice = data.prices?.find((p: any) => p.title === "Kindle");

        if (kindlePrice?.link) {
            const kindleAsin = kindlePrice.link.match(/\/dp\/([A-Z0-9]{10})/)?.[1];

            if (kindleAsin && kindleAsin !== asin) {
                try {
                    console.log(`Not Kindle edition, found Kindle ASIN: ${kindleAsin}`);
                    // Fetch Kindle edition for complete author data
                    data = await getJson({
                        engine: "amazon_product",
                        asin: kindleAsin,
                        no_cache: true,
                        api_key: process.env.SERPAPI_KEY!,
                    });
                    // Update asin to the Kindle version
                    asin = kindleAsin;
                } catch (err) {
                    console.warn(`Failed to fetch Kindle edition ${kindleAsin}, using original data`);
                    // Fall back to original data
                }
            }
        } else {
            console.warn(`No Kindle edition found for ASIN: ${asin}`);
            // Fall back to original data
        }
    }

// Check if book is in English
    const brand = data.product_results?.brand;
    if (brand && !brand.trimStart().startsWith("by ")) {
        throw new AppError(
            "NON_ENGLISH_BOOK",
            `Book is not in English. Brand: "${brand}"`
        );
    }

    // Extract publication date
    const dateStr: string | undefined =
        data.product_details?.publication_date ??
        data.product_features?.find(
            (f: { title: string; text: string }) => f.title === "Publication date"
        )?.text;

    const releaseDate = dateStr ? new Date(dateStr).toISOString() : null;

    // Extract authors - try brand field first (Kindle editions have complete data)
    let authors: string[];
    //brand already defined

    if (brand) {
        authors = parseAuthors(brand);
    } else {
        // Fallback: product_features Author field (Audiobooks, etc)
        const authorFeature = data.product_features?.find(
            (f: { title: string }) => f.title === "Author"
        );

        if (authorFeature?.description) {
            authors = [authorFeature.description];
        } else if (authorFeature?.text) {
            const text = authorFeature.text.replace(/, see all$/i, "").trim();
            authors = [text];
        } else {
            throw new AppError("AUTHOR_PARSE_FAILED", `Could not parse authors from ASIN: ${asin}`);
        }
    }

    // Extract all book data from product_results
    const productResults = data.product_results;
    if (!productResults) {
        throw new AppError("PRODUCT_NOT_FOUND", `No product results found for ASIN: ${asin}`);
    }

    // Extract reviews from reviews_information.authors_reviews
    const rawReviews: { rating: number; text: string }[] =
        (data.reviews_information?.authors_reviews ?? []).map(
            (r: { rating: number; text: string }) => ({rating: r.rating, text: r.text})
        );

    const lowReviews: BookReview[] = rawReviews.filter((r) => r.rating < 5);

    const starCounts = data.reviews_information?.summary?.customer_reviews;
    let avgReviewScore: number | null = null;

    if (starCounts) {
        const counts: [number, number][] = [
            [5, parseFloat(starCounts["5 star"]) || 0],
            [4, parseFloat(starCounts["4 star"]) || 0],
            [3, parseFloat(starCounts["3 star"]) || 0],
            [2, parseFloat(starCounts["2 star"]) || 0],
            [1, parseFloat(starCounts["1 star"]) || 0],
        ];
        const total = counts.reduce((s, [, c]) => s + c, 0);
        if (total > 0) {
            const weighted = counts.reduce((s, [stars, c]) => s + stars * c, 0);
            avgReviewScore = weighted / total;
        }
    } else if (rawReviews.length > 0) {
        avgReviewScore = rawReviews.reduce((s, r) => s + r.rating, 0) / rawReviews.length;
    }


    return {
        asin,
        title: productResults.title,
        authors,
        rating: productResults.rating,
        reviews: productResults.reviews,
        thumbnail: productResults.thumbnail,
        link: productResults.link,
        published: releaseDate,
        lowReviews,
        avgReviewScore,
    };
}

/**
 * Get all books by author ASIN
 */
export async function getBooksByAuthorId(authorId: string): Promise<AmazonBook[]> {
    if (!authorId) throw new AppError("MISSING_PARAM", "authorId is required");
    const asins: string[] = [];
    let page = 1;

    // Collect all book ASINs from search results
    while (true) {
        const data = await getJson({
            engine: "amazon",
            k: authorId,
            i: "stripbooks",
            s: "date-desc-rank",
            api_key: process.env.SERPAPI_KEY!,
            page,
        });

        const results = data.organic_results ?? [];
        if (results.length === 0) break;

        for (const result of results) {
            // Skip sponsored results injected by Amazon
            if (result.link?.includes("sspa/click")) continue;
            asins.push(result.asin);
        }

        // Stop if there's no next page
        if (!data.pagination?.next) break;
        page++;
    }

    // Fetch complete details for each book
    const books: AmazonBook[] = [];
    for (const asin of asins) {
        try {
            const book = await getBookDetails(asin);
            books.push(book);
        } catch (err) {
            console.error(`Failed to fetch details for ${asin}:`, err);
            // Skip books that fail
        }
    }
    return books;
}
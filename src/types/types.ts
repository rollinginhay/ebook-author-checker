export interface AmazonBook {
    asin: string;
    title: string;
    rating: number;
    reviews: number;
    thumbnail: string;
    link: string;
    published: string | null,
    authors: string[] | null,
    lowReviews: BookReview[],
    avgReviewScore: number | null,
}

export interface BookReview {
    rating: number;
    text: string;
}

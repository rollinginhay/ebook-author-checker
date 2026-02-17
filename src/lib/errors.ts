export type ErrorCode =
    | "INVALID_URL"
    | "ASIN_NOT_FOUND"
    | "AUTHOR_PARSE_FAILED"
    | "PRODUCT_NOT_FOUND"
    | "MISSING_PARAM"
    | "API_ERROR";

export class AppError extends Error {
    code: ErrorCode;

    constructor(code: ErrorCode, message: string) {
        super(message);
        this.name = "AppError";
        this.code = code;
    }
}

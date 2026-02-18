import {getBookDetails} from "@/lib/amazon";

const url = "https://www.amazon.com/stores/Eliza-Hawk/author/B0FMMBTGJN?shoppingPortalEnabled=true";

// src/scripts/test.ts

async function main() {
    console.log(JSON.stringify(await getBookDetails("B0GG4Q9TMB")));
}

main().catch(console.error);
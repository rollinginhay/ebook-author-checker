import {extractAuthorAsin,} from "@/lib/utils";
import {getBookDetails, getBooksByAuthorId} from "@/lib/amazon";

const url = "https://www.amazon.com/stores/Eliza-Hawk/author/B0FMMBTGJN?shoppingPortalEnabled=true";

async function main() {
    console.log(JSON.stringify(await getBooksByAuthorId(extractAuthorAsin(url))));
}
main();
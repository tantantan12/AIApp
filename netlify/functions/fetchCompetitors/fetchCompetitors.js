console.error("start");
import { SerpAPI } from "@langchain/community/tools/serpapi";
import dotenv from 'dotenv';
console.error("import");

dotenv.config();

const serpApiKey = process.env.SERP_API_KEY;

if (!serpApiKey) {
    throw new Error("Missing SERPAPI_KEY in environment variables");
}

const search = new SerpAPI(serpApiKey, {
    engine: "google",
    hl: "en",
    gl: "us"
});
console.error("Created my Search");


const handler = async (event) => {
    try {
        console.error("Received event:", event);
        // Log the raw body
        console.error("Raw event.body:", event.body);
        if (!event.body) {
            console.error("Error: event.body is undefined or empty");
            return { statusCode: 400, body: JSON.stringify({ error: "Request body is missing" }) };
        }

        let requestBody;
        



        // Handle both cases: when body is stringified vs. when event is already an object
//        if (event.body) {
//            requestBody = JSON.parse(event.body);
//        } else if (typeof event === "object") {
//            requestBody = event;  // In local testing, Netlify might send an object directly
//        } else {
//            console.error("Unexpected event format:", event);
 //           return { statusCode: 400, body: JSON.stringify({ error: "Invalid request format" }) };
//        }

//        console.error("Parsed requestBody:", requestBody);

//        const query = requestBody.query || requestBody.productName;  // Support multiple key names

        const query="water bottle brand"
        // Search for competitors on Google
        console.error("Using Query:", query);

        // Perform Google Search using SerpAPI
        const searchResults = await search.invoke({ query });

        // Log the entire response
        console.error("Full search results:", JSON.stringify(searchResults, null, 2));

        // Extract organic search results safely
        const organicResults = searchResults?.organic_results || [];

        // Extract competitor names (limit to 5)
        const competitorNames = organicResults.slice(0, 5).map(result => result.title || "Unknown Competitor");

        console.error("Extracted Competitors:", competitorNames);

        return {
            statusCode: 200,
            body: JSON.stringify({ competitors: competitorNames })  // ✅ Always return `competitors`
        };
    } catch (error) {
        console.error("Error fetching competitors:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message, competitors: [] }) };  // ✅ Always return an array
    }
};

export { handler };

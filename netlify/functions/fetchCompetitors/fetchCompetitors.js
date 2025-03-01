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

        const query = "water bottle brand";
        console.error("Using Query:", query);

        // Perform Google Search using SerpAPI
        const searchResults = await search.invoke({ query });

        // 🛑 Log the full API response
        console.error("🛑 FULL SEARCH RESULTS:", JSON.stringify(searchResults, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify(searchResults, null, 2)  // ✅ Return full search response
        };
    } catch (error) {
        console.error("❌ Error fetching competitors:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export { handler };

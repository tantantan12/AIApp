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
        if (!event.body) {
            console.error("Error: event.body is undefined or empty");
            return { statusCode: 400, body: JSON.stringify({ error: "Request body is missing" }) };
        }

        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON format in request body" }) };
        }

        console.error("Parsed requestBody:", requestBody);
        const query = requestBody.query;
        
        if (!query) {
            return { statusCode: 400, body: JSON.stringify({ error: "Product name is required" }) };
        }

        // Search for competitors on Google
        const searchResults = await search.call(query + " competitors");
        const organicResults = searchResults.organic_results || [];
        
        // Extract relevant competitor names
        const competitorNames = organicResults.slice(0, 5).map(result => result.title || "Unknown Competitor");

        return {
            statusCode: 200,
            body: JSON.stringify({ competitors: competitorNames })
        };
    } catch (error) {
        console.error("Error fetching competitors:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

export { handler };

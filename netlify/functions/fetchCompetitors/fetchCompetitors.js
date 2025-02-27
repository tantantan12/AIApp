import { Configuration, OpenAIApi } from 'openai';
import { SerpAPI } from 'langchain/tools';
import dotenv from 'dotenv';

dotenv.config();

const serpApiKey = process.env.SERPAPI_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const search = new SerpAPI(serpApiKey, {
    engine: "google",
    hl: "en",
    gl: "us"
});

const handler = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const query = requestBody.query;
        
        if (!query) {
            return { statusCode: 400, body: JSON.stringify({ error: "Product name is required" }) };
        }

        // Search for competitors on Google
        const searchResults = await search.call(query + " competitors");
        const organicResults = searchResults.organic_results;
        
        if (!organicResults || organicResults.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ competitors: [] }) };
        }
        
        // Extract relevant competitor names
        const competitorNames = organicResults.slice(0, 5).map(result => result.title);

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

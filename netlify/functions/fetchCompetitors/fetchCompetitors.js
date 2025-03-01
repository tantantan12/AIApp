import { Configuration, OpenAIApi } from 'openai';
import { getJson } from "serpapi";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);
const SERPAPI_KEY = process.env.SERPAPI_KEY;

const handler = async (event) => {
    try {
        if (!event.body) {
            console.error("Error: event.body is undefined or empty");
            return { statusCode: 400, body: JSON.stringify({ error: "Request body is missing" }) };
        }

        const requestBody = JSON.parse(event.body);
        const { productName, productDesc, targetMarket } = requestBody;

        if (!productName || !productDesc || !targetMarket) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        console.error("Processing Product Search for:", productName, productDesc, targetMarket);

        // 🟢 Step 1: Generate a refined search query using OpenAI
        const refineSearch = await openai.createCompletion({
            model: 'gpt-3.5-turbo-instruct',
            prompt: `Refine this product search query for Google Shopping:\nProduct Name: ${productName}\nDescription: ${productDesc}\nTarget Market: ${targetMarket}`,
            presence_penalty: 0,
            frequency_penalty: 0.3,
            max_tokens: 50,
            temperature: 0
        });

        const refinedQuery = refineSearch.data.choices[0].text.trim();
        console.error("✅ Refined Search Query:", refinedQuery);

        // 🟢 Step 2: Perform Google Shopping Search
        const searchResults = await getJson({
            engine: "google_shopping",
            api_key: SERPAPI_KEY,
            q: refinedQuery
        });

        console.error("✅ Raw Search Results:", searchResults["shopping_results"]);

        // 🟢 Step 3: Format search results using OpenAI
        const formattedResponse = await openai.createCompletion({
            model: 'gpt-3.5-turbo-instruct',
            prompt: `Summarize these Google Shopping search results in an engaging way:\n${JSON.stringify(searchResults["shopping_results"])}\nLimit it to the top 3 options.`,
            presence_penalty: 0,
            frequency_penalty: 0.3,
            max_tokens: 200,
            temperature: 0
        });

        console.error("✅ Reformatted Response:", formattedResponse.data.choices[0].text);

        return {
            statusCode: 200,
            body: JSON.stringify({
                results: formattedResponse.data.choices[0].text
            })
        };
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return { statusCode: 500, body: error.toString() };
    }
};

module.exports = { handler };

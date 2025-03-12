const { Configuration, OpenAIApi } = require("openai");
const { getJson } = require("serpapi");
const { traceable } = require("langsmith"); // Import correct LangSmith function
require("dotenv").config();

const openai = new OpenAIApi(
    new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
);

const SERPAPI_KEY = process.env.SERP_API_KEY;

// Function to truncate text for token limits
function truncateText(text, maxLength = 200) {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// 🚀 Wrapping the OpenAI calls with LangSmith tracing
const generateRefinedSearchQuery = traceable(async (productName, productDesc, targetMarket) => {
    const response = await openai.createCompletion({
        model: "gpt-3.5-turbo-instruct",
        prompt: `Refine this product search query for Google Shopping:\nProduct Name: ${productName}\nDescription: ${productDesc}\nTarget Market: ${targetMarket}`,
        presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 50,
        temperature: 0
    });

    return response.data.choices[0].text.trim();
});

const formatSearchResults = traceable(async (topResults) => {
    const response = await openai.createCompletion({
        model: "gpt-3.5-turbo-instruct",
        prompt: `Summarize these Google Shopping search results by listing the title of the top three products in bullet points:\n${JSON.stringify(topResults)}\nLimit it to the top 3 options.`,
        presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 200,
        temperature: 0
    });

    return response.data.choices[0].text;
});

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

        // Step 1: Generate a refined search query
        const refinedQuery = await generateRefinedSearchQuery(productName, productDesc, targetMarket);

        console.error("Refined Search Query:", refinedQuery);

        // Step 2: Perform Google Shopping Search
        const searchResults = await getJson({
            engine: "google_shopping",
            api_key: SERPAPI_KEY,
            q: refinedQuery
        });

        console.error("Raw Search Results:", searchResults["shopping_results"]);

        // Limit results to prevent exceeding OpenAI's token limit
        const topResults = searchResults["shopping_results"]?.slice(0, 5).map(item => ({
            title: item.title,
            price: item.price,
            description: truncateText(item.description || "", 200) // Truncate descriptions
        })) || [];

        // Step 3: Format search results
        const formattedResponse = await formatSearchResults(topResults);

        console.error("Reformatted Response:", formattedResponse);

        return {
            statusCode: 200,
            body: JSON.stringify({
                results: formattedResponse
            })
        };
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
    }
};

module.exports = { handler };

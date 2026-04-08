import OpenAI from "openai";
import { getJson } from "serpapi";
import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";

const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
);

const SERPAPI_KEY = process.env.SERP_API_KEY;

function truncateText(text, maxLength = 200) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

const handler = traceable(
  async (event) => {
    try {
      if (!event.body) {
        console.error("Error: event.body is undefined or empty");
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Request body is missing" })
        };
      }

      const requestBody = JSON.parse(event.body);
      const { productName, productDesc, targetMarket } = requestBody;

      if (!productName || !productDesc || !targetMarket) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing required fields" })
        };
      }

      console.log("Processing Product Search for:", productName, productDesc, targetMarket);

      // Step 1: Refine search query
      const refineSearch = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt: `Refine this product search query for Google Shopping:\nProduct Name: ${productName}\nDescription: ${productDesc}\nTarget Market: ${targetMarket}`,
        presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 50,
        temperature: 0
      });

      const refinedQuery = refineSearch.choices[0].text.trim();
      console.log("Refined Search Query:", refinedQuery);

      // Step 2: Search Google Shopping
      const searchResults = await getJson({
        engine: "google_shopping",
        api_key: SERPAPI_KEY,
        q: refinedQuery
      });

      const shoppingResults = searchResults["shopping_results"];
      if (!shoppingResults || shoppingResults.length === 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            results: "<p>No competitors found. Try refining your product description.</p>"
          })
        };
      }

      console.log("Raw Search Results:", shoppingResults);

      const topResults = shoppingResults.slice(0, 5).map((item) => ({
        title: item.title,
        price: item.price,
        description: truncateText(item.description || "", 200),
        link: item.product_link
      }));

      // Step 3: Build HTML output directly from topResults (top 3)
      const top3 = topResults.slice(0, 3);
      const htmlResults = `<ul>${top3
        .map(
          (item) =>
            `<li><strong>${item.title}</strong> — ${item.price}${
              item.link
                ? ` <a href="${item.link}" target="_blank" rel="noopener noreferrer">View Product</a>`
                : ""
            }</li>`
        )
        .join("")}</ul>`;

      console.log("HTML Response:", htmlResults);

      return {
        statusCode: 200,
        body: JSON.stringify({
          results: htmlResults
        })
      };
    } catch (error) {
      console.error("Fetch Competitors Function Error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.toString() })
      };
    }
  },
  {
    name: "generateCompetitors",
    project_name: process.env.LANGSMITH_PROJECT
  }
);

export { handler };
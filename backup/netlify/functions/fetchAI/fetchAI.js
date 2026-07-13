import OpenAI from "openai";
import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";

const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
);

const handler = traceable(async (event) => {

    try {
        const requestBody = JSON.parse(event.body);
        const { productName, productDesc, targetMarket } = requestBody;

        if (!productName || !productDesc || !targetMarket) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        const input = `Use a product name, a product description and a target market to create advertising copy for a product.

product name: ${productName}
product description: ${productDesc}
product target market: ${targetMarket}
advertising copy:
`;

        const response = await openai.completions.create({
            model: 'gpt-3.5-turbo-instruct',
            prompt: input,
            max_tokens: 100,
            temperature: 0,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                reply: response
            })
        };

    } catch (error) {
        return { statusCode: 500, body: error.toString() }
    }

}, {
    name: "generateAdCopy",
    project_name: process.env.LANGSMITH_PROJECT
});

module.exports = { handler };

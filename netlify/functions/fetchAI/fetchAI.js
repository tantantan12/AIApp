const { OpenAI } = require("openai");
const { traceable } = require("langsmith"); // Corrected import
require("dotenv").config();

// Initialize OpenAI without wrapOpenAI (which does not exist in JS)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Define a traceable function for API calls
const pipeline = traceable(async (prompt) => {
    const response = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt: prompt,
        presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 100,
        temperature: 0,
    });

    return response.choices[0].text.trim();
});

const handler = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { productName, productDesc, targetMarket } = requestBody;

        if (!productName || !productDesc || !targetMarket) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        const prompt = `Use a product name, a product description, and a target market to create advertising copy for a product.
            ###
            product name: EcoPure Hydration Bottle
            product description: A sustainable, vacuum-insulated water bottle that keeps drinks cold for 48 hours and hot for 24 hours. 
            product target market: environmentally conscious consumers
            advertising copy: "Stay refreshed and make a difference with the EcoPure Hydration Bottle – the last water bottle you'll ever need. Embrace the power of sustainability with our innovative design, crafted for the eco-warrior in all of us. Whether you're climbing mountains or navigating the urban jungle, keep your drinks ice-cold or steaming hot, all day long. Join the EcoPure movement and quench your thirst for change. #DrinkSustainably #EcoPureAdventure
            ###
            product name: ${productName}
            product description: ${productDesc}
            product target market: ${targetMarket}
            advertising copy: 
        `;

        const reply = await pipeline(prompt); // Now tracing is enabled

        return {
            statusCode: 200,
            body: JSON.stringify({ reply }),
        };
    } catch (error) {
        return { statusCode: 500, body: error.toString() };
    }
};

module.exports = { handler };

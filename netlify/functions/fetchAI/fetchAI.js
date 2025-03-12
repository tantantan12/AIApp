import { traceable } from "@langchain/langsmith";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Wrapping the function with `traceable` to enable LangSmith tracing
const generateAdCopy = traceable(async (productName, productDesc, targetMarket) => {
    const prompt = `Use a product name, a product description and a target market to create advertising copy for a product.
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

    const response = await openai.completions.create({
        model: "gpt-3.5-turbo-instruct",
        prompt: prompt,
        presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 100,
        temperature: 0,
    });

    return response.choices[0].text.trim();
}, { name: "generateAdCopy",
    project: process.env.LANGSMITH_PROJECT_PROMOTION
 }); // LangSmith traces this function

const handler = async (event) => {
    try { 
        const requestBody = JSON.parse(event.body);
        const { productName, productDesc, targetMarket } = requestBody;

        if (!productName || !productDesc || !targetMarket) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        console.error("Generating advertising copy for:", productName, productDesc, targetMarket);

        // Traced function call
        const reply = await generateAdCopy(productName, productDesc, targetMarket);

        return {
            statusCode: 200,
            body: JSON.stringify({ reply })
        };
        
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
    }
}

export { handler };

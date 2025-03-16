import OpenAI from "openai";
import { traceable } from "langsmith/traceable";
 

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
 
  
const handler = traceable(async (event) => {
    
    try { 
        const requestBody = JSON.parse(event.body);
        const { positiveCharacter, negativeCharacter, scene,plot} = requestBody;

        if (!positiveCharacter || !negativeCharacter || !scene|| !plot) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        const input = `Use a positive character, a negative character, a scene, and a plot to make a fun story.
            positive character: ${positiveCharacter}
            negative character: ${negativeCharacter}
            scene: ${scene}
            plot: ${plot}
            Story: 
            `;

        const response = await openai.completions.create({
            model: 'gpt-3.5-turbo-instruct',
            prompt: input,
            presence_penalty: 0,
            frequency_penalty: 0.3,
            max_tokens: 400,
            temperature: 0,
        })
        return {
            statusCode: 200,
            body: JSON.stringify({
                reply: response    //reply: response.choices[0].text.trim()  
            })
        }
        
    } catch (error) {
        return { statusCode: 500, body: error.toString() }
    }
}, { name: "generateAdCopy",
    project: process.env.LANGSMITH_PROJECT
 });

module.exports = { handler }

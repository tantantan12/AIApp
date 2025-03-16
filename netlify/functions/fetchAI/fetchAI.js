import OpenAI from "openai";
import { traceable } from "langsmith/traceable";
 

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
 
  
const handler = traceable(async (event) => {
    
    try { 
        const requestBody = JSON.parse(event.body);
        const { characterName1,characterName2, sceneDesc, conflict } = requestBody;



        const input = `Use a positive character, a negative character, a scene, and a conflict to come up with a short story.
           
            positive character: ${characterName1}
            negative character: ${characterName2}
            scene description: ${sceneDesc}
            conflict: ${conflict}
            story: 
            `;

        const response = await openai.completions.create({
            model: 'gpt-3.5-turbo-instruct',
            prompt: input,
            presence_penalty: 0,
            frequency_penalty: 0.3,
            max_tokens: 500,
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

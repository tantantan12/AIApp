import { Configuration, OpenAIApi } from 'openai'

const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });


const handler = async (event) => {
    
    try {
        const response = await openai.createCompletion({
            model: 'gpt-3.5-turbo-instruct',
            prompt: event.body,
        presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 100,
        temperature: 0,
        })
        return {
            statusCode: 200,
            body: JSON.stringify({
                reply: response.data                

            })
        }
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return { statusCode: 500, body: error.toString() }
    }
}

module.exports = { handler }

const { Configuration, OpenAIApi } = require('openai');

const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const handler = async (event) => {
    
    try {
        const response = await openai.completions.create({
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
        return { statusCode: 500, body: error.toString() }
    }
}

module.exports = { handler }
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

const handler = async (event) => {
    console.info(event.body);
    try {
        const response = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: event.body,
            max_tokens: 100,
            presence_penalty: 0.3,
            frequency_penalty: 0,
            temperature: 0,
            stop: ['\n', '->']
        })
        return {
            statusCode: 200,
            body: JSON.stringify({
                reply: response.data                
/*
Challenge:
    1. Add a key value pair. The key should be 'reply' 
       and the value should be response.data.
    2. Paste the code into fetchAI.js in VS Code and push it 
       to GitHub to redeploy and see what gets logged out. 
*/
            })
        }
    } catch (error) {
        return { statusCode: 500, body: error.toString() }
    }
}

module.exports = { handler }

import { OpenAI } from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const handler = async (event) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{role: "system",content: "you are a marketing specialist."},{role: "user", content:event.body}] ,
        presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 100,
        temperature: 0,
        })
   //     console.log(completion.choices[0]);
        return {
            statusCode: 200,
            body:response.choices[0]  //response.data.choices[0].message.content.trim() //JSON.stringify({reply: response.data})
        }
    } catch (error) {
        return { statusCode: 500, body: error.toString() }
    }
}

module.exports = { handler }

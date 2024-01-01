/*    
You can edit your prompt here.
*/  
    /*
import { Configuration, OpenAIApi } from "openai";
import { process } from './env';

let prompt = ''

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
*/
document.getElementById("again-btn").addEventListener("click", () => {
  location.reload();
})

document.getElementById("submit-btn").addEventListener("click", () => {

  const productName = document.getElementById("name").value;
  const productDesc = document.getElementById("desc").value;
  const productTarget = document.getElementById("target").value;
  prompt += `Use a product name, a product description and a target market to create advertising copy for a product.
  ###
  product name: Flask Tie
  product description: A tie with a pouch to hold liquids and a straw to drink through
  product traget market: office workers
  advertising copy: Are you tired of having to worry about how much to drink throughout the day? With the Flask Tie, you can stay hydrated on-the-go! Our unique tie features a pouch that enables you to securely hold and sip your favorite drinks with the built-in straw! The water cooler is history! Long live Flask Tie!
  ###
  product name: ${productName}
  product description: ${productDesc}
  product traget market: ${productTarget}
  advertising copy: 
  `

  fetchReply()
//  getCopySuggestion(productName, productDesc, productTarget);
})


async function fetchReply(){
  const url = 'https://lambent-sunflower-9cb580.netlify.app/.netlify/functions/fetchAI'
  
  const response = await fetch(url, {
      method: 'POST',
      headers: {
          'content-type': 'text/plain',
      },
      body: prompt
  })
  const data = await response.json()

 prompt+=` ${data.reply.choices[0].text} ->`
 document.getElementById('ad-output').insertAdjacentText('beforeend', data.reply.choices[0].text.trim())
 document.getElementById('ad-input').style.display = 'none'
 document.getElementById('ad-output').style.display = 'block'
  console.log(data)}


 // conversationStr+=` ${data.reply.choices[0].text} ->`
 // renderTypewriterText(data.reply.choices[0].text)
 // console.log(data)


async function getCopySuggestion(productName, productDesc, productTarget) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    

    
    prompt: `Use a product name, a product description and a target market to create advertising copy for a product.
    ###
    product name: Flask Tie
    product description: A tie with a pouch to hold liquids and a straw to drink through
    product traget market: office workers
    advertising copy: Are you tired of having to worry about how much to drink throughout the day? With the Flask Tie, you can stay hydrated on-the-go! Our unique tie features a pouch that enables you to securely hold and sip your favorite drinks with the built-in straw! The water cooler is history! Long live Flask Tie!
    ###
    product name: ${productName}
    product description: ${productDesc}
    product traget market: ${productTarget}
    advertising copy: 
    `,
    presence_penalty: 0,
        frequency_penalty: 0.3,
        max_tokens: 100,
        temperature: 0,
  });
  document.getElementById('ad-output').insertAdjacentText('beforeend', response.data.choices[0].text.trim())
  document.getElementById('ad-input').style.display = 'none'
  document.getElementById('ad-output').style.display = 'block'
  console.log(response)
}
/*    
You can edit your prompt here.
*/  
    
//import { Configuration, OpenAIApi } from "openai";
//import { process } from './env';

//const configuration = new Configuration({
//  apiKey: process.env.OPENAI_API_KEY,
//});

//const openai = new OpenAIApi(configuration);

document.getElementById("again-btn").addEventListener("click", () => {
  location.reload();
})

document.getElementById("submit-btn").addEventListener("click", () => {
  const productName = document.getElementById("name").value;
  const productDesc = document.getElementById("desc").value;
  const productTarget = document.getElementById("target").value;
  getCopySuggestion(productName, productDesc, productTarget);
})



async function fetchReply(){
  const url = 'https://lambent-sunflower-9cb580.netlify.app/.netlify/functions/fetchAI'
  
  const response = await fetch(url, {
      method: 'POST',
      headers: {
          'content-type': 'text/plain',
      },
      body: conversationStr
  })
  const data = await response.json()
  console.log(data)
/*
Challenge:
1. Make a fetch request to the url using the 
   following details. 
   - The method should be 'POST'
   - In the headers, the 'content-type' should 
     be 'text/plain'
   - The body should hold conversationStr
2. Save the response to a const and log it out. 
3. Copy and paste the updated fetchReply function 
   to VS Code and delete any unnecessary code from 
   index.js
4. Push the changes to GitHub to trigger a
   redeploy.
5. Navigate to your Netlify site, hit send 
   and see what you get in the console. (You 
   should see "Hello World" in an object).
*/
  // conversationStr += ` ${response.data.choices[0].text} \n`
  // renderTypewriterText(response.data.choices[0].text)
}



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
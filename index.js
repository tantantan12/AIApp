let prompt = "";  // Add this at the top of index.js

document.getElementById("again-btn").addEventListener("click", () => {
  location.reload();
    gtag('event', 'again', {
    'Experiment_Condition': '{{ getenv "BRANCH" }}'
      });
  
})

document.getElementById("submit-btn").addEventListener("click", () => {

  const productName = document.getElementById("name").value;
  const productDesc = document.getElementById("desc").value;
  const productTarget = document.getElementById("target").value;
  prompt += `Use a product name, a product description and a target market to create advertising copy for a product.
  ###
  product name: EcoPure Hydration Bottle
  product description: A sustainable, vacuum-insulated water bottle that keeps drinks cold for 48 hours and hot for 24 hours. 
  product target market: environmentally conscious consumers
  advertising copy: "Stay refreshed and make a difference with the EcoPure Hydration Bottle – the last water bottle you'll ever need. Embrace the power of sustainability with our innovative design, crafted for the eco-warrior in all of us. Whether you're climbing mountains or navigating the urban jungle, keep your drinks ice-cold or steaming hot, all day long. Join the EcoPure movement and quench your thirst for change. #DrinkSustainably #EcoPureAdventure
  ###
  product name: ${productName}
  product description: ${productDesc}
  product traget market: ${productTarget}
  advertising copy: 
  `;
  gtag('event', 'submit', {
    'Experiment_Condition':  '{{ getenv "BRANCH" }}'
  });
  fetchReply();

})


async function fetchReply(){
  const url = 'https://itom6219.netlify.app/.netlify/functions/fetchAI';

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'text/plain' },
          body: prompt
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
 
      console.info("API Response:", data); // Log API response

      if (!data.reply) {
          throw new Error("Invalid response format");
      }

      prompt += ` ${data.reply} ->`;
      document.getElementById('ad-output').insertAdjacentText('beforeend', data.choices[0].text.trim());
      document.getElementById('ad-input').style.display = 'none';
      document.getElementById('ad-output').style.display = 'block';
  } catch (error) {
      console.error("Fetch API Error:", error); // Log fetch errors
      alert("An error occurred while fetching the response. Check the console for details.");
  }
}

let prompt = "";  // Add this at the top of index.js

document.getElementById("again-btn").addEventListener("click", () => {
  location.reload();
    gtag('event', 'again', {
    'Experiment_Condition': '{{ getenv "BRANCH" }}'
      });
  
})

document.getElementById("advertising-btn").addEventListener("click", async() => {

  const positiveCharacter = document.getElementById("name1").value;
  const negativeCharacter = document.getElementById("name2").value;
  const scene = document.getElementById("desc").value;
  const plot = document.getElementById("target").value;
  
  try {
    const response = await fetchReply(positiveCharacter, negativeCharacter, scene,plot);
    // Insert the formatted list into ad-output
    document.getElementById('ad-output').insertAdjacentText('beforeend', response);
    document.getElementById('ad-input').style.display = 'none';
    document.getElementById('ad-output').style.display = 'block';
    console.log("FULL PRODUCT RESPONSE:", response);
} catch (error) {
    console.error("Error Fetching Products:", error);
    alert("An error occurred while searching for products.");
}
})



async function fetchReply(positiveCharacter, negativeCharacter, scene,plot){
  const url = 'https://mystory--itom6219.netlify.app/.netlify/functions/fetchAI';

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ productName, productDesc, targetMarket })
      });

      const data = await response.json();
      console.info("API Response:", data); // Log API response
      const cleanText = data.reply.choices[0].text.trim();
      return cleanText;
 
      
  } catch (error) {
      console.error("Fetch API Error:", error); // Log fetch errors
      alert("An error occurred while fetching the response. Check the console for details.");
  }
}



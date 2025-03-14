let prompt = "";  // Add this at the top of index.js

document.getElementById("again-btn").addEventListener("click", () => {
  location.reload();
    gtag('event', 'again', {
    'Experiment_Condition': '{{ getenv "BRANCH" }}'
      });
  
})

document.getElementById("advertising-btn").addEventListener("click", async() => {

  const productName = document.getElementById("name").value;
  const productDesc = document.getElementById("desc").value;
  const productTarget = document.getElementById("target").value;
  
  try {
    const response = await fetchReply(productName, productDesc, productTarget);
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



async function fetchReply(productName, productDesc, targetMarket){
  const url = 'https://janetan25evening--itom6219.netlify.app/.netlify/functions/fetchAI';

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


document.getElementById("competitor-btn").addEventListener("click", async () => {
  const productName = document.getElementById("name").value;
  const productDesc = document.getElementById("desc").value;
  const targetMarket = document.getElementById("target").value;

  if (!productName || !productDesc || !targetMarket) {
      alert("Please fill in all fields.");
      return;
  }

  //document.getElementById("product-results").innerHTML = "Searching...";

  try {
      const response = await fetchCompetitors(productName, productDesc, targetMarket);
      // Insert the formatted list into ad-output
      document.getElementById('ad-output').insertAdjacentHTML('beforeend', `<ul>${response}</ul>`);
      document.getElementById('ad-input').style.display = 'none';
      document.getElementById('ad-output').style.display = 'block';
      console.log("FULL PRODUCT RESPONSE:", response);
  } catch (error) {
      console.error("Error Fetching Products:", error);
      alert("An error occurred while searching for products.");
  }
});





async function fetchCompetitors(productName, productDesc, targetMarket ) {
  const url = 'https://janetan25evening--itom6219.netlify.app/.netlify/functions/fetchCompetitors';

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName, productDesc, targetMarket })
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      // Extract and format bullet points
      const formattedText = data.results.split("\n").filter(item => item.trim() !== "").map(item => `<li>${item.trim()}</li>`).join(""); // Join into a single string
      return formattedText;
  } catch (error) {
      console.error("Fetch Products Error:", error);
      throw error;
  }
}

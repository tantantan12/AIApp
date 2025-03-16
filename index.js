let prompt = "";  // Add this at the top of index.js

document.getElementById("again-btn").addEventListener("click", () => {
  location.reload();
    gtag('event', 'again', {
    'Experiment_Condition': '{{ getenv "BRANCH" }}'
      });
  
})

document.getElementById("advertising-btn").addEventListener("click", async() => {
  const characterName1 = document.getElementById("name1").value;
  const characterName2 = document.getElementById("name2").value;
  const sceneDesc = document.getElementById("desc").value;
  const conflict = document.getElementById("target").value;
  
  try {
    const response = await fetchReply(characterName1,characterName2, sceneDesc, conflict);
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



async function fetchReply(characterName1,characterName2, sceneDesc, conflict){
  const url = 'https://story--itom6219.netlify.app/.netlify/functions/fetchAI';

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ characterName1,characterName2, sceneDesc, conflict})
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
 

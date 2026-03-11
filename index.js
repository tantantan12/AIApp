const EXPERIMENT_CONDITION = "AI_tracing";
let lastLangsmithRunId = null;

document.getElementById("again-btn").addEventListener("click", () => {
  location.reload();
  gtag('event', 'again', {
    'Experiment_Condition': EXPERIMENT_CONDITION
  });
});

document.getElementById("advertising-btn").addEventListener("click", async () => {
  const productName = document.getElementById("name").value;
  const productDesc = document.getElementById("desc").value;
  const productTarget = document.getElementById("target").value;

  gtag('event', 'submit', {
    'productName': productName,
    'Experiment_Condition': EXPERIMENT_CONDITION
  });

  try {
    const response = await fetchReply(productName, productDesc, productTarget);

    // save LangSmith run id for later thumbs feedback
    lastLangsmithRunId = response.runId || null;

    // Insert the formatted list into ad-output
    document.getElementById('ad-output').insertAdjacentText('beforeend', response.text);

    // Show thumbs up/down buttons
    document.getElementById("ad-output").insertAdjacentHTML('beforeend', `
      <div id="feedback-container" class="rating">
        <p>Was this result helpful?</p>
        <div class="like" id="thumbs-up"><span>👍</span></div>
        <div class="dislike" id="thumbs-down"><span>👎</span></div>
      </div>
    `);

    // Add event listeners
    document.getElementById("thumbs-up").addEventListener("click", async () => {
      document.getElementById("thumbs-up").classList.add("active");
      document.getElementById("thumbs-down").classList.remove("active");

      gtag('event', 'feedback', {
        'satisfied': 1,
        'Experiment_Condition': EXPERIMENT_CONDITION
      });

      await sendLangsmithFeedback(1);
      disableFeedback();
    });

    document.getElementById("thumbs-down").addEventListener("click", async () => {
      document.getElementById("thumbs-down").classList.add("active");
      document.getElementById("thumbs-up").classList.remove("active");

      gtag('event', 'feedback', {
        'satisfied': 0,
        'Experiment_Condition': EXPERIMENT_CONDITION
      });

      await sendLangsmithFeedback(0);
      disableFeedback();
    });

    function disableFeedback() {
      document.getElementById("thumbs-up").style.pointerEvents = "none";
      document.getElementById("thumbs-down").style.pointerEvents = "none";
    }

    document.getElementById('ad-input').style.display = 'none';
    document.getElementById('ad-output').style.display = 'block';
    console.log("FULL PRODUCT RESPONSE:", response);
  } catch (error) {
    console.error("Error Fetching Products:", error);
    alert("An error occurred while searching for products.");
  }
});

async function fetchReply(productName, productDesc, targetMarket) {
  const url = 'https://AI_tracing--itom6219.netlify.app/.netlify/functions/fetchAI';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productName,
        productDesc,
        targetMarket,
        branch: EXPERIMENT_CONDITION
      })
    });

    const data = await response.json();
    console.info("API Response:", data);

    return {
      text: data.outputText || data.reply?.choices?.[0]?.text?.trim() || "",
      runId: data.runId || null
    };
  } catch (error) {
    console.error("Fetch API Error:", error);
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

  try {
    const response = await fetchCompetitors(productName, productDesc, targetMarket);

    // save LangSmith run id for later thumbs feedback
    lastLangsmithRunId = response.runId || null;

    // Insert the formatted list into ad-output
    document.getElementById('ad-output').insertAdjacentHTML('beforeend', `<ul>${response.html}</ul>`);

    // Show thumbs up/down buttons
    document.getElementById("ad-output").insertAdjacentHTML('beforeend', `
      <div id="feedback-container" class="rating">
        <p>Was this result helpful?</p>
        <div class="like" id="thumbs-up"><span>👍</span></div>
        <div class="dislike" id="thumbs-down"><span>👎</span></div>
      </div>
    `);

    document.getElementById("thumbs-up").addEventListener("click", async () => {
      document.getElementById("thumbs-up").classList.add("active");
      document.getElementById("thumbs-down").classList.remove("active");

      gtag('event', 'feedback', {
        'satisfied': 1,
        'Experiment_Condition': EXPERIMENT_CONDITION
      });

      await sendLangsmithFeedback(1);
      disableFeedback();
    });

    document.getElementById("thumbs-down").addEventListener("click", async () => {
      document.getElementById("thumbs-down").classList.add("active");
      document.getElementById("thumbs-up").classList.remove("active");

      gtag('event', 'feedback', {
        'satisfied': 0,
        'Experiment_Condition': EXPERIMENT_CONDITION
      });

      await sendLangsmithFeedback(0);
      disableFeedback();
    });

    function disableFeedback() {
      document.getElementById("thumbs-up").style.pointerEvents = "none";
      document.getElementById("thumbs-down").style.pointerEvents = "none";
    }

    document.getElementById('ad-input').style.display = 'none';
    document.getElementById('ad-output').style.display = 'block';
    console.log("FULL PRODUCT RESPONSE:", response);
  } catch (error) {
    console.error("Error Fetching Products:", error);
    alert("An error occurred while searching for products.");
  }
});

async function fetchCompetitors(productName, productDesc, targetMarket) {
  const url = 'https://AI_tracing--itom6219.netlify.app/.netlify/functions/fetchCompetitors';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName,
        productDesc,
        targetMarket,
        branch: EXPERIMENT_CONDITION
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    const formattedText = (data.results || "")
      .split("\n")
      .filter(item => item.trim() !== "")
      .map(item => `<li>${item.trim()}</li>`)
      .join("");

    return {
      html: formattedText,
      runId: data.runId || null
    };
  } catch (error) {
    console.error("Fetch Products Error:", error);
    throw error;
  }
}

async function sendLangsmithFeedback(score) {
  if (!lastLangsmithRunId) {
    console.warn("No LangSmith run ID available for feedback.");
    return;
  }

  try {
    const response = await fetch('https://AI_tracing--itom6219.netlify.app/.netlify/functions/logFeedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId: lastLangsmithRunId,
        score,
        branch: EXPERIMENT_CONDITION
      })
    });

    const data = await response.json();
    console.log("LangSmith feedback saved:", data);
  } catch (error) {
    console.error("Error sending LangSmith feedback:", error);
  }
}

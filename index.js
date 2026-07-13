/* ============================================================
   TAB 1: BASIC AI APP (Day 1) -- unchanged logic, relative URLs
   ============================================================ */

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

  gtag('event', 'submit', {
      'productName': productName
   });

  try {
    const response = await fetchReply(productName, productDesc, productTarget);
    // Insert the formatted list into ad-output
    document.getElementById('ad-output').insertAdjacentText('beforeend', response);

    // Remember the last generated copy + product info so Tab 4's
    // "SEO/GEO Improve" button (Day 4) has something real to compare against.
    window.__lastBasicCopy = response;
    window.__lastProductInfo = { productName, productDesc, productTarget };

    document.getElementById('ad-input').style.display = 'none';
    document.getElementById('ad-output').style.display = 'block';
    console.log("FULL PRODUCT RESPONSE:", response);
} catch (error) {
    console.error("Error Fetching Products:", error);
    alert("An error occurred while searching for products.");
}
})



async function fetchReply(productName, productDesc, targetMarket){
  const url = '/.netlify/functions/fetchAI';

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
  const url = '/.netlify/functions/fetchCompetitors';

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


/* ============================================================
   TAB SWITCHING
   ============================================================ */

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");

    gtag('event', 'tab_switch', { 'tab': btn.dataset.tab });
  });
});


/* ============================================================
   TAB 2: AGENT WORKFLOWS (Day 2) -- prompt chaining, routing,
   parallelization, and a plain baseline, compared side by side.
   ============================================================ */

// Splits model output into paragraphs, grouping consecutive bullet/numbered
// lines into a <ul> so multi-part answers (e.g. the routing agent's tool
// result + explanation) read as more than one run-on blob.
function formatOutput(text) {
  if (!text) return "";
  const inlineFormat = (s) => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let html = "";
  let inList = false;
  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
  for (const line of lines) {
    const headerMatch = line.match(/^#{1,6}\s+(.*)/);
    const bulletMatch = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)/);
    if (headerMatch) {
      closeList();
      html += `<p><strong>${inlineFormat(headerMatch[1])}</strong></p>`;
    } else if (bulletMatch) {
      if (!inList) { html += '<ul class="output-list">'; inList = true; }
      html += `<li>${inlineFormat(bulletMatch[1])}</li>`;
    } else {
      closeList();
      html += `<p>${inlineFormat(line)}</p>`;
    }
  }
  closeList();
  return html;
}

document.getElementById("workflow-again-btn").addEventListener("click", () => {
  document.getElementById("workflow-input").style.display = "flex";
  document.getElementById("workflow-output").style.display = "none";
  document.getElementById("workflow-output").querySelectorAll(".result-card").forEach(el => el.remove());
});

document.getElementById("workflow-btn").addEventListener("click", async () => {
  const productName = document.getElementById("workflow-name").value;
  const productDesc = document.getElementById("workflow-desc").value;
  const targetMarket = document.getElementById("workflow-target").value;
  const pattern = document.getElementById("workflow-pattern").value;

  if (!productName || !productDesc || !targetMarket) {
    alert("Please fill in all fields.");
    return;
  }

  gtag('event', 'workflow_run', { 'pattern': pattern });

  const outputEl = document.getElementById("workflow-output");
  const card = document.createElement("div");
  card.className = "result-card";
  card.innerHTML = `<h4>Running "${pattern}"...</h4>`;
  outputEl.insertAdjacentElement("afterbegin", card);

  try {
    const response = await fetch('/.netlify/functions/fetchWorkflow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName, productDesc, targetMarket, pattern }),
    });
    const data = await response.json();

    card.innerHTML = `
      <h4>${data.pattern}<span class="latency-badge">${data.latencyMs} ms</span></h4>
      ${formatOutput(data.output)}
      <ul class="call-log">${(data.steps || []).map(s => `<li>${s}</li>`).join("")}</ul>
    `;
  } catch (error) {
    console.error("Workflow Error:", error);
    card.innerHTML = `<h4>Error</h4><p>Something went wrong -- check the console.</p>`;
  }

  document.getElementById('workflow-input').style.display = 'none';
  document.getElementById('workflow-output').style.display = 'block';
});


/* ============================================================
   TAB 3: MULTI-AGENT TEAM (Day 3) -- manager, researcher, three
   copywriters, a hallucination check, and a persona panel.
   ============================================================ */

document.getElementById("team-again-btn").addEventListener("click", () => {
  document.getElementById("team-input").style.display = "flex";
  document.getElementById("team-output").style.display = "none";
  document.getElementById("team-output").querySelectorAll(".result-card").forEach(el => el.remove());
});

document.getElementById("team-btn").addEventListener("click", async () => {
  const productName = document.getElementById("team-name").value;
  const productDesc = document.getElementById("team-desc").value;
  const targetMarket = document.getElementById("team-target").value;

  if (!productName || !productDesc || !targetMarket) {
    alert("Please fill in all fields.");
    return;
  }

  gtag('event', 'team_run', { 'productName': productName });

  const outputEl = document.getElementById("team-output");
  const loadingCard = document.createElement("div");
  loadingCard.className = "result-card";
  loadingCard.innerHTML = `<h4>Manager is delegating to the team...</h4>`;
  outputEl.insertAdjacentElement("afterbegin", loadingCard);

  try {
    const response = await fetch('/.netlify/functions/fetchAgentTeam', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productName, productDesc, targetMarket }),
    });
    const data = await response.json();

    loadingCard.className = "result-card winner";
    loadingCard.innerHTML = `
      <h4>Winner: ${data.winner.angle}<span class="latency-badge">${data.winner.avgScore.toFixed(1)}/10</span></h4>
      <p>${data.winner.draft}</p>
    `;

    (data.drafts || []).filter(d => d.angle !== data.winner.angle).forEach(d => {
      const card = document.createElement("div");
      card.className = "result-card";
      card.innerHTML = `
        <h4>${d.angle}<span class="latency-badge">${d.avgScore.toFixed(1)}/10</span></h4>
        <p>${d.draft}</p>
      `;
      outputEl.insertBefore(card, document.getElementById("team-again-btn"));
    });

    const logCard = document.createElement("div");
    logCard.className = "result-card";
    logCard.innerHTML = `
      <h4>Call log</h4>
      <ul class="call-log">${(data.callLog || []).map(c => `<li>${c.source} -> ${c.target}</li>`).join("")}</ul>
    `;
    outputEl.insertBefore(logCard, document.getElementById("team-again-btn"));
  } catch (error) {
    console.error("Team Error:", error);
    loadingCard.innerHTML = `<h4>Error</h4><p>Something went wrong -- check the console.</p>`;
  }

  document.getElementById('team-input').style.display = 'none';
  document.getElementById('team-output').style.display = 'block';
});


/* ============================================================
   SEO/GEO IMPROVE (Day 4) -- compares the current ad copy and
   page metadata against a version rewritten with Day 4's
   SEO/GEO principles.
   ============================================================ */

document.getElementById("geo-improve-btn").addEventListener("click", async () => {
  gtag('event', 'geo_improve_open');

  const productInfo = window.__lastProductInfo || {
    productName: document.getElementById("name").value || "EcoPure Hydration Bottle",
    productDesc: document.getElementById("desc").value || "Vacuum-insulated, keeps drinks cold 24 hours",
    productTarget: document.getElementById("target").value || "college students",
  };
  const currentCopy = window.__lastBasicCopy || "";

  document.getElementById("geo-current-title").textContent = document.title;
  document.getElementById("geo-current-meta").textContent =
    document.querySelector('meta[name="description"]')?.content || "(none set)";
  document.getElementById("geo-current-copy").textContent =
    currentCopy || "(Generate copy in the Basic AI App tab first, or we'll draft a fresh one to compare.)";

  document.getElementById("geo-modal").classList.remove("hidden");

  try {
    const response = await fetch('/.netlify/functions/fetchGEO', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productName: productInfo.productName,
        productDesc: productInfo.productDesc,
        targetMarket: productInfo.productTarget,
        currentCopy,
      }),
    });
    const data = await response.json();

    document.getElementById("geo-enhanced-title").textContent = data.enhancedTitle;
    document.getElementById("geo-enhanced-meta").textContent = data.enhancedMeta;
    document.getElementById("geo-enhanced-copy").textContent = data.enhancedCopy;
    document.getElementById("geo-rationale").textContent = data.rationale;
    if (!currentCopy) {
      document.getElementById("geo-current-copy").textContent = data.currentCopy;
    }
  } catch (error) {
    console.error("GEO Improve Error:", error);
    document.getElementById("geo-rationale").textContent = "Something went wrong -- check the console.";
  }
});

document.getElementById("geo-modal-close").addEventListener("click", () => {
  document.getElementById("geo-modal").classList.add("hidden");
});

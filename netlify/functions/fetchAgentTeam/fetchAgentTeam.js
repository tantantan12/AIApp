import OpenAI from "openai";
import { traceable } from "langsmith/traceable";

// Day 3 -- Multi-Agent Team: manager, researcher, three copywriters, a
// hallucination check, and a persona panel. Mirrors the Day 3 notebook,
// Sections 1.3-1.7. Every hand-off is logged to callLog so the frontend
// can render it (a live, tiny version of the call log analyzed with graph
// theory in Day 3 notebook Section 4).

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o-mini";
const ANGLES = ["value", "adventure", "sustainability"];

const PERSONAS = {
  persona_budget: "A budget-conscious college student who reads every ad skeptically.",
  persona_outdoor: "An outdoor-enthusiast professional who values durability and performance.",
  persona_sustainability: "A sustainability-focused parent who checks every environmental claim.",
};

async function chatJSON(prompt) {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0].message.content);
}

// ---- Researcher (Section 1.3.1) ----
async function researcher(productName, productDesc, targetMarket, callLog) {
  callLog.push({ source: "manager", target: "researcher" });
  const notes = await chatJSON(
    `Given competing products for ${productName} (${productDesc}, targeting ${targetMarket}), ` +
      `name 3 realistic competitors, summarize in one sentence what they do well (competitor_strengths), ` +
      `and in one sentence a positioning gap none of them cover (differentiation_gap). ` +
      `Respond as JSON with keys top_3 (array), competitor_strengths, differentiation_gap.`
  );
  callLog.push({ source: "researcher", target: "manager" });
  return notes;
}

// ---- Copywriter (Section 1.4) ----
async function copywriter(productName, productDesc, targetMarket, angle, notes, callLog) {
  callLog.push({ source: "manager", target: "copywriter" });
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content:
          `Write one line of advertising copy with a "${angle}" angle.\n` +
          `Product: ${productName}\nDescription: ${productDesc}\nTarget market: ${targetMarket}\n` +
          `Competitor strengths to learn from: ${notes.competitor_strengths}\n` +
          `Differentiation gap to lean into: ${notes.differentiation_gap}\n` +
          `Do not restate a competitor's angle with our brand name swapped in.`,
      },
    ],
  });
  return response.choices[0].message.content;
}

// ---- Hallucination check (Section 1.5) ----
async function hallucinationCheck(draft, productName, productDesc, targetMarket, callLog) {
  callLog.push({ source: "copywriter", target: "hallucination_check" });
  const check = await chatJSON(
    `Original facts -- Product: ${productName}. Description: ${productDesc}. Market: ${targetMarket}.\n` +
      `Draft: "${draft}"\n` +
      `List every factual claim in the draft (numbers, durations, comparisons, certifications). ` +
      `For each, state whether the original facts support it. ` +
      `Respond as JSON: {"passed": true/false, "flagged_claims": ["..."]}. ` +
      `"passed" is false if ANY claim is not supported by the original facts.`
  );
  return check;
}

// ---- Persona panel (Section 1.6) ----
async function scoreWithPersona(draft, personaDescription, personaKey, callLog) {
  callLog.push({ source: "manager", target: personaKey });
  const result = await chatJSON(
    `You are: ${personaDescription}\nReact to this ad as this persona would: "${draft}"\n` +
      `Give an appeal score from 1-10 and a one-sentence reason. Respond as JSON: {"score": <int>, "reason": "..."}`
  );
  callLog.push({ source: personaKey, target: "manager" });
  return result;
}

// ---- Manager (Section 1.7) ----
async function runCampaign(productName, productDesc, targetMarket) {
  const callLog = [];
  const notes = await researcher(productName, productDesc, targetMarket, callLog);

  const drafts = [];
  for (const angle of ANGLES) {
    let draft = await copywriter(productName, productDesc, targetMarket, angle, notes, callLog);
    let check = await hallucinationCheck(draft, productName, productDesc, targetMarket, callLog);
    callLog.push({ source: "hallucination_check", target: check.passed ? "manager" : "copywriter" });

    if (!check.passed) {
      // one revision, exactly as in the Day 3 notebook manager loop
      draft = await copywriter(productName, productDesc, targetMarket, angle, notes, callLog);
      check = await hallucinationCheck(draft, productName, productDesc, targetMarket, callLog);
      callLog.push({ source: "hallucination_check", target: "manager" });
    }
    drafts.push({ angle, draft, passed: check.passed });
  }

  const isEco = /eco|sustain|green|environment/i.test(targetMarket + " " + productDesc);
  const activePersonas = isEco
    ? PERSONAS
    : Object.fromEntries(Object.entries(PERSONAS).filter(([k]) => k !== "persona_sustainability"));

  for (const d of drafts) {
    const scores = [];
    for (const [key, description] of Object.entries(activePersonas)) {
      const result = await scoreWithPersona(d.draft, description, key, callLog);
      scores.push(result.score);
    }
    d.avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  const winner = drafts.reduce((best, d) => (d.avgScore > best.avgScore ? d : best), drafts[0]);
  return { winner, drafts, callLog, notes };
}

const handler = traceable(
  async (event) => {
    try {
      const { productName, productDesc, targetMarket } = JSON.parse(event.body);
      if (!productName || !productDesc || !targetMarket) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
      }

      const result = await runCampaign(productName, productDesc, targetMarket);
      return { statusCode: 200, body: JSON.stringify(result) };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
    }
  },
  { name: "fetchAgentTeam", project: process.env.LANGSMITH_PROJECT }
);

export { handler };

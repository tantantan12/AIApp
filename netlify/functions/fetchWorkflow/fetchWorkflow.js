import OpenAI from "openai";
import { traceable } from "langsmith/traceable";

// Day 2 -- Agent Workflows: the same request run through four different
// patterns from Anthropic's "Building Effective Agents" framework, so
// students can compare latency and output side by side (see Day 2 notes,
// Section 2, and the Day 2 notebook, Sections 2.2-2.7).

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o-mini";

// ---- Baseline: a single direct call (Day 2 notebook, Section 4.1) ----
async function runBaseline(productName, productDesc, targetMarket) {
  const prompt = `Write one line of ad copy for ${productName} (${productDesc}), targeting ${targetMarket}.`;
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
  });
  return {
    output: response.choices[0].message.content,
    steps: ["Single call: wrote one line of ad copy directly from the raw request."],
  };
}

// ---- Prompt chaining (Day 2 notebook, Section 2.2) ----
async function runChaining(productName, productDesc, targetMarket) {
  const extractPrompt = `List exactly 3 concrete selling points for ${productName}, based on this description: ${productDesc}. One per line, no extra commentary.`;
  const step1 = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: extractPrompt }],
  });
  const sellingPoints = step1.choices[0].message.content;

  const writePrompt = `Using ONLY these selling points:\n${sellingPoints}\nWrite one line of ad copy for ${productName}, targeting ${targetMarket}.`;
  const step2 = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: writePrompt }],
  });

  return {
    output: step2.choices[0].message.content,
    steps: [
      `Step 1 -- extracted selling points: ${sellingPoints.replace(/\n/g, " / ")}`,
      "Step 2 -- wrote ad copy using only those selling points.",
    ],
  };
}

// ---- Parallelization + voting (Day 2 notebook, Section 2.7) ----
async function runParallel(productName, productDesc, targetMarket) {
  const draftPrompt = `Write one line of ad copy for ${productName} (${productDesc}), targeting ${targetMarket}.`;
  const drafts = [];
  for (let i = 0; i < 3; i++) {
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.9,
      messages: [{ role: "user", content: draftPrompt }],
    });
    drafts.push(response.choices[0].message.content);
  }

  const votePrompt =
    "Here are 3 ad copy drafts:\n" +
    drafts.map((d, i) => `${i + 1}. ${d}`).join("\n") +
    "\nWhich number is strongest? Respond as JSON: {\"choice\": <1|2|3>, \"reason\": \"...\"}";
  const vote = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: votePrompt }],
    response_format: { type: "json_object" },
  });
  const verdict = JSON.parse(vote.choices[0].message.content);
  const chosenIndex = Math.min(Math.max((verdict.choice || 1) - 1, 0), drafts.length - 1);

  return {
    output: drafts[chosenIndex],
    steps: [
      `Drafted 3 independent variations at temperature 0.9.`,
      `Vote: chose draft #${chosenIndex + 1} -- ${verdict.reason || ""}`,
    ],
  };
}

// ---- Routing agent (Day 2 notebook, Sections 2.3-2.6) ----
const routingTools = [
  {
    type: "function",
    function: {
      name: "generate_advertising_copy",
      description: "Generate one line of advertising copy for a product.",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          product_desc: { type: "string" },
          target_market: { type: "string" },
        },
        required: ["product_name", "product_desc", "target_market"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_competitors",
      description: "Name the 3 closest competing products for a given product.",
      parameters: {
        type: "object",
        properties: {
          product_name: { type: "string" },
          product_desc: { type: "string" },
          target_market: { type: "string" },
        },
        required: ["product_name", "product_desc", "target_market"],
      },
    },
  },
];

async function toolGenerateCopy(args) {
  const prompt = `Write one line of ad copy for ${args.product_name} (${args.product_desc}), targeting ${args.target_market}.`;
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
  });
  return { copy: response.choices[0].message.content };
}

async function toolSearchCompetitors(args) {
  // Simplified for this demo -- the real 3-step SerpAPI pipeline lives in
  // netlify/functions/fetchCompetitors/fetchCompetitors.js (Day 1/Tab 1).
  const prompt = `Name 3 realistic competing products for ${args.product_name} (${args.product_desc}), targeting ${args.target_market}. Reply as a short comma-separated list, no commentary.`;
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
  });
  return { top_3: response.choices[0].message.content };
}

async function runRouting(productName, productDesc, targetMarket, userRequest) {
  const request =
    userRequest ||
    `Help me launch: ${productName} (${productDesc}), targeting ${targetMarket}.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: request }],
    tools: routingTools,
    parallel_tool_calls: false,
  });
  const choice = response.choices[0].message;

  if (!choice.tool_calls || choice.tool_calls.length === 0) {
    return { output: choice.content, steps: ["Model answered directly -- no tool needed."] };
  }

  const toolCall = choice.tool_calls[0];
  const args = JSON.parse(toolCall.function.arguments);
  const result =
    toolCall.function.name === "generate_advertising_copy"
      ? await toolGenerateCopy(args)
      : await toolSearchCompetitors(args);

  const followup = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "user", content: request },
      choice,
      { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) },
    ],
  });

  return {
    output: followup.choices[0].message.content,
    steps: [
      `Reasoned about the request and chose tool: ${toolCall.function.name}`,
      `Observed result: ${JSON.stringify(result)}`,
    ],
  };
}

const PATTERN_LABELS = {
  baseline: "Baseline (single call)",
  chaining: "Prompt Chaining",
  parallel: "Parallelization + Voting",
  routing: "Routing Agent",
};

const handler = traceable(
  async (event) => {
    try {
      const { productName, productDesc, targetMarket, pattern } = JSON.parse(event.body);
      if (!productName || !productDesc || !targetMarket) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
      }

      const start = Date.now();
      let result;
      switch (pattern) {
        case "chaining":
          result = await runChaining(productName, productDesc, targetMarket);
          break;
        case "parallel":
          result = await runParallel(productName, productDesc, targetMarket);
          break;
        case "routing":
          result = await runRouting(productName, productDesc, targetMarket);
          break;
        default:
          result = await runBaseline(productName, productDesc, targetMarket);
      }
      const latencyMs = Date.now() - start;

      return {
        statusCode: 200,
        body: JSON.stringify({
          pattern: PATTERN_LABELS[pattern] || PATTERN_LABELS.baseline,
          output: result.output,
          steps: result.steps,
          latencyMs,
        }),
      };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
    }
  },
  { name: "fetchWorkflow", project: process.env.LANGSMITH_PROJECT }
);

export { handler };

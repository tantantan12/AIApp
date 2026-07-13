import OpenAI from "openai";
import { traceable } from "langsmith/traceable";

// Day 4 -- SEO/GEO Improve: rewrites the current ad copy using Day 4's
// SEO/GEO principles (Day 4 notes, Sections 2-3) and suggests page
// metadata. This is the "answer key" version of the exercise students
// implement by hand in the student template (see Day 4 notes, Section 6).

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = "gpt-4o-mini";

async function chatJSON(prompt) {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0].message.content);
}

const handler = traceable(
  async (event) => {
    try {
      const { productName, productDesc, targetMarket, currentCopy } = JSON.parse(event.body);
      if (!productName || !productDesc || !targetMarket) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
      }

      let baselineCopy = currentCopy;
      if (!baselineCopy) {
        const draft = await openai.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "user",
              content: `Write one line of ad copy for ${productName} (${productDesc}), targeting ${targetMarket}.`,
            },
          ],
        });
        baselineCopy = draft.choices[0].message.content;
      }

      const enhanced = await chatJSON(
        `You are optimizing content for both traditional SEO and Generative Engine Optimization (GEO -- how AI Overviews select and cite content).\n` +
          `Product: ${productName}\nDescription: ${productDesc}\nTarget market: ${targetMarket}\n` +
          `Current ad copy: "${baselineCopy}"\n\n` +
          `Produce:\n` +
          `1. enhancedTitle: a <title> tag (under 60 characters) containing a keyword a real user would search.\n` +
          `2. enhancedMeta: a <meta name="description"> (under 155 characters) that also contains that keyword.\n` +
          `3. enhancedCopy: a rewritten version of the ad copy that (a) leads with one clear, self-contained sentence an AI Overview could quote directly, (b) covers the product's full intent (not just one keyword), and (c) stays distinct rather than generic.\n` +
          `4. rationale: 1-2 sentences on what changed and why, referencing SEO and/or GEO principles specifically.\n` +
          `Respond as JSON with exactly these 4 keys.`
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          currentCopy: baselineCopy,
          enhancedTitle: enhanced.enhancedTitle,
          enhancedMeta: enhanced.enhancedMeta,
          enhancedCopy: enhanced.enhancedCopy,
          rationale: enhanced.rationale,
        }),
      };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
    }
  },
  { name: "fetchGEO", project: process.env.LANGSMITH_PROJECT }
);

export { handler };

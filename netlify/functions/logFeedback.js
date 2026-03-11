import { Client } from "langsmith";

const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY
});

export async function handler(event) {

  try {

    const { runId, score, branch } = JSON.parse(event.body);

    if (!runId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing runId" })
      };
    }

    await client.createFeedback(runId, "user_satisfaction", {
      score: score,
      comment: branch || "unknown_branch"
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {

    console.error("LangSmith feedback error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.toString() })
    };

  }
}

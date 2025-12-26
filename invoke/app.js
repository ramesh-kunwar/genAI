import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main() {
  const chatCompletion = await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
}
main();
export async function getGroqChatCompletion() {
  const completion = groq.chat.completions.create({
    temperature: 1,
    frequency_penalty: 1,
    presence_penalty: 1,
    model: "openai/gpt-oss-20b",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are Jarvis, a smart review grader. Your task is to analyse given review and return the sentiment
         classifies each review as positive, neutral or negative. You must return the result in valid JSON structure.
         example: {"sentiment": "Negative"} 
          `,
      },
      {
        role: "user",
        content: `
    Review: "the phone case fits perfectly and feels sturdly."
	 Sentiment: Positive
	 Review: "the packaging was fine, bu the product is average at best."
	 Sentiment: Negative
	 Review: "these headphones arrived quickly and look great, but the left earcup stopped working after a week".
	Sentiment:

        `,
      },
    ],
  });

  return completion;
}

/**
 You are an assistant that classifies each review as positive, neutral or negative. Return a single work
	 Review: "the phone case fits perfectly and feels sturdly."
	 Sentiment: Positive
	 Review: "the packaging was fine, bu the product is average at best."
	 Sentiment: Negative
	 Review: "these headphones arrived quickly and look great, but the left earcup stopped working after a week".
	Sentiment:



     **/

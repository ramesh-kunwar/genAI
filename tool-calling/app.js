import "dotenv/config";
import readLine from "node:readline/promises";
import Groq from "groq-sdk";
import { getTavlyResponse } from "./tavilyTool.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main() {
  const chatCompletion = await getGroqChatCompletion();
}
main();

async function webSearch({ query }) {
  // here we will do tavily api call
  console.log("Calling web search...");
  const response = await getTavlyResponse(query);
  // console.log(tavilyRespponse, " from app.js");
  // return "Iphone was lunched on 20 september 2024.";

  const finalResult = response.results
    .map((result) => result.content)
    .join("\n\n");

  return finalResult;
}

export async function getGroqChatCompletion() {
  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const messages = [
    {
      role: "system",
      content: `
        You are a smart personal assistant who answers the questions.
        You have access to following tools:
          1. searchWeb({query}: {query: string}) // Search the latest information and realtime data on the internet.
          current datetime: ${new Date().toUTCString()}
        `,
    },
  ];

  // loop for user prompt
  while (true) {
    let question = await rl.question("You: ");
    messages.push({
      role: "user",
      content: question,
    });

    if (question === "bye") {
      break;
    }
    // this should run until tool calling stops -> llm loop for tool calling
    while (true) {
      const completions = groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        temperature: 0,
        messages: messages,

        // Sample request body with tool definitions and messages

        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description:
                "Search teh latest information and realtime data on the internet.",
              parameters: {
                // JSON Schema object
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to perform search on.",
                  },
                },
                // required: ["location"],
              },
            },
          },
        ],
        tool_choice: "auto",
      });

      messages.push((await completions).choices[0].message); // to store history
      const toolCalls = (await completions).choices[0].message.tool_calls;
      if (!toolCalls) {
        console.log(
          `Assistant: ${(await completions).choices[0].message.content}`
        );
        break; // we break loop when it stops tool calling
      }

      for (const tool of toolCalls) {
        // console.log(`Tool: ${JSON.stringify(tool)}`);

        const functionName = tool.function.name;
        const functionParams = tool.function.arguments;

        // console.log(functionName, functionParams);

        if (functionName === "webSearch") {
          const toolResult = await webSearch(JSON.parse(functionParams));
          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: functionName,
            content: toolResult,
          });
        }
      }

      console.log(
        JSON.stringify((await completions).choices[0].message, null, 2)
      );
    }
  }
  rl.close();
}

import "dotenv/config";
import OpenAI from "openai";
import { exec } from "child_process";
import util from "util";
import { platform } from "os";
import readlineSync from "readline-sync";

const execute = util.promisify(exec);

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function executeCommand({ command }) {
  try {
    const { stdout, stderr } = await execute(command);
    if (stderr) {
      return `Error: ${stderr}`;
    }
    return `Success: ${stdout}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Tool definition (OpenAI style)
const tools = [
  {
    type: "function",
    function: {
      name: "executeCommand",
      description:
        "Executes shell/terminal commands to create, update, or delete files and folders.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description:
              "Shell/terminal command. Example: mkdir calculator, touch calculator/index.html",
          },
        },
        required: ["command"],
      },
    },
  },
];

const History = [
  {
    role: "system",
    content: `
You are a website builder that creates frontend websites using shell/terminal commands.

Rules:
- Give commands ONE by ONE
- Commands must match the operating system
- OS: ${platform()}
- Use best practices
- Handle multi-line commands if needed

Steps:
1. Create project folder
2. Create HTML, CSS, JS files
3. Write content to each file
4. Fix errors by updating/deleting files if required

Your output MUST be a function call whenever an action is required.
`,
  },
];

// async function buildWebsite() {
//   while (true) {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4.1-mini", // or gpt-4.1 / gpt-4o
//       messages: History,
//       tools,
//       tool_choice: "auto",
//     });

//     const message = response.choices[0].message;

//     // If model wants to call a tool
//     if (message.tool_calls && message.tool_calls.length > 0) {
//       const toolCall = message.tool_calls[0];
//       const args = JSON.parse(toolCall.function.arguments);

//       const toolResult = await executeCommand(args);

//       // Save model tool call
//       History.push(message);

//       // Save tool response
//       History.push({
//         role: "tool",
//         tool_call_id: toolCall.id,
//         content: toolResult,
//       });
//     } else {
//       // No more actions required
//       console.log(message.content);
//       break;
//     }
//   }
// }

async function buildWebsite() {
  while (true) {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: History,
      tools,
      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    // Save assistant message FIRST
    History.push(message);

    // If tool calls exist, respond to ALL of them
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);

        const toolResult = await executeCommand(args);

        History.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }
    } else {
      // No tool calls → final output
      console.log(message.content);
      break;
    }
  }
}

// CLI loop
while (true) {
  const question = readlineSync.question("Ask me anything: ");

  if (question === "exit") break;

  History.push({
    role: "user",
    content: question,
  });

  await buildWebsite();
}

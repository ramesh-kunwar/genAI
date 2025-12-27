import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";
import { exec } from "child_process";
import util from "util";
import { platform } from "os";
import readlineSync from "readline-sync";

const execute = util.promisify(exec);

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function executeCommand({ command }) {
  try {
    const { stdout, stderr } = await execute(command);
    if (stderr) {
      return `Error: ${stderr}`;
    }

    return `Success ${stdout}`;
  } catch (error) {
    console.log(error);
    return `Error ${error}`;
  }
}

const commandExecuter = {
  name: "executeCommand",
  description:
    "It takes any shell/termianl command execute it. It will help us to create, update, delete any folder and files.",
  parameters: {
    type: Type.OBJECT,

    properties: {
      command: {
        type: Type.STRING,
        description:
          "It is the terminal / shell command. Ex: mkdir calculator, touch calculator / index.js etc.",
      },
    },
    required: ["command"],
  },
};
const History = [];
async function buildWebsite() {
  while (true) {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: History,
      config: {
        systemInstruction: `
            You are a website Builder, which will create the frontend part of the website using terminal/shell commands.
            You will give shell/terminal command one by one and our tool will execute it.

            Give the command according to the Operating System we are using.
            My current operating system is : ${platform}.

            Kindly use best practice for commands, it should handle multi line also.

            Your Job
            1. Analyze hte user query
            2. Take the necessary action after analysing the query by giving proper shell command according to the user operating system.

            Step By Step Guide

            1. First you have to create the folder for the website which we have to create, ex: mkdir calculator
            2. give shell / terminal command to crete html file, ex: touch calculator/index.html
            3. give shell / terminal command to crete css file, ex: touch calculator/index.css
            4. give shell / terminal command to crete js file, ex: touch calculator/index.js
            5. Give shell / terminal command to write on html file.
            6. Give shell / terminal command to write on css file.
            7. Give shell / terminal command to write on js file.
            8. Fix the error if they are present at any step by writing, updating or deleting.


        `,
      },
      config: {
        tools: [
          {
            functionDeclarations: [commandExecuter],
          },
        ],
      },
    });
    // Check for function calls in the response
    if (result.functionCalls && result.functionCalls.length > 0) {
      const functionCall = result.functionCalls[0]; // Assuming one function call

      const { name, args } = functionCall;

      const toolResponse = await executeCommand(args);

      const functionResponsePart = {
        name: functionCall.name,
        response: {
          result: toolResponse,
        },
      };

      History.push({
        role: "model",
        parts: [
          {
            functionCall: functionCall,
          },
        ],
      });

      History.push({
        role: "user",
        parts: [
          {
            functionCall: functionResponsePart,
          },
        ],
      });
    } else {
      console.log("No function call found in the result.");
      console.log(result.text);
      break;
    }
  }
}

while (true) {
  const question = readlineSync.question("Aske me anything: ");

  if (question === "exit") {
    break;
  }
  History.push({
    role: "user",
    parts: [{ text: question }],
  });
  await buildWebsite();
}

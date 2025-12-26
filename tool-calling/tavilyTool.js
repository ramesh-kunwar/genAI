// const { tavily } = require("@tavily/core");
import "dotenv/config";
import { tavily } from "@tavily/core";

export async function getTavlyResponse(question) {
  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const response = await tvly.search(question);

  //   console.log(response);
  return response;
}

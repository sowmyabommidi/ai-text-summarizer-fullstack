import { GoogleGenerativeAI } from "@google/generative-ai";
import { promptTemplate } from "./prompt.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function summarizeText(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = promptTemplate.replace("{{USER_TEXT}}", text);

  const result = await model.generateContent(prompt);
  const response = await result.response;

  const content = response.text();

  return JSON.parse(content);
}
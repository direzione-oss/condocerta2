import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  try {
    console.log("Starting test...");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: "Hello world"
    });
    console.log("Success:", response.text);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();

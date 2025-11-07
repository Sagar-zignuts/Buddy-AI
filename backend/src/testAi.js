import { GoogleGenerativeAI } from "@google/generative-ai";
// import fetch, { Headers, Request, Response } from "node-fetch";
import dotenv from "dotenv";

// // Polyfill fetch for Node.js environments that don't have it globally
// if (!globalThis.fetch) {
//   globalThis.fetch = fetch;
// }
// if (!globalThis.Headers) {
//   globalThis.Headers = Headers;
// }
// if (!globalThis.Request) {
//   globalThis.Request = Request;
// }
// if (!globalThis.Response) {
//   globalThis.Response = Response;
// }

dotenv.config();

async function testGemini() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Discover available models for this API key
    try {
      const list = await genAI.listModels?.();
      if (list && list.models) {
        console.log("Available models:");
        for (const m of list.models) {
          console.log("-", m.name);
        }
      }
    } catch (_) {
      // ignore listing failures; continue to generation attempt
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent("Say hello in one short line.");
    console.log("✅ Gemini response:", result.response.text());
  } catch (err) {
    console.error("❌ Gemini test error:", err);
  }
}

testGemini();

import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch, { Headers, Request, Response } from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// Ensure fetch APIs are available in Node
if (!globalThis.fetch) globalThis.fetch = fetch;
if (!globalThis.Headers) globalThis.Headers = Headers;
if (!globalThis.Request) globalThis.Request = Request;
if (!globalThis.Response) globalThis.Response = Response;

export const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

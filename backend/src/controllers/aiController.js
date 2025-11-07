import { geminiClient } from "../config/gemini.js";
import ChatMessage from "../models/ChatMessage.js";

export const getHint = async (req, res) => {
    try {
        const { problemText } = req.body;

        if (!problemText) {
            return res.status(400).json({
                success: false,
                error: "Problem text is required",
            });
        }

        const prompt = `${problemText}
        Please provide a hint for the problem. , Don't give me the solution, just the hint.`;

        // Allow overriding model via env; default to a common v1 model
        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const model = geminiClient.getGenerativeModel({
            model: modelName,
        });

        // ✅ Proper generateContent call
        const result = await model.generateContent(prompt);

        const text = result.response.text();

        res.json({
            success: true,
            hint: text,
        });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// New: AI Quiz Generator
export const generateQuiz = async (req, res) => {
    try {
        const { text, type = "mcq", numQuestions = 5 } = req.body || {};
        if (!text || typeof text !== "string") {
            return res
                .status(400)
                .json({ success: false, message: "text is required" });
        }
        const normalizedType = String(type).toLowerCase();
        const count = Math.min(
            Math.max(parseInt(numQuestions, 10) || 5, 1),
            20
        );

        const model = geminiClient.getGenerativeModel({
            model: "gemini-2.5-flash",
        });
        const prompt = `
You are an expert educator.
Create a ${
            normalizedType === "mcq"
                ? "multiple-choice quiz"
                : "short-answer quiz"
        } from the following content.

Constraints:
- Number of questions: ${count}
- Target audience: intermediate learners
- Output MUST be strict JSON. No markdown, no commentary.
- JSON schema:
${
    normalizedType === "mcq"
        ? `{
  "success": true,
  "type": "mcq",
  "questions": [
    {
      "question": string,
      "options": [string, string, string, string],
      "answerIndex": number // 0-3
    }
  ]
}`
        : `{
  "success": true,
  "type": "short",
  "questions": [
    {
      "question": string,
      "answer": string
    }
  ]
}`
}

Source text:
"""
${text}
"""`;

        const result = await model.generateContent(prompt);
        const raw = result.response.text();
        // Best effort to parse JSON even if model adds code fences
        const clean = raw.trim().replace(/^```json\n?|```$/g, "");
        try {
            const json = JSON.parse(clean);
            return res.json(json);
        } catch (_) {
            return res.json({ success: true, type: normalizedType, raw });
        }
    } catch (error) {
        console.error("Gemini Quiz Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// New: AI Chat (empathetic assistant)
export const aiChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, message: "message is required" });
    }
    const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
    const persona = `You are Buddy, an empathetic AI coding companion.
- Communicate warmly with concise, high-signal answers.
- Use friendly tone and mild emojis when appropriate.
- If the user is frustrated, acknowledge feelings and encourage them.
- Always provide a concrete next step.`;

    const chatPrompt = `${persona}\n\nConversation so far:\n${history
      .map((h) => (h?.role === "user" ? `User: ${h.content}` : `Buddy: ${h.content}`))
      .join("\n")}\n\nUser: ${message}\nBuddy:`;

    const result = await model.generateContent(chatPrompt);
    const text = result.response.text();

    // Persist conversation per user
    if (req.user && req.user._id) {
      const doc = await ChatMessage.findOneAndUpdate(
        { userId: req.user._id },
        {
          $push: {
            messages: { $each: [ { role: "user", content: message }, { role: "assistant", content: text } ], $slice: -200 },
          },
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, reply: text });
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const doc = await ChatMessage.findOne({ userId: req.user._id });
    res.json({ success: true, messages: doc?.messages || [] });
  } catch (error) {
    console.error("Chat History Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearChat = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Clear all messages for the user
    const result = await ChatMessage.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { messages: [] } },
      { upsert: false, new: true }
    );

    // If no document exists, that's fine - chat is already empty
    res.json({ success: true, message: "Chat cleared successfully" });
  } catch (error) {
    console.error("Clear Chat Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // Ensure node-fetch is installed

// Load environment variables
dotenv.config();

const app = express();

// ✅ Store API key in a variable for easy use
const apiKey = process.env.OPENROUTER_API_KEY;
console.log("API key loaded:", !!apiKey);
app.use(cors({
  origin: "*", // Allow all origins; change to your frontend URL in production
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Health check route
app.get("/", (req, res) => res.send("Summarizer API is running!"));

// Main summarize route
app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "No valid text provided" });
    }

    // Call OpenRouter AI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
  "Authorization": `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "https://ai-text-summarizer-fullstack.onrender.com",
  "X-Title": "AI Text Summarizer"
},
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `
Return ONLY a JSON object with keys: 
"summary" (string), "keyPoints" (array of strings), "sentiment" (string). 
Do NOT include markdown or backticks.

Text: ${text}
`
          }
        ]
      })
    });

    const data = await response.json();

    // Handle AI errors
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("OpenRouter Error:", data);
      return res.status(500).json({ error: "AI Service failed to respond" });
    }

    let output = data.choices[0].message?.content || "";

    // Remove markdown code blocks if included
    output = output.replace(/```json/g, "").replace(/```/g, "").trim();

    // Safely parse AI output
    try {
      const parsed = JSON.parse(output);

      res.json({
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        sentiment: typeof parsed.sentiment === "string" ? parsed.sentiment : ""
      });
    } catch (parseError) {
      console.error("JSON Parse Error:", output, parseError);
      res.status(500).json({ 
        error: "AI returned invalid JSON format", 
        fallback: { summary: "", keyPoints: [], sentiment: "" } 
      });
    }

  } catch (error) {
    console.error("Backend Server Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      fallback: { summary: "", keyPoints: [], sentiment: "" } 
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
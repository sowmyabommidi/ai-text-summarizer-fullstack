import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // make sure node-fetch is installed for fetch support in Node

dotenv.config();

const app = express();

// 1. Robust CORS setup
app.use(cors({
  origin: "*", // Allow all origins; change to your frontend URL in production
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 2. Health check route
app.get("/", (req, res) => res.send("Summarizer API is running!"));

// 3. Main Summarize Route
app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "No valid text provided" });
    }

    // 3a. Call OpenRouter AI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
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

    // 3b. Handle AI errors
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("OpenRouter Error:", data);
      return res.status(500).json({ error: "AI Service failed to respond" });
    }

    let output = data.choices[0].message?.content || "";

    // Remove markdown code blocks if included
    output = output.replace(/```json/g, "").replace(/```/g, "").trim();

    // 3c. Safely parse AI output
    try {
      const parsed = JSON.parse(output);

      // Ensure the structure is safe for frontend
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

// 4. Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// 1. Updated CORS: This is more robust for Vercel -> Render communication
app.use(cors({
  origin: "*", // Allows your Vercel frontend to access this API
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 2. Health check route (Confirms the backend is awake)
app.get("/", (req, res) => res.send("Summarizer API is running!"));

// 3. Main Summarize Route
app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

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
            content: `Return ONLY a valid JSON object with these keys: "summary" (string), "keyPoints" (array of strings), and "sentiment" (string). Do not include markdown formatting or backticks.
            
            Text: ${text}`
          }
        ]
      })
    });

    const data = await response.json();

    // Handle OpenRouter errors (like invalid API keys or quota limits)
    if (!data.choices || data.choices.length === 0) {
      console.error("OpenRouter Error:", data);
      return res.status(500).json({ error: "AI Service failed to respond" });
    }

    let output = data.choices[0].message.content;

    // Remove markdown code blocks if the AI accidentally includes them
    output = output.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(output);
      res.json(parsed);
    } catch (parseError) {
      console.error("JSON Parse Error:", output);
      res.status(500).json({ error: "AI returned invalid JSON format" });
    }

  } catch (error) {
    console.error("Backend Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. Use process.env.PORT for Render deployment
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
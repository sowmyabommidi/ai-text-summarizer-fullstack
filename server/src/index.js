import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Update: You can leave this as app.use(cors()) for now to make testing easier,
// but for production, it's safer to specify your Vercel URL.
app.use(cors()); 

app.use(express.json());

// Health check route (Optional but helpful for Render to know your app is alive)
app.get("/", (req, res) => res.send("Summarizer API is running!"));

app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    // Safety check
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
            content: `Return ONLY JSON:
{
 "summary": "",
 "keyPoints": ["", "", ""],
 "sentiment": ""
}

Text:
${text}`
          }
        ]
      })
    });

    const data = await response.json();
    console.log("OpenRouter output:", data);

    // Error handling if OpenRouter fails
    if (!data.choices || !data.choices[0]) {
        return res.status(500).json({ error: "AI Service Error" });
    }

    let output = data.choices[0].message.content;
    output = output.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(output);
    res.json(parsed);

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: "Failed to process text" });
  }
});

// CRITICAL CHANGE: Use process.env.PORT for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
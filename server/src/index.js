import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body;

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

    let output = data.choices[0].message.content;

    output = output.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(output);

    res.json(parsed);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
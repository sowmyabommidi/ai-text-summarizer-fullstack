import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://ai-text-summarizer-fullstack.onrender.com/api/summarize";

  const handleSubmit = async () => {
    if (!text.trim()) return alert("Please paste some text first!");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      if (!res.ok) throw new Error("Failed to connect to the server");

      const data = await res.json();
      console.log("API Response:", data);

      // Ensure result is always an object with safe defaults
      setResult({
        summary: typeof data.summary === "string" ? data.summary : "",
        keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
        sentiment: typeof data.sentiment === "string" ? data.sentiment : ""
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Error fetching summary. Make sure your backend is running and CORS is enabled!");
      setResult({
        summary: "",
        keyPoints: [],
        sentiment: ""
      });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>AI Text Summarizer</h1>

      <textarea
        rows="8"
        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
        placeholder="Paste text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <br /><br />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: loading ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        {loading ? "Analyzing..." : "Summarize"}
      </button>

      {result && (
        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <h3 style={{ borderBottom: "1px solid #ddd" }}>Summary</h3>
          <p>{result.summary || "No summary available"}</p>

          <h3 style={{ borderBottom: "1px solid #ddd" }}>Key Points</h3>
          <ul>
            {result.keyPoints.length > 0 ? (
              result.keyPoints.map((point, i) => <li key={i}>{point}</li>)
            ) : (
              <li>No key points available</li>
            )}
          </ul>

          <h3 style={{ borderBottom: "1px solid #ddd" }}>Sentiment</h3>
          <p><strong>{result.sentiment || "No sentiment available"}</strong></p>
        </div>
      )}
    </div>
  );
}

export default App;
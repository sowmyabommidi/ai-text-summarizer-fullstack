import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      console.log(data); // debug

      setResult(data);
    } catch (error) {
      console.error("Error:", error);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Text Summarizer</h1>

      <textarea
        rows="8"
        cols="60"
        placeholder="Paste text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <br /><br />

      <button onClick={handleSubmit}>
        Summarize
      </button>

      {loading && <p>Analyzing...</p>}

      {result && (
        <div>
          <h3>Summary</h3>
          <p>{result?.summary || "No summary available"}</p>

          <h3>Key Points</h3>
          <ul>
            {result?.keyPoints?.length ? (
              result.keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))
            ) : (
              <li>No key points available</li>
            )}
          </ul>

          <h3>Sentiment</h3>
          <p>{result?.sentiment || "No sentiment available"}</p>
        </div>
      )}
    </div>
  );
}

export default App;
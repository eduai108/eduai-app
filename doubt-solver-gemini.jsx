import { useState, useRef } from "react";

// 🔑 PASTE YOUR GEMINI API KEY HERE
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

const SUBJECTS = [
  { id: "physics", label: "Physics", icon: "⚡", color: "#6366f1" },
  { id: "chemistry", label: "Chemistry", icon: "🧪", color: "#10b981" },
  { id: "math", label: "Mathematics", icon: "∑", color: "#f59e0b" },
  { id: "biology", label: "Biology", icon: "🧬", color: "#ec4899" },
  { id: "english", label: "English / Reasoning", icon: "📖", color: "#8b5cf6" },
];

const SYSTEM_PROMPT = `You are an expert JEE and NEET coaching tutor. Your job is to solve doubts for students preparing for JEE (engineering) and NEET (medical) exams in India.

When a student asks a question:
1. Identify the topic and concept involved
2. Give a clear, step-by-step solution
3. Highlight key formulas or concepts used (wrap them in **bold**)
4. At the end, add a "💡 Tip to remember" — a short memory trick or insight
5. Keep language simple and encouraging

Format your response clearly with sections. Be thorough but not overwhelming.`;

export default function DoubtSolver() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState("image/jpeg");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const fileRef = useRef();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file.name);
    setImageMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAsk = async () => {
    if (!question.trim() && !imageBase64) return;
    if (!selectedSubject) {
      setError("Please select a subject first.");
      return;
    }
    setLoading(true);
    setAnswer(null);
    setError(null);

    const subject = SUBJECTS.find((s) => s.id === selectedSubject);

    // Build Gemini content parts
    const parts = [];

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: imageMimeType,
          data: imageBase64,
        },
      });
    }

    parts.push({
      text: `${SYSTEM_PROMPT}\n\nSubject: ${subject.label}\n\nQuestion: ${question || "Please solve this problem from the image."}`,
    });

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        setError(`API Error: ${data.error.message}`);
        return;
      }

      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response received. Please try again.";

      setAnswer(text);
      setHistory((prev) => [
        {
          subject: subject.label,
          question: question || "Image question",
          answer: text,
          color: subject.color,
          icon: subject.icon,
        },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      setError("Something went wrong. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuestion("");
    setImage(null);
    setImageBase64(null);
    setAnswer(null);
    setError(null);
  };

  const formatAnswer = (text) => {
    return text.split("\n").map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return (
        <p
          key={i}
          style={{ margin: "4px 0", lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: bold }}
        />
      );
    });
  };

  const activeSubject = SUBJECTS.find((s) => s.id === selectedSubject);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#f1f5f9",
      padding: "24px 16px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "6px 18px",
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#a78bfa",
          marginBottom: 12,
        }}>
          JEE · NEET · AI Tutor
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 800,
          margin: 0,
          background: "linear-gradient(90deg, #a78bfa, #38bdf8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Ask Any Doubt
        </h1>
        <p style={{ color: "#94a3b8", marginTop: 8, fontSize: 15 }}>
          Get step-by-step solutions instantly — any subject, any time
        </p>
        <div style={{
          display: "inline-block",
          background: "rgba(16,185,129,0.15)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: 20,
          padding: "4px 14px",
          fontSize: 12,
          color: "#34d399",
          marginTop: 8,
        }}>
          ✅ Powered by Google Gemini — Free
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Subject Picker */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: "#94a3b8", display: "block", marginBottom: 10 }}>
            SELECT SUBJECT
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 50,
                  border: selectedSubject === s.id ? `2px solid ${s.color}` : "2px solid rgba(255,255,255,0.1)",
                  background: selectedSubject === s.id ? `${s.color}22` : "rgba(255,255,255,0.04)",
                  color: selectedSubject === s.id ? s.color : "#94a3b8",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: selectedSubject === s.id ? 600 : 400,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your doubt here... e.g. 'Explain Newton's second law with examples'"
            rows={4}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f1f5f9",
              fontSize: 15,
              resize: "none",
              lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />

          {image && (
            <div style={{
              marginTop: 10,
              padding: "8px 14px",
              background: "rgba(99,102,241,0.15)",
              borderRadius: 8,
              fontSize: 13,
              color: "#a78bfa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span>📎 {image}</span>
              <button onClick={() => { setImage(null); setImageBase64(null); }}
                style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 18 }}>
                ×
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <button
              onClick={() => fileRef.current.click()}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#94a3b8",
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              📷 Upload photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />

            <button
              onClick={handleAsk}
              disabled={loading || (!question.trim() && !imageBase64)}
              style={{
                background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                padding: "10px 28px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 15,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {loading ? "Solving..." : "Solve ✨"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid #f87171",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#fca5a5",
            fontSize: 14,
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
            <p style={{ color: "#94a3b8" }}>Your AI tutor is thinking...</p>
          </div>
        )}

        {answer && !loading && (
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${activeSubject?.color || "#6366f1"}44`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{
                background: `${activeSubject?.color || "#6366f1"}22`,
                color: activeSubject?.color || "#6366f1",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 13,
                fontWeight: 600,
              }}>
                {activeSubject?.icon} {activeSubject?.label}
              </span>
              <button onClick={reset} style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 6,
                color: "#94a3b8",
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: 12,
              }}>
                Ask another
              </button>
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.8 }}>
              {formatAnswer(answer)}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              Recent Questions
            </p>
            {history.map((h, i) => (
              <div key={i}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 8,
                  cursor: "pointer",
                }}
                onClick={() => setAnswer(h.answer)}
              >
                <span style={{ fontSize: 12, color: h.color, marginRight: 8 }}>{h.icon} {h.subject}</span>
                <span style={{ fontSize: 14, color: "#94a3b8" }}>
                  {h.question.slice(0, 80)}{h.question.length > 80 ? "..." : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: "center", color: "#334155", fontSize: 12, marginTop: 40 }}>
          EduAI — AI-powered coaching for JEE & NEET aspirants
        </p>
      </div>

      <style>{`
        textarea::placeholder { color: #475569; }
        button:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
      `}</style>
    </div>
  );
}

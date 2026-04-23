import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionByCode } from "../lib/api.js";
import { hasSupabaseConfig } from "../lib/supabase.js";

export default function Landing() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const join = async (e) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    if (!hasSupabaseConfig) {
      setError("Backend inte konfigurerad");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const session = await getSessionByCode(clean);
      if (!session) {
        setError("Ingen enkät med den koden");
      } else if (session.status === "closed") {
        setError("Enkäten är stängd");
      } else {
        nav(`/s/${clean}`);
      }
    } catch (err) {
      setError(err.message || "Något gick fel");
    }
    setLoading(false);
  };

  return (
    <div className="centered">
      <div className="landing card fade-up">
        <div className="landing-icon">🤖</div>
        <h1 className="landing-title">Pollster</h1>
        <p className="landing-sub">Ange koden du fått av presentatören</p>
        <form onSubmit={join} className="code-form">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="T.ex. AB34"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="code-input"
          />
          <button type="submit" className="btn primary" disabled={loading || !code.trim()}>
            {loading ? "Laddar..." : "Starta"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createSession,
  listSessions,
  updateSessionStatus,
  deleteSession,
} from "../lib/api.js";
import { generateSessionCode, SURVEY } from "../lib/survey.js";
import { hasSupabaseConfig } from "../lib/supabase.js";

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => !!sessionStorage.getItem("pollster:admin"));
  const [pass, setPass] = useState("");
  const expected = import.meta.env.VITE_ADMIN_PASSWORD || "";
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (!unlocked || !hasSupabaseConfig) {
      setLoading(false);
      return;
    }
    load();
  }, [unlocked]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listSessions();
      setSessions(list);
    } catch (e) {
      setError(e.message || "Kunde inte ladda");
    }
    setLoading(false);
  };

  const unlock = (e) => {
    e.preventDefault();
    if (!expected) {
      sessionStorage.setItem("pollster:admin", "1");
      setUnlocked(true);
      return;
    }
    if (pass === expected) {
      sessionStorage.setItem("pollster:admin", "1");
      setUnlocked(true);
    } else {
      setError("Fel lösenord");
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      let code;
      let ok = false;
      for (let i = 0; i < 5 && !ok; i++) {
        code = generateSessionCode();
        try {
          await createSession(code, newName || `Enkät ${new Date().toLocaleDateString("sv-SE")}`);
          ok = true;
        } catch (err) {
          if (!String(err.message || "").includes("duplicate")) throw err;
        }
      }
      if (!ok) throw new Error("Kunde inte generera unik kod");
      setNewName("");
      await load();
      nav(`/r/${code}`);
    } catch (e) {
      setError(e.message || "Fel vid skapande");
    }
    setCreating(false);
  };

  const toggle = async (s) => {
    const next = s.status === "open" ? "closed" : "open";
    try {
      await updateSessionStatus(s.id, next);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (s) => {
    if (!confirm(`Radera enkäten ${s.code} och alla dess svar?`)) return;
    try {
      await deleteSession(s.id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!hasSupabaseConfig) {
    return (
      <div className="centered">
        <div className="card landing">
          <h2 className="landing-title">Backend saknas</h2>
          <p className="landing-sub">
            Sätt VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY. Se README.
          </p>
        </div>
      </div>
    );
  }

  if (!unlocked && expected) {
    return (
      <div className="centered">
        <form onSubmit={unlock} className="card landing">
          <h2 className="landing-title">Admin</h2>
          <p className="landing-sub">Lösenord krävs</p>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="code-input"
            placeholder="Lösenord"
          />
          <button type="submit" className="btn primary">
            Lås upp
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    );
  }

  if (!unlocked && !expected) {
    return (
      <div className="centered">
        <div className="card landing">
          <h2 className="landing-title">Admin</h2>
          <p className="landing-sub">
            Inget admin-lösenord är satt (VITE_ADMIN_PASSWORD). Admin-sidan är oskyddad.
          </p>
          <button
            className="btn primary"
            onClick={() => {
              sessionStorage.setItem("pollster:admin", "1");
              setUnlocked(true);
            }}
          >
            Fortsätt ändå
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <h1 className="admin-title">Admin</h1>
      <p className="muted small">Skapa en enkät-session för varje tillfälle du kör.</p>

      <form onSubmit={create} className="card create-form">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Namn (t.ex. 'Konferens 2026-04-23')"
          className="text-input"
        />
        <button type="submit" className="btn primary" disabled={creating}>
          {creating ? "Skapar..." : "+ Ny enkät"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <h2 className="section-title">Tidigare enkäter</h2>
      {loading ? (
        <p className="muted">Laddar...</p>
      ) : sessions.length === 0 ? (
        <p className="muted">Inga enkäter än.</p>
      ) : (
        <ul className="session-list">
          {sessions.map((s) => (
            <li key={s.id} className="card session-row">
              <div>
                <div className="session-name">{s.name || "Utan namn"}</div>
                <div className="muted small">
                  <span className="mono">{s.code}</span> ·{" "}
                  {new Date(s.created_at).toLocaleString("sv-SE")} ·{" "}
                  <span className={s.status === "open" ? "pill live" : "pill closed"}>
                    {s.status}
                  </span>{" "}
                  · {s.responses?.[0]?.count || 0} svar
                </div>
              </div>
              <div className="row-actions">
                <Link to={`/r/${s.code}`} className="btn primary small">
                  Visa
                </Link>
                <button className="btn ghost small" onClick={() => toggle(s)}>
                  {s.status === "open" ? "Stäng" : "Öppna"}
                </button>
                <button className="btn danger small" onClick={() => remove(s)}>
                  Radera
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <details className="survey-preview">
        <summary>Förhandsgranska frågorna ({SURVEY.questions.length})</summary>
        <ol>
          {SURVEY.questions.map((q) => (
            <li key={q.id}>
              <strong>{q.text}</strong>{" "}
              <span className="muted small">({q.type})</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

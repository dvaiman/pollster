import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getSurvey } from "../lib/survey.js";
import { getSessionByCode, submitResponse } from "../lib/api.js";
import { hasSupabaseConfig } from "../lib/supabase.js";

const STORAGE_KEY = (code) => `pollster:submitted:${code}`;

export default function Survey() {
  const { code } = useParams();
  const [session, setSession] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [scaleHover, setScaleHover] = useState(null);

  const questions = useMemo(() => {
    const surveyDef = getSurvey(session?.survey_id);
    const groups = session?.audience_groups;
    if (Array.isArray(groups) && groups.length > 0) {
      return [
        {
          id: "_group",
          text: "Vem är du?",
          subtitle: "Välj vilken grupp du tillhör",
          type: "single",
          options: groups,
        },
        ...surveyDef.questions,
      ];
    }
    return surveyDef.questions;
  }, [session]);
  const q = questions[step];

  useEffect(() => {
    let cancelled = false;
    if (!hasSupabaseConfig) {
      setLoadError("Backend inte konfigurerad");
      return;
    }
    (async () => {
      try {
        const s = await getSessionByCode(code);
        if (cancelled) return;
        if (!s) setLoadError("Ingen enkät med den koden");
        else if (s.status === "closed") setLoadError("Enkäten är stängd");
        else {
          setSession(s);
          if (localStorage.getItem(STORAGE_KEY(code))) setDone(true);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e.message || "Kunde inte hämta enkäten");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const goNext = () => {
    setStep((s) => Math.min(s + 1, questions.length - 1));
  };

  const handleMulti = (opt) => {
    setAnswers((a) => {
      const prev = a[q.id] || [];
      if (prev.includes(opt)) return { ...a, [q.id]: prev.filter((x) => x !== opt) };
      const exclusives = Array.isArray(q.exclusiveOption)
        ? q.exclusiveOption
        : q.exclusiveOption
        ? [q.exclusiveOption]
        : [];
      if (exclusives.includes(opt)) return { ...a, [q.id]: [opt] };
      const next = prev.filter((x) => !exclusives.includes(x));
      if (q.maxSelect && next.length >= q.maxSelect) return a;
      return { ...a, [q.id]: [...next, opt] };
    });
  };

  const handleScale = (val) => {
    setAnswers((a) => ({ ...a, [q.id]: val }));
    setTimeout(goNext, 250);
  };

  const canProceed = useMemo(() => {
    if (!q) return false;
    const val = answers[q.id];
    if (q.type === "multi") return Array.isArray(val) && val.length > 0;
    return val !== undefined && val !== null && val !== "";
  }, [answers, q]);

  const isLast = step === questions.length - 1;

  const handleNext = async () => {
    if (!canProceed) return;
    if (!isLast) {
      goNext();
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitResponse(session.id, answers);
      localStorage.setItem(STORAGE_KEY(code), "1");
      setDone(true);
    } catch (e) {
      alert("Kunde inte skicka: " + (e.message || "okänt fel"));
    }
    setSubmitting(false);
  };

  if (loadError) {
    return (
      <div className="centered">
        <div className="card landing fade-up">
          <h2 className="landing-title">Oj</h2>
          <p className="landing-sub">{loadError}</p>
          <Link to="/" className="btn secondary">
            Tillbaka
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="centered">
        <p className="muted">Laddar enkäten...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="centered">
        <div className="card done-card fade-up">
          <div className="check-circle">✓</div>
          <h2 className="landing-title">Tack för ditt svar!</h2>
          <p className="landing-sub">
            Svaren är anonyma och resultaten visas av presentatören.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey">
      <div className="progress-bg">
        <div
          className="progress-fill"
          style={{ width: `${((step + 1) / questions.length) * 100}%` }}
        />
      </div>
      <p className="step-label">
        Fråga {step + 1} av {questions.length} · <span className="mono">{session.code}</span>
      </p>

      <div className="card question-card fade-up" key={q.id}>
        <h2 className="question-text">{q.text}</h2>
        {q.subtitle && <p className="question-sub">{q.subtitle}</p>}

        {q.type === "single" && (
          <div className="options">
            {q.options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setAnswers((a) => ({ ...a, [q.id]: opt }));
                  setTimeout(goNext, 250);
                }}
                className={"option" + (answers[q.id] === opt ? " active" : "")}
              >
                <span className={"radio" + (answers[q.id] === opt ? " on" : "")}>
                  {answers[q.id] === opt && <span className="radio-dot" />}
                </span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {q.type === "multi" && (
          <div className="options">
            {q.options.map((opt) => {
              const selected = (answers[q.id] || []).includes(opt);
              const atMax =
                q.maxSelect && (answers[q.id] || []).length >= q.maxSelect && !selected;
              return (
                <button
                  key={opt}
                  onClick={() => handleMulti(opt)}
                  disabled={atMax}
                  className={
                    "option" +
                    (selected ? " active" : "") +
                    (atMax ? " disabled" : "")
                  }
                >
                  <span className={"checkbox" + (selected ? " on" : "")}>
                    {selected && "✓"}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "scale" && (
          <div className="scale">
            <div className="scale-row">
              {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((val) => (
                <button
                  key={val}
                  onMouseEnter={() => setScaleHover(val)}
                  onMouseLeave={() => setScaleHover(null)}
                  onClick={() => handleScale(val)}
                  className={
                    "scale-btn" +
                    (answers[q.id] === val ? " active" : "") +
                    (scaleHover === val && answers[q.id] !== val ? " hover" : "")
                  }
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="scale-labels">
              <span>{q.labels[0]}</span>
              <span>{q.labels[1]}</span>
            </div>
          </div>
        )}
      </div>

      <div className="nav-row">
        {step > 0 && (
          <button className="btn ghost" onClick={() => setStep((s) => s - 1)}>
            ← Tillbaka
          </button>
        )}
        {(q.type === "multi" || isLast) && (
          <button
            onClick={handleNext}
            disabled={!canProceed || submitting}
            className="btn primary grow"
          >
            {isLast ? (submitting ? "Skickar..." : "Skicka") : "Nästa →"}
          </button>
        )}
      </div>
    </div>
  );
}

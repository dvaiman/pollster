import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { QRCodeSVG } from "qrcode.react";
import { SURVEY, COLORS } from "../lib/survey.js";
import {
  getSessionByCode,
  fetchResponses,
  subscribeToResponses,
} from "../lib/api.js";
import { hasSupabaseConfig } from "../lib/supabase.js";

export default function Present() {
  const { code } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [slide, setSlide] = useState(0);

  const slides = useMemo(() => {
    return [{ kind: "intro" }, ...SURVEY.questions.map((q) => ({ kind: "q", q }))];
  }, []);

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
        if (!s) {
          setLoadError("Ingen enkät med den koden");
          return;
        }
        setSession(s);
        const initial = await fetchResponses(s.id);
        if (!cancelled) setResponses(initial);
      } catch (e) {
        if (!cancelled) setLoadError(e.message || "Kunde inte hämta data");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (!session) return;
    return subscribeToResponses(session.id, (row) => {
      setResponses((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]));
    });
  }, [session]);

  const go = useCallback(
    (dir) => {
      setSlide((s) => Math.max(0, Math.min(slides.length - 1, s + dir)));
    },
    [slides.length]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        setSlide(0);
      } else if (e.key === "End") {
        setSlide(slides.length - 1);
      } else if (e.key === "Escape") {
        nav(`/r/${code}`);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, slides.length, nav, code]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (loadError) {
    return (
      <div className="centered">
        <div className="card landing">
          <h2 className="landing-title">Oj</h2>
          <p className="landing-sub">{loadError}</p>
          <Link to={`/r/${code}`} className="btn secondary">
            Till resultat
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="centered">
        <p className="muted">Laddar...</p>
      </div>
    );
  }

  const current = slides[slide];
  const n = responses.length;

  return (
    <div className="present-stage">
      <div className="present-content" key={slide}>
        {current.kind === "intro" ? (
          <IntroSlide session={session} responseCount={n} />
        ) : (
          <QuestionSlide q={current.q} responses={responses} total={n} />
        )}
      </div>

      <div className="present-controls">
        <button className="btn ghost small" onClick={() => go(-1)} disabled={slide === 0}>
          ← Föregående
        </button>
        <div className="present-progress">
          <span className="mono">
            {slide + 1} / {slides.length}
          </span>
          <div className="present-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={"dot" + (i === slide ? " active" : "")}
                onClick={() => setSlide(i)}
                aria-label={`Gå till slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <button
          className="btn ghost small"
          onClick={() => go(1)}
          disabled={slide === slides.length - 1}
        >
          Nästa →
        </button>
      </div>

      <div className="present-toolbar">
        <span className="badge small">
          <span className="live-dot" /> {n} svar
        </span>
        <button className="btn ghost small" onClick={toggleFullscreen} title="Fullskärm (F)">
          ⛶
        </button>
        <Link to={`/r/${code}`} className="btn ghost small">
          ✕ Stäng
        </Link>
      </div>
    </div>
  );
}

function IntroSlide({ session, responseCount }) {
  const surveyUrl = `${window.location.origin}${window.location.pathname}#/s/${session.code}`;
  return (
    <div className="slide intro-slide">
      <div className="intro-left">
        <p className="present-eyebrow">Live-enkät</p>
        <h1 className="present-title">{session.name || "Enkät"}</h1>
        <p className="present-sub">Skanna QR eller gå till sidan och ange koden</p>
        <div className="intro-code">{session.code}</div>
        <p className="present-url mono">{surveyUrl}</p>
        <p className="present-hint">
          <span className="live-dot" /> {responseCount} svar inkommit
        </p>
      </div>
      <div className="intro-right">
        <div className="qr-big">
          <QRCodeSVG value={surveyUrl} size={360} bgColor="#ffffff" fgColor="#0a0f1a" />
        </div>
      </div>
    </div>
  );
}

function QuestionSlide({ q, responses, total }) {
  const counts = {};
  responses.forEach((r) => {
    const val = r.answers?.[q.id];
    if (Array.isArray(val)) {
      val.forEach((v) => {
        counts[v] = (counts[v] || 0) + 1;
      });
    } else if (val !== undefined && val !== null) {
      counts[val] = (counts[val] || 0) + 1;
    }
  });

  if (q.type === "scale") {
    const vals = responses.map((r) => r.answers?.[q.id]).filter((v) => v !== undefined && v !== null);
    const mean = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const data = [];
    for (let v = q.min; v <= q.max; v++) {
      data.push({ name: String(v), count: counts[v] || 0 });
    }
    return (
      <div className="slide q-slide">
        <h2 className="present-q-text">{q.text}</h2>
        <div className="present-mean">
          <span className="present-mean-num">{vals.length ? mean.toFixed(1) : "–"}</span>
          <span className="present-mean-label"> / {q.max}</span>
        </div>
        <div className="present-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 24, left: 0, bottom: 16 }}>
              <XAxis dataKey="name" stroke={COLORS.textMuted} tick={{ fontSize: 18 }} />
              <YAxis stroke={COLORS.textMuted} allowDecimals={false} tick={{ fontSize: 14 }} />
              <Tooltip
                contentStyle={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  color: COLORS.text,
                }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS.barColors[i % COLORS.barColors.length]} />
                ))}
                <LabelList dataKey="count" position="top" fill={COLORS.text} fontSize={18} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="present-scale-ends">
          <span>{q.labels[0]}</span>
          <span>{q.labels[1]}</span>
        </div>
      </div>
    );
  }

  const ordered = (q.options || Object.keys(counts))
    .map((opt) => ({ name: opt, count: counts[opt] || 0 }))
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...ordered.map((d) => d.count), 1);

  return (
    <div className="slide q-slide">
      <h2 className="present-q-text">{q.text}</h2>
      {q.subtitle && <p className="present-q-sub">{q.subtitle}</p>}
      <div className="present-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ordered}
            layout="vertical"
            margin={{ top: 8, right: 120, left: 8, bottom: 8 }}
          >
            <XAxis type="number" hide domain={[0, maxCount]} />
            <YAxis
              type="category"
              dataKey="name"
              stroke={COLORS.text}
              width={320}
              tick={{ fontSize: 18, fill: COLORS.text }}
            />
            <Tooltip
              contentStyle={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                color: COLORS.text,
              }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              formatter={(v) => [
                `${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`,
                "Svar",
              ]}
            />
            <Bar dataKey="count" radius={[0, 12, 12, 0]} minPointSize={2}>
              {ordered.map((_, i) => (
                <Cell key={i} fill={COLORS.barColors[i % COLORS.barColors.length]} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                fill={COLORS.text}
                fontSize={20}
                formatter={(v) =>
                  total > 0 ? `${v} (${Math.round((v / total) * 100)}%)` : `${v}`
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

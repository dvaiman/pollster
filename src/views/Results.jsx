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
import { getSurvey, COLORS } from "../lib/survey.js";
import {
  getSessionByCode,
  fetchResponses,
  subscribeToResponses,
  updateSessionStatus,
} from "../lib/api.js";
import { hasSupabaseConfig } from "../lib/supabase.js";

export default function Results() {
  const { code } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [focusIdx, setFocusIdx] = useState(null);
  const [showQR, setShowQR] = useState(true);
  const [groupFilter, setGroupFilter] = useState("__all__");

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
    const unsub = subscribeToResponses(session.id, (row) => {
      setResponses((prev) => {
        if (prev.some((r) => r.id === row.id)) return prev;
        return [...prev, row];
      });
    });
    return unsub;
  }, [session]);

  const surveyUrl = useMemo(() => {
    const origin = window.location.origin + window.location.pathname;
    return `${origin}#/s/${code}`;
  }, [code]);

  const surveyDef = getSurvey(session?.survey_id);
  const groups = session?.audience_groups || [];
  const hasGroups = groups.length > 0;

  const groupCounts = useMemo(() => {
    const m = {};
    responses.forEach((r) => {
      const g = r.answers?._group || "(okänd)";
      m[g] = (m[g] || 0) + 1;
    });
    return m;
  }, [responses]);

  const filteredResponses = useMemo(() => {
    if (!hasGroups || groupFilter === "__all__") return responses;
    return responses.filter((r) => r.answers?._group === groupFilter);
  }, [responses, groupFilter, hasGroups]);

  const n = filteredResponses.length;
  const totalN = responses.length;

  const tally = useCallback(
    (qId) => {
      const counts = {};
      filteredResponses.forEach((r) => {
        const val = r.answers?.[qId];
        if (Array.isArray(val)) {
          val.forEach((v) => {
            counts[v] = (counts[v] || 0) + 1;
          });
        } else if (val !== undefined && val !== null) {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      return counts;
    },
    [filteredResponses]
  );

  const exportCSV = () => {
    const headers = [
      "created_at",
      ...(hasGroups ? ["group"] : []),
      ...surveyDef.questions.map((q) => q.id),
    ];
    const rows = responses.map((r) => {
      const cells = [r.created_at];
      if (hasGroups) cells.push(`"${String(r.answers?._group || "").replace(/"/g, '""')}"`);
      surveyDef.questions.forEach((q) => {
        const v = r.answers?.[q.id];
        if (Array.isArray(v)) cells.push(`"${v.join("; ").replace(/"/g, '""')}"`);
        else if (v === undefined || v === null) cells.push("");
        else cells.push(`"${String(v).replace(/"/g, '""')}"`);
      });
      return cells.join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pollster-${code}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleStatus = async () => {
    if (!session) return;
    const next = session.status === "open" ? "closed" : "open";
    try {
      await updateSessionStatus(session.id, next);
      setSession({ ...session, status: next });
    } catch (e) {
      alert("Kunde inte uppdatera: " + (e.message || ""));
    }
  };

  if (loadError) {
    return (
      <div className="centered">
        <div className="card landing">
          <h2 className="landing-title">Oj</h2>
          <p className="landing-sub">{loadError}</p>
          <Link to="/admin" className="btn secondary">
            Till admin
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

  return (
    <div className="results">
      <header className="results-header">
        <div>
          <h1 className="results-title">{session.name || "Resultat"}</h1>
          <p className="muted small">
            Kod <span className="mono">{session.code}</span> · status:{" "}
            <span className={session.status === "open" ? "pill live" : "pill closed"}>
              {session.status === "open" ? "öppen" : "stängd"}
            </span>
          </p>
        </div>
        <div className="badge">
          <span className="live-dot" />
          {n} svar
        </div>
      </header>

      {showQR && (
        <div className="card qr-card">
          <div className="qr-wrap">
            <QRCodeSVG value={surveyUrl} size={160} bgColor="#ffffff" fgColor="#0a0f1a" />
          </div>
          <div className="qr-info">
            <p className="muted small">Skanna eller gå till</p>
            <p className="mono qr-url">{surveyUrl}</p>
            <p className="muted small">eller ange kod</p>
            <p className="big-code">{session.code}</p>
            <button className="btn ghost small" onClick={() => setShowQR(false)}>
              Dölj QR
            </button>
          </div>
        </div>
      )}
      {!showQR && (
        <button className="btn ghost small" onClick={() => setShowQR(true)}>
          Visa QR igen
        </button>
      )}

      <div className="toolbar">
        <button className="btn primary small" onClick={() => nav(`/p/${code}`)}>
          ▶ Presentationsläge
        </button>
        <button className="btn ghost small" onClick={exportCSV} disabled={totalN === 0}>
          ⬇ Exportera CSV
        </button>
        <button className="btn ghost small" onClick={toggleStatus}>
          {session.status === "open" ? "Stäng enkäten" : "Öppna igen"}
        </button>
      </div>

      {hasGroups && (
        <div className="group-filter">
          <button
            className={"chip" + (groupFilter === "__all__" ? " active" : "")}
            onClick={() => setGroupFilter("__all__")}
          >
            Alla ({totalN})
          </button>
          {groups.map((g) => (
            <button
              key={g}
              className={"chip" + (groupFilter === g ? " active" : "")}
              onClick={() => setGroupFilter(g)}
            >
              {g} ({groupCounts[g] || 0})
            </button>
          ))}
        </div>
      )}

      {totalN === 0 ? (
        <div className="card empty">
          <div className="empty-icon">📊</div>
          <p>Inga svar ännu. Dela koden med din publik!</p>
        </div>
      ) : n === 0 ? (
        <div className="card empty">
          <div className="empty-icon">🔍</div>
          <p>Inga svar i "{groupFilter}" ännu.</p>
        </div>
      ) : (
        surveyDef.questions.map((q, i) => (
          <QuestionResult
            key={q.id}
            q={q}
            counts={tally(q.id)}
            responses={filteredResponses}
            total={n}
            focused={focusIdx === i}
            onFocus={() => setFocusIdx(focusIdx === i ? null : i)}
          />
        ))
      )}
    </div>
  );
}

function QuestionResult({ q, counts, responses, total, focused, onFocus }) {
  if (q.type === "scale") {
    const vals = responses.map((r) => r.answers?.[q.id]).filter((v) => v !== undefined && v !== null);
    const mean = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const data = [];
    for (let v = q.min; v <= q.max; v++) {
      data.push({ name: String(v), count: counts[v] || 0 });
    }
    return (
      <div className={"card result-card" + (focused ? " focused" : "")}>
        <div className="result-head">
          <h3>{q.text}</h3>
          <button className="btn ghost small" onClick={onFocus}>
            {focused ? "Stäng" : "Fokus"}
          </button>
        </div>
        <div className="mean-display">
          <span className="mean-num">{vals.length ? mean.toFixed(1) : "–"}</span>
          <span className="mean-label"> / {q.max}</span>
        </div>
        <ResponsiveContainer width="100%" height={focused ? 360 : 220}>
          <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
            <XAxis dataKey="name" stroke={COLORS.textMuted} />
            <YAxis stroke={COLORS.textMuted} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                color: COLORS.text,
              }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS.barColors[i % COLORS.barColors.length]} />
              ))}
              <LabelList dataKey="count" position="top" fill={COLORS.text} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="scale-ends">
          <span>{q.labels[0]}</span>
          <span>{q.labels[1]}</span>
        </div>
      </div>
    );
  }

  const allOpts = q.options || Object.keys(counts);
  const ordered = allOpts
    .map((opt) => ({ name: opt, count: counts[opt] || 0 }))
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...ordered.map((d) => d.count), 1);

  return (
    <div className={"card result-card" + (focused ? " focused" : "")}>
      <div className="result-head">
        <h3>{q.text}</h3>
        <button className="btn ghost small" onClick={onFocus}>
          {focused ? "Stäng" : "Fokus"}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={focused ? 60 + ordered.length * 52 : 40 + ordered.length * 36}>
        <BarChart
          data={ordered}
          layout="vertical"
          margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
        >
          <XAxis type="number" hide domain={[0, maxCount]} />
          <YAxis
            type="category"
            dataKey="name"
            stroke={COLORS.textMuted}
            width={focused ? 220 : 160}
            tick={{ fontSize: focused ? 14 : 12, fill: COLORS.text }}
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
          <Bar dataKey="count" radius={[0, 8, 8, 0]} minPointSize={2}>
            {ordered.map((_, i) => (
              <Cell key={i} fill={COLORS.barColors[i % COLORS.barColors.length]} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              fill={COLORS.text}
              formatter={(v) =>
                total > 0 ? `${v} (${Math.round((v / total) * 100)}%)` : `${v}`
              }
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

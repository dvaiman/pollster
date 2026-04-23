export const SURVEY = {
  title: "AI och lärande",
  subtitle: "Anonym enkät — 6 korta frågor",
  questions: [
    {
      id: "frequency",
      text: "Hur ofta använder du AI på jobbet eller vid studier?",
      type: "single",
      options: ["Dagligen", "Varje vecka", "Varje månad", "Sällan", "Aldrig"],
    },
    {
      id: "tools",
      text: "Vilka AI-verktyg använder du?",
      subtitle: "Välj alla som gäller",
      type: "multi",
      options: [
        "ChatGPT",
        "Claude",
        "Copilot / Bing Chat",
        "Gemini",
        "NotebookLM",
        "AI-kodningsverktyg (Copilot, Cursor, etc.)",
        "AI-bildgenerering (DALL-E, Midjourney, etc.)",
        "Annat",
        "Inget",
      ],
    },
    {
      id: "purpose",
      text: "Vad använder du AI till?",
      subtitle: "Välj alla som gäller",
      type: "multi",
      exclusiveOption: "Använder inte AI",
      options: [
        "Skrivande / textbearbetning",
        "Kodning / programmering",
        "Litteratursökning",
        "Dataanalys",
        "Undervisning / kursutveckling",
        "Studera",
        "Administration / e-post",
        "Brainstorming / idégenerering",
        "Annat",
        "Använder inte AI",
      ],
    },
    {
      id: "confidence",
      text: "Hur trygg känner du dig med att använda AI i arbetet eller dina studier?",
      type: "scale",
      min: 1,
      max: 5,
      labels: ["Inte alls trygg", "Mycket trygg"],
    },
    {
      id: "learning_impact",
      text: "Hur upplever du att AI påverkar ditt lärande?",
      type: "single",
      options: [
        "Förbättrar tydligt",
        "Förbättrar något",
        "Ingen märkbar påverkan",
        "Försämrar något",
        "Försämrar tydligt",
        "Har inte reflekterat",
      ],
    },
    {
      id: "barriers",
      text: "Vad hindrar dig mest från att använda AI?",
      subtitle: "Välj upp till 2",
      type: "multi",
      maxSelect: 2,
      options: [
        "Osäkerhet kring kvalitet / hallucineringar",
        "Etiska frågor",
        "Brist på tid att lära sig",
        "Policy / regelverk",
        "Integritets- / dataskyddsfrågor",
        "Ser inget behov",
        "Inget hindrar mig",
      ],
    },
  ],
};

export const COLORS = {
  bg: "#0a0f1a",
  card: "#111827",
  border: "#1e2d4a",
  accent: "#3b82f6",
  accentSoft: "rgba(59,130,246,0.12)",
  accentGlow: "rgba(59,130,246,0.25)",
  text: "#e2e8f0",
  textMuted: "#8896b0",
  textDim: "#4a5a78",
  success: "#10b981",
  barColors: [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#f43f5e",
    "#84cc16",
    "#6366f1",
  ],
};

export function generateSessionCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  return pick(letters) + pick(letters) + pick(digits) + pick(digits);
}

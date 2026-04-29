const aiSurvey = {
  id: "ai",
  title: "AI och lärande",
  subtitle: "Anonym enkät — 8 korta frågor",
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
      id: "utility",
      text: "Hur lätt eller svårt tycker du det är att få användbara svar från AI?",
      type: "scale",
      min: 1,
      max: 5,
      labels: ["Mycket svårt", "Mycket lätt"],
    },
    {
      id: "difficulty_aspects",
      text: "Vad är svårast med att använda AI?",
      subtitle: "Om du använder AI — välj alla som gäller",
      type: "multi",
      exclusiveOption: ["Inget upplevs särskilt svårt", "Använder inte AI"],
      options: [
        "Att formulera bra frågor / prompts",
        "Att bedöma om svaret stämmer",
        "Att veta vilka verktyg som passar uppgiften",
        "Att integrera AI i mitt arbetsflöde",
        "Att förstå när AI inte är rätt verktyg",
        "Inget upplevs särskilt svårt",
        "Använder inte AI",
      ],
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

const testSurvey = {
  id: "test",
  title: "Snabbtest",
  subtitle: "För att testa systemet — 3 korta frågor",
  questions: [
    {
      id: "mood",
      text: "Hur är dagen så här långt?",
      type: "scale",
      min: 1,
      max: 5,
      labels: ["Riktigt dålig", "Riktigt bra"],
    },
    {
      id: "today",
      text: "Vilka av dessa har du gjort idag?",
      subtitle: "Välj alla som gäller",
      type: "multi",
      exclusiveOption: "Inget av detta",
      options: [
        "Tränat",
        "Lagat mat",
        "Läst en bok eller artikel",
        "Promenerat ute",
        "Tittat på TV / serie",
        "Pratat med en vän",
        "Inget av detta",
      ],
    },
    {
      id: "season",
      text: "Vilken är din favoritårstid?",
      type: "single",
      options: ["Vår", "Sommar", "Höst", "Vinter"],
    },
  ],
};

const conferenceSurvey = {
  id: "feedback",
  title: "Konferensfeedback",
  subtitle: "Anonym feedback — 5 korta frågor",
  questions: [
    {
      id: "value",
      text: "Hur värdefull var dagen för dig?",
      type: "scale",
      min: 1,
      max: 5,
      labels: ["Inte alls värdefull", "Mycket värdefull"],
    },
    {
      id: "highlights",
      text: "Vilka delar var mest givande?",
      subtitle: "Välj alla som gäller",
      type: "multi",
      exclusiveOption: "Inget särskilt stack ut",
      options: [
        "Föreläsningarna",
        "Workshops / praktiska moment",
        "Paneldiskussioner",
        "Nätverkandet",
        "Pauserna och det sociala",
        "Materialet / handouts",
        "Inget särskilt stack ut",
      ],
    },
    {
      id: "nps",
      text: "Hur sannolikt är det att du rekommenderar dagen till en kollega?",
      type: "scale",
      min: 0,
      max: 10,
      labels: ["Inte alls sannolikt", "Mycket sannolikt"],
    },
    {
      id: "improvements",
      text: "Vad kan förbättras till nästa gång?",
      subtitle: "Välj upp till 3",
      type: "multi",
      maxSelect: 3,
      exclusiveOption: "Inget behöver ändras",
      options: [
        "Mer interaktivitet / publikinteraktion",
        "Fler / längre pauser",
        "Bättre lokal eller teknik",
        "Tydligare program / agenda",
        "Mer praktiska exempel",
        "Mer tid för frågor och diskussion",
        "Bredare ämnesutbud",
        "Inget behöver ändras",
      ],
    },
    {
      id: "length",
      text: "Vad tyckte du om dagens längd?",
      type: "single",
      options: ["För kort", "Lagom", "För lång"],
    },
  ],
};

export const SURVEYS = {
  ai: aiSurvey,
  test: testSurvey,
  feedback: conferenceSurvey,
};

export const DEFAULT_SURVEY_ID = "ai";

export function getSurvey(id) {
  return SURVEYS[id] || SURVEYS[DEFAULT_SURVEY_ID];
}

export const SURVEY_LIST = Object.values(SURVEYS).map((s) => ({
  id: s.id,
  title: s.title,
  questionCount: s.questions.length,
}));

export const SURVEY = aiSurvey;

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

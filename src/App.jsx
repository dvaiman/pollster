import { Outlet, Link } from "react-router-dom";
import { hasSupabaseConfig } from "./lib/supabase.js";

export default function App() {
  return (
    <div className="app">
      {!hasSupabaseConfig && <ConfigBanner />}
      <Outlet />
      <footer className="footer">
        <Link to="/">Start</Link>
        <span>·</span>
        <Link to="/admin">Admin</Link>
      </footer>
    </div>
  );
}

function ConfigBanner() {
  return (
    <div className="config-banner">
      Supabase är inte konfigurerat. Sätt <code>VITE_SUPABASE_URL</code> och{" "}
      <code>VITE_SUPABASE_ANON_KEY</code>. Se README.
    </div>
  );
}

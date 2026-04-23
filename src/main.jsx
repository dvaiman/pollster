import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Landing from "./views/Landing.jsx";
import Survey from "./views/Survey.jsx";
import Results from "./views/Results.jsx";
import Present from "./views/Present.jsx";
import Admin from "./views/Admin.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<Landing />} />
          <Route path="/s/:code" element={<Survey />} />
          <Route path="/r/:code" element={<Results />} />
          <Route path="/p/:code" element={<Present />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
);

import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-400-italic.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/noto-serif-devanagari/devanagari-400.css";
import "./style.css";
import { BrowserRouter } from "react-router-dom";
import SiteRoutes from "./RouterApp";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteRoutes />
    </BrowserRouter>
  </React.StrictMode>,
);

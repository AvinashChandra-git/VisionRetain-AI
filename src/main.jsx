import React from "react";
import { createRoot } from "react-dom/client";
import VisionRetainAI from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <VisionRetainAI />
  </React.StrictMode>
);

import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App.jsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.jsx";

const rootElement = document.getElementById("root");

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>,
  );
} catch (error) {
  rootElement.innerHTML = `
    <main class="react-error">
      <h1>Erro ao iniciar o CardápioNota10</h1>
      <p>${error.message}</p>
    </main>
  `;
}

import React from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

import { App } from "./App.jsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { SubscriptionProvider } from "./contexts/SubscriptionContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Elemento com id "root" não foi encontrado.',
  );
}

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <AuthProvider>
          <SubscriptionProvider>

            <CartProvider>

                <ThemeProvider>

                    <App />

                </ThemeProvider>

            </CartProvider>

        </SubscriptionProvider>

        </AuthProvider>
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
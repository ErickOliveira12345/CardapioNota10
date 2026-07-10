import React, { Component } from "react";

export class AppErrorBoundary extends Component {
  state = {
    error: null,
  };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("[CardapioNota10]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="react-error">
          <h1>Erro ao carregar o CardapioNota10</h1>
          <p>{this.state.error.message}</p>
        </main>
      );
    }

    return this.props.children;
  }
}

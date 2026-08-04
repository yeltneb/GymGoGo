import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Lean Fitness app error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{
          maxWidth: "760px",
          margin: "40px auto",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          background: "white",
          borderRadius: "18px"
        }}>
          <h1>The app encountered an error</h1>
          <p>The page is loading, but one saved record or browser setting caused the dashboard to stop.</p>
          <pre style={{
            whiteSpace: "pre-wrap",
            background: "#f4f6f8",
            padding: "12px",
            borderRadius: "10px"
          }}>{String(this.state.error?.message || this.state.error)}</pre>
          <button
            onClick={() => {
              localStorage.removeItem("lean-fitness-react-data-v1");
              window.location.reload();
            }}
            style={{
              border: 0,
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#1f7a4c",
              color: "white",
              fontWeight: 700
            }}
          >
            Reset app data and reload
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = "<h1 style='font-family:system-ui;padding:24px'>App root element is missing.</h1>";
} else {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

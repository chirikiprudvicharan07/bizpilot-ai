import { Component, ErrorInfo, ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("BizPilot error boundary", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <p>Application error</p>
          <h1>Something needs attention</h1>
          <span>{this.state.message}</span>
        </section>
      </main>
    );
  }
}

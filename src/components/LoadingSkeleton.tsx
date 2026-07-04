import { useEffect, useState } from "react";

export function LoadingSkeleton({ label = "Loading" }: { label?: string }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="auth-shell">
      <section className="auth-card skeleton-card">
        <div className="skeleton-line wide" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
        <p>{label}...</p>
        {slow && (
          <span className="auth-alert">
            Still loading. Refresh once; if this continues, check Firebase Auth domains and Firestore rules.
          </span>
        )}
      </section>
    </main>
  );
}

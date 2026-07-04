import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Bot, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

type AuthMode = "login" | "signup" | "forgot";

export function LandingPage() {
  const { currentUser, businessProfile } = useAuth();
  if (currentUser && businessProfile) return <Navigate to="/dashboard" replace />;
  if (currentUser && !businessProfile) return <Navigate to="/business-setup" replace />;

  return (
    <main className="auth-shell">
      <section className="auth-card hero-auth">
        <div className="brand-mark">
          <Bot size={24} />
        </div>
        <p>BizPilot AI</p>
        <h1>Your first AI employee for every small business.</h1>
        <span>Secure multi-tenant SaaS workspace for autonomous workflows, documents, support, and analytics.</span>
        <div className="auth-actions">
          <Link className="primary-button" to="/signup">Create account</Link>
          <Link className="secondary-button" to="/login">Login</Link>
        </div>
      </section>
    </main>
  );
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { login, signup, googleLogin, resetPassword, currentUser, businessProfile, firebaseConfigured, getAuthErrorMessage } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";
  const authDisabled = !firebaseConfigured;

  if (currentUser && businessProfile) return <Navigate to="/dashboard" replace />;
  if (currentUser && !businessProfile) return <Navigate to="/business-setup" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (authDisabled) {
      setError("Firebase is not configured. Check your .env file and restart the app.");
      return;
    }
    setError("");
    setStatus("");
    try {
      if (isForgot) {
        await resetPassword(email);
        setStatus("Password reset email sent.");
        return;
      }
      if (isSignup) {
        await signup(email, password);
        navigate("/business-setup");
        return;
      }
      await login(email, password);
      navigate("/dashboard");
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    }
  }

  async function continueWithGoogle() {
    setError("");
    try {
      await googleLogin();
      navigate("/business-setup");
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand-mark">
          <ShieldCheck size={23} />
        </div>
        <p>{isForgot ? "Account recovery" : isSignup ? "Create workspace" : "Welcome back"}</p>
        <h1>{isForgot ? "Reset password" : isSignup ? "Start BizPilot AI" : "Login to BizPilot AI"}</h1>
        {!firebaseConfigured && <span className="auth-alert">Firebase env variables are required before live login works. Check VITE_FIREBASE_* in .env and restart Vite.</span>}
        <label className="field">
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        {!isForgot && (
          <label className="field">
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={6} />
          </label>
        )}
        {error && <span className="auth-alert">{error}</span>}
        {status && <span className="auth-success">{status}</span>}
        <button className="primary-button" type="submit">
          <Mail size={16} />
          {isForgot ? "Send reset email" : isSignup ? "Sign up" : "Login"}
        </button>
        {!isForgot && (
          <button className="secondary-button" type="button" onClick={continueWithGoogle}>
            Continue with Google
          </button>
        )}
        <div className="auth-links">
          {!isSignup && !isForgot && <Link to="/signup">Create account</Link>}
          {isSignup && <Link to="/login">Already have an account?</Link>}
          {!isForgot && <Link to="/forgot-password">Forgot password?</Link>}
          {isForgot && <Link to="/login">Back to login</Link>}
        </div>
      </form>
    </main>
  );
}

import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export function BusinessSetupPage() {
  const { currentUser, businessProfile, saveBusinessProfile, profileError } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  if (!currentUser) return <Navigate to="/login" replace />;
  if (businessProfile) return <Navigate to="/dashboard" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const logoUrl = String(formData.get("logoUrl") ?? "").trim();
    try {
      await saveBusinessProfile({
        businessName: String(formData.get("businessName") ?? ""),
        ownerName: String(formData.get("ownerName") ?? ""),
        businessType: String(formData.get("businessType") ?? ""),
        businessEmail: String(formData.get("businessEmail") ?? ""),
        businessPhone: String(formData.get("businessPhone") ?? ""),
        country: String(formData.get("country") ?? "India"),
        currency: String(formData.get("currency") ?? "INR"),
        timeZone: String(formData.get("timeZone") ?? "Asia/Kolkata"),
        logoUrl: logoUrl.startsWith("http://") || logoUrl.startsWith("https://") ? logoUrl : "",
      });
      navigate("/dashboard");
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Unable to save business profile.");
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card setup-card" onSubmit={submit}>
        <div className="brand-mark">
          <Bot size={23} />
        </div>
        <p>Business setup</p>
        <h1>Create your secure workspace</h1>
        {profileError && <span className="auth-alert">{profileError}</span>}
        <div className="setup-grid">
          <label className="field"><span>Business Name</span><input name="businessName" required /></label>
          <label className="field"><span>Owner Name</span><input name="ownerName" required /></label>
          <label className="field"><span>Business Type</span><input name="businessType" required placeholder="Retail, Healthcare, Sales..." /></label>
          <label className="field"><span>Business Email</span><input name="businessEmail" type="email" required defaultValue={currentUser.email ?? ""} /></label>
          <label className="field"><span>Business Phone</span><input name="businessPhone" required /></label>
          <label className="field"><span>Country</span><input name="country" defaultValue="India" required /></label>
          <label className="field"><span>Currency</span><input name="currency" defaultValue="INR" required /></label>
          <label className="field"><span>Time Zone</span><input name="timeZone" defaultValue="Asia/Kolkata" required /></label>
          <label className="field wide-field"><span>Store Logo URL</span><input name="logoUrl" placeholder="https://..." /></label>
        </div>
        {error && <span className="auth-alert">{error}</span>}
        <button className="primary-button" type="submit">Save business profile</button>
      </form>
    </main>
  );
}

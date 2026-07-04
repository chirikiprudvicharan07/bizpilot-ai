import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth, db, firebaseDiagnostics, firebaseReady, googleProvider, logFirebaseDiagnostics } from "../firebase/config";

export type BusinessProfile = {
  businessId: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  businessEmail: string;
  businessPhone: string;
  country: string;
  currency: string;
  timeZone: string;
  logoUrl: string;
  plan: string;
};

type AuthContextValue = {
  currentUser: User | null;
  businessProfile: BusinessProfile | null;
  loading: boolean;
  profileError: string;
  firebaseConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  saveBusinessProfile: (profile: Omit<BusinessProfile, "businessId" | "plan">) => Promise<void>;
  refreshBusinessProfile: (userId?: string) => Promise<BusinessProfile | null>;
  getAuthErrorMessage: (error: unknown) => string;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const authBootstrapTimeoutMs = 10000;
const profileLoadTimeoutMs = 10000;
const profileSaveTimeoutMs = 10000;

function localProfileKey(userId: string) {
  return `bizpilot-ai-business-profile-${userId}`;
}

function readLocalProfile(userId: string) {
  try {
    const saved = localStorage.getItem(localProfileKey(userId));
    return saved ? (JSON.parse(saved) as BusinessProfile) : null;
  } catch {
    return null;
  }
}

function writeLocalProfile(userId: string, profile: BusinessProfile) {
  localStorage.setItem(localProfileKey(userId), JSON.stringify(profile));
}

function businessProfileRef(userId: string) {
  if (!db) throw new Error("Firebase is not configured.");
  return doc(db, "businesses", userId, "profile", "details");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  async function refreshBusinessProfile(userId = currentUser?.uid) {
    if (!userId) return null;
    setProfileError("");
    const localProfile = readLocalProfile(userId);
    if (localProfile) {
      setBusinessProfile(localProfile);
    }
    try {
      const snapshot = await Promise.race([
        getDoc(businessProfileRef(userId)),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("Business profile request timed out.")), profileLoadTimeoutMs);
        }),
      ]);
      if (!snapshot.exists()) {
        setBusinessProfile(null);
        return null;
      }
      const profile = snapshot.data() as BusinessProfile;
      setBusinessProfile(profile);
      writeLocalProfile(userId, profile);
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load business profile.";
      console.error("[Firebase] Business profile load failed", {
        message,
        userId,
        projectId: firebaseDiagnostics.projectId,
      });
      if (localProfile) {
        setBusinessProfile(localProfile);
        setProfileError(`${message} Using saved local business profile.`);
        return localProfile;
      }
      setBusinessProfile(null);
      setProfileError(`${message} You can continue to Business Setup or check Firestore rules.`);
      return null;
    }
  }

  useEffect(() => {
    logFirebaseDiagnostics();
    if (!auth) {
      setLoading(false);
      return;
    }
    let authResolved = false;
    const timeoutId = window.setTimeout(() => {
      if (authResolved) return;
      console.error("[Firebase Auth] Auth bootstrap timed out", {
        timeoutMs: authBootstrapTimeoutMs,
        projectId: firebaseDiagnostics.projectId,
      });
      setProfileError("Unable to load business data. Please check your internet connection or Firebase configuration.");
      setLoading(false);
    }, authBootstrapTimeoutMs);
    void setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("[Firebase Auth] Unable to set local persistence", error);
    });
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      authResolved = true;
      window.clearTimeout(timeoutId);
      try {
        setCurrentUser(user);
        if (user) {
          await refreshBusinessProfile(user.uid);
        } else {
          setBusinessProfile(null);
          setProfileError("");
        }
      } catch (error) {
        console.error("[Firebase Auth] Auth bootstrap failed", error);
        setBusinessProfile(null);
        setProfileError("Auth loaded, but business profile bootstrap failed.");
      } finally {
        setLoading(false);
      }
    });
    return () => {
      authResolved = true;
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    if (!auth) throw new Error("Firebase env variables are required before login works.");
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email: string, password: string) {
    if (!auth) throw new Error("Firebase env variables are required before signup works.");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async function googleLogin() {
    if (!auth) throw new Error("Firebase env variables are required before Google sign-in works.");
    console.info("[Firebase Auth] Starting Google sign-in popup", {
      authDomain: firebaseDiagnostics.authDomain,
      currentHostname: firebaseDiagnostics.currentHostname,
    });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
  }

  async function resetPassword(email: string) {
    if (!auth) throw new Error("Firebase env variables are required before password reset works.");
    await sendPasswordResetEmail(auth, email);
  }

  async function saveBusinessProfile(profile: Omit<BusinessProfile, "businessId" | "plan">) {
    if (!currentUser) throw new Error("You must be logged in to create a business.");
    const payload: BusinessProfile = {
      ...profile,
      businessId: currentUser.uid,
      plan: "Starter",
    };
    writeLocalProfile(currentUser.uid, payload);
    try {
      await Promise.race([
        setDoc(businessProfileRef(currentUser.uid), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("Business profile save timed out.")), profileSaveTimeoutMs);
        }),
      ]);
      setProfileError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save business profile to Firestore.";
      console.error("[Firebase] Business profile save failed; using local fallback", {
        message,
        userId: currentUser.uid,
        projectId: firebaseDiagnostics.projectId,
      });
      setProfileError(`${message} Saved locally for this browser. Check Firestore rules for cloud sync.`);
    }
    setBusinessProfile(payload);
  }

  function getAuthErrorMessage(error: unknown) {
    const code = error instanceof FirebaseError ? error.code : "";
    console.error("[Firebase Auth] Authentication error", {
      code,
      error,
      authDomain: firebaseDiagnostics.authDomain,
      currentHostname: firebaseDiagnostics.currentHostname,
      projectId: firebaseDiagnostics.projectId,
    });

    if (code === "auth/unauthorized-domain") {
      return `Google Sign-In is blocked because "${firebaseDiagnostics.currentHostname}" is not authorized in Firebase. Add "${firebaseDiagnostics.currentHostname}", "localhost", and "127.0.0.1" in Firebase Console > Authentication > Settings > Authorized domains.`;
    }
    if (code === "auth/popup-closed-by-user") return "Google sign-in popup was closed before completing.";
    if (code === "auth/popup-blocked") return "Your browser blocked the Google sign-in popup. Allow popups and try again.";
    if (code === "auth/operation-not-allowed") return "This sign-in method is disabled. Enable Email/Password and Google in Firebase Console > Authentication > Sign-in method.";
    if (code === "auth/invalid-api-key") return "Firebase API key is invalid. Check VITE_FIREBASE_API_KEY in .env and restart Vite.";
    if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
      return "Invalid email or password.";
    }
    if (code === "auth/email-already-in-use") return "An account already exists for this email. Try logging in.";
    if (code === "auth/weak-password") return "Password should be at least 6 characters.";
    return error instanceof Error ? error.message : "Authentication failed. Check the browser console for Firebase diagnostics.";
  }

  const value = useMemo(
    () => ({
      currentUser,
      businessProfile,
      loading,
      profileError,
      firebaseConfigured: firebaseReady,
      login,
      signup,
      logout,
      googleLogin,
      resetPassword,
      saveBusinessProfile,
      refreshBusinessProfile,
      getAuthErrorMessage,
    }),
    [currentUser, businessProfile, loading, profileError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

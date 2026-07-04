import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

function envValue(key: string) {
  const raw = String(import.meta.env[key] ?? "").trim();
  return raw.replace(/^\"(.*)\"$/, "$1").replace(/^\'(.*)\'$/, "$1");
}

const firebaseConfig = {
  apiKey: envValue("VITE_FIREBASE_API_KEY"),
  authDomain: envValue("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: envValue("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: envValue("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: envValue("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: envValue("VITE_FIREBASE_APP_ID"),
};

const requiredEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

export const firebaseDiagnostics = {
  missingEnvKeys: requiredEnvKeys.filter((key) => !envValue(key)),
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  currentHostname: typeof window === "undefined" ? "" : window.location.hostname,
  requiredAuthorizedDomains: ["localhost", "127.0.0.1"],
};

export const firebaseReady = firebaseDiagnostics.missingEnvKeys.length === 0;
export const app = firebaseReady ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

export function logFirebaseDiagnostics() {
  if (!firebaseReady) {
    console.error("[Firebase] Missing required Vite environment variables:", firebaseDiagnostics.missingEnvKeys);
    return;
  }

  console.info("[Firebase] Initialized", {
    authDomain: firebaseDiagnostics.authDomain,
    projectId: firebaseDiagnostics.projectId,
    currentHostname: firebaseDiagnostics.currentHostname,
  });

  if (["localhost", "127.0.0.1"].includes(firebaseDiagnostics.currentHostname)) {
    console.info(
      "[Firebase] For Google Sign-In, add both localhost and 127.0.0.1 in Firebase Console > Authentication > Settings > Authorized domains.",
    );
  }
}

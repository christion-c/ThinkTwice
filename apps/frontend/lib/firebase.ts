import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApp, getApps } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value.trim().length > 0);

const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

const auth: Auth | null =
  app === null
    ? null
    : Platform.OS === "web"
      ? getAuth(app)
      : (() => {
          try {
            return initializeAuth(app, {
              persistence: getReactNativePersistence(AsyncStorage),
            });
          } catch {
            return getAuth(app);
          }
        })();

export { app, auth, isFirebaseConfigured };

import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_FIREBASE,
  authDomain: "comments-444aa.firebaseapp.com",
  projectId: "comments-444aa",
  storageBucket: "comments-444aa.firebasestorage.app",
  messagingSenderId: "409485594249",
  appId: "1:409485594249:web:e50f08c56c2ea0c9ad0058",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = getAuth(app);
} catch (error) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
const db = getFirestore(app);

export { app, auth, db };

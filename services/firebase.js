import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBGaK_8wE-J3Fl4AJKHURvEPa2q55EG12M",
  authDomain: "commentsapp-64ffe.firebaseapp.com",
  projectId: "commentsapp-64ffe",
  storageBucket: "commentsapp-64ffe.firebasestorage.app",
  messagingSenderId: "972331484966",
  appId: "1:972331484966:web:d0e8113ea045e414b8e3e7",
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

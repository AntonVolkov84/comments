import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAvz30STku4TmOb8MBf_tc0Ouy1lbUDKRc",
  authDomain: "comments-54327.firebaseapp.com",
  projectId: "comments-54327",
  storageBucket: "comments-54327.firebasestorage.app",
  messagingSenderId: "920002934295",
  appId: "1:920002934295:web:6bf1e84f1248ca68c98e52",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

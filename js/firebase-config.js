/**
 * Firebase Core Configuration & SDK Export (npm version)
 */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCLqPxXwWDo5tBVdFdx4Xi8UevFxELsa-8",
  authDomain: "pulse-94ce6.firebaseapp.com",
  projectId: "pulse-94ce6",
  storageBucket: "pulse-94ce6.firebasestorage.app",
  messagingSenderId: "60831761823",
  appId: "1:60831761823:web:2a0e9339c2315f760ba9aa",
  measurementId: "G-ZR1B5HK1XL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // <-- Ready to use in your auth.js file!
export const db = getFirestore(app);
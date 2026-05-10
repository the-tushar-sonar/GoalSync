// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsZbbuE0_b8I_Y9aiZeeEMhAivViB-jCM",
  authDomain: "habit-tracker-44117.firebaseapp.com",
  projectId: "habit-tracker-44117",
  storageBucket: "habit-tracker-44117.firebasestorage.app",
  messagingSenderId: "788558714585",
  appId: "1:788558714585:web:31d19e5656009e859a50c8",
  measurementId: "G-JH9NSXKEP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
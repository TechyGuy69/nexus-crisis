import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyClgrc8uRnCJHd-iAPQUwCmvX9mG65GDRg",
  authDomain: "nexus-crisis.firebaseapp.com",
  projectId: "nexus-crisis",
  storageBucket: "nexus-crisis.firebasestorage.app",
  messagingSenderId: "1018597009828",
  appId: "1:1018597009828:web:617186c250c3217709f931"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const ADMIN_EMAIL = "admin@byteclubhotel.com";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut // <-- Adicione esta linha
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCZcryxHiigr38H2MwZzpErPi9WTcPHZeo",
  authDomain: "cadclientes-ddeaa.firebaseapp.com",
  projectId: "cadclientes-ddeaa",
  storageBucket: "cadclientes-ddeaa.firebasestorage.app",
  messagingSenderId: "749013136568",
  appId: "1:749013136568:web:3bee342ef85ed0f346b04d"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const signOutUser = signOut;
export const googleProvider = new GoogleAuthProvider();
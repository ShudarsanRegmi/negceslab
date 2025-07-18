import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCCVEETr4pGtS1Oj_Hr3aMoYv114x00F8k",
  authDomain: "negces-lab-dd56e.firebaseapp.com",
  projectId: "negces-lab-dd56e",
  storageBucket: "negces-lab-dd56e.firebasestorage.app",
  messagingSenderId: "863017431581",
  appId: "1:863017431581:web:07f564a3fc3f5bdd61ccf4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app; 
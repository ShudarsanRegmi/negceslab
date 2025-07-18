import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBmvgz3SKbUstV9YhmY5CnUcvtwvxK4P6E",
  authDomain: "negsus-lab-tracking.firebaseapp.com",
  projectId: "negsus-lab-tracking",
  storageBucket: "negsus-lab-tracking.firebasestorage.app",
  messagingSenderId: "981124930506",
  appId: "1:981124930506:web:959def503cd8fff6e3cd33"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app; 
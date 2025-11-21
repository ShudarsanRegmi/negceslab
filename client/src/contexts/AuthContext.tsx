import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, UserCredential } from "firebase/auth";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { authAPI } from "../services/api";

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  reloadUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (user: User) => {
    try {
      console.log('Fetching user profile for:', user.email);
      const token = await user.getIdToken();
      const response = await authAPI.getProfile();
      console.log('User profile response:', response.data);
      setUserRole(response.data.role);
      console.log('User role set to:', response.data.role);
    } catch (error: any) {
      console.error("Error fetching user role:", error);
      console.error("Error response:", error.response?.data);
      if (error.response?.status === 404) {
        console.log("User not registered in backend yet");
        setUserRole(null);
      } else {
        console.error("Unexpected error fetching user profile:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('Starting registration for:', email);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase user created:', user.uid);

      // Send verification email immediately after registration
      await sendEmailVerification(user);
      console.log('Verification email sent to:', email);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const token = await user.getIdToken();
      console.log('Got Firebase token, length:', token.length);

      await authAPI.register({ name, email });
      console.log('Backend registration successful');

      await fetchUserProfile(user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    if (currentUser && !currentUser.emailVerified) {
      await sendEmailVerification(currentUser);
    } else {
      throw new Error('No user logged in or email already verified');
    }
  };

  const reloadUser = async () => {
    if (currentUser) {
      await reload(currentUser);
    }
  };

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Extract name from Google profile
      const name = user.displayName || user.email?.split('@')[0] || '';
      
      // Register in backend if needed
      try {
        await authAPI.register({ name, email: user.email || '' });
      } catch (error: any) {
        // Ignore if user already exists
        if (error.response?.status !== 400) {
          throw error;
        }
      }
      
      await fetchUserProfile(user);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const loginWithMicrosoft = async () => {
    try {
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const { user } = await signInWithPopup(auth, provider);
      
      // Extract name from Microsoft profile
      const name = user.displayName || user.email?.split('@')[0] || '';
      
      // Register in backend if needed
      try {
        await authAPI.register({ name, email: user.email || '' });
      } catch (error: any) {
        // Ignore if user already exists
        if (error.response?.status !== 400) {
          throw error;
        }
      }
      
      await fetchUserProfile(user);
    } catch (error) {
      console.error('Microsoft login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    userRole,
    login,
    register,
    loginWithGoogle,
    loginWithMicrosoft,
    logout,
    sendVerificationEmail,
    sendPasswordReset,
    reloadUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

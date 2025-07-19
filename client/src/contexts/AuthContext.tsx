import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, UserCredential } from "firebase/auth";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { authAPI } from "../services/api";

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
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
      // If user is not found (404), they might not be registered yet
      if (error.response?.status === 404) {
        console.log("User not registered in backend yet");
        setUserRole(null);
      } else {
        // For other errors, don't set role to null as it might be a temporary issue
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

      // Wait a moment for Firebase to fully set the user
      await new Promise(resolve => setTimeout(resolve, 1000));

      const token = await user.getIdToken();
      console.log('Got Firebase token, length:', token.length);

      // Register user in our backend
      console.log('Calling backend registration...');
      await authAPI.register({ name, email });
      console.log('Backend registration successful');

      // Fetch user profile to get role
      await fetchUserProfile(user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    userRole,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

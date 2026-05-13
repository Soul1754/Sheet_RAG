"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  joinedDate: string;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("app-user");
    const savedAuth = localStorage.getItem("app-is-logged-in");
    
    if (savedAuth === "true" && savedUser) {
      try {
        let userData = JSON.parse(savedUser);
        // Fix legacy John Doe placeholder
        if (userData.name === "John Doe" && userData.email) {
          const extractedName = userData.email.split('@')[0];
          userData.name = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
        }
        setUser(userData);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      if (isLoggedIn && user) {
        localStorage.setItem("app-user", JSON.stringify(user));
        localStorage.setItem("app-is-logged-in", "true");
      } else {
        localStorage.removeItem("app-user");
        localStorage.setItem("app-is-logged-in", "false");
      }
    }
  }, [user, isLoggedIn, isInitialized]);

  const login = (email: string, name: string) => {
    setUser({
      name,
      email,
      plan: "pro",
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
    setIsLoggedIn(true);
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <UserContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

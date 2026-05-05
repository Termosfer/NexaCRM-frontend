/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import type { AuthContextType, AuthUser } from "../types";


// ==========================================
// 2. CONTEXT
// ==========================================
const AuthContext = createContext<AuthContextType | null>(null);

// ==========================================
// 3. PROVIDER
// ==========================================
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [user, setUser] = useState<AuthUser | null>(
    JSON.parse(localStorage.getItem("user") || "null"),
  );

  const login = (newToken: string, userData: AuthUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pref_sector"); // Çıxış edəndə sektor seçimini də təmizlə
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// 4. HOOK
// ==========================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth mütləq AuthProvider daxilində işlədilməlidir");
  return context;
};

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("evoting_token");
    const storedUser = localStorage.getItem("evoting_user");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        const res = await API.get("/auth/me");
        setUser(res.data.data);
        localStorage.setItem("evoting_user", JSON.stringify(res.data.data));
      } catch {
        localStorage.removeItem("evoting_token");
        localStorage.removeItem("evoting_user");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (username, password) => {
    const res = await API.post("/auth/login", { username, password });
    const { token, data } = res.data;
    localStorage.setItem("evoting_token", token);
    localStorage.setItem("evoting_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("evoting_token");
    localStorage.removeItem("evoting_user");
    setUser(null);
  };

  const updateUser = (newData) => {
    const updated = { ...user, ...newData };
    setUser(updated);
    localStorage.setItem("evoting_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

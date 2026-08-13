import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import { socket } from "../socket/socket.js";

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("dms_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readStoredToken = () => {
  try {
    return localStorage.getItem("dms_token") || null;
  } catch {
    return null;
  }
};

const readStoredRefreshToken = () => {
  try {
    return localStorage.getItem("dms_refresh_token") || null;
  } catch {
    return null;
  }
};

const getAuthErrorMessage = (err) => {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }

  if (!err?.response) {
    return "Unable to connect to the server. Please try again in a moment.";
  }

  return err?.message || "Login failed";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser());
  const [token, setToken] = useState(readStoredToken());
  const [loading, setLoading] = useState(false);
  // Track whether the initial auth check from localStorage is done
  const [initialized, setInitialized] = useState(false);

  const [publicConfig, setPublicConfig] = useState({
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
    githubClientId: import.meta.env.VITE_GITHUB_CLIENT_ID || "",
  });

  // On mount, verify stored auth is valid and fetch public runtime config
  useEffect(() => {
    const storedUser = readStoredUser();
    const storedToken = readStoredToken();

    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
      // Connect socket with stored token
      socket.auth = { token: storedToken };
      if (!socket.connected) {
        socket.connect();
      }
    }
    setInitialized(true);

    api
      .get("/config/public")
      .then(({ data }) => {
        if (data) {
          setPublicConfig((prev) => ({
            googleClientId: data.googleClientId || prev.googleClientId,
            githubClientId: data.githubClientId || prev.githubClientId,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", credentials);
      setUser(data.user);
      setToken(data.accessToken || data.token);
      localStorage.setItem("dms_user", JSON.stringify(data.user));
      localStorage.setItem("dms_token", data.accessToken || data.token);
      if (data.refreshToken) {
        localStorage.setItem("dms_refresh_token", data.refreshToken);
      }
      socket.auth = { token: data.accessToken || data.token };
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
      return { ok: true, user: data.user };
    } catch (err) {
      return {
        ok: false,
        message: getAuthErrorMessage(err),
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("dms_user");
    localStorage.removeItem("dms_token");
    localStorage.removeItem("dms_refresh_token");
    socket.auth = {};
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  };

  const externalLogin = async (endpoint, payload) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/${endpoint}`, payload);
      setUser(data.user);
      setToken(data.accessToken || data.token);
      localStorage.setItem("dms_user", JSON.stringify(data.user));
      localStorage.setItem("dms_token", data.accessToken || data.token);
      if (data.refreshToken) {
        localStorage.setItem("dms_refresh_token", data.refreshToken);
      }
      socket.auth = { token: data.accessToken || data.token };
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
      return { ok: true, user: data.user };
    } catch (err) {
      return {
        ok: false,
        message: getAuthErrorMessage(err),
      };
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, token, login, externalLogin, logout, loading, initialized, publicConfig }),
    [user, token, loading, initialized, publicConfig]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuthResponse, ApiError, UserProfile } from "../types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

interface SignInPayload {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
  apiRequest: <T>(path: string, init?: RequestInit) => Promise<T>;
  fetchWithAuth: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseError = async (response: Response) => {
  try {
    const data = (await response.json()) as ApiError;
    const details = data.details ?? [];
    return details.length > 0 ? `${data.message} ${details.join(" ")}` : data.message;
  } catch {
    return "Request failed.";
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  const applyAuthResponse = useCallback((payload: AuthResponse) => {
    accessTokenRef.current = payload.accessToken;
    setAccessToken(payload.accessToken);
    setUser(payload.user);
  }, []);

  const refreshSession = useCallback(async () => {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      accessTokenRef.current = null;
      setAccessToken(null);
      setUser(null);
      return null;
    }

    const payload = (await response.json()) as AuthResponse;
    applyAuthResponse(payload);
    return payload;
  }, [applyAuthResponse]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await refreshSession();
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [refreshSession]);

  const signIn = useCallback(
    async (payload: SignInPayload) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      applyAuthResponse((await response.json()) as AuthResponse);
    },
    [applyAuthResponse]
  );

  const signOut = useCallback(async () => {
    await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
    accessTokenRef.current = null;
    setAccessToken(null);
    setUser(null);
  }, []);

  const fetchWithAuth = useCallback(
    async (path: string, init?: RequestInit) => {
      const execute = async (token: string | null) =>
        fetch(`${apiBaseUrl}${path}`, {
          ...init,
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init?.body ? { "Content-Type": "application/json" } : {}),
            ...(init?.headers ?? {})
          }
        });

      let activeToken = accessTokenRef.current;
      let response = await execute(activeToken);

      if (response.status === 401) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        activeToken = refreshed.accessToken;
        response = await execute(activeToken);
      }

      if (response.status === 401) {
        accessTokenRef.current = null;
        setAccessToken(null);
        setUser(null);
        throw new Error("Your session has expired. Please sign in again.");
      }

      return response;
    },
    [refreshSession]
  );

  const apiRequest = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      const response = await fetchWithAuth(path, init);
      if (!response.ok) {
        throw new Error(await parseError(response));
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    },
    [fetchWithAuth]
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      signIn,
      signOut,
      apiRequest,
      fetchWithAuth
    }),
    [user, accessToken, loading, signIn, signOut, apiRequest, fetchWithAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
};

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@repo/types";

import { AUTH_STORAGE_KEY } from "@/lib/utils";

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

const initial: AuthState = { token: null, user: null };

function readStored(): AuthState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    if (typeof parsed.token === "string" && parsed.user) {
      const stored = parsed.user;
      const role =
        (stored.role as string) === "admin" ? "super_admin" : stored.role;
      return { token: parsed.token, user: { ...stored, role } as AuthUser };
    }
    return initial;
  } catch {
    return initial;
  }
}

function persist(state: AuthState) {
  if (typeof window === "undefined") return;
  if (state.token && state.user) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: readStored(),
  reducers: {
    hydrate: () => readStored(),
    setCredentials(
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>,
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      persist(state);
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      persist(state);
    },
    logout(state) {
      state.token = null;
      state.user = null;
      persist(state);
    },
  },
});

export const { hydrate, setCredentials, setUser, logout } = authSlice.actions;
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;

export default authSlice.reducer;
import {
  Action,
  configureStore,
  createListenerMiddleware,
  isAnyOf,
  type ThunkAction,
} from "@reduxjs/toolkit";

import authReducer, { logout, setCredentials } from "@/features/auth/authSlice";
import { baseApi } from "@/features/api";

// Cached responses belong to the account that fetched them. Switching accounts
// (login/register/logout) must drop them, otherwise the next session renders
// the previous role's payload — e.g. the customer's analytics overview, which
// has no `topVendors`, crashing the admin dashboard.
const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  matcher: isAnyOf(setCredentials, logout),
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(baseApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      baseApi.middleware,
      authListenerMiddleware.middleware,
    ),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;

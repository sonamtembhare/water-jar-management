"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";

import { store } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  const [instance] = useState(() => store);
  return <Provider store={instance}>{children}</Provider>;
}
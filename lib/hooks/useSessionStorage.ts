"use client";

import { useState } from "react";

export function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  const setStoredValue = (val: T) => {
    setValue(val);
    sessionStorage.setItem(key, JSON.stringify(val));
  };

  const removeStoredValue = () => {
    sessionStorage.removeItem(key);
    setValue(initialValue);
  };

  return [value, setStoredValue, removeStoredValue] as const;
}

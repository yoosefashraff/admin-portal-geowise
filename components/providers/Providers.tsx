'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
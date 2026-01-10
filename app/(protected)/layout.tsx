'use client';

import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import {useAuthStore} from "@/lib/store/authStore";
import {useEffect, useState} from "react";
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/lib/actions/auth.actions';
import { cn } from '@/lib/utils';

export default function ProtectedLayout({children}: {children: React.ReactNode;}) {

  const { cookie, user, isAuthenticated, isLoading } = useAuthStore();
  const { logout, checkAuth, setUser } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Wait for Zustand store to rehydrate from localStorage
    if (isLoading) return;

    // If no cookie at all, redirect to login
    if (!cookie) {
      router.replace('/login');
      return;
    }

    // If we have a cookie, verify it's still valid with the server
    if (cookie && !isChecking) {
      setIsChecking(true);
      const verifyAuth = async () => {
        try {
          const response = await getCurrentUserAction();
          if (response.Status === 201 && response.Object) {
            // Auth is valid - restore user if missing
            if (!user) {
              setUser({ 
                UserID: 0, 
                UserName: response.Object, 
                UserType: '', 
                UserEmail: '', 
                Image: 'admin', 
                FullName: response.Object, 
                IsAuthenticated: true 
              });
            }
          } else {
            // Cookie is invalid, clear everything
            logout();
            router.replace('/login');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          logout();
          router.replace('/login');
        } finally {
          setIsChecking(false);
        }
      };
      verifyAuth();
    }
  }, [cookie, user, isLoading, router, logout, setUser, isChecking]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!cookie) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Content */}
        {children}
      </main>
    </div>
  );
}
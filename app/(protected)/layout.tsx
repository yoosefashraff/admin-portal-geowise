'use client';

import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import {useAuthStore} from "@/lib/store/authStore";
import {useEffect, useState} from "react";
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/lib/actions/auth.actions';
import { cn } from '@/lib/utils';

export default function ProtectedLayout({children}: {children: React.ReactNode;}) {

  const { cookie, isLoading } = useAuthStore();
  const { logout } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Wait for initial load to complete
    if (isLoading) return;

    // If no cookie, redirect to login
    if (!cookie) {
      router.replace('/login');
      return;
    }

    // Check authentication with server
    const checkAuth = async () => {
      if (isChecking) return;
      setIsChecking(true);
      
      try {
        const response = await getCurrentUserAction();
        if(response.Status !== 201){
          logout();
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [cookie, isLoading, router, logout, isChecking]);

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
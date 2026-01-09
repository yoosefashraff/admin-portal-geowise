'use client';

import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import {useAuthStore} from "@/lib/store/authStore";
import {useEffect} from "react";
import { useRouter } from 'next/navigation';
import { getCurrentUserAction } from '@/lib/actions/auth.actions';
import { cn } from '@/lib/utils';

export default function ProtectedLayout({children}: {children: React.ReactNode;}) {

  const { cookie, isLoading } = useAuthStore.getState();
  const { logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !cookie) {
      router.replace('/login');
    }else{
      const getCurrentUser = async () => {
        const response = await getCurrentUserAction();
        if(response.Status !== 201){
          logout();
          router.replace('/login');
        }
      }
      getCurrentUser();
    }
  }, [cookie, isLoading, router, logout]);

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
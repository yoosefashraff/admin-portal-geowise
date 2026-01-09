'use client';

import {cn} from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  className?: string
}

export function DashboardHeader({ title, description, className }: DashboardHeaderProps) {
    return (
        <div className={cn("mb-4 sm:mb-6 lg:mb-8", className)}>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1 animate-fade-in-up">{title}</h1>
            {description && (
              <p className="text-sm sm:text-base text-gray-500 animate-fade-in animate-delay-100">{description}</p>
            )}
          </div>
        </div>
    );
}
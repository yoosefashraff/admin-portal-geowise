'use client';

import {cn} from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  className?: string
}

export function DashboardHeader({ title, description, className }: DashboardHeaderProps) {
    return (
        <div className={cn("mb-8", className)}>
          <div className="flex-1">
            <h1 className="text-3xl font-medium text-gray-900 mb-1">{title}</h1>
            {description && (
              <p className="text-gray-500">{description}</p>
            )}
          </div>
        </div>
    );
}
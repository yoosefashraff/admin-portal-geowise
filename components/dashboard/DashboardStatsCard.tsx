'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function DashboardStatsCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  trend,
  className,
}: DashboardStatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Use color only for status indicators, not backgrounds
  const accentColor = {
    default: 'text-gray-500',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    info: 'text-gray-500',
  }[variant];

  // Animate number counting when component is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || typeof value !== 'number') {
      setDisplayValue(typeof value === 'number' ? value : 0);
      return;
    }

    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextValue = Math.min(Math.round(increment * currentStep), value);
      setDisplayValue(nextValue);

      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <Card 
      ref={cardRef}
      className={cn('bg-white border-0 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 hover:shadow-lg', className)}
      style={{
        boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
      }}
    >
      <CardContent className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex flex-col">
          {/* Icon at top left */}
          <div className="flex-shrink-0 mb-1 sm:mb-1.5">
            <div className="p-1 sm:p-1.5 rounded-md bg-gray-50 w-fit transition-transform duration-300 hover:scale-110">
              <Icon className={cn('w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all duration-300', accentColor)} />
            </div>
          </div>
          
          {/* Title and number on same row */}
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 leading-tight flex-1 min-w-0 truncate pr-1">{title}</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-none flex-shrink-0 transition-all duration-300">
              {typeof value === 'number' ? displayValue.toLocaleString() : value}
            </p>
          </div>
          
          {/* Trend below if present */}
          {trend && (
            <p className={cn('text-[10px] sm:text-xs font-medium mt-0.5 animate-fade-in', trend.value >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

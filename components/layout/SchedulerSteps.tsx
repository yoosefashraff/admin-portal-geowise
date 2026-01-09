'use client';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  label: string;
}

interface SchedulerStepsProps {
  currentStep: number;
}

export function SchedulerSteps({ currentStep }: SchedulerStepsProps) {

  const steps = [
    { num: 1, label: 'Select service'},
    { num: 2, label: 'Enter location'},
    { num: 3, label: 'Assign provider' },
    { num: 4, label: 'Choose date/time'},
    { num: 5, label: 'Assign client'},
  ];

  return (
    <div className="mb-6 sm:mb-7">
      <div className="flex items-center justify-between overflow-x-auto py-4 scrollbar-hide px-21">
        {steps.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center min-w-[60px] sm:min-w-0 flex-shrink-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm sm:text-lg font-semibold mb-2 sm:mb-3",
                  step.num <= currentStep
                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/50"
                    : "border-1 border-gray-300 font-normal bg-transparent text-gray-300"
                )}
              >
                {step.num}
              </div>
              <span className={
                cn("text-[10px] sm:text-sm font-medium text-center leading-tight px-1",
                step.num <= currentStep
                ? "text-gray-900"
                : "text-gray-300"
                )
                }>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
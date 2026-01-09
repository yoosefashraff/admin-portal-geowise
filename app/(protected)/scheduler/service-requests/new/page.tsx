'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Step1Form from '@/components/service-requests/Step1Form';
import Step2Form from '@/components/service-requests/Step2Form';
import Step3Form from '@/components/service-requests/Step3Form';

export interface ServiceRequestFormData {
  // Step 1
  name: string;
  phoneNumber: string;
  countryCode: string;
  location: string;
  service: string;
  recurringPeriod: string;
  expiryDate: string;
  
  // Step 2
  credits: number;
  approvedCredits: number;
  usedCredits: number;
  remainingCredits: number;
  notes: string;
  startTime: string;
  endTime: string;
  
  // Step 3
  preferredStaff: string[];
  preferredDays: string[];
}

export default function NewServiceRequestPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ServiceRequestFormData>>({});

  const handleStep1Next = (data: Partial<ServiceRequestFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Next = (data: Partial<ServiceRequestFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleSubmit = (data: Partial<ServiceRequestFormData>) => {
    const finalData = { ...formData, ...data };
    console.log('Submitting service request:', finalData);
    // TODO: Submit to API
    router.push('/scheduler/service-requests');
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <DashboardHeader
        title="New Service Requests"
        description="Create a new service request for your customers."
      />

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] p-6 mt-6">
        <CardContent className="px-0">
          {/* Step Indicator */}
          <div className="text-sm font-medium text-gray-600 mb-4">
            Step {currentStep} of 3
          </div>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/scheduler/service-requests" className="font-medium text-gray-500 hover:text-gray-700">
              Services Request
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="font-medium text-gray-700">Add New Service Request</span>
          </div>

          {/* Form Steps */}
          {currentStep === 1 && (
            <Step1Form
              initialData={formData}
              onNext={handleStep1Next}
            />
          )}

          {currentStep === 2 && (
            <Step2Form
              initialData={formData}
              onNext={handleStep2Next}
              onBack={handleStep2Back}
            />
          )}

          {currentStep === 3 && (
            <Step3Form
              initialData={formData}
              onSubmit={handleSubmit}
              onBack={handleStep3Back}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

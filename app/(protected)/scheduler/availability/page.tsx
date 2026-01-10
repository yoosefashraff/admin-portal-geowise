'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AvailabilityCard from '@/components/shared/AvailabilityCard';
import { useAuthStore } from '@/lib/store/authStore';
import { getAllProvidersForCompany } from '@/lib/actions/provider.actions';
import { Provider } from '@/lib/types/provider.types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AvailabilitySkeleton } from '@/components/skeleton/AvailabilitySkeleton';

export default function AvailabilityPage() {
  const { user } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch providers
  useEffect(() => {
    const loadProviders = async () => {
      if (!user?.UserID) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getAllProvidersForCompany({
          CompanyAdminId: user.UserID,
          PageNo: 1,
          RecordsPerPage: 100,
        });

        if (response.Status === 201 && response.List && response.List.length > 0) {
          setProviders(response.List);
          // Auto-select first provider if available
          if (response.List.length > 0) {
            setSelectedProviderId(response.List[0].ProviderId.toString());
          }
        } else {
          setProviders([]);
          toast.info('No providers found');
        }
      } catch (error) {
        console.error('Failed to load providers:', error);
        toast.error('Failed to load providers');
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, [user]);

  const selectedProvider = providers.find(
    (p) => p.ProviderId.toString() === selectedProviderId
  );

  if (isLoading) {
    return <AvailabilitySkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-medium text-gray-900 mb-1">Availability</h1>
          <p className="text-gray-500">Manage provider availability and working hours.</p>
        </div>
      </div>

      {/* Provider Selection Card */}
      <Card className="mb-6 border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Select Provider:
            </label>
              <Select
                value={selectedProviderId}
                onValueChange={setSelectedProviderId}
                disabled={providers.length === 0}
              >
                <SelectTrigger className="w-full max-w-md h-11">
                  <SelectValue placeholder="Select a provider">
                    {selectedProvider ? selectedProvider.ProviderName : 'Select a provider'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem
                      key={provider.ProviderId}
                      value={provider.ProviderId.toString()}
                    >
                      {provider.ProviderName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </CardContent>
      </Card>

      {/* Availability Management Card */}
      {selectedProviderId && !isLoading && (
        <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06)]">
          <CardContent className="p-6">
            {/* Card Header */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedProvider?.ProviderName || 'Provider'}'s Availability
              </h2>
              <p className="text-sm text-gray-500">
                Set working hours and break times for each day of the week.
              </p>
            </div>

            {/* Availability Cards Container */}
            <div className="grid grid-cols-3 bg-gray-50" style={{ gap: '20px' }}>
              <AvailabilityCard 
                dayOfWeek="Monday" 
                isAvailable={true}
                startTime="09:00"
                endTime="17:00"
              />
              <AvailabilityCard 
                dayOfWeek="Tuesday" 
                isAvailable={true}
                startTime="09:00"
                endTime="17:00"
              />
              <AvailabilityCard 
                dayOfWeek="Wednesday" 
                isAvailable={true}
                startTime="09:00"
                endTime="17:00"
              />
              <AvailabilityCard 
                dayOfWeek="Thursday" 
                isAvailable={true}
                startTime="09:00"
                endTime="17:00"
              />
              <AvailabilityCard 
                dayOfWeek="Friday" 
                isAvailable={true}
                startTime="09:00"
                endTime="17:00"
              />
              <AvailabilityCard 
                dayOfWeek="Saturday" 
                isAvailable={false}
              />
              <AvailabilityCard 
                dayOfWeek="Sunday" 
                isAvailable={false}
              />
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <Button
                className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedProviderId && !isLoading && providers.length === 0 && (
        <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06)]">
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 mb-4">No providers available.</p>
            <p className="text-sm text-gray-400">
              Add providers to manage their availability.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

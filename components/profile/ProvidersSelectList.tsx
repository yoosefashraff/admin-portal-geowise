"use client";

import { useMemo, useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CustomPagination from "@/components/ui/custom-pagination";
import { cn } from "@/lib/utils";
import { fetchProviderByCompanyId } from "@/lib/actions/provider.actions";
import { useAuthStore } from "@/lib/store/authStore";
import { Provider } from "@/lib/types/provider.types";
import { Loader2 } from "lucide-react";

interface ProvidersSelectListProps {
  searchQuery: string;
  onToggle: (id: string, selected: string[]) => void;
}

const itemsPerPage = 5;

export default function ProvidersSelectList({
  searchQuery,
  onToggle,
}: ProvidersSelectListProps) {
    const { user } = useAuthStore();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
      const loadProviders = async () => {
        if (!user?.UserID) {
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const response = await fetchProviderByCompanyId(user.UserID);
          if (response.Status === 201 && response.Object) {
            setProviders(response.Object);
          } else {
            setProviders([]);
          }
        } catch (error) {
          console.error('Failed to load providers:', error);
          setProviders([]);
        } finally {
          setLoading(false);
        }
      };

      loadProviders();
    }, [user]);

    const filteredProviders = useMemo(() => {
      if (!searchQuery.trim()) {
        return providers;
      }

      const lowerQuery = searchQuery.toLowerCase();
      return providers.filter((p) =>
        p.ProviderName.toLowerCase().includes(lowerQuery)
      );
    }, [providers, searchQuery]);

    const paginatedProviders = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredProviders.slice(start, end);
    }, [filteredProviders, currentPage]);

    const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);

    // Reset to page 1 when search query changes
    useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleProvider = (providerId: string) => {
    const newSelected = selectedIds.includes(providerId)
      ? selectedIds.filter((id) => id !== providerId)
      : [...selectedIds, providerId];
    
    setSelectedIds(newSelected);
    onToggle(providerId, newSelected);
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (paginatedProviders.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-8 text-gray-500">
        {searchQuery ? 'No providers found matching your search.' : 'No providers available.'}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-1">
      {/* Provider List */}
      {paginatedProviders.map((provider, index) => {
        const providerId = provider.ProviderId.toString();
        const isChecked = selectedIds.includes(providerId);
        const hasNext = index < paginatedProviders.length - 1;
        
        return (
          <label
            key={provider.ProviderId}
            className={cn(
                "flex items-center gap-[12px] py-[16px] px-[24px] hover:bg-[#FCFCFD] transition cursor-pointer select-none mb-0 border-[#E4E7EC]",
                hasNext && "border-b"
            )}
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => toggleProvider(providerId)}
              className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]"
            />

            <Avatar className="h-10 w-10">
              <AvatarImage src={provider.ProfileImage} alt={provider.ProviderName} />
              <AvatarFallback>
                {provider.ProviderName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="text-[#101828] text-[14px] font-medium leading-[20px]">
                {provider.ProviderName}
              </p>
            </div>
          </label>
        );
      })}

      {/* CustomPagination */}
      {totalPages > 1 && (
        <CustomPagination
          className="mt-[16px] border-t border-[#E4E7EC] pt-[17px]"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
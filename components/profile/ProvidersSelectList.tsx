"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CustomPagination from "@/components/ui/custom-pagination";
import { cn } from "@/lib/utils"


interface Provider {
  provider_id: string;
  name: string;
  avatar?: string;
}

const mockProviders: Provider[] = [
  { provider_id: "prov_001", name: "Kim Geasley", avatar: "https://i.pravatar.cc/150?img=1" },
  { provider_id: "prov_002", name: "Amy Oaks-Smith", avatar: "https://i.pravatar.cc/150?img=2" },
  { provider_id: "prov_003", name: "Anna Cathey", avatar: "https://i.pravatar.cc/150?img=3" },
  { provider_id: "prov_004", name: "David Chen", avatar: "https://i.pravatar.cc/150?img=4" },
  { provider_id: "prov_005", name: "Sarah Johnson", avatar: "https://i.pravatar.cc/150?img=5" },
  { provider_id: "prov_006", name: "Kim Brown", avatar: "https://i.pravatar.cc/150?img=6" },
];

interface ProvidersSelectListProps {
  searchQuery: string;
  onToggle: (id: string, selected: string[]) => void;
}

export default function ProvidersSelectList({
  searchQuery,
  onToggle,
}: ProvidersSelectListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 15;

    const displayedProviders = useMemo(() => {
        if (!searchQuery.trim()) {
            return mockProviders;
        }

        const lowerQuery = searchQuery.toLowerCase();
        return mockProviders.filter((p) =>
            p.name.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleProvider = (provider_id: string) => {
    setSelectedIds((prev) =>
      prev.includes(provider_id)
        ? prev.filter((id) => id !== provider_id)
        : [...prev, provider_id]
    );

    onToggle(provider_id, selectedIds);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-1">
      {/* Provider List */}
      {displayedProviders.map((provider, index) => {
        const isChecked = selectedIds.includes(provider.provider_id);
        const hasNext = index < displayedProviders.length - 1;
        
        return (
          <label
            key={provider.provider_id}
            className={cn(
                "flex items-center gap-[12px] py-[16px] px-[24px] hover:bg-[#FCFCFD] transition cursor-pointer select-none mb-0 border-[#E4E7EC]",
                hasNext && "border-b"
            )}
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => toggleProvider(provider.provider_id)}
              className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]"
            />

            <Avatar className="h-10 w-10">
              <AvatarImage src={provider.avatar} alt={provider.name} />
              <AvatarFallback>
                {provider.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="text-[#101828] text-[14px] font-medium leading-[20px]">
                {provider.name}
              </p>
            </div>
          </label>
        );
      })}

      {/* CustomPagination */}
      <CustomPagination
        className="mt-[16px] border-t border-[#E4E7EC] pt-[17px]"
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
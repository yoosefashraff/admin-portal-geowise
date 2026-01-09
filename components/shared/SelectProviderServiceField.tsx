'use client';

import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "../ui/label";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useState } from "react";
import { ProviderLinkedServices } from "@/lib/types/provider.types";
import { getProviderByCompanyIdByLinkedServices } from "@/lib/actions/provider.actions";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import CustomPagination from "./CustomPagination";
import { toggleLinkedProvider } from "@/lib/actions/service.actions";
import { Spinner } from "@/components/ui/spinner";

export default function SelectProviderServiceField({serviceId} : {serviceId: number}) {

	const { user } = useAuthStore();
	const [data, setData] = useState<ProviderLinkedServices[]>([]);
	const [filteredData, setFilteredData] = useState<ProviderLinkedServices[]>([]);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [loading, setLoading] = useState<boolean>(false);
	const [loadingToggle, setLoadingToggle] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState('');

	async function loadProviders() {
		if (!user) return;
		setLoading(true);
		const response = await getProviderByCompanyIdByLinkedServices({
			CompanyAdminId: user?.UserID || 0,
			ServiceId: serviceId
		});

		if (response.Status !== 201) {
			toast.error(response.Message);
			return;
		}

		setData(response.Object);
		const totalPagesRes = Math.ceil(response.Object.length / 10);
		setCurrentPage(currentPage > totalPagesRes ? totalPagesRes : currentPage);
		setTotalPages(totalPagesRes);
		setLoading(false);
	}

	useEffect(() => {
		if (!user) return;
		loadProviders();
	}, [user]);

	useEffect(() => {
		setFilteredData(data);
	}, [data])

	useEffect(() => {
		let result = [...data];

		if (searchQuery) {
			result = result.filter(provider =>
				provider.ProviderName.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
		setTotalPages(result.length > 0 ? Math.ceil(result.length / 10) : 1);
		setCurrentPage(1);
		setFilteredData(result);
	}, [searchQuery]);

	useEffect(() => {
		loadProviders();
	}, [currentPage]);

	const handleToggle = async (providerId: number, isChecked: boolean) => {
		
		setLoadingToggle(true);

		setFilteredData(prevData => 
			prevData.map(provider => 
				provider.ProviderId === providerId 
					? { ...provider, IsLinkedToService: isChecked }
					: provider
			)
		);

		const response = await toggleLinkedProvider({ 
			ServiceId: serviceId, ProviderId: String(providerId), IsChecked: isChecked 
		});

		setLoadingToggle(false);

	};

	return (
		<div className="flex flex-col gap-4 relative">
			{loadingToggle && (
				<div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 z-50">
					<div className="flex items-center gap-2">
						<Spinner className="size-8 text-gray-500" />
					</div>
				</div>
			)}
			<div className="flex-1 relative">
				<Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
				<Input
					type="text"
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search by provider’s name"
					className="pl-10 pr-4 h-11 py-3 md:text-[16px] bg-gray-50 border-0"
				/>
			</div>
			<div>
				<div className="px-6 py-3 text-sm font-medium text-gray-500 bg-[#FCFCFD]">
					Provider Name
				</div>
				<div className="flex flex-col">
					{loading ? (
						Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-10 w-10 rounded-full" />
								<Skeleton className="h-4 w-[200px]" />
							</div>
						))
					) : filteredData.slice((currentPage - 1) * 10, currentPage * 10).map((provider) => {
						const checked = provider.IsLinkedToService;
						return (
							<div key={provider.ProviderId} className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
								<Checkbox 
									checked={checked}
									 onCheckedChange={(isChecked) => {
										const newValue = isChecked === true;
										handleToggle(provider.ProviderId, newValue);
									}}
									id={`checkbox-${provider.ProviderId}`}
									className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" 
									/>
								<Label htmlFor={`checkbox-${provider.ProviderId}`} className="font-medium text-sm flex gap-3 items-center">
									<Image
										width={40}
										height={40}
										src="/images/avatar.png"
										alt="Amy Oaks-Smith"
										className="w-10 h-10 rounded-full object-cover"
									/>
									<span className="flex-1">{provider.ProviderName}</span>
								</Label>
							</div>
						)
					})}
				</div>
				<Separator className="my-4 h-px bg-gray-200" />

				{/* Pagination */}
				<CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
			</div>

		</div>
	)
}
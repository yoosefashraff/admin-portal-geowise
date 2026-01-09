'use client';

import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "../ui/label";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useState } from "react";
import { Provider } from "@/lib/types/provider.types";
import { getAllProvidersForCompany } from "@/lib/actions/provider.actions";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import CustomPagination from "./CustomPagination";
import { Control, Form } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "../ui/form";

interface SelectProviderFieldProps {
  control: Control<any>;
  name: string;
}

export default function SelectProviderField({control, name}: SelectProviderFieldProps) {

	const { user } = useAuthStore();
	const [data, setData] = useState<Provider[]>([]);
	const [filteredData, setFilteredData] = useState<Provider[]>([]);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [loading, setLoading] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState('');

	async function loadProviders() {
		if (!user) return;
		setLoading(true);
		const response = await getAllProvidersForCompany({
			CompanyAdminId: user?.UserID || 0,
			PageNo: currentPage,
			RecordsPerPage: 10
		});

		if (response.Status !== 201) {
			toast.error(response.Message);
			return;
		}

		setData(response.List);
		const totalPagesRes = Math.ceil(response.TotalCount / 10);
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
		setFilteredData(result);
	}, [searchQuery]);

	useEffect(() => {
		loadProviders();
	}, [currentPage]);

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<div className="flex flex-col gap-4">
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
								) : filteredData.map((provider) => {
									const checked = field.value?.includes(provider.ProviderId);
									return (
										<div key={provider.ProviderId} className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
											<Checkbox 
												checked={checked}
												onCheckedChange={(isChecked) => {
													if (isChecked) {
														field.onChange([
															...(field.value || []),
															provider.ProviderId,
														]);
													} else {
														field.onChange(
															field.value.filter(
																(id: number) => id !== provider.ProviderId
															)
														);
													}
												}}
												id={`checkbox-${provider.ProviderId}`}
												className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" 
												/>
											<Label htmlFor={`checkbox-${provider.ProviderId}`} className="font-medium text-sm flex gap-3 items-center">
												<Image
													width={40}
													height={40}
													src={provider.ProfileImage}
													alt="Amy Oaks-Smith"
													className="w-10 h-10 rounded-full object-cover"
												/>
												<span className="flex-1">{provider.ProviderName}</span>
											</Label>
										</div>
									)
								})}
							</div>
							<FormMessage />

							<Separator className="my-4 h-px bg-gray-200" />

							{/* Pagination */}
							<CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
						</div>

					</div>
				</FormItem>
			)}
		/>
	)
}
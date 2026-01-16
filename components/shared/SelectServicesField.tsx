import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import CustomPagination from "./CustomPagination";
import { FormMessage } from "../ui/form";
import { getServicesForCompany } from "@/lib/actions/service.actions";
import { CompanyService } from "@/lib/types/service.types";

interface SelectServicesFieldProps {
  field: any;
}

export default function SelectServicesField({field}: SelectServicesFieldProps) {

	const { user } = useAuthStore();
	const [data, setData] = useState<CompanyService[]>([]);
	const [filteredData, setFilteredData] = useState<CompanyService[]>([]);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [loading, setLoading] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState('');

	async function loadServices() {
		if (!user) return;
		setLoading(true);
		const response = await getServicesForCompany({
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
		loadServices();
	}, [user]);

	useEffect(() => {
		setFilteredData(data);
	}, [data])

	useEffect(() => {
		let result = [...data];

		if (searchQuery) {
			result = result.filter(service =>
				service.ServiceName.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
		setFilteredData(result);
	}, [searchQuery]);

	useEffect(() => {
		loadServices();
	}, [currentPage]);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex-1 relative">
				<Search className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
				<Input
					type="text"
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search by service name"
					className="pl-10 pr-4 h-11 py-3 md:text-[16px] bg-gray-50 border-0"
				/>
			</div>
			<div>
				<div className="px-6 py-3 text-sm font-medium text-gray-500 bg-[#FCFCFD]">
					Service Name
				</div>
				<div className="flex flex-col">
					{loading ? (
						Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC]">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-[200px]" />
							</div>
						))
					) : filteredData.map((service) => {
						const checked = field.value?.includes(service.Id);
						return (
							<div key={service.Id} className="flex items-center gap-[12px] px-6 py-4 transition mb-0 border-b-1 border-[#E4E7EC] last:border-b-0">
								<Checkbox 
									checked={checked}
									onCheckedChange={(isChecked) => {
										if (isChecked) {
											field.onChange([
												...(field.value || []),
												service.Id,
											]);
										} else {
											field.onChange(
												field.value.filter(
													(id: number) => id !== service.Id
												)
											);
										}
									}}
									id={`checkbox-${service.Id}`}
									className="size-5 data-[state=checked]:bg-[#F9FAFB] data-[state=checked]:border-[#151C24] data-[state=checked]:text-[#151C24]" 
									/>
								<Label htmlFor={`checkbox-${service.Id}`} className="font-medium text-sm flex gap-3 items-center">
									<span className="flex-1">{service.ServiceName}</span>
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
	)
}
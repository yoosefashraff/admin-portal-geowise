'use client';

import { CompanyService } from "@/lib/types/service.types";
import { MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CompanyServiceItemProps {
    service: CompanyService;
    index: number;
    dataLength: number;
    handleDeleteItem: (serviceId: number) => void
}

export default function CompanyServiceItem({ service, index, dataLength, handleDeleteItem }: CompanyServiceItemProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    return (
        <tr
            key={service.Id}
            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                index === dataLength - 1 ? 'border-b-0' : ''
            }`}
        >
            <td className="py-4 px-6 text-sm font-medium text-gray-900">
                <Link href={`/services/${service.Id}/edit`} >{service.ServiceName}</Link>
            </td>
            <td className="py-4 px-6 text-sm text-gray-500">
                {service?.CurrencyCode} {service.Price}
            </td>
            <td className="py-4 px-6 text-sm text-gray-500">
                {service.Duration} mins
            </td>
            <td className="py-4 px-6 h-19">
            <div className="flex items-center gap-2">
                {/* <div className="flex -space-x-2">
                {service.assignedTo.slice(0, 4).map((person, i) => (
                    service.assignedTo.length == 1 ? (
                    <Image
                        key={i}
                        width={48}
                        height={48}
                        src="/images/avatar.png"
                        alt="Amy Oaks-Smith"
                        className="w-11 h-11 rounded-full object-cover border-3 border-white"
                    />
                    ) : (
                    <Image
                        key={i}
                        width={28}
                        height={28}
                        src="/images/avatar.png"
                        alt="Amy Oaks-Smith"
                        className="w-7 h-7 rounded-full object-cover border-3 border-white"
                    />
                    )
                ))}
                </div> */}

                <div className="flex items-center gap-2 ml-2">
									{(service.ProviderNames && service.ProviderNames.length > 0) && (
										<span className="text-xs font-medium text-gray-700 bg-[#F9FAFB] px-2 py-0.5 rounded-xl">
											{service.ProviderNames[0]}
										</span>
									)}
									{service.ProviderNames && service.ProviderNames.length > 1 && (
										<span className="text-xs font-medium text-gray-700 bg-[#F9FAFB] px-2 py-0.5 rounded-xl">
											{service.ProviderNames[1]}
										</span>
									)}
                </div>
                
                {service.ProviderNames && service.ProviderNames.length > 2 && (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="text-xs font-medium bg-[#F9FAFB] px-2 py-0.5 text-cyan-700 rounded-xl">
												+{service.ProviderNames.length - 2}
											</span>
										</TooltipTrigger>
										<TooltipContent className="max-w-40">
											{service.ProviderNames.slice(2).join(', ')}
										</TooltipContent>
									</Tooltip>
                )}
            </div>
            </td>
            <td className="py-4 px-6">
							<DropdownMenu modal={false}>
									<DropdownMenuTrigger asChild>
									<button className="text-gray-500 hover:text-gray-600 transition-colors cursor-pointer">
											<MoreVertical className="w-5 h-5" />
									</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-40" align="end">
									<DropdownMenuGroup>
											<DropdownMenuItem>
													<Link className='w-full' href={`/services/${service.Id}/edit`}>
															Edit
													</Link>
											</DropdownMenuItem>
											<DropdownMenuItem onClick={()=>setShowDeleteDialog(true)}>
													Delete
											</DropdownMenuItem>
									</DropdownMenuGroup>
									</DropdownMenuContent>
							</DropdownMenu>
							<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
									<DialogContent className="sm:max-w-[425px]">
									<DialogHeader>
											<DialogTitle>Delete Service</DialogTitle>
											<DialogDescription>
													Are you sure you want to delete this service?
											</DialogDescription>
									</DialogHeader>
									<DialogFooter>
											<DialogClose asChild>
													<Button variant="outline" className="cursor-pointer">Cancel</Button>
											</DialogClose>
											<Button variant="destructive" className="cursor-pointer" onClick={() => {
													setShowDeleteDialog(false);
													handleDeleteItem(service.Id)
											}}>Yes</Button>
									</DialogFooter>
									</DialogContent>
							</Dialog>
            </td>
        </tr>
    )
}
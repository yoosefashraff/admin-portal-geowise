'use client';

import { CompanyService } from "@/lib/types/service.types";
import { MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ServiceGroupItemProps {
    service: CompanyService;
    index: number;
    dataLength: number;
    handleDeleteItem: (serviceId: number) => void
}

export default function ServiceGroupItem({ service, index, dataLength, handleDeleteItem }: ServiceGroupItemProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const router = useRouter()

    const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        // Don't navigate if clicking on the dropdown menu or its trigger
        const target = e.target as HTMLElement
        if (
            target.closest('[role="menuitem"]') ||
            target.closest('button') ||
            target.closest('[data-radix-popper-content-wrapper]')
        ) {
            return
        }
        router.push(`/services/${service.Id}/edit`)
    }

    return (
        <tr
            key={service.Id}
            onClick={handleRowClick}
            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
                index === dataLength - 1 ? 'border-b-0' : ''
            }`}
        >
            <td className="py-4 px-6 text-sm font-medium text-gray-900">
                {service.ServiceName}
            </td>
            <td className="py-4 px-6 h-19">
                Follow Up Visit,  Initial Lactation consultation
            </td>
            <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                    <button 
                        className="text-gray-500 hover:text-gray-600 transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                            <MoreVertical className="w-5 h-5" />
                    </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40" align="end">
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <Link className='w-full' href={`/services/groups/${service.Id}/edit`}>
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
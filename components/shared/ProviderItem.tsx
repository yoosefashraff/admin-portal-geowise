'use client';

import { MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { Provider } from "@/lib/types/provider.types";
import Image from "next/image";
import dayjs from "dayjs";
import { convertAspNetDate } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface ProviderItemProps {
    provider: Provider;
    index: number;
    dataLength: number;
    handleDeleteItem: (providerId: number) => void
}

export default function ProviderItem({ provider, index, dataLength, handleDeleteItem }: ProviderItemProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    return (
        <tr
            key={provider.ProviderId}
            className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                index === dataLength - 1 ? 'border-b-0' : ''
            }`}
        >
            <td className="py-4 px-6 text-sm font-medium text-gray-900">
              <Link href={`/linked-users/${provider.ProviderId}/edit`} className="block">
                <div className="flex items-center gap-3">
                  <Image
                    src={provider.ProfileImage || '/images/avatar.png'}
                    alt={provider.ProviderName}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/avatar.png';
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {provider.ProviderName}
                    </p>
                  </div>	
                </div>
              </Link>
            </td>
            <td className="py-4 px-6 text-sm text-gray-500">
              {provider.CreationDate ? dayjs(provider.CreationDate).format('MMM DD, YYYY') : ''}
            </td>
            <td className="py-4 px-6 text-sm text-gray-500">
              {provider.ConfirmationDate ? convertAspNetDate(provider.ConfirmationDate) : ''}
            </td>
            <td className="py-4 px-6 h-19">
							{provider.IsEmailVerified ? (
								<Badge className="h-6 min-w-5 px-3 font-medium bg-green-50 text-green-700">Active</Badge>
							):(
								<Badge className="h-6 min-w-5 px-3 font-medium bg-red-50 text-red-700">Pending</Badge>
							)}
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
										<DropdownMenuItem asChild>
											<Link className="w-full" href={`/linked-users/${provider.ProviderId}/edit`}>
												Edit
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
											Delete
										</DropdownMenuItem>
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
							<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
									<DialogContent className="sm:max-w-[425px]">
									<DialogHeader>
											<DialogTitle>Delete Provider</DialogTitle>
											<DialogDescription>
													Are you sure you want to delete this provider?
											</DialogDescription>
									</DialogHeader>
									<DialogFooter>
											<DialogClose asChild>
													<Button variant="outline" className="cursor-pointer">Cancel</Button>
											</DialogClose>
											<Button variant="destructive" className="cursor-pointer" onClick={() => {
													setShowDeleteDialog(false);
													handleDeleteItem(provider.ProviderId)
											}}>Yes</Button>
									</DialogFooter>
									</DialogContent>
							</Dialog>
            </td>
        </tr>
    )
}
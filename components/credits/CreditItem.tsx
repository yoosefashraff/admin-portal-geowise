'use client';

import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ApprovedUserCredit } from '@/lib/actions/approvedUserCredits.actions';
import { parseDotNetDate } from '@/lib/utils';

interface CreditItemProps {
  credit: ApprovedUserCredit & { UserName?: string; UserEmail?: string; ServiceName?: string };
  index: number;
  dataLength: number;
  onEdit: (credit: ApprovedUserCredit) => void;
  onDelete: (id: number) => void;
}

export default function CreditItem({ credit, index, dataLength, onEdit, onDelete }: CreditItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = parseDotNetDate(dateString);
      if (!date) return dateString;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <>
      <tr
        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
          index === dataLength - 1 ? 'border-b-0' : ''
        }`}
      >
        <td className="py-4 px-6 text-sm">
          <div>
            <div className="font-medium text-gray-900">
              {credit.UserName || `User ID: ${credit.UserId}`}
            </div>
            {credit.UserEmail && (
              <div className="text-xs text-gray-500">{credit.UserEmail}</div>
            )}
          </div>
        </td>
        <td className="py-4 px-6 text-sm text-gray-900">
          {credit.ServiceName || `Service ID: ${credit.ServiceId}`}
        </td>
        <td className="py-4 px-6 text-sm text-gray-900">
          {formatNumber(credit.ApprovedCredits)}
        </td>
        <td className="py-4 px-6 text-sm text-gray-900">
          {formatNumber(credit.UsedCredits || 0)}
        </td>
        <td className="py-4 px-6 text-sm text-gray-900">
          {formatNumber(credit.RemainingCredits || credit.ApprovedCredits - (credit.UsedCredits || 0))}
        </td>
        <td className="py-4 px-6 text-sm text-gray-500">
          {formatDate(credit.StartDate)}
        </td>
        <td className="py-4 px-6 text-sm text-gray-500">
          {formatDate(credit.EndDate)}
        </td>
        <td className="py-4 px-6">
          <Badge variant={credit.IsActive ? 'default' : 'secondary'}>
            {credit.IsActive ? 'Active' : 'Inactive'}
          </Badge>
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
                <DropdownMenuItem onClick={() => onEdit(credit)}>
                  Edit
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
                <DialogTitle>Delete Credit</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this credit? This will set it to inactive.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="cursor-pointer">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => {
                    if (credit.Id) {
                      setShowDeleteDialog(false);
                      onDelete(credit.Id);
                    }
                  }}
                >
                  Yes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </td>
      </tr>
    </>
  );
}

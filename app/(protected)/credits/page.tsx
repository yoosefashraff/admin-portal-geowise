'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon, Search, Upload, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Separator } from '@radix-ui/react-select';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/authStore';
import { 
  listApprovedUserCredits, 
  exportApprovedUserCredits,
  type ApprovedUserCredit 
} from '@/lib/actions/approvedUserCredits.actions';
import { toast } from 'sonner';
import CustomPagination from '@/components/shared/CustomPagination';
import { Skeleton } from '@/components/ui/skeleton';
import CreditItem from '@/components/credits/CreditItem';
import CreditFormDialog from '@/components/credits/CreditFormDialog';
import { CreditImportDialog } from '@/components/credits/CreditImportDialog';

export default function CreditsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [credits, setCredits] = useState<ApprovedUserCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState<ApprovedUserCredit | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const itemsPerPage = 10;

  const loadCredits = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Log request details in browser console for debugging
      console.log('[Credits Page] Loading credits with params:', {
        PageNumber: currentPage,
        PageSize: itemsPerPage,
        IsActive: true,
        SearchTerm: searchQuery || undefined,
      });
      
      const response = await listApprovedUserCredits({
        PageNumber: currentPage,
        PageSize: itemsPerPage,
        IsActive: true,
        SearchTerm: searchQuery || undefined,
      });

      // Log response in browser console
      console.log('[Credits Page] API Response:', {
        Status: response.Status,
        Message: response.Message,
        hasData: !!response.data,
        dataLength: response.data?.length || 0
      });

      if (response.Status === 201 && response.data) {
        setCredits(response.data);
        
        // Calculate total pages based on total count from API or data length
        setTotalPages(Math.ceil(response.data.length / itemsPerPage) || 1);
      } else {
        // Handle error responses (401, 500, etc.)
        const errorMessage = response.Message || 
          (response.Status === 401 ? 'Unauthorized. Please check your authentication.' : 
           response.Status === 403 ? 'Forbidden. You do not have permission to access this resource.' :
           'Failed to load credits');
        toast.error(errorMessage);
        setCredits([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Failed to load credits:', error);
      const errorMessage = error?.response?.data?.Message || error?.message || 'Failed to load credits';
      toast.error(errorMessage);
      setCredits([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, [user, currentPage, searchQuery]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return credits;
    const query = searchQuery.toLowerCase();
    return credits.filter((credit) => {
      // Search by user name, service name, or credit amounts
      const userName = (credit as any).UserName?.toLowerCase() || '';
      const serviceName = (credit as any).ServiceName?.toLowerCase() || '';
      return (
        userName.includes(query) ||
        serviceName.includes(query) ||
        credit.ApprovedCredits.toString().includes(query)
      );
    });
  }, [credits, searchQuery]);

  const handleDeleteItem = async (id: number) => {
    // Import delete function
    const { deleteApprovedUserCredit } = await import('@/lib/actions/approvedUserCredits.actions');
    const response = await deleteApprovedUserCredit(id);
    
    if (response.Status === 201) {
      toast.success(response.Message || 'Credit deleted successfully');
      loadCredits();
    } else {
      toast.error(response.Message || 'Failed to delete credit');
    }
  };

  const handleEdit = (credit: ApprovedUserCredit) => {
    setEditingCredit(credit);
    setIsFormDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCredit(null);
    setIsFormDialogOpen(true);
  };

  const handleFormClose = () => {
    setIsFormDialogOpen(false);
    setEditingCredit(null);
    loadCredits();
  };

  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  const handleImportClose = () => {
    setIsImportDialogOpen(false);
    loadCredits();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await exportApprovedUserCredits();
      
      if (response.Status === 201 && response.blob) {
        // Create download link
        const url = URL.createObjectURL(response.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `approved-user-credits-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Credits exported successfully');
      } else {
        toast.error(response.Message || 'Failed to export credits');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export credits');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      <DashboardHeader
        title="Approved User Credits"
        description="Manage approved credits for users and services"
      />

      <Card className="border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06)]">
        <CardContent className="p-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by user, service, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleImport}
                className="cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button
                onClick={handleCreate}
                className="cursor-pointer"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Credit
              </Button>
            </div>
          </div>


          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FCFCFC]">
                  <th className="text-left py-3 px-6 text-xs font-medium rounded-l-lg text-gray-500">
                    User
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                    Service
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                    Approved Credits
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                    Used Credits
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                    Remaining Credits
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                    Start Date
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                    End Date
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500">
                    Status
                  </th>
                  <th className="w-12 rounded-r-lg"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-24" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 px-6"></td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      No credits found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((credit, index) => (
                    <CreditItem
                      key={credit.Id || index}
                      credit={credit}
                      index={index}
                      dataLength={filteredData.length}
                      onEdit={handleEdit}
                      onDelete={handleDeleteItem}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Separator className="my-4 h-px bg-gray-200" />

          {/* Pagination */}
          {loading ? (
            <div className="flex items-center gap-2 justify-between">
              <Skeleton className="h-6 w-[100px]" />
              <Skeleton className="h-6 w-[300px]" />
              <Skeleton className="h-6 w-[100px]" />
            </div>
          ) : (
            <CustomPagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <CreditFormDialog
        open={isFormDialogOpen}
        onOpenChange={handleFormClose}
        credit={editingCredit}
      />

      {/* Import Dialog */}
      <CreditImportDialog
        open={isImportDialogOpen}
        onOpenChange={handleImportClose}
      />
    </div>
  );
}

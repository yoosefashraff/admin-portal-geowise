"use client";

import { useState } from "react";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProfilePageWrapper from "@/components/layout/ProfilePageWrapper";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { addPaymentType } from "@/lib/actions/profile.action";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Coins, CreditCard } from "lucide-react";

export default function ProfilePaymentPage() {
  const [method, setMethod] = useState('2');
  const {user} = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    const response = await addPaymentType({PaymentType: method, CompanyUserId: user?.UserID || 0});

    if(response.Status !== 201){
      toast.error(response.Message);
      return;
    }

    toast.success(response.Message);
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <ProfilePageWrapper
        panelName="payment"
      >
        {loading && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/50 z-50">
            <div className="flex items-center gap-2">
              <Spinner className="size-8 text-gray-500" />
            </div>
          </div>
        )}
        {/* Content */}
        <div className="flex min-w-0 gap-8 pt-[16px]">
          <div className="flex-1 text-[#101828] text-[16px] font-medium leading-[44px]">
            Payment Method
          </div>
          <div className="flex-1">
            {/* Radio Group */}
            <RadioGroup value={method} onValueChange={setMethod} className="gap-0 space-y-3">
              {/* Cash */}
              <Label
                htmlFor="cash"
                className={cn(
                  "flex items-center justify-between mb-[12px] py-[10px] px-[14px] rounded-[8px] border-1 border-[#D0D5DD] cursor-pointer transition-all shadow-[0_1px_2px_0_#1018280D]",
                  method === "2"
                    ? "border-gray-900 bg-[#F9FAFB]"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex gap-[8px] items-center">
                  <RadioGroupItem value="2" id="cash" className="w-5 h-5 rounded-2xl" />
                  <span className="font-normal text-[#667085] text-[16px] leading-[24px] space-y-4">Cash</span>
                </div>

                <Coins className="w-5" />

              </Label>

              {/* Credit Card */}
              <div
                className={cn(
                  " transition-all",
                  method === "1"
                    ? "border-gray-900"
                    : "border-gray-200"
                )}
              >
                <Label
                  htmlFor="card"
                  className="mb-[12px] flex items-center justify-between py-[10px] px-[14px] border-1 border-[#D0D5DD] rounded-[8px] shadow-[0_1px_2px_0_#1018280D] cursor-pointer"
                >

                  <div className="flex gap-[8px] items-center">
                    <RadioGroupItem value="1" id="card" className="w-5 h-5 rounded-2xl" />
                    <span className="font-normal text-[#667085] text-[16px] leading-[24px] space-y-4">Mobile pay</span>
                  </div>

                  <CreditCard className="w-5" />
                </Label>

                {method === "card111" && (
                  <div className="p-4 bg-[#F9FAFB] rounded-[16px]">
                    <div className="mb-[12px]">
                      <Label className="mb-[6px] font-medium text-[14px] text-[#344054] leading-[20px]">Name on card</Label>
                      <Input
                        placeholder="Your Name"
                        className="bg-white h-11 border-gray-300 focus:border-gray-900  text-[#101828] text-[16px] font-normal"
                      />
                    </div>

                    <div className="mb-[12px] flex gap-3">
                      <div className="w-[calc(100%-112px)]">
                        <Label className="mb-[6px] font-medium text-[14px] text-[#344054] leading-[20px]">Card number</Label>
                        <div className="relative mt-1.5">
                          <Input
                            placeholder="1234 1234 1234 1234"
                            className="bg-white h-11 pl-[52px] border-gray-300 focus:border-gray-900 text-[#101828] text-[16px] font-normal"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <Image src="/images/master-card.png" width="34" height="24" alt="Master Card" />
                          </div>
                        </div>
                      </div>

                      <div className="w-[112px] ml-auto shrink-0">
                        <Label className="mb-[6px] font-medium text-[14px] text-[#344054] leading-[20px]">Expiry</Label>
                        <Input
                          placeholder="06 / 2024"
                          className="bg-white h-11 border-gray-300 focus:border-gray-900 text-[#101828] text-[16px] font-normal"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-[6px] font-medium text-[14px] text-[#344054] leading-[20px]">CVV</Label>
                      <Input
                        type="password"
                        placeholder="•••"
                        maxLength={3}
                        className="bg-white h-11 w-32 border-gray-300 focus:border-gray-900 text-[#101828] text-[16px] font-normal"
                      />
                    </div>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>
        </div>

        <Separator className="bg-gray-200 h-0.25 my-4" />
        <div className="flex justify-end gap-x-3">
          <Button 
            type="submit" 
            className="cursor-pointer" 
            onClick={handleSave}
            >
            Save
          </Button>
        </div>

      </ProfilePageWrapper>
    </div>
  );
}
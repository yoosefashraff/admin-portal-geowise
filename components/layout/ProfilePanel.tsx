'use client';
import { useMemo, useState } from "react";
import Link from "next/link";

interface profilePanelProps {
  name: string;
}

export function ProfilePanel({ name }: profilePanelProps) {
  const links = [
    { id: "", url: "/profile", label: "Location" },
    { id: "assigned", url: "/profile/assigned", label: "Assigned Zone" },
    { id: "portfolio", url: "/profile/portfolio", label: "Portfolio" },
    { id: "logo", url: "/profile/logo", label: "Logo" },
    { id: "payment", url: "/profile/payment", label: "Payment" },
  ];

  const current = useMemo(
    () => links.find((item) => item.id === name),
    [name]
  );

  const [active, setActive] = useState(current?.id ?? "");


  const linkClass = (id: string) =>
    `px-[16px] pt-[10px] pb-[10px] font-medium text-[14px] text-[#344054] leading-[20px] border-r border-[#D0D5DD] whitespace-nowrap hover:bg-[#F9FAFB]
     ${active === id ? "bg-[#F9FAFB]" : ""}`;

  return (
      <div className="flex items-center pt-[5px] pb-[16px] gap-8 border-b border-[#E4E7EC]">
        <div className="basis-1/2 text-[#101828] text-[18px] font-medium leading-[28px]">{current?.label ?? ""}</div>
        <div className="basis-1/2">
          <div className="flex items-center gap-0 rounded-[8px] border border-gray-300 overflow-hidden w-fit shadow-[0px_1px_2px_0px_#1018280D]">
              {links.map((item) => (
                <Link href={item.url}
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={linkClass(item.id)}
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
  );
}
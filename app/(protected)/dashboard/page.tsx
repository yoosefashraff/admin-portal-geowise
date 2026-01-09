import {DashboardHeader} from "@/components/layout/DashboardHeader";
import React from "react";

export default async function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <DashboardHeader
        title="Dashboard"
      />
    </div>
  );
}
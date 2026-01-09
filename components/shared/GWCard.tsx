'use client';

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {cn} from "@/lib/utils";

interface GWCardProps {
  title: string,
  titleAlign?: string ,
  className?: string,
  children: React.ReactNode
}
export default function GWCard({title, titleAlign = "text-left", className, children} : GWCardProps){
  return (
    <Card className={cn("border-0 shadow-[0px_2px_24px_rgba(16,24,40,0.06)]", className)}>
      <CardHeader>
        <CardTitle className={cn("text-base font-medium sm:text-lg", titleAlign)}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
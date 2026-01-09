import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ProfilePanel } from "@/components/layout/ProfilePanel";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePageWrapper({
  panelName,
  children,
}: {
  panelName: string;
  children: React.ReactNode;
}) {
    const title = 'Profile details';
    const description = 'You will be able to assign service zones to each user on the next step.';
    return (
        <>
            <DashboardHeader title={title} description={description} />

            <Card className="mb-8 p-[24px]">
            <CardContent className="px-0">
                <ProfilePanel name={panelName} />

                {/* Content */}
                {children}
            </CardContent>
            </Card>
        </>
    );
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function AutomationStatus() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/automation/settings"],
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIndicator = (isActive: boolean) => ({
    dot: isActive ? "bg-green-500" : "bg-red-500",
    text: isActive ? "text-green-600" : "text-red-600",
    label: isActive ? "Active" : "Inactive"
  });

  const autoSearchStatus = getStatusIndicator(settings?.autoSearch ?? false);
  const autoProposalStatus = getStatusIndicator(settings?.autoProposal ?? false);
  const emailNotificationsStatus = getStatusIndicator(settings?.emailNotifications ?? false);

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Automation Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Auto-search</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 ${autoSearchStatus.dot} rounded-full`}></div>
              <span className={`text-sm font-medium ${autoSearchStatus.text}`}>
                {autoSearchStatus.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Proposal Generation</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 ${autoProposalStatus.dot} rounded-full`}></div>
              <span className={`text-sm font-medium ${autoProposalStatus.text}`}>
                {autoProposalStatus.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email Notifications</span>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 ${emailNotificationsStatus.dot} rounded-full`}></div>
              <span className={`text-sm font-medium ${emailNotificationsStatus.text}`}>
                {emailNotificationsStatus.label}
              </span>
            </div>
          </div>
        </div>
        
        <Link href="/settings">
          <Button variant="secondary" size="sm" className="w-full">
            Manage Settings
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

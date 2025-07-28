import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AutomationControls from "@/components/automation/automation-controls";
import PlatformIntegrations from "@/components/platform/platform-integrations";
import NotificationCenter from "@/components/notifications/notification-center";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AutomationSettings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <Header 
          title="Automation Settings"
          description="Configure your automation preferences and platform connections."
        />
        
        <div className="p-6">
          <Tabs defaultValue="automation" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="automation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <AutomationControls />
                </div>
                <div className="lg:col-span-2">
                  {/* Advanced automation settings would go here */}
                  <div className="p-6 text-center text-gray-500">
                    Advanced automation settings coming soon...
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="platforms" className="space-y-6">
              <PlatformIntegrations />
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NotificationCenter />
                <div className="p-6 text-center text-gray-500">
                  Notification preferences coming soon...
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
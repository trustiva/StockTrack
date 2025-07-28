import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Bell, Plus } from "lucide-react";
import NotificationModal from "@/components/notifications/notification-modal";
import { useState } from "react";

interface HeaderProps {
  title: string;
  description?: string;
}

export default function Header({ title, description }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const generateProposalMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/proposals/generate", {
        // This would be populated with actual project data in a real implementation
        projectId: "sample",
        customInstructions: "Please create a professional proposal"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Proposal generated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to generate proposal. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
            <Button 
              className="bg-primary text-white hover:bg-blue-600"
              disabled={generateProposalMutation.isPending}
              onClick={() => generateProposalMutation.mutate()}
            >
              <Plus className="w-4 h-4 mr-2" />
              {generateProposalMutation.isPending ? "Generating..." : "Generate Proposal"}
            </Button>
          </div>
        </div>
      </header>

      <NotificationModal 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
      />
    </>
  );
}

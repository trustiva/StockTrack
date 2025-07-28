import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Info, AlertTriangle, X } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
}

export default function NotificationModal({ isOpen, onClose, notifications }: NotificationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
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
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "project_match":
        return Info;
      case "proposal_update":
        return CheckCircle;
      case "system":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "project_match":
        return "border-blue-400 bg-blue-50";
      case "proposal_update":
        return "border-green-400 bg-green-50";
      case "system":
        return "border-yellow-400 bg-yellow-50";
      default:
        return "border-gray-400 bg-gray-50";
    }
  };

  const getNotificationTextColor = (type: string) => {
    switch (type) {
      case "project_match":
        return "text-blue-800";
      case "proposal_update":
        return "text-green-800";
      case "system":
        return "text-yellow-800";
      default:
        return "text-gray-800";
    }
  };

  const getNotificationSecondaryColor = (type: string) => {
    switch (type) {
      case "project_match":
        return "text-blue-600";
      case "proposal_update":
        return "text-green-600";
      case "system":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Notifications
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No notifications</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClass = getNotificationColor(notification.type);
              const textColorClass = getNotificationTextColor(notification.type);
              const secondaryColorClass = getNotificationSecondaryColor(notification.type);
              
              return (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg border-l-4 ${colorClass} relative`}
                >
                  {!notification.isRead && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-2">
                    <Icon className={`w-4 h-4 mt-0.5 ${secondaryColorClass}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${textColorClass}`}>
                        {notification.title}
                      </p>
                      <p className={`text-xs mt-1 ${secondaryColorClass}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-1"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            disabled={markAsReadMutation.isPending}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

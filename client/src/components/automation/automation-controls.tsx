import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  Clock, 
  Target, 
  Zap,
  Activity,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AutomationStatus {
  isRunning: boolean;
  autoSearch: boolean;
  autoProposal: boolean;
  lastRun: string;
  nextRun: string;
}

export default function AutomationControls() {
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch automation status
  const { data: status, isLoading } = useQuery<AutomationStatus>({
    queryKey: ['/api/automation/status'],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch automation settings
  const { data: settings } = useQuery({
    queryKey: ['/api/automation/settings'],
  });

  // Start automation mutation
  const startAutomationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/automation/start', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/status'] });
      toast({
        title: "Automation Started",
        description: "Your freelance automation is now running.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Start",
        description: "Could not start automation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Stop automation mutation
  const stopAutomationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/automation/stop', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/status'] });
      toast({
        title: "Automation Stopped",
        description: "Your freelance automation has been paused.",
      });
    },
  });

  // Manual run mutation
  const manualRunMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/automation/run-manual', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({
        title: "Manual Run Complete",
        description: "Automation cycle completed successfully.",
      });
    },
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeUntilNext = (nextRun: string) => {
    const next = new Date(nextRun);
    const now = new Date();
    const diffInMinutes = Math.floor((next.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Soon';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getAutomationHealth = () => {
    if (!status) return 0;
    let health = 50; // Base score
    
    if (status.isRunning) health += 25;
    if (status.autoSearch) health += 15;
    if (status.autoProposal) health += 10;
    
    return Math.min(100, health);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ 
                rotate: status?.isRunning ? 360 : 0,
                scale: status?.isRunning ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                rotate: { duration: 2, repeat: status?.isRunning ? Infinity : 0, ease: "linear" },
                scale: { duration: 0.5, repeat: status?.isRunning ? Infinity : 0 }
              }}
            >
              <Activity className={`h-5 w-5 ${status?.isRunning ? 'text-green-500' : 'text-gray-400'}`} />
            </motion.div>
            <CardTitle>Automation Control</CardTitle>
            <Badge variant={status?.isRunning ? "default" : "secondary"}>
              {status?.isRunning ? "Running" : "Stopped"}
            </Badge>
          </div>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Controls */}
        <div className="flex items-center gap-3">
          {status?.isRunning ? (
            <Button
              onClick={() => stopAutomationMutation.mutate()}
              disabled={stopAutomationMutation.isPending}
              variant="destructive"
              className="flex-1"
            >
              <Pause className="h-4 w-4 mr-2" />
              {stopAutomationMutation.isPending ? "Stopping..." : "Stop Automation"}
            </Button>
          ) : (
            <Button
              onClick={() => startAutomationMutation.mutate()}
              disabled={startAutomationMutation.isPending}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {startAutomationMutation.isPending ? "Starting..." : "Start Automation"}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => manualRunMutation.mutate()}
            disabled={manualRunMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${manualRunMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Automation Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Automation Health</span>
            <span className="font-medium">{getAutomationHealth()}%</span>
          </div>
          <Progress value={getAutomationHealth()} className="h-2" />
        </div>

        {/* Status Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              Last Run
            </div>
            <div className="font-medium">
              {status?.lastRun ? formatTime(status.lastRun) : 'Never'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Target className="h-3 w-3" />
              Next Run
            </div>
            <div className="font-medium">
              {status?.nextRun && status.isRunning ? getTimeUntilNext(status.nextRun) : 'Stopped'}
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Auto Project Search</div>
              <div className="text-xs text-gray-500">Automatically find matching projects</div>
            </div>
            <Switch
              checked={status?.autoSearch || false}
              disabled={true} // Controlled by settings page
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Auto Proposal Generation</div>
              <div className="text-xs text-gray-500">Generate and submit proposals automatically</div>
            </div>
            <Switch
              checked={status?.autoProposal || false}
              disabled={true} // Controlled by settings page
            />
          </div>
        </div>

        {/* Quick Stats */}
        {settings && (
          <div className="flex items-center gap-4 pt-2 border-t text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Max {settings.maxProposalsPerDay || 5}/day
            </div>
            {settings.minBudget && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                ${settings.minBudget}+ budget
              </div>
            )}
          </div>
        )}

        {/* Warning for incomplete setup */}
        {(!status?.autoSearch && !status?.autoProposal) && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800 dark:text-yellow-200">Setup Required</div>
              <div className="text-yellow-600 dark:text-yellow-400">
                Configure automation settings to enable automatic features.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
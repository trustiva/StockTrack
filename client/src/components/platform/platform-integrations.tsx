import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ExternalLink, 
  AlertCircle,
  Shield,
  Key,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlatformConnection {
  id: string;
  platform: string;
  isActive: boolean;
  lastSync: string | null;
  createdAt: string;
}

const SUPPORTED_PLATFORMS = [
  {
    id: 'upwork',
    name: 'Upwork',
    description: 'Connect to Upwork for project discovery and proposal submission',
    icon: '🔷',
    color: 'bg-green-50 border-green-200 text-green-800',
    credentials: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your Upwork API key' }
    ]
  },
  {
    id: 'freelancer',
    name: 'Freelancer.com',
    description: 'Access projects from Freelancer platform',
    icon: '🔵',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    credentials: [
      { key: 'username', label: 'Username', type: 'text', placeholder: 'Your Freelancer username' },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Your account password' }
    ]
  },
  {
    id: 'fiverr',
    name: 'Fiverr',
    description: 'Discover buyer requests and opportunities on Fiverr',
    icon: '🟢',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    credentials: [
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Enter your Fiverr access token' }
    ]
  }
];

export default function PlatformIntegrations() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch platform connections
  const { data: connections = [], isLoading } = useQuery<PlatformConnection[]>({
    queryKey: ['/api/platform-connections'],
  });

  // Add platform connection mutation
  const addConnectionMutation = useMutation({
    mutationFn: async (data: { platform: string; credentials: Record<string, string> }) => {
      return await apiRequest('/api/platform-connections', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-connections'] });
      setShowAddDialog(false);
      setSelectedPlatform('');
      setCredentials({});
      toast({
        title: "Platform Connected",
        description: "Successfully connected to the platform.",
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Could not connect to the platform. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  // Remove platform connection mutation
  const removeConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      await apiRequest(`/api/platform-connections/${connectionId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-connections'] });
      toast({
        title: "Platform Disconnected",
        description: "Platform connection has been removed.",
      });
    },
  });

  const handleAddConnection = () => {
    if (!selectedPlatform || Object.keys(credentials).length === 0) {
      return;
    }

    addConnectionMutation.mutate({
      platform: selectedPlatform,
      credentials,
    });
  };

  const getConnectedPlatforms = () => {
    return connections.map(conn => conn.platform);
  };

  const getAvailablePlatforms = () => {
    const connectedPlatforms = getConnectedPlatforms();
    return SUPPORTED_PLATFORMS.filter(platform => !connectedPlatforms.includes(platform.id));
  };

  const getPlatformInfo = (platformId: string) => {
    return SUPPORTED_PLATFORMS.find(p => p.id === platformId);
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Platform Integrations</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your freelancing platform accounts to enable automated project discovery
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button disabled={getAvailablePlatforms().length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Platform</DialogTitle>
              <DialogDescription>
                Add a new freelancing platform to expand your project discovery reach.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePlatforms().map((platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        <div className="flex items-center gap-2">
                          <span>{platform.icon}</span>
                          {platform.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlatform && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Secure Connection</span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Your credentials are encrypted and stored securely. We never store or share your passwords.
                    </p>
                  </div>

                  {getPlatformInfo(selectedPlatform)?.credentials.map((cred) => (
                    <div key={cred.key} className="space-y-2">
                      <Label htmlFor={cred.key}>{cred.label}</Label>
                      <Input
                        id={cred.key}
                        type={cred.type}
                        placeholder={cred.placeholder}
                        value={credentials[cred.key] || ''}
                        onChange={(e) => setCredentials(prev => ({
                          ...prev,
                          [cred.key]: e.target.value
                        }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setSelectedPlatform('');
                    setCredentials({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddConnection}
                  disabled={!selectedPlatform || Object.keys(credentials).length === 0 || addConnectionMutation.isPending}
                >
                  {addConnectionMutation.isPending ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connected Platforms */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : connections.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection, index) => {
            const platformInfo = getPlatformInfo(connection.platform);
            if (!platformInfo) return null;

            return (
              <motion.div
                key={connection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative overflow-hidden ${connection.isActive ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-800'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{platformInfo.icon}</div>
                        <div>
                          <CardTitle className="text-base">{platformInfo.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={connection.isActive ? "default" : "secondary"} className="text-xs">
                              {connection.isActive ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Connected
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConnectionMutation.mutate(connection.id)}
                        disabled={removeConnectionMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {platformInfo.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Last sync: {formatLastSync(connection.lastSync)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          Secure
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Test Connection
                        </Button>
                      </div>
                    </div>
                  </CardContent>

                  {connection.isActive && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full transform translate-x-1 -translate-y-1"></div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No Platforms Connected</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Connect your freelancing platform accounts to start discovering projects automatically.
                </p>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Your First Platform
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">Security & Privacy</div>
              <div className="text-blue-700 dark:text-blue-300">
                Your platform credentials are encrypted and stored securely. We use industry-standard security measures 
                to protect your data and never share your information with third parties. You can disconnect any platform 
                at any time.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
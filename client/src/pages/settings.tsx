import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { X, Plus, LogOut } from "lucide-react";

const automationSettingsSchema = z.object({
  autoSearch: z.boolean().default(true),
  autoProposal: z.boolean().default(false),
  emailNotifications: z.boolean().default(true),
  minBudget: z.string().optional(),
  maxBudget: z.string().optional(),
  preferredSkills: z.array(z.string()).default([]),
  excludeKeywords: z.array(z.string()).default([]),
  maxProposalsPerDay: z.number().min(1).max(50).default(5),
});

type AutomationSettingsFormData = z.infer<typeof automationSettingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/automation/settings"],
    enabled: isAuthenticated,
  });

  const form = useForm<AutomationSettingsFormData>({
    resolver: zodResolver(automationSettingsSchema),
    defaultValues: {
      autoSearch: true,
      autoProposal: false,
      emailNotifications: true,
      minBudget: "",
      maxBudget: "",
      preferredSkills: [],
      excludeKeywords: [],
      maxProposalsPerDay: 5,
    },
  });

  // Update form when settings data loads
  useEffect(() => {
    if (settings) {
      form.reset({
        autoSearch: settings.autoSearch ?? true,
        autoProposal: settings.autoProposal ?? false,
        emailNotifications: settings.emailNotifications ?? true,
        minBudget: settings.minBudget || "",
        maxBudget: settings.maxBudget || "",
        preferredSkills: settings.preferredSkills || [],
        excludeKeywords: settings.excludeKeywords || [],
        maxProposalsPerDay: settings.maxProposalsPerDay || 5,
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: AutomationSettingsFormData) => {
      return await apiRequest("POST", "/api/automation/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/automation/settings"] });
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
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const onSubmit = (data: AutomationSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const addSkill = (skillInput: HTMLInputElement) => {
    const skill = skillInput.value.trim();
    if (skill && !form.getValues("preferredSkills").includes(skill)) {
      const currentSkills = form.getValues("preferredSkills");
      form.setValue("preferredSkills", [...currentSkills, skill]);
      skillInput.value = "";
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues("preferredSkills");
    form.setValue("preferredSkills", currentSkills.filter(skill => skill !== skillToRemove));
  };

  const addKeyword = (keywordInput: HTMLInputElement) => {
    const keyword = keywordInput.value.trim();
    if (keyword && !form.getValues("excludeKeywords").includes(keyword)) {
      const currentKeywords = form.getValues("excludeKeywords");
      form.setValue("excludeKeywords", [...currentKeywords, keyword]);
      keywordInput.value = "";
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const currentKeywords = form.getValues("excludeKeywords");
    form.setValue("excludeKeywords", currentKeywords.filter(keyword => keyword !== keywordToRemove));
  };

  if (authLoading) {
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
          title="Settings"
          description="Configure your automation preferences and account settings"
        />
        
        <div className="p-6">
          <Tabs defaultValue="automation" className="space-y-6">
            <TabsList>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
            </TabsList>

            <TabsContent value="automation">
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle>Automation Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-6">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Automation Controls */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Automation Controls</h3>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Auto-search for Projects</Label>
                            <p className="text-sm text-gray-600">
                              Automatically search for new projects matching your criteria
                            </p>
                          </div>
                          <Switch
                            checked={form.watch("autoSearch")}
                            onCheckedChange={(checked) => form.setValue("autoSearch", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Auto-generate Proposals</Label>
                            <p className="text-sm text-gray-600">
                              Automatically generate and submit proposals for matching projects
                            </p>
                          </div>
                          <Switch
                            checked={form.watch("autoProposal")}
                            onCheckedChange={(checked) => form.setValue("autoProposal", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-gray-600">
                              Receive email alerts for new projects and proposal updates
                            </p>
                          </div>
                          <Switch
                            checked={form.watch("emailNotifications")}
                            onCheckedChange={(checked) => form.setValue("emailNotifications", checked)}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Budget Filters */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Budget Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="minBudget">Minimum Budget ($)</Label>
                            <Input
                              id="minBudget"
                              type="number"
                              placeholder="500"
                              {...form.register("minBudget")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maxBudget">Maximum Budget ($)</Label>
                            <Input
                              id="maxBudget"
                              type="number"
                              placeholder="5000"
                              {...form.register("maxBudget")}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Skill Preferences */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Preferred Skills</h3>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add a skill..."
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addSkill(e.target as HTMLInputElement);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                              addSkill(input);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.watch("preferredSkills").map((skill) => (
                            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                              {skill}
                              <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => removeSkill(skill)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Exclude Keywords */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Exclude Keywords</h3>
                        <p className="text-sm text-gray-600">
                          Projects containing these keywords will be filtered out
                        </p>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add a keyword to exclude..."
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addKeyword(e.target as HTMLInputElement);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                              addKeyword(input);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.watch("excludeKeywords").map((keyword) => (
                            <Badge key={keyword} variant="destructive" className="flex items-center gap-1">
                              {keyword}
                              <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => removeKeyword(keyword)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Limits */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Daily Limits</h3>
                        <div className="space-y-2">
                          <Label htmlFor="maxProposalsPerDay">Maximum Proposals Per Day</Label>
                          <Input
                            id="maxProposalsPerDay"
                            type="number"
                            min="1"
                            max="50"
                            {...form.register("maxProposalsPerDay", { valueAsNumber: true })}
                          />
                          <p className="text-sm text-gray-600">
                            Limit automatic proposal submissions to prevent spam
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={updateSettingsMutation.isPending}
                          className="bg-primary hover:bg-blue-600"
                        >
                          {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover" 
                    />
                    <div>
                      <h3 className="text-lg font-medium">
                        {user?.firstName && user?.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user?.email || "User"}
                      </h3>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                      <Badge variant="secondary" className="mt-1">Premium Plan</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input value={user?.firstName || ""} disabled />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input value={user?.lastName || ""} disabled />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={user?.email || ""} disabled />
                      </div>
                      <div>
                        <Label>Member Since</Label>
                        <Input 
                          value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"} 
                          disabled 
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Danger Zone</h3>
                    <div className="border border-red-200 rounded-lg p-4">
                      <Button 
                        variant="destructive" 
                        onClick={() => window.location.href = "/api/logout"}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>New Project Matches</Label>
                        <p className="text-sm text-gray-600">
                          Get notified when new projects match your criteria
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Proposal Updates</Label>
                        <p className="text-sm text-gray-600">
                          Receive notifications when clients respond to your proposals
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Summary</Label>
                        <p className="text-sm text-gray-600">
                          Get a weekly summary of your freelancing activity
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>System Updates</Label>
                        <p className="text-sm text-gray-600">
                          Important updates about FreelanceAuto features and changes
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="platforms">
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle>Platform Connections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-600">
                    Connect your freelancing platform accounts to enable automatic project searching and proposal submission.
                  </p>

                  <div className="space-y-4">
                    {['Upwork', 'Freelancer', 'Fiverr', 'Guru'].map((platform) => (
                      <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-medium">{platform.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="font-medium">{platform}</h3>
                            <p className="text-sm text-gray-600">Not connected</p>
                          </div>
                        </div>
                        <Button variant="outline" disabled>
                          Connect (Coming Soon)
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Platform Integration</h4>
                    <p className="text-sm text-blue-800">
                      Platform integrations are currently in development. Once available, you'll be able to connect your accounts for seamless automation across all major freelancing platforms.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

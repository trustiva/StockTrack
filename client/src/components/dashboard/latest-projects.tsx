import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { RefreshCw, Filter, ExternalLink } from "lucide-react";

export default function LatestProjects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const refreshProjectsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/projects/search", {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Projects refreshed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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
        description: "Failed to refresh projects. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateProposalMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest("POST", "/api/proposals/generate", {
        projectId,
        customInstructions: "Generate a professional proposal for this project"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Proposal generated and ready for review!",
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

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-16 w-full mb-3" />
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "upwork":
        return "bg-blue-100 text-blue-800";
      case "freelancer":
        return "bg-green-100 text-green-800";
      case "fiverr":
        return "bg-purple-100 text-purple-800";
      case "guru":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const latestProjects = projects.slice(0, 4);

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Latest Projects Found</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={refreshProjectsMutation.isPending}
              onClick={() => refreshProjectsMutation.mutate()}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshProjectsMutation.isPending ? 'animate-spin' : ''}`} />
              {refreshProjectsMutation.isPending ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {latestProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No projects found yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Refresh" to search for new projects</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestProjects.map((project: any) => (
              <div 
                key={project.id} 
                className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Budget: {project.budget} • {project.budgetType}
                    </p>
                  </div>
                  <Badge className={getPlatformColor(project.platform)}>
                    {project.platform}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2 flex-wrap">
                    {project.skills?.slice(0, 2).map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {project.skills?.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{project.skills.length - 2} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {project.matchScore && (
                      <span className="text-xs text-gray-500">
                        Match: {project.matchScore}%
                      </span>
                    )}
                    {project.projectUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                      >
                        <a 
                          href={project.projectUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      className="bg-primary text-white hover:bg-blue-600 text-xs px-3 py-1"
                      disabled={generateProposalMutation.isPending}
                      onClick={() => generateProposalMutation.mutate(project.id)}
                    >
                      {generateProposalMutation.isPending ? "Applying..." : "Auto Apply"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

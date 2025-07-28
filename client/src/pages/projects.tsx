import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Filter, Search, ExternalLink, Wand2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Projects() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [filters, setFilters] = useState({
    platform: "",
    minMatchScore: "",
    skills: ""
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/projects", filters],
    enabled: isAuthenticated,
  });

  const searchProjectsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/projects/search", {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New projects found and added!",
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
        description: "Failed to search for projects. Please try again.",
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

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
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

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
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
          title="Project Search"
          description="Discover and apply to relevant freelance projects"
        />
        
        <div className="p-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Search & Filters</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={searchProjectsMutation.isPending}
                    onClick={() => searchProjectsMutation.mutate()}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${searchProjectsMutation.isPending ? 'animate-spin' : ''}`} />
                    {searchProjectsMutation.isPending ? "Searching..." : "Search New"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Select 
                    value={filters.platform} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Platforms</SelectItem>
                      <SelectItem value="upwork">Upwork</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                      <SelectItem value="fiverr">Fiverr</SelectItem>
                      <SelectItem value="guru">Guru</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Input
                    placeholder="Skills (comma separated)"
                    value={filters.skills}
                    onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Select 
                    value={filters.minMatchScore} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, minMatchScore: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Min Match Score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Score</SelectItem>
                      <SelectItem value="90">90%+ Excellent</SelectItem>
                      <SelectItem value="75">75%+ Good</SelectItem>
                      <SelectItem value="60">60%+ Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Button className="w-full bg-primary hover:bg-blue-600">
                    <Search className="w-4 h-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-16 w-full mb-3" />
                    <div className="flex justify-between">
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : projects.length === 0 ? (
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your filters or search for new projects.</p>
                    <Button 
                      onClick={() => searchProjectsMutation.mutate()}
                      disabled={searchProjectsMutation.isPending}
                      className="bg-primary hover:bg-blue-600"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search Projects
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              projects.map((project: any) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Budget: {project.budget} • {project.budgetType}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPlatformColor(project.platform)}>
                          {project.platform}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-2 flex-wrap">
                        {project.skills?.slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {project.skills?.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{project.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {project.matchScore && (
                          <span className={`font-medium ${getMatchScoreColor(project.matchScore)}`}>
                            Match: {project.matchScore}%
                          </span>
                        )}
                        <span>
                          Posted: {project.createdAt 
                            ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })
                            : "Recently"
                          }
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProject(project)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                        {project.projectUrl && (
                          <Button 
                            variant="outline" 
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
                          className="bg-primary text-white hover:bg-blue-600"
                          disabled={generateProposalMutation.isPending}
                          onClick={() => generateProposalMutation.mutate(project.id)}
                        >
                          <Wand2 className="w-3 h-3 mr-1" />
                          Auto Apply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Project Details Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{selectedProject.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getPlatformColor(selectedProject.platform)}>
                      {selectedProject.platform}
                    </Badge>
                    {selectedProject.matchScore && (
                      <Badge variant="outline" className={getMatchScoreColor(selectedProject.matchScore)}>
                        {selectedProject.matchScore}% Match
                      </Badge>
                    )}
                  </div>
                </div>
                {selectedProject.projectUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedProject.projectUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Platform
                    </a>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Budget:</span>
                  <span className="ml-2 font-medium">{selectedProject.budget}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">{selectedProject.budgetType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Client:</span>
                  <span className="ml-2 font-medium">{selectedProject.clientName || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rating:</span>
                  <span className="ml-2 font-medium">{selectedProject.clientRating ? `${selectedProject.clientRating}/5` : "Not rated"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Description:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedProject.description}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Required Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.skills?.map((skill: string) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedProject.deadline && (
                <div>
                  <span className="text-gray-600">Deadline:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedProject.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  className="flex-1 bg-primary hover:bg-blue-600"
                  disabled={generateProposalMutation.isPending}
                  onClick={() => {
                    generateProposalMutation.mutate(selectedProject.id);
                    setSelectedProject(null);
                  }}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {generateProposalMutation.isPending ? "Generating..." : "Generate Proposal"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedProject(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

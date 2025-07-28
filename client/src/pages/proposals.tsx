import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProposalGenerator from "@/components/proposals/proposal-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { Eye, ExternalLink, Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default function Proposals() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["/api/proposals"],
    enabled: isAuthenticated,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const filterProposals = (status?: string) => {
    if (!status) return proposals;
    return proposals.filter((proposal: any) => proposal.status === status);
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
          title="Proposals"
          description="Manage and track your proposal submissions"
        />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <div className="text-sm text-gray-600">
                Total: <span className="font-medium">{proposals.length}</span>
              </div>
              <div className="text-sm text-gray-600">
                Pending: <span className="font-medium">{filterProposals("pending").length}</span>
              </div>
              <div className="text-sm text-gray-600">
                Accepted: <span className="font-medium text-green-600">{filterProposals("accepted").length}</span>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowGenerator(true)}
              className="bg-primary hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate New Proposal
            </Button>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Proposals</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ProposalList 
                proposals={proposals}
                isLoading={isLoading}
                onViewProposal={setSelectedProposal}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPlatformColor={getPlatformColor}
              />
            </TabsContent>

            <TabsContent value="pending">
              <ProposalList 
                proposals={filterProposals("pending")}
                isLoading={isLoading}
                onViewProposal={setSelectedProposal}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPlatformColor={getPlatformColor}
              />
            </TabsContent>

            <TabsContent value="accepted">
              <ProposalList 
                proposals={filterProposals("accepted")}
                isLoading={isLoading}
                onViewProposal={setSelectedProposal}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPlatformColor={getPlatformColor}
              />
            </TabsContent>

            <TabsContent value="rejected">
              <ProposalList 
                proposals={filterProposals("rejected")}
                isLoading={isLoading}
                onViewProposal={setSelectedProposal}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getPlatformColor={getPlatformColor}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Proposal Generator Modal */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate New Proposal</DialogTitle>
          </DialogHeader>
          <ProposalGenerator onClose={() => setShowGenerator(false)} />
        </DialogContent>
      </Dialog>

      {/* Proposal Details Modal */}
      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{selectedProposal.project?.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getPlatformColor(selectedProposal.project?.platform)}>
                      {selectedProposal.project?.platform}
                    </Badge>
                    <Badge className={getStatusColor(selectedProposal.status)}>
                      {selectedProposal.status}
                    </Badge>
                  </div>
                </div>
                {selectedProposal.project?.projectUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedProposal.project.projectUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Project
                    </a>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Bid Amount:</span>
                  <span className="ml-2 font-medium">{selectedProposal.bidAmount || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Timeline:</span>
                  <span className="ml-2 font-medium">{selectedProposal.proposedTimeline || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Submitted:</span>
                  <span className="ml-2 font-medium">
                    {selectedProposal.createdAt 
                      ? formatDistanceToNow(new Date(selectedProposal.createdAt), { addSuffix: true })
                      : "Unknown"
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Auto-generated:</span>
                  <span className="ml-2 font-medium">{selectedProposal.isAutoGenerated ? "Yes" : "No"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Proposal Content:</h4>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                  {selectedProposal.content}
                </div>
              </div>

              {selectedProposal.feedback && (
                <div>
                  <h4 className="font-medium mb-2">Client Feedback:</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    {selectedProposal.feedback}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProposalList({ 
  proposals, 
  isLoading, 
  onViewProposal,
  getStatusIcon,
  getStatusColor,
  getPlatformColor
}: {
  proposals: any[];
  isLoading: boolean;
  onViewProposal: (proposal: any) => void;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  getPlatformColor: (platform: string) => string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
          <p className="text-gray-600">Start by generating proposals for available projects.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal: any) => (
        <Card key={proposal.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">
                  {proposal.project?.title || "Project Title"}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {proposal.project?.platform} • {proposal.project?.budget} • {proposal.project?.budgetType}
                </p>
                
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={getPlatformColor(proposal.project?.platform)}>
                    {proposal.project?.platform}
                  </Badge>
                  <Badge className={getStatusColor(proposal.status)}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(proposal.status)}
                      <span>{proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}</span>
                    </span>
                  </Badge>
                  {proposal.isAutoGenerated && (
                    <Badge variant="outline">Auto-generated</Badge>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>
                    Submitted: {proposal.createdAt 
                      ? formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })
                      : "Recently"
                    }
                  </span>
                  {proposal.bidAmount && (
                    <span>Bid: {proposal.bidAmount}</span>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewProposal(proposal)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

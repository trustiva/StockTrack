import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Wand2, Copy, Send, Eye } from "lucide-react";

const proposalGeneratorSchema = z.object({
  projectId: z.string().min(1, "Please select a project"),
  customInstructions: z.string().optional(),
  bidAmount: z.string().optional(),
  proposedTimeline: z.string().optional(),
});

type ProposalGeneratorFormData = z.infer<typeof proposalGeneratorSchema>;

interface ProposalGeneratorProps {
  onClose: () => void;
}

export default function ProposalGenerator({ onClose }: ProposalGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedProposal, setGeneratedProposal] = useState<any>(null);
  const [step, setStep] = useState<"select" | "customize" | "preview">("select");

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const form = useForm<ProposalGeneratorFormData>({
    resolver: zodResolver(proposalGeneratorSchema),
    defaultValues: {
      projectId: "",
      customInstructions: "",
      bidAmount: "",
      proposedTimeline: "",
    },
  });

  const generateProposalMutation = useMutation({
    mutationFn: async (data: ProposalGeneratorFormData) => {
      const response = await apiRequest("POST", "/api/proposals/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedProposal(data);
      setStep("preview");
      toast({
        title: "Success",
        description: "Proposal generated successfully!",
      });
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

  const submitProposalMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would submit the proposal to the platform
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Proposal submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit proposal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const selectedProject = projects.find((p: any) => p.id === form.watch("projectId"));

  const onGenerate = (data: ProposalGeneratorFormData) => {
    generateProposalMutation.mutate(data);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Proposal copied to clipboard!",
    });
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

  if (step === "select") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Select a Project</h3>
          <p className="text-sm text-gray-600">Choose a project to generate a proposal for</p>
        </div>

        {projectsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No projects available</p>
              <p className="text-sm text-gray-400 mt-1">Search for projects first to generate proposals</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {projects.map((project: any) => (
              <Card 
                key={project.id} 
                className={`cursor-pointer transition-colors ${
                  form.watch("projectId") === project.id 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-gray-300"
                }`}
                onClick={() => form.setValue("projectId", project.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium line-clamp-1">{project.title}</h4>
                    <Badge className={getPlatformColor(project.platform)}>
                      {project.platform}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {project.budget} • {project.budgetType}
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
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
                    {project.matchScore && (
                      <span className="text-xs text-green-600 font-medium">
                        {project.matchScore}% match
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => setStep("customize")}
            disabled={!form.watch("projectId")}
            className="bg-primary hover:bg-blue-600"
          >
            Next: Customize
          </Button>
        </div>
      </div>
    );
  }

  if (step === "customize") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Customize Your Proposal</h3>
          <p className="text-sm text-gray-600">Add any specific instructions or details</p>
        </div>

        {selectedProject && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium">{selectedProject.title}</h4>
                <Badge className={getPlatformColor(selectedProject.platform)}>
                  {selectedProject.platform}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {selectedProject.budget} • {selectedProject.budgetType}
              </p>
              <p className="text-sm text-gray-700">
                {selectedProject.description}
              </p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
            <Textarea
              id="customInstructions"
              placeholder="Add any specific points you want to include in the proposal..."
              rows={4}
              {...form.register("customInstructions")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bidAmount">Suggested Bid Amount</Label>
              <Input
                id="bidAmount"
                placeholder="Leave empty for AI suggestion"
                {...form.register("bidAmount")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposedTimeline">Proposed Timeline</Label>
              <Input
                id="proposedTimeline"
                placeholder="Leave empty for AI suggestion"
                {...form.register("proposedTimeline")}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button 
              type="submit"
              disabled={generateProposalMutation.isPending}
              className="bg-primary hover:bg-blue-600"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {generateProposalMutation.isPending ? "Generating..." : "Generate Proposal"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Generated Proposal</h3>
        <p className="text-sm text-gray-600">Review and submit your proposal</p>
      </div>

      {generatedProposal && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Proposal Preview</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedProposal.content)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bid Amount:</span>
                    <span className="ml-2 font-medium">{generatedProposal.bidAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Timeline:</span>
                    <span className="ml-2 font-medium">{generatedProposal.timeline}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Proposal Content:</h4>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {generatedProposal.content}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("customize")}>
              Back to Edit
            </Button>
            <div className="space-x-2">
              <Button 
                variant="outline"
                onClick={() => copyToClipboard(generatedProposal.content)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy & Close
              </Button>
              <Button
                onClick={() => submitProposalMutation.mutate()}
                disabled={submitProposalMutation.isPending}
                className="bg-primary hover:bg-blue-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitProposalMutation.isPending ? "Submitting..." : "Submit Proposal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

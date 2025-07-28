import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Wand2, UserPen } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function QuickActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchProjectsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/projects/search", {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New projects found and added to your dashboard!",
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

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full bg-primary text-white hover:bg-blue-600"
          disabled={searchProjectsMutation.isPending}
          onClick={() => searchProjectsMutation.mutate()}
        >
          <Search className="w-4 h-4 mr-2" />
          {searchProjectsMutation.isPending ? "Searching..." : "Find New Projects"}
        </Button>
        
        <Link href="/proposals">
          <Button variant="secondary" className="w-full">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Proposal
          </Button>
        </Link>
        
        <Link href="/profile">
          <Button variant="secondary" className="w-full">
            <UserPen className="w-4 h-4 mr-2" />
            Update Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

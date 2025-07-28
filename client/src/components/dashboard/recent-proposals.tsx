import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function RecentProposals() {
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["/api/proposals"],
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <div className="flex space-x-2 mb-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

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

  const recentProposals = proposals.slice(0, 3);

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Proposals</h2>
          <Link href="/proposals">
            <Button variant="ghost" size="sm" className="text-primary hover:text-blue-600">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {recentProposals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No proposals yet</p>
            <p className="text-sm text-gray-400 mt-1">Start by searching for projects!</p>
          </div>
        ) : (
          recentProposals.map((proposal: any) => (
            <div 
              key={proposal.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {proposal.project?.title || "Project Title"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {proposal.project?.platform || "Platform"} • {proposal.project?.budget || "Budget TBD"} • {proposal.project?.budgetType || "Type"}
                </p>
                <div className="flex items-center mt-2 space-x-2">
                  {proposal.project?.skills?.slice(0, 2).map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {proposal.project?.skills?.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{proposal.project.skills.length - 2} more
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(proposal.status)}>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {proposal.createdAt 
                    ? formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })
                    : "Recently"
                  }
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

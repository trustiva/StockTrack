import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Target, Clock, DollarSign, Send, CheckCircle, XCircle } from "lucide-react";

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
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

  const calculateAnalytics = () => {
    if (!proposals.length) return null;

    const totalProposals = proposals.length;
    const acceptedProposals = proposals.filter((p: any) => p.status === "accepted").length;
    const rejectedProposals = proposals.filter((p: any) => p.status === "rejected").length;
    const pendingProposals = proposals.filter((p: any) => p.status === "pending").length;
    
    const successRate = totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0;
    const rejectionRate = totalProposals > 0 ? (rejectedProposals / totalProposals) * 100 : 0;
    
    // Calculate platform breakdown
    const platformStats = proposals.reduce((acc: any, proposal: any) => {
      const platform = proposal.project?.platform || "unknown";
      if (!acc[platform]) {
        acc[platform] = { total: 0, accepted: 0, rejected: 0, pending: 0 };
      }
      acc[platform].total++;
      acc[platform][proposal.status]++;
      return acc;
    }, {});

    // Calculate monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = proposals
      .filter((p: any) => new Date(p.createdAt) >= sixMonthsAgo)
      .reduce((acc: any, proposal: any) => {
        const month = new Date(proposal.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { total: 0, accepted: 0 };
        }
        acc[month].total++;
        if (proposal.status === "accepted") {
          acc[month].accepted++;
        }
        return acc;
      }, {});

    return {
      totalProposals,
      acceptedProposals,
      rejectedProposals,
      pendingProposals,
      successRate,
      rejectionRate,
      platformStats,
      monthlyData,
    };
  };

  const analytics = calculateAnalytics();

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
          title="Analytics"
          description="Track your freelancing performance and success metrics"
        />
        
        <div className="p-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {statsLoading ? <Skeleton className="h-8 w-16" /> : (stats?.activeProposals || 0) + (analytics?.acceptedProposals || 0) + (analytics?.rejectedProposals || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Send className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+12%</span>
                  <span className="text-gray-600 ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {statsLoading ? <Skeleton className="h-8 w-16" /> : `${Math.round(analytics?.successRate || 0)}%`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+8%</span>
                  <span className="text-gray-600 ml-2">improvement</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {statsLoading ? <Skeleton className="h-8 w-16" /> : `$${stats?.monthlyEarnings?.toLocaleString() || 0}`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+24%</span>
                  <span className="text-gray-600 ml-2">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {statsLoading ? <Skeleton className="h-8 w-16" /> : "2.4h"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">-15min</span>
                  <span className="text-gray-600 ml-2">faster</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {proposalsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    ) : analytics ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">Accepted</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{analytics.acceptedProposals}</span>
                            <Progress value={(analytics.acceptedProposals / analytics.totalProposals) * 100} className="w-20" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-gray-600">Pending</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{analytics.pendingProposals}</span>
                            <Progress value={(analytics.pendingProposals / analytics.totalProposals) * 100} className="w-20" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-gray-600">Rejected</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{analytics.rejectedProposals}</span>
                            <Progress value={(analytics.rejectedProposals / analytics.totalProposals) * 100} className="w-20" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="text-sm font-medium text-green-600">
                          {analytics?.successRate ? `${Math.round(analytics.successRate)}%` : "0%"}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Rejection Rate</span>
                        <span className="text-sm font-medium text-red-600">
                          {analytics?.rejectionRate ? `${Math.round(analytics.rejectionRate)}%` : "0%"}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Auto-generated</span>
                        <span className="text-sm font-medium">
                          {proposals.filter((p: any) => p.isAutoGenerated).length} / {proposals.length}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg. Bid Amount</span>
                        <span className="text-sm font-medium">
                          ${proposals.length > 0 
                            ? Math.round(proposals.reduce((sum: number, p: any) => {
                                const amount = parseFloat(p.bidAmount?.replace(/[^0-9.]/g, '') || '0');
                                return sum + amount;
                              }, 0) / proposals.length)
                            : 0
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="platforms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {proposalsLoading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : analytics?.platformStats ? (
                    <div className="space-y-4">
                      {Object.entries(analytics.platformStats).map(([platform, stats]: [string, any]) => (
                        <div key={platform} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{platform.charAt(0).toUpperCase() + platform.slice(1)}</Badge>
                              <span className="text-sm text-gray-600">
                                {stats.total} proposals
                              </span>
                            </div>
                            <span className="text-sm font-medium text-green-600">
                              {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}% success
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-medium text-green-600">{stats.accepted}</p>
                              <p className="text-gray-500">Accepted</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-yellow-600">{stats.pending}</p>
                              <p className="text-gray-500">Pending</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-red-600">{stats.rejected}</p>
                              <p className="text-gray-500">Rejected</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No platform data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.monthlyData ? (
                    <div className="space-y-4">
                      {Object.entries(analytics.monthlyData).map(([month, data]: [string, any]) => (
                        <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{month}</span>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-600">{data.total} proposals</span>
                            <span className="text-green-600">{data.accepted} accepted</span>
                            <span className="font-medium">
                              {data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0}% success
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No trend data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['React', 'Node.js', 'TypeScript', 'Python', 'UI/UX'].map((skill, index) => (
                        <div key={skill} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{skill}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={(5 - index) * 20} className="w-20" />
                            <span className="text-sm font-medium">{(5 - index) * 20}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Response Times</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Response</span>
                        <span className="text-sm font-medium">2.4 hours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Fastest Response</span>
                        <span className="text-sm font-medium">15 minutes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Response Rate</span>
                        <span className="text-sm font-medium">95%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

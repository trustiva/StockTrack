import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Send, DollarSign, Bot } from "lucide-react";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-4" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Active Proposals",
      value: stats?.activeProposals || 0,
      icon: Send,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12%",
      changeText: "from last week"
    },
    {
      title: "Success Rate",
      value: `${Math.round(stats?.successRate || 0)}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+8%",
      changeText: "improvement"
    },
    {
      title: "Monthly Earnings",
      value: `$${stats?.monthlyEarnings?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: "+24%",
      changeText: "vs last month"
    },
    {
      title: "Auto Applications",
      value: stats?.autoApplications || 0,
      icon: Bot,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "+18",
      changeText: "this week"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        
        return (
          <Card key={card.title} className="p-6 shadow-sm border border-gray-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.color} w-6 h-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">{card.change}</span>
                <span className="text-gray-600 ml-2">{card.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

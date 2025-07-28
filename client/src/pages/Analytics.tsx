import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Target, Award, AlertCircle } from 'lucide-react';

interface MarketTrend {
  skill: string;
  demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  averageRate: number;
  rateChange: number;
  competitionLevel: 'low' | 'medium' | 'high';
  growthTrend: 'declining' | 'stable' | 'growing' | 'surging';
}

interface MarketReport {
  summary: {
    totalOpportunities: number;
    avgCompetition: string;
    skillsInDemand: string[];
    recommendedFocus: string[];
  };
  trends: MarketTrend[];
  opportunities: Array<{
    skill: string;
    potential: 'high' | 'medium' | 'low';
    marketGap: number;
    action: string;
  }>;
}

export default function Analytics() {
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/market-analytics/trends'],
    enabled: true,
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['/api/market-analytics/report'],
    enabled: true,
  });

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getGrowthIcon = (trend: string) => {
    switch (trend) {
      case 'surging':
      case 'growing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  if (trendsLoading || reportLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Market Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const marketReport = report as MarketReport;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Market Analytics</h1>
        <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Market Overview */}
      {marketReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketReport.summary.totalOpportunities}</div>
              <p className="text-xs text-muted-foreground">Active projects available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competition Level</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{marketReport.summary.avgCompetition}</div>
              <p className="text-xs text-muted-foreground">Average market competition</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketReport.summary.skillsInDemand.length}</div>
              <p className="text-xs text-muted-foreground">Skills in high demand</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recommended Focus</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketReport.summary.recommendedFocus.length}</div>
              <p className="text-xs text-muted-foreground">Areas to focus on</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Market Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Market Trends by Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(trends) && (trends as MarketTrend[]).map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={getDemandColor(trend.demandLevel)}>
                      {trend.demandLevel.replace('_', ' ')}
                    </Badge>
                    {getGrowthIcon(trend.growthTrend)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{trend.skill}</h3>
                    <p className="text-sm text-gray-600">
                      Competition: {trend.competitionLevel} • Growth: {trend.growthTrend}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${trend.averageRate}/hr</div>
                  <div className={`text-sm ${trend.rateChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.rateChange >= 0 ? '+' : ''}{trend.rateChange.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Opportunities */}
      {marketReport?.opportunities && (
        <Card>
          <CardHeader>
            <CardTitle>Market Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketReport.opportunities.map((opportunity, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{opportunity.skill}</h3>
                    <Badge variant={opportunity.potential === 'high' ? 'default' : 
                      opportunity.potential === 'medium' ? 'secondary' : 'outline'}>
                      {opportunity.potential} potential
                    </Badge>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Market Gap</span>
                      <span>{opportunity.marketGap}%</span>
                    </div>
                    <Progress value={opportunity.marketGap} className="h-2" />
                  </div>
                  <p className="text-sm text-gray-600">{opportunity.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills in Demand */}
      {marketReport?.summary.skillsInDemand && (
        <Card>
          <CardHeader>
            <CardTitle>Skills in High Demand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {marketReport.summary.skillsInDemand.map((skill, index) => (
                <Badge key={index} variant="outline" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Focus Areas */}
      {marketReport?.summary.recommendedFocus && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Focus Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marketReport.summary.recommendedFocus.map((focus, index) => (
                <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">{focus}</h3>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
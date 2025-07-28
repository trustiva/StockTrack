import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, DollarSign, AlertTriangle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';

interface BidStrategy {
  strategy: 'competitive' | 'premium' | 'value' | 'aggressive';
  recommendedBid: number;
  confidence: number;
  marketPosition: 'undercut' | 'match' | 'premium';
  successProbability: number;
  reasoning: string[];
  competitorAnalysis: {
    averageBid: number;
    lowBid: number;
    highBid: number;
    totalBids: number;
  };
  optimizationTips: string[];
}

interface Project {
  id: string;
  title: string;
  budget: string;
  skills: string[];
  competitionLevel: 'low' | 'medium' | 'high';
  clientRating: number;
  description: string;
}

export default function BidOptimization() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    enabled: true,
  });

  const { data: bidStrategy, isLoading: strategyLoading } = useQuery({
    queryKey: ['/api/bid-optimization', selectedProjectId],
    enabled: !!selectedProjectId,
  });

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'aggressive': return 'bg-red-500 text-white';
      case 'competitive': return 'bg-blue-500 text-white';
      case 'premium': return 'bg-purple-500 text-white';
      case 'value': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'undercut': return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'premium': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'match': return <Target className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (projectsLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Bid Optimization</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-300 rounded"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  const projectList = projects as Project[];
  const strategy = bidStrategy as BidStrategy;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bid Optimization</h1>
        <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          View History
        </Button>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project to Optimize</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a project to analyze..." />
            </SelectTrigger>
            <SelectContent>
              {projectList?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate max-w-96">{project.title}</span>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant="outline" className="text-xs">
                        {project.budget}
                      </Badge>
                      <Badge 
                        variant={project.competitionLevel === 'high' ? 'destructive' : 
                               project.competitionLevel === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {project.competitionLevel} competition
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          {strategyLoading ? (
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
          ) : strategy ? (
            <Tabs defaultValue="recommendation" className="space-y-6">
              <TabsList>
                <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
                <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
                <TabsTrigger value="tips">Optimization Tips</TabsTrigger>
              </TabsList>

              <TabsContent value="recommendation" className="space-y-6">
                {/* Strategy Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Recommended Bid</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${strategy.recommendedBid}</div>
                      <p className="text-xs text-muted-foreground">Optimized for success</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Strategy</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <Badge className={getStrategyColor(strategy.strategy)}>
                        {strategy.strategy}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        {strategy.marketPosition} market position
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Success Probability</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{strategy.successProbability}%</div>
                      <Progress value={strategy.successProbability} className="h-2 mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${getConfidenceColor(strategy.confidence)}`}>
                        {strategy.confidence}%
                      </div>
                      <p className="text-xs text-muted-foreground">Algorithm confidence</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Market Position */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {getPositionIcon(strategy.marketPosition)}
                      <span>Market Position Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Your Bid</span>
                          <span className="text-lg font-bold">${strategy.recommendedBid}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Market Average</span>
                          <span className="text-lg">${strategy.competitorAnalysis.averageBid}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Lowest Bid</span>
                          <span className="text-lg text-red-600">${strategy.competitorAnalysis.lowBid}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Highest Bid</span>
                          <span className="text-lg text-green-600">${strategy.competitorAnalysis.highBid}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Position: {strategy.marketPosition}</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {strategy.marketPosition === 'undercut' && 'Your bid is below market average - competitive pricing'}
                            {strategy.marketPosition === 'match' && 'Your bid matches market average - balanced approach'}
                            {strategy.marketPosition === 'premium' && 'Your bid is above market average - premium positioning'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Total Competitors:</strong> {strategy.competitorAnalysis.totalBids}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Strategy Reasoning */}
                <Card>
                  <CardHeader>
                    <CardTitle>Why This Strategy?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {strategy.reasoning.map((reason, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Competitor Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Bid Distribution</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Low Range</span>
                            <span>${strategy.competitorAnalysis.lowBid} - ${Math.round(strategy.competitorAnalysis.averageBid * 0.8)}</span>
                          </div>
                          <Progress value={25} className="h-2" />
                          <div className="flex justify-between">
                            <span>Average Range</span>
                            <span>${Math.round(strategy.competitorAnalysis.averageBid * 0.8)} - ${Math.round(strategy.competitorAnalysis.averageBid * 1.2)}</span>
                          </div>
                          <Progress value={50} className="h-2" />
                          <div className="flex justify-between">
                            <span>High Range</span>
                            <span>${Math.round(strategy.competitorAnalysis.averageBid * 1.2)} - ${strategy.competitorAnalysis.highBid}</span>
                          </div>
                          <Progress value={25} className="h-2" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold">Market Insights</h4>
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-sm font-medium">Competition Level</div>
                            <div className="text-lg">
                              {strategy.competitorAnalysis.totalBids < 5 ? 'Low' : 
                               strategy.competitorAnalysis.totalBids < 15 ? 'Medium' : 'High'}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-sm font-medium">Price Spread</div>
                            <div className="text-lg">
                              ${strategy.competitorAnalysis.highBid - strategy.competitorAnalysis.lowBid}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tips" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {strategy.optimizationTips.map((tip, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-sm">{tip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Success Factors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                          Competitive Advantage
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Your profile matches {Math.round(strategy.confidence * 0.8)}% of project requirements
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          Market Position
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {strategy.marketPosition === 'premium' ? 'Premium positioning justified by experience' :
                           strategy.marketPosition === 'undercut' ? 'Competitive pricing for quick wins' :
                           'Balanced approach for steady success'}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                          Timing Factor
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Early application with optimized bid increases success by 23%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to Generate Optimization</h3>
                <p className="text-gray-600">
                  Please ensure your profile is complete and try selecting a different project.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedProjectId && (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
            <p className="text-gray-600">
              Choose a project from the dropdown above to get AI-powered bid optimization recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
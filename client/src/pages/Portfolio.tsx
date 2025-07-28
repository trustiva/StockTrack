import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Award, TrendingUp, Star, Eye, Edit, Trash2, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  imageUrl?: string;
  projectUrl?: string;
  clientTestimonial?: string;
  completionDate: string;
  earnings: number;
  rating: number;
}

interface PortfolioSummary {
  totalProjects: number;
  averageRating: number;
  totalEarnings: number;
  topSkills: string[];
  successRate: number;
  profileStrength: number;
  marketPosition: string;
  recommendations: string[];
}

export default function Portfolio() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '',
    skills: '',
    projectUrl: '',
    clientTestimonial: '',
    earnings: '',
    rating: '5'
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: portfolioItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/portfolio/items'],
    enabled: true,
  });

  const { data: portfolioSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/portfolio/summary'],
    enabled: true,
  });

  const addItemMutation = useMutation({
    mutationFn: (item: any) => apiRequest('/api/portfolio/items', 'POST', item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      setIsAddDialogOpen(false);
      setNewItem({
        title: '',
        description: '',
        category: '',
        skills: '',
        projectUrl: '',
        clientTestimonial: '',
        earnings: '',
        rating: '5'
      });
      toast({
        title: "Portfolio item added",
        description: "Your portfolio has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add portfolio item. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddItem = () => {
    const item = {
      ...newItem,
      skills: newItem.skills.split(',').map(s => s.trim()).filter(Boolean),
      earnings: parseFloat(newItem.earnings) || 0,
      rating: parseInt(newItem.rating) || 5,
      completionDate: new Date().toISOString(),
    };
    addItemMutation.mutate(item);
  };

  const getMarketPositionColor = (position: string) => {
    switch (position) {
      case 'top_tier': return 'text-green-600 bg-green-100';
      case 'above_average': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'below_average': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (itemsLoading || summaryLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Portfolio Management</h1>
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

  const summary = portfolioSummary as PortfolioSummary;
  const items = portfolioItems as PortfolioItem[];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Portfolio Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Portfolio Item</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  placeholder="E.g., E-commerce Website Development"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  placeholder="E.g., Web Development"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  placeholder="Describe the project, challenges, and your solutions..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills Used (comma-separated)</Label>
                <Input
                  id="skills"
                  value={newItem.skills}
                  onChange={(e) => setNewItem({...newItem, skills: e.target.value})}
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectUrl">Project URL (optional)</Label>
                <Input
                  id="projectUrl"
                  value={newItem.projectUrl}
                  onChange={(e) => setNewItem({...newItem, projectUrl: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="earnings">Earnings ($)</Label>
                <Input
                  id="earnings"
                  type="number"
                  value={newItem.earnings}
                  onChange={(e) => setNewItem({...newItem, earnings: e.target.value})}
                  placeholder="2500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Client Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={newItem.rating}
                  onChange={(e) => setNewItem({...newItem, rating: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="testimonial">Client Testimonial (optional)</Label>
                <Textarea
                  id="testimonial"
                  value={newItem.clientTestimonial}
                  onChange={(e) => setNewItem({...newItem, clientTestimonial: e.target.value})}
                  placeholder="What did the client say about your work?"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
                {addItemMutation.isPending ? 'Adding...' : 'Add Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Portfolio Summary */}
          {summary && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalProjects}</div>
                    <p className="text-xs text-muted-foreground">Completed successfully</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.averageRating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">Out of 5.0</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${summary.totalEarnings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">From all projects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.successRate}%</div>
                    <p className="text-xs text-muted-foreground">Project success rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Strength */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Strength</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overall Score</span>
                      <Badge className={getMarketPositionColor(summary.marketPosition)}>
                        {summary.marketPosition.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Progress value={summary.profileStrength} className="h-3" />
                    <div className="text-sm text-gray-600">
                      {summary.profileStrength}/100 - {summary.marketPosition === 'top_tier' ? 'Excellent!' : 
                        summary.marketPosition === 'above_average' ? 'Very Good' : 
                        summary.marketPosition === 'average' ? 'Good' : 'Needs Improvement'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {summary.topSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {summary.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {summary.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items?.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant="outline">{item.category}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{item.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {item.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {item.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{item.skills.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-sm font-semibold">${item.earnings.toLocaleString()}</div>
                  </div>

                  {item.projectUrl && (
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Project
                    </Button>
                  )}

                  {item.clientTestimonial && (
                    <blockquote className="text-xs italic text-gray-600 border-l-2 border-gray-300 pl-3">
                      "{item.clientTestimonial}"
                    </blockquote>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Advanced portfolio analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Bot, Search, FileText, BarChart3, Zap, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FreelanceAuto</span>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-blue-600"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          🚀 Beta Version Available
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Automate Your{" "}
          <span className="text-primary">Freelance Success</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Stop wasting time on manual proposal writing. Our AI-powered platform automatically finds relevant projects and generates winning proposals across multiple freelancing platforms.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-blue-600"
            onClick={() => window.location.href = '/api/login'}
          >
            Start Automating Today
          </Button>
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Win More Projects
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our comprehensive automation platform handles the tedious work so you can focus on delivering great results.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <Search className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Smart Project Discovery</CardTitle>
              <CardDescription>
                Automatically search and filter projects across Upwork, Freelancer, Fiverr, and more based on your skills and preferences.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <FileText className="w-10 h-10 text-primary mb-2" />
              <CardTitle>AI-Powered Proposals</CardTitle>
              <CardDescription>
                Generate personalized, compelling proposals using advanced AI that adapts to each client's specific requirements.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Success Analytics</CardTitle>
              <CardDescription>
                Track your proposal success rates, earnings, and optimize your strategy with detailed analytics and insights.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <Zap className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Real-time Notifications</CardTitle>
              <CardDescription>
                Get instant alerts when new matching projects are found or when clients respond to your proposals.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <Bot className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Complete Automation</CardTitle>
              <CardDescription>
                Set your preferences once and let our system work 24/7 to find and apply to the best opportunities for you.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Multi-Platform Support</CardTitle>
              <CardDescription>
                Connect multiple freelancing accounts and manage all your proposals from one centralized dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Freelancers Choose FreelanceAuto
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Save 10+ Hours Per Week</h3>
                    <p className="text-gray-600">Stop manually searching and writing proposals. Our automation handles it all.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Increase Success Rate by 40%</h3>
                    <p className="text-gray-600">AI-generated proposals are tailored to each client's specific needs and requirements.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Never Miss An Opportunity</h3>
                    <p className="text-gray-600">24/7 monitoring ensures you're always first to apply to the best projects.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Focus on What Matters</h3>
                    <p className="text-gray-600">Spend more time on actual work and client relationships, not proposal writing.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Monthly Results</h3>
                  <Badge variant="secondary">This Month</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proposals Sent</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-semibold text-green-600">32%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Saved</span>
                    <span className="font-semibold text-blue-600">42 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Earnings</span>
                    <span className="font-semibold text-primary">$3,420</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Automate Your Success?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of freelancers who are already using FreelanceAuto to win more projects and earn more money.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-primary hover:bg-gray-100"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FreelanceAuto</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering freelancers with intelligent automation
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 FreelanceAuto. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

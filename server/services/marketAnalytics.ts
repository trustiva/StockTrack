import type { Project, FreelancerProfile, Proposal } from "@shared/schema";
import { storage } from "../storage";

export interface MarketTrend {
  skill: string;
  demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  averageRate: number;
  rateChange: number; // Percentage change from last period
  projectCount: number;
  competitionLevel: 'low' | 'medium' | 'high';
  growthTrend: 'declining' | 'stable' | 'growing' | 'surging';
  forecast: {
    nextMonth: 'up' | 'down' | 'stable';
    confidence: number;
  };
}

export interface IndustryInsight {
  industry: string;
  totalBudget: number;
  averageProjectValue: number;
  topSkills: string[];
  clientSatisfactionRate: number;
  projectComplexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  seasonalTrends: Record<string, number>;
}

export interface CompetitorProfile {
  skillLevel: 'beginner' | 'intermediate' | 'expert';
  averageRate: number;
  portfolioStrength: number;
  winRate: number;
  responseTime: number; // hours
  clientRating: number;
  specializations: string[];
}

export interface MarketOpportunity {
  id: string;
  title: string;
  description: string;
  potentialValue: number;
  competitionLevel: 'low' | 'medium' | 'high';
  requiredSkills: string[];
  timeToEntry: string;
  successProbability: number;
  recommendations: string[];
}

export class MarketAnalyticsService {
  
  async getMarketTrends(skills: string[]): Promise<MarketTrend[]> {
    const trends: MarketTrend[] = [];
    
    for (const skill of skills) {
      const trend = await this.analyzeSkillTrend(skill);
      trends.push(trend);
    }
    
    return trends.sort((a, b) => b.demandLevel.localeCompare(a.demandLevel));
  }

  private async analyzeSkillTrend(skill: string): Promise<MarketTrend> {
    // In production, this would analyze real market data
    const baseRate = this.getBaseRateForSkill(skill);
    const demandScore = Math.random() * 100;
    
    let demandLevel: MarketTrend['demandLevel'] = 'medium';
    if (demandScore > 80) demandLevel = 'very_high';
    else if (demandScore > 60) demandLevel = 'high';
    else if (demandScore < 30) demandLevel = 'low';

    const competitionScore = Math.random() * 100;
    let competitionLevel: MarketTrend['competitionLevel'] = 'medium';
    if (competitionScore < 30) competitionLevel = 'low';
    else if (competitionScore > 70) competitionLevel = 'high';

    const growthRate = (Math.random() - 0.5) * 40; // -20% to +20%
    let growthTrend: MarketTrend['growthTrend'] = 'stable';
    if (growthRate > 10) growthTrend = 'surging';
    else if (growthRate > 3) growthTrend = 'growing';
    else if (growthRate < -10) growthTrend = 'declining';

    return {
      skill,
      demandLevel,
      averageRate: baseRate,
      rateChange: (Math.random() - 0.5) * 20,
      projectCount: Math.floor(Math.random() * 500) + 50,
      competitionLevel,
      growthTrend,
      forecast: {
        nextMonth: growthRate > 0 ? 'up' : growthRate < -5 ? 'down' : 'stable',
        confidence: 70 + Math.floor(Math.random() * 25)
      }
    };
  }

  async getIndustryInsights(): Promise<IndustryInsight[]> {
    const industries = [
      'Web Development', 'Mobile Development', 'Data Science', 
      'Digital Marketing', 'Graphic Design', 'Content Writing',
      'E-commerce', 'SaaS', 'Fintech', 'Healthcare Tech'
    ];

    return industries.map(industry => ({
      industry,
      totalBudget: Math.floor(Math.random() * 1000000) + 100000,
      averageProjectValue: Math.floor(Math.random() * 5000) + 1000,
      topSkills: this.getTopSkillsForIndustry(industry),
      clientSatisfactionRate: 70 + Math.floor(Math.random() * 25),
      projectComplexity: this.getComplexityForIndustry(industry),
      seasonalTrends: this.generateSeasonalTrends()
    }));
  }

  async analyzeCompetition(skills: string[], budget: number): Promise<CompetitorProfile[]> {
    const competitorCount = Math.floor(Math.random() * 15) + 5;
    const competitors: CompetitorProfile[] = [];

    for (let i = 0; i < competitorCount; i++) {
      competitors.push({
        skillLevel: this.randomSkillLevel(),
        averageRate: budget * (0.7 + Math.random() * 0.6),
        portfolioStrength: Math.floor(Math.random() * 100),
        winRate: 15 + Math.floor(Math.random() * 40),
        responseTime: 1 + Math.floor(Math.random() * 24),
        clientRating: 3.5 + Math.random() * 1.5,
        specializations: skills.slice(0, Math.floor(Math.random() * 3) + 1)
      });
    }

    return competitors.sort((a, b) => b.portfolioStrength - a.portfolioStrength);
  }

  async identifyMarketOpportunities(userProfile: FreelancerProfile): Promise<MarketOpportunity[]> {
    const opportunities: MarketOpportunity[] = [];
    const userSkills = userProfile.skills || [];

    // Emerging technology opportunities
    const emergingSkills = ['AI/ML', 'Blockchain', 'IoT', 'AR/VR', 'Edge Computing'];
    const relatedSkills = this.findRelatedSkills(userSkills, emergingSkills);

    for (const skill of relatedSkills) {
      opportunities.push({
        id: this.generateId(),
        title: `${skill} Development Opportunity`,
        description: `Growing demand for ${skill} expertise with limited competition`,
        potentialValue: 5000 + Math.floor(Math.random() * 15000),
        competitionLevel: 'low',
        requiredSkills: [skill, ...userSkills.slice(0, 2)],
        timeToEntry: '2-4 weeks',
        successProbability: 70 + Math.floor(Math.random() * 25),
        recommendations: [
          `Build sample projects showcasing ${skill}`,
          'Create case studies demonstrating ROI',
          'Network with early adopters in the space'
        ]
      });
    }

    // Niche market opportunities
    const niches = [
      'Accessibility Development',
      'Performance Optimization',
      'Security Auditing',
      'API Integration',
      'Migration Services'
    ];

    for (const niche of niches.slice(0, 2)) {
      if (this.userHasRelevantSkills(userSkills, niche)) {
        opportunities.push({
          id: this.generateId(),
          title: `${niche} Specialization`,
          description: `Specialized ${niche} services command premium rates`,
          potentialValue: 3000 + Math.floor(Math.random() * 8000),
          competitionLevel: 'medium',
          requiredSkills: this.getRequiredSkillsForNiche(niche),
          timeToEntry: '1-3 weeks',
          successProbability: 60 + Math.floor(Math.random() * 30),
          recommendations: [
            'Obtain relevant certifications',
            'Create specialized portfolio section',
            'Write thought leadership content'
          ]
        });
      }
    }

    return opportunities.sort((a, b) => b.successProbability - a.successProbability);
  }

  async generateMarketReport(userId: string): Promise<{
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    marketPosition: 'below_average' | 'average' | 'above_average' | 'top_tier';
    growthOpportunities: string[];
    threatAnalysis: string[];
  }> {
    const profile = await storage.getFreelancerProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const trends = await this.getMarketTrends(profile.skills || []);
    const opportunities = await this.identifyMarketOpportunities(profile);
    
    const avgDemand = trends.reduce((sum, trend) => {
      const demandScore = { low: 1, medium: 2, high: 3, very_high: 4 }[trend.demandLevel];
      return sum + demandScore;
    }, 0) / trends.length;

    const marketPosition = this.determineMarketPosition(profile, trends);
    
    return {
      summary: this.generateSummary(profile, trends, avgDemand),
      keyFindings: this.generateKeyFindings(trends, opportunities),
      recommendations: this.generateRecommendations(profile, trends, opportunities),
      marketPosition,
      growthOpportunities: opportunities.map(op => op.title).slice(0, 3),
      threatAnalysis: this.generateThreatAnalysis(trends)
    };
  }

  private getBaseRateForSkill(skill: string): number {
    const skillRates: Record<string, number> = {
      'react': 55, 'vue': 50, 'angular': 60, 'node.js': 55,
      'python': 50, 'javascript': 45, 'typescript': 55,
      'aws': 70, 'docker': 60, 'kubernetes': 75,
      'machine learning': 80, 'data science': 75,
      'blockchain': 90, 'solidity': 95,
      'mobile development': 60, 'react native': 65,
      'ui/ux design': 45, 'graphic design': 35,
      'content writing': 25, 'seo': 35
    };

    return skillRates[skill.toLowerCase()] || 45;
  }

  private getTopSkillsForIndustry(industry: string): string[] {
    const industrySkills: Record<string, string[]> = {
      'Web Development': ['React', 'Node.js', 'TypeScript', 'AWS'],
      'Mobile Development': ['React Native', 'Flutter', 'Swift', 'Kotlin'],
      'Data Science': ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
      'Digital Marketing': ['SEO', 'Google Analytics', 'Facebook Ads', 'Content Strategy'],
      'Graphic Design': ['Adobe Photoshop', 'Illustrator', 'Figma', 'Branding']
    };

    return industrySkills[industry] || ['General', 'Communication', 'Project Management'];
  }

  private getComplexityForIndustry(industry: string): IndustryInsight['projectComplexity'] {
    const complexityMap: Record<string, IndustryInsight['projectComplexity']> = {
      'Fintech': 'enterprise',
      'Healthcare Tech': 'enterprise',
      'SaaS': 'complex',
      'E-commerce': 'moderate',
      'Content Writing': 'simple'
    };

    return complexityMap[industry] || 'moderate';
  }

  private generateSeasonalTrends(): Record<string, number> {
    return {
      'Q1': 80 + Math.floor(Math.random() * 20),
      'Q2': 90 + Math.floor(Math.random() * 15),
      'Q3': 70 + Math.floor(Math.random() * 25),
      'Q4': 95 + Math.floor(Math.random() * 10)
    };
  }

  private randomSkillLevel(): CompetitorProfile['skillLevel'] {
    const levels: CompetitorProfile['skillLevel'][] = ['beginner', 'intermediate', 'expert'];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private findRelatedSkills(userSkills: string[], emergingSkills: string[]): string[] {
    // Simplified logic - in production would use ML for skill similarity
    return emergingSkills.filter(() => Math.random() > 0.7).slice(0, 2);
  }

  private userHasRelevantSkills(userSkills: string[], niche: string): boolean {
    const relevantSkills = {
      'Accessibility Development': ['html', 'css', 'javascript'],
      'Performance Optimization': ['javascript', 'react', 'node.js'],
      'Security Auditing': ['security', 'penetration testing', 'cybersecurity'],
      'API Integration': ['rest api', 'graphql', 'node.js', 'python'],
      'Migration Services': ['database', 'cloud', 'aws', 'docker']
    };

    const required = relevantSkills[niche as keyof typeof relevantSkills] || [];
    return required.some(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }

  private getRequiredSkillsForNiche(niche: string): string[] {
    const nicheSkills: Record<string, string[]> = {
      'Accessibility Development': ['WCAG', 'Screen Readers', 'Semantic HTML'],
      'Performance Optimization': ['Web Performance', 'Lighthouse', 'Core Web Vitals'],
      'Security Auditing': ['Penetration Testing', 'OWASP', 'Security Compliance']
    };

    return nicheSkills[niche] || ['General'];
  }

  private determineMarketPosition(
    profile: FreelancerProfile, 
    trends: MarketTrend[]
  ): 'below_average' | 'average' | 'above_average' | 'top_tier' {
    const userRate = Number(profile.hourlyRate) || 45;
    const avgMarketRate = trends.reduce((sum, trend) => sum + trend.averageRate, 0) / trends.length;
    
    if (userRate >= avgMarketRate * 1.3) return 'top_tier';
    if (userRate >= avgMarketRate * 1.1) return 'above_average';
    if (userRate >= avgMarketRate * 0.8) return 'average';
    return 'below_average';
  }

  private generateSummary(profile: FreelancerProfile, trends: MarketTrend[], avgDemand: number): string {
    const skillCount = profile.skills?.length || 0;
    const demandText = avgDemand > 2.5 ? 'high' : avgDemand > 1.5 ? 'moderate' : 'low';
    
    return `Your skill portfolio of ${skillCount} skills shows ${demandText} market demand. ` +
           `Current market conditions suggest ${avgDemand > 2 ? 'favorable' : 'challenging'} ` +
           `opportunities for growth in your specialization areas.`;
  }

  private generateKeyFindings(trends: MarketTrend[], opportunities: MarketOpportunity[]): string[] {
    const findings: string[] = [];
    
    const highDemandSkills = trends.filter(t => t.demandLevel === 'high' || t.demandLevel === 'very_high');
    if (highDemandSkills.length > 0) {
      findings.push(`${highDemandSkills.length} of your skills are in high demand`);
    }

    const lowCompetitionOpportunities = opportunities.filter(o => o.competitionLevel === 'low');
    if (lowCompetitionOpportunities.length > 0) {
      findings.push(`${lowCompetitionOpportunities.length} low-competition opportunities identified`);
    }

    const growingTrends = trends.filter(t => t.growthTrend === 'growing' || t.growthTrend === 'surging');
    if (growingTrends.length > 0) {
      findings.push(`${growingTrends.length} skills showing positive growth trends`);
    }

    return findings;
  }

  private generateRecommendations(
    profile: FreelancerProfile, 
    trends: MarketTrend[], 
    opportunities: MarketOpportunity[]
  ): string[] {
    const recommendations: string[] = [];
    
    const userRate = Number(profile.hourlyRate) || 45;
    const avgMarketRate = trends.reduce((sum, trend) => sum + trend.averageRate, 0) / trends.length;
    
    if (userRate < avgMarketRate * 0.9) {
      recommendations.push('Consider raising your hourly rate to match market standards');
    }

    const decliningSkills = trends.filter(t => t.growthTrend === 'declining');
    if (decliningSkills.length > 0) {
      recommendations.push(`Diversify away from declining skills: ${decliningSkills.map(s => s.skill).join(', ')}`);
    }

    if (opportunities.length > 0) {
      recommendations.push(`Explore emerging opportunities in ${opportunities[0].title}`);
    }

    return recommendations;
  }

  private generateThreatAnalysis(trends: MarketTrend[]): string[] {
    const threats: string[] = [];
    
    const highCompetitionSkills = trends.filter(t => t.competitionLevel === 'high');
    if (highCompetitionSkills.length > 0) {
      threats.push(`High competition in ${highCompetitionSkills.length} skill areas`);
    }

    const decliningSkills = trends.filter(t => t.growthTrend === 'declining');
    if (decliningSkills.length > 0) {
      threats.push(`Declining demand for ${decliningSkills.length} of your skills`);
    }

    return threats;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const marketAnalytics = new MarketAnalyticsService();
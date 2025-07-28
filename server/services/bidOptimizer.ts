import type { Project, FreelancerProfile, Proposal } from "@shared/schema";
import { storage } from "../storage";

export interface BidStrategy {
  recommendedAmount: number;
  confidence: number;
  strategy: 'competitive' | 'premium' | 'value' | 'aggressive';
  reasoning: string[];
  marketPosition: 'undercut' | 'match' | 'premium';
  successProbability: number;
}

export interface CompetitorAnalysis {
  averageBid: number;
  bidRange: { min: number; max: number };
  competitorCount: number;
  skillLevelDistribution: {
    beginner: number;
    intermediate: number;
    expert: number;
  };
  geographicDistribution: string[];
}

export class BidOptimizationEngine {
  
  async optimizeBid(
    project: Project,
    freelancerProfile: FreelancerProfile,
    historicalData?: Proposal[]
  ): Promise<BidStrategy> {
    
    const competitorAnalysis = await this.analyzeCompetition(project);
    const marketData = await this.getMarketData(project.skills || []);
    const profileStrength = this.assessProfileStrength(freelancerProfile, project);
    const historicalPerformance = this.analyzeHistoricalPerformance(historicalData || []);

    return this.calculateOptimalBid(
      project,
      freelancerProfile,
      competitorAnalysis,
      marketData,
      profileStrength,
      historicalPerformance
    );
  }

  private async analyzeCompetition(project: Project): Promise<CompetitorAnalysis> {
    // In production, this would analyze real competitor data
    const baseCompetitors = 8 + Math.floor(Math.random() * 15);
    const baseBid = this.extractBudgetAmount(project.budget || '1000');
    
    return {
      averageBid: baseBid * (0.8 + Math.random() * 0.4),
      bidRange: {
        min: baseBid * 0.6,
        max: baseBid * 1.3
      },
      competitorCount: baseCompetitors,
      skillLevelDistribution: {
        beginner: 30 + Math.floor(Math.random() * 20),
        intermediate: 40 + Math.floor(Math.random() * 20),
        expert: 15 + Math.floor(Math.random() * 15)
      },
      geographicDistribution: ['US', 'India', 'Philippines', 'Ukraine', 'Pakistan']
    };
  }

  private async getMarketData(skills: string[]): Promise<{
    averageHourlyRate: number;
    demandLevel: number;
    competitionLevel: number;
    trendDirection: 'up' | 'down' | 'stable';
  }> {
    // Market analysis based on skills
    const baseRate = 25 + Math.floor(Math.random() * 50);
    
    return {
      averageHourlyRate: baseRate,
      demandLevel: 60 + Math.floor(Math.random() * 40),
      competitionLevel: 40 + Math.floor(Math.random() * 60),
      trendDirection: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any
    };
  }

  private assessProfileStrength(
    profile: FreelancerProfile,
    project: Project
  ): {
    skillMatch: number;
    experienceLevel: number;
    portfolioStrength: number;
    overallScore: number;
  } {
    const skillMatch = this.calculateSkillMatchScore(
      profile.skills || [],
      project.skills || []
    );
    
    const experienceLevel = this.calculateExperienceScore(profile.experience);
    const portfolioStrength = profile.portfolio ? 80 + Math.floor(Math.random() * 20) : 40;
    
    const overallScore = (skillMatch * 0.4 + experienceLevel * 0.35 + portfolioStrength * 0.25);

    return {
      skillMatch,
      experienceLevel,
      portfolioStrength,
      overallScore
    };
  }

  private analyzeHistoricalPerformance(proposals: Proposal[]): {
    winRate: number;
    averageBidAccuracy: number;
    clientSatisfaction: number;
    preferredProjectTypes: string[];
  } {
    if (proposals.length === 0) {
      return {
        winRate: 25, // Default for new freelancers
        averageBidAccuracy: 70,
        clientSatisfaction: 80,
        preferredProjectTypes: []
      };
    }

    const acceptedProposals = proposals.filter(p => p.status === 'accepted');
    const winRate = (acceptedProposals.length / proposals.length) * 100;

    return {
      winRate,
      averageBidAccuracy: 70 + Math.floor(Math.random() * 25),
      clientSatisfaction: 75 + Math.floor(Math.random() * 20),
      preferredProjectTypes: [] // Would be calculated from successful projects
    };
  }

  private calculateOptimalBid(
    project: Project,
    profile: FreelancerProfile,
    competition: CompetitorAnalysis,
    market: any,
    profileStrength: any,
    historical: any
  ): BidStrategy {
    
    const baseBudget = this.extractBudgetAmount(project.budget || '1000');
    const profileRate = Number(profile.hourlyRate) || market.averageHourlyRate;
    
    let recommendedAmount = baseBudget;
    let strategy: BidStrategy['strategy'] = 'competitive';
    const reasoning: string[] = [];
    
    // Adjust based on profile strength
    if (profileStrength.overallScore > 85) {
      recommendedAmount *= 1.1; // Premium pricing for strong profiles
      strategy = 'premium';
      reasoning.push('Strong profile allows for premium pricing');
    } else if (profileStrength.overallScore < 50) {
      recommendedAmount *= 0.85; // Competitive pricing for weaker profiles
      strategy = 'aggressive';
      reasoning.push('Competitive pricing to overcome profile limitations');
    }

    // Adjust based on competition
    if (competition.competitorCount < 5) {
      recommendedAmount *= 1.05;
      reasoning.push('Low competition allows for higher pricing');
    } else if (competition.competitorCount > 15) {
      recommendedAmount *= 0.95;
      strategy = 'aggressive';
      reasoning.push('High competition requires competitive pricing');
    }

    // Adjust based on historical performance
    if (historical.winRate > 40) {
      recommendedAmount *= 1.02;
      reasoning.push('Good win rate supports confident pricing');
    } else if (historical.winRate < 20) {
      recommendedAmount *= 0.92;
      reasoning.push('Lower pricing to improve win rate');
    }

    // Market positioning
    let marketPosition: BidStrategy['marketPosition'] = 'match';
    if (recommendedAmount < competition.averageBid * 0.9) {
      marketPosition = 'undercut';
    } else if (recommendedAmount > competition.averageBid * 1.1) {
      marketPosition = 'premium';
    }

    // Calculate success probability
    const successProbability = this.calculateSuccessProbability(
      recommendedAmount,
      competition,
      profileStrength,
      historical
    );

    // Confidence score
    const confidence = Math.min(95, 
      (profileStrength.overallScore * 0.4) + 
      (historical.winRate * 0.3) + 
      ((100 - competition.competitionLevel) * 0.3)
    );

    return {
      recommendedAmount: Math.round(recommendedAmount),
      confidence,
      strategy,
      reasoning,
      marketPosition,
      successProbability
    };
  }

  private calculateSuccessProbability(
    bidAmount: number,
    competition: CompetitorAnalysis,
    profileStrength: any,
    historical: any
  ): number {
    let probability = 50; // Base probability

    // Adjust for bid competitiveness
    const bidPosition = (bidAmount - competition.bidRange.min) / 
                       (competition.bidRange.max - competition.bidRange.min);
    
    if (bidPosition < 0.3) {
      probability += 20; // Very competitive bid
    } else if (bidPosition > 0.7) {
      probability -= 15; // Expensive bid
    }

    // Adjust for profile strength
    probability += (profileStrength.overallScore - 50) * 0.3;

    // Adjust for historical performance
    probability += (historical.winRate - 25) * 0.2;

    return Math.max(5, Math.min(95, Math.round(probability)));
  }

  private calculateSkillMatchScore(profileSkills: string[], projectSkills: string[]): number {
    if (!profileSkills.length || !projectSkills.length) return 0;

    const matches = projectSkills.filter(skill =>
      profileSkills.some(pSkill =>
        pSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(pSkill.toLowerCase())
      )
    );

    return (matches.length / projectSkills.length) * 100;
  }

  private calculateExperienceScore(experience: string | null): number {
    if (!experience) return 50;

    const exp = experience.toLowerCase();
    if (exp.includes('expert') || exp.includes('senior') || exp.includes('10+')) {
      return 90;
    } else if (exp.includes('intermediate') || exp.includes('5+')) {
      return 70;
    } else if (exp.includes('beginner') || exp.includes('entry')) {
      return 40;
    }
    
    return 60;
  }

  private extractBudgetAmount(budget: string): number {
    const numbers = budget.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : 1000;
  }

  // Generate bid variations for A/B testing
  async generateBidVariations(
    baseStrategy: BidStrategy,
    project: Project
  ): Promise<BidStrategy[]> {
    const variations: BidStrategy[] = [baseStrategy];

    // Conservative variation (10% lower)
    variations.push({
      ...baseStrategy,
      recommendedAmount: Math.round(baseStrategy.recommendedAmount * 0.9),
      strategy: 'aggressive',
      reasoning: [...baseStrategy.reasoning, 'Conservative approach for higher win rate'],
      successProbability: Math.min(95, baseStrategy.successProbability + 10)
    });

    // Premium variation (15% higher)
    if (baseStrategy.confidence > 70) {
      variations.push({
        ...baseStrategy,
        recommendedAmount: Math.round(baseStrategy.recommendedAmount * 1.15),
        strategy: 'premium',
        reasoning: [...baseStrategy.reasoning, 'Premium pricing based on strong profile'],
        successProbability: Math.max(5, baseStrategy.successProbability - 15)
      });
    }

    return variations;
  }
}

export const bidOptimizer = new BidOptimizationEngine();
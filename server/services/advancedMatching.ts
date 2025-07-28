import type { FreelancerProfile, Project, AutomationSettings } from "@shared/schema";
import { storage } from "../storage";

export interface MatchingCriteria {
  skills: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  budgetRange: { min: number; max: number };
  preferredProjectTypes: string[];
  excludeKeywords: string[];
  clientRatingThreshold: number;
  timePreference: 'part_time' | 'full_time' | 'flexible';
}

export interface ProjectMatch {
  project: Project;
  matchScore: number;
  matchReasons: string[];
  competitionLevel: 'low' | 'medium' | 'high';
  successPrediction: number;
  recommendedBid: {
    amount: number;
    reasoning: string;
  };
  clientInsights: {
    reliability: number;
    communicationStyle: string;
    averageProjectValue: number;
  };
}

export class AdvancedMatchingEngine {
  
  async findOptimalMatches(
    userId: string, 
    projects: Project[], 
    criteria?: Partial<MatchingCriteria>
  ): Promise<ProjectMatch[]> {
    const profile = await storage.getFreelancerProfile(userId);
    const settings = await storage.getAutomationSettings(userId);
    
    if (!profile) {
      throw new Error('Freelancer profile not found');
    }

    const matchingCriteria = this.buildMatchingCriteria(profile, settings, criteria);
    
    const matches = await Promise.all(
      projects.map(project => this.analyzeProjectMatch(project, profile, matchingCriteria))
    );

    return matches
      .filter(match => match.matchScore >= 60) // Only high-quality matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 15); // Top 15 matches
  }

  private buildMatchingCriteria(
    profile: FreelancerProfile,
    settings: AutomationSettings | undefined,
    customCriteria?: Partial<MatchingCriteria>
  ): MatchingCriteria {
    return {
      skills: customCriteria?.skills || profile.skills || [],
      experienceLevel: this.determineExperienceLevel(profile.experience),
      budgetRange: {
        min: customCriteria?.budgetRange?.min || Number(settings?.minBudget) || 500,
        max: customCriteria?.budgetRange?.max || Number(settings?.maxBudget) || 10000
      },
      preferredProjectTypes: customCriteria?.preferredProjectTypes || profile.preferredProjectTypes || [],
      excludeKeywords: customCriteria?.excludeKeywords || settings?.excludeKeywords || [],
      clientRatingThreshold: 4.0,
      timePreference: 'flexible'
    };
  }

  private async analyzeProjectMatch(
    project: Project,
    profile: FreelancerProfile,
    criteria: MatchingCriteria
  ): Promise<ProjectMatch> {
    let matchScore = 0;
    const matchReasons: string[] = [];

    // Skill matching (40% weight)
    const skillMatch = this.calculateSkillMatch(project.skills || [], criteria.skills);
    matchScore += skillMatch * 0.4;
    if (skillMatch > 80) matchReasons.push(`Excellent skill match (${skillMatch}%)`);
    else if (skillMatch > 60) matchReasons.push(`Good skill alignment (${skillMatch}%)`);

    // Budget compatibility (25% weight)
    const budgetMatch = this.calculateBudgetMatch(project, criteria.budgetRange);
    matchScore += budgetMatch * 0.25;
    if (budgetMatch > 80) matchReasons.push('Budget aligns with your preferences');

    // Client quality (15% weight)
    const clientScore = this.calculateClientScore(project);
    matchScore += clientScore * 0.15;
    if (clientScore > 80) matchReasons.push('High-quality client with good ratings');

    // Project type preference (10% weight)
    const typeMatch = this.calculateProjectTypeMatch(project, criteria.preferredProjectTypes);
    matchScore += typeMatch * 0.1;

    // Exclude keywords check (10% weight penalty)
    const keywordPenalty = this.calculateKeywordPenalty(project, criteria.excludeKeywords);
    matchScore -= keywordPenalty * 0.1;

    const competitionLevel = this.assessCompetitionLevel(project);
    const successPrediction = this.predictSuccessRate(matchScore, profile, project);
    const recommendedBid = this.calculateRecommendedBid(project, profile, matchScore);
    const clientInsights = this.generateClientInsights(project);

    return {
      project,
      matchScore: Math.max(0, Math.min(100, matchScore)),
      matchReasons,
      competitionLevel,
      successPrediction,
      recommendedBid,
      clientInsights
    };
  }

  private calculateSkillMatch(projectSkills: string[], freelancerSkills: string[]): number {
    if (!projectSkills.length || !freelancerSkills.length) return 0;

    const normalizedProjectSkills = projectSkills.map(s => s.toLowerCase().trim());
    const normalizedFreelancerSkills = freelancerSkills.map(s => s.toLowerCase().trim());

    let exactMatches = 0;
    let partialMatches = 0;

    for (const projectSkill of normalizedProjectSkills) {
      if (normalizedFreelancerSkills.includes(projectSkill)) {
        exactMatches++;
      } else if (normalizedFreelancerSkills.some(fs => 
        fs.includes(projectSkill) || projectSkill.includes(fs)
      )) {
        partialMatches++;
      }
    }

    const matchPercentage = ((exactMatches * 1.0 + partialMatches * 0.6) / normalizedProjectSkills.length) * 100;
    return Math.min(100, matchPercentage);
  }

  private calculateBudgetMatch(project: Project, budgetRange: { min: number; max: number }): number {
    if (!project.budget) return 50; // Neutral if no budget specified

    const budgetNumbers = project.budget.match(/\d+/g);
    if (!budgetNumbers) return 50;

    const projectBudget = parseInt(budgetNumbers[0]);
    
    if (projectBudget >= budgetRange.min && projectBudget <= budgetRange.max) {
      return 100; // Perfect match
    }
    
    // Calculate how far off the budget is
    const distance = Math.min(
      Math.abs(projectBudget - budgetRange.min),
      Math.abs(projectBudget - budgetRange.max)
    );
    
    const maxAcceptableDistance = budgetRange.max - budgetRange.min;
    return Math.max(0, 100 - (distance / maxAcceptableDistance) * 100);
  }

  private calculateClientScore(project: Project): number {
    let score = 70; // Base score

    if (project.clientRating) {
      score += (Number(project.clientRating) - 3) * 15; // Rating contribution
    }

    // Additional factors can be added based on client history
    return Math.max(0, Math.min(100, score));
  }

  private calculateProjectTypeMatch(project: Project, preferredTypes: string[]): number {
    if (!preferredTypes.length) return 70; // Neutral if no preferences

    const projectDescription = (project.description || '').toLowerCase();
    const projectTitle = project.title.toLowerCase();
    
    const matchCount = preferredTypes.filter(type => 
      projectDescription.includes(type.toLowerCase()) || 
      projectTitle.includes(type.toLowerCase())
    ).length;

    return (matchCount / preferredTypes.length) * 100;
  }

  private calculateKeywordPenalty(project: Project, excludeKeywords: string[]): number {
    if (!excludeKeywords.length) return 0;

    const projectText = `${project.title} ${project.description || ''}`.toLowerCase();
    
    const foundKeywords = excludeKeywords.filter(keyword => 
      projectText.includes(keyword.toLowerCase())
    );

    return (foundKeywords.length / excludeKeywords.length) * 100;
  }

  private assessCompetitionLevel(project: Project): 'low' | 'medium' | 'high' {
    // This would analyze actual competition data in production
    const random = Math.random();
    if (random < 0.3) return 'low';
    if (random < 0.7) return 'medium';
    return 'high';
  }

  private predictSuccessRate(matchScore: number, profile: FreelancerProfile, project: Project): number {
    let successRate = matchScore * 0.6; // Base on match score

    // Adjust based on experience
    if (profile.experience) {
      if (profile.experience.toLowerCase().includes('expert')) {
        successRate += 15;
      } else if (profile.experience.toLowerCase().includes('intermediate')) {
        successRate += 10;
      }
    }

    // Adjust based on hourly rate competitiveness
    if (profile.hourlyRate && project.budget) {
      const profileRate = Number(profile.hourlyRate);
      const budgetNumbers = project.budget.match(/\d+/g);
      if (budgetNumbers && budgetNumbers.length > 0) {
        const projectRate = parseInt(budgetNumbers[0]);
        if (profileRate <= projectRate * 1.2) { // Within 20% of budget
          successRate += 10;
        }
      }
    }

    return Math.max(0, Math.min(100, successRate));
  }

  private calculateRecommendedBid(project: Project, profile: FreelancerProfile, matchScore: number): {
    amount: number;
    reasoning: string;
  } {
    let baseAmount = 1000; // Default base
    let reasoning = 'Standard competitive bid';

    if (project.budget) {
      const budgetNumbers = project.budget.match(/\d+/g);
      if (budgetNumbers) {
        baseAmount = parseInt(budgetNumbers[0]);
        
        if (project.budgetType === 'fixed') {
          // For fixed projects, bid slightly under budget if high match
          if (matchScore > 85) {
            baseAmount *= 0.95;
            reasoning = 'Competitive bid based on excellent skill match';
          } else if (matchScore > 70) {
            baseAmount *= 0.90;
            reasoning = 'Strategic bid to win the project';
          } else {
            baseAmount *= 0.85;
            reasoning = 'Lower bid to compensate for skill gap';
          }
        } else {
          // For hourly projects, use profile rate or adjust based on market
          if (profile.hourlyRate) {
            baseAmount = Number(profile.hourlyRate);
            reasoning = 'Based on your standard hourly rate';
          }
        }
      }
    }

    return {
      amount: Math.round(baseAmount),
      reasoning
    };
  }

  private generateClientInsights(project: Project): {
    reliability: number;
    communicationStyle: string;
    averageProjectValue: number;
  } {
    // This would use real client data in production
    return {
      reliability: 75 + Math.floor(Math.random() * 25),
      communicationStyle: ['Professional', 'Casual', 'Detailed', 'Brief'][Math.floor(Math.random() * 4)],
      averageProjectValue: 1000 + Math.floor(Math.random() * 5000)
    };
  }

  private determineExperienceLevel(experience: string | null): 'beginner' | 'intermediate' | 'expert' {
    if (!experience) return 'intermediate';
    
    const exp = experience.toLowerCase();
    if (exp.includes('expert') || exp.includes('senior') || exp.includes('lead')) {
      return 'expert';
    } else if (exp.includes('beginner') || exp.includes('junior') || exp.includes('entry')) {
      return 'beginner';
    }
    return 'intermediate';
  }

  // Market trend analysis
  async getMarketTrends(skills: string[]): Promise<{
    demandLevel: 'low' | 'medium' | 'high';
    averageRate: number;
    growthTrend: 'declining' | 'stable' | 'growing';
    competitiveSkills: string[];
  }> {
    // This would analyze real market data
    return {
      demandLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      averageRate: 35 + Math.floor(Math.random() * 40),
      growthTrend: ['declining', 'stable', 'growing'][Math.floor(Math.random() * 3)] as any,
      competitiveSkills: skills.slice(0, 3)
    };
  }
}

export const advancedMatching = new AdvancedMatchingEngine();
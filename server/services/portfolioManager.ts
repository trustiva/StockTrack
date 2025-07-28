import type { FreelancerProfile } from "@shared/schema";
import { storage } from "../storage";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  images: string[];
  liveUrl?: string;
  githubUrl?: string;
  completionDate: Date;
  clientFeedback?: string;
  projectValue: number;
  featured: boolean;
}

export interface SkillEndorsement {
  skill: string;
  endorsements: number;
  lastEndorsed: Date;
  endorsers: string[]; // User IDs or names
}

export interface WorkHistory {
  id: string;
  clientName: string;
  projectTitle: string;
  description: string;
  duration: string;
  value: number;
  rating: number;
  feedback: string;
  skills: string[];
  completedDate: Date;
  platformSource: string;
}

export class PortfolioManagementService {
  
  async createPortfolioItem(userId: string, item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
    const portfolioItem: PortfolioItem = {
      id: this.generateId(),
      ...item
    };

    // Store in extended profile data
    await this.updateUserPortfolio(userId, portfolioItem, 'add');
    
    return portfolioItem;
  }

  async updatePortfolioItem(userId: string, itemId: string, updates: Partial<PortfolioItem>): Promise<PortfolioItem | null> {
    const profile = await storage.getFreelancerProfile(userId);
    if (!profile) return null;

    const portfolioData = this.parsePortfolioData(profile.portfolio);
    const itemIndex = portfolioData.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return null;

    portfolioData.items[itemIndex] = { ...portfolioData.items[itemIndex], ...updates };
    
    await storage.updateFreelancerProfile(userId, {
      portfolio: JSON.stringify(portfolioData)
    });

    return portfolioData.items[itemIndex];
  }

  async deletePortfolioItem(userId: string, itemId: string): Promise<boolean> {
    const profile = await storage.getFreelancerProfile(userId);
    if (!profile) return false;

    const portfolioData = this.parsePortfolioData(profile.portfolio);
    portfolioData.items = portfolioData.items.filter(item => item.id !== itemId);
    
    await storage.updateFreelancerProfile(userId, {
      portfolio: JSON.stringify(portfolioData)
    });

    return true;
  }

  async getPortfolioItems(userId: string): Promise<PortfolioItem[]> {
    const profile = await storage.getFreelancerProfile(userId);
    if (!profile?.portfolio) return [];

    const portfolioData = this.parsePortfolioData(profile.portfolio);
    return portfolioData.items.sort((a, b) => {
      // Featured items first, then by completion date
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime();
    });
  }

  async addWorkHistory(userId: string, workItem: Omit<WorkHistory, 'id'>): Promise<WorkHistory> {
    const historyItem: WorkHistory = {
      id: this.generateId(),
      ...workItem
    };

    const profile = await storage.getFreelancerProfile(userId);
    const portfolioData = this.parsePortfolioData(profile?.portfolio);
    
    if (!portfolioData.workHistory) {
      portfolioData.workHistory = [];
    }
    
    portfolioData.workHistory.push(historyItem);
    
    await storage.updateFreelancerProfile(userId, {
      portfolio: JSON.stringify(portfolioData)
    });

    return historyItem;
  }

  async getWorkHistory(userId: string): Promise<WorkHistory[]> {
    const profile = await storage.getFreelancerProfile(userId);
    if (!profile?.portfolio) return [];

    const portfolioData = this.parsePortfolioData(profile.portfolio);
    return portfolioData.workHistory || [];
  }

  async updateSkillEndorsements(userId: string, skill: string, endorserName: string): Promise<void> {
    const profile = await storage.getFreelancerProfile(userId);
    const portfolioData = this.parsePortfolioData(profile?.portfolio);
    
    if (!portfolioData.skillEndorsements) {
      portfolioData.skillEndorsements = [];
    }

    let endorsement = portfolioData.skillEndorsements.find(e => e.skill === skill);
    
    if (!endorsement) {
      endorsement = {
        skill,
        endorsements: 0,
        lastEndorsed: new Date(),
        endorsers: []
      };
      portfolioData.skillEndorsements.push(endorsement);
    }
    
    if (!endorsement.endorsers.includes(endorserName)) {
      endorsement.endorsers.push(endorserName);
      endorsement.endorsements++;
      endorsement.lastEndorsed = new Date();
    }

    await storage.updateFreelancerProfile(userId, {
      portfolio: JSON.stringify(portfolioData)
    });
  }

  async getSkillEndorsements(userId: string): Promise<SkillEndorsement[]> {
    const profile = await storage.getFreelancerProfile(userId);
    if (!profile?.portfolio) return [];

    const portfolioData = this.parsePortfolioData(profile.portfolio);
    return portfolioData.skillEndorsements || [];
  }

  async generatePortfolioSummary(userId: string): Promise<{
    totalProjects: number;
    totalValue: number;
    averageRating: number;
    topSkills: string[];
    completionRate: number;
    clientSatisfaction: number;
    projectCategories: Record<string, number>;
  }> {
    const [portfolioItems, workHistory] = await Promise.all([
      this.getPortfolioItems(userId),
      this.getWorkHistory(userId)
    ]);

    const totalProjects = portfolioItems.length + workHistory.length;
    const totalValue = portfolioItems.reduce((sum, item) => sum + item.projectValue, 0) +
                      workHistory.reduce((sum, item) => sum + item.value, 0);
    
    const ratings = workHistory.filter(item => item.rating > 0).map(item => item.rating);
    const averageRating = ratings.length > 0 ? 
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

    // Count skill occurrences
    const skillCounts: Record<string, number> = {};
    portfolioItems.forEach(item => {
      item.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    workHistory.forEach(item => {
      item.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill]) => skill);

    // Project categories
    const categoryCount: Record<string, number> = {};
    portfolioItems.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });

    return {
      totalProjects,
      totalValue,
      averageRating,
      topSkills,
      completionRate: 95, // Would be calculated from actual project completion data
      clientSatisfaction: averageRating * 20, // Convert 5-star to percentage
      projectCategories: categoryCount
    };
  }

  async optimizeProfileForSEO(userId: string): Promise<{
    recommendations: string[];
    optimizedDescription: string;
    keywordDensity: Record<string, number>;
  }> {
    const profile = await storage.getFreelancerProfile(userId);
    const portfolioItems = await this.getPortfolioItems(userId);
    const workHistory = await this.getWorkHistory(userId);

    const recommendations: string[] = [];
    
    // Analyze current profile
    const allSkills = [
      ...(profile?.skills || []),
      ...portfolioItems.flatMap(item => item.skills),
      ...workHistory.flatMap(item => item.skills)
    ];

    const skillFrequency = this.calculateFrequency(allSkills);
    const topSkills = Object.keys(skillFrequency).slice(0, 8);

    // Generate recommendations
    if (!profile?.bio || profile.bio.length < 150) {
      recommendations.push('Add a detailed bio (150+ words) to improve search visibility');
    }

    if (portfolioItems.length < 3) {
      recommendations.push('Add more portfolio items to showcase your expertise');
    }

    if (!profile?.portfolio || !profile.portfolio.includes('testimonial')) {
      recommendations.push('Include client testimonials to build credibility');
    }

    // Generate optimized description
    const optimizedDescription = this.generateOptimizedDescription(profile, topSkills, workHistory);

    return {
      recommendations,
      optimizedDescription,
      keywordDensity: skillFrequency
    };
  }

  private generateOptimizedDescription(
    profile: FreelancerProfile | null,
    topSkills: string[],
    workHistory: WorkHistory[]
  ): string {
    const experience = workHistory.length;
    const avgRating = workHistory.length > 0 ? 
      workHistory.reduce((sum, item) => sum + item.rating, 0) / workHistory.length : 0;

    return `Experienced ${topSkills.slice(0, 3).join(' and ')} specialist with ${experience}+ successful projects completed. 
    
    ⭐ ${avgRating.toFixed(1)}/5.0 average client rating
    💼 Expertise: ${topSkills.join(', ')}
    🎯 Specializing in high-quality, deadline-driven delivery
    
    I help businesses achieve their goals through expert ${topSkills[0]} development and ${topSkills[1]} solutions. 
    My approach combines technical excellence with clear communication to deliver results that exceed expectations.
    
    Ready to discuss your project? Let's build something amazing together!`;
  }

  private calculateFrequency(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item.toLowerCase().trim();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private parsePortfolioData(portfolioString: string | null): {
    items: PortfolioItem[];
    workHistory: WorkHistory[];
    skillEndorsements: SkillEndorsement[];
  } {
    if (!portfolioString) {
      return { items: [], workHistory: [], skillEndorsements: [] };
    }

    try {
      return JSON.parse(portfolioString);
    } catch {
      return { items: [], workHistory: [], skillEndorsements: [] };
    }
  }

  private async updateUserPortfolio(userId: string, item: PortfolioItem, action: 'add' | 'update'): Promise<void> {
    const profile = await storage.getFreelancerProfile(userId);
    const portfolioData = this.parsePortfolioData(profile?.portfolio);
    
    if (action === 'add') {
      portfolioData.items.push(item);
    }
    
    await storage.updateFreelancerProfile(userId, {
      portfolio: JSON.stringify(portfolioData)
    });
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const portfolioManager = new PortfolioManagementService();
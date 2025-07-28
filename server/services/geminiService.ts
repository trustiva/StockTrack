import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FreelancerProfile, InsertProject } from '@shared/schema';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo-key');

export interface ProjectDiscoveryInput {
  skills: string[];
  experience: string;
  budget?: { min: number; max: number };
  preferredTypes?: string[];
  excludeKeywords?: string[];
}

export interface EnhancedProjectMatch {
  project: InsertProject;
  matchReasoning: string;
  suggestedBidStrategy: string;
  competitionLevel: 'low' | 'medium' | 'high';
  estimatedSuccessRate: number;
}

export class GeminiProjectDiscoveryService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async enhanceProjectDiscovery(
    profile: FreelancerProfile | null,
    searchCriteria: ProjectDiscoveryInput
  ): Promise<EnhancedProjectMatch[]> {
    try {
      // Mock projects for demonstration - in production this would call real APIs
      const mockProjects = await this.getMockProjects();
      
      // Filter projects based on criteria
      const filteredProjects = this.filterProjects(mockProjects, searchCriteria);
      
      // Use Gemini to enhance each project match
      const enhancedMatches = await Promise.all(
        filteredProjects.map(project => this.enhanceProjectMatch(project, profile, searchCriteria))
      );

      // Sort by estimated success rate
      return enhancedMatches
        .sort((a, b) => b.estimatedSuccessRate - a.estimatedSuccessRate)
        .slice(0, 8); // Return top 8 matches

    } catch (error) {
      console.error('Gemini project discovery error:', error);
      // Fallback to basic matching without AI enhancement
      return this.getFallbackMatches(searchCriteria);
    }
  }

  private async enhanceProjectMatch(
    project: InsertProject,
    profile: FreelancerProfile | null,
    criteria: ProjectDiscoveryInput
  ): Promise<EnhancedProjectMatch> {
    try {
      const prompt = `
You are an expert freelance strategist. Analyze this project opportunity and provide strategic insights.

PROJECT:
Title: ${project.title}
Description: ${project.description}
Budget: ${project.budget}
Skills Required: ${project.skills?.join(', ') || 'Not specified'}
Platform: ${project.platform}

FREELANCER PROFILE:
${profile ? `
Skills: ${profile.skills?.join(', ') || 'Not specified'}
Experience: ${profile.experience || 'Not provided'}
Hourly Rate: $${profile.hourlyRate || 'Not specified'}
Bio: ${profile.bio || 'Not provided'}
` : 'Profile not available'}

SEARCH CRITERIA:
Skills: ${criteria.skills.join(', ')}
Experience Level: ${criteria.experience}
Budget Range: ${criteria.budget ? `$${criteria.budget.min} - $${criteria.budget.max}` : 'Not specified'}

Provide analysis in JSON format:
{
  "matchReasoning": "Detailed explanation of why this project matches the freelancer's profile",
  "suggestedBidStrategy": "Strategic advice for bidding on this project",
  "competitionLevel": "low|medium|high - estimated competition level",
  "estimatedSuccessRate": "number 0-100 - estimated chance of winning this project",
  "keyAdvantages": ["list", "of", "competitive", "advantages"],
  "potentialChallenges": ["list", "of", "potential", "challenges"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = JSON.parse(response.text());

      return {
        project,
        matchReasoning: analysis.matchReasoning || 'Good match based on skills alignment',
        suggestedBidStrategy: analysis.suggestedBidStrategy || 'Competitive bidding recommended',
        competitionLevel: analysis.competitionLevel || 'medium',
        estimatedSuccessRate: Math.min(100, Math.max(0, analysis.estimatedSuccessRate || 50))
      };

    } catch (error) {
      console.error('Error enhancing project match:', error);
      
      // Fallback analysis
      return {
        project,
        matchReasoning: 'Skills alignment detected based on project requirements',
        suggestedBidStrategy: 'Research similar projects and bid competitively',
        competitionLevel: 'medium',
        estimatedSuccessRate: this.calculateBasicMatchScore(project, profile, criteria)
      };
    }
  }

  private async getMockProjects(): Promise<InsertProject[]> {
    return [
      {
        title: "Full Stack React/Node.js Developer for SaaS Platform",
        description: "We're building a comprehensive SaaS platform for small businesses. Need an experienced developer to handle both frontend (React, TypeScript) and backend (Node.js, PostgreSQL) development. The project includes user authentication, subscription management, dashboard analytics, and API integrations.",
        platform: "upwork",
        platformProjectId: "gemini_001",
        budget: "$5,000 - $12,000",
        budgetType: "fixed",
        skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "SaaS", "Authentication"],
        clientName: "TechFlow Solutions",
        clientRating: "4.9",
        projectUrl: "https://upwork.com/jobs/gemini-001",
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: "open",
        matchScore: 0
      },
      {
        title: "AI-Powered Mobile App Development (React Native)",
        description: "Looking for a skilled React Native developer to build a mobile app that integrates with AI services. The app will include real-time chat, image recognition, and personalized recommendations. Experience with AI/ML APIs preferred.",
        platform: "freelancer",
        platformProjectId: "gemini_002",
        budget: "$40 - $60/hour",
        budgetType: "hourly",
        skills: ["React Native", "AI/ML", "Mobile Development", "API Integration", "Firebase"],
        clientName: "AI Innovations Ltd",
        clientRating: "4.7",
        projectUrl: "https://freelancer.com/projects/gemini-002",
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: "open",
        matchScore: 0
      },
      {
        title: "E-commerce Platform with Advanced Analytics",
        description: "Seeking a developer to build a modern e-commerce platform with advanced analytics dashboard. Must include inventory management, order tracking, customer analytics, and integration with payment gateways. Performance optimization is crucial.",
        platform: "guru",
        platformProjectId: "gemini_003",
        budget: "$8,000 - $15,000",
        budgetType: "fixed",
        skills: ["React", "Node.js", "E-commerce", "Analytics", "Payment Integration", "Performance"],
        clientName: "RetailTech Pro",
        clientRating: "4.8",
        projectUrl: "https://guru.com/jobs/gemini-003",
        deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        status: "open",
        matchScore: 0
      },
      {
        title: "WordPress to React Conversion with Headless CMS",
        description: "Convert existing WordPress site to modern React application using headless CMS approach. Need to maintain SEO performance while improving user experience. Experience with Strapi or similar headless CMS required.",
        platform: "peopleperhour",
        platformProjectId: "gemini_004",
        budget: "$3,000 - $6,000",
        budgetType: "fixed",
        skills: ["React", "WordPress", "Headless CMS", "SEO", "JavaScript", "API"],
        clientName: "Digital Transform Co",
        clientRating: "4.6",
        projectUrl: "https://peopleperhour.com/job/gemini-004",
        deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        status: "open",
        matchScore: 0
      },
      {
        title: "Data Visualization Dashboard with D3.js",
        description: "Create interactive data visualization dashboard using D3.js and React. Must handle large datasets, provide real-time updates, and include export functionality. Experience with data processing and visualization libraries essential.",
        platform: "upwork",
        platformProjectId: "gemini_005",
        budget: "$4,500 - $8,500",
        budgetType: "fixed",
        skills: ["D3.js", "React", "Data Visualization", "JavaScript", "Charts", "Analytics"],
        clientName: "DataViz Solutions",
        clientRating: "4.9",
        projectUrl: "https://upwork.com/jobs/gemini-005",
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        status: "open",
        matchScore: 0
      },
      {
        title: "Blockchain DApp Development (Web3)",
        description: "Build decentralized application (DApp) on Ethereum blockchain. Includes smart contract development, Web3 integration, and modern React frontend. Experience with Solidity and Web3.js/Ethers.js required.",
        platform: "freelancer",
        platformProjectId: "gemini_006",
        budget: "$10,000 - $20,000",
        budgetType: "fixed",
        skills: ["Blockchain", "Solidity", "Web3", "React", "Ethereum", "Smart Contracts"],
        clientName: "CryptoTech Ventures",
        clientRating: "4.5",
        projectUrl: "https://freelancer.com/projects/gemini-006",
        deadline: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
        status: "open",
        matchScore: 0
      }
    ];
  }

  private filterProjects(projects: InsertProject[], criteria: ProjectDiscoveryInput): InsertProject[] {
    return projects.filter(project => {
      // Skills match
      const skillMatch = criteria.skills.some(skill =>
        project.skills?.some(pSkill =>
          pSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(pSkill.toLowerCase())
        )
      );

      if (!skillMatch) return false;

      // Exclude keywords
      if (criteria.excludeKeywords?.length) {
        const hasExcludedKeyword = criteria.excludeKeywords.some(keyword =>
          project.title.toLowerCase().includes(keyword.toLowerCase()) ||
          project.description?.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasExcludedKeyword) return false;
      }

      // Budget filtering (simplified)
      if (criteria.budget && project.budget) {
        const budgetNumbers = project.budget.match(/\d+/g);
        if (budgetNumbers && budgetNumbers.length > 0) {
          const projectBudget = parseInt(budgetNumbers[0]);
          if (project.budgetType === 'hourly') {
            return projectBudget >= criteria.budget.min && projectBudget <= criteria.budget.max;
          } else {
            return projectBudget >= criteria.budget.min;
          }
        }
      }

      return true;
    });
  }

  private calculateBasicMatchScore(
    project: InsertProject,
    profile: FreelancerProfile | null,
    criteria: ProjectDiscoveryInput
  ): number {
    let score = 0;

    // Skills match
    if (profile?.skills && project.skills) {
      const userSkills = profile.skills.map(s => s.toLowerCase());
      const projectSkills = project.skills.map(s => s.toLowerCase());
      const matchingSkills = userSkills.filter(skill =>
        projectSkills.some(pSkill => pSkill.includes(skill) || skill.includes(pSkill))
      );
      score += (matchingSkills.length / Math.max(userSkills.length, projectSkills.length)) * 60;
    }

    // Experience match
    if (profile?.experience && criteria.experience) {
      if (profile.experience.toLowerCase().includes(criteria.experience.toLowerCase())) {
        score += 20;
      }
    }

    // Budget compatibility
    if (profile?.hourlyRate && project.budget) {
      const budgetNumbers = project.budget.match(/\d+/g);
      if (budgetNumbers) {
        const projectRate = parseInt(budgetNumbers[0]);
        const userRate = Number(profile.hourlyRate);
        if (Math.abs(userRate - projectRate) <= userRate * 0.3) {
          score += 20;
        }
      }
    }

    return Math.min(100, Math.round(score));
  }

  private getFallbackMatches(criteria: ProjectDiscoveryInput): EnhancedProjectMatch[] {
    // Return basic matches without AI enhancement
    return [
      {
        project: {
          title: "Basic React Development Project",
          description: "Simple React application development",
          platform: "upwork",
          platformProjectId: "fallback_001",
          budget: "$2,000 - $4,000",
          budgetType: "fixed",
          skills: criteria.skills.slice(0, 3),
          clientName: "Standard Client",
          clientRating: "4.5",
          projectUrl: "https://example.com/fallback",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "open",
          matchScore: 75
        },
        matchReasoning: "Basic skills alignment detected",
        suggestedBidStrategy: "Competitive bidding recommended",
        competitionLevel: "medium",
        estimatedSuccessRate: 60
      }
    ];
  }

  async generateProjectInsights(projectIds: string[]): Promise<{
    marketTrends: string[];
    skillDemand: Record<string, number>;
    recommendations: string[];
  }> {
    try {
      const prompt = `
Analyze the current freelance market trends based on these project types and provide insights:

Project analysis needed for: ${projectIds.join(', ')}

Provide market analysis in JSON format:
{
  "marketTrends": ["trend1", "trend2", "trend3"],
  "skillDemand": {"skill1": 85, "skill2": 70, "skill3": 90},
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());

    } catch (error) {
      console.error('Error generating project insights:', error);
      return {
        marketTrends: [
          "Increased demand for full-stack developers",
          "AI/ML integration becoming standard",
          "Mobile-first development prioritized"
        ],
        skillDemand: {
          "React": 90,
          "Node.js": 85,
          "TypeScript": 80,
          "AI/ML": 75,
          "Mobile Development": 70
        },
        recommendations: [
          "Focus on full-stack capabilities",
          "Learn AI/ML integration basics",
          "Improve mobile development skills"
        ]
      };
    }
  }
}

export const geminiProjectDiscovery = new GeminiProjectDiscoveryService();
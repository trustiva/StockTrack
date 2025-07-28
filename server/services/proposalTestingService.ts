import { generateProposal } from './openai';
import type { Project, FreelancerProfile } from '@shared/schema';

export interface TestProject {
  id: string;
  name: string;
  project: Project;
  expectedSkills: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'web-development' | 'mobile' | 'ai-ml' | 'blockchain' | 'design';
}

export interface ProposalTestResult {
  projectId: string;
  projectName: string;
  success: boolean;
  confidence: number;
  keyPoints: string[];
  content: string;
  bidAmount: string;
  timeline: string;
  error?: string;
  generationTime: number;
}

export class ProposalTestingService {
  private testProjects: TestProject[] = [
    {
      id: 'test_web_1',
      name: 'E-commerce Website Development',
      project: {
        id: 'test_web_1',
        title: 'Modern E-commerce Website with React and Node.js',
        description: 'We need a full-stack developer to build a modern e-commerce website. The project includes user authentication, product catalog, shopping cart, payment integration with Stripe, admin dashboard, and inventory management. Must be responsive and SEO optimized.',
        platform: 'upwork',
        platformProjectId: 'test_web_1',
        budget: '$5,000 - $8,000',
        budgetType: 'fixed',
        skills: ['React', 'Node.js', 'MongoDB', 'Stripe', 'E-commerce', 'SEO'],
        clientName: 'RetailTech Solutions',
        clientRating: '4.8',
        projectUrl: 'https://test.com/project/1',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'open',
        matchScore: 85,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      expectedSkills: ['React', 'Node.js', 'E-commerce', 'Payment Integration'],
      difficulty: 'medium',
      category: 'web-development'
    },
    {
      id: 'test_mobile_1',
      name: 'React Native App Development',
      project: {
        id: 'test_mobile_1',
        title: 'Cross-platform Mobile App for Food Delivery',
        description: 'Looking for an experienced React Native developer to create a food delivery app. Features include user registration, restaurant listings, menu browsing, order placement, real-time tracking, push notifications, and payment integration. Need both iOS and Android versions.',
        platform: 'freelancer',
        platformProjectId: 'test_mobile_1',
        budget: '$40 - $60/hour',
        budgetType: 'hourly',
        skills: ['React Native', 'Mobile Development', 'Push Notifications', 'GPS', 'Payment Gateway'],
        clientName: 'FoodieApp Startup',
        clientRating: '4.6',
        projectUrl: 'https://test.com/project/2',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'open',
        matchScore: 78,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      expectedSkills: ['React Native', 'Mobile Development', 'API Integration'],
      difficulty: 'hard',
      category: 'mobile'
    },
    {
      id: 'test_ai_1',
      name: 'AI Chatbot Development',
      project: {
        id: 'test_ai_1',
        title: 'AI-Powered Customer Support Chatbot',
        description: 'We need an AI developer to create an intelligent chatbot for customer support. The bot should understand natural language, provide relevant answers, escalate complex issues to humans, and integrate with our existing CRM system. Experience with OpenAI GPT or similar models required.',
        platform: 'guru',
        platformProjectId: 'test_ai_1',
        budget: '$3,000 - $6,000',
        budgetType: 'fixed',
        skills: ['AI/ML', 'Natural Language Processing', 'OpenAI', 'Python', 'API Integration', 'CRM'],
        clientName: 'TechSupport Pro',
        clientRating: '4.9',
        projectUrl: 'https://test.com/project/3',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'open',
        matchScore: 72,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      expectedSkills: ['AI/ML', 'Python', 'Natural Language Processing'],
      difficulty: 'hard',
      category: 'ai-ml'
    },
    {
      id: 'test_blockchain_1',
      name: 'DeFi Smart Contract',
      project: {
        id: 'test_blockchain_1',
        title: 'DeFi Staking Platform Smart Contract',
        description: 'Seeking a blockchain developer to create smart contracts for a DeFi staking platform. The project includes token staking, reward distribution, governance features, and security audits. Must be deployed on Ethereum mainnet with comprehensive testing on testnets.',
        platform: 'upwork',
        platformProjectId: 'test_blockchain_1',
        budget: '$8,000 - $15,000',
        budgetType: 'fixed',
        skills: ['Solidity', 'Smart Contracts', 'DeFi', 'Ethereum', 'Web3', 'Security Auditing'],
        clientName: 'DeFi Innovations',
        clientRating: '4.7',
        projectUrl: 'https://test.com/project/4',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'open',
        matchScore: 65,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      expectedSkills: ['Solidity', 'Smart Contracts', 'Blockchain'],
      difficulty: 'hard',
      category: 'blockchain'
    },
    {
      id: 'test_design_1',
      name: 'UI/UX Design Project',
      project: {
        id: 'test_design_1',
        title: 'Modern SaaS Dashboard UI/UX Design',
        description: 'Looking for a talented UI/UX designer to create a modern, intuitive dashboard for our SaaS platform. Need complete user journey mapping, wireframes, high-fidelity mockups, and a design system. Must be experienced with Figma and have a strong portfolio of dashboard designs.',
        platform: 'dribbble',
        platformProjectId: 'test_design_1',
        budget: '$2,500 - $4,500',
        budgetType: 'fixed',
        skills: ['UI/UX Design', 'Figma', 'Dashboard Design', 'Design Systems', 'User Research'],
        clientName: 'SaaS Design Co',
        clientRating: '4.8',
        projectUrl: 'https://test.com/project/5',
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'open',
        matchScore: 80,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      expectedSkills: ['UI/UX Design', 'Figma', 'Design Systems'],
      difficulty: 'medium',
      category: 'design'
    }
  ];

  async runProposalTests(
    profile: FreelancerProfile,
    testCategories?: string[]
  ): Promise<ProposalTestResult[]> {
    const results: ProposalTestResult[] = [];
    
    let projectsToTest = this.testProjects;
    if (testCategories && testCategories.length > 0) {
      projectsToTest = this.testProjects.filter(tp => testCategories.includes(tp.category));
    }

    for (const testProject of projectsToTest) {
      const startTime = Date.now();
      
      try {
        const proposalResult = await generateProposal(
          testProject.project,
          profile,
          `This is a test proposal for ${testProject.name}. Focus on demonstrating relevant skills and experience.`,
          'testing'
        );

        const endTime = Date.now();
        
        results.push({
          projectId: testProject.id,
          projectName: testProject.name,
          success: true,
          confidence: proposalResult.confidence,
          keyPoints: proposalResult.keyPoints,
          content: proposalResult.content,
          bidAmount: proposalResult.bidAmount,
          timeline: proposalResult.timeline,
          generationTime: endTime - startTime
        });

      } catch (error) {
        const endTime = Date.now();
        
        results.push({
          projectId: testProject.id,
          projectName: testProject.name,
          success: false,
          confidence: 0,
          keyPoints: [],
          content: '',
          bidAmount: '',
          timeline: '',
          error: (error as Error).message,
          generationTime: endTime - startTime
        });
      }
    }

    return results;
  }

  async testSpecificProject(
    projectId: string,
    profile: FreelancerProfile,
    customInstructions?: string
  ): Promise<ProposalTestResult | null> {
    const testProject = this.testProjects.find(tp => tp.id === projectId);
    if (!testProject) {
      return null;
    }

    const startTime = Date.now();
    
    try {
      const proposalResult = await generateProposal(
        testProject.project,
        profile,
        customInstructions || `Test proposal for ${testProject.name}`,
        'testing'
      );

      const endTime = Date.now();
      
      return {
        projectId: testProject.id,
        projectName: testProject.name,
        success: true,
        confidence: proposalResult.confidence,
        keyPoints: proposalResult.keyPoints,
        content: proposalResult.content,
        bidAmount: proposalResult.bidAmount,
        timeline: proposalResult.timeline,
        generationTime: endTime - startTime
      };

    } catch (error) {
      const endTime = Date.now();
      
      return {
        projectId: testProject.id,
        projectName: testProject.name,
        success: false,
        confidence: 0,
        keyPoints: [],
        content: '',
        bidAmount: '',
        timeline: '',
        error: (error as Error).message,
        generationTime: endTime - startTime
      };
    }
  }

  getTestProjects(): TestProject[] {
    return this.testProjects;
  }

  getTestProjectsByCategory(category: string): TestProject[] {
    return this.testProjects.filter(tp => tp.category === category);
  }

  generateTestReport(results: ProposalTestResult[]): {
    summary: {
      totalTests: number;
      successful: number;
      failed: number;
      averageConfidence: number;
      averageGenerationTime: number;
    };
    categoryBreakdown: Record<string, {
      total: number;
      successful: number;
      averageConfidence: number;
    }>;
    recommendations: string[];
  } {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const averageConfidence = successful.length > 0 
      ? successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length 
      : 0;
      
    const averageGenerationTime = results.length > 0
      ? results.reduce((sum, r) => sum + r.generationTime, 0) / results.length
      : 0;

    // Category breakdown
    const categoryBreakdown: Record<string, { total: number; successful: number; averageConfidence: number }> = {};
    
    for (const result of results) {
      const testProject = this.testProjects.find(tp => tp.id === result.projectId);
      if (testProject) {
        const category = testProject.category;
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { total: 0, successful: 0, averageConfidence: 0 };
        }
        categoryBreakdown[category].total++;
        if (result.success) {
          categoryBreakdown[category].successful++;
          categoryBreakdown[category].averageConfidence += result.confidence;
        }
      }
    }

    // Calculate average confidence per category
    Object.keys(categoryBreakdown).forEach(category => {
      if (categoryBreakdown[category].successful > 0) {
        categoryBreakdown[category].averageConfidence /= categoryBreakdown[category].successful;
      }
    });

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (averageConfidence < 70) {
      recommendations.push("Consider improving profile completeness to increase proposal confidence");
    }
    
    if (averageGenerationTime > 5000) {
      recommendations.push("Proposal generation time is high - consider optimizing prompts");
    }
    
    if (failed.length > 0) {
      recommendations.push(`${failed.length} proposals failed to generate - review error logs`);
    }

    Object.entries(categoryBreakdown).forEach(([category, stats]) => {
      if (stats.averageConfidence < 60) {
        recommendations.push(`Low confidence in ${category} projects - consider skill development`);
      }
    });

    return {
      summary: {
        totalTests: results.length,
        successful: successful.length,
        failed: failed.length,
        averageConfidence: Math.round(averageConfidence),
        averageGenerationTime: Math.round(averageGenerationTime)
      },
      categoryBreakdown,
      recommendations
    };
  }
}

export const proposalTestingService = new ProposalTestingService();
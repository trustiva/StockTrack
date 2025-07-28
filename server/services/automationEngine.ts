import { db } from "../db";
import { 
  projects, 
  proposals, 
  automationSettings, 
  notifications, 
  freelancerProfiles,
  platformConnections,
  type InsertProject,
  type InsertProposal,
  type InsertNotification
} from "@shared/schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { PlatformService, type ProjectData } from "./platformIntegrations";
import { generateProposal } from "./openai";

export class AutomationEngine {
  private platformService: PlatformService;
  private isRunning: boolean = false;

  constructor() {
    this.platformService = new PlatformService();
  }

  async startAutomation(userId: string) {
    if (this.isRunning) {
      console.log("Automation already running");
      return;
    }

    this.isRunning = true;
    console.log(`Starting automation for user ${userId}`);

    try {
      // Load user's platform connections
      await this.loadUserPlatforms(userId);

      // Run automation cycle
      await this.runAutomationCycle(userId);

      // Schedule next run (every 30 minutes)
      setTimeout(() => {
        this.isRunning = false;
        this.startAutomation(userId);
      }, 30 * 60 * 1000);

    } catch (error) {
      console.error("Automation error:", error);
      this.isRunning = false;
    }
  }

  async stopAutomation() {
    this.isRunning = false;
    console.log("Automation stopped");
  }

  private async loadUserPlatforms(userId: string) {
    const connections = await db
      .select()
      .from(platformConnections)
      .where(and(
        eq(platformConnections.userId, userId),
        eq(platformConnections.isActive, true)
      ));

    // Add each platform integration
    for (const connection of connections) {
      try {
        if (connection.credentials) {
          this.platformService.addIntegration(
            connection.platform,
            connection.credentials as any
          );
        }
      } catch (error) {
        console.error(`Failed to load platform ${connection.platform}:`, error);
      }
    }
  }

  private async runAutomationCycle(userId: string) {
    console.log(`Running automation cycle for user ${userId}`);

    // Get user's automation settings
    const [settings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId));

    if (!settings || !settings.autoSearch) {
      console.log("Auto search disabled for user");
      return;
    }

    // Get user's profile and skills
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId));

    if (!profile) {
      console.log("No profile found for user");
      return;
    }

    // Search for projects
    const skills = settings.preferredSkills?.length ? settings.preferredSkills : profile.skills || [];
    const budget = settings.minBudget && settings.maxBudget ? {
      min: Number(settings.minBudget),
      max: Number(settings.maxBudget)
    } : undefined;

    const foundProjects = await this.platformService.searchAllPlatforms(skills, budget);

    // Process each project
    for (const projectData of foundProjects) {
      await this.processProject(userId, projectData, settings, profile);
    }

    // Send summary notification
    if (foundProjects.length > 0) {
      await this.createNotification(userId, {
        title: "Project Discovery Complete",
        message: `Found ${foundProjects.length} new projects matching your criteria`,
        type: "project_match",
        data: { projectCount: foundProjects.length }
      });
    }
  }

  private async processProject(
    userId: string, 
    projectData: ProjectData, 
    settings: any, 
    profile: any
  ) {
    // Check if project already exists
    const existingProject = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.platformProjectId, projectData.id),
        eq(projects.platform, projectData.platform)
      ));

    if (existingProject.length > 0) {
      return; // Project already processed
    }

    // Calculate match score
    const matchScore = this.calculateMatchScore(projectData, profile);

    // Filter by exclude keywords
    if (settings.excludeKeywords?.length) {
      const hasExcludedKeyword = settings.excludeKeywords.some((keyword: string) =>
        projectData.title.toLowerCase().includes(keyword.toLowerCase()) ||
        projectData.description.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasExcludedKeyword) {
        return; // Skip project with excluded keywords
      }
    }

    // Store project in database
    const [storedProject] = await db
      .insert(projects)
      .values({
        title: projectData.title,
        description: projectData.description,
        platform: projectData.platform,
        platformProjectId: projectData.id,
        budget: projectData.budget,
        budgetType: projectData.budgetType,
        skills: projectData.skills,
        clientName: projectData.clientName,
        clientRating: projectData.clientRating?.toString(),
        projectUrl: projectData.url,
        deadline: projectData.deadline,
        matchScore: matchScore
      })
      .returning();

    // Auto-propose if enabled and match score is high
    if (settings.autoProposal && matchScore >= 80) {
      await this.autoGenerateProposal(userId, storedProject, projectData, profile);
    }

    // Create notification for high-scoring projects
    if (matchScore >= 70) {
      await this.createNotification(userId, {
        title: "High-Match Project Found",
        message: `Found a ${matchScore}% match: ${projectData.title}`,
        type: "project_match",
        data: { 
          projectId: storedProject.id, 
          matchScore,
          platform: projectData.platform 
        }
      });
    }
  }

  private async autoGenerateProposal(
    userId: string,
    project: any,
    projectData: ProjectData,
    profile: any
  ) {
    try {
      // Check daily proposal limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [dailyCount] = await db
        .select({ count: count() })
        .from(proposals)
        .where(and(
          eq(proposals.userId, userId),
          gte(proposals.createdAt, today)
        ));

      const settings = await db
        .select()
        .from(automationSettings)
        .where(eq(automationSettings.userId, userId));

      if (settings[0] && dailyCount.count >= (settings[0].maxProposalsPerDay || 5)) {
        console.log("Daily proposal limit reached");
        return;
      }

      // Generate proposal using AI
      const proposalContent = await generateProposal(projectData, profile);
      
      // Calculate bid amount (could be more sophisticated)
      const bidAmount = profile.hourlyRate ? 
        Number(profile.hourlyRate) * 40 : // Assume 40 hours for fixed projects
        1000; // Default amount

      // Store proposal
      const [proposal] = await db
        .insert(proposals)
        .values({
          userId,
          projectId: project.id,
          content: proposalContent,
          bidAmount: bidAmount.toString(),
          proposedTimeline: "2-3 weeks",
          isAutoGenerated: true,
          sentAt: new Date()
        })
        .returning();

      // Submit proposal to platform
      const submissionResult = await this.platformService.submitProposal(
        projectData.platform,
        {
          projectId: projectData.id,
          content: proposalContent,
          bidAmount,
          timeline: "2-3 weeks"
        }
      );

      // Update proposal status based on submission result
      if (submissionResult.success) {
        await this.createNotification(userId, {
          title: "Auto-Proposal Submitted",
          message: `Automatically submitted proposal for: ${project.title}`,
          type: "proposal_update",
          data: { 
            proposalId: proposal.id,
            projectId: project.id,
            platform: projectData.platform
          }
        });
      } else {
        console.error("Failed to submit proposal:", submissionResult.message);
      }

    } catch (error) {
      console.error("Error generating auto-proposal:", error);
    }
  }

  private async createNotification(userId: string, notificationData: {
    title: string;
    message: string;
    type: string;
    data?: any;
  }) {
    await db
      .insert(notifications)
      .values({
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        data: notificationData.data
      } satisfies InsertNotification);
  }

  // Public method to manually trigger automation for testing
  async runManualCycle(userId: string) {
    await this.loadUserPlatforms(userId);
    await this.runAutomationCycle(userId);
  }

  // Get automation status
  async getAutomationStatus(userId: string) {
    const [settings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId));

    return {
      isRunning: this.isRunning,
      autoSearch: settings?.autoSearch || false,
      autoProposal: settings?.autoProposal || false,
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 30 * 60 * 1000)
    };
  }

  // Calculate project match score based on skills, budget, and other factors
  private calculateMatchScore(projectData: ProjectData, profile: any): number {
    let score = 0;
    
    // Skills match (0-60 points)
    if (profile.skills && projectData.skills) {
      const userSkills = profile.skills.map((s: string) => s.toLowerCase());
      const projectSkills = projectData.skills.map(s => s.toLowerCase());
      
      const matchingSkills = userSkills.filter((skill: string) => 
        projectSkills.some(pSkill => 
          pSkill.includes(skill) || skill.includes(pSkill)
        )
      );
      
      score += (matchingSkills.length / Math.max(userSkills.length, projectSkills.length)) * 60;
    }
    
    // Budget compatibility (0-20 points)
    if (profile.hourlyRate && projectData.budget) {
      const userRate = Number(profile.hourlyRate);
      const budgetMatch = projectData.budget.match(/\$(\d+)/);
      
      if (budgetMatch) {
        const projectRate = parseInt(budgetMatch[1]);
        if (projectData.budgetType === 'hourly') {
          // For hourly projects, check if rates are compatible
          if (Math.abs(userRate - projectRate) <= userRate * 0.3) {
            score += 20;
          } else if (Math.abs(userRate - projectRate) <= userRate * 0.5) {
            score += 10;
          }
        } else {
          // For fixed projects, estimate if it's reasonable
          const estimatedHours = projectRate / userRate;
          if (estimatedHours >= 10 && estimatedHours <= 200) {
            score += 15;
          }
        }
      }
    }
    
    // Client rating bonus (0-10 points)
    if (projectData.clientRating && projectData.clientRating >= 4.0) {
      score += Math.min(10, (projectData.clientRating - 4.0) * 20);
    }
    
    // Experience level match (0-10 points)
    if (profile.experience) {
      const experience = profile.experience.toLowerCase();
      const description = projectData.description.toLowerCase();
      
      if ((experience.includes('senior') || experience.includes('expert')) && 
          (description.includes('expert') || description.includes('senior'))) {
        score += 10;
      } else if ((experience.includes('intermediate') || experience.includes('mid')) && 
                 (description.includes('intermediate') || description.includes('experienced'))) {
        score += 8;
      } else if (experience.includes('beginner') && 
                 (description.includes('beginner') || description.includes('entry'))) {
        score += 6;
      }
    }
    
    return Math.min(100, Math.round(score));
  }
}

// Global automation engine instance
export const automationEngine = new AutomationEngine();
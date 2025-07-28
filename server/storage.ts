import {
  users,
  freelancerProfiles,
  platformConnections,
  projects,
  proposals,
  automationSettings,
  notifications,
  type User,
  type UpsertUser,
  type FreelancerProfile,
  type InsertFreelancerProfile,
  type PlatformConnection,
  type InsertPlatformConnection,
  type Project,
  type InsertProject,
  type Proposal,
  type InsertProposal,
  type AutomationSettings,
  type InsertAutomationSettings,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, ilike, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Freelancer profile operations
  getFreelancerProfile(userId: string): Promise<FreelancerProfile | undefined>;
  createFreelancerProfile(profile: InsertFreelancerProfile): Promise<FreelancerProfile>;
  updateFreelancerProfile(userId: string, profile: Partial<InsertFreelancerProfile>): Promise<FreelancerProfile>;
  
  // Platform connections
  getPlatformConnections(userId: string): Promise<PlatformConnection[]>;
  createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection>;
  updatePlatformConnection(id: string, connection: Partial<InsertPlatformConnection>): Promise<PlatformConnection>;
  
  // Projects
  getProjects(filters?: { platform?: string; skills?: string[]; minMatchScore?: number }): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  
  // Proposals
  getProposals(userId: string): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal>;
  getProposalsByProject(projectId: string): Promise<Proposal[]>;
  
  // Automation settings
  getAutomationSettings(userId: string): Promise<AutomationSettings | undefined>;
  createAutomationSettings(settings: InsertAutomationSettings): Promise<AutomationSettings>;
  updateAutomationSettings(userId: string, settings: Partial<InsertAutomationSettings>): Promise<AutomationSettings>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  
  // Analytics
  getUserStats(userId: string): Promise<{
    activeProposals: number;
    successRate: number;
    monthlyEarnings: number;
    autoApplications: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Freelancer profile operations
  async getFreelancerProfile(userId: string): Promise<FreelancerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(freelancerProfiles)
      .where(eq(freelancerProfiles.userId, userId));
    return profile;
  }

  async createFreelancerProfile(profile: InsertFreelancerProfile): Promise<FreelancerProfile> {
    const [created] = await db
      .insert(freelancerProfiles)
      .values(profile)
      .returning();
    return created;
  }

  async updateFreelancerProfile(userId: string, profile: Partial<InsertFreelancerProfile>): Promise<FreelancerProfile> {
    const [updated] = await db
      .update(freelancerProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(freelancerProfiles.userId, userId))
      .returning();
    return updated;
  }

  // Platform connections
  async getPlatformConnections(userId: string): Promise<PlatformConnection[]> {
    return await db
      .select()
      .from(platformConnections)
      .where(eq(platformConnections.userId, userId));
  }

  async createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection> {
    const [created] = await db
      .insert(platformConnections)
      .values(connection)
      .returning();
    return created;
  }

  async updatePlatformConnection(id: string, connection: Partial<InsertPlatformConnection>): Promise<PlatformConnection> {
    const [updated] = await db
      .update(platformConnections)
      .set({ ...connection, updatedAt: new Date() })
      .where(eq(platformConnections.id, id))
      .returning();
    return updated;
  }

  // Projects
  async getProjects(filters?: { platform?: string; skills?: string[]; minMatchScore?: number }): Promise<Project[]> {
    let query = db.select().from(projects);
    
    const conditions = [];
    
    if (filters?.platform) {
      conditions.push(eq(projects.platform, filters.platform));
    }
    
    if (filters?.skills && filters.skills.length > 0) {
      // This is a simplified overlap check - in production you'd want better array overlap
      conditions.push(or(...filters.skills.map(skill => 
        ilike(projects.skills.toString(), `%${skill}%`)
      )));
    }
    
    if (filters?.minMatchScore) {
      conditions.push(gte(projects.matchScore, filters.minMatchScore));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(projects.createdAt)).limit(20);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db
      .insert(projects)
      .values(project)
      .returning();
    return created;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        platform: projects.platform,
        platformProjectId: projects.platformProjectId,
        budget: projects.budget,
        budgetType: projects.budgetType,
        skills: projects.skills,
        clientName: projects.clientName,
        clientRating: projects.clientRating,
        projectUrl: projects.projectUrl,
        deadline: projects.deadline,
        status: projects.status,
        matchScore: projects.matchScore,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(proposals, eq(projects.id, proposals.projectId))
      .where(eq(proposals.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  // Proposals
  async getProposals(userId: string): Promise<Proposal[]> {
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.userId, userId))
      .orderBy(desc(proposals.createdAt));
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [created] = await db
      .insert(proposals)
      .values(proposal)
      .returning();
    return created;
  }

  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal> {
    const [updated] = await db
      .update(proposals)
      .set({ ...proposal, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return updated;
  }

  async getProposalsByProject(projectId: string): Promise<Proposal[]> {
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.projectId, projectId));
  }

  // Automation settings
  async getAutomationSettings(userId: string): Promise<AutomationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, userId));
    return settings;
  }

  async createAutomationSettings(settings: InsertAutomationSettings): Promise<AutomationSettings> {
    const [created] = await db
      .insert(automationSettings)
      .values(settings)
      .returning();
    return created;
  }

  async updateAutomationSettings(userId: string, settings: Partial<InsertAutomationSettings>): Promise<AutomationSettings> {
    const [updated] = await db
      .update(automationSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(automationSettings.userId, userId))
      .returning();
    return updated;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Analytics
  async getUserStats(userId: string): Promise<{
    activeProposals: number;
    successRate: number;
    monthlyEarnings: number;
    autoApplications: number;
  }> {
    // Get active proposals count
    const activeProposalsResult = await db
      .select()
      .from(proposals)
      .where(and(
        eq(proposals.userId, userId),
        eq(proposals.status, "pending")
      ));

    // Get total proposals and accepted ones for success rate
    const totalProposalsResult = await db
      .select()
      .from(proposals)
      .where(eq(proposals.userId, userId));

    const acceptedProposalsResult = await db
      .select()
      .from(proposals)
      .where(and(
        eq(proposals.userId, userId),
        eq(proposals.status, "accepted")
      ));

    // Get auto applications count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const autoApplicationsResult = await db
      .select()
      .from(proposals)
      .where(and(
        eq(proposals.userId, userId),
        eq(proposals.isAutoGenerated, true),
        gte(proposals.createdAt, thirtyDaysAgo)
      ));

    const activeProposals = activeProposalsResult.length;
    const totalProposals = totalProposalsResult.length;
    const acceptedProposals = acceptedProposalsResult.length;
    const autoApplications = autoApplicationsResult.length;

    const successRate = totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0;

    // For MVP, we'll return a placeholder for monthly earnings
    // In production, this would be calculated from actual project earnings
    const monthlyEarnings = acceptedProposals * 500; // Placeholder calculation

    return {
      activeProposals,
      successRate,
      monthlyEarnings,
      autoApplications,
    };
  }
}

export const storage = new DatabaseStorage();

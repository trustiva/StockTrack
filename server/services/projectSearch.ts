import type { AutomationSettings, FreelancerProfile, InsertProject } from "@shared/schema";
import { generateProjectMatchScore } from "./openai";
import { geminiProjectDiscovery, type ProjectDiscoveryInput } from "./geminiService";

// Mock project data for MVP - in production this would connect to real APIs
const MOCK_PROJECTS = [
  {
    title: "Full Stack Developer for SaaS Platform",
    description: "Looking for an experienced full-stack developer to build a modern SaaS platform using React and Node.js. The project involves creating user authentication, dashboard, payment integration, and admin panel.",
    platform: "upwork",
    platformProjectId: "upwork_001",
    budget: "$5,000 - $8,000",
    budgetType: "fixed",
    skills: ["React", "Node.js", "MongoDB", "SaaS", "Authentication"],
    clientName: "TechStartup Inc",
    clientRating: 4.8,
    projectUrl: "https://upwork.com/jobs/001",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  {
    title: "Frontend Developer for E-learning Platform",
    description: "We need a skilled frontend developer to create interactive components for our e-learning platform. Experience with Vue.js and modern UI/UX principles required.",
    platform: "freelancer",
    platformProjectId: "freelancer_002",
    budget: "$30 - $45/hour",
    budgetType: "hourly",
    skills: ["Vue.js", "UI/UX", "JavaScript", "CSS", "Education"],
    clientName: "EduTech Solutions",
    clientRating: 4.5,
    projectUrl: "https://freelancer.com/projects/002",
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
  },
  {
    title: "Mobile App Development (React Native)",
    description: "Seeking a React Native developer to build a cross-platform mobile application for our startup. The app should include real-time chat, push notifications, and social features.",
    platform: "guru",
    platformProjectId: "guru_003",
    budget: "$3,000 - $5,000",
    budgetType: "fixed",
    skills: ["React Native", "Mobile", "Firebase", "Push Notifications", "Chat"],
    clientName: "Mobile Innovations",
    clientRating: 4.9,
    projectUrl: "https://guru.com/jobs/003",
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
  },
  {
    title: "WordPress Plugin Development",
    description: "Looking for WordPress expert to develop custom plugin for our content management needs. Must have experience with WordPress hooks, filters, and database optimization.",
    platform: "peopleperhour",
    platformProjectId: "pph_004",
    budget: "$25 - $35/hour",
    budgetType: "hourly",
    skills: ["WordPress", "PHP", "MySQL", "Plugin Development", "CMS"],
    clientName: "Content Creators LLC",
    clientRating: 4.2,
    projectUrl: "https://peopleperhour.com/job/004",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  },
  {
    title: "E-commerce Website with Payment Integration",
    description: "Need an experienced developer to build a complete e-commerce solution with React frontend, Node.js backend, and Stripe payment integration.",
    platform: "upwork",
    platformProjectId: "upwork_005",
    budget: "$4,000 - $7,000",
    budgetType: "fixed",
    skills: ["React", "Node.js", "E-commerce", "Stripe", "Payment Gateway"],
    clientName: "Online Retail Co",
    clientRating: 4.6,
    projectUrl: "https://upwork.com/jobs/005",
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
  },
  {
    title: "Data Visualization Dashboard",
    description: "Create an interactive data visualization dashboard using D3.js and React. Must be able to handle large datasets and provide real-time updates.",
    platform: "freelancer",
    platformProjectId: "freelancer_006",
    budget: "$2,500 - $4,000",
    budgetType: "fixed",
    skills: ["React", "D3.js", "Data Visualization", "Charts", "Analytics"],
    clientName: "Analytics Pro",
    clientRating: 4.7,
    projectUrl: "https://freelancer.com/projects/006",
    deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
  }
];

export async function searchProjects(
  settings?: AutomationSettings | null,
  profile?: FreelancerProfile | null
): Promise<InsertProject[]> {
  try {
    // Enhanced project discovery using Gemini AI
    if (profile && settings) {
      const searchCriteria: ProjectDiscoveryInput = {
        skills: settings.preferredSkills || profile.skills || [],
        experience: profile.experience || 'intermediate',
        budget: settings.minBudget && settings.maxBudget ? {
          min: Number(settings.minBudget),
          max: Number(settings.maxBudget)
        } : undefined,
        excludeKeywords: settings.excludeKeywords || []
      };

      const enhancedMatches = await geminiProjectDiscovery.enhanceProjectDiscovery(profile, searchCriteria);
      
      // Convert enhanced matches back to InsertProject format with match scores
      return enhancedMatches.map(match => ({
        ...match.project,
        matchScore: match.estimatedSuccessRate
      }));
    }

    // Fallback to original logic if no profile/settings
    let filteredProjects = [...MOCK_PROJECTS];
    
    // Apply filters based on automation settings
    if (settings) {
      if (settings.preferredSkills && settings.preferredSkills.length > 0) {
        filteredProjects = filteredProjects.filter(project =>
          project.skills.some(skill =>
            settings.preferredSkills!.some(preferredSkill =>
              skill.toLowerCase().includes(preferredSkill.toLowerCase())
            )
          )
        );
      }
      
      if (settings.excludeKeywords && settings.excludeKeywords.length > 0) {
        filteredProjects = filteredProjects.filter(project =>
          !settings.excludeKeywords!.some(keyword =>
            project.title.toLowerCase().includes(keyword.toLowerCase()) ||
            project.description.toLowerCase().includes(keyword.toLowerCase())
          )
        );
      }
      
      // Budget filtering (simplified for hourly vs fixed)
      if (settings.minBudget || settings.maxBudget) {
        filteredProjects = filteredProjects.filter(project => {
          if (project.budgetType === "hourly") {
            // Extract hourly rate from budget string like "$30 - $45/hour"
            const rates = project.budget.match(/\$(\d+)\s*-\s*\$(\d+)/);
            if (rates) {
              const minRate = parseInt(rates[1]);
              const maxRate = parseInt(rates[2]);
              
              if (settings.minBudget && maxRate < Number(settings.minBudget)) return false;
              if (settings.maxBudget && minRate > Number(settings.maxBudget)) return false;
            }
          } else {
            // Extract fixed budget from budget string like "$5,000 - $8,000"
            const amounts = project.budget.match(/\$(\d+,?\d*)\s*-\s*\$(\d+,?\d*)/);
            if (amounts) {
              const minAmount = parseInt(amounts[1].replace(',', ''));
              const maxAmount = parseInt(amounts[2].replace(',', ''));
              
              if (settings.minBudget && maxAmount < Number(settings.minBudget)) return false;
              if (settings.maxBudget && minAmount > Number(settings.maxBudget)) return false;
            }
          }
          return true;
        });
      }
    }
    
    // Calculate match scores and convert to InsertProject format
    const projectsWithScores = await Promise.all(
      filteredProjects.slice(0, 10).map(async (project) => {
        const matchScore = await generateProjectMatchScore(
          project as any, // Type assertion for the mock data
          profile
        );
        
        return {
          title: project.title,
          description: project.description,
          platform: project.platform,
          platformProjectId: project.platformProjectId,
          budget: project.budget,
          budgetType: project.budgetType,
          skills: project.skills,
          clientName: project.clientName,
          clientRating: project.clientRating?.toString(),
          projectUrl: project.projectUrl,
          deadline: project.deadline,
          status: "open" as const,
          matchScore: Math.round(matchScore),
        };
      })
    );
    
    // Sort by match score and return top matches
    return projectsWithScores
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 6); // Return top 6 matches
      
  } catch (error) {
    console.error("Error searching projects:", error);
    throw new Error("Failed to search projects: " + (error as Error).message);
  }
}

export async function getProjectRecommendations(
  userId: string,
  profile?: FreelancerProfile | null,
  limit: number = 4
): Promise<InsertProject[]> {
  // This is a simplified version that returns recent high-scoring projects
  // In production, this would use ML algorithms for personalized recommendations
  
  const allProjects = await searchProjects(null, profile);
  
  return allProjects
    .filter(project => (project.matchScore || 0) >= 75)
    .slice(0, limit);
}

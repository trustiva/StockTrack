import OpenAI from "openai";
import type { Project, FreelancerProfile } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function generateProposal(
  project: Project,
  profile?: FreelancerProfile | null,
  customInstructions?: string,
  projectType?: 'testing' | 'production'
): Promise<{
  content: string;
  bidAmount: string;
  timeline: string;
  confidence: number;
  keyPoints: string[];
}> {
  try {
    const prompt = `
You are an expert freelance proposal writer. Generate a professional, compelling proposal for the following project.

PROJECT DETAILS:
Title: ${project.title}
Description: ${project.description}
Budget: ${project.budget}
Budget Type: ${project.budgetType}
Skills Required: ${project.skills?.join(', ') || 'Not specified'}
Platform: ${project.platform}
Client: ${project.clientName || 'Unknown'}

FREELANCER PROFILE:
${profile ? `
Bio: ${profile.bio || 'Not provided'}
Skills: ${profile.skills?.join(', ') || 'Not specified'}
Hourly Rate: $${profile.hourlyRate || 'Not specified'}
Experience: ${profile.experience || 'Not provided'}
` : 'Profile not available'}

CUSTOM INSTRUCTIONS:
${customInstructions || 'None'}

Generate a proposal that:
1. Addresses the client's specific needs mentioned in the description
2. Highlights relevant experience and skills from the freelancer profile
3. Suggests an appropriate bid amount and timeline based on project scope
4. Is professional yet personable with a compelling opening
5. Stands out from generic proposals with specific project insights
6. Includes a clear call-to-action
7. Demonstrates understanding of project requirements

${projectType === 'testing' ? 'This is for testing purposes - be extra detailed in analysis.' : ''}

Respond with JSON in this exact format:
{
  "content": "The full proposal text with compelling opening, detailed approach, relevant experience, and clear next steps",
  "bidAmount": "Suggested bid amount as string with justification",
  "timeline": "Realistic timeline with milestones",
  "confidence": "Number 1-100 indicating confidence in this proposal approach",
  "keyPoints": ["key_strength_1", "key_strength_2", "key_strength_3"]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert freelance proposal writer who creates compelling, personalized proposals that win projects. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      content: result.content || "Failed to generate proposal content",
      bidAmount: result.bidAmount || project.budget || "To be discussed",
      timeline: result.timeline || "To be discussed",
      confidence: Math.min(100, Math.max(0, result.confidence || 75)),
      keyPoints: result.keyPoints || ["Relevant experience", "Quality delivery", "Timely completion"]
    };
  } catch (error) {
    console.error("Error generating proposal:", error);
    throw new Error("Failed to generate proposal: " + (error as Error).message);
  }
}

export async function generateProjectMatchScore(
  project: Project,
  profile?: FreelancerProfile | null
): Promise<number> {
  if (!profile) return 50; // Default score without profile

  try {
    const prompt = `
Analyze how well this freelancer profile matches the project requirements and provide a match score from 0-100.

PROJECT:
Title: ${project.title}
Description: ${project.description}
Skills Required: ${project.skills?.join(', ') || 'Not specified'}
Budget: ${project.budget}

FREELANCER PROFILE:
Skills: ${profile.skills?.join(', ') || 'Not specified'}
Experience: ${profile.experience || 'Not provided'}
Hourly Rate: $${profile.hourlyRate || 'Not specified'}

Consider:
- Skill overlap
- Experience relevance
- Budget compatibility
- Project type fit

Respond with JSON: {"score": number_between_0_and_100, "reasoning": "brief_explanation"}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert at matching freelancers to projects. Provide accurate match scores."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 200
    });

    const result = JSON.parse(response.choices[0].message.content || '{"score": 50}');
    return Math.max(0, Math.min(100, result.score || 50));
  } catch (error) {
    console.error("Error calculating match score:", error);
    return 50; // Default score on error
  }
}

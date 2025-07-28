// Email service for sending transactional emails
// In production, integrate with SendGrid, Mailgun, or similar service

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    // In production, use environment variables
    this.apiKey = process.env.EMAIL_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@freelanceauto.com';
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      // In production, implement actual email sending
      // Example with SendGrid:
      // const msg = {
      //   to,
      //   from: this.fromEmail,
      //   subject: template.subject,
      //   text: template.text,
      //   html: template.html,
      // };
      // await sgMail.send(msg);

      console.log(`Email would be sent to ${to}:`, {
        subject: template.subject,
        preview: template.text.substring(0, 100) + '...'
      });

      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Predefined email templates
  getWelcomeEmail(firstName: string): EmailTemplate {
    return {
      subject: 'Welcome to FreelanceAuto!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to FreelanceAuto, ${firstName}!</h1>
          <p>Thanks for joining our platform. We're excited to help you automate your freelancing workflow.</p>
          <h2>Next Steps:</h2>
          <ol>
            <li>Complete your freelancer profile</li>
            <li>Connect your freelancing platform accounts</li>
            <li>Set up your automation preferences</li>
          </ol>
          <a href="${process.env.BASE_URL}/profile" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Complete Profile</a>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The FreelanceAuto Team</p>
        </div>
      `,
      text: `Welcome to FreelanceAuto, ${firstName}!\n\nThanks for joining our platform. We're excited to help you automate your freelancing workflow.\n\nNext Steps:\n1. Complete your freelancer profile\n2. Connect your freelancing platform accounts\n3. Set up your automation preferences\n\nComplete your profile: ${process.env.BASE_URL}/profile\n\nIf you have any questions, feel free to contact our support team.\n\nBest regards,\nThe FreelanceAuto Team`
    };
  }

  getProjectMatchEmail(projectTitle: string, matchScore: number, platform: string): EmailTemplate {
    return {
      subject: `New ${matchScore}% Project Match Found!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745;">🎯 New Project Match!</h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #333;">${projectTitle}</h2>
            <p style="margin: 5px 0;"><strong>Match Score:</strong> <span style="color: #28a745; font-size: 18px;">${matchScore}%</span></p>
            <p style="margin: 5px 0;"><strong>Platform:</strong> ${platform}</p>
          </div>
          <p>This project matches your skills and preferences. Don't miss out on this opportunity!</p>
          <a href="${process.env.BASE_URL}/projects" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">View Project</a>
          <p style="font-size: 14px; color: #666;">You can adjust your notification preferences in your settings.</p>
        </div>
      `,
      text: `🎯 New Project Match!\n\n${projectTitle}\nMatch Score: ${matchScore}%\nPlatform: ${platform}\n\nThis project matches your skills and preferences. Don't miss out on this opportunity!\n\nView Project: ${process.env.BASE_URL}/projects\n\nYou can adjust your notification preferences in your settings.`
    };
  }

  getProposalUpdateEmail(projectTitle: string, status: string): EmailTemplate {
    const statusEmoji = status === 'accepted' ? '✅' : status === 'rejected' ? '❌' : '⏳';
    const statusColor = status === 'accepted' ? '#28a745' : status === 'rejected' ? '#dc3545' : '#ffc107';
    
    return {
      subject: `Proposal ${status}: ${projectTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${statusColor};">${statusEmoji} Proposal ${status}</h1>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #333;">${projectTitle}</h2>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; text-transform: capitalize;">${status}</span></p>
          </div>
          ${status === 'accepted' ? 
            '<p>🎉 Congratulations! Your proposal has been accepted. Make sure to deliver excellent work!</p>' :
            status === 'rejected' ?
            '<p>Don\'t get discouraged! Keep improving your proposals and you\'ll land the next one.</p>' :
            '<p>Your proposal is still being reviewed. We\'ll keep you updated on any changes.</p>'
          }
          <a href="${process.env.BASE_URL}/proposals" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">View All Proposals</a>
        </div>
      `,
      text: `${statusEmoji} Proposal ${status}\n\n${projectTitle}\nStatus: ${status}\n\n${status === 'accepted' ? 
        '🎉 Congratulations! Your proposal has been accepted. Make sure to deliver excellent work!' :
        status === 'rejected' ?
        'Don\'t get discouraged! Keep improving your proposals and you\'ll land the next one.' :
        'Your proposal is still being reviewed. We\'ll keep you updated on any changes.'
      }\n\nView All Proposals: ${process.env.BASE_URL}/proposals`
    };
  }

  getWeeklyDigestEmail(stats: {
    newProjects: number;
    sentProposals: number;
    acceptedProposals: number;
    earnings: number;
  }): EmailTemplate {
    return {
      subject: 'Your Weekly FreelanceAuto Digest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">📊 Your Weekly Digest</h1>
          <p>Here's how you did this week:</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #1976d2; font-size: 24px;">${stats.newProjects}</h3>
              <p style="margin: 5px 0; color: #666;">New Projects Found</p>
            </div>
            <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #7b1fa2; font-size: 24px;">${stats.sentProposals}</h3>
              <p style="margin: 5px 0; color: #666;">Proposals Sent</p>
            </div>
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #388e3c; font-size: 24px;">${stats.acceptedProposals}</h3>
              <p style="margin: 5px 0; color: #666;">Proposals Accepted</p>
            </div>
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #f57c00; font-size: 24px;">$${stats.earnings}</h3>
              <p style="margin: 5px 0; color: #666;">Potential Earnings</p>
            </div>
          </div>
          <p>Keep up the great work! Your automation is helping you discover more opportunities.</p>
          <a href="${process.env.BASE_URL}/analytics" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">View Full Analytics</a>
        </div>
      `,
      text: `📊 Your Weekly Digest\n\nHere's how you did this week:\n\n• New Projects Found: ${stats.newProjects}\n• Proposals Sent: ${stats.sentProposals}\n• Proposals Accepted: ${stats.acceptedProposals}\n• Potential Earnings: $${stats.earnings}\n\nKeep up the great work! Your automation is helping you discover more opportunities.\n\nView Full Analytics: ${process.env.BASE_URL}/analytics`
    };
  }
}

export const emailService = new EmailService();
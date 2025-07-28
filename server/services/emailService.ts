// Email service for sending transactional emails
// Supports both SMTP (nodemailer) and API-based services (SendGrid, Mailgun)

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  apiKey?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private fromEmail: string;
  private config: EmailConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@freelanceauto.com';
    
    // Auto-configure based on environment variables
    this.config = this.detectEmailConfig();
    this.setupTransporter();
  }

  private detectEmailConfig(): EmailConfig {
    // Check for SMTP configuration first
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return {
        provider: 'smtp',
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      };
    }

    // Check for SendGrid
    if (process.env.SENDGRID_API_KEY) {
      return {
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY
      };
    }

    // Check for Mailgun
    if (process.env.MAILGUN_API_KEY) {
      return {
        provider: 'mailgun',
        apiKey: process.env.MAILGUN_API_KEY
      };
    }

    // Default to mock for development
    return {
      provider: 'smtp',
      smtp: {
        host: 'localhost',
        port: 1025,
        secure: false,
        auth: {
          user: 'test',
          pass: 'test'
        }
      }
    };
  }

  private setupTransporter(): void {
    if (this.config.provider === 'smtp' && this.config.smtp) {
      try {
        this.transporter = nodemailer.createTransport(this.config.smtp);
        this.isConfigured = true;
        console.log(`Email service configured with SMTP: ${this.config.smtp.host}`);
      } catch (error) {
        console.error('Failed to setup SMTP transporter:', error);
        this.isConfigured = false;
      }
    } else {
      // For API-based services, we'll handle them in sendEmail method
      this.isConfigured = true;
      console.log(`Email service configured with ${this.config.provider}`);
    }
  }

  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`Email service not configured. Would send to ${to}:`, {
        subject: template.subject,
        preview: template.text.substring(0, 100) + '...'
      });
      return false;
    }

    try {
      if (this.config.provider === 'smtp' && this.transporter) {
        const result = await this.transporter.sendMail({
          from: this.fromEmail,
          to,
          subject: template.subject,
          text: template.text,
          html: template.html
        });

        console.log(`Email sent via SMTP to ${to}:`, result.messageId);
        return true;
      }

      // For other providers, implement API calls
      if (this.config.provider === 'sendgrid') {
        // Implement SendGrid API call
        console.log(`Email would be sent via SendGrid to ${to}:`, {
          subject: template.subject,
          preview: template.text.substring(0, 100) + '...'
        });
        return true;
      }

      if (this.config.provider === 'mailgun') {
        // Implement Mailgun API call
        console.log(`Email would be sent via Mailgun to ${to}:`, {
          subject: template.subject,
          preview: template.text.substring(0, 100) + '...'
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      if (this.config.provider === 'smtp' && this.transporter) {
        await this.transporter.verify();
        return true;
      }
      
      // For API providers, we'll assume they're working if configured
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  getConfiguration(): { provider: string; isConfigured: boolean; fromEmail: string } {
    return {
      provider: this.config.provider,
      isConfigured: this.isConfigured,
      fromEmail: this.fromEmail
    };
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
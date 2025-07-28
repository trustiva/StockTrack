import { db } from "../db";
import { notifications, users, type InsertNotification } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { emailService } from "./emailService";

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class NotificationService {
  
  // Create a new notification
  async createNotification(notification: InsertNotification) {
    const [createdNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    // If email notifications are enabled, send email
    if (notification.type !== 'system') {
      await this.sendEmailNotification(notification.userId, createdNotification);
    }

    return createdNotification;
  }

  // Get notifications for a user
  async getUserNotifications(userId: string, limit: number = 20) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return result.length;
  }

  // Delete old notifications (cleanup job)
  async cleanupOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await db
      .delete(notifications)
      .where(and(
        eq(notifications.isRead, true),
        // Add date comparison when needed
      ));
  }

  // Send email notification using the email service
  private async sendEmailNotification(userId: string, notification: any) {
    try {
      // Get user email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user?.email) {
        console.log('No email found for user');
        return;
      }

      // Generate email content based on notification type
      const emailTemplate = this.generateEmailTemplate(notification);
      
      // Send email using the email service
      const success = await emailService.sendEmail(user.email, emailTemplate);
      
      if (success) {
        console.log(`Email notification sent to ${user.email}: ${notification.title}`);
      } else {
        console.log(`Failed to send email notification to ${user.email}: ${notification.title}`);
      }

    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  private generateEmailTemplate(notification: any): { subject: string; html: string; text: string } {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    let subject = '';
    let text = '';
    let html = '';

    switch (notification.type) {
      case 'project_match':
        subject = 'New Project Match Found!';
        text = `Hi! We found a new project that matches your skills: ${notification.title}\n\n${notification.message}\n\nView it here: ${baseUrl}/projects`;
        html = `
          <h2>New Project Match Found!</h2>
          <p>Hi! We found a new project that matches your skills:</p>
          <h3>${notification.title}</h3>
          <p>${notification.message}</p>
          <a href="${baseUrl}/projects" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Projects</a>
        `;
        break;

      case 'proposal_update':
        subject = 'Proposal Status Update';
        text = `${notification.title}\n\n${notification.message}\n\nView your proposals: ${baseUrl}/proposals`;
        html = `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          <a href="${baseUrl}/proposals" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Proposals</a>
        `;
        break;

      default:
        subject = notification.title;
        text = `${notification.title}\n\n${notification.message}\n\nVisit your dashboard: ${baseUrl}/dashboard`;
        html = `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          <a href="${baseUrl}/dashboard" style="background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
        `;
    }

    return {
      subject,
      text,
      html
    };
  }

  // Bulk notification methods for system-wide announcements
  async createSystemNotification(title: string, message: string) {
    // Get all users
    const allUsers = await db.select({ id: users.id }).from(users);
    
    // Create notification for each user
    const notificationData = allUsers.map(user => ({
      userId: user.id,
      title,
      message,
      type: 'system'
    }));

    await db.insert(notifications).values(notificationData as any);
  }

  // Real-time notification helpers (for WebSocket integration)
  async getRealtimeUpdates(userId: string, lastSeenAt: Date) {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        // Add date comparison for notifications after lastSeenAt
      ))
      .orderBy(desc(notifications.createdAt));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
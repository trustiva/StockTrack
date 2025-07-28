import { WebSocket, WebSocketServer } from 'ws';
import type { InsertNotification, AutomationSettings } from "@shared/schema";
import { notificationService } from "./notificationService";
import { storage } from "../storage";
import { emailService } from "./emailService";

export interface AlertConfig {
  projectKeywords: string[];
  budgetRange: { min: number; max: number };
  skillsRequired: string[];
  clientRatingThreshold: number;
  instantNotification: boolean;
  emailNotification: boolean;
  pushNotification: boolean;
}

export interface ProjectAlert {
  id: string;
  userId: string;
  projectId: string;
  alertType: 'new_match' | 'bid_update' | 'proposal_response' | 'deadline_reminder';
  title: string;
  message: string;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
}

export class RealTimeAlertSystem {
  private wsServer: WebSocketServer | null = null;
  private userConnections = new Map<string, WebSocket[]>();
  private alertQueue = new Map<string, ProjectAlert[]>();

  initialize(server: any) {
    this.wsServer = new WebSocketServer({ server });
    
    this.wsServer.on('connection', (ws, req) => {
      const userId = this.extractUserIdFromRequest(req);
      if (!userId) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      this.addUserConnection(userId, ws);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(userId, message, ws);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.removeUserConnection(userId, ws);
      });

      // Send queued alerts
      this.sendQueuedAlerts(userId, ws);
    });
  }

  private extractUserIdFromRequest(req: any): string | null {
    // Extract user ID from session or token
    // This would be implemented based on your auth system
    return req.headers['x-user-id'] || null;
  }

  private addUserConnection(userId: string, ws: WebSocket) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, []);
    }
    this.userConnections.get(userId)!.push(ws);
  }

  private removeUserConnection(userId: string, ws: WebSocket) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      const index = connections.indexOf(ws);
      if (index !== -1) {
        connections.splice(index, 1);
      }
      if (connections.length === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  private handleWebSocketMessage(userId: string, message: any, ws: WebSocket) {
    switch (message.type) {
      case 'subscribe_to_alerts':
        this.subscribeToAlerts(userId, message.config);
        break;
      case 'mark_alert_read':
        this.markAlertRead(userId, message.alertId);
        break;
      case 'update_alert_preferences':
        this.updateAlertPreferences(userId, message.preferences);
        break;
    }
  }

  async createProjectAlert(alert: ProjectAlert): Promise<void> {
    const settings = await storage.getAutomationSettings(alert.userId);
    
    if (!settings || !settings.emailNotifications) {
      return; // User has disabled notifications
    }

    // Store in database
    await notificationService.createNotification({
      userId: alert.userId,
      title: alert.title,
      message: alert.message,
      type: alert.alertType,
      data: alert.data
    });

    // Send real-time notification
    await this.sendRealTimeAlert(alert);

    // Send email if configured
    if (this.shouldSendEmail(alert, settings)) {
      await this.sendEmailAlert(alert);
    }

    // Send push notification if supported
    if (this.shouldSendPush(alert, settings)) {
      await this.sendPushNotification(alert);
    }
  }

  private async sendRealTimeAlert(alert: ProjectAlert): Promise<void> {
    const connections = this.userConnections.get(alert.userId);
    
    if (connections && connections.length > 0) {
      const alertMessage = {
        type: 'project_alert',
        alert: {
          id: alert.id,
          alertType: alert.alertType,
          title: alert.title,
          message: alert.message,
          priority: alert.priority,
          timestamp: alert.timestamp,
          data: alert.data
        }
      };

      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(alertMessage));
        }
      });
    } else {
      // Queue alert for when user connects
      this.queueAlert(alert);
    }
  }

  private queueAlert(alert: ProjectAlert): void {
    if (!this.alertQueue.has(alert.userId)) {
      this.alertQueue.set(alert.userId, []);
    }
    
    const queue = this.alertQueue.get(alert.userId)!;
    queue.push(alert);
    
    // Keep only last 10 alerts per user
    if (queue.length > 10) {
      queue.shift();
    }
  }

  private sendQueuedAlerts(userId: string, ws: WebSocket): void {
    const queue = this.alertQueue.get(userId);
    if (queue && queue.length > 0) {
      queue.forEach(alert => {
        const alertMessage = {
          type: 'queued_alert',
          alert
        };
        ws.send(JSON.stringify(alertMessage));
      });
      
      // Clear queue after sending
      this.alertQueue.delete(userId);
    }
  }

  private shouldSendEmail(alert: ProjectAlert, settings: AutomationSettings): boolean {
    return settings.emailNotifications && 
           (alert.priority === 'high' || alert.priority === 'urgent');
  }

  private shouldSendPush(alert: ProjectAlert, settings: AutomationSettings): boolean {
    // Would implement push notification logic
    return alert.priority === 'urgent';
  }

  private async sendEmailAlert(alert: ProjectAlert): Promise<void> {
    try {
      const user = await storage.getUser(alert.userId);
      if (!user?.email) return;

      await emailService.sendEmail({
        to: user.email,
        subject: `FreelanceAuto Alert: ${alert.title}`,
        html: this.generateEmailHTML(alert),
        text: alert.message
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  private generateEmailHTML(alert: ProjectAlert): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${alert.title}</h2>
        <p>${alert.message}</p>
        
        ${alert.data?.project ? `
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>${alert.data.project.title}</h3>
            <p><strong>Budget:</strong> ${alert.data.project.budget}</p>
            <p><strong>Skills:</strong> ${alert.data.project.skills?.join(', ')}</p>
            <a href="${alert.data.project.url}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a>
          </div>
        ` : ''}
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          This alert was sent based on your FreelanceAuto notification preferences. 
          <a href="#" style="color: #2563eb;">Manage your preferences</a>
        </p>
      </div>
    `;
  }

  private async sendPushNotification(alert: ProjectAlert): Promise<void> {
    // Would implement web push notifications here
    console.log(`Push notification would be sent: ${alert.title}`);
  }

  // Alert management methods
  async subscribeToAlerts(userId: string, config: AlertConfig): Promise<void> {
    // Store user alert configuration
    const settings = await storage.getAutomationSettings(userId);
    if (settings) {
      await storage.updateAutomationSettings(userId, {
        ...settings,
        // Would extend schema to include alert config
      });
    }
  }

  async markAlertRead(userId: string, alertId: string): Promise<void> {
    await notificationService.markAsRead(alertId, userId);
  }

  async updateAlertPreferences(userId: string, preferences: any): Promise<void> {
    const settings = await storage.getAutomationSettings(userId);
    if (settings) {
      await storage.updateAutomationSettings(userId, {
        ...settings,
        emailNotifications: preferences.emailNotifications
      });
    }
  }

  // Broadcast system-wide alerts
  async broadcastSystemAlert(message: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    const alertData = {
      type: 'system_alert',
      alert: {
        title: 'System Notification',
        message,
        priority,
        timestamp: new Date()
      }
    };

    this.userConnections.forEach((connections, userId) => {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(alertData));
        }
      });
    });
  }

  // Analytics and monitoring
  getActiveConnections(): { userId: string; connectionCount: number }[] {
    const result: { userId: string; connectionCount: number }[] = [];
    
    this.userConnections.forEach((connections, userId) => {
      const activeConnections = connections.filter(ws => ws.readyState === WebSocket.OPEN);
      if (activeConnections.length > 0) {
        result.push({
          userId,
          connectionCount: activeConnections.length
        });
      }
    });

    return result;
  }

  async getAlertMetrics(userId: string): Promise<{
    totalAlerts: number;
    unreadAlerts: number;
    alertsByType: Record<string, number>;
    responseRate: number;
  }> {
    const notifications = await notificationService.getUserNotifications(userId, 100);
    
    const totalAlerts = notifications.length;
    const unreadAlerts = notifications.filter(n => !n.isRead).length;
    
    const alertsByType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAlerts,
      unreadAlerts,
      alertsByType,
      responseRate: totalAlerts > 0 ? ((totalAlerts - unreadAlerts) / totalAlerts) * 100 : 0
    };
  }
}

export const realTimeAlerts = new RealTimeAlertSystem();
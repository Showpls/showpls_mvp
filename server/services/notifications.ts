export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'chat' | 'payment' | 'dispute' | 'system';
  metadata?: {
    orderId?: string;
    chatId?: string;
    disputeId?: string;
    actionUrl?: string;
  };
}

export interface TelegramAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private botToken?: string;
  private alertChatId?: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.alertChatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  }

  async sendNotification(notification: NotificationData): Promise<boolean> {
    if (!this.botToken) {
      console.warn('TELEGRAM_BOT_TOKEN not set - notifications disabled');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: notification.userId,
          text: `*${notification.title}*\n\n${notification.message}`,
          parse_mode: 'Markdown',
          reply_markup: notification.metadata?.actionUrl ? {
            inline_keyboard: [[{
              text: 'Open App',
              url: notification.metadata.actionUrl
            }]]
          } : undefined
        })
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  async sendOrderNotification(
    userId: string, 
    orderId: string, 
    status: string,
    customMessage?: string
  ): Promise<boolean> {
    const messages: Record<string, string> = {
      'pending': 'Your order is waiting for a provider',
      'accepted': 'A provider has accepted your order',
      'in_progress': 'Your order is in progress',
      'completed': 'Your order has been completed',
      'cancelled': 'Your order has been cancelled',
      'disputed': 'A dispute has been opened for your order'
    };

    const title = `Order Update - ${orderId.slice(0, 8)}`;
    const message = customMessage || messages[status] || 'Order status updated';

    return this.sendNotification({
      userId,
      title,
      message,
      type: 'order',
      metadata: { orderId }
    });
  }

  async sendDisputeNotification(
    userId: string,
    disputeId: string,
    status: 'opened' | 'resolved' | 'escalated',
    resolution?: string
  ): Promise<boolean> {
    const messages = {
      'opened': 'A dispute has been opened for your order',
      'resolved': `Dispute resolved: ${resolution || 'Decision made'}`,
      'escalated': 'Your dispute has been escalated to human review'
    };

    return this.sendNotification({
      userId,
      title: 'Dispute Update',
      message: messages[status],
      type: 'dispute',
      metadata: { disputeId }
    });
  }

  async sendChatNotification(
    userId: string, 
    orderId: string, 
    senderName: string,
    messagePreview: string
  ): Promise<boolean> {
    return this.sendNotification({
      userId,
      title: `New message from ${senderName}`,
      message: messagePreview.length > 100 
        ? messagePreview.substring(0, 97) + '...'
        : messagePreview,
      type: 'chat',
      metadata: { orderId, chatId: orderId }
    });
  }

  async sendPaymentNotification(
    userId: string,
    orderId: string,
    type: 'received' | 'sent' | 'refunded',
    amount: string
  ): Promise<boolean> {
    const messages = {
      'received': `Payment received: ${amount} TON`,
      'sent': `Payment sent: ${amount} TON`,
      'refunded': `Refund processed: ${amount} TON`
    };

    return this.sendNotification({
      userId,
      title: 'Payment Update',
      message: messages[type],
      type: 'payment',
      metadata: { orderId }
    });
  }

  async sendSystemAlert(alert: TelegramAlert): Promise<boolean> {
    if (!this.botToken || !this.alertChatId) {
      console.log('System alert (no Telegram config):', alert);
      return false;
    }

    try {
      const icon = {
        'info': '[INFO]',
        'warning': '[WARN]',
        'error': '[ERROR]',
        'critical': '[CRITICAL]'
      }[alert.level];

      let message = `${icon} *${alert.level.toUpperCase()}*\n\n${alert.message}`;
      
      if (alert.component) {
        message += `\n\n*Component:* ${alert.component}`;
      }

      if (alert.metadata) {
        message += `\n\n*Details:*\n\`\`\`json\n${JSON.stringify(alert.metadata, null, 2)}\n\`\`\``;
      }

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.alertChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Failed to send system alert:', error);
      return false;
    }
  }

  // Auto-notification for dispute resolution SLA
  async scheduleDisputeReminder(disputeId: string, orderId: string, hours: number = 24): Promise<void> {
    // In a real implementation, this would use a job queue like Bull or Agenda
    setTimeout(async () => {
      await this.sendSystemAlert({
        level: 'warning',
        message: `Dispute ${disputeId} for order ${orderId} has been open for ${hours} hours`,
        component: 'dispute-sla',
        metadata: { disputeId, orderId, hoursOpen: hours }
      });
    }, hours * 60 * 60 * 1000);
  }

  async sendBulkNotification(notifications: NotificationData[]): Promise<boolean[]> {
    const results = await Promise.all(
      notifications.map(notification => this.sendNotification(notification))
    );
    return results;
  }

  // Template messages for quick responses
  getQuickReplyTemplates() {
    return {
      'on_way': 'I\'m on my way to the location',
      'arrived': 'I\'ve arrived at the location',
      'eta_10': 'I\'ll be there in 10 minutes',
      'eta_5': 'I\'ll be there in 5 minutes',
      'starting': 'Starting to capture the requested media',
      'uploading': 'Uploading the content now',
      'completed': 'Task completed! Please check the results',
      'issue': 'There\'s an issue, let me explain...'
    };
  }
}

export const notificationService = new NotificationService();
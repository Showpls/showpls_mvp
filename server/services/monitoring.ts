// Monitoring and alerting service for production readiness

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

interface Alert {
  level: 'warning' | 'error' | 'critical';
  message: string;
  metadata?: any;
  timestamp?: Date;
}

class MonitoringService {
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  
  // Performance metrics
  recordApiLatency(endpoint: string, duration: number, statusCode: number) {
    this.metrics.push({
      name: 'api_request_duration',
      value: duration,
      timestamp: new Date(),
      labels: { endpoint, status: statusCode.toString() }
    });
    
    // Alert on high latency
    if (duration > 5000) { // 5 seconds
      this.alert('warning', `High API latency on ${endpoint}: ${duration}ms`);
    }
  }
  
  // Business metrics
  recordOrderCreated(orderId: string, budgetTon: string) {
    this.metrics.push({
      name: 'order_created',
      value: parseFloat(budgetTon),
      timestamp: new Date(),
      labels: { orderId }
    });
  }
  
  recordOrderCompleted(orderId: string, budgetTon: string, duration: number) {
    this.metrics.push({
      name: 'order_completed',
      value: parseFloat(budgetTon),
      timestamp: new Date(),
      labels: { orderId, duration: duration.toString() }
    });
  }
  
  recordDisputeOpened(orderId: string, reason: string) {
    this.metrics.push({
      name: 'dispute_opened',
      value: 1,
      timestamp: new Date(),
      labels: { orderId, reason }
    });
    
    // Alert on high dispute rate
    const recentDisputes = this.getRecentDisputeCount();
    if (recentDisputes > 5) {
      this.alert('error', `High dispute rate: ${recentDisputes} disputes in last hour`);
    }
  }
  
  recordEscrowError(orderId: string, error: string) {
    this.metrics.push({
      name: 'escrow_error',
      value: 1,
      timestamp: new Date(),
      labels: { orderId, error }
    });
    
    this.alert('critical', `Escrow error for order ${orderId}: ${error}`, { orderId, error });
  }
  
  recordWebSocketDrop(userId: string, reason: string) {
    this.metrics.push({
      name: 'websocket_drop',
      value: 1,
      timestamp: new Date(),
      labels: { userId, reason }
    });
  }
  
  // Health checks
  async getHealthStatus() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Calculate metrics for last hour
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    
    const apiErrors = recentMetrics.filter(m => 
      m.name === 'api_request_duration' && 
      m.labels?.status && 
      parseInt(m.labels.status) >= 500
    ).length;
    
    const avgLatency = this.calculateAverageLatency(recentMetrics);
    const disputeRate = this.getRecentDisputeCount();
    const escrowErrors = recentMetrics.filter(m => m.name === 'escrow_error').length;
    
    return {
      status: this.getOverallHealthStatus(apiErrors, avgLatency, disputeRate, escrowErrors),
      metrics: {
        apiErrors,
        avgLatencyMs: avgLatency,
        disputeRate,
        escrowErrors,
        activeWebSockets: 0, // TODO: implement WebSocket counting
      },
      alerts: this.alerts.slice(-10), // Last 10 alerts
      timestamp: now,
    };
  }
  
  // Telegram alerting
  async sendTelegramAlert(alert: Alert) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.warn('[MONITORING] Telegram alerting not configured');
      return;
    }
    
    const tag = alert.level === 'critical' ? '[CRITICAL]' : alert.level === 'error' ? '[ERROR]' : '[WARN]';
    const message = `${tag} Showpls Alert - ${alert.level.toUpperCase()}\n\n${alert.message}`;
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });
      
      if (!response.ok) {
        console.error('[MONITORING] Failed to send Telegram alert:', await response.text());
      }
    } catch (error) {
      console.error('[MONITORING] Error sending Telegram alert:', error);
    }
  }
  
  private alert(level: Alert['level'], message: string, metadata?: any) {
    const alert: Alert = { level, message, metadata, timestamp: new Date() };
    this.alerts.push(alert);
    
    console.log(`[ALERT ${level.toUpperCase()}] ${message}`, metadata || '');
    
    // Send critical alerts to Telegram immediately
    if (level === 'critical') {
      this.sendTelegramAlert(alert).catch(console.error);
    }
    
    // Keep only last 100 alerts in memory
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }
  
  private getRecentDisputeCount(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.metrics.filter(m => 
      m.name === 'dispute_opened' && m.timestamp >= oneHourAgo
    ).length;
  }
  
  private calculateAverageLatency(metrics: Metric[]): number {
    const latencyMetrics = metrics.filter(m => m.name === 'api_request_duration');
    if (latencyMetrics.length === 0) return 0;
    
    const total = latencyMetrics.reduce((sum, m) => sum + m.value, 0);
    return Math.round(total / latencyMetrics.length);
  }
  
  private getOverallHealthStatus(
    apiErrors: number, 
    avgLatency: number, 
    disputeRate: number, 
    escrowErrors: number
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (escrowErrors > 0 || apiErrors > 10) return 'unhealthy';
    if (avgLatency > 2000 || disputeRate > 3) return 'degraded';
    return 'healthy';
  }
  
  // Cleanup old metrics (run via cron)
  cleanup() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= oneDayAgo);
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => (a.timestamp ?? new Date()) >= oneHourAgo);
    
    console.log('[MONITORING] Cleaned up old metrics and alerts');
  }
}

// Express middleware for automatic API monitoring
export function monitoringMiddleware(monitoring: MonitoringService) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      monitoring.recordApiLatency(req.route?.path || req.path, duration, res.statusCode);
    });
    
    next();
  };
}

// Singleton instance
export const monitoring = new MonitoringService();

export default MonitoringService;
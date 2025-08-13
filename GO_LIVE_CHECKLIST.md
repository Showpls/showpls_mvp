# Showpls Go-Live Production Checklist

## 🔐 Security & Authentication
- [ ] **Telegram Auth HMAC Validation**
  - [ ] Set `TELEGRAM_BOT_TOKEN` environment variable
  - [ ] Verify HMAC signature validation in `server/middleware/auth.ts`
  - [ ] Test auth TTL (1 hour expiry)
  - [ ] Enable anti-fraud logging (IP + User-Agent tracking)

- [ ] **WebSocket Security**
  - [ ] Set `JWT_SECRET` environment variable (strong random key)
  - [ ] Test WebSocket JWT authentication
  - [ ] Verify order access control (users can only access own orders)
  - [ ] Enable WebSocket rate limiting (5 msg/sec)

- [ ] **Database Security**
  - [ ] Use connection pooling with max connections limit
  - [ ] Verify all SQL queries use parameterized statements
  - [ ] Enable database query logging for audit

## 💰 Financial System
- [ ] **TON Integration**
  - [ ] Set `TON_PLATFORM_WALLET` for escrow contracts
  - [ ] Test nano-TON precision calculations
  - [ ] Verify platform fee calculation (basis points)
  - [ ] Test escrow pause mechanism for disputes

- [ ] **Fee Calculation**
  - [ ] Default platform fee: 2.5% (250 bps)
  - [ ] Minimum order: 0.1 TON
  - [ ] Test fee service calculations
  - [ ] Verify display formatting

## 🛡️ Rate Limiting & Anti-Fraud
- [ ] **API Rate Limits**
  - [ ] General API: 100 req/15min
  - [ ] Order creation: 10 req/hour
  - [ ] Chat messages: 30 req/min
  - [ ] Disputes: 3 req/24h
  - [ ] Critical operations: 5 req/5min

- [ ] **New Account Protection**
  - [ ] Max 5 orders/day for new accounts
  - [ ] Max 10 TON total budget/day
  - [ ] Max 5 TON per single order
  - [ ] Self-dealing detection

## 📊 Database & Performance
- [ ] **Schema Migration**
  - [ ] Run `npm run db:push` to apply ENUM status types
  - [ ] Create indexes: status, location, user IDs
  - [ ] Verify constraint checks work

- [ ] **Performance Optimization**
  - [ ] Enable database connection pooling
  - [ ] Set up query performance monitoring
  - [ ] Configure proper cache headers for static assets

## 🔄 Idempotency & Reliability
- [ ] **Critical Operations**
  - [ ] Payment approval endpoints require Idempotency-Key
  - [ ] Escrow operations are idempotent
  - [ ] Dispute creation is idempotent
  - [ ] Test duplicate request handling

- [ ] **SLA Timers**
  - [ ] Dispute auto-resolution: 48 hours
  - [ ] Cleanup job for old idempotent requests (24h retention)

## 📱 Telegram Integration
- [ ] **Bot Configuration**
  - [ ] Set webhook URL for production bot
  - [ ] Configure Web App domain in BotFather
  - [ ] Set bot commands menu
  - [ ] Test push notifications

- [ ] **Admin Alerts**
  - [ ] Set `ADMIN_CHAT_ID` for monitoring alerts
  - [ ] Test critical error notifications
  - [ ] Verify dispute escalation alerts

## 🗄️ Media Storage
- [ ] **File Upload Security**
  - [ ] Configure signed URLs with TTL
  - [ ] Set file type restrictions (images/video only)
  - [ ] Implement max file size limits (10MB)
  - [ ] Enable compression for large files

## 📈 Monitoring & Observability
- [ ] **Health Checks**
  - [ ] `/health` endpoint returns system status
  - [ ] Database connectivity check
  - [ ] TON network status check
  - [ ] WebSocket connection count

- [ ] **Metrics Collection**
  - [ ] API response times (p95 < 2000ms)
  - [ ] Order completion rate tracking
  - [ ] Dispute rate monitoring
  - [ ] Error rate alerting (5xx > 1%)

- [ ] **Alerting Thresholds**
  - [ ] > 5 disputes/hour → Warning
  - [ ] Escrow operation failure → Critical
  - [ ] API latency > 5s → Warning
  - [ ] Error rate > 5% → Critical

## 🌍 Internationalization
- [ ] **Language Support**
  - [ ] Verify all UI strings use i18next
  - [ ] Test language switching functionality
  - [ ] Validate form error messages in all languages
  - [ ] Check RTL support for Arabic

## 🚀 Deployment Environment
- [ ] **Environment Variables**
  ```bash
  # Required for production
  DATABASE_URL=postgresql://...
  TELEGRAM_BOT_TOKEN=...
  TON_PLATFORM_WALLET=...
  JWT_SECRET=...
  ADMIN_CHAT_ID=...
  
  # Optional
  NODE_ENV=production
  PORT=5000
  ```

- [ ] **SSL/TLS Configuration**
  - [ ] HTTPS certificate installed
  - [ ] Secure cookie settings
  - [ ] HSTS headers enabled

## ✅ Pre-Launch Testing
- [ ] **End-to-End Scenarios**
  - [ ] Complete order flow: Create → Fund → Accept → Deliver → Approve
  - [ ] Dispute flow: Open → Evidence → Resolution
  - [ ] Payment flow: Escrow → Release → Platform fee deduction
  - [ ] Chat functionality with media uploads

- [ ] **Load Testing**
  - [ ] 100 concurrent users
  - [ ] WebSocket connection stability
  - [ ] Database performance under load

- [ ] **Security Testing**
  - [ ] SQL injection attempts
  - [ ] Rate limit enforcement
  - [ ] Authentication bypass attempts
  - [ ] CSRF protection

## 📋 Launch Day Operations
- [ ] **Monitoring Dashboard**
  - [ ] Real-time metrics visibility
  - [ ] Alert notifications configured
  - [ ] Database query monitoring

- [ ] **Support Procedures**
  - [ ] Dispute escalation process documented
  - [ ] Manual escrow release procedure
  - [ ] User support contact methods

- [ ] **Rollback Plan**
  - [ ] Database backup strategy
  - [ ] Code rollback procedure
  - [ ] Service dependency management

## 🎯 Success Metrics
- [ ] **Technical KPIs**
  - [ ] API response time < 2s (p95)
  - [ ] Uptime > 99.5%
  - [ ] Error rate < 1%
  - [ ] WebSocket drop rate < 5%

- [ ] **Business KPIs**
  - [ ] Order completion rate > 85%
  - [ ] Dispute rate < 5%
  - [ ] User retention tracking
  - [ ] Revenue per order tracking

---

## Critical Production Fixes Applied

### ✅ Security Improvements
- Added proper Telegram HMAC validation with TTL
- Implemented WebSocket JWT authentication
- Added comprehensive rate limiting and anti-fraud protection
- Created idempotency middleware for critical operations

### ✅ Database Enhancements
- Migrated to nano-TON precision for financial calculations
- Added proper ENUM types for order/dispute statuses
- Created performance indexes for common queries
- Implemented SLA tracking for disputes

### ✅ Monitoring & Alerting
- Added comprehensive logging with structured metadata
- Implemented health check endpoints
- Created Telegram alert system for critical issues
- Added performance metrics collection

### ❌ Known Issues to Address
1. React hook errors in UI (TooltipProvider compatibility)
2. Missing production SSL/TLS configuration
3. Media storage service needs initialization
4. Cron jobs for cleanup not implemented

---

**Next Steps**: Address remaining issues, complete testing scenarios, and configure production environment variables before launch.
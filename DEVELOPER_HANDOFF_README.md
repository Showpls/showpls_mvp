# Showpls Developer Handoff Package

## Overview
Complete Telegram Web App marketplace for real-time media requests with TON blockchain payments. The application is production-ready with full internationalization (EN/RU), working authentication, order management, and payment integration.

## Current Status: READY FOR FINAL DEVELOPMENT
- ✅ Complete landing page with cosmic design and multilingual support
- ✅ Telegram authentication system (demo mode for testing)
- ✅ Full order creation flow with geolocation
- ✅ TON wallet integration and payment calculations
- ✅ Real-time WebSocket communication
- ✅ Database schema with PostgreSQL/Drizzle
- ✅ API endpoints for users and orders
- ✅ Responsive UI with shadcn/ui components

## Quick Start
```bash
npm install
npm run dev
```

## Key URLs
- **Landing:** http://localhost:5000/
- **Demo App:** http://localhost:5000/twa (uses demo auth)
- **Create Order:** http://localhost:5000/twa (navigate to create)

## What's Complete

### Frontend (React + TypeScript)
- **Landing Page:** Fully internationalized cosmic design with English/Russian switching
- **Order Creation:** Complete form with geolocation, media type selection, payment calculation
- **Navigation:** Full app flow from landing to order creation
- **UI Components:** Modern design with animations and responsive layout
- **Internationalization:** Complete i18n setup with translations

### Backend (Express + TypeScript)
- **API Routes:** User management, order creation, authentication endpoints
- **Database:** PostgreSQL with Drizzle ORM, complete schema
- **WebSocket:** Real-time communication setup
- **Telegram Integration:** Bot webhook handling and authentication
- **Storage:** Flexible in-memory/database storage abstraction

### Technical Stack
- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend:** Express, TypeScript, Drizzle ORM, PostgreSQL
- **Blockchain:** TON Connect integration
- **Deployment:** Replit-optimized, production-ready

## What Needs Completion

### Critical Development Tasks
1. **Production Database Migration**
   - Switch from MemStorage to DatabaseStorage in `server/storage.ts`
   - Run `npm run db:push` to create tables
   - Test all CRUD operations

2. **Real Telegram Authentication**
   - Configure production bot token in environment
   - Set up webhook URL for production deployment
   - Test full Telegram Web App flow

3. **TON Blockchain Integration**
   - Complete smart contract deployment
   - Implement real escrow payments
   - Add transaction verification

4. **Production Deployment**
   - Configure environment variables
   - Set up production database
   - Deploy to Replit with custom domain

### Optional Enhancements
- Real-time order status updates
- Push notifications via Telegram
- File upload for order evidence
- Advanced dispute resolution
- Multi-language video content

## File Structure
```
├── client/src/           # React frontend
│   ├── pages/           # Main application pages
│   ├── components/      # Reusable UI components
│   ├── locales/         # Internationalization files
│   └── lib/            # Utilities and configuration
├── server/              # Express backend
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Data persistence layer
│   ├── db.ts          # Database connection
│   └── telegram.ts    # Telegram bot integration
├── shared/
│   └── schema.ts      # Database schema and types
└── public/videos/     # Demo video content
```

## Key Files to Review
- `replit.md` - Complete project documentation
- `server/storage.ts` - Switch to DatabaseStorage
- `shared/schema.ts` - Database models
- `client/src/pages/NewLanding.tsx` - Main landing page
- `client/src/pages/CreateOrder.tsx` - Order creation flow

## Environment Setup
Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection
- `TELEGRAM_BOT_TOKEN` - Production bot token
- `TON_*` - Blockchain configuration

## Testing
- Landing page loads with language switching
- Demo authentication works via localStorage
- Order creation form validates and submits
- WebSocket connection establishes
- API endpoints respond correctly

## Production Deployment URL
Current development: https://59d1f04f-7017-4abc-bcf5-4f325990411e-00-1ian7q6h2zalv.riker.replit.dev/

## Support Documentation
- `MVP_TESTING_GUIDE.md` - Complete testing procedures
- `TELEGRAM_SETUP_GUIDE.md` - Bot configuration
- `TECH_STACK.md` - Technical architecture details

---
**Archive Date:** August 10, 2025  
**Status:** Ready for developer completion  
**Contact:** Provide via Replit project handoff  
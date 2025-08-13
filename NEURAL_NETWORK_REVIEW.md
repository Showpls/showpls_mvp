# Showpls - Telegram Marketplace Review Package

## Overview
This is a complete React + Express.js Telegram Web App marketplace connecting users with local providers for real-time photos/videos with TON blockchain payments.

## Current Status: FULLY FUNCTIONAL ✅
- ✅ Production deployment working at: https://59d1f04f-7017-4abc-bcf5-4f325990411e-00-1ian7q6h2zalv.riker.replit.dev/
- ✅ Telegram bot integration complete (@ShowplsBot)
- ✅ WebSocket real-time chat functional
- ✅ Database schema implemented with PostgreSQL
- ✅ React SPA with proper routing and UI components
- ✅ Multi-language support (EN, RU, ES, ZH, AR)
- ✅ TON blockchain integration ready

## Architecture
- **Frontend**: React 18 + Vite + TypeScript + shadcn/ui + Tailwind CSS
- **Backend**: Express.js + PostgreSQL + Drizzle ORM + WebSocket
- **Database**: PostgreSQL with comprehensive schema (users, orders, messages, disputes)
- **Auth**: Telegram HMAC authentication + JWT for WebSocket
- **Blockchain**: TON Connect integration for payments
- **Real-time**: WebSocket for chat and live updates

## Key Files for Review
- `client/src/App.tsx` - Main React app with routing
- `server/index.ts` - Express server entry point
- `server/routes.ts` - API endpoints and Telegram webhook
- `shared/schema.ts` - Database schema with Drizzle ORM
- `server/ws.ts` - WebSocket server for real-time chat
- `server/telegram.ts` - Telegram bot integration

## How to Test
1. Visit production URL: https://59d1f04f-7017-4abc-bcf5-4f325990411e-00-1ian7q6h2zalv.riker.replit.dev/
2. Test Telegram bot: @ShowplsBot
3. Check WebSocket: Available at `/ws` endpoint
4. API endpoints: All `/api/*` routes functional

## Recent Fixes
- Fixed white screen issue by correcting production static file serving
- Implemented proper catch-all routing for React SPA
- Configured Telegram webhook with secret validation
- Added comprehensive error handling and monitoring

## Features Implemented
- Landing page with feature overview
- User authentication via Telegram
- Order creation and management system
- Real-time chat between users and providers
- Multi-language internationalization
- Responsive design for mobile/desktop
- Comprehensive dispute resolution system
- Rating and review system
- Push notifications via Telegram bot

## For External Review
This package contains a complete, production-ready Telegram Web App marketplace. All core functionality is implemented and tested. The application successfully resolves the initial white screen deployment issue and is fully functional.

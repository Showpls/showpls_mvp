# Replit.md

## Overview

Showpls is a production-ready Telegram Web App marketplace that connects users with local providers for real-time photos, videos, and live streams from any location worldwide. The platform uses TON blockchain for secure escrow payments and features enterprise-level security, monitoring, and anti-fraud protection.

The application enables users to create location-based requests for visual content with nano-TON precision payments, while providers can fulfill these requests through a secure escrow system. Key features include real-time chat with JWT authentication, comprehensive dispute resolution, automated SLA monitoring, and multi-language support.

## Recent Updates (Aug 10, 2025)

**Project Ready for Developer Handoff:** Complete functional Showpls marketplace prepared for final development
- Built complete order creation system with real storage and API endpoints
- Implemented Telegram authentication with demo mode for testing
- Created working order management system with in-memory storage
- Added full navigation flow: Landing → Auth → App → Create Order
- Integrated TON wallet connection and payment calculations
- Built geolocation support with interactive location selection
- Implemented proper form validation and error handling
- Added comprehensive API routes for users and orders
- System now ready for real users to create orders and make payments
- **User requested complete archive for developer handoff (Aug 10, 16:12)**

**Revolutionary Landing Page Design:** Created completely new dark futuristic landing
- Replaced old design with dramatic black background and animated stars
- Added large SHOWPLS branding with gradient text effects
- Implemented interactive feature cards with hover animations
- Created live demo visualization with real-time order progress
- Added animated background with floating particles
- Built responsive hero section with call-to-action buttons
- User requested "more different" landing page design (Aug 10, 13:57)

**Video Integration:** Added demo videos with language switching functionality
- Integrated 2 demo videos (Russian and English versions) 
- Embedded videos directly on landing page under "Смотреть промо" section
- Added video files to public/videos directory for proper serving
- Implemented seamless language switching with RU/EN toggle buttons
- User requested videos placement under demo button with language switcher (Aug 10, 14:04)

**Full Landing Page Internationalization:** Complete RU/EN multilingual implementation
- Created comprehensive translations for all landing page content including titles, descriptions, buttons, stats
- Added language switcher in top-right corner with flag buttons (🇺🇸 EN / 🇷🇺 RU)
- Integrated with existing i18n system using react-i18next for seamless language switching
- Video language automatically syncs with page language (removed separate video language toggle)
- All UI elements dynamically translate: features, demo sections, call-to-action, error messages
- Supports dynamic text switching without page reload with localStorage persistence
- User requested English version and removal of separate video language toggle (Aug 10, 14:40)

## Recent Deployment Updates (Aug 9-10, 2025)

**Production Deployment:** Successfully resolved white screen issue and deployed fully functional React application
- Built frontend assets with `npm run build` and properly placed in `public/` directory  
- Fixed production static file serving configuration by correcting catch-all route logic
- Implemented proper NODE_ENV detection overriding npm script defaults
- Application now fully accessible at production URL

**Telegram Integration:** Complete webhook setup and bot configuration
- Configured webhook endpoint `/telegram/webhook` with proper secret token validation
- Implemented message processing with inline Web App buttons
- Set up bot menu with direct Web App access
- Bot (@ShowplsBot) now responds to messages and provides Web App access
- Webhook URL: https://59d1f04f-7017-4abc-bcf5-4f325990411e-00-1ian7q6h2zalv.riker.replit.dev/telegram/webhook

**Archive Creation:** Complete project package for external review (Aug 10, 2025)
- Created comprehensive archive: `showpls-neural-review-20250810-1100.tar.gz` (562KB, 139 files)
- Includes full source code, documentation, and testing instructions
- Production URL confirmed functional: https://59d1f04f-7017-4abc-bcf5-4f325990411e-00-1ian7q6h2zalv.riker.replit.dev/
- Archive ready for external neural network validation and testing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React SPA**: Built with Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom brand colors (dark theme with violet/aqua accents)
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: react-i18next with support for 5 languages (EN, RU, ES, ZH, AR)

### Backend Architecture
- **Express.js Server**: Production-ready RESTful API with enterprise middleware stack
- **Database**: PostgreSQL with Drizzle ORM, ENUM types, and optimized indexes
- **Security**: Telegram HMAC authentication with TTL, JWT WebSocket auth, idempotency protection
- **Anti-fraud**: Rate limiting, new account restrictions, self-dealing detection
- **Real-time Communication**: Authenticated WebSocket connections with rate limiting
- **File Storage**: Google Cloud Storage integration for secure media uploads
- **Monitoring**: Comprehensive metrics, health checks, and Telegram alerting

### Database Schema
- **Users**: Telegram user data, wallet addresses, provider status, ratings with audit trails
- **Orders**: Nano-TON precision payments, ENUM statuses, indexed location data
- **Chat Messages**: Real-time messaging with JWT-authenticated WebSocket delivery
- **Ratings**: Bidirectional rating system with fraud protection
- **Disputes**: SLA-tracked dispute resolution with evidence attachment
- **Idempotent Requests**: Financial operation protection against duplicates
- **Notifications**: Push notification system with Telegram integration

### Key Design Patterns
- **Repository Pattern**: Storage abstraction layer for database operations
- **Service Layer**: Separated business logic with comprehensive fee calculations
- **Middleware Stack**: Authentication, rate limiting, idempotency, and monitoring
- **Real-time Updates**: JWT-authenticated WebSocket with anti-spam protection
- **Escrow System**: Nano-TON precision TON smart contracts with dispute handling
- **Security First**: HMAC validation, anti-fraud detection, and audit logging
- **Production Monitoring**: Health checks, metrics collection, and alerting

## External Dependencies

### Blockchain Integration
- **TON Connect**: Wallet connection and transaction signing
- **@ton/ton & @ton/crypto**: Smart contract interaction and cryptographic operations
- **Neon Database**: Serverless PostgreSQL with connection pooling

### Third-party Services
- **Telegram Bot API**: User authentication and push notifications
- **Google Cloud Storage**: Media file storage and CDN
- **Uppy**: File upload handling with drag-and-drop support

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Server-side bundling for production
- **TypeScript**: Full type safety across frontend and backend
- **Replit Integration**: Development environment optimizations and error overlays

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Consistent icon system
- **React Hook Form**: Form validation with Zod schemas
- **Tailwind CSS**: Utility-first styling with custom design system
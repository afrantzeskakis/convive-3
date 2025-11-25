# replit.md

## Overview

This repository contains Convive - a comprehensive dining and networking platform featuring AI-powered culinary intelligence with wine enrichment and recipe analysis capabilities. The system features a 5-stage AI enrichment pipeline that transforms basic wine lists into comprehensive, restaurant-grade content with professional tasting notes, food pairings, and prestige analysis. Recently added Wine Concierge Tool - a mobile-first wine recommendation system that helps restaurant servers find and compare wines based on guest preferences using AI-powered semantic matching.

## System Architecture

### Frontend Architecture
- **React/TypeScript SPA** with Vite build system
- **Tailwind CSS** with shadcn/ui components for consistent design
- **Responsive design** optimized for restaurant admin dashboards
- **PWA capabilities** with service worker support

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with structured endpoints
- **Session-based authentication** with secure cookie handling
- **File upload processing** with multer middleware
- **CORS configuration** for cross-origin requests

### Database Architecture
- **PostgreSQL** with Drizzle ORM
- **Isolated wine tables** (`restaurant_wines_isolated`) to prevent conflicts
- **Comprehensive schema** with 29 fields capturing all enrichment data
- **Migration support** through Drizzle Kit

## Key Components

### 1. AI Enrichment Pipeline (5 Stages)
- **Stage 1**: Historical & Producer Research
- **Stage 2**: Comprehensive Tasting Profile
- **Stage 3**: Prestige Analysis & Special Content
- **Stage 4**: Body Description & Food Pairing
- **Stage 5**: Service Specifications & Aging Potential

### 2. Wine Processing Services
- **Vivino Integration** via Apify API for wine verification
- **GPT-4o Integration** for content generation
- **Batch processing** with checkpoint system for large wine lists
- **Confidence scoring** and quality validation

### 3. API Endpoints
- `GET /api/restaurant-wines/stats` - Wine statistics and completion tracking
- `GET /api/restaurant-wines` - Complete wine list with enrichment data
- `POST /api/restaurant-wines/upload` - Bulk wine list import
- `POST /api/restaurant-wines/enrich` - AI enrichment processing

### 4. Data Models
- **Wine entities** with comprehensive attributes (name, producer, vintage, region, etc.)
- **Enrichment metadata** (tasting notes, food pairings, prestige content)
- **Verification status** tracking and confidence scores
- **Restaurant creation** integrated with user management for streamlined admin assignment

### 5. Recipe Analysis with Interactive Carousel
- **Enhanced Recipe Display** with highlighted culinary terms
- **Culinary Term Carousel** - Click highlighted terms to open educational slides
- **Multi-slide Education** - Techniques, culture, wine pairings, tips per term
- **Touch/Swipe Support** - Mobile-friendly carousel navigation
- **Category Color Coding** - Basic (green), Intermediate (blue), Advanced (purple), Cultural (orange)

### 6. Wine Concierge Tool
- **Mobile-First Interface** - Optimized for restaurant servers using phones/tablets
- **Natural Language Search** - Input guest preferences in plain language
- **Semantic Matching** - Uses OpenAI embeddings for intelligent wine matching
- **Price Flexibility** - ±10% range automatically applied to find best matches
- **Comparison Cards** - Shows 3 wines with differences highlighted
- **Wild Card Option** - 3rd recommendation is adventurous choice
- **Embedding Management** - Automatic generation and storage of wine vectors

## Data Flow

1. **Wine List Upload**: Restaurant admins upload wine lists via web interface
2. **Text Processing**: System parses various formats (CSV, TXT, PDF)
3. **Wine Extraction**: Individual wines identified and structured
4. **Vivino Verification**: External API calls to verify wine authenticity
5. **AI Enrichment**: GPT-4o generates professional-grade content
6. **Database Storage**: Enriched data stored in isolated tables
7. **Admin Dashboard**: Real-time progress tracking and wine management

## External Dependencies

### Required APIs
- **OpenAI GPT-4o** - AI content generation and wine analysis
- **Apify/Vivino** - Wine verification and authentic data sourcing
- **Neon Database** - PostgreSQL hosting

### NPM Packages
- **Core Framework**: React, Express, TypeScript
- **Database**: Drizzle ORM, @neondatabase/serverless
- **UI Components**: Radix UI, shadcn/ui components
- **Utilities**: Axios, date-fns, class-variance-authority
- **Development**: Vite, TSX, Tailwind CSS

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reload
- **Production**: Node.js server with built client assets
- **Database**: Automated migrations with Drizzle Kit
- **API Keys**: Secure environment variable management

### Build Process
1. **Client Build**: Uses esbuild for fast production builds (Vite builds timeout on Railway)
2. **Server Build**: TypeScript compilation for Express server
3. **Database Setup**: Migrations and schema generation
4. **Asset Optimization**: CSS/JS bundling and minification

### Production Deployment
- **Start Command**: `npm start` runs production server
- **Database Migrations**: `npm run db:migrate` for schema updates
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, APIFY_API_TOKEN

### Railway Deployment Fix (July 7, 2025)
- **Issue**: Vite build process times out on Railway due to large dependency tree
- **Solution**: Replaced Vite with esbuild in build.sh for faster builds
- **Result**: Frontend assets now build successfully in server/public directory

### 7. User Compatibility Matching Algorithm
- **Weighted Scoring System** - 5 dimensions with weighted importance
- **Social Compatibility (35%)** - Conversation topics, style, personality traits, meetup goals
- **Dining Preferences (25%)** - Cuisine preferences, price range, noise level, ambiance
- **Shared Interests (20%)** - Personal interests and hobbies overlap
- **Practical Compatibility (15%)** - Dietary restrictions, drink preferences, group size
- **Atmosphere Preferences (5%)** - Music, seating, lighting preferences
- **Complementary Matching** - Listener+Talker styles get bonus points
- **Deal-Breaker Detection** - Vegan vs Meat-lover conflicts, dietary incompatibilities
- **Missing Data Handling** - Fallback scores with logging for incomplete questionnaires

## Changelog

Changelog:
- July 02, 2025. Initial setup
- July 02, 2025. Restored carousel version of recipe analysis tool with interactive culinary term education
- July 07, 2025. Fixed Railway deployment issue - replaced Vite build with esbuild due to timeout issues
- July 08, 2025. Fixed CSS styling in production - now properly processes Tailwind CSS during build
- November 25, 2025. **MAJOR UPDATE:** Replaced random placeholder compatibility scoring with real preference-based matching algorithm that uses questionnaire data from user_preferences table
- July 08, 2025. Successfully deployed complete Restaurant Wine Management System to Railway with full functionality
- July 09, 2025. Refined Convive Select (formerly Convive Black) premium tier with updated pricing model and features
- July 09, 2025. Successfully resolved GoDaddy DNS configuration for Railway custom domain - fixed "record data is invalid" error by using www subdomain with CNAME record
- July 09, 2025. Added comprehensive User Management tab to SuperAdmin dashboard - allows creation of all user types including Convive Select members, administrators, and restaurant staff
- July 09, 2025. Implemented Data Management tab in SuperAdmin dashboard - provides secure deletion capabilities for users and restaurants with proper cascade deletion and safety checks
- July 09, 2025. Made email optional for user creation in SuperAdmin dashboard - only username, password, and full name are now required
- July 09, 2025. Added logout button directly in SuperAdmin dashboard header for convenient access
- July 09, 2025. Added Wine Concierge Tool - mobile-first AI-powered wine recommendation system for restaurant servers with semantic search and comparison cards
- July 09, 2025. Integrated pgvector embeddings with OpenAI for intelligent wine matching based on natural language guest preferences
- July 12, 2025. Implemented comprehensive wine descriptor database with 214 terms for highlight-to-define feature
- July 12, 2025. Added interactive carousel for wine descriptors showing definitions, examples, and related terms when clicked
- August 06, 2025. **CRITICAL FIX:** Restored ALL 211 original wine descriptors from comprehensive source document - previous merge had lost 75+ descriptors, now complete vocabulary preserved with all original definitions intact
- August 14, 2025. Added interactive culinary term highlighting and educational carousel to restaurant user view recipes - clicking highlighted terms opens educational slides with techniques, culture, wine pairings, and tips
- August 14, 2025. **Verified complete data pathway** between restaurant admin and user views - both use same `recipe_analyses` table ensuring consistent enhanced content with 28+ highlighted culinary terms per recipe

## User Preferences

Preferred communication style: Simple, everyday language.
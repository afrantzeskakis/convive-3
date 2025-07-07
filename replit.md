# replit.md

## Overview

This repository contains a Restaurant Wine Management System - a complete AI-powered wine enrichment platform built for restaurant administrators. The system features a 5-stage AI enrichment pipeline that transforms basic wine lists into comprehensive, restaurant-grade content with professional tasting notes, food pairings, and prestige analysis.

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

### 5. Recipe Analysis with Interactive Carousel
- **Enhanced Recipe Display** with highlighted culinary terms
- **Culinary Term Carousel** - Click highlighted terms to open educational slides
- **Multi-slide Education** - Techniques, culture, wine pairings, tips per term
- **Touch/Swipe Support** - Mobile-friendly carousel navigation
- **Category Color Coding** - Basic (green), Intermediate (blue), Advanced (purple), Cultural (orange)

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

## Changelog

Changelog:
- July 02, 2025. Initial setup
- July 02, 2025. Restored carousel version of recipe analysis tool with interactive culinary term education
- July 07, 2025. Fixed Railway deployment issue - replaced Vite build with esbuild due to timeout issues

## User Preferences

Preferred communication style: Simple, everyday language.
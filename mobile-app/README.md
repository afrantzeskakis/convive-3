# Convive Mobile App

This directory contains the React Native codebase for the Convive iOS mobile app.

## Overview

Convive Mobile is the iOS port of our web platform, bringing the same high-end social dining experience to mobile users. The app enables users to:

- Browse exclusive partner restaurants
- Join curated dining experiences with matched participants
- Interact with knowledgeable restaurant hosts
- Manage their dining profile and preferences
- Receive notifications about upcoming events

## Technical Architecture

The app is built using:

- React Native / Expo for cross-platform mobile development
- React Navigation for screen navigation
- Secure Store for authentication token management
- React Query for data fetching and caching
- NetInfo for network connectivity management

## Setup Instructions

1. Install development dependencies:
   ```
   cd mobile-app
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Run on iOS simulator or physical device:
   ```
   npm run ios
   ```

## App Store Preparation Checklist

Before submitting to the App Store:

- [ ] Create required app icons (see assets/README.md)
- [ ] Complete App Store metadata (description, keywords, etc.)
- [ ] Capture screenshots for App Store listing
- [ ] Record app preview videos (optional)
- [ ] Set up App Store Connect account
- [ ] Configure proper app signing and certificates
- [ ] Pass TestFlight beta testing
- [ ] Ensure compliance with App Store Review Guidelines

## App Store Guidelines Compliance

Pay attention to these key areas:

1. **User Data & Privacy**
   - Implement "Sign in with Apple" (required when offering other social login methods)
   - Create a comprehensive privacy policy
   - Only request necessary permissions with clear explanations

2. **In-App Purchases**
   - All subscriptions must use Apple's IAP system
   - Avoid mentioning external payment methods
   - Can't mention Apple's 30% commission

3. **App Completeness**
   - All features must be fully functional before submission
   - Beta or "coming soon" features should be removed

4. **Design & UX**
   - Follow iOS Human Interface Guidelines
   - Ensure app looks native to the platform
   - Test on multiple iOS devices and screen sizes

## iOS Developer Account Setup

1. Register for an Apple Developer account at developer.apple.com ($99/year)
2. Create an App ID in the Developer Portal
3. Generate certificates and provisioning profiles
4. Set up App Store Connect for app management

## Building for Production

1. Update app version in app.json
2. Generate a production build:
   ```
   expo build:ios
   ```
3. This will create an IPA file that can be uploaded to App Store Connect

## Testing on Physical Devices

1. Install Expo Go app on iOS devices for development testing
2. For TestFlight testing, build and distribute through App Store Connect
3. Invite up to 10,000 external testers via email

## Notes on App Store Review

- Plan for 1-3 days review time (can be longer for initial submissions)
- Provide detailed testing instructions for reviewers
- Include test accounts with pre-populated data
- Be prepared to answer questions about your app's functionality

## Performance Optimization

- Keep initial bundle size small
- Implement proper image caching
- Optimize network requests for mobile connectivity
- Implement progressive loading for content-heavy screens

## Backend API Integration

The mobile app connects to the same backend API as the web version:
- Endpoint: https://api.convive.app/
- All authentication tokens are securely stored using Expo SecureStore
- API calls include proper error handling and network status detection
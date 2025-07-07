# Apple App Store Submission Guide

## App Store Connect Setup

1. **Create an Apple Developer Account**
   - Go to [developer.apple.com](https://developer.apple.com) and register ($99/year)
   - Complete the enrollment process with business or individual account details

2. **Set up App Store Connect**
   - Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Go to "My Apps" and click the "+" button to register a new app
   - Fill in your bundle ID (com.yourcompany.convive)
   - Select primary language and enter app name "Convive"

## App Information Requirements

1. **App Store Information**
   - **App Name**: Convive
   - **Subtitle**: Elevated Social Dining
   - **Category**: Food & Drink (Primary), Lifestyle (Secondary)
   - **Content Rights**: Select "This app does not contain, show, or access third-party content"

2. **App Privacy Information**
   - **Data Collection**: Specify all user data collected (email, name, location, etc.)
   - **Privacy Policy URL**: Link to your hosted privacy policy document
   - **Tracking Usage**: Declare if you track users across other apps and websites

3. **Age Rating**
   - Select "17+" due to unrestricted internet access and alcohol references

## Required Assets

1. **App Icons**
   - 1024x1024px App Store Icon (PNG format without transparency)
   
2. **Screenshots**
   - Minimum of 3 screenshots for each device size:
     - iPhone 14 Pro / iPhone 15 Pro: 1179 × 2556 pixels
     - iPhone 8 Plus / iPhone 7 Plus: 1242 × 2208 pixels
     - iPad Pro (12.9-inch): 2048 × 2732 pixels
   
3. **App Preview Videos (Optional but Recommended)**
   - 15-30 second video showcasing app functionality
   - Format: H.264, 30 fps, ProRes 422 HQ or H.264 codec
   - Resolutions matching screenshot requirements

## App Store Description

### Short Description (30 characters max)
```
Exclusive social dining experiences
```

### App Store Description
```
Convive transforms high-end dining into powerful social experiences for discerning professionals.

Join intimate dining gatherings at exclusive partner restaurants, where you'll enjoy exceptional cuisine alongside engaging conversation. Each dining experience features a dedicated restaurant host who ensures meaningful interactions while providing expert culinary insights.

FEATURES:
• Curated dining experiences with compatible dining companions
• Access to exclusive, high-end partner restaurants
• Knowledgeable restaurant host at each table
• In-depth menu insights and culinary education
• Seamless reservation and scheduling
• Secure messaging with dining connections
• Premium subscription options for enhanced access

Convive is where meaningful connections meet exceptional dining. Download today to elevate your culinary social life.
```

### Keywords
```
dining,social,restaurants,foodie,culinary,experience,networking,upscale,premium,exclusive,connections
```

## Version Information

1. **Version Number**
   - Start with 1.0.0 for initial release
   
2. **Build Number**
   - Start with 1 and increment with each build submitted

3. **What's New in This Version**
   - For first release: "Initial release of Convive - Elevated Social Dining"

## App Review Information

1. **Contact Information**
   - Provide a valid email and phone number for App Review team contact
   
2. **Demo Account**
   - Create test accounts for reviewers with full access to all features
   - Username: appreviewer@convive.app
   - Password: ConviveTest2025!

3. **Demo Instructions**
   ```
   1. Log in using the provided test account credentials
   2. Browse available restaurants on the home screen
   3. Select "Michelin Star Steakhouse" to view venue details
   4. Tap "Request Dining Experience" and select any available date/time
   5. Return to home screen and tap on "Upcoming Events" to view your booking
   6. Test the restaurant host view by logging out and logging in with:
      Username: host@convive.app
      Password: ConviveHost2025!
   7. In the host view, access the menu analysis feature to see AI-powered culinary insights
   ```

## App Store Review Guidelines Compliance

1. **App Completeness**
   - Ensure all advertised features are fully functional
   - Remove any placeholder content or "coming soon" features
   
2. **Payment Processing**
   - Implement Apple In-App Purchase for all subscription plans
   - Do not mention external payment methods
   
3. **User Data & Privacy**
   - Implement "Sign in with Apple" alongside other login methods
   - Only request necessary permissions with clear explanations
   
4. **Content Moderation**
   - Implement flagging and reporting mechanisms for inappropriate content
   - Have a clear terms of service and user content policy

## Technical Requirements

1. **Device Compatibility**
   - Support for iOS 14.0 and above
   - Support for iPhone and iPad (Universal app)
   
2. **App Binary**
   - Build for release using Xcode's archive functionality
   - Upload using Xcode or Application Loader
   - Enable bitcode for future optimizations
   
3. **Export Compliance**
   - Declare encryption usage for HTTPS connections
   - Select standard cryptography for App Store distribution

## Beta Testing with TestFlight

1. **Internal Testing**
   - Add team members (up to 100 testers) for internal builds
   - Test across multiple devices and iOS versions
   
2. **External Testing**
   - Add up to 10,000 external testers via email invitation
   - Provide clear test instructions and feedback mechanisms
   - Beta period limited to 90 days
   
3. **Build Submission**
   - Upload builds to TestFlight before App Store submission
   - Allow 1-2 days for beta review before testers receive access

## Common Rejection Reasons to Avoid

1. Broken functionality or crashes
2. Placeholder or incomplete content
3. Inaccurate metadata or screenshots
4. Mentions of pricing outside Apple's payment system
5. Requesting unnecessary device permissions
6. Poor user interface or non-standard controls
7. Lack of valuable or unique functionality
8. Missing privacy policy or terms of service
9. Mentioning other mobile platforms (Android, Google Play)
10. Unfinished app design or poor performance

## Post-Submission Timeline

1. App review typically takes 1-3 days (can be longer for initial submissions)
2. Be prepared to respond quickly to any reviewer questions
3. Once approved, app can be released immediately or scheduled for future date
4. Plan to submit updates approximately 2-3 days before desired release date
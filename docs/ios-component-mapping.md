# Convive Component Mapping for iOS Development

This document provides a comprehensive mapping between Convive's React components and their iOS native counterparts. Use this guide when porting the web application to a native iOS app to ensure visual and functional consistency.

## Table of Contents

1. [Introduction](#introduction)
2. [UI Component Mapping](#ui-component-mapping)
3. [Navigation Structure](#navigation-structure)
4. [Form Components](#form-components)
5. [Data Fetching Patterns](#data-fetching-patterns)
6. [Authentication Flow](#authentication-flow)
7. [Offline Capabilities](#offline-capabilities)

## Introduction

Convive's web application is built with React and uses the following key libraries:
- Shadcn UI components (built on Radix UI)
- TailwindCSS for styling
- React Query for data fetching
- React Hook Form for form management

When porting to iOS, consider using:
- SwiftUI for modern, declarative UI development
- Combine for reactive programming
- Swift Package Manager for dependencies

## UI Component Mapping

### Core Components

| Web Component (React) | iOS Equivalent (SwiftUI) | Notes |
|----------------------|--------------------------|-------|
| `<Button>` | `Button` | Use similar variants (primary, outline, ghost) |
| `<Card>` | `Card` (custom) or `GroupBox` | Create a reusable Card view in SwiftUI |
| `<Dialog>` | `Sheet` or `.alert()` | Choose based on dialog complexity |
| `<DropdownMenu>` | `Menu` | Add similar styling to match web version |
| `<Form>` | `Form` | Group form fields |
| `<Checkbox>` | `Toggle` styled as checkbox | Need custom styling |
| `<Input>` | `TextField` | Apply similar styling |
| `<Label>` | `Text` + `.font(.caption)` | Use proper styling |
| `<RadioGroup>` | `Picker` in segmented style | Or create custom radio buttons |
| `<Select>` | `Picker` with menu style | Add similar dropdown appearance |
| `<Slider>` | `Slider` | Match styling |
| `<Switch>` | `Toggle` | Match color scheme |
| `<Tabs>` | `TabView` | Handle styling to match |
| `<Toast>` | Custom overlay implementation | Create a Toast manager |
| `<Tooltip>` | Custom implementation | Add a custom tooltip view |

### Layout Components

| Web Component (React) | iOS Equivalent (SwiftUI) | Notes |
|----------------------|--------------------------|-------|
| `<div className="flex">` | `HStack` | For horizontal layout |
| `<div className="flex flex-col">` | `VStack` | For vertical layout |
| `<div className="grid grid-cols-X">` | `LazyVGrid` | Use with columns configuration |
| `<div className="absolute">` | `.position(.absolute)` | For absolute positioning |
| `<div className="p-4">` | `.padding()` | For padding |
| `<div className="m-4">` | Custom Spacer usage | SwiftUI handles margins differently |
| `<div className="bg-primary">` | `.background(Color("primary"))` | Match color scheme |

### Convive-Specific Components

| Web Component | iOS Equivalent | Notes |
|---------------|----------------|-------|
| `<Header>` | Custom SwiftUI View | Create a reusable header component |
| `<Footer>` | Custom SwiftUI View | May be unnecessary in iOS apps |
| `<MobileNav>` | `TabView` | Bottom navigation |
| `<RestaurantCard>` | Custom SwiftUI View | Complex component with image and details |
| `<MeetupCard>` | Custom SwiftUI View | Complex component with date/time/users |
| `<UserAvatar>` | Custom SwiftUI View | Image with fallback to initials |
| `<UserProfile>` | Custom SwiftUI View | Complex profile display |
| `<CompatibleMatches>` | Custom SwiftUI View | Horizontally scrolling card list |
| `<OnboardingFlow>` | Multi-screen SwiftUI flow | Use AppStorage for persistence |
| `<InstallAppBanner>` | N/A | Not needed in native app |
| `<OfflineNotice>` | Custom SwiftUI overlay | Detect connectivity using Network framework |

## Navigation Structure

### Main Navigation Flow

| Web Route | iOS Navigation | Notes |
|-----------|----------------|-------|
| `/` (Home) | First tab in TabView | Main screen after login |
| `/profile` | Tab or navigation push | User profile access |
| `/my-meetups` | Tab in TabView | List of user's meetups |
| `/find-group-meetups` | Tab in TabView | Discover screen |
| `/messages` | Tab in TabView | Message center |
| `/restaurant/:id` | Navigation push | Detail view from home |
| `/meetup/:id` | Navigation push | Detail view from meetups |

### Modal Flows

| Web Flow | iOS Implementation | Notes |
|----------|-------------------|-------|
| Login/Signup modal | Separate screen or sheet | Authentication flow |
| Filters modal | Sheet or actionSheet | Filtering options |
| Add to calendar modal | System calendar integration | Use EventKit |
| Profile editing | Navigation push or sheet | Edit user details |

## Form Components

| Web Form | iOS Implementation | Notes |
|----------|-------------------|-------|
| Registration form | Multi-step form | Combine with validation |
| Questionnaire | Multi-screen form | Store progress in AppStorage |
| Filters form | Sheet + form fields | Keep same structure |
| Payment form | Use Apple Pay when possible | Fall back to Stripe SDK |
| Message composition | Custom TextField with attachments | Match web functionality |

## Data Fetching Patterns

Map each React Query pattern to a corresponding iOS approach:

| React Query Pattern | iOS Approach | Notes |
|--------------------|--------------|-------|
| `useQuery` | Combine publisher | Create similar caching and loading patterns |
| `useMutation` | Combine publisher with state | Track loading/success/error states |
| Query invalidation | Publisher refresh | Implement similar cache invalidation |
| Offline caching | Core Data + NSCache | Implement similar two-level caching |
| Optimistic updates | State updates before API | Match same pattern |

### Example Structure

```swift
// Similar to useQuery
class RestaurantsViewModel: ObservableObject {
    @Published var restaurants: [Restaurant] = []
    @Published var isLoading = false
    @Published var error: Error?
    
    private var cancellables = Set<AnyCancellable>()
    
    func fetchRestaurants() {
        isLoading = true
        
        APIClient.shared.getRestaurants()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let error) = completion {
                        self?.error = error
                    }
                },
                receiveValue: { [weak self] restaurants in
                    self?.restaurants = restaurants
                    // Cache for offline
                    OfflineCache.shared.saveRestaurants(restaurants)
                }
            )
            .store(in: &cancellables)
    }
}
```

## Authentication Flow

| Web Auth Feature | iOS Implementation | Notes |
|-----------------|-------------------|-------|
| Login form | Custom SwiftUI form | Similar validation |
| Token storage | Keychain | More secure than localStorage |
| Auth state context | App-wide environment object | Similar pattern |
| Protected routes | View modifiers or Coordinator | Check auth before showing views |

## Offline Capabilities

| Web Implementation | iOS Implementation | Notes |
|-------------------|-------------------|-------|
| IndexedDB | Core Data + CloudKit | More powerful and native |
| Service Worker cache | URLCache + custom cache | For network requests and images |
| Online/offline detection | NWPathMonitor | Native network monitoring |
| Request queueing | Custom Combine pipeline | Similar retry/queue pattern |
| Sync on reconnect | Background processing | iOS background fetch |

## Component Style Guide

To maintain visual consistency, iOS developers should adhere to:

1. **Color Palette:** Use the same color values from theme.json
2. **Typography:** Match font families, sizes and weights
3. **Border Radius:** Use the same radius values for components
4. **Spacing:** Follow the same spacing scale (4, 8, 12, 16, 24, 32, 48, 64)
5. **Animation Timing:** Match the same ease and duration values

## Implementation Notes

### Data Models

Keep the same data model structure between the web and iOS versions to ensure API compatibility and consistent behavior.

### API Integration

The iOS app should call the same REST API endpoints as the web application, following the same response handling patterns.

### Offline-First Approach

Both versions should prioritize offline capabilities, with local data storage and synchronization when connectivity returns.

### UI/UX Consistency 

While adapting to iOS platform conventions, maintain the same visual identity and interaction patterns where possible.

---

This documentation is a living guide and should be updated as the web application evolves to ensure the iOS version remains consistent.
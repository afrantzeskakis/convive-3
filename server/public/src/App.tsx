import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import PublicHome from "./pages/PublicHome";
import AboutUs from "./pages/AboutUs";
import Profile from "./pages/Profile";
import Questionnaire from "./pages/Questionnaire";
import RestaurantDetails from "./pages/RestaurantDetails";
import RestaurantPartners from "./pages/RestaurantPartners";
import HowItWorks from "./pages/HowItWorks";
import RestaurantAdminDashboard from "./pages/restaurant-admin";
import RestaurantAdmin from "./pages/RestaurantAdmin";
import RestaurantView from "./pages/RestaurantView";
import RestaurantUserDashboard from "./pages/restaurant-user-dashboard";
// User management now integrated into restaurant-admin dashboard
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import GroupFormationTest from "./pages/GroupFormationTest";
import MeetupDetails from "./pages/MeetupDetails";
import MyMeetups from "./pages/MyMeetups";
import Messages from "./pages/Messages";
import LoginPage from "./pages/login-page";
import Onboarding from "./pages/Onboarding";
import TableAccess from "./pages/TableAccess";
import FindGroupMeetups from "./pages/FindGroupMeetups";
import AITestPage from "./pages/AITestPage";
import SommelierPage from "./pages/SommelierPage";
import SimpleWineUpload from "./pages/SimpleWineUpload";
import WineSamplePage from "./pages/WineSamplePage";
import WineUploadPage from "./pages/WineUploadPage";
import WineUploader from "./pages/WineUploader";
import WineDatabase from "./pages/WineDatabase";
import WineRecommendations from "./pages/WineRecommendations";
import WineVerificationDashboard from "./pages/WineVerificationDashboard";

import RecipeMenu from "./pages/recipe-menu";
import RecipeDetail from "./pages/recipe-detail";
import Header from "./components/layout/Header";
import PublicHeader from "./components/layout/PublicHeader";
import Footer from "./components/layout/Footer";
import MobileNav from "./components/layout/MobileNav";
import PublicMobileNav from "./components/layout/PublicMobileNav";
import InstallAppBanner from "./components/InstallAppBanner";
import OfflineNotice from "./components/OfflineNotice";
import SplashScreen from "./components/SplashScreen";
import { AuthProvider, useAuth } from './contexts/AuthContextProvider';
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  const { user, isAuthenticated } = useAuth();

  // Use conditional rendering for header, footer, and mobile nav
  const [location] = useLocation();
  const isOnboarding = location === '/onboarding';
  const isAuthPage = location === '/auth';
  const isAdminPage = location === '/restaurant-admin-dashboard' || 
                      location === '/admin-dashboard' ||
                      location === '/super-admin-dashboard' ||
                      location === '/restaurant-user-dashboard' ||
                      location === '/group-formation-test' ||
                      location === '/ai-test' ||
                      location === '/sommelier' ||
                      location === '/wine-database' ||
                      location.includes('/wine');
  
  // Check if we're on a public page - these pages are accessible without login
  const isPublicPage = location === '/about' || 
                     location === '/restaurant-partners' || 
                     location === '/how-it-works' ||
                     location === '/auth';

  // Automatic routing based on user role
  if (isAuthenticated && user && location === '/') {
    // Check for bypass flag in localStorage
    const bypassRedirect = localStorage.getItem('bypass_admin_redirect') === 'true';
    
    // If bypass flag is set, clear it and don't redirect
    if (bypassRedirect) {
      console.log("Bypass flag detected in App.tsx, staying on user dashboard");
      localStorage.removeItem('bypass_admin_redirect');
      // Continue to home page
    } 
    // Otherwise perform standard role-based redirects
    else if (user.role === 'super_admin') {
      // Redirect super admin directly to their dashboard
      window.location.href = '/super-admin-dashboard';
      return null;
    } else if (user.role === 'restaurant_admin') {
      window.location.href = '/restaurant-admin-dashboard';
      return null;
    } else if (user.authorizedRestaurants && user.authorizedRestaurants.length > 0) {
      // If user has authorized restaurants, redirect to restaurant user dashboard
      window.location.href = '/restaurant-user-dashboard';
      return null;
    }
    // Regular users continue to home page
  }
  
  // For non-authenticated users, show the public version of the site
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <PublicHeader />
        <main className="flex-grow">
          <Switch>
            {/* Public routes */}
            <Route path="/" component={PublicHome} />
            <Route path="/about" component={AboutUs} />
            <Route path="/restaurant-partners" component={RestaurantPartners} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/table-access" component={TableAccess} />
            <Route path="/auth" component={LoginPage} />
            
            {/* Any other route for non-authenticated users redirects to public home */}
            <Route path="*">
              <PublicHome />
            </Route>
          </Switch>
        </main>
        <Footer />
        <PublicMobileNav />
      </div>
    );
  }

  // For authenticated users, show the full app with access restrictions
  return (
    <div className="flex flex-col min-h-screen">
      {!isOnboarding && !isAuthPage && !isAdminPage && <Header />}
      <main className="flex-grow">
        <Switch>
          {/* Home route for authenticated users */}
          <Route path="/" component={Home} />
          
          {/* Public information pages */}
          <Route path="/about" component={AboutUs} />
          <Route path="/restaurant-partners" component={RestaurantPartners} />
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/auth" component={LoginPage} />
          
          {/* Protected routes - regular users */}
          <ProtectedRoute path="/profile" component={Profile} requiredRole="user" />
          <ProtectedRoute path="/questionnaire" component={Questionnaire} requiredRole="user" />
          <ProtectedRoute path="/restaurant/:id" component={RestaurantDetails} requiredRole="user" />
          <ProtectedRoute path="/meetup/:id" component={MeetupDetails} requiredRole="user" />
          <ProtectedRoute path="/my-meetups" component={MyMeetups} requiredRole="user" />
          <ProtectedRoute path="/find-group-meetups" component={FindGroupMeetups} requiredRole="user" />
          <ProtectedRoute path="/messages" component={Messages} requiredRole="user" />
          <ProtectedRoute path="/onboarding" component={Onboarding} requiredRole="user" />
          <ProtectedRoute path="/table-access" component={TableAccess} requiredRole="user" />
          
          {/* Admin routes */}
          <ProtectedRoute 
            path="/restaurant-admin-dashboard" 
            component={RestaurantAdminDashboard}
            requiredRole="restaurant_admin"
          />
          
          {/* Restaurant management routes */}
          <ProtectedRoute 
            path="/restaurant-admin" 
            component={RestaurantAdmin}
            requiredRole="restaurant_admin"
          />
          <ProtectedRoute 
            path="/restaurant-view" 
            component={RestaurantView}
            requiredRole="restaurant_admin"
          />
          {/* User management now handled in restaurant-admin dashboard */}
          
          {/* Restaurant User routes */}
          <ProtectedRoute 
            path="/restaurant-user-dashboard" 
            component={RestaurantUserDashboard}
            requiredRole="user"
          />
          
          {/* Recipe Menu routes */}
          <ProtectedRoute 
            path="/recipe-menu" 
            component={RecipeMenu}
            requiredRole="user"
          />
          <ProtectedRoute 
            path="/recipe-detail/:id" 
            component={RecipeDetail}
            requiredRole="user"
          />
          
          {/* Super Admin routes */}
          <ProtectedRoute 
            path="/super-admin-dashboard" 
            component={SuperAdminDashboard}
            requiredRole="super_admin"
          />
          <ProtectedRoute 
            path="/group-formation-test" 
            component={GroupFormationTest}
            requiredRole="super_admin"
          />
          <ProtectedRoute 
            path="/ai-test" 
            component={AITestPage}
            requiredRole="super_admin"
          />
          <ProtectedRoute 
            path="/sommelier" 
            component={SommelierPage}
            requiredRole="super_admin"
          />
          <ProtectedRoute 
            path="/simple-wine-upload" 
            component={SimpleWineUpload}
            requiredRole="super_admin"
          />
          <ProtectedRoute 
            path="/wine-sample" 
            component={WineSamplePage}
            requiredRole="super_admin"
          />
          <ProtectedRoute 
            path="/wine-upload" 
            component={WineUploadPage}
            requiredRole="super_admin"
          />
          <ProtectedRoute 
            path="/wine-uploader" 
            component={WineUploader}
            requiredRole="super_admin"
          />
          <ProtectedRoute 
            path="/wine-database" 
            component={WineDatabase}
            requiredRole="super_admin"
          />
          <ProtectedRoute 
            path="/wine-verification" 
            component={WineVerificationDashboard}
            requiredRole="super_admin"
          />

          
          {/* Fallback route */}
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isOnboarding && !isAuthPage && !isAdminPage && <Footer />}
      {!isOnboarding && !isAuthPage && !isAdminPage && <MobileNav />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SplashScreen />
        <OfflineNotice />
        <Router />
        <InstallAppBanner />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

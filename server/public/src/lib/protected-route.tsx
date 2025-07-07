import { useAuth } from "../contexts/AuthContextProvider";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole,
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRole?: string;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user has the required role for this route
  if (requiredRole && user && user.role !== requiredRole) {
    // Special handling for super_admin who should have access to all dashboards
    if (user.role === "super_admin" && 
        (requiredRole === "admin" || requiredRole === "restaurant_admin" || requiredRole === "user")) {
      // Allow super_admin to access any dashboard
      return <Route path={path} component={Component} />;
    }
    
    // Special handling for users with authorized restaurants trying to access restaurant-user-dashboard
    if (requiredRole === "user" && 
        path === "/restaurant-user-dashboard" && 
        user.authorizedRestaurants && 
        user.authorizedRestaurants.length > 0) {
      // Allow users with authorized restaurants to access restaurant-user-dashboard
      return <Route path={path} component={Component} />;
    }
    
    // Redirect based on actual role
    let redirectTo = "/";
    if (user.role === "restaurant_admin") {
      redirectTo = "/restaurant-admin-dashboard";
    } else if (user.role === "admin") {
      redirectTo = "/admin-dashboard";
    } else if (user.role === "super_admin") {
      redirectTo = "/super-admin-dashboard";
    }
    
    return (
      <Route path={path}>
        <Redirect to={redirectTo} />
      </Route>
    );
  }

  // Check for bypass flag in localStorage for admin users
  const bypassRedirect = localStorage.getItem('bypass_admin_redirect') === 'true';
  
  // If user is an admin trying to access regular user pages and no bypass flag
  // Allow super_admin to access wine-related pages without redirect
  const isWineRelatedPage = path.includes("wine") || path.includes("sommelier");
  
  if (user && 
      (user.role === "restaurant_admin" || user.role === "admin" || user.role === "super_admin") && 
      !path.includes("admin") && 
      !bypassRedirect &&
      !(user.role === "super_admin" && isWineRelatedPage)) {
    // Redirect to appropriate dashboard
    let redirectTo = "/admin-dashboard";
    if (user.role === "restaurant_admin") {
      redirectTo = "/restaurant-admin-dashboard";
    } else if (user.role === "super_admin") {
      redirectTo = "/super-admin-dashboard";
    }
      
    return (
      <Route path={path}>
        <Redirect to={redirectTo} />
      </Route>
    );
  }
  
  // If we are using the bypass flag, clear it after use
  if (bypassRedirect && !path.includes("admin")) {
    // Clear the flag after it's been used
    localStorage.removeItem('bypass_admin_redirect');
  }

  // If authenticated but onboarding not complete, redirect to onboarding
  // Skip for admin users who don't need onboarding
  if (user && 
      !user.onboardingComplete && 
      path !== "/onboarding" && 
      user.role === "user") {
    return (
      <Route path={path}>
        <Redirect to="/onboarding" />
      </Route>
    );
  }

  // Otherwise, render the protected component
  return <Route path={path} component={Component} />;
}
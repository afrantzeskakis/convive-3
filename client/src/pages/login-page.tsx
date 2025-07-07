import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContextProvider";

// Define login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Define register form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
});

// Form values types
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  // Check URL parameters for tab selection
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') === 'register' ? 'register' : 'login';
    }
    return 'login';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, signup, user } = useAuth();

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
    },
  });

  const isLoginSubmitting = loginForm.formState.isSubmitting;
  const isRegisterSubmitting = registerForm.formState.isSubmitting;

  // Redirect if already authenticated - must be after all hook calls
  if (user) {
    console.log("Already authenticated as:", user.username);
    
    // Check for bypass flag in localStorage
    const bypassRedirect = localStorage.getItem('bypass_admin_redirect') === 'true';
    
    // If bypass flag is set, go to home page and clear the flag
    if (bypassRedirect) {
      console.log("Bypass flag detected, going to regular user view");
      localStorage.removeItem('bypass_admin_redirect');
      window.location.href = "/";
      return;
    }
    
    // Regular role-based redirection
    if (user.role === "super_admin") {
      console.log("Already logged in as super admin, redirecting to dashboard");
      window.location.href = "/super-admin-dashboard";
    } else if (user.role === "restaurant_admin") {
      window.location.href = "/restaurant-admin-dashboard";
    } else if (user.role === "admin") {
      window.location.href = "/admin-dashboard";
    } else if (user.onboardingComplete) {
      window.location.href = "/";
    } else {
      window.location.href = "/onboarding";
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Login submission handler
  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      console.log("Attempting login with:", data.username);
      
      // Use the login function from AuthContext
      const userData = await login({
        username: data.username,
        password: data.password
      });
      
      console.log("Login successful for:", userData.username);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.fullName || userData.username}!`,
      });
      
      // Redirect based on role
      setTimeout(() => {
        console.log("Redirecting user based on role:", userData.role);
        
        // Check for bypass flag in localStorage
        const bypassRedirect = localStorage.getItem('bypass_admin_redirect') === 'true';
        
        // If bypass flag is set, go to home page and clear the flag
        if (bypassRedirect) {
          console.log("Bypass flag detected after login, going to regular user view");
          localStorage.removeItem('bypass_admin_redirect');
          window.location.href = "/";
          return;
        }
        
        // Regular role-based redirection
        if (userData.role === "restaurant_admin") {
          window.location.href = "/restaurant-admin-dashboard";
        } else if (userData.role === "admin") {
          window.location.href = "/admin-dashboard";
        } else if (userData.role === "super_admin") {
          // Immediately redirect super admins to their dashboard
          window.location.href = "/super-admin-dashboard";
        } else {
          // Regular user
          if (userData.onboardingComplete) {
            window.location.href = "/";
          } else {
            window.location.href = "/onboarding";
          }
        }
      }, 10);
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
    }
  };

  // Register submission handler
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      console.log("Attempting registration for:", data.username);
      
      // Use the signup function from AuthContext
      const userData = await signup({
        username: data.username,
        password: data.password,
        email: data.email,
        fullName: data.fullName,
        role: 'user' // Default role for new users
      });
      
      console.log("Registration successful for:", userData.username);
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      });
      
      // Redirect to onboarding
      setTimeout(() => {
        console.log("Redirecting new user to onboarding:", userData.username);
        window.location.href = "/onboarding";
      }, 100);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "There was a problem creating your account",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column - Auth Forms */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Convive
              </h1>
              <p className="text-gray-500 md:text-base/relaxed dark:text-gray-400">
                Discover dining experiences with new friends
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your account
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username">Username</Label>
                        <Input 
                          id="login-username" 
                          {...loginForm.register("username")} 
                          placeholder="johndoe"
                          disabled={isLoginSubmitting}
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input 
                          id="login-password" 
                          type="password" 
                          {...loginForm.register("password")} 
                          placeholder="••••••••"
                          disabled={isLoginSubmitting}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoginSubmitting}
                      >
                        {isLoginSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : "Sign In"}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                      Enter your information to get started
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-fullname">Full Name</Label>
                        <Input 
                          id="register-fullname" 
                          {...registerForm.register("fullName")} 
                          placeholder="John Doe"
                          disabled={isRegisterSubmitting}
                        />
                        {registerForm.formState.errors.fullName && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.fullName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input 
                          id="register-email" 
                          type="email" 
                          {...registerForm.register("email")} 
                          placeholder="john@example.com"
                          disabled={isRegisterSubmitting}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-username">Username</Label>
                        <Input 
                          id="register-username" 
                          {...registerForm.register("username")} 
                          placeholder="johndoe"
                          disabled={isRegisterSubmitting}
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input 
                          id="register-password" 
                          type="password" 
                          {...registerForm.register("password")} 
                          placeholder="••••••••"
                          disabled={isRegisterSubmitting}
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isRegisterSubmitting}
                      >
                        {isRegisterSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : "Create Account"}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Hero content */}
          <div className="hidden md:flex flex-col justify-center space-y-6 rounded-xl bg-gradient-to-b from-primary/20 to-primary/5 p-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-primary/90 to-primary/60 bg-clip-text text-transparent">
                Discover culinary experiences with new connections
              </h2>
              <p className="text-gray-500 md:text-base/relaxed dark:text-gray-400">
                Convive matches you with like-minded individuals based on your dining preferences and social interests.
              </p>
            </div>

            <div className="grid gap-4 grid-cols-1">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur shadow-sm">
                <h3 className="font-bold text-lg">Match with compatible diners</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Our algorithm finds people who share your dining style and social preferences.</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur shadow-sm">
                <h3 className="font-bold text-lg">Discover new restaurants</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Experience curated restaurants that match your preferences.</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur shadow-sm">
                <h3 className="font-bold text-lg">Create meaningful connections</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Meet new people and build lasting friendships over great food.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
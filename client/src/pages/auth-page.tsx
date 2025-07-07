import React, { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContextProvider";
import { useDevice } from "@/hooks/useDevice";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, login, signup } = useAuth();
  const { deviceType, isTablet } = useDevice();
  
  // We'll use a ref to track if we've already redirected to avoid infinite loops
  const hasRedirected = React.useRef(false);
  
  // Handle redirect based on user role when logged in
  useEffect(() => {
    // Only redirect if we haven't already and user exists
    if (user && !hasRedirected.current) {
      hasRedirected.current = true;
      
      // Different redirection based on user role
      if (user.role === "restaurant_admin") {
        navigate("/restaurant-admin-dashboard");
      } else if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        // Regular user
        if (user.onboardingComplete) {
          navigate("/");
        } else {
          navigate("/onboarding");
        }
      }
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

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

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      // Add a console.log to see login attempt
      console.log("Attempting login with:", data.username);
      
      // Use a direct API call to avoid hooks issues
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      // Get the user details
      const userData = await response.json();
      console.log("Login successful for:", userData.username);
      
      // Redirect based on role - will be handled by useEffect once the auth context updates
      // No need to directly navigate here
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      // Log the registration attempt
      console.log("Attempting registration with:", data.username);
      
      // Use direct API call to avoid hooks issues
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          email: data.email,
          fullName: data.fullName,
          role: 'user' // Default role for new users
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // Get the user details
      const userData = await response.json();
      console.log("Registration successful for:", userData.username);
      
      toast({
        title: "Account created!",
        description: "Your account has been successfully created."
      });
      
      // Redirect will be handled by useEffect once the auth context updates
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
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8 sm:py-12 md:py-16">
      <div className={`w-full ${isTablet ? 'max-w-4xl' : 'max-w-7xl'} mx-auto`}>
        <div className="grid w-full gap-10 md:grid-cols-2 lg:gap-16">
          {/* Left column - Auth Forms */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Welcome to Convive
              </h1>
              <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Join our community and discover great dining experiences with new friends
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className={`${isTablet ? 'text-lg py-3' : ''}`}>Login</TabsTrigger>
                <TabsTrigger value="register" className={`${isTablet ? 'text-lg py-3' : ''}`}>Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card className={`${isTablet ? 'shadow-lg' : ''}`}>
                  <CardHeader>
                    <CardTitle className={`${isTablet ? 'text-2xl' : ''}`}>Login to your account</CardTitle>
                    <CardDescription className={`${isTablet ? 'text-base' : ''}`}>
                      Enter your username and password to sign in
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username" className={`${isTablet ? 'text-base' : ''}`}>Username</Label>
                        <Input 
                          id="login-username" 
                          {...loginForm.register("username")} 
                          placeholder="johndoe"
                          disabled={isLoginSubmitting}
                          className={`${isTablet ? 'text-base py-6' : ''}`}
                        />
                        {loginForm.formState.errors.username && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className={`${isTablet ? 'text-base' : ''}`}>Password</Label>
                        <Input 
                          id="login-password" 
                          type={showLoginPassword ? "text" : "password"}
                          {...loginForm.register("password")} 
                          placeholder="••••••••"
                          disabled={isLoginSubmitting}
                          className={`${isTablet ? 'text-base py-6' : ''}`}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox 
                            id="show-login-password"
                            className="border-slate-400 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                            checked={showLoginPassword}
                            onCheckedChange={() => setShowLoginPassword(!showLoginPassword)}
                          />
                          <Label 
                            htmlFor="show-login-password" 
                            className="text-sm font-medium flex items-center cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-1 text-slate-600" /> 
                            Show password
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className={`w-full ${isTablet ? 'text-lg py-6' : ''}`} 
                        disabled={isLoginSubmitting}
                      >
                        {isLoginSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : "Log In"}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card className={`${isTablet ? 'shadow-lg' : ''}`}>
                  <CardHeader>
                    <CardTitle className={`${isTablet ? 'text-2xl' : ''}`}>Create an account</CardTitle>
                    <CardDescription className={`${isTablet ? 'text-base' : ''}`}>
                      Enter your information to get started
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-fullname" className={`${isTablet ? 'text-base' : ''}`}>Full Name</Label>
                        <Input 
                          id="register-fullname" 
                          {...registerForm.register("fullName")} 
                          placeholder="John Doe"
                          disabled={isRegisterSubmitting}
                          className={`${isTablet ? 'text-base py-6' : ''}`}
                        />
                        {registerForm.formState.errors.fullName && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.fullName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className={`${isTablet ? 'text-base' : ''}`}>Email</Label>
                        <Input 
                          id="register-email" 
                          type="email" 
                          {...registerForm.register("email")} 
                          placeholder="john@example.com"
                          disabled={isRegisterSubmitting}
                          className={`${isTablet ? 'text-base py-6' : ''}`}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-username" className={`${isTablet ? 'text-base' : ''}`}>Username</Label>
                        <Input 
                          id="register-username" 
                          {...registerForm.register("username")} 
                          placeholder="johndoe"
                          disabled={isRegisterSubmitting}
                          className={`${isTablet ? 'text-base py-6' : ''}`}
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className={`${isTablet ? 'text-base' : ''}`}>Password</Label>
                        <Input 
                          id="register-password" 
                          type={showRegisterPassword ? "text" : "password"}
                          {...registerForm.register("password")} 
                          placeholder="••••••••"
                          disabled={isRegisterSubmitting}
                          className={`${isTablet ? 'text-base py-6' : ''}`}
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox 
                            id="show-register-password"
                            className="border-slate-400 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                            checked={showRegisterPassword}
                            onCheckedChange={() => setShowRegisterPassword(!showRegisterPassword)}
                          />
                          <Label 
                            htmlFor="show-register-password" 
                            className="text-sm font-medium flex items-center cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-1 text-slate-600" /> 
                            Show password
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className={`w-full ${isTablet ? 'text-lg py-6' : ''}`} 
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

          {/* Right column - Hero image and information */}
          <div className={`hidden ${isTablet ? 'flex' : 'md:flex'} flex-col justify-center space-y-6 rounded-xl bg-gradient-to-b from-primary/20 to-primary/5 p-8 md:p-10`}>
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tighter bg-gradient-to-r from-primary/90 to-primary/60 bg-clip-text text-transparent">
                Discover culinary experiences and new connections
              </h2>
              <p className="text-gray-500 md:text-lg lg:text-base xl:text-lg dark:text-gray-400">
                Convive matches you with like-minded individuals based on your dining preferences and social interests.
              </p>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur shadow-sm">
                <h3 className="font-bold text-lg">Match with compatible diners</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Our algorithm finds people who share your dining style.</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur shadow-sm">
                <h3 className="font-bold text-lg">Discover new restaurants</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Experience curated restaurants that match your preferences.</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur shadow-sm">
                <h3 className="font-bold text-lg">Schedule meetups</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Easily organize or join dining meetups with new friends.</p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur shadow-sm">
                <h3 className="font-bold text-lg">Create lasting connections</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Form friendships and expand your social circle.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
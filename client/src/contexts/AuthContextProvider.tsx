import { ReactNode, createContext, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { apiRequest, getQueryFn, queryClient, setAuthToken, clearAuthToken } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { safeStorage } from "../lib/safeStorage";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: (credentials: LoginData) => Promise<User>;
  signup: (userData: InsertUser) => Promise<User>;
  logout: () => Promise<void>;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data: User & { token?: string }) => {
      // Store the JWT token if present
      if (data.token) {
        console.log("[Auth] JWT token received and stored");
        setAuthToken(data.token);
      }
      
      // Remove token from user object before caching
      const { token, ...user } = data;
      
      // Set user data immediately for optimistic update
      queryClient.setQueryData(["/api/user"], user);
      // Also invalidate to confirm session via token-backed fetch
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Set user data immediately for optimistic update
      queryClient.setQueryData(["/api/user"], user);
      // Also invalidate to confirm session via cookie-backed fetch
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear the JWT token
      clearAuthToken();
      console.log("[Auth] JWT token cleared");
      
      // Clear user data and invalidate all queries
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries();
      
      // Clear any local storage items that might contain user state
      safeStorage.removeItem('bypass_admin_redirect');
      
      // Force navigation to home page - will be handled by the logout function below
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      
      // Even on error, try to clear client-side data
      clearAuthToken();
      queryClient.setQueryData(["/api/user"], null);
      safeStorage.removeItem('bypass_admin_redirect');
    },
  });

  const login = async (credentials: LoginData): Promise<User> => {
    return loginMutation.mutateAsync(credentials);
  };

  const signup = async (userData: InsertUser): Promise<User> => {
    return signupMutation.mutateAsync(userData);
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
      // Force reload to ensure clean state (clearing any in-memory state)
      window.location.href = '/';
    } catch (error) {
      console.error("Logout error:", error);
      // Force reload anyway to ensure user gets a fresh state
      window.location.href = '/';
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
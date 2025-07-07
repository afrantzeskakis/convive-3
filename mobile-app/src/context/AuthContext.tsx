import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginUser, registerUser, getUserProfile } from '../api/services';
import { saveToken, getToken, removeToken } from '../utils/auth';
import NetInfo from '@react-native-community/netinfo';

// Define the auth context shape
interface AuthContextType {
  user: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  
  // Check if the user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await getToken();
        if (token) {
          // Verify token and get user data
          const userData = await getUserProfile();
          setUser(userData);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainStack' }],
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        await removeToken();
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected && !initialLoading) {
        Alert.alert(
          "No Internet Connection",
          "You are currently offline. Some features may be unavailable."
        );
      }
    });
    
    return () => unsubscribe();
  }, [initialLoading]);
  
  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await loginUser(email, password);
      await saveToken(response.token);
      setUser(response.user);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainStack' }],
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await registerUser(email, password, fullName);
      await saveToken(response.token);
      setUser(response.user);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainStack' }],
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    setLoading(true);
    
    try {
      await removeToken();
      setUser(null);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'AuthStack' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Update user data
  const updateUser = (userData: any) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || initialLoading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {!initialLoading && children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = () => useContext(AuthContext);
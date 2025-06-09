import React, { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, LoginUser, RegisterUser } from "../../../shared/schema.ts";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterUser>;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {} as any,
  logoutMutation: {} as any,
  registerMutation: {} as any,
  isAuthenticated: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Enhanced session persistence
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/user");
        const userData = await res.json();
        if (userData) {
          localStorage.setItem('boxplus_auth_check', Date.now().toString());
          queryClient.setQueryData(["/api/auth/user"], userData);
        }
      } catch (error) {
        localStorage.removeItem('boxplus_auth_check');
      }
    };

    // Check auth status on mount if there's no recent check
    const lastCheck = localStorage.getItem('boxplus_auth_check');
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    if (!lastCheck || parseInt(lastCheck) < fiveMinutesAgo) {
      checkAuthStatus();
    }
  }, []);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/user");
        const userData = await res.json();
        if (userData) {
          localStorage.setItem('boxplus_auth_check', Date.now().toString());
        }
        return userData;
      } catch (error: any) {
        if (error.message?.includes('401')) {
          localStorage.removeItem('boxplus_auth_check');
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      localStorage.setItem('boxplus_auth_check', Date.now().toString());
      localStorage.setItem('boxplus_user_authenticated', 'true');
      toast({
        title: "Welcome to Box+",
        description: "Successfully signed in!",
      });
    },
    onError: (error: any) => {
      localStorage.removeItem('boxplus_auth_check');
      localStorage.removeItem('boxplus_user_authenticated');
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterUser) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      localStorage.setItem('boxplus_auth_check', Date.now().toString());
      localStorage.setItem('boxplus_user_authenticated', 'true');
      toast({
        title: "Welcome to Box+",
        description: "Account created successfully!",
      });
    },
    onError: (error: any) => {
      localStorage.removeItem('boxplus_auth_check');
      localStorage.removeItem('boxplus_user_authenticated');
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.removeQueries({ queryKey: ["/api/custom-stats/my"] });
      queryClient.removeQueries({ queryKey: ["/api/favorites"] });
      localStorage.removeItem('boxplus_auth_check');
      localStorage.removeItem('boxplus_user_authenticated');
      localStorage.clear(); // Clear all localStorage for complete logout
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
}
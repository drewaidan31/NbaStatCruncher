import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const isAuthenticated = !!user;

  // Invalidate custom stats cache when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-stats/my"] });
    }
  }, [isAuthenticated, queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
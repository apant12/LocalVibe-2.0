import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Add timeout to prevent infinite loading
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // If there's an error or we're not loading, treat as not authenticated
  const isAuthenticated = !error && !!user;
  
  return {
    user,
    isLoading: isLoading && !error,
    isAuthenticated,
  };
}

import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";

export const useCurrentUser = () => {
  const {
    data: currentUser,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/me"],
    enabled: true,
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        return null;
      }
      const response = await fetch("/api/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000,
  });

  return { currentUser, isLoading, error, refetch };
};

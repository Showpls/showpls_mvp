import { useQuery } from '@tanstack/react-query';
import { getAuthToken } from '@/lib/auth';

export const useCurrentUser = () => {
    const { data: currentUser, isLoading, error } = useQuery({
        queryKey: ['/api/me'],
        enabled: true,
        queryFn: async () => {
            const token = getAuthToken();
            if (!token) {
                // Return null or throw an error if not authenticated
                return null;
            }

            const response = await fetch('/api/me', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Not authenticated
                    return null;
                }
                throw new Error('Failed to fetch user');
            }
            return response.json();
        },
        refetchOnWindowFocus: true, // Optional: refetch when window is focused
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return { currentUser, isLoading, error };
};

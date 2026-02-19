import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, fetchUserStats } from '@/lib/api/users';

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => fetchUserStats(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Parameters<typeof updateProfile>[1];
    }) => updateProfile(userId, updates),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

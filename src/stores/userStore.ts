import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  favorite_team: string | null;
}

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;

  setProfile: (profile: UserProfile | null) => void;
  setOnboarded: (value: boolean) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isOnboarded: false,

      setProfile: (profile) => set({ profile }),
      setOnboarded: (value) => set({ isOnboarded: value }),
      reset: () => set({ profile: null, isOnboarded: false }),
    }),
    {
      name: 'football-fusion-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

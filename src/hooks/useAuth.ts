import { useEffect, useState, useCallback } from 'react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { supabase } from '@/lib/supabase/client';

export interface WalletUser {
  id: string; // Supabase profile UUID
  address: string; // Solana wallet address
}

export function useAuth() {
  const wallet = useSolanaWallet();
  const [user, setUser] = useState<WalletUser | null>(null);
  const [profileSynced, setProfileSynced] = useState(false);

  // Automatically create/fetch profile when wallet connects
  useEffect(() => {
    if (!wallet.connected || !wallet.address) {
      setUser(null);
      setProfileSynced(false);
      return;
    }

    const syncProfile = async () => {
      const address = wallet.address!;

      try {
        // Single RPC call — creates auth user + profile if needed, returns profile UUID
        const { data: profileId, error } = await supabase.rpc('ensure_wallet_profile', {
          wallet_addr: address,
        });

        if (error || !profileId) {
          console.warn('Failed to ensure wallet profile:', error?.message);
          // Fallback: use wallet address directly (will work for reads, not writes)
          setUser({ id: address, address });
        } else {
          setUser({ id: profileId, address });
        }
      } catch (err) {
        console.warn('Profile sync error:', err);
        setUser({ id: address, address });
      }
      setProfileSynced(true);
    };

    syncProfile();
  }, [wallet.connected, wallet.address]);

  const signIn = useCallback(async () => {
    await wallet.connect();
  }, [wallet]);

  const signOut = useCallback(async () => {
    await wallet.disconnect();
    setUser(null);
  }, [wallet]);

  return {
    user,
    isLoading: wallet.connecting,
    isAuthenticated: wallet.connected && !!user,
    signIn,
    signOut,
    wallet,
  };
}

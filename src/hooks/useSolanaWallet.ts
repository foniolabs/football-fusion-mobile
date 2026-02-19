import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, TurboModuleRegistry, Platform } from 'react-native';

// Devnet USDC mint
const USDC_MINT_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const USDC_DECIMALS = 6;

export interface WalletState {
  address: string | null;
  connected: boolean;
  solBalance: number | null;
  usdcBalance: number | null;
  balanceLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  connecting: boolean;
  isAvailable: boolean;
  /** Raw connection object for building transactions */
  connection: any;
  /** Raw wallet object for signing */
  wallet: any;
}

// Check if the native module is available without crashing
let _nativeAvailable = false;
try {
  _nativeAvailable = TurboModuleRegistry.get('SolanaMobileWalletAdapter') != null;
} catch {
  _nativeAvailable = false;
}

// Lazily require the wallet hook only when native module exists
let _useMobileWallet: (() => any) | null = null;
let _LAMPORTS_PER_SOL = 1_000_000_000;
let _PublicKey: any = null;
if (_nativeAvailable) {
  try {
    _useMobileWallet = require('@wallet-ui/react-native-web3js').useMobileWallet;
    const web3 = require('@solana/web3.js');
    _LAMPORTS_PER_SOL = web3.LAMPORTS_PER_SOL;
    _PublicKey = web3.PublicKey;
  } catch {
    _nativeAvailable = false;
  }
}

export function useSolanaWallet(): WalletState {
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // If native module isn't available, return a safe stub
  if (!_nativeAvailable || !_useMobileWallet) {
    return {
      address: null,
      connected: false,
      solBalance: null,
      usdcBalance: null,
      balanceLoading: false,
      connect: async () => {
        console.warn(
          'Wallet Not Available: The Solana wallet module is not available in this build.',
        );
      },
      disconnect: async () => { },
      refreshBalance: async () => { },
      connecting: false,
      isAvailable: false,
      connection: null,
      wallet: null,
    };
  }

  // Native module exists — safe to use the hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wallet = _useMobileWallet();

  const address = wallet.account?.address?.toString() ?? null;
  const connected = !!wallet.account;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const refreshBalance = useCallback(async () => {
    if (!wallet.account || !wallet.connection) return;
    setBalanceLoading(true);
    try {
      // Fetch SOL balance
      const lamports = await wallet.connection.getBalance(wallet.account.publicKey);
      setSolBalance(lamports / _LAMPORTS_PER_SOL);

      // Fetch USDC balance
      try {
        const usdcMint = new _PublicKey(USDC_MINT_ADDRESS);
        const tokenAccounts = await wallet.connection.getTokenAccountsByOwner(
          wallet.account.publicKey,
          { mint: usdcMint },
        );

        if (tokenAccounts.value.length > 0) {
          // Parse token amount from account data (u64 at offset 64)
          const data = tokenAccounts.value[0].account.data;
          const rawAmount = data.readBigUInt64LE(64);
          setUsdcBalance(Number(rawAmount) / Math.pow(10, USDC_DECIMALS));
        } else {
          setUsdcBalance(0);
        }
      } catch (err) {
        console.warn('Failed to fetch USDC balance:', err);
        setUsdcBalance(0);
      }
    } catch (err) {
      console.warn('Failed to fetch balances:', err);
      setSolBalance(null);
      setUsdcBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [wallet.account, wallet.connection]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (connected) {
      refreshBalance();
    } else {
      setSolBalance(null);
      setUsdcBalance(null);
    }
  }, [connected, refreshBalance]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const connect = useCallback(async () => {
    // Proactively check if a wallet app is installed
    if (Platform.OS === 'android') {
      const phantomInstalled = await Linking.canOpenURL('phantom://');
      const solflareInstalled = await Linking.canOpenURL('solflare://');

      if (!phantomInstalled && !solflareInstalled) {
        Alert.alert(
          'No Wallet Found',
          'You need a Solana wallet app to sign in. We recommend Phantom — it\'s free and easy to set up.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Install Solflare',
              onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.solflare.mobile'),
            },
            {
              text: 'Install Phantom',
              style: 'default',
              onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=app.phantom'),
            },
          ],
        );
        return;
      }
    }

    setConnecting(true);
    try {
      await wallet.connect();
    } catch (err: any) {
      const message = err?.message || '';

      if (message.includes('User rejected') || message.includes('User denied')) {
        return;
      }

      if (
        message.includes('Found no installed wallet') ||
        message.includes('No wallet found') ||
        message.includes('No compatible wallet')
      ) {
        Alert.alert(
          'No Wallet Found',
          'You need a Solana wallet app to sign in. We recommend Phantom — it\'s free and easy to set up.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Install Solflare',
              onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.solflare.mobile'),
            },
            {
              text: 'Install Phantom',
              style: 'default',
              onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=app.phantom'),
            },
          ],
        );
        return;
      }

      Alert.alert('Connection Failed', message || 'Could not connect to wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  }, [wallet]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const disconnect = useCallback(async () => {
    try {
      await wallet.disconnect();
      setSolBalance(null);
      setUsdcBalance(null);
    } catch (err: any) {
      console.warn('Disconnect error:', err);
    }
  }, [wallet]);

  return {
    address,
    connected,
    solBalance,
    usdcBalance,
    balanceLoading,
    connect,
    disconnect,
    refreshBalance,
    connecting,
    isAvailable: true,
    connection: wallet.connection,
    wallet,
  };
}

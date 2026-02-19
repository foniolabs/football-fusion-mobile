import React, { useEffect, useState, type ReactNode } from 'react';
import { View, Image, Text, Dimensions, Platform, ImageBackground } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Teko_400Regular,
  Teko_500Medium,
  Teko_600SemiBold,
  Teko_700Bold,
} from '@expo-google-fonts/teko';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { colors } from '@/theme/colors';
import { ToastProvider } from '@/contexts/ToastContext';

export { ErrorBoundary } from 'expo-router';

// Only prevent auto-hide on native (web doesn't have a native splash screen)
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const { width, height } = Dimensions.get('window');

// Conditionally load Solana Mobile Wallet provider — native module may not be available
let SolanaWalletWrapper: ({ children }: { children: ReactNode }) => React.JSX.Element;
try {
  const { TurboModuleRegistry } = require('react-native');
  const hasNativeModule = TurboModuleRegistry.get('SolanaMobileWalletAdapter') != null;
  if (hasNativeModule) {
    const { MobileWalletProvider } = require('@wallet-ui/react-native-web3js');
    const { clusterApiUrl } = require('@solana/web3.js');
    const chain = 'solana:devnet';
    const endpoint = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet');
    const identity = { name: 'Football Fusion', uri: 'https://footballfusion.app', icon: 'favicon.png' };
    SolanaWalletWrapper = ({ children }: { children: ReactNode }) => (
      <MobileWalletProvider chain={chain} endpoint={endpoint} identity={identity}>
        {children}
      </MobileWalletProvider>
    );
  } else {
    SolanaWalletWrapper = ({ children }: { children: ReactNode }) => <>{children}</>;
  }
} catch {
  SolanaWalletWrapper = ({ children }: { children: ReactNode }) => <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1920&q=80' }}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {/* Dark overlay gradient for readability — matches web hero */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.7)', '#0f0f0f']}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Radial glow effect */}
        <View
          style={{
            position: 'absolute',
            top: height * 0.25,
            left: width * 0.1,
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: width * 0.4,
            backgroundColor: 'rgba(255,77,0,0.12)',
          }}
        />

        {/* Logo */}
        <Image
          source={require('../assets/images/logo.png')}
          style={{
            width: 110,
            height: 110,
            resizeMode: 'contain',
            marginBottom: 24,
          }}
        />

        {/* App name */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 40,
              fontFamily: 'Teko_700Bold',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              letterSpacing: 3,
            }}
          >
            Football Fusion
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'DMSans_400Regular',
              color: 'rgba(255,255,255,0.6)',
              marginTop: 6,
            }}
          >
            The Ultimate Fantasy Football Experience
          </Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Teko_400Regular,
    Teko_500Medium,
    Teko_600SemiBold,
    Teko_700Bold,
    DMSerifDisplay_400Regular,
  });

  useEffect(() => {
    // Hide native splash ASAP — our custom splash with bg image takes over
    if (Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SolanaWalletWrapper>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0F172A' },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="(tabs)" />
            </Stack>
            <StatusBar style="light" />
          </ToastProvider>
        </QueryClientProvider>
      </SolanaWalletWrapper>
    </GestureHandlerRootView>
  );
}

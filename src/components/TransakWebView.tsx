import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';

const TRANSAK_API_KEY = 'YOUR_TRANSAK_API_KEY'; // Replace with your Transak API key
const TRANSAK_ENV = 'STAGING'; // Use 'PRODUCTION' for live

interface OpenTransakOptions {
  walletAddress: string;
  /** 'BUY' = on-ramp (fiat → USDC), 'SELL' = off-ramp (USDC → fiat) */
  mode: 'BUY' | 'SELL';
}

/**
 * Opens Transak in an in-app browser (works with Expo Go — no native modules needed).
 */
export function useTransak() {
  const openTransak = useCallback(async ({ walletAddress, mode }: OpenTransakOptions) => {
    const params = new URLSearchParams({
      apiKey: TRANSAK_API_KEY,
      environment: TRANSAK_ENV,
      cryptoCurrencyCode: 'USDC',
      network: 'solana',
      walletAddress: walletAddress,
      productsAvailed: mode,
      defaultPaymentMethod: mode === 'BUY' ? 'credit_debit_card' : 'bank_transfer',
      themeColor: '2596BE',
      hideMenu: 'true',
      disableWalletAddressForm: 'true',
    });

    const url = `https://global${TRANSAK_ENV === 'STAGING' ? '-stg' : ''}.transak.com/?${params.toString()}`;

    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      controlsColor: '#2596BE',
      toolbarColor: '#0f172a',
    });
  }, []);

  return { openTransak };
}

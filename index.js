// Crypto & Buffer polyfills — MUST load before expo-router/entry
import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto';
import { Buffer } from 'buffer';

// Set global Buffer (required by @solana/web3.js)
global.Buffer = Buffer;

// Polyfill crypto.getRandomValues (required by @solana/web3.js)
class Crypto {
  getRandomValues = expoCryptoGetRandomValues;
}

const webCrypto = typeof crypto !== 'undefined' ? crypto : new Crypto();

if (typeof crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    enumerable: true,
    get: () => webCrypto,
  });
}

// IMPORTANT: This must be the LAST import — after all polyfills
import 'expo-router/entry';

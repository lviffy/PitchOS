import { generateWalletKeyPair, WalletKeyPair } from '@pitchos/wallet-adapter';

export interface WalletState extends WalletKeyPair {
  balance: number;
  points: number;
}

export function getLocalWallet(): WalletState | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('pitchos_wallet');
  return data ? JSON.parse(data) : null;
}

export function saveLocalWallet(wallet: WalletState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pitchos_wallet', JSON.stringify(wallet));
}

export function deleteLocalWallet() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pitchos_wallet');
}

export async function createNewWallet(): Promise<WalletState> {
  const keys = await generateWalletKeyPair();
  const wallet: WalletState = {
    ...keys,
    balance: 500, // Starting USDT balance (demo/mock)
    points: 1000  // Starting Points balance (demo/mock)
  };
  saveLocalWallet(wallet);
  return wallet;
}

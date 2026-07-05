import { generateWalletKeyPair, WalletKeyPair } from '@pitchos/wallet-adapter';
import { WalletTransaction } from '@pitchos/shared-types';
import { db } from '../../lib/db';

export interface WalletState extends WalletKeyPair {
  balance: number;
  points: number;
}

export function getLocalWallet(): WalletState | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('pitchos_wallet');
  if (!data) return null;
  
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    balance: parsed.balance ?? 0,
    points: parsed.points ?? 0
  };
}

export function saveLocalWallet(wallet: WalletState) {
  if (typeof window === 'undefined') return;
  // Save only the key pair info locally; balances are resolved dynamically from IndexedDB ledger
  const keyInfo = {
    publicKeyHex: wallet.publicKeyHex,
    privateKeyHex: wallet.privateKeyHex,
    did: wallet.did,
    seedPhrase: wallet.seedPhrase
  };
  localStorage.setItem('pitchos_wallet', JSON.stringify(keyInfo));
}

export function deleteLocalWallet() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pitchos_wallet');
}

export async function getWalletBalances(did: string): Promise<{ balance: number; points: number }> {
  try {
    const allTxs = await db.transactions.toArray();
    let usdt = 0;
    let pts = 0;

    for (const tx of allTxs) {
      if (tx.currency === 'USDT') {
        if (tx.recipientDid === did) usdt += tx.amount;
        if (tx.senderDid === did) usdt -= tx.amount;
      } else if (tx.currency === 'Points') {
        if (tx.recipientDid === did) pts += tx.amount;
        if (tx.senderDid === did) pts -= tx.amount;
      }
    }

    return {
      balance: parseFloat(usdt.toFixed(2)),
      points: Math.max(0, pts)
    };
  } catch (err) {
    console.error('[WalletStore] Failed to compute ledger balances', err);
    return { balance: 0, points: 0 };
  }
}

export async function createTransaction(
  senderDid: string,
  recipientDid: string,
  amount: number,
  currency: 'USDT' | 'Points',
  type: WalletTransaction['type'],
  privateKeyHex: string
): Promise<WalletTransaction> {
  const id = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now();
  const payload = `${senderDid}:${recipientDid}:${amount}:${currency}:${type}:${timestamp}`;

  // Sign message using Subtle Crypto wrapper from wallet-adapter
  const { signMessage } = await import('@pitchos/wallet-adapter');
  const signature = await signMessage(privateKeyHex, payload);

  // Generate SHA-256 transaction hash
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload + signature));
  const txHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const tx: WalletTransaction = {
    id,
    txHash,
    senderDid,
    recipientDid,
    amount,
    currency,
    type,
    timestamp,
    signature
  };

  // Record transaction in local IndexedDB ledger
  await db.transactions.put(tx);
  console.log(`[WalletStore] Recorded transaction ${txHash.slice(0, 16)} on ledger.`);
  return tx;
}

export async function requestFaucet(
  did: string,
  currency: 'USDT' | 'Points',
  amount: number,
  privateKeyHex: string
): Promise<WalletTransaction> {
  const faucetDid = 'did:pitchos:faucet';
  return await createTransaction(
    faucetDid,
    did,
    amount,
    currency,
    'faucet',
    privateKeyHex
  );
}

export async function createNewWallet(): Promise<WalletState> {
  const keys = await generateWalletKeyPair();
  
  const wallet: WalletState = {
    ...keys,
    balance: 0,
    points: 0
  };

  saveLocalWallet(wallet);

  // Seed initial welcome tokens on ledger
  await requestFaucet(wallet.did, 'USDT', 100, wallet.privateKeyHex);
  await requestFaucet(wallet.did, 'Points', 500, wallet.privateKeyHex);

  const initialBalances = await getWalletBalances(wallet.did);
  return {
    ...wallet,
    ...initialBalances
  };
}

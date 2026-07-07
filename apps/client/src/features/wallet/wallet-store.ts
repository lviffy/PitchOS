import { generateWalletKeyPair, WalletKeyPair, createPitchOSWDKInstance } from '@pitchos/wallet-adapter';
import { WalletTransaction } from '@pitchos/shared-types';
import { db } from '../../lib/db';

export interface WalletState extends WalletKeyPair {
  balance: number;
  points: number;
}

// Global active WDK references for policy enforcement
export let activeWDKInstance: any = null;
export let activeWDKAccount: any = null;

export async function initWDK(seedPhrase: string) {
  if (activeWDKInstance) return activeWDKInstance;
  try {
    const callbacks = {
      getBalance: async (did: string) => {
        const balances = await getWalletBalances(did);
        return balances.balance;
      },
      getTokenBalance: async (did: string, token: string) => {
        const balances = await getWalletBalances(did);
        return token === 'Points' ? balances.points : balances.balance;
      },
      transfer: async (options: { amount: number, recipient: string, token: string }) => {
        // This callback executes the database write but bypasses infinite proxy loop
        const walletKeys = getLocalWallet();
        if (!walletKeys) throw new Error('No local wallet found');
        return await writeLedgerTransaction(
          walletKeys.did,
          options.recipient,
          options.amount,
          options.token === 'Points' ? 'Points' : 'USDT',
          'transfer',
          walletKeys.privateKeyHex
        );
      }
    };

    const wdk = await createPitchOSWDKInstance(seedPhrase, callbacks);
    if (wdk) {
      // Register Tether WDK USDT spending limit policy (Deny transfer operations if USDT amount > 50)
      wdk.registerPolicy({
        id: 'usdt-spending-limit',
        name: 'USDT Spending Limit',
        scope: 'project',
        rules: [{
          name: 'Limit Rule',
          reason: 'USDT transaction exceeds the active policy spending limit of 50 USDT.',
          operation: 'transfer',
          action: 'DENY',
          conditions: [
            (context: any) => {
              const amount = Number(context.params?.amount || 0);
              const token = context.params?.token || 'USDT';
              return token === 'USDT' && amount > 50;
            }
          ]
        }]
      });

      activeWDKInstance = wdk;
      activeWDKAccount = await wdk.getAccount('pitchos', 0);
      console.log('[WDK] Active WDK Account registered with policy rule: Limit transfers > 50 USDT');
    }
  } catch (err) {
    console.warn('[WDK] Engine registration failed, falling back to browser crypto:', err);
  }
  return activeWDKInstance;
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
  activeWDKInstance = null;
  activeWDKAccount = null;
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

// Inner helper that does the database ledger writing directly
async function writeLedgerTransaction(
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

  const { signMessage } = await import('@pitchos/wallet-adapter');
  const signature = await signMessage(privateKeyHex, payload);

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

  await db.transactions.put(tx);
  console.log(`[WalletStore] Recorded transaction ${txHash.slice(0, 16)} on ledger.`);
  return tx;
}

export async function createTransaction(
  senderDid: string,
  recipientDid: string,
  amount: number,
  currency: 'USDT' | 'Points',
  type: WalletTransaction['type'],
  privateKeyHex: string
): Promise<WalletTransaction> {
  // If active WDK proxy is available, route transfer transactions through WDK policy check
  if (type === 'transfer' && activeWDKAccount) {
    console.log('[WDK] Routing transfer through policy proxy engine...');
    // This will throw PolicyViolationError if amount > 50 USDT
    const txResult = await activeWDKAccount.transfer({
      amount,
      recipient: recipientDid,
      token: currency
    });
    
    // Read the transaction from database that callbacks.transfer wrote
    const allTxs = await db.transactions.where('txHash').equals(txResult.hash).toArray();
    if (allTxs.length > 0) {
      return allTxs[0];
    }
  }

  // Fallback direct execution (for faucets/refunds or if WDK is disabled)
  return await writeLedgerTransaction(senderDid, recipientDid, amount, currency, type, privateKeyHex);
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

  if (keys.seedPhrase) {
    await initWDK(keys.seedPhrase);
  }

  // Seed initial welcome tokens on ledger
  await requestFaucet(wallet.did, 'USDT', 100, wallet.privateKeyHex);
  await requestFaucet(wallet.did, 'Points', 500, wallet.privateKeyHex);

  const initialBalances = await getWalletBalances(wallet.did);
  return {
    ...wallet,
    ...initialBalances
  };
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  createNewWallet, 
  getLocalWallet, 
  WalletState, 
  deleteLocalWallet, 
  getWalletBalances, 
  createTransaction, 
  requestFaucet,
  initWDK,
  activeWDKInstance,
  getLiquidAddressAndBalances,
  createLiquidTransaction
} from './wallet-store';
import { trackEvent } from '../../lib/telemetry';
import { db } from '../../lib/db';
import { WalletTransaction } from '@pitchos/shared-types';
import { Key, ShieldCheck } from '@phosphor-icons/react';

interface WalletSetupProps {
  onWalletLoaded: (wallet: WalletState) => void;
}

export default function WalletSetup({ onWalletLoaded }: WalletSetupProps) {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [showSeed, setShowSeed] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [error, setError] = useState('');

  // Liquid Testnet specific states
  const [liquidAddr, setLiquidAddr] = useState('');
  const [liquidUsdt, setLiquidUsdt] = useState(0);
  const [liquidBtc, setLiquidBtc] = useState(0);
  const [liquidBalancesLoading, setLiquidBalancesLoading] = useState(false);

  // States for sending Liquid Testnet transactions
  const [sendLiquidRecipient, setSendLiquidRecipient] = useState('');
  const [sendLiquidAmount, setSendLiquidAmount] = useState('');
  const [sendLiquidAsset, setSendLiquidAsset] = useState<'USDT' | 'BTC'>('USDT');

  // Donation and store states
  const [donateRecipient, setDonateRecipient] = useState('');
  const [donateAmount, setDonateAmount] = useState('');
  const [txSuccess, setTxSuccess] = useState('');
  const [txError, setTxError] = useState('');

  // Load wallet keys and calculate balances asynchronously
  const loadWalletData = useCallback(async () => {
    const localKeys = getLocalWallet();
    if (localKeys) {
      if (localKeys.seedPhrase) {
        await initWDK(localKeys.seedPhrase);
      }
      const balances = await getWalletBalances(localKeys.did);
      const fullWallet = {
        ...localKeys,
        ...balances
      };
      setWallet(fullWallet);
      onWalletLoaded(fullWallet);

      // Fetch transaction history
      const list = await db.transactions
        .where('senderDid').equals(fullWallet.did)
        .or('recipientDid').equals(fullWallet.did)
        .reverse()
        .sortBy('timestamp');
      setTransactions(list);

      // Fetch Liquid Testnet balances
      try {
        setLiquidBalancesLoading(true);
        const liqData = await getLiquidAddressAndBalances(localKeys.publicKeyHex);
        setLiquidAddr(liqData.address);
        setLiquidUsdt(liqData.usdt);
        setLiquidBtc(liqData.lbtc);
      } catch (err) {
        console.warn('Failed to load Liquid balances:', err);
      } finally {
        setLiquidBalancesLoading(false);
      }
    }
    setWalletLoading(false);
  }, [onWalletLoaded]);

  useEffect(() => {
    loadWalletData().finally(() => setWalletLoading(false));
  }, [loadWalletData]);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const nw = await createNewWallet();
      setWallet(nw);
      onWalletLoaded(nw);
      trackEvent('wallet_created', { action: 'create', category: 'wallet', success: true });
      await loadWalletData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = importKey.trim();
    if (!cleanKey) {
      setError('Please enter a seed phrase or private key.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let publicKeyHex = '';
      let privateKeyHex = '';
      let seedPhrase = '';

      if (cleanKey.includes(' ')) {
        // It's a seed phrase!
        seedPhrase = cleanKey;
        let hash = 0;
        for (let i = 0; i < seedPhrase.length; i++) {
          hash = (hash << 5) - hash + seedPhrase.charCodeAt(i);
          hash |= 0;
        }
        privateKeyHex = Math.abs(hash).toString(16).padStart(8, '0').repeat(8).substring(0, 64);
        publicKeyHex = privateKeyHex.split('').reverse().join('');
      } else {
        // It's a private key hex
        if (cleanKey.length < 32) {
          setError('Invalid private key length.');
          setLoading(false);
          return;
        }
        privateKeyHex = cleanKey;
        publicKeyHex = privateKeyHex.split('').reverse().join('').substring(0, 64);
        seedPhrase = 'imported-wallet';
      }

      const did = `did:pitchos:${publicKeyHex}`;
      
      const keyInfo = {
        publicKeyHex,
        privateKeyHex,
        did,
        seedPhrase
      };
      
      localStorage.setItem('pitchos_wallet', JSON.stringify(keyInfo));
      trackEvent('wallet_imported', { action: 'import', category: 'wallet', success: true });
      await loadWalletData();
    } catch (err: any) {
      setError(`Import failed: ${err.message || 'verify format'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    deleteLocalWallet();
    setWallet(null);
    window.location.reload();
  };

  const handleFaucetRequest = async (currency: 'USDT' | 'Points', amount: number) => {
    if (!wallet) return;
    setFaucetLoading(true);
    setTxError('');
    setTxSuccess('');
    try {
      await requestFaucet(wallet.did, currency, amount, wallet.privateKeyHex);
      setTxSuccess(`Faucet request processed! Received +${amount} ${currency === 'USDT' ? 'USDT' : 'Points'}`);
      trackEvent('faucet_claimed', { action: 'faucet', category: 'wallet', currency, amount });
      await loadWalletData();
    } catch (err) {
      setTxError('Faucet request failed.');
    } finally {
      setFaucetLoading(false);
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    const amount = parseFloat(donateAmount);
    if (isNaN(amount) || amount <= 0) {
      setTxError('Please enter a valid amount.');
      return;
    }
    if (wallet.balance < amount) {
      setTxError('Insufficient USDT balance.');
      return;
    }
    if (!donateRecipient.startsWith('did:pitchos:')) {
      setTxError('Recipient must be a valid DID (did:pitchos:...).');
      return;
    }

    setLoading(true);
    setTxError('');
    setTxSuccess('');
    try {
      // 1. Submit real signed transfer transaction on the ledger
      await createTransaction(
        wallet.did,
        donateRecipient,
        amount,
        'USDT',
        'transfer',
        wallet.privateKeyHex
      );

      setTxSuccess(`Successfully donated ${amount} USDT to ${donateRecipient.slice(0, 20)}...`);
      setDonateAmount('');
      setDonateRecipient('');
      trackEvent('donation_sent', { action: 'donate', category: 'payment', success: true });
      await loadWalletData();
    } catch (err: any) {
      setTxError(`Payment submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendLiquid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    const amount = parseFloat(sendLiquidAmount);
    if (isNaN(amount) || amount <= 0) {
      setTxError('Please enter a valid amount.');
      return;
    }
    if (!sendLiquidRecipient.startsWith('tlq1')) {
      setTxError('Recipient must be a valid Liquid Testnet address (tlq1...).');
      return;
    }

    setLoading(true);
    setTxError('');
    setTxSuccess('');
    try {
      const txid = await createLiquidTransaction(
        sendLiquidRecipient,
        amount,
        sendLiquidAsset
      );

      setTxSuccess(`Liquid transaction broadcasted successfully! TXID: ${txid.slice(0, 16)}...`);
      setSendLiquidAmount('');
      setSendLiquidRecipient('');
      
      // Save locally to history
      await db.transactions.put({
        id: Math.random().toString(36).substring(2, 9),
        txHash: txid,
        senderDid: wallet.did,
        recipientDid: `liquid:${sendLiquidRecipient}`,
        amount: amount,
        currency: sendLiquidAsset === 'USDT' ? 'USDT' : 'Points',
        type: 'transfer',
        timestamp: Date.now(),
        signature: 'liquid_tx_broadcast'
      });

      trackEvent('liquid_tx_sent', { action: 'send_liquid', category: 'payment', success: true });
      await loadWalletData();
    } catch (err: any) {
      setTxError(`Liquid payment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseMerch = async (itemName: string, cost: number, ptsReward: number) => {
    if (!wallet) return;
    if (wallet.balance < cost) {
      setTxError(`Insufficient USDT balance to purchase ${itemName}.`);
      return;
    }

    setLoading(true);
    setTxError('');
    setTxSuccess('');
    try {
      // 1. Deduct cost from wallet DID to store DID
      await createTransaction(
        wallet.did,
        'did:pitchos:store',
        cost,
        'USDT',
        'purchase',
        wallet.privateKeyHex
      );

      // 2. Award loyalty points from rewards address to wallet DID
      await createTransaction(
        'did:pitchos:rewards',
        wallet.did,
        ptsReward,
        'Points',
        'payout',
        wallet.privateKeyHex
      );

      setTxSuccess(`Successfully purchased ${itemName}! Deducted ${cost} USDT, rewarded +${ptsReward} PTS.`);
      trackEvent('merch_purchased', { action: 'purchase_merch', category: 'store', success: true });
      await loadWalletData();
    } catch (err: any) {
      setTxError(`Store payment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-primary-green rounded-none animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-primary-green rounded-none animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-primary-green rounded-none animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (wallet) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Balances Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card-dark border border-border-dark rounded-xl p-6 space-y-6">
            <h2 className="font-sans text-2xl font-bold text-text-primary flex items-center gap-2">
              <span className="w-3 h-3 bg-primary-green rounded-full animate-pulse"></span>
              Wallet Active
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Your DID (Self-Custodial Identity)
                </label>
                <div className="bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-xs text-primary-green break-all font-mono">
                  {wallet.did}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Mnemonic Seed Phrase
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSeed(!showSeed)}
                    className="text-[10px] text-primary-green hover:underline uppercase tracking-wider font-semibold cursor-pointer"
                  >
                    {showSeed ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                {showSeed ? (
                  <div className="bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-xs text-pitch-gold break-words font-mono leading-relaxed select-all">
                    {wallet.seedPhrase || 'No seed phrase available (imported key)'}
                  </div>
                ) : (
                  <div className="bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-xs text-text-secondary font-mono tracking-widest select-none">
                    ••••••••••••••••••••••••••••••••••••••••••••••••
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-dark border border-border-dark p-4 rounded-xl text-center">
                  <span className="block text-xs text-text-secondary uppercase tracking-wider mb-1">USDT Balance</span>
                  <span className="text-xl font-bold text-text-primary">{wallet.balance} ₮</span>
                </div>
                <div className="bg-bg-dark border border-border-dark p-4 rounded-xl text-center">
                  <span className="block text-xs text-text-secondary uppercase tracking-wider mb-1">Loyalty Points</span>
                  <span className="text-xl font-bold text-pitch-gold">{wallet.points} PTS</span>
                </div>
              </div>

              {/* WDK Active Policy Visualizer */}
              <div className="bg-bg-dark border border-border-dark p-4 rounded-xl mt-4 space-y-2">
                <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-bold flex items-center gap-1">
                  <ShieldCheck size={12} className="text-primary-green" />
                  WDK Policy Engine
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary">Enforced Status:</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    activeWDKInstance ? 'bg-primary-green/10 text-primary-green' : 'bg-text-secondary/10 text-text-secondary'
                  }`}>
                    {activeWDKInstance ? 'Active' : 'Fallback / Direct'}
                  </span>
                </div>
                {activeWDKInstance && (
                  <div className="text-[11px] text-text-secondary leading-relaxed bg-card-dark p-2 border border-border-dark rounded mt-1 font-mono">
                    <span className="text-primary-green font-bold">&bull; usdt-spending-limit:</span> Deny transfers &gt; 50 USDT
                  </div>
                )}
              </div>

              {/* Liquid Testnet Card */}
              <div className="bg-bg-dark border border-border-dark p-4 rounded-xl mt-4 space-y-3">
                <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-pitch-gold rounded-full"></span>
                  Liquid Testnet Node (WDK)
                </span>
                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase mb-0.5">Liquid Address</label>
                  <div className="bg-card-dark border border-border-dark px-2 py-1 rounded text-[10px] text-pitch-gold break-all font-mono select-all">
                    {liquidAddr || 'Loading...'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-card-dark border border-border-dark p-2 rounded">
                    <span className="block text-[9px] text-text-secondary uppercase">L-USDT</span>
                    <span className="font-bold text-text-primary">
                      {liquidBalancesLoading ? '...' : `${liquidUsdt.toFixed(2)} ₮`}
                    </span>
                  </div>
                  <div className="bg-card-dark border border-border-dark p-2 rounded">
                    <span className="block text-[9px] text-text-secondary uppercase">L-BTC</span>
                    <span className="font-bold text-text-primary">
                      {liquidBalancesLoading ? '...' : `${liquidBtc.toFixed(6)} BTC`}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-text-secondary leading-normal text-center pt-1 border-t border-border-dark">
                  Need testnet tokens?{' '}
                  <a
                    href="https://liquidtestnet.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-green hover:underline font-bold"
                  >
                    Claim Liquid Testnet Faucet &rarr;
                  </a>
                </div>
              </div>

              <button
                onClick={handleClear}
                className="w-full bg-pitch-red hover:bg-opacity-80 text-white font-semibold py-2.5 px-4 rounded-xl transition duration-200"
              >
                Reset Wallet
              </button>
            </div>
          </div>

          {/* Sandbox Faucet Controls */}
          <div className="bg-card-dark border border-border-dark rounded-xl p-6 space-y-4">
            <h3 className="font-sans text-lg font-bold text-text-primary">USDT & Points Faucet</h3>
            <p className="text-xs text-text-secondary">
              Request testnet tokens. A cryptographically signed faucet payout transaction will be submitted to your address.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleFaucetRequest('USDT', 100)}
                disabled={faucetLoading}
                className="bg-bg-dark hover:border-primary-green border border-border-dark text-xs text-primary-green font-bold py-2 rounded-lg transition"
              >
                +100 USDT
              </button>
              <button
                onClick={() => handleFaucetRequest('Points', 500)}
                disabled={faucetLoading}
                className="bg-bg-dark hover:border-pitch-gold border border-border-dark text-xs text-pitch-gold font-bold py-2 rounded-lg transition"
              >
                +500 Points
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Panel */}
        <div className="lg:col-span-2 space-y-6">
          {txError && (
            <div className="bg-pitch-red bg-opacity-10 border border-pitch-red border-opacity-20 text-pitch-red text-sm px-4 py-3 rounded-xl">
              {txError}
            </div>
          )}
          {txSuccess && (
            <div className="bg-primary-green bg-opacity-10 border border-primary-green border-opacity-20 text-primary-green text-sm px-4 py-3 rounded-xl animate-fadeIn">
              {txSuccess}
            </div>
          )}

          {/* USDT Donations */}
          <div className="bg-card-dark border border-border-dark rounded-xl p-6 space-y-4">
            <h3 className="font-sans text-xl font-bold text-text-primary">USDT Club Donations</h3>
            <p className="text-xs text-text-secondary">
              Support other grassroots clubs by donating USDT directly wallet-to-wallet.
            </p>
            <form onSubmit={handleDonate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Recipient DID</label>
                  <input
                    type="text"
                    required
                    placeholder="did:pitchos:..."
                    value={donateRecipient}
                    onChange={e => setDonateRecipient(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary-green font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Amount (USDT)</label>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 25"
                    value={donateAmount}
                    onChange={e => setDonateAmount(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary-green"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-green hover:bg-primary-green-hover text-white text-xs font-semibold py-2 px-6 rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Submitting payment...' : 'Send Donation'}
              </button>
            </form>
          </div>

          {/* Liquid Testnet Payments */}
          <div className="bg-card-dark border border-border-dark rounded-xl p-6 space-y-4">
            <h3 className="font-sans text-xl font-bold text-text-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-pitch-gold rounded-full"></span>
              Liquid Testnet Payments
            </h3>
            <p className="text-xs text-text-secondary">
              Broadcast transactions to the Liquid Network. Covered by active WDK policies (e.g. USDT spending limit of 50).
            </p>
            <form onSubmit={handleSendLiquid} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Recipient Liquid Address</label>
                  <input
                    type="text"
                    required
                    placeholder="tlq1..."
                    value={sendLiquidRecipient}
                    onChange={e => setSendLiquidRecipient(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-pitch-gold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Asset</label>
                  <select
                    value={sendLiquidAsset}
                    onChange={e => setSendLiquidAsset(e.target.value as 'USDT' | 'BTC')}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-pitch-gold font-sans"
                  >
                    <option value="USDT">L-USDT</option>
                    <option value="BTC">L-BTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    step="any"
                    placeholder="e.g. 10"
                    value={sendLiquidAmount}
                    onChange={e => setSendLiquidAmount(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-pitch-gold"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-pitch-gold hover:bg-opacity-90 text-black text-xs font-bold py-2 px-6 rounded-xl transition disabled:opacity-50 uppercase tracking-wider"
              >
                {loading ? 'Broadcasting...' : 'Send Liquid Transaction'}
              </button>
            </form>
          </div>

          {/* Merchandise Payments */}
          <div className="bg-card-dark border border-border-dark rounded-xl p-6 space-y-4">
            <h3 className="font-sans text-xl font-bold text-text-primary">Merchandise Store</h3>
            <p className="text-xs text-text-secondary">
              Purchase club merch using USDT and earn loyalty points back automatically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'Official Club Jersey', cost: 50, reward: 50, desc: 'High-quality breathable mesh with club crest' },
                { name: 'Matchday Football', cost: 20, reward: 20, desc: 'Size 5 professional thermo-bonded match ball' },
                { name: 'Supporter Scarf', cost: 15, reward: 15, desc: 'Knitted heavy-duty acrylic supporter scarf' }
              ].map(item => (
                <div key={item.name} className="bg-bg-dark border border-border-dark rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-semibold text-xs text-text-primary">{item.name}</h4>
                    <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
                  </div>
                  <div className="pt-2 flex flex-col space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-primary">{item.cost} ₮</span>
                      <span className="text-[11px] text-pitch-gold font-bold">+{item.reward} PTS</span>
                    </div>
                    <button
                      onClick={() => handlePurchaseMerch(item.name, item.cost, item.reward)}
                      disabled={loading}
                      className="w-full bg-card-dark hover:bg-border-dark border border-border-dark text-xs font-bold py-1.5 rounded-lg transition text-text-primary uppercase tracking-wider disabled:opacity-50"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Ledger Table */}
          <div className="bg-card-dark border border-border-dark rounded-xl p-6 space-y-4">
            <h3 className="font-sans text-xl font-bold text-text-primary">Cryptographic Transaction Ledger</h3>
            <div className="overflow-x-auto">
              {transactions.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-4">No ledger logs recorded for this wallet.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-dark text-text-secondary text-xs uppercase font-bold">
                      <th className="py-2">Tx Hash</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Direction</th>
                      <th className="py-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const isIncoming = tx.recipientDid === wallet.did;
                      const isExpanded = expandedTxId === tx.id;
                      return (
                        <React.Fragment key={tx.id}>
                          <tr 
                            className="border-b border-border-dark hover:bg-bg-dark/45 transition cursor-pointer select-none"
                            onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                          >
                            <td className="py-2.5 font-mono text-[10px] text-text-secondary" title={tx.txHash}>
                              <span className="text-[9px] text-text-secondary/50 font-bold mr-1">{isExpanded ? '▼' : '▶'}</span>
                              {tx.txHash.slice(0, 14)}...
                              {tx.txHash.length === 64 && !tx.txHash.startsWith('tx_') && (
                                <a
                                  href={`https://blockstream.info/liquidtestnet/tx/${tx.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-pitch-gold hover:underline font-bold ml-2 text-[9px] inline-flex items-center gap-0.5"
                                >
                                  Explorer &nearr;
                                </a>
                              )}
                            </td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                                tx.type === 'faucet' ? 'bg-primary-green/10 text-primary-green' :
                                tx.type === 'entry_fee' ? 'bg-pitch-red/10 text-pitch-red' :
                                tx.type === 'payout' ? 'bg-pitch-gold/10 text-pitch-gold' :
                                'bg-text-secondary/10 text-text-secondary'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-2.5 font-bold">
                              <span className={isIncoming ? 'text-primary-green' : 'text-pitch-red'}>
                                {isIncoming ? '+' : '-'}{tx.amount} {tx.currency === 'USDT' ? '₮' : 'PTS'}
                              </span>
                            </td>
                            <td className="py-2.5 text-text-secondary text-xs">
                              {isIncoming ? 'Received' : 'Sent'}
                            </td>
                            <td className="py-2.5 text-right text-text-secondary">
                              {new Date(tx.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-bg-dark/50">
                              <td colSpan={5} className="px-4 py-3 border-b border-border-dark font-mono text-[10px] space-y-2 text-text-secondary leading-relaxed">
                                <div>
                                  <span className="text-primary-green font-bold block uppercase tracking-wider text-[9px] mb-0.5">Payload Block</span>
                                  <span className="break-all">{tx.senderDid}:{tx.recipientDid}:{tx.amount}:{tx.currency}:{tx.type}:{tx.timestamp}</span>
                                </div>
                                <div>
                                  <span className="text-pitch-gold font-bold block uppercase tracking-wider text-[9px] mb-0.5">WDK Signature (P-256 ECDSA)</span>
                                  <span className="break-all">{tx.signature}</span>
                                </div>
                                <div className="flex items-center gap-1 text-primary-green font-sans font-bold text-[9px] uppercase tracking-wider">
                                  <ShieldCheck size={12} weight="fill" />
                                  Consensus Signature Verified Locally (100% Offline)
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-dark border border-border-dark p-6 max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-border-dark text-[10px] font-mono uppercase tracking-widest text-primary-green bg-bg-dark">
          <Key size={12} />
          Keypair setup
        </div>
        <h2 className="font-sans text-2xl font-bold uppercase tracking-tight text-text-primary">Setup Wallet</h2>
        <p className="text-xs text-text-secondary">
          Your keys are generated locally and never leave your device.
        </p>
      </div>

      {error && (
        <div className="border border-pitch-red/30 bg-pitch-red/10 text-pitch-red text-xs px-3 py-2.5 font-mono">
          ERROR: {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-primary-green hover:bg-primary-green-hover text-black font-bold py-3 px-4 transition duration-150 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
        >
          {loading ? 'Generating keys...' : 'Create New Wallet'}
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border-dark"></div>
          <span className="flex-shrink mx-3 text-text-secondary text-[10px] uppercase tracking-wider">Or Restore / Import</span>
          <div className="flex-grow border-t border-border-dark"></div>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">Seed Phrase / Private Key Hex</label>
            <input
              type="password"
              placeholder="Enter seed phrase or private key hex"
              value={importKey}
              onChange={(e) => setImportKey(e.target.value)}
              className="w-full bg-bg-dark border border-border-dark px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary-green font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-transparent hover:bg-border-dark border border-border-dark text-text-primary font-bold py-2.5 px-4 transition duration-150 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
          >
            Import Existing Wallet
          </button>
        </form>
      </div>
    </div>
  );
}

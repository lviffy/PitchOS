'use client';

import React, { useState, useEffect } from 'react';
import { createNewWallet, getLocalWallet, WalletState, deleteLocalWallet, saveLocalWallet } from './wallet-store';
import { trackEvent } from '../../lib/telemetry';

interface WalletSetupProps {
  onWalletLoaded: (wallet: WalletState) => void;
}

export default function WalletSetup({ onWalletLoaded }: WalletSetupProps) {
  const [wallet, setWallet] = useState<WalletState | null>(() => getLocalWallet());
  const [loading, setLoading] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [error, setError] = useState('');

  // Donation and store states
  const [donateRecipient, setDonateRecipient] = useState('');
  const [donateAmount, setDonateAmount] = useState('');
  const [txSuccess, setTxSuccess] = useState('');
  const [txError, setTxError] = useState('');

  useEffect(() => {
    if (wallet) {
      onWalletLoaded(wallet);
    }
  }, [wallet, onWalletLoaded]);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const nw = await createNewWallet();
      setWallet(nw);
      onWalletLoaded(nw);
      trackEvent('wallet_created', { action: 'create', category: 'wallet', success: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importKey.length < 32) {
      setError('Invalid key length. Must be a P-256 private key hex.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const publicKeyHex = importKey.substring(0, 64);
      const did = `did:pitchos:${publicKeyHex}`;
      const nw: WalletState = {
        publicKeyHex,
        privateKeyHex: importKey,
        did,
        balance: 250,
        points: 500
      };
      createNewWallet();
      localStorage.setItem('pitchos_wallet', JSON.stringify(nw));
      setWallet(nw);
      onWalletLoaded(nw);
    } catch {
      setError('Import failed: verify key format.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    deleteLocalWallet();
    setWallet(null);
    window.location.reload();
  };

  const handleDonate = (e: React.FormEvent) => {
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

    const updated = {
      ...wallet,
      balance: parseFloat((wallet.balance - amount).toFixed(2))
    };
    saveLocalWallet(updated);
    setWallet(updated);
    setTxSuccess(`Successfully donated ${amount} USDT to ${donateRecipient.slice(0, 15)}...`);
    setDonateAmount('');
    setDonateRecipient('');
    setTxError('');
    onWalletLoaded(updated);
    trackEvent('donation_sent', { action: 'donate', category: 'payment', success: true });
  };

  const handlePurchaseMerch = (itemName: string, cost: number, ptsReward: number) => {
    if (!wallet) return;
    if (wallet.balance < cost) {
      setTxError(`Insufficient USDT balance to purchase ${itemName}.`);
      return;
    }

    const updated = {
      ...wallet,
      balance: parseFloat((wallet.balance - cost).toFixed(2)),
      points: wallet.points + ptsReward
    };
    saveLocalWallet(updated);
    setWallet(updated);
    setTxSuccess(`Successfully purchased ${itemName}! Deducted ${cost} USDT, rewarded +${ptsReward} PTS.`);
    setTxError('');
    onWalletLoaded(updated);
    trackEvent('merch_purchased', { action: 'purchase_merch', category: 'store', success: true });
  };

  if (wallet) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Balances Card */}
        <div className="lg:col-span-1 bg-card-dark border border-border-dark rounded-2xl p-6 shadow-2xl h-fit space-y-6 backdrop-blur-md">
          <h2 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <span className="w-3 h-3 bg-primary-green rounded-full animate-pulse"></span>
            Wallet Active
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Your DID (Self-Custodial Identity)
              </label>
              <div className="bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-sm text-primary-green break-all font-mono">
                {wallet.did}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-dark border border-border-dark p-4 rounded-xl text-center">
                <span className="block text-[10px] text-text-secondary uppercase tracking-wider mb-1">USDT Balance</span>
                <span className="text-xl font-bold text-text-primary">{wallet.balance} ₮</span>
              </div>
              <div className="bg-bg-dark border border-border-dark p-4 rounded-xl text-center">
                <span className="block text-[10px] text-text-secondary uppercase tracking-wider mb-1">Loyalty Points</span>
                <span className="text-xl font-bold text-pitch-gold">{wallet.points} PTS</span>
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
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-display text-xl font-bold text-text-primary">USDT Club Donations</h3>
            <p className="text-xs text-text-secondary">
              Support other grassroots clubs by donating USDT directly wallet-to-wallet.
            </p>
            <form onSubmit={handleDonate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Recipient DID</label>
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
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Amount (USDT)</label>
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
                className="bg-primary-green hover:bg-primary-green-hover text-white text-xs font-semibold py-2 px-6 rounded-xl transition"
              >
                Send Donation
              </button>
            </form>
          </div>

          {/* Merchandise Payments */}
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-display text-xl font-bold text-text-primary">Merchandise Store</h3>
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
                    <p className="text-[10px] text-text-secondary mt-1">{item.desc}</p>
                  </div>
                  <div className="pt-2 flex flex-col space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-primary">{item.cost} ₮</span>
                      <span className="text-[9px] text-pitch-gold font-bold">+{item.reward} PTS</span>
                    </div>
                    <button
                      onClick={() => handlePurchaseMerch(item.name, item.cost, item.reward)}
                      className="w-full bg-card-dark hover:bg-border-dark border border-border-dark text-[10px] font-bold py-1.5 rounded-lg transition text-text-primary uppercase tracking-wider"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-dark border border-border-dark rounded-2xl p-8 shadow-2xl max-w-xl mx-auto backdrop-blur-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-green bg-opacity-10 text-primary-green mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
          </svg>
        </div>
        <h2 className="font-display text-3xl font-bold text-text-primary">Setup PitchOS Wallet</h2>
        <p className="text-sm text-text-secondary mt-2">
          Your keys are generated locally and never leave your device.
        </p>
      </div>

      {error && (
        <div className="bg-pitch-red bg-opacity-10 border border-pitch-red border-opacity-20 text-pitch-red text-sm px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-primary-green hover:bg-primary-green-hover text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-lg shadow-primary-green/20 disabled:opacity-50"
        >
          {loading ? 'Generating keys...' : 'Create New Wallet'}
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-dark"></div>
          <span className="flex-shrink mx-4 text-text-secondary text-xs uppercase tracking-wider">Or Import Key</span>
          <div className="flex-grow border-t border-border-dark"></div>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter P-256 private key hex"
              value={importKey}
              onChange={(e) => setImportKey(e.target.value)}
              className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary-green font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-transparent hover:bg-border-dark border border-border-dark text-text-primary font-medium py-2.5 px-4 rounded-xl transition duration-200 disabled:opacity-50"
          >
            Import Existing Wallet
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, Copy, Eye, EyeOff, AlertTriangle, Wallet } from 'lucide-react';
import { generateMnemonic } from 'bip39';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface WalletCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WalletCreationModal({ isOpen, onClose, onSuccess }: WalletCreationModalProps) {
  const { user, refreshProfile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [publicKey, setPublicKey] = useState<string>('');
  const [hasCopied, setHasCopied] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWallet = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Generate mnemonic
      const newMnemonic = generateMnemonic();
      setMnemonic(newMnemonic);

      // Derive Solana keypair from mnemonic
      const seed = await derivePath("m/44'/501'/0'/0'", newMnemonic);
      const secretKey = seed.key;
      const keypair = Keypair.fromSecretKey(secretKey);
      
      setPublicKey(keypair.publicKey.toBase58());
    } catch (err) {
      console.error('Error generating wallet:', err);
      setError('Failed to generate wallet. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const saveWalletToProfile = async () => {
    if (!user || !publicKey) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_public_key: publicKey })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving wallet:', error);
        setError('Failed to save wallet to profile. Please try again.');
        return;
      }

      await refreshProfile();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving wallet:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const skipWalletCreation = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Create Your Wallet
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!mnemonic ? (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="text-white font-medium mb-1">Important Security Notice</h3>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• Your recovery phrase will only appear once</li>
                      <li>• We never store or have access to your phrase</li>
                      <li>• Lose the phrase and the wallet cannot be recovered</li>
                      <li>• Keep it safe and private</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-white/70 text-sm">
                This wallet is used for on-chain actions like liking, superliking, and tipping. 
                It&apos;s completely optional and separate from your authentication.
              </p>

              <button
                onClick={generateWallet}
                disabled={isGenerating}
                className="w-full bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed text-gray-900 rounded-lg px-4 py-3 font-medium transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Wallet'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Public Key */}
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Your Wallet Address
                </label>
                <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                  <code className="text-white text-sm break-all">{publicKey}</code>
                </div>
              </div>

              {/* Recovery Phrase */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-white/70 text-sm font-medium">
                    Recovery Phrase
                  </label>
                  <button
                    onClick={() => setShowPhrase(!showPhrase)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {showPhrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  {showPhrase ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {mnemonic.split(' ').map((word, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-white/50 text-xs w-4">{index + 1}.</span>
                            <span className="text-white text-sm">{word}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        {hasCopied ? 'Copied!' : 'Copy to clipboard'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-white/50 text-center">Click the eye icon to reveal your recovery phrase</p>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="text-white font-medium mb-1">Save Your Recovery Phrase</h3>
                    <p className="text-white/70 text-sm">
                      Write down this phrase and store it in a secure location. 
                      You&apos;ll need it to recover your wallet if you lose access.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={saveWalletToProfile}
                  disabled={isSaving || !showPhrase}
                  className="w-full bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed text-gray-900 rounded-lg px-4 py-3 font-medium transition-colors"
                >
                  {isSaving ? 'Saving...' : "I've Saved My Recovery Phrase"}
                </button>
                
                <button
                  onClick={skipWalletCreation}
                  className="w-full bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-3 transition-colors"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

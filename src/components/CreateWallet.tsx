'use client';

import { useState } from 'react';
import { Keypair } from '@solana/web3.js';
import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

interface WalletInfo {
  publicKey: string;
  secretPhrase: string;
}

interface CreateWalletProps {
  onWalletCreated: (wallet: WalletInfo) => void;
  onSkip: () => void;
}

export function CreateWallet({ onWalletCreated, onSkip }: CreateWalletProps) {
  const [secretPhrase, setSecretPhrase] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [publicKey, setPublicKey] = useState<string>('');

  const generateWallet = async () => {
    setIsGenerating(true);
    
    try {
      // Generate a new mnemonic phrase
      const mnemonic = generateMnemonic();
      setSecretPhrase(mnemonic);

      // Convert mnemonic to seed
      const seed = mnemonicToSeedSync(mnemonic);

      // Derive Solana keypair from seed (using standard derivation path)
      const derivationPath = "m/44'/501'/0'/0'";
      const derivedKey = derivePath(derivationPath, seed.toString('hex')).key;
      
      // Create keypair from derived key
      const keypair = Keypair.fromSecretKey(derivedKey);
      
      setPublicKey(keypair.publicKey.toBase58());
      setIsCreated(true);
    } catch (error) {
      console.error('Error generating wallet:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    if (secretPhrase && publicKey) {
      // Store wallet info locally (encrypted in a real app)
      const walletInfo: WalletInfo = {
        publicKey,
        secretPhrase
      };
      
      // Store in localStorage (in production, use more secure storage)
      localStorage.setItem('pinder_wallet', JSON.stringify(walletInfo));
      
      onWalletCreated(walletInfo);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isCreated) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Wallet Created Successfully!
          </h2>
          <p className="text-gray-600">
            Your wallet has been generated. Save your secret phrase securely.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Public Key
            </label>
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
              {publicKey}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret Recovery Phrase
            </label>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="grid grid-cols-3 gap-2 text-sm font-mono">
                {secretPhrase.split(' ').map((word, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-gray-500 mr-2">{index + 1}.</span>
                    <span>{word}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2">
              ⚠️ Save this phrase in a secure location. We cannot recover it for you.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => copyToClipboard(secretPhrase)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Copy Phrase
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your Wallet
        </h2>
        <p className="text-gray-600">
          Generate a new Solana wallet to use on PumpInder
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🔐 Security Notice</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your wallet is generated locally on your device</li>
            <li>• We have zero access to your secret phrase</li>
            <li>• Save your phrase securely to recover your wallet</li>
            <li>• Never share your secret phrase with anyone</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Skip for Now
          </button>
          <button
            onClick={generateWallet}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Wallet'}
          </button>
        </div>
      </div>
    </div>
  );
}

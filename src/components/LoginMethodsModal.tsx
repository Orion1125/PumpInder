'use client';

import { useState } from 'react';
import { Twitter } from 'lucide-react';

interface LoginMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LinkedProvider = 'x' | 'google' | null;

interface LinkedAccount {
  provider: LinkedProvider;
  isConnected: boolean;
}

function GoogleGIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" role="presentation">
      <path
        fill="#4285F4"
        d="M21.35 11.1H12v3.78h5.35c-.24 1.18-1.4 3.47-5.35 3.47-3.23 0-5.85-2.65-5.85-5.9s2.62-5.9 5.85-5.9c1.85 0 3.09.79 3.8 1.45l2.59-2.49C16.57 3.75 14.46 2.9 12 2.9 6.98 2.9 2.9 6.98 2.9 12s4.08 9.1 9.1 9.1c5.21 0 8.63-3.65 8.63-8.78 0-.5-.09-1.07-.28-1.22Z"
      />
      <path fill="#34A853" d="M12 22c2.43 0 4.48-.8 5.97-2.17l-2.83-2.19c-.79.55-1.8.89-3.14.89-2.41 0-4.45-1.62-5.18-3.8H3.9v2.39C5.39 19.92 8.43 22 12 22Z" />
      <path fill="#FBBC05" d="M6.82 14.73c-.19-.59-.3-1.21-.3-1.86 0-.65.11-1.27.3-1.86V8.62H3.9A9.09 9.09 0 0 0 3 12c0 1.18.21 2.31.9 3.38z" />
      <path fill="#EA4335" d="M12 7.37c1.32 0 2.35.45 3.07 1.04l2.3-2.24C16.47 4.96 14.43 4 12 4 8.43 4 5.39 6.08 3.9 9.27l2.92 2.34C7.55 8.99 9.59 7.37 12 7.37Z" />
    </svg>
  );
}

export default function LoginMethodsModal({ isOpen, onClose }: LoginMethodsModalProps) {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([
    { provider: 'x', isConnected: false },
    { provider: 'google', isConnected: false },
  ]);
  const [isConnecting, setIsConnecting] = useState<LinkedProvider>(null);

  const handleConnect = async (provider: LinkedProvider) => {
    if (!provider) return;
    
    setIsConnecting(provider);
    
    // Simulate OAuth connection
    setTimeout(() => {
      setLinkedAccounts((prev: LinkedAccount[]) =>
        prev.map((account: LinkedAccount) =>
          account.provider === provider
            ? { ...account, isConnected: true }
            : account
        )
      );
      setIsConnecting(null);
    }, 1500);
  };

  const handleDisconnect = (provider: LinkedProvider) => {
    if (!provider) return;
    
    setLinkedAccounts((prev: LinkedAccount[]) =>
      prev.map((account: LinkedAccount) =>
        account.provider === provider
          ? { ...account, isConnected: false }
          : account
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="onboarding-card wallet-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="wallet-modal__close"
          onClick={onClose}
          aria-label="Close login methods modal"
        >
          ×
        </button>
        
        <h2 className="display-font text-4xl leading-tight tracking-widest">LOGIN METHODS</h2>
        
        <div className="mt-6 space-y-4">
          <p className="ui-font text-sm text-ink-secondary">
            Link accounts to log back in easily if you log out. These connections are for authentication only and do not affect wallet ownership or access.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* X (Twitter) Option */}
          <div className="login-method-option">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 border-2 border-black rounded-md bg-white hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#121212] active:translate-y-[2px] active:shadow-[0px_0px_0px_#121212] transition-all duration-200"
              onClick={() => {
                const xAccount = linkedAccounts.find((a: LinkedAccount) => a.provider === 'x');
                if (xAccount?.isConnected) {
                  handleDisconnect('x');
                } else {
                  handleConnect('x');
                }
              }}
              disabled={isConnecting !== null}
            >
              <div className="flex items-center gap-3">
                <Twitter size={24} className="text-[#5D5FEF]" />
                <div className="text-left">
                  <div className="font-mono text-sm font-bold tracking-wider uppercase">Connect X (Twitter)</div>
                  <div className="font-mono text-xs text-ink-secondary">
                    {linkedAccounts.find((a: LinkedAccount) => a.provider === 'x')?.isConnected 
                      ? 'Connected' 
                      : 'Link your X account for easy login'
                    }
                  </div>
                </div>
              </div>
              <div className="font-mono text-xs tracking-wider uppercase">
                {isConnecting === 'x' ? 'Connecting...' : 
                 linkedAccounts.find((a: LinkedAccount) => a.provider === 'x')?.isConnected ? 'Disconnect' : 'Connect'}
              </div>
            </button>
          </div>

          {/* Google Option */}
          <div className="login-method-option">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 border-2 border-black rounded-md bg-white hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#121212] active:translate-y-[2px] active:shadow-[0px_0px_0px_#121212] transition-all duration-200"
              onClick={() => {
                const googleAccount = linkedAccounts.find((a: LinkedAccount) => a.provider === 'google');
                if (googleAccount?.isConnected) {
                  handleDisconnect('google');
                } else {
                  handleConnect('google');
                }
              }}
              disabled={isConnecting !== null}
            >
              <div className="flex items-center gap-3">
                <GoogleGIcon />
                <div className="text-left">
                  <div className="font-mono text-sm font-bold tracking-wider uppercase">Connect Google (Gmail)</div>
                  <div className="font-mono text-xs text-ink-secondary">
                    {linkedAccounts.find((a: LinkedAccount) => a.provider === 'google')?.isConnected 
                      ? 'Connected' 
                      : 'Use Gmail for secure login access'
                    }
                  </div>
                </div>
              </div>
              <div className="font-mono text-xs tracking-wider uppercase">
                {isConnecting === 'google' ? 'Connecting...' : 
                 linkedAccounts.find((a: LinkedAccount) => a.provider === 'google')?.isConnected ? 'Disconnect' : 'Connect'}
              </div>
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 border-2 border-black bg-[#F4F4F0] rounded-md">
          <h3 className="font-mono text-xs font-bold tracking-wider uppercase mb-2">Privacy & Security</h3>
          <ul className="font-mono text-xs text-ink-secondary space-y-1">
            <li>• Linked accounts are used for authentication only</li>
            <li>• We never store or access your wallet keys</li>
            <li>• You maintain full control of your wallet</li>
            <li>• Unlink accounts at any time</li>
          </ul>
        </div>

        <div className="wallet-modal__actions mt-8">
          <button
            type="button"
            className="btn-block"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

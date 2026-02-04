'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { decryptPhrase, loadPhraseBackup, clearPhraseBackup, type PhraseBackupPayload } from '@/utils/phraseVault';
import { AppHeader } from '@/components/AppHeader';

export default function SecuritySettingsPage() {
  const [backup, setBackup] = useState<PhraseBackupPayload | null>(() => loadPhraseBackup());
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'decrypting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [recoveredPhrase, setRecoveredPhrase] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);


  const formattedSavedAt = useMemo(() => {
    if (!backup) return '';
    try {
      return new Date(backup.createdAt).toLocaleString();
    } catch (error) {
      console.warn('Unable to format backup timestamp', error);
      return backup.createdAt;
    }
  }, [backup]);

  const handleDecrypt = async () => {
    if (!backup) {
      setError('No encrypted backup found on this device.');
      return;
    }
    if (password.length < 8) {
      setError('Enter the password you created when saving the backup.');
      return;
    }

    try {
      setStatus('decrypting');
      setError('');
      const phrase = await decryptPhrase(backup, password);
      setRecoveredPhrase(phrase);
      setStatus('success');
      setHasCopied(false);
    } catch (err) {
      console.error('Unable to decrypt phrase', err);
      setRecoveredPhrase(null);
      setStatus('error');
      setError('Password is incorrect or the backup has been tampered with.');
    }
  };

  const handleCopy = async () => {
    if (!recoveredPhrase) return;
    try {
      await navigator.clipboard.writeText(recoveredPhrase);
      setHasCopied(true);
    } catch (err) {
      console.error('Unable to copy recovery phrase', err);
      setHasCopied(false);
    }
  };

  const handleClearBackup = () => {
    clearPhraseBackup();
    setBackup(null);
    setRecoveredPhrase(null);
    setPassword('');
    setStatus('idle');
    setError('');
  };

  const passphraseWords = recoveredPhrase?.split(' ') ?? [];
  const isDecryptDisabled = !backup || password.length < 8 || status === 'decrypting';

  return (
    <div className="min-h-screen bg-canvas text-[#121212]">
      <AppHeader logoType="back" showBalance={false} showProfile={false} showNav={false} />
      
      <div className="settings-shell">
        <main className="max-w-3xl mx-auto">
          <div className="onboarding-card" style={{ width: '100%', maxWidth: '100%' }}>
            <div className="space-y-3">
              <p className="ui-font text-sm text-ink-secondary">{/* WALLET SECURITY CONTROL ROOM */}</p>
              <h1 className="display-font text-4xl tracking-[0.3em]">RECOVERY VAULT</h1>
              <p className="ui-font text-sm text-ink-secondary">
                Everything happens locally in your browser — we never transmit your recovery phrase or password.
              </p>
            </div>

          {backup ? (
            <div className="mt-8 space-y-6">
              <div className="wallet-backup-panel">
                <div>
                  <p className="ui-font text-xs text-ink-secondary">Encrypted backup detected</p>
                  <p className="ui-font text-sm">Saved on: {formattedSavedAt}</p>
                </div>
                <label className="ui-font text-xs" htmlFor="vault-password">
                  Enter your backup password
                </label>
                <input
                  id="vault-password"
                  type="password"
                  className="wallet-backup__input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                />
                {error && <p className="wallet-backup__error">{error}</p>}
                <button
                  type="button"
                  className="btn-block"
                  onClick={handleDecrypt}
                  disabled={isDecryptDisabled}
                  style={{ width: '100%' }}
                >
                  {status === 'decrypting' ? 'Unlocking…' : 'Unlock recovery phrase'}
                </button>
              </div>

              {recoveredPhrase && (
                <div className="space-y-4">
                  <div className="wallet-passphrase-box">
                    <ol className="wallet-passphrase-grid">
                      {passphraseWords.map((word, index) => (
                        <li key={`${word}-${index}`}>
                          <span>{index + 1}.</span>
                          <span>{word}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="wallet-modal__actions">
                    <button type="button" className="btn-block" onClick={handleCopy}>
                      {hasCopied ? 'Copied to clipboard' : 'Copy words'}
                    </button>
                    <button type="button" className="wallet-modal__secondary-btn" onClick={handleClearBackup}>
                      Remove encrypted backup from this device
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="wallet-backup-panel mt-8">
              <p className="ui-font text-sm text-ink-secondary">
                No encrypted recovery phrase is stored on this device. Start onboarding or revisit the wallet modal to
                create a backup.
              </p>
              <Link href="/onboarding" className="btn-block" style={{ width: '100%' }}>
                Go to onboarding
              </Link>
            </div>
          )}

          <div className="wallet-modal__note" style={{ marginTop: '2rem' }}>
            Keep this page private. Anyone with your password and access to this device could unlock the wallet.
          </div>
        </div>
      </main>
    </div>
    </div>
  );
}

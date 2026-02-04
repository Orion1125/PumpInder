'use client';

import { useState } from 'react';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { useWallet } from '@/hooks/useWallet';

export default function SocialAuthTest() {
  const { wallet, isConnected, connectWallet } = useWallet();
  const {
    linkedAccounts,
    isLoading,
    error,
    hasLinkedAccount,
    isProviderConnected,
    connectTwitter,
    connectGmail,
    connectTwitterMock,
    connectGmailMock,
    removeSocialAccount,
    fetchLinkedAccounts
  } = useSocialAuth();

  const [testResult, setTestResult] = useState<string>('');

  // Check if environment is configured
  const isEnvironmentConfigured = typeof window !== 'undefined' && 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const handleConnectTwitter = async () => {
    try {
      const result = await connectTwitter();
      setTestResult(`Twitter connection initiated: ${JSON.stringify(result)}`);
    } catch (err) {
      setTestResult(`Twitter connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const result = await connectGmail();
      setTestResult(`Gmail connection initiated: ${JSON.stringify(result)}`);
    } catch (err) {
      setTestResult(`Gmail connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleMockTwitter = async () => {
    try {
      const result = await connectTwitterMock();
      setTestResult(`Mock Twitter connected: ${JSON.stringify(result)}`);
    } catch (err) {
      setTestResult(`Mock Twitter failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleMockGmail = async () => {
    try {
      const result = await connectGmailMock();
      setTestResult(`Mock Gmail connected: ${JSON.stringify(result)}`);
    } catch (err) {
      setTestResult(`Mock Gmail failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRemoveTwitter = async () => {
    try {
      await removeSocialAccount('twitter');
      setTestResult('Twitter account removed successfully');
    } catch (err) {
      setTestResult(`Remove Twitter failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRemoveGmail = async () => {
    try {
      await removeSocialAccount('gmail');
      setTestResult('Gmail account removed successfully');
    } catch (err) {
      setTestResult(`Remove Gmail failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Social Authentication Test</h1>
      
      {/* Environment configuration notice */}
      {!isEnvironmentConfigured && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Environment Not Configured:</p>
          <p>To enable full social authentication features, set up your environment variables:</p>
          <ul className="list-disc list-inside mt-2">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>TWITTER_CLIENT_ID (optional)</li>
            <li>TWITTER_CLIENT_SECRET (optional)</li>
            <li>GMAIL_CLIENT_ID (optional)</li>
            <li>GMAIL_CLIENT_SECRET (optional)</li>
          </ul>
          <p className="mt-2">Without these, the app will use mock functionality for testing.</p>
        </div>
      )}
      
      {!isConnected ? (
        <div className="mb-6">
          <button 
            onClick={connectWallet}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Wallet Info</h2>
            <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
            <p><strong>Wallet Address:</strong> {wallet ? wallet.publicKey : 'Not connected'}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Social Accounts</h2>
            <p><strong>Has Linked Accounts:</strong> {hasLinkedAccount ? 'Yes' : 'No'}</p>
            <p><strong>Twitter Connected:</strong> {isProviderConnected('twitter') ? 'Yes' : 'No'}</p>
            <p><strong>Gmail Connected:</strong> {isProviderConnected('gmail') ? 'Yes' : 'No'}</p>
            
            {linkedAccounts.length > 0 && (
              <div className="mt-2">
                <h3 className="font-medium">Connected Accounts:</h3>
                <ul className="list-disc list-inside">
                  {linkedAccounts.map(account => (
                    <li key={account.id}>
                      {account.provider}: {account.handle || account.email} 
                      {account.verified && ' (Verified)'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Test Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleConnectTwitter}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                Connect Twitter (Real OAuth)
              </button>
              
              <button
                onClick={handleConnectGmail}
                disabled={isLoading}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                Connect Gmail (Real OAuth)
              </button>
              
              <button
                onClick={handleMockTwitter}
                disabled={isLoading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                Connect Twitter (Mock)
              </button>
              
              <button
                onClick={handleMockGmail}
                disabled={isLoading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                Connect Gmail (Mock)
              </button>
              
              <button
                onClick={handleRemoveTwitter}
                disabled={isLoading || !isProviderConnected('twitter')}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                Remove Twitter
              </button>
              
              <button
                onClick={handleRemoveGmail}
                disabled={isLoading || !isProviderConnected('gmail')}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
              >
                Remove Gmail
              </button>
              
              <button
                onClick={fetchLinkedAccounts}
                disabled={isLoading}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded col-span-2"
              >
                Refresh Accounts
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {testResult && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <strong>Test Result:</strong> {testResult}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2">Processing...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
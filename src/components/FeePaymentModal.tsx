'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Coins } from 'lucide-react';
import { useFeePayment } from '@/hooks/useFeePayment';
import { TOKEN_MINTS } from '@/constants/tokens';

type PaymentToken = 'SOL' | 'PINDER';

const PINDER_AVAILABLE = !!TOKEN_MINTS.PINDER; // false until CA is set

interface FeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  pendingFee: {
    type: string;
    amount: number;
    usdAmount?: number;
    recipientWallet: string;
    recipientProxyWallet?: string;
  } | null;
  error: string | null;
  lastPayment: {
    success: boolean;
    signature?: string;
    error?: string;
    recipientWallet: string;
    amountPaid: number;
    actionType: string;
  } | null;
}

export function FeePaymentModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  pendingFee,
  error,
  lastPayment,
}: FeePaymentModalProps) {
  const [paymentToken, setPaymentToken] = useState<PaymentToken>('SOL');

  if (!isOpen) return null;

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'LIKE':
        return 'Like Profile';
      case 'SUPERLIKE':
        return 'Super Like';
      case 'TIP_SMALL':
        return 'Send Small Tip';
      case 'TIP_MEDIUM':
        return 'Send Medium Tip';
      case 'TIP_LARGE':
        return 'Send Large Tip';
      default:
        return 'Complete Action';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-overlay-in">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-3 sm:mx-4 overflow-hidden animate-modal-pop max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Confirm Payment
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {lastPayment ? (
            // Payment Result View
            <div className="text-center py-4">
              {lastPayment.success ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Payment Successful!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {lastPayment.amountPaid} SOL has been sent
                  </p>
                  <p className="text-xs text-gray-500 mb-4 break-all">
                    To proxy wallet: {lastPayment.recipientWallet}
                  </p>
                  {lastPayment.signature && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-500 mb-1">Transaction Signature:</p>
                      <p className="text-xs font-mono text-gray-700 break-all">
                        {lastPayment.signature}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Payment Failed
                  </h3>
                  <p className="text-red-600 mb-4">
                    {lastPayment.error || 'An unknown error occurred'}
                  </p>
                </>
              )}
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : pendingFee ? (
            // Payment Confirmation View
            <div>
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Coins size={32} className="text-blue-600" />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                {getActionLabel(pendingFee.type)}
              </h3>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {pendingFee.amount} SOL
                    {pendingFee.usdAmount != null && (
                      <span className="text-xs text-gray-500 ml-1">(~${pendingFee.usdAmount})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">To (proxy):</span>
                  <span className="font-mono text-xs text-gray-700 break-all">
                    {pendingFee.recipientProxyWallet || pendingFee.recipientWallet}
                  </span>
                </div>
              </div>

              {/* SOL / $PINDER toggle */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Pay with:</span>
                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                  <button
                    type="button"
                    onClick={() => setPaymentToken('SOL')}
                    className={`px-4 py-2 text-xs font-bold tracking-wider transition-colors min-h-[44px] ${
                      paymentToken === 'SOL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    SOL
                  </button>
                  <button
                    type="button"
                    onClick={() => PINDER_AVAILABLE && setPaymentToken('PINDER')}
                    disabled={!PINDER_AVAILABLE}
                    className={`px-4 py-2 text-xs font-bold tracking-wider transition-colors min-h-[44px] ${
                      paymentToken === 'PINDER'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${!PINDER_AVAILABLE ? 'opacity-40 cursor-not-allowed' : ''}`}
                    title={!PINDER_AVAILABLE ? '$PINDER coming soon' : 'Pay with $PINDER'}
                  >
                    $PINDER
                  </button>
                </div>
                {!PINDER_AVAILABLE && (
                  <span className="text-[0.6rem] text-gray-400 uppercase tracking-wider">Coming soon</span>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                This action transfers {paymentToken === 'SOL' ? 'SOL' : '$PINDER'} from your proxy wallet. 10% platform fee included.
              </p>
            </div>
          ) : (
            // Loading State
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Preparing payment...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook wrapper for easier usage
export function useFeePaymentModal() {
  const feePayment = useFeePayment();

  const Modal = () => (
    <FeePaymentModal
      isOpen={feePayment.isModalOpen}
      onClose={feePayment.cancelPayment}
      onConfirm={feePayment.confirmPayment}
      isLoading={feePayment.isLoading}
      pendingFee={feePayment.pendingFee}
      error={feePayment.error}
      lastPayment={feePayment.lastPayment}
    />
  );

  return {
    Modal,
    ...feePayment,
  };
}

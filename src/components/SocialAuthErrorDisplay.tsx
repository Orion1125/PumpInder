'use client';

import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface SocialAuthErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onSkip?: () => void;
  onAlternative?: () => void;
  alternativeLabel?: string;
  showRetry?: boolean;
  showSkip?: boolean;
  showAlternative?: boolean;
  className?: string;
}

export function SocialAuthErrorDisplay({
  error,
  onRetry,
  onSkip,
  onAlternative,
  alternativeLabel = 'Try Alternative',
  showRetry = true,
  showSkip = true,
  showAlternative = true,
  className = '',
}: SocialAuthErrorDisplayProps) {
  return (
    <div className={`social-error-container ${className}`}>
      <div className="social-error-icon">
        <AlertCircle className="w-5 h-5 text-red-500" />
      </div>
      <div className="social-error-content">
        <p className="social-error-title">Connection Failed</p>
        <p className="social-error-message">{error}</p>
        
        <div className="social-error-actions">
          {showRetry && onRetry && (
            <button
              type="button"
              className="social-error-button retry"
              onClick={onRetry}
            >
              <RefreshCw className="w-3 h-3 mr-1 inline" />
              Try Again
            </button>
          )}
          
          {showSkip && onSkip && (
            <button
              type="button"
              className="social-error-button skip"
              onClick={onSkip}
            >
              <X className="w-3 h-3 mr-1 inline" />
              Skip for Now
            </button>
          )}
          
          {showAlternative && onAlternative && (
            <button
              type="button"
              className="social-error-button alternative"
              onClick={onAlternative}
            >
              {alternativeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
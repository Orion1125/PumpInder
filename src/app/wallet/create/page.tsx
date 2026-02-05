'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletCreationModal } from '@/components/WalletCreationModal';

export default function WalletCreatePage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    router.back();
  };

  const handleSuccess = () => {
    router.push('/settings');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <WalletCreationModal
        isOpen={showModal}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

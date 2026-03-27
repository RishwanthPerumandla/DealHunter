'use client';

import { useState, useEffect } from 'react';
import { Edit3, Lock, Plus } from 'lucide-react';
import SubmitDealModal from '@/components/deals/SubmitDealModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

const SUBMISSION_SECRET = 'desideals2024';

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const authorized = localStorage.getItem('desideals_can_submit');
    if (authorized === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  const handleFabClick = () => {
    if (isAuthorized) {
      setShowSubmitModal(true);
    } else {
      setShowAuthModal(true);
    }
    setIsOpen(false);
  };

  const handleAuth = () => {
    if (authCode === SUBMISSION_SECRET) {
      setIsAuthorized(true);
      localStorage.setItem('desideals_can_submit', 'true');
      setAuthError('');
      setShowAuthModal(false);
      setShowSubmitModal(true);
    } else {
      setAuthError('Invalid code. Please contact admin to get the submission code.');
    }
  };

  return (
    <>
      <div className="fixed bottom-5 right-4 z-40 sm:bottom-7 sm:right-6">
        <AnimateFabLabel isOpen={isOpen} isAuthorized={isAuthorized} onClick={handleFabClick} />
        <button
          onClick={() => setIsOpen((value) => !value)}
          className={`mt-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-white shadow-[0_24px_54px_rgba(17,17,17,0.22)] transition-all duration-300 ${
            isOpen
              ? 'bg-neutral-800 rotate-45'
              : 'bg-[linear-gradient(135deg,#111111,#2e5d4b)] hover:-translate-y-1'
          }`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <Modal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} title="Unlock submissions" size="sm">
        <div className="space-y-5 p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950 text-white">
              <Lock className="h-6 w-6" />
            </div>
            <p className="text-sm leading-7 text-neutral-600">
              Deal submissions are currently curated. Enter the submission code to continue.
            </p>
          </div>

          <Input
            type="password"
            placeholder="Enter submission code"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          />

          {authError && <p className="text-sm text-red-600">{authError}</p>}

          <Button onClick={handleAuth} fullWidth>
            Verify and continue
          </Button>
        </div>
      </Modal>

      <SubmitDealModal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} />
    </>
  );
}

function AnimateFabLabel({
  isOpen,
  isAuthorized,
  onClick,
}: {
  isOpen: boolean;
  isAuthorized: boolean;
  onClick: () => void;
}) {
  if (!isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-full border border-black/8 bg-white/90 px-5 py-3 text-sm font-medium text-neutral-700 shadow-[0_20px_40px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
    >
      <span>{isAuthorized ? 'Submit a deal' : 'Submit a deal'}</span>
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isAuthorized ? 'bg-[#2e5d4b] text-white' : 'bg-neutral-900 text-white'}`}>
        {isAuthorized ? <Edit3 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      </div>
    </button>
  );
}

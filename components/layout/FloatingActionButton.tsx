'use client';

import { useState, useEffect } from 'react';
import { Plus, Lock, Edit3 } from 'lucide-react';
import SubmitDealModal from '@/components/deals/SubmitDealModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

// Submission code - must match admin code or be provided to users
const SUBMISSION_SECRET = 'desideals2024';

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [authError, setAuthError] = useState('');

  // Check if user is already authorized
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
      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-gray-800 rotate-45' : 'bg-gradient-to-br from-[#FF9933] to-[#FF7700]'
        }`}
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Quick Action Button (appears when FAB is clicked) */}
      {isOpen && (
        <button
          onClick={handleFabClick}
          className="fixed bottom-24 right-6 z-40 flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50"
        >
          <span className="text-sm font-medium">
            {isAuthorized ? 'Submit a Deal' : 'Submit a Deal (Restricted)'}
          </span>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isAuthorized ? 'bg-[#138808]' : 'bg-gray-500'
          }`}>
            {isAuthorized ? (
              <Edit3 className="w-5 h-5 text-white" />
            ) : (
              <Lock className="w-5 h-5 text-white" />
            )}
          </div>
        </button>
      )}

      {/* Auth Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Submit a Deal"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-600">
              Deal submission is restricted. Please enter the submission code to continue.
            </p>
          </div>

          <Input
            type="password"
            placeholder="Enter submission code"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
          />

          {authError && (
            <p className="text-sm text-red-600">{authError}</p>
          )}

          <Button onClick={handleAuth} fullWidth>
            Verify & Continue
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Contact admin to get the submission code.
          </p>
        </div>
      </Modal>

      {/* Submit Modal */}
      <SubmitDealModal 
        isOpen={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)} 
      />
    </>
  );
}

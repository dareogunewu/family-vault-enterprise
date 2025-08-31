'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Shield } from 'lucide-react';

interface SessionWarningProps {
  timeUntilExpiry: number;
  onExtendSession: () => Promise<boolean>;
  onSignOut: () => void;
}

export const SessionWarning: React.FC<SessionWarningProps> = ({
  timeUntilExpiry,
  onExtendSession,
  onSignOut,
}) => {
  const [isExtending, setIsExtending] = useState(false);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 1000 / 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const success = await onExtendSession();
      if (!success) {
        // If extension failed, redirect to login
        onSignOut();
      }
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-amber-200 bg-amber-50">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold mb-1">Session Expiring Soon</p>
              <p className="text-sm">
                Your session will expire in {formatTime(timeUntilExpiry)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleExtendSession}
              disabled={isExtending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isExtending ? 'Extending...' : 'Extend Session'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onSignOut}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Sign Out
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
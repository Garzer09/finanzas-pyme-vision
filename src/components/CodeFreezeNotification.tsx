import React from 'react';
import { AlertTriangle, Shield, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CODE_FREEZE_ACTIVE, CODE_FREEZE_CONFIG } from '@/utils/codeFreeze';

/**
 * 🚨 CRISIS RESPONSE: Code Freeze Notification
 * 
 * Displays a prominent notification when code freeze is active
 * to inform users about the system stabilization period.
 */
export const CodeFreezeNotification: React.FC = () => {
  // Only show in development or when explicitly enabled
  if (!CODE_FREEZE_ACTIVE || import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-orange-500 text-white">
      <Alert className="border-none bg-transparent text-white rounded-none">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          🚨 CODE FREEZE ACTIVE - SYSTEM STABILIZATION IN PROGRESS
          <Badge variant="destructive" className="bg-red-700 hover:bg-red-800">
            CRITICAL
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Started: {CODE_FREEZE_CONFIG.startDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Reason: {CODE_FREEZE_CONFIG.reason}</span>
            </div>
          </div>
          <div className="mt-1 text-xs opacity-90">
            Only critical fixes and stability improvements are allowed during this period.
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CodeFreezeNotification;
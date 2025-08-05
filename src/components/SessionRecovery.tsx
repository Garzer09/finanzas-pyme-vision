import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * SessionRecovery component handles graceful recovery from session issues
 * Prevents blank screens and provides user-friendly recovery options
 */
export const SessionRecovery: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialized } = useAuth();

  // If we're still initializing, show loading
  if (!initialized) {
    return (
      <div className="min-h-screen bg-steel flex items-center justify-center" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Iniciando aplicación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal operation - render children
  return <>{children}</>;
};
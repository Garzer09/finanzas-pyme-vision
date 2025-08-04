import { useEffect, useRef, useCallback, useState } from 'react';
import { DEFAULT_INACTIVITY_CONFIG, type InactivityConfig } from '@/types/auth';

/**
 * Hook for detecting user inactivity and managing session timeouts
 */
export function useInactivityDetection(
  onWarning: () => void,
  onTimeout: () => void,
  config: InactivityConfig = DEFAULT_INACTIVITY_CONFIG
) {
  const [isWarning, setIsWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const logoutTimeoutRef = useRef<NodeJS.Timeout>();
  const countdownIntervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = undefined;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = undefined;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = undefined;
    }
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarning(false);
    setTimeRemaining(null);
    clearAllTimers();

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setIsWarning(true);
      onWarning();
      
      // Start countdown
      const warningTime = Date.now();
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - warningTime;
        const remaining = Math.max(0, config.warningMs - elapsed);
        setTimeRemaining(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = undefined;
        }
      }, 1000);
      
    }, config.timeoutMs - config.warningMs);

    // Set logout timer
    logoutTimeoutRef.current = setTimeout(() => {
      clearAllTimers();
      onTimeout();
    }, config.timeoutMs);
  }, [config.timeoutMs, config.warningMs, onWarning, onTimeout, clearAllTimers]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    config.events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    resetTimer();

    return () => {
      // Remove event listeners
      config.events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearAllTimers();
    };
  }, [config.events, resetTimer, clearAllTimers]);

  return {
    isWarning,
    timeRemaining,
    resetTimer,
    clearTimers: clearAllTimers
  };
}

/**
 * Exponential backoff retry utility
 */
export function createRetryWithBackoff(
  maxAttempts: number = 3,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 10000
) {
  return async function retry<T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw error;
      }
      
      const delay = Math.min(
        maxDelayMs,
        baseDelayMs * Math.pow(2, attempt - 1)
      );
      
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(operation, attempt + 1);
    }
  };
}
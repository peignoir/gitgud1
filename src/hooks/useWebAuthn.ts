'use client';

import { useState } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export function useWebAuthn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerPasskey = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get registration options from server
      const challengeResponse = await fetch('/api/webauthn/register/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get registration challenge');
      }

      const { options, challenge } = await challengeResponse.json();

      // Start WebAuthn registration
      const credential = await startRegistration(options);

      // Verify registration with server
      const verifyResponse = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, credential, challenge }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Registration verification failed');
      }

      const result = await verifyResponse.json();

      if (result.verified) {
        return result.user;
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Passkey registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticatePasskey = async (email?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get authentication options from server
      const challengeResponse = await fetch('/api/webauthn/authenticate/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!challengeResponse.ok) {
        throw new Error('Failed to get authentication challenge');
      }

      const { options, challenge } = await challengeResponse.json();

      // Start WebAuthn authentication
      const credential = await startAuthentication(options);

      // Verify authentication with server
      const verifyResponse = await fetch('/api/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, credential, challenge }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Authentication verification failed');
      }

      const result = await verifyResponse.json();

      if (result.verified) {
        return result.user;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Passkey authentication failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isSupported = () => {
    return typeof window !== 'undefined' &&
           window.PublicKeyCredential &&
           typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
  };

  return {
    registerPasskey,
    authenticatePasskey,
    isLoading,
    error,
    isSupported,
  };
}
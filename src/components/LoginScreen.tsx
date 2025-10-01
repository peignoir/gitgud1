'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useState, useEffect } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { data: session, status } = useSession();
  const { registerPasskey, authenticatePasskey, isLoading, error, isSupported } = useWebAuthn();
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');

  // Handle successful session in useEffect to avoid updating parent during render
  useEffect(() => {
    if (session?.user) {
      onLoginSuccess(session.user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]); // Only depend on session, not onLoginSuccess to avoid infinite loop

  const handlePasskeyLogin = async () => {
    try {
      const user = await authenticatePasskey();
      onLoginSuccess(user);
    } catch (err) {
      console.error('Passkey login failed:', err);
    }
  };

  const handlePasskeyRegister = async () => {
    if (!email.trim()) {
      alert('Please enter your email address first');
      return;
    }

    try {
      const user = await registerPasskey(email);
      onLoginSuccess(user);
    } catch (err) {
      console.error('Passkey registration failed:', err);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-700">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (session) {
    // Session handling moved to useEffect above
    return null;
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome to GitGud AI
          </h2>
          <p className="text-gray-700 text-sm">
            Your AI co-founder for startup success
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Sign In */}
          <button
            onClick={() => signIn('google')}
            className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Apple Sign In */}
          <button
            onClick={() => signIn('apple')}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-3 shadow-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span>Continue with Apple</span>
          </button>

          {/* Passkey Authentication */}
          {isSupported() && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-gray-600">Or use passkey</span>
                </div>
              </div>

              {/* Passkey Sign In */}
              <button
                onClick={handlePasskeyLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-3 shadow-sm"
              >
                {isLoading ? (
                  <div className="animate-spin text-xl">⏳</div>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                )}
                <span>{isLoading ? 'Authenticating...' : 'Sign in with Passkey'}</span>
              </button>

              {/* Email input for registration */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowEmailInput(!showEmailInput)}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
                >
                  {showEmailInput ? 'Hide' : 'Create new passkey'}
                </button>

                {showEmailInput && (
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handlePasskeyRegister}
                      disabled={isLoading || !email.trim()}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <div className="animate-spin text-xl">⏳</div>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                        </svg>
                      )}
                      <span>{isLoading ? 'Creating...' : 'Create Passkey'}</span>
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs">
            Secure authentication • Privacy protected
          </p>
        </div>
      </div>
    </div>
  );
}
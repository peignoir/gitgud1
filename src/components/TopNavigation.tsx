'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface TopNavigationProps {
  onNavigate?: (path: string) => void;
}

export function TopNavigation({ onNavigate }: TopNavigationProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAuthenticated = !!session?.user;

  const handleNavigation = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      router.push(href);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
    setShowUserMenu(false);
  };

  if (status === 'loading') {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🚀</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">GitGud.vc</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-300 h-8 w-24 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <button
                onClick={() => handleNavigation('/')}
                className="flex items-center space-x-2 group"
              >
                <span className="text-2xl">🚀</span>
                <div>
                  <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    GitGud.vc
                  </div>
                  <div className="text-[10px] text-gray-500 -mt-1">with Guddy AI</div>
                </div>
              </button>
            </div>

          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => signIn('google')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Sign in with Google
                </button>
                <button
                  onClick={() => signIn('apple')}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Sign in with Apple
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="font-medium text-gray-900">
                      {session.user?.name || session.user?.email}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <div className="px-4 py-2 border-b">
                      <div className="font-medium text-gray-900">
                        {session.user?.name || 'User'}
                      </div>
                      <div className="text-sm text-gray-700">
                        {session.user?.email}
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { TopNavigation } from '@/components/TopNavigation';
import { LoginScreen } from '@/components/LoginScreen';
import { WelcomePhase } from '@/components/journey/WelcomePhase';
import { ProfilePhase } from '@/components/journey/ProfilePhase';
import { ChallengePhaseV2 as ChallengePhase } from '@/components/journey/ChallengePhase.v2';
import { EvaluationPhase } from '@/components/journey/EvaluationPhase';
import { SprintPhase } from '@/components/journey/SprintPhase';
import { MemoryManager } from '@/lib/utils/founder-memory';

export type Phase = 'welcome' | 'profile' | 'challenge' | 'evaluation' | 'sprint';

interface JourneyState {
  currentPhase: Phase;
  data: Record<string, any>;
  loading: boolean;
}

export default function FounderJourneyPage() {
  const { data: session, status } = useSession();
  
  const [journeyState, setJourneyState] = useState<JourneyState>({
    currentPhase: 'welcome',
    data: {},
    loading: true,
  });
  const [resetKey, setResetKey] = useState(0); // Increment to force re-mount of all components
  const [isResetting, setIsResetting] = useState(false); // Prevent double-click
  const resetInProgressRef = useRef(false); // Additional safeguard with ref

  // Load current journey state
  useEffect(() => {
    if (status === 'authenticated') {
      loadJourneyState();
    } else if (status === 'unauthenticated') {
      // Show login screen, don't redirect
      setJourneyState(prev => ({ ...prev, loading: false }));
    }
  }, [status]);

  const loadJourneyState = async () => {
    try {
      // First try to load from localStorage (immediate)
      const savedState = localStorage.getItem('founder-journey-state');
      let localState = null;
      
      if (savedState) {
        localState = JSON.parse(savedState);
        setJourneyState({
          currentPhase: localState.currentPhase || 'welcome',
          data: localState.data || {},
          loading: false,
        });
        console.log('✅ Restored journey state from localStorage:', localState.currentPhase);
      }

      // Then try to load from backend API
      const response = await fetch('/api/founder-journey');
      if (response.ok) {
        const apiData = await response.json();
        
        // Only use API data if it has actual content AND is newer than localStorage
        // If API returns empty but localStorage has data, keep localStorage
        if (apiData.currentPhase && apiData.currentPhase !== 'welcome' && Object.keys(apiData.data || {}).length > 0) {
          console.log('✅ Using API journey state:', apiData.currentPhase);
          setJourneyState({
            currentPhase: apiData.currentPhase,
            data: apiData.data || {},
            loading: false,
          });
        } else if (!localState) {
          // Only use default/empty API state if no localStorage
          console.log('📝 Starting fresh journey (no saved state)');
          setJourneyState({
            currentPhase: 'welcome',
            data: {},
            loading: false,
          });
        } else {
          console.log('💾 Keeping localStorage state (API returned empty)');
          // Already set from localStorage above, just mark as done loading
          setJourneyState(prev => ({ ...prev, loading: false }));
        }
      } else if (!localState) {
        // API failed and no localStorage - start fresh
        setJourneyState({ currentPhase: 'welcome', data: {}, loading: false });
      }
    } catch (error) {
      console.error('Failed to load journey state:', error);
      setJourneyState(prev => ({ ...prev, loading: false }));
    }
  };

  const handlePhaseComplete = async (phaseData: any, nextPhase?: Phase) => {
    const newState = {
      currentPhase: nextPhase || journeyState.currentPhase,
      data: { ...journeyState.data, ...phaseData },
    };

    // Update state locally
    setJourneyState(prev => ({
      ...prev,
      ...newState,
    }));

    // Save to localStorage immediately
    localStorage.setItem('founder-journey-state', JSON.stringify(newState));
    console.log('💾 Saved journey state to localStorage:', newState.currentPhase);

    // Save to backend
    try {
      await fetch('/api/founder-journey', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: nextPhase || journeyState.currentPhase,
          data: phaseData,
        }),
      });
    } catch (error) {
      console.error('Failed to save journey state:', error);
    }
  };

  const handleReset = () => {
    // Prevent double-click with both state and ref
    if (isResetting || resetInProgressRef.current) {
      console.log('⚠️ Reset already in progress, ignoring...');
      return;
    }

    // Set both locks immediately
    setIsResetting(true);
    resetInProgressRef.current = true;

    console.log('🗑️ Resetting journey...');

    // Use setTimeout to ensure state updates are flushed
    setTimeout(() => {
      window.location.replace('/clear-storage');
    }, 100);
  };

  // Show login screen if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <TopNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🚀</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to GitGud</h1>
              <p className="text-gray-700">Sign in to start your founder journey</p>
            </div>
            <LoginScreen onLoginSuccess={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'loading' || journeyState.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <TopNavigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">🚀</div>
            <p className="text-gray-800 text-lg">Loading your journey...</p>
          </div>
        </div>
      </div>
    );
  }

  // Phase progress indicator
  const phases: { id: Phase; label: string; emoji: string }[] = [
    { id: 'welcome', label: 'Welcome', emoji: '👋' },
    { id: 'profile', label: 'Profile', emoji: '✨' },
    { id: 'challenge', label: 'Challenge', emoji: '💻' },
    { id: 'evaluation', label: 'Evaluation', emoji: '⚖️' },
    { id: 'sprint', label: 'Sprint', emoji: '🏃' },
  ];

  const currentPhaseIndex = phases.findIndex(p => p.id === journeyState.currentPhase);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <TopNavigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Debug Reset Button - Admin Only */}
        {session?.user?.email === 'franck@recorp.co' && (
          <div className="mb-4 flex justify-end gap-2">
            <button
              onClick={() => window.location.href = '/submissions'}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm transition-colors"
              title="View all submissions"
            >
              📊 View Submissions
            </button>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm transition-colors"
              title="Debug: Reset all journey state"
            >
              {isResetting ? '⏳ Resetting...' : '🗑️ Reset Journey'}
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {phases.map((phase, index) => (
              <div key={phase.id} className="flex flex-col items-center flex-1">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-2xl
                  transition-all duration-300
                  ${index <= currentPhaseIndex 
                    ? 'bg-blue-600 text-white shadow-lg scale-110' 
                    : 'bg-gray-200 text-gray-400'
                  }
                  ${index === currentPhaseIndex ? 'ring-4 ring-blue-200' : ''}
                `}>
                  {phase.emoji}
                </div>
                <p className={`
                  text-xs mt-2 font-medium
                  ${index <= currentPhaseIndex ? 'text-blue-600' : 'text-gray-400'}
                `}>
                  {phase.label}
                </p>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentPhaseIndex + 1) / phases.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Phase Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {journeyState.currentPhase === 'welcome' && (
            <WelcomePhase 
              key={`welcome-${resetKey}`}
              onNext={(data) => handlePhaseComplete(data, 'profile')} 
            />
          )}
          
          {journeyState.currentPhase === 'profile' && (
            <ProfilePhase 
              key={`profile-${resetKey}`}
              data={journeyState.data}
              onNext={(data) => handlePhaseComplete(data, 'challenge')} 
            />
          )}
          
          {journeyState.currentPhase === 'challenge' && (
            <ChallengePhase
              key={`challenge-${resetKey}`}
              data={journeyState.data}
              onNext={(data) => handlePhaseComplete(data, 'evaluation')}
              isAdmin={session?.user?.email === 'franck@recorp.co'}
            />
          )}
          
          {journeyState.currentPhase === 'evaluation' && (
            <EvaluationPhase 
              key={`evaluation-${resetKey}`}
              data={journeyState.data}
              onNext={(data) => handlePhaseComplete(data, 'sprint')} 
            />
          )}
          
          {journeyState.currentPhase === 'sprint' && (
            <SprintPhase 
              key={`sprint-${resetKey}`}
              data={journeyState.data}
              onUpdate={(data) => handlePhaseComplete(data)} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CleanupStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
  error?: string;
}

export default function ClearStoragePage() {
  const [steps, setSteps] = useState<CleanupStep[]>([
    { id: 'localStorage', label: 'Clear localStorage (journey state, chat history)', status: 'pending' },
    { id: 'sessionStorage', label: 'Clear sessionStorage', status: 'pending' },
    { id: 'mastraThreads', label: 'Clear Mastra memory threads', status: 'pending' },
    { id: 'memoryManager', label: 'Reset MemoryManager', status: 'pending' },
  ]);
  const [allDone, setAllDone] = useState(false);
  const router = useRouter();

  const updateStep = (id: string, status: CleanupStep['status'], error?: string) => {
    setSteps(prev => prev.map(step =>
      step.id === id ? { ...step, status, error } : step
    ));
  };

  useEffect(() => {
    const runCleanup = async () => {
      // Step 1: Clear localStorage
      updateStep('localStorage', 'loading');
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        const keys = Object.keys(localStorage);
        console.log('🗑️ Clearing localStorage keys:', keys);

        // Clear all localStorage items
        localStorage.clear();

        // Force clear specific keys that might persist
        const criticalKeys = [
          'challenge-state',
          'founder-journey-state',
          'evaluation-state',
          'chat-history',
        ];
        criticalKeys.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🗑️ Force removed: ${key}`);
        });

        // Verify it's actually empty
        const remaining = Object.keys(localStorage);
        if (remaining.length > 0) {
          console.warn('⚠️ localStorage not fully cleared:', remaining);
          // Force clear remaining items
          remaining.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Force removed remaining: ${key}`);
          });
        }

        // Final verification
        const final = Object.keys(localStorage);
        console.log('✅ localStorage cleared. Keys remaining:', final.length);
        if (final.length > 0) {
          console.error('❌ localStorage still has keys:', final);
        }
        updateStep('localStorage', 'done');
      } catch (error) {
        console.error('❌ Failed to clear localStorage:', error);
        updateStep('localStorage', 'error', 'Failed to clear localStorage');
      }

      // Step 2: Clear sessionStorage
      updateStep('sessionStorage', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));
      try {
        sessionStorage.clear();
        updateStep('sessionStorage', 'done');
      } catch (error) {
        updateStep('sessionStorage', 'error', 'Failed to clear sessionStorage');
      }

      // Step 3: Clear Mastra threads via API
      updateStep('mastraThreads', 'loading');
      try {
        const response = await fetch('/api/memory/clear', {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Mastra threads cleared:', result.message);
          updateStep('mastraThreads', 'done');
        } else {
          updateStep('mastraThreads', 'error', 'API returned error');
        }
      } catch (error) {
        console.error('Failed to clear Mastra threads:', error);
        updateStep('mastraThreads', 'error', 'Network error');
      }

      // Step 4: Reset MemoryManager (client-side)
      updateStep('memoryManager', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));
      try {
        // Import and reset MemoryManager
        const { MemoryManager } = await import('@/lib/utils/founder-memory');
        MemoryManager.resetAll();
        updateStep('memoryManager', 'done');
      } catch (error) {
        updateStep('memoryManager', 'error', 'Failed to reset MemoryManager');
      }

      // All done!
      await new Promise(resolve => setTimeout(resolve, 500));
      setAllDone(true);
      console.log('✅ All cleanup completed!');
    };

    runCleanup();
  }, []);

  const handleGoHome = () => {
    // Double-check localStorage is clear before navigating
    const remaining = Object.keys(localStorage);
    if (remaining.length > 0) {
      console.warn('⚠️ localStorage not empty before navigation:', remaining);
      localStorage.clear();
    }

    // Force hard refresh to ensure no cached components
    console.log('🚀 Navigating to fresh journey, localStorage keys:', Object.keys(localStorage).length);

    // Use replace to avoid back button issues
    window.location.replace('/founder-journey');
  };

  const getStepIcon = (status: CleanupStep['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'loading': return '🔄';
      case 'done': return '✅';
      case 'error': return '❌';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🗑️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {allDone ? 'All Clean!' : 'Resetting Journey...'}
          </h1>
          <p className="text-gray-600">
            {allDone
              ? 'Everything has been cleared. Ready for a fresh start!'
              : 'Clearing all data and memory...'}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                step.status === 'done'
                  ? 'bg-green-50 border-2 border-green-200'
                  : step.status === 'error'
                  ? 'bg-red-50 border-2 border-red-200'
                  : step.status === 'loading'
                  ? 'bg-blue-50 border-2 border-blue-200'
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className={`text-2xl ${step.status === 'loading' ? 'animate-spin' : ''}`}>
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{step.label}</p>
                {step.error && (
                  <p className="text-sm text-red-600 mt-1">{step.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {allDone && (
          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Start Fresh Journey →
            </button>
            <p className="text-center text-sm text-gray-500">
              All data cleared. Memory reset. Ready to begin!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

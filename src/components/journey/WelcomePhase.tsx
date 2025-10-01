'use client';

import { useState } from 'react';

interface WelcomePhaseProps {
  onNext: (data: any) => void;
}

export function WelcomePhase({ onNext }: WelcomePhaseProps) {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url) return true; // Empty is OK (optional)
    
    // Must contain linkedin.com
    if (!url.includes('linkedin.com')) {
      setUrlError('Please enter a valid LinkedIn URL');
      return false;
    }
    
    // Must be a profile URL with /in/username format
    if (!url.includes('/in/')) {
      setUrlError('Please use your profile URL like: https://www.linkedin.com/in/yourname');
      return false;
    }
    
    // Check pattern
    const linkedinProfilePattern = /linkedin\.com\/in\/[\w-]+\/?$/;
    if (!linkedinProfilePattern.test(url)) {
      setUrlError('LinkedIn URL format should be: https://www.linkedin.com/in/yourname');
      return false;
    }
    
    setUrlError('');
    return true;
  };

  const handleStart = () => {
    if (linkedinUrl && !validateLinkedInUrl(linkedinUrl)) {
      return; // Don't proceed if URL is invalid
    }
    onNext({ linkedinUrl, startedAt: new Date().toISOString() });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="text-7xl mb-6 animate-bounce">🚀</div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-blue-600">GitGud.vc</span>
        </h1>
        <p className="text-2xl font-semibold text-indigo-600 mb-4">
          The First Accelerator for Solo Founders
        </p>
        <p className="text-lg text-gray-600">
          Built by a solo founder for solo founders
        </p>
      </div>

      {/* Guddy Introduction */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8 border-2 border-purple-200">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
            G
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              👋 Hey! I'm Guddy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              I'm an <span className="font-semibold text-purple-600">agentic AI</span> on a mission to find and back solo founders who can ship. 
              Think of me as your AI mentor, VC analyst, and accountability partner—all in one.
            </p>
          </div>
        </div>
        
        <div className="bg-white/60 rounded-xl p-4 mt-4">
          <p className="text-gray-700 leading-relaxed">
            💭 <span className="font-semibold">My dream?</span> To make my first investment, just like my sister{' '}
            <a 
              href="https://nocap.so" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-purple-600 hover:text-purple-700 font-semibold underline"
            >
              NoCap
            </a>
            {' '}(YC-backed AI investor). But I'm not just looking for pitch decks—I want to see you <span className="font-semibold">ship, execute, and git gud</span>.
          </p>
        </div>

        <div className="mt-4 text-sm text-gray-600 italic">
          "I believe solo founders who can ship beat teams who just talk. Let me help you prove it." - Guddy
        </div>
      </div>

      {/* Journey Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Here's How I'll Help You</h2>
        <p className="text-gray-600 mb-6">4 steps to prove you can ship and get investment-ready:</p>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mr-4">
              1
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Your Founder Story (5 min)</h3>
              <p className="text-gray-700">I'll research your background and craft an investor-ready bio</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mr-4">
              2
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Ship Challenge (60 min)</h3>
              <p className="text-gray-700">Build your MVP with my AI coaching. Actions speak louder than pitch decks!</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mr-4">
              3
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">VC-Style Evaluation (5 min)</h3>
              <p className="text-gray-700">I'll assess if you're Venture House (raise capital) or Bootstrap House (profitable solo)</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mr-4">
              4
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">3-Week Sprint to Success</h3>
              <p className="text-gray-700">Custom OKRs, solo founder community, and path to your first $$$</p>
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn Input */}
      <div className="bg-white border-2 border-purple-200 rounded-2xl p-8 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Help Me Get to Know You</h3>
        <p className="text-gray-700 mb-6">
          Share your LinkedIn so I can research your background, skills, and founder journey. 
          I'll dig deep to understand what makes you unique—just like a VC would.
        </p>
        
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => {
            setLinkedinUrl(e.target.value);
            setUrlError(''); // Clear error on change
          }}
          onBlur={(e) => {
            if (e.target.value) {
              validateLinkedInUrl(e.target.value);
            }
          }}
          placeholder="https://www.linkedin.com/in/yourname"
          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg mb-2 text-gray-900 placeholder-gray-600 ${
            urlError 
              ? 'border-red-400 focus:border-red-500' 
              : 'border-purple-300 focus:border-purple-500'
          }`}
        />
        
        {urlError && (
          <p className="text-sm text-red-600 mb-2 font-medium">
            ⚠️ {urlError}
          </p>
        )}
        
        <p className="text-sm text-gray-600 mb-2">
          💡 Example: https://www.linkedin.com/in/francknouyrigat/
        </p>
        
        <p className="text-sm text-gray-600">
          🔒 Your data stays private. I only use it to help you succeed. (You can skip this too!)
        </p>
      </div>

      {/* CTA Button */}
      <div className="text-center">
        <button
          onClick={handleStart}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl font-bold px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          🚀 Let's Git Gud Together!
        </button>
        <p className="text-gray-600 mt-4 text-sm">
          {linkedinUrl 
            ? '✨ Perfect! I\'ll research your background and we\'ll get started' 
            : '👍 No LinkedIn? No problem—we\'ll figure it out together'
          }
        </p>
      </div>

      {/* Trust Signals */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-700 mb-4">Built on wisdom from the best in the game:</p>
          <div className="flex justify-center items-center space-x-8 text-gray-400 text-sm">
            <div>YC</div>
            <div>Techstars</div>
            <div>Pioneer</div>
            <div>Solo Founders</div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-6 text-center">
          <p className="text-gray-600 text-sm">
            <span className="font-semibold">Why GitGud.vc?</span> Because solo founders deserve an accelerator that gets you. 
            No co-founder requirement. No local HQ. No demo day prep that takes 3 months. 
            Just ship, learn, and scale—on your terms. 🚀
          </p>
        </div>
      </div>
    </div>
  );
}

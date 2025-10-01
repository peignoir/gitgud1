'use client';

import { useState, useEffect, useRef } from 'react';
import { MemoryManager } from '@/lib/utils/founder-memory';

interface EvaluationPhaseProps {
  data: Record<string, any>;
  onNext: (data: any) => void;
}

type House = 'venture' | 'bootstrap';

export function EvaluationPhase({ data, onNext }: EvaluationPhaseProps) {
  const [stage, setStage] = useState<'analyzing' | 'thinking' | 'reveal'>('analyzing');
  const [thinking, setThinking] = useState('');
  const [house, setHouse] = useState<House | null>(null);
  const [reasoning, setReasoning] = useState('');
  const streamContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startEvaluation();
  }, []);

  useEffect(() => {
    if (streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [thinking]);

  const startEvaluation = async () => {
    setStage('analyzing');
    
    // Short delay for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStage('thinking');

    try {
      // Get founder memory
      const founderMemory = MemoryManager.buildFounderContext();
      const startupMemory = MemoryManager.buildStartupContext();

      const response = await fetch('/api/founder-journey/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'evaluation',
          userId: 'current-user',
          data: {
            founderBio: data.profile?.bio,
            founderArchetype: data.profile?.archetype,
            videoUrl: data.artifacts?.videoUrl,
            fiveLiner: data.artifacts?.fiveLiner,
            codeUrl: data.artifacts?.codeUrl,
            timeSpent: data.artifacts?.timeSpent,
            founderMemory: founderMemory,
            startupMemory: startupMemory,
          },
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              
              if (eventData.type === 'chunk') {
                fullText += eventData.content;
                setThinking(fullText);
              } else if (eventData.type === 'complete') {
                fullText = eventData.fullText;
                setThinking(fullText);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Extract decision from evaluation
      const decision = extractDecision(fullText);
      
      // Dramatic pause before reveal
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setHouse(decision.house);
      setReasoning(decision.reasoning);
      setStage('reveal');

      // Save to memory
      MemoryManager.addFounderInsight(`Evaluated as ${decision.house} house founder`);

    } catch (error) {
      console.error('Evaluation failed:', error);
      // Fallback decision
      const founderMemory = MemoryManager.getFounderMemory();
      const isExperienced = (founderMemory.companies?.length || 0) >= 3;
      
      setHouse(isExperienced ? 'venture' : 'bootstrap');
      setReasoning(isExperienced 
        ? 'Based on your track record of building multiple companies'
        : 'You\'re on the path to building a great business');
      setStage('reveal');
    }
  };

  const extractDecision = (text: string): { house: House; reasoning: string } => {
    const lowerText = text.toLowerCase();
    
    // Check for house assignment
    let house: House = 'bootstrap';
    if (lowerText.includes('venture house') || lowerText.includes('yc') || lowerText.includes('techstars')) {
      house = 'venture';
    }
    
    // Extract reasoning (last paragraph or full text)
    const reasoning = text.split('\n\n').filter(p => p.trim()).pop() || text;
    
    return { house, reasoning };
  };

  const handleContinue = () => {
    onNext({
      evaluation: {
        house: house,
        reasoning: reasoning,
        thinking: thinking,
      },
    });
  };

  const houseInfo = {
    venture: {
      emoji: '🚀',
      title: 'VENTURE HOUSE',
      subtitle: 'The YC / Techstars Track',
      color: 'from-purple-600 to-indigo-600',
      bgColor: 'from-purple-50 to-indigo-50',
      borderColor: 'border-purple-400',
      glowColor: 'shadow-purple-500/50',
      description: 'You\'re building something venture-scale. Big ambitions, bigger impact.',
      track: 'Fast growth, fundraising, scaling to millions of users',
    },
    bootstrap: {
      emoji: '💪',
      title: 'BOOTSTRAP HOUSE',
      subtitle: 'The Profitable Builder Track',
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-400',
      glowColor: 'shadow-blue-500/50',
      description: 'Build a profitable, sustainable business on your terms.',
      track: 'Revenue-first, customer-focused, bootstrapped growth',
    },
  };

  const info = house ? houseInfo[house] : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mb-3">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full text-sm shadow-md">
            GitGud.vc
          </span>
        </div>
        <div className="text-6xl mb-4">⚖️</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Guddy's Verdict</h1>
        <p className="text-lg text-gray-700">
          {stage === 'analyzing' && 'Loading your submission...'}
          {stage === 'thinking' && 'Guddy is evaluating like a VC partner...'}
          {stage === 'reveal' && 'The decision is in!'}
        </p>
      </div>

      {/* Analyzing Stage */}
      {stage === 'analyzing' && (
        <div className="bg-white rounded-2xl p-12 border-2 border-gray-200 shadow-lg">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-6">⏳</div>
            <p className="text-xl text-gray-700">Reviewing your profile and submission...</p>
          </div>
        </div>
      )}

      {/* Thinking Stage */}
      {stage === 'thinking' && (
        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs mr-3 shadow-md animate-pulse">
              CG
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Guddy's Thinking Process...
            </h2>
          </div>

          <div
            ref={streamContainerRef}
            className="prose max-w-none whitespace-pre-wrap text-gray-700 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-6"
          >
            {thinking || (
              <div className="text-gray-400 italic">
                Analyzing founder profile (80%), vibe code execution (20%)...
              </div>
            )}
            <span className="inline-block w-2 h-5 bg-blue-600 animate-pulse ml-1" />
          </div>
        </div>
      )}

      {/* Reveal Stage - THE BIG MOMENT */}
      {stage === 'reveal' && info && (
        <div className="space-y-8 animate-fadeIn">
          {/* Dramatic House Reveal */}
          <div className={`bg-gradient-to-r ${info.bgColor} rounded-3xl p-12 border-4 ${info.borderColor} shadow-2xl ${info.glowColor} transform hover:scale-105 transition-all duration-500`}>
            <div className="text-center">
              <div className="text-9xl mb-6 animate-bounce">{info.emoji}</div>
              <h2 className={`text-5xl font-black mb-3 bg-gradient-to-r ${info.color} bg-clip-text text-transparent`}>
                {info.title}
              </h2>
              <p className="text-xl text-gray-600 mb-6 font-semibold">{info.subtitle}</p>
              <p className="text-2xl text-gray-800 mb-4">{info.description}</p>
              <div className="inline-block bg-white/50 rounded-xl px-6 py-3 mt-4">
                <p className="text-sm text-gray-700 font-medium">
                  🎯 {info.track}
                </p>
              </div>
            </div>
          </div>

          {/* Guddy's Reasoning */}
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg">
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mr-4 shadow-md flex-shrink-0">
                CG
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Why I made this decision:</h3>
                <div className="prose max-w-none text-gray-700">
                  {reasoning}
                </div>
              </div>
            </div>
          </div>

          {/* Your Submission Summary */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">📦 What You Submitted</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Video:</span>
                {data.artifacts?.videoUrl ? (
                  <a href={data.artifacts.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                    View Demo
                  </a>
                ) : (
                  <span className="text-gray-500 ml-2">Not provided</span>
                )}
              </div>
              <div>
                <span className="font-medium text-gray-700">Code:</span>
                {data.artifacts?.codeUrl ? (
                  <a href={data.artifacts.codeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                    View Code
                  </a>
                ) : (
                  <span className="text-gray-500 ml-2">Not provided</span>
                )}
              </div>
              <div>
                <span className="font-medium text-gray-700">Time:</span>
                <span className="text-gray-600 ml-2">{Math.floor((data.artifacts?.timeSpent || 0) / 60)} minutes</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Archetype:</span>
                <span className="text-gray-600 ml-2">{data.profile?.archetype || 'Builder'}</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <button
              onClick={handleContinue}
              className={`bg-gradient-to-r ${info.color} text-white text-xl font-bold px-12 py-4 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-200`}
            >
              Start Your 3-Week Sprint →
            </button>
            <p className="text-gray-600 mt-3 text-sm">
              {house === 'venture' ? 'Let\'s build something massive! 🚀' : 'Let\'s build something profitable! 💰'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
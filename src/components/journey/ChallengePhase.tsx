'use client';

import { useState, useEffect, useRef } from 'react';
import { LinkifiedText } from '@/lib/utils/linkify';
import { MemoryManager } from '@/lib/utils/founder-memory';

interface ChallengePhaseProps {
  data: Record<string, any>;
  onNext: (data: any) => void;
}

interface Message {
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
}

export function ChallengePhase({ data, onNext }: ChallengePhaseProps) {
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // 60 minutes in seconds
  const [isSubmissionPhase, setIsSubmissionPhase] = useState(false);
  const [submissionTimeRemaining, setSubmissionTimeRemaining] = useState(5 * 60); // 5 minutes
  const [submissionTimeExpired, setSubmissionTimeExpired] = useState(false);
  const [isAssessmentPhase, setIsAssessmentPhase] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [houseDecision, setHouseDecision] = useState<string>('');
  const [houseReasoning, setHouseReasoning] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [thinkingPlaceholder, setThinkingPlaceholder] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [fiveLiner, setFiveLiner] = useState('');
  const [codeUrl, setCodeUrl] = useState('');
  const [stateLoaded, setStateLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load saved challenge state on mount
  useEffect(() => {
    const loadChallengeState = async () => {
      try {
        const savedState = localStorage.getItem('challenge-state');
        if (savedState) {
          const state = JSON.parse(savedState);
          setChallengeStarted(state.challengeStarted || false);
          setTimeRemaining(state.timeRemaining || 60 * 60);
          setIsSubmissionPhase(state.isSubmissionPhase || false);
          setSubmissionTimeRemaining(state.submissionTimeRemaining || 5 * 60);
          setSubmissionTimeExpired(state.submissionTimeExpired || false);
          setIsAssessmentPhase(state.isAssessmentPhase || false);
          setAssessmentComplete(state.assessmentComplete || false);
          setHouseDecision(state.houseDecision || '');
          setHouseReasoning(state.houseReasoning || '');
          setStreamingMessage('');
          setMessages(state.messages?.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })) || []);
          setVideoUrl(state.videoUrl || '');
          setFiveLiner(state.fiveLiner || '');
          setCodeUrl(state.codeUrl || '');
          console.log('✅ Restored challenge state from localStorage');
        }
      } catch (error) {
        console.error('Failed to load challenge state:', error);
      } finally {
        setStateLoaded(true);
      }
    };
    loadChallengeState();
  }, []);

  // Save challenge state to localStorage whenever it changes
  useEffect(() => {
    if (stateLoaded) {
      const state = {
        challengeStarted,
        timeRemaining,
        isSubmissionPhase,
        submissionTimeRemaining,
        submissionTimeExpired,
        isAssessmentPhase,
        assessmentComplete,
        houseDecision,
        houseReasoning,
        messages,
        videoUrl,
        fiveLiner,
        codeUrl,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem('challenge-state', JSON.stringify(state));
    }
  }, [challengeStarted, timeRemaining, isSubmissionPhase, submissionTimeRemaining, submissionTimeExpired, isAssessmentPhase, assessmentComplete, houseDecision, houseReasoning, messages, videoUrl, fiveLiner, codeUrl, stateLoaded]);

  // Auto-scroll only during streaming (not after complete)
  useEffect(() => {
    if (messagesEndRef.current && streamingMessage && isCoachTyping) {
      // Use instant scroll during streaming to avoid stutter
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [streamingMessage, isCoachTyping]);

  // Vibe code timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (challengeStarted && !isSubmissionPhase && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up! Switch to submission phase
            setIsSubmissionPhase(true);
            notifySubmissionPhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [challengeStarted, isSubmissionPhase, timeRemaining]);

  // Submission timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmissionPhase && submissionTimeRemaining > 0) {
      interval = setInterval(() => {
        setSubmissionTimeRemaining((prev) => {
          if (prev <= 1) {
            // Submission time up! Auto-submit
            autoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSubmissionPhase, submissionTimeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRandomThinkingMessage = () => {
    const messages = [
      "brewing some wisdom",
      "consulting the startup gods",
      "channeling YC energy",
      "vibing with the code",
      "loading genius mode",
      "summoning product ideas",
      "calculating MVP potential",
      "checking my startup notes",
      "asking Paul Graham",
      "running it through the matrix",
      "doing some quick math",
      "consulting the founder playbook",
      "analyzing the vibe",
      "optimizing for speed",
      "thinking really hard",
      "processing at lightspeed",
      "downloading inspiration",
      "syncing with the cloud brain",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const notifySubmissionPhase = async () => {
    // Guddy announces it's time to submit
    const submissionMessage: Message = {
      role: 'coach',
      content: `🔥 **Time's up!** Great work so far!\n\nNow you have **5 minutes** to submit your deliverables:\n\n1️⃣ **Video** (1:30 max) - Show what you built + proof\n2️⃣ **5-Liner** - Problem, solution, customer, opportunity, next test\n\nDrop the links below and let\'s see what you shipped! 🚀`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, submissionMessage]);
  };

  const autoSubmit = () => {
    if (!videoUrl || !fiveLiner) {
      setSubmissionTimeExpired(true);
      setIsAssessmentPhase(true);
      startAssessment();
      return;
    }
    handleSubmit();
  };

  const startAssessment = async () => {
    setIsCoachTyping(true);
    setStreamingMessage('');
    setThinkingPlaceholder(getRandomThinkingMessage());
    setIsSearching(false);
    
    const searchTimeout = setTimeout(() => {
      setIsSearching(true);
    }, 2000);
    
    const founderName = data.profile?.name || 'Founder';
    const founderMemory = MemoryManager.buildFounderContext();
    const startupMemory = MemoryManager.buildStartupContext();

    try {
      const response = await fetch('/api/founder-journey/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'challenge',
          userId: 'current-user',
          data: {
            challengeMode: 'assessment',
            noSubmission: true,
            founderBio: data.profile?.bio,
            founderName: founderName,
            archetype: data.profile?.archetype,
            founderMemory: founderMemory,
            startupMemory: startupMemory,
          },
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

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
                clearTimeout(searchTimeout);
                setIsSearching(false);
                fullText += eventData.content;
                setStreamingMessage(fullText); // Show streaming text
                console.log('📨 [Assessment] Chunk:', eventData.content.length, 'chars');
              } else if (eventData.type === 'complete') {
                clearTimeout(searchTimeout);
                fullText = eventData.fullText;
                console.log('✅ [Assessment] Complete');
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setStreamingMessage('');
      setMessages(prev => [...prev, {
        role: 'coach',
        content: fullText,
        timestamp: new Date(),
      }]);
      setIsCoachTyping(false);

    } catch (error) {
      console.error('Failed to get assessment message:', error);
      setStreamingMessage('');
      setMessages(prev => [...prev, {
        role: 'coach',
        content: `⏰ **Time's up!**\n\nHey, I noticed you didn't submit anything. That's okay - let me understand what happened.\n\n**Was there a technical issue, or did you run into roadblocks?** Sometimes bugs happen, or the scope is too big.\n\n**More importantly:** Are you serious about building something? Can you commit **3 weeks** to push this idea forward?\n\nIf you're looking to build a **small side project**, that's totally cool - but I want to make sure we put you in the right house for your goals! 🏠\n\nTell me what's on your mind.`,
        timestamp: new Date(),
      }]);
      setIsCoachTyping(false);
    }
  };

  // Debug functions
  const advanceVibeCodeTime = () => {
    setTimeRemaining(15); // 15 seconds left
    console.log('🐞 [Debug] Advanced vibe code timer to 15 seconds');
  };

  const advanceSubmitTime = () => {
    if (!isSubmissionPhase) {
      setIsSubmissionPhase(true);
      notifySubmissionPhase();
    }
    setSubmissionTimeRemaining(15); // 15 seconds left
    console.log('🐞 [Debug] Advanced submission timer to 15 seconds');
  };

  const getCoachWelcomeMessage = async () => {
    setIsCoachTyping(true);
    setStreamingMessage('');
    setThinkingPlaceholder(getRandomThinkingMessage());
    setIsSearching(false);
    
    // Detect if web search is happening (if no chunks after 2 seconds)
    const searchTimeout = setTimeout(() => {
      setIsSearching(true);
    }, 2000);
    
    // Extract founder's name from bio (first sentence usually starts with name)
    const extractNameFromBio = (bio: string): string => {
      if (!bio) return 'Founder';
      // Try to extract name from patterns like "John Smith is..." or "John is..."
      const match = bio.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|has|was|co-founded)/);
      return match ? match[1] : 'Founder';
    };
    
    const founderName = extractNameFromBio(data.profile?.bio || '');
    
    // Get memory context to send to Guddy
    const founderMemory = MemoryManager.buildFounderContext();
    const startupMemory = MemoryManager.buildStartupContext();
    
    try {
      const response = await fetch('/api/founder-journey/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'challenge',
          userId: 'current-user',
          data: {
            challengeMode: 'start',
            founderBio: data.profile?.bio,
            founderName: founderName,
            archetype: data.profile?.archetype,
            linkedinUrl: data.linkedinUrl || data.research?.linkedinUrl,
            founderMemory: founderMemory,
            startupMemory: startupMemory,
          },
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

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
                clearTimeout(searchTimeout); // Clear search indicator on first chunk
                setIsSearching(false);
                fullText += eventData.content;
                setStreamingMessage(fullText); // Show streaming text
                console.log('📨 [Welcome] Chunk:', eventData.content.length, 'chars');
              } else if (eventData.type === 'complete') {
                clearTimeout(searchTimeout);
                fullText = eventData.fullText;
                console.log('✅ [Welcome] Complete');
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setStreamingMessage('');
      setMessages([{
        role: 'coach',
        content: fullText,
        timestamp: new Date(),
      }]);
      setIsCoachTyping(false);

    } catch (error) {
      console.error('Failed to get coach message:', error);
      setStreamingMessage('');
      setMessages([{
        role: 'coach',
        content: "Hey! 👋 I'm Guddy, your Vibe Code Coach. I'm here to help you ship something awesome in the next 60 minutes!\n\nFirst question: Are you looking to:\n1️⃣ Build a NEW idea from scratch\n2️⃣ Add a feature to an EXISTING project\n\nTell me which one, and I'll help you figure out the best approach! 💪",
        timestamp: new Date(),
      }]);
      setIsCoachTyping(false);
    }
  };

  const handleStartChallenge = async () => {
    setChallengeStarted(true);
    // Get the coach's welcome message
    await getCoachWelcomeMessage();
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    
    const currentMessage = userMessage;
    setUserMessage('');
    setIsCoachTyping(true);
    setStreamingMessage('');
    setThinkingPlaceholder(getRandomThinkingMessage());
    setIsSearching(false);
    
    // Detect if web search is happening
    const searchTimeout = setTimeout(() => {
      setIsSearching(true);
    }, 2000);

    try {
      // Extract founder's name from bio
      const extractNameFromBio = (bio: string): string => {
        if (!bio) return 'Founder';
        const match = bio.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|has|was|co-founded)/);
        return match ? match[1] : 'Founder';
      };
      
      const founderName = extractNameFromBio(data.profile?.bio || '');
      
      // Get memory context
      const founderMemory = MemoryManager.buildFounderContext();
      const startupMemory = MemoryManager.buildStartupContext();
      
      console.log('📤 [Chat] Sending message to coach:', {
        phase: isAssessmentPhase ? 'assessment' : 'challenge',
        challengeMode: isAssessmentPhase ? 'assessment-response' : 'coaching',
        messageLength: currentMessage.length,
        founderName,
        hasMemory: !!(founderMemory || startupMemory),
      });
      
      // Get coach response
      const response = await fetch('/api/founder-journey/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: isAssessmentPhase ? 'assessment' : 'challenge',
          userId: 'current-user',
          data: {
            challengeMode: isAssessmentPhase ? 'assessment-response' : 'coaching',
            userMessage: currentMessage,
            conversationHistory: messages,
            timeRemaining: Math.floor(timeRemaining / 60),
            founderBio: data.profile?.bio,
            founderName: founderName,
            archetype: data.profile?.archetype,
            founderMemory: founderMemory,
            startupMemory: startupMemory,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Chat] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error('❌ [Chat] No reader available');
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let fullText = '';
      let decision = '';
      let reasoning = '';
      let chunkCount = 0;

      console.log('📥 [Chat] Starting to read response stream...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`✅ [Chat] Stream complete, received ${chunkCount} chunks, total text: ${fullText.length} chars`);
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              if (eventData.type === 'chunk') {
                chunkCount++;
                clearTimeout(searchTimeout);
                setIsSearching(false);
                fullText += eventData.content;
                setStreamingMessage(fullText); // Show streaming text
                if (chunkCount % 5 === 0) {
                  console.log(`📨 [Chat] Chunk ${chunkCount}:`, eventData.content.length, 'chars, total:', fullText.length);
                }
              } else if (eventData.type === 'complete') {
                clearTimeout(searchTimeout);
                fullText = eventData.fullText;
                console.log('✅ [Chat] Complete event received, text length:', fullText.length);
                if (eventData.houseDecision) {
                  decision = eventData.houseDecision;
                  reasoning = eventData.reasoning || '';
                }
              } else if (eventData.type === 'start') {
                console.log('🚀 [Chat] Stream started');
              } else if (eventData.type === 'error') {
                console.error('❌ [Chat] Error from server:', eventData.error);
                throw new Error(eventData.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setStreamingMessage('');
      
      if (!fullText || fullText.trim().length === 0) {
        console.error('⚠️ [Chat] Empty response received from agent!');
        throw new Error('Empty response from agent');
      }
      
      setMessages((prev) => [...prev, {
        role: 'coach',
        content: fullText,
        timestamp: new Date(),
      }]);
      
      console.log('💬 [Chat] Added coach message to chat:', fullText.substring(0, 100) + '...');

      // If we got a house decision, complete the assessment
      if (decision && isAssessmentPhase) {
        setHouseDecision(decision);
        setHouseReasoning(reasoning);
        setAssessmentComplete(true);
      }

      setIsCoachTyping(false);

    } catch (error) {
      console.error('❌ [Chat] Failed to get coach response:', error);
      setStreamingMessage('');
      
      // Show error message to user
      setMessages((prev) => [...prev, {
        role: 'coach',
        content: `Sorry, I'm having trouble responding right now. Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again, or let me know what you need help with!`,
        timestamp: new Date(),
      }]);
      
      setIsCoachTyping(false);
    }
  };

  const handleSubmit = () => {
    if (!videoUrl || !fiveLiner) {
      alert('Please provide both the video URL and 5-liner!');
      return;
    }

    // Clear saved state on completion
    localStorage.removeItem('challenge-state');

    // Save to StartupMemory
    MemoryManager.saveStartupMemory({
      challenge: {
        startedAt: new Date(Date.now() - (60 * 60 - timeRemaining) * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        artifact: codeUrl || 'Built during vibe code challenge',
        demo: videoUrl,
        fiveLiner: fiveLiner,
      },
    });

    onNext({
      artifacts: {
        videoUrl,
        fiveLiner,
        codeUrl,
        timeSpent: 60 * 60 - timeRemaining,
        completedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mb-3">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full text-sm shadow-md">
            GitGud.vc
          </span>
        </div>
        <div className="text-6xl mb-4">💻</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Vibe Code Challenge</h1>
        <p className="text-lg text-gray-700 mb-1">
          {!challengeStarted ? 'Ready to prove you can ship?' : 'You got this! Guddy is here to help 🚀'}
        </p>
        {!challengeStarted && (
          <p className="text-sm text-gray-600">with Guddy, your AI coach</p>
        )}
      </div>

      {!challengeStarted || (challengeStarted && messages.length === 0 && !isCoachTyping) ? (
        /* Pre-Challenge Screen */
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 mb-8 border-2 border-yellow-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Challenge</h2>
            <p className="text-lg text-gray-700 mb-6">
              You have <strong>60 minutes</strong> to build and ship something. Have an idea? Great! 
              No idea? Your AI coach will help you find one.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Deliverables:</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <div className="text-2xl mr-3">1️⃣</div>
                <div>
                  <strong>Video (1:30 max)</strong>
                  <p className="text-gray-700">Demo your work + proof you built it + your story</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="text-2xl mr-3">2️⃣</div>
                <div>
                  <strong>5-Liner Business Summary</strong>
                  <p className="text-gray-700">Problem, solution, customer, opportunity, what to test</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                💡 <strong>Guddy will coach you:</strong> Get tool recommendations (Lovable, Bolt, Cursor, etc.), 
                step-by-step guidance, and motivation. She'll help you pick the right tools for your skill level!
              </p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStartChallenge}
              disabled={isCoachTyping}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-xl font-bold px-12 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              {isCoachTyping ? '⏳ Loading Guddy...' : '🔥 Start Challenge & Meet Guddy'}
            </button>
            {isCoachTyping && (
              <p className="text-gray-600 mt-4 text-sm animate-pulse">
                Guddy is preparing your personalized welcome...
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Challenge In Progress */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main: Chat with Coach */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer */}
            <div className={`rounded-2xl p-6 text-center ${
              isSubmissionPhase 
                ? (submissionTimeRemaining < 60 ? 'bg-red-100 border-2 border-red-300' : 'bg-orange-100 border-2 border-orange-300')
                : (timeRemaining < 10 * 60 ? 'bg-red-100 border-2 border-red-300' :
                   timeRemaining < 20 * 60 ? 'bg-yellow-100 border-2 border-yellow-300' :
                   'bg-green-100 border-2 border-green-300')
            }`}>
              <div className="text-5xl font-bold mb-2">
                {isSubmissionPhase ? formatTime(submissionTimeRemaining) : formatTime(timeRemaining)}
              </div>
              <p className="text-gray-700 font-semibold">
                {isSubmissionPhase ? '⏰ Submission Time' : 'Time Remaining'}
              </p>
              {isSubmissionPhase && (
                <p className="text-sm text-orange-700 mt-2">Submit your deliverables!</p>
              )}
            </div>

            {/* Debug Buttons */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-900 rounded-2xl p-4 border-2 border-gray-700">
                <p className="text-gray-400 text-xs mb-2 font-bold">🐛 DEBUG CONTROLS</p>
                <div className="space-y-2">
                  <button
                    onClick={advanceVibeCodeTime}
                    disabled={isSubmissionPhase}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 rounded transition-colors"
                  >
                    ⏩ Advance Vibe Code Time (15s left)
                  </button>
                  <button
                    onClick={advanceSubmitTime}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-3 py-2 rounded transition-colors"
                  >
                    ⏩ Advance Submit Time (15s left)
                  </button>
                </div>
              </div>
            )}

            {/* Chat with Coach */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs mr-2 shadow-md">
                  G
                </div>
                Guddy
                {isCoachTyping && <span className="ml-3 text-sm text-blue-600 animate-pulse font-medium">typing...</span>}
              </h2>

              {/* Messages */}
              <div 
                ref={chatContainerRef}
                className="space-y-4 max-h-96 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg"
              >
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border-2 border-purple-200 text-gray-800'
                    }`}>
                      <LinkifiedText className="whitespace-pre-wrap">{msg.content}</LinkifiedText>
                      <div className={`text-xs mt-2 ${
                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isCoachTyping && streamingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-white border-2 border-purple-200 rounded-lg p-4">
                      <LinkifiedText className="whitespace-pre-wrap">{streamingMessage}</LinkifiedText>
                      <div className="inline-block ml-1 w-2 h-4 bg-purple-400 animate-pulse" />
                    </div>
                  </div>
                )}
                {isCoachTyping && !streamingMessage && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        {isSearching ? (
                          <span className="text-sm text-blue-600 italic animate-pulse flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            searching the web
                          </span>
                        ) : thinkingPlaceholder && (
                          <span className="text-sm text-gray-500 italic animate-pulse">
                            {thinkingPlaceholder}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isCoachTyping && userMessage.trim()) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={isAssessmentPhase ? "Answer Guddy's questions..." : "Ask your coach anything... tools, advice, debugging help..."}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 placeholder-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isCoachTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isCoachTyping || !userMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  Send
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                {isAssessmentPhase ? '💬 Answer honestly so we can find the right path for you!' : '💡 Ask about tools, get URLs, debugging help, or motivation!'}
              </p>
            </div>
          </div>

          {/* Sidebar: Deliverables */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
              <h3 className="font-semibold mb-3 text-purple-900">💡 Quick Tips</h3>
              <ul className="text-sm text-gray-900 space-y-2">
                <li>✅ Talk to Guddy first (2-5 min)</li>
                <li>✅ Build ONE core feature well</li>
                <li>✅ Use AI tools to go fast</li>
                <li>✅ Record video as you build</li>
                <li>✅ Simple &gt; Complex</li>
              </ul>
            </div>

            {/* Submission Form */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <h2 className="text-xl font-semibold mb-4">📦 Deliverables</h2>

              {submissionTimeExpired && !assessmentComplete && (
                <div className="mb-4 p-4 bg-orange-100 border border-orange-300 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">⏰ Time is up!</p>
                  <p className="text-xs text-orange-700 mt-1">Talk to Guddy in the chat to determine your next steps.</p>
                </div>
              )}

              {assessmentComplete && houseDecision && (
                <div className={`mb-4 p-4 rounded-lg border-2 ${
                  houseDecision.toLowerCase().includes('venture') 
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300' 
                    : 'bg-gradient-to-r from-green-50 to-teal-50 border-green-300'
                }`}>
                  <h3 className="font-bold text-lg mb-2">
                    {houseDecision.toLowerCase().includes('venture') ? '🏰' : '🏡'} {houseDecision}
                  </h3>
                  <LinkifiedText className="text-sm text-gray-800 whitespace-pre-wrap">{houseReasoning}</LinkifiedText>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${submissionTimeExpired && !assessmentComplete ? 'text-gray-500' : 'text-gray-900'}`}>
                    Video URL * (Loom, YouTube, etc.)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                    disabled={submissionTimeExpired}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none ${
                      submissionTimeExpired 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'text-gray-900 placeholder-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${submissionTimeExpired && !assessmentComplete ? 'text-gray-500' : 'text-gray-900'}`}>
                    5-Liner *
                  </label>
                  <textarea
                    value={fiveLiner}
                    onChange={(e) => setFiveLiner(e.target.value)}
                    rows={8}
                    placeholder="1. Problem:&#10;2. Solution:&#10;3. Customer:&#10;4. Opportunity:&#10;5. What to test:"
                    disabled={submissionTimeExpired}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm ${
                      submissionTimeExpired 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'text-gray-900 placeholder-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${submissionTimeExpired && !assessmentComplete ? 'text-gray-500' : 'text-gray-900'}`}>
                    Code/GitHub (optional)
                  </label>
                  <input
                    type="url"
                    value={codeUrl}
                    onChange={(e) => setCodeUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    disabled={submissionTimeExpired}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none ${
                      submissionTimeExpired 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'text-gray-900 placeholder-gray-600'
                    }`}
                  />
                </div>

                {assessmentComplete ? (
                  <button
                    onClick={() => {
                      localStorage.removeItem('challenge-state');
                      onNext({
                        artifacts: {
                          videoUrl: videoUrl || null,
                          fiveLiner: fiveLiner || null,
                          codeUrl: codeUrl || null,
                          timeSpent: 60 * 60 - timeRemaining,
                          completedAt: new Date().toISOString(),
                          submissionTimeExpired: true,
                        },
                        houseDecision: houseDecision,
                        houseReasoning: houseReasoning,
                      });
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                  >
                    ➡️ Continue to {houseDecision}
                  </button>
                ) : submissionTimeExpired ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 font-bold py-3 rounded-lg cursor-not-allowed"
                  >
                    Complete the conversation above
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!videoUrl || !fiveLiner}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    ✅ Submit Challenge
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
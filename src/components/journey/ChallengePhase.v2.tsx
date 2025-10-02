'use client';

import { useState, useEffect, useRef } from 'react';
import { LinkifiedText } from '@/lib/utils/linkify';

interface ChallengePhaseProps {
  data: Record<string, any>;
  onNext: (data: any) => void;
  isAdmin?: boolean; // Admin sees debug controls
}

interface Message {
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
}

interface ChallengeState {
  // Timer state
  challengeStarted: boolean;
  timeRemaining: number; // seconds
  isSubmissionPhase: boolean;
  submissionTimeRemaining: number;

  // Chat state
  messages: Message[];

  // Submission state
  startupName: string;
  videoUrl: string;
  websiteUrl: string; // NEW: Website/landing page URL
  fiveLiner: string;
  codeUrl: string;

  // Assessment state
  isAssessmentPhase: boolean;
  assessmentComplete: boolean;
  houseDecision: string;
  houseReasoning: string;
}

const INITIAL_STATE: ChallengeState = {
  challengeStarted: false,
  timeRemaining: 60 * 60, // 60 minutes for vibe code
  isSubmissionPhase: false,
  submissionTimeRemaining: 30 * 60, // 30 minutes for submission
  messages: [],
  startupName: '',
  videoUrl: '',
  websiteUrl: '',
  fiveLiner: '',
  codeUrl: '',
  isAssessmentPhase: false,
  assessmentComplete: false,
  houseDecision: '',
  houseReasoning: '',
};

const STORAGE_KEY = 'challenge-state-v2';

// Video URL validation - check if URL is actually a video platform
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const videoPatterns = [
    /youtube\.com\/watch/i,
    /youtu\.be\//i,
    /vimeo\.com\//i,
    /loom\.com\//i,
    /drive\.google\.com.*\/file/i,
    /dropbox\.com.*\.mp4/i,
    /streamable\.com\//i,
    /wistia\.com\//i,
  ];
  return videoPatterns.some(pattern => pattern.test(url));
}

export function ChallengePhaseV2({ data, onNext, isAdmin = false }: ChallengePhaseProps) {
  const [state, setState] = useState<ChallengeState>(INITIAL_STATE);
  const [userMessage, setUserMessage] = useState('');
  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load state on mount
  useEffect(() => {
    const loadState = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Reconstruct Date objects
          parsed.messages = parsed.messages?.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })) || [];
          setState(parsed);
          console.log('✅ [Challenge] Loaded state from storage');
        }
      } catch (error) {
        console.error('❌ [Challenge] Failed to load state:', error);
      } finally {
        setMounted(true);
      }
    };

    loadState();
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, mounted]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (streamingMessage && isCoachTyping && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [streamingMessage, isCoachTyping]);

  // Main timer countdown
  useEffect(() => {
    if (!state.challengeStarted || state.isSubmissionPhase || state.timeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setState(prev => {
        if (prev.timeRemaining <= 1) {
          // Time's up! Switch to submission phase
          notifySubmissionPhase();
          return { ...prev, timeRemaining: 0, isSubmissionPhase: true };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.challengeStarted, state.isSubmissionPhase, state.timeRemaining]);

  // Submission timer countdown
  useEffect(() => {
    if (!state.isSubmissionPhase || state.submissionTimeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setState(prev => {
        if (prev.submissionTimeRemaining <= 1) {
          // Submission time up! Auto-assess
          handleTimeExpired();
          return { ...prev, submissionTimeRemaining: 0 };
        }
        return { ...prev, submissionTimeRemaining: prev.submissionTimeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isSubmissionPhase, state.submissionTimeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const notifySubmissionPhase = () => {
    const msg: Message = {
      role: 'coach',
      content: `🔥 **60 minutes up!** Great work!\n\nNow you have **30 minutes** to clean up and submit:\n\n1️⃣ **Video** (1:30 max) - Demo + proof\n2️⃣ **5-Liner** - Problem, solution, customer, opportunity, test\n\nDrop the links below! 🚀`,
      timestamp: new Date(),
    };
    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
  };

  const handleTimeExpired = () => {
    setState(prev => ({
      ...prev,
      isAssessmentPhase: true,
    }));
    startAssessment();
  };

  const startAssessment = async () => {
    setIsCoachTyping(true);
    setStreamingMessage('');
    setIsSearching(false);

    const searchTimeout = setTimeout(() => setIsSearching(true), 2000);

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
            founderName: data.profile?.name,
            archetype: data.profile?.archetype,
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
                clearTimeout(searchTimeout);
                setIsSearching(false);
                fullText += eventData.content;
                setStreamingMessage(fullText);
              } else if (eventData.type === 'complete') {
                fullText = eventData.fullText;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setStreamingMessage('');
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          role: 'coach',
          content: fullText,
          timestamp: new Date(),
        }],
      }));
      setIsCoachTyping(false);
    } catch (error) {
      console.error('Failed assessment:', error);
      setStreamingMessage('');
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          role: 'coach',
          content: `⏰ Time's up! Tell me what happened. Technical issues? Roadblocks?\n\nAre you serious about building? Can you commit 3 weeks?`,
          timestamp: new Date(),
        }],
      }));
      setIsCoachTyping(false);
    }
  };

  const handleStartChallenge = async () => {
    const startTime = new Date().toISOString();

    // Save challenge start time to database
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeStartedAt: startTime,
        }),
      });
      console.log('✅ [Database] Saved challenge start time');
    } catch (error) {
      console.error('❌ [Database] Failed to save start time:', error);
    }

    setState(prev => ({ ...prev, challengeStarted: true }));
    await getCoachWelcome();
  };

  const getCoachWelcome = async () => {
    setIsCoachTyping(true);
    setStreamingMessage('');
    setIsSearching(false);

    const searchTimeout = setTimeout(() => setIsSearching(true), 2000);

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
            founderName: data.profile?.name,
            archetype: data.profile?.archetype,
            linkedinUrl: data.linkedinUrl,
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
                clearTimeout(searchTimeout);
                setIsSearching(false);
                fullText += eventData.content;
                setStreamingMessage(fullText);
              } else if (eventData.type === 'complete') {
                fullText = eventData.fullText;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setStreamingMessage('');
      setState(prev => ({
        ...prev,
        messages: [{
          role: 'coach',
          content: fullText,
          timestamp: new Date(),
        }],
      }));
      setIsCoachTyping(false);
    } catch (error) {
      console.error('Failed to get welcome:', error);
      setStreamingMessage('');
      setState(prev => ({
        ...prev,
        messages: [{
          role: 'coach',
          content: "Hey! 👋 I'm Guddy. Let's build something awesome in 60 minutes!\n\nAre you building:\n1️⃣ A NEW idea\n2️⃣ A feature for an EXISTING project?",
          timestamp: new Date(),
        }],
      }));
      setIsCoachTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isCoachTyping) return;

    const newMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, newMsg] }));
    const currentMessage = userMessage;
    setUserMessage('');
    setIsCoachTyping(true);
    setStreamingMessage('');
    setIsSearching(false);

    const searchTimeout = setTimeout(() => setIsSearching(true), 2000);

    try {
      const response = await fetch('/api/founder-journey/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: state.isAssessmentPhase ? 'assessment' : 'challenge',
          userId: 'current-user',
          data: {
            challengeMode: state.isAssessmentPhase ? 'assessment-response' : 'coaching',
            userMessage: currentMessage,
            conversationHistory: state.messages,
            timeRemaining: Math.floor(state.timeRemaining / 60),
            founderBio: data.profile?.bio,
            founderName: data.profile?.name,
            archetype: data.profile?.archetype,
          },
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullText = '';
      let decision = '';
      let reasoning = '';

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
                setStreamingMessage(fullText);
              } else if (eventData.type === 'complete') {
                fullText = eventData.fullText;
                if (eventData.houseDecision) {
                  decision = eventData.houseDecision;
                  reasoning = eventData.reasoning || '';
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setStreamingMessage('');

      if (!fullText) throw new Error('Empty response');

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          role: 'coach',
          content: fullText,
          timestamp: new Date(),
        }],
        ...(decision && {
          houseDecision: decision,
          houseReasoning: reasoning,
          assessmentComplete: true,
        }),
      }));

      setIsCoachTyping(false);
    } catch (error) {
      console.error('Failed to get response:', error);
      setStreamingMessage('');
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          role: 'coach',
          content: `Sorry, having trouble responding. Error: ${error instanceof Error ? error.message : 'Unknown'}\n\nTry again!`,
          timestamp: new Date(),
        }],
      }));
      setIsCoachTyping(false);
    }
  };

  const handleSubmit = async () => {
    if (!state.startupName || !state.videoUrl || !state.fiveLiner) {
      alert('Please provide startup name, video URL, and 5-liner!');
      return;
    }

    // Validate video URL
    if (!isVideoUrl(state.videoUrl)) {
      const confirmSubmit = confirm(
        '⚠️ Video URL Warning\n\n' +
        'This doesn\'t look like a video link (YouTube, Loom, Vimeo, etc.).\n\n' +
        'People often put their website URL here by mistake.\n\n' +
        'If this is your website, use the "Website URL" field instead.\n\n' +
        'Submit anyway?'
      );
      if (!confirmSubmit) return;
    }

    const timeSpent = (60 * 60) - state.timeRemaining;
    const completedAt = new Date().toISOString();

    // Save to database
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupName: state.startupName,
          challengeCompletedAt: completedAt,
          challengeDurationSeconds: timeSpent,
          videoUrl: state.videoUrl,
          websiteUrl: state.websiteUrl || null,
          fiveLiner: state.fiveLiner,
          codeUrl: state.codeUrl,
          chatHistory: state.messages,
        }),
      });
      console.log('✅ [Database] Saved challenge submission');
    } catch (error) {
      console.error('❌ [Database] Failed to save submission:', error);
    }

    // Clear storage
    localStorage.removeItem(STORAGE_KEY);

    onNext({
      artifacts: {
        videoUrl: state.videoUrl,
        websiteUrl: state.websiteUrl,
        fiveLiner: state.fiveLiner,
        codeUrl: state.codeUrl,
        timeSpent,
        completedAt,
      },
    });
  };

  const handleContinue = async () => {
    const timeSpent = (60 * 60) - state.timeRemaining;
    const completedAt = new Date().toISOString();

    // Save to database
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupName: state.startupName || null,
          challengeCompletedAt: completedAt,
          challengeDurationSeconds: timeSpent,
          videoUrl: state.videoUrl || null,
          websiteUrl: state.websiteUrl || null,
          fiveLiner: state.fiveLiner || null,
          codeUrl: state.codeUrl || null,
          houseDecision: state.houseDecision,
          houseReasoning: state.houseReasoning,
          chatHistory: state.messages,
        }),
      });
      console.log('✅ [Database] Saved challenge assessment');
    } catch (error) {
      console.error('❌ [Database] Failed to save assessment:', error);
    }

    localStorage.removeItem(STORAGE_KEY);
    onNext({
      artifacts: {
        videoUrl: state.videoUrl || null,
        fiveLiner: state.fiveLiner || null,
        codeUrl: state.codeUrl || null,
        timeSpent,
        completedAt,
        submissionTimeExpired: true,
      },
      houseDecision: state.houseDecision,
      houseReasoning: state.houseReasoning,
    });
  };

  // Debug: fast-forward timers
  const debugAdvanceTime = (type: 'vibe' | 'submit') => {
    if (type === 'vibe') {
      setState(prev => ({ ...prev, timeRemaining: 15 }));
    } else {
      if (!state.isSubmissionPhase) {
        setState(prev => ({ ...prev, isSubmissionPhase: true }));
        notifySubmissionPhase();
      }
      setState(prev => ({ ...prev, submissionTimeRemaining: 15 }));
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">💻</div>
          <p className="text-gray-600">Loading challenge...</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">90-Minute Startup Challenge</h1>
        <p className="text-lg text-gray-700 mb-1">
          {!state.challengeStarted ? 'Ready to prove you can ship?' : 'You got this! 🚀'}
        </p>
        {!state.challengeStarted && (
          <p className="text-sm text-gray-600">60 min to build + 30 min to submit</p>
        )}
      </div>

      {!state.challengeStarted ? (
        /* Pre-Challenge */
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 mb-8 border-2 border-yellow-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Challenge</h2>
            <p className="text-lg text-gray-700 mb-6">
              <strong>90 minutes total:</strong> 60 min to build + 30 min to submit
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Deliverables:</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <div className="text-2xl mr-3">1️⃣</div>
                <div>
                  <strong>Video (1:30 max)</strong>
                  <p className="text-gray-700">Demo + proof you built it</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="text-2xl mr-3">2️⃣</div>
                <div>
                  <strong>5-Liner</strong>
                  <p className="text-gray-700">Problem, solution, customer, opportunity, test</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={handleStartChallenge}
              disabled={isCoachTyping}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 text-white text-xl font-bold px-12 py-4 rounded-full shadow-lg transition-all"
            >
              {isCoachTyping ? '⏳ Loading...' : '🔥 Start Challenge'}
            </button>
          </div>
        </div>
      ) : (
        /* Challenge Active */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Timer */}
            <div className={`rounded-2xl p-6 text-center ${
              state.isSubmissionPhase
                ? 'bg-orange-100 border-2 border-orange-300'
                : state.timeRemaining < 10 * 60
                ? 'bg-red-100 border-2 border-red-300'
                : 'bg-green-100 border-2 border-green-300'
            }`}>
              <div className="text-5xl font-bold mb-2">
                {state.isSubmissionPhase ? formatTime(state.submissionTimeRemaining) : formatTime(state.timeRemaining)}
              </div>
              <p className="text-gray-700 font-semibold">
                {state.isSubmissionPhase ? '⏰ Submission Time' : 'Time Remaining'}
              </p>
            </div>

            {/* Debug - Admin Only */}
            {isAdmin && (
              <div className="bg-gray-900 rounded-2xl p-4">
                <p className="text-gray-400 text-xs mb-2">🐛 DEBUG</p>
                <div className="space-y-2">
                  <button
                    onClick={() => debugAdvanceTime('vibe')}
                    disabled={state.isSubmissionPhase}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-sm px-3 py-2 rounded"
                  >
                    ⏩ Vibe Time → 15s
                  </button>
                  <button
                    onClick={() => debugAdvanceTime('submit')}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm px-3 py-2 rounded"
                  >
                    ⏩ Submit Time → 15s
                  </button>
                </div>
              </div>
            )}

            {/* Chat */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs mr-2">
                  G
                </div>
                Guddy
                {isCoachTyping && <span className="ml-3 text-sm text-blue-600 animate-pulse">typing...</span>}
              </h2>

              <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
                {state.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border-2 border-purple-200 text-gray-800'
                    }`}>
                      <LinkifiedText className="whitespace-pre-wrap">{msg.content}</LinkifiedText>
                      <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-600'}`}>
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
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        {isSearching && (
                          <span className="text-sm text-blue-600 italic">searching the web...</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isCoachTyping && userMessage.trim()) {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask Guddy anything..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  disabled={isCoachTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isCoachTyping || !userMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
              <h3 className="font-semibold mb-3">💡 Tips</h3>
              <ul className="text-sm space-y-2">
                <li>✅ Talk to Guddy first</li>
                <li>✅ Build ONE feature</li>
                <li>✅ Use AI tools</li>
                <li>✅ Simple &gt; Complex</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <h2 className="text-xl font-semibold mb-4">📦 Deliverables</h2>

              {state.assessmentComplete && state.houseDecision && (
                <div className="mb-4 p-4 rounded-lg border-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300">
                  <h3 className="font-bold text-lg mb-2">🏰 {state.houseDecision}</h3>
                  <LinkifiedText className="text-sm whitespace-pre-wrap">{state.houseReasoning}</LinkifiedText>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">Startup Name *</label>
                  <input
                    type="text"
                    value={state.startupName}
                    onChange={(e) => setState(prev => ({ ...prev, startupName: e.target.value }))}
                    placeholder="e.g., Acme AI, BuildFast, etc."
                    disabled={state.submissionTimeRemaining === 0 && !state.assessmentComplete}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">Video URL * (demo video)</label>
                  <input
                    type="url"
                    value={state.videoUrl}
                    onChange={(e) => setState(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://youtube.com/... or https://loom.com/..."
                    disabled={state.submissionTimeRemaining === 0 && !state.assessmentComplete}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">YouTube, Loom, Vimeo, etc.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">Website URL (optional)</label>
                  <input
                    type="url"
                    value={state.websiteUrl}
                    onChange={(e) => setState(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://yourstartup.com"
                    disabled={state.submissionTimeRemaining === 0 && !state.assessmentComplete}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your landing page or live demo</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">5-Liner *</label>
                  <textarea
                    value={state.fiveLiner}
                    onChange={(e) => setState(prev => ({ ...prev, fiveLiner: e.target.value }))}
                    rows={8}
                    placeholder="1. Problem:&#10;2. Solution:&#10;3. Customer:&#10;4. Opportunity:&#10;5. Test:"
                    disabled={state.submissionTimeRemaining === 0 && !state.assessmentComplete}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Code/GitHub (optional)</label>
                  <input
                    type="url"
                    value={state.codeUrl}
                    onChange={(e) => setState(prev => ({ ...prev, codeUrl: e.target.value }))}
                    placeholder="https://github.com/..."
                    disabled={state.submissionTimeRemaining === 0 && !state.assessmentComplete}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {state.assessmentComplete ? (
                  <button
                    onClick={handleContinue}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg"
                  >
                    ➡️ Continue to {state.houseDecision}
                  </button>
                ) : state.submissionTimeRemaining === 0 ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 font-bold py-3 rounded-lg cursor-not-allowed"
                  >
                    Complete conversation above
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!state.startupName || !state.videoUrl || !state.fiveLiner}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg"
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

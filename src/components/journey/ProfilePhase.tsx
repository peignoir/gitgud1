'use client';

import { useState, useEffect, useRef } from 'react';
import { MemoryManager } from '@/lib/utils/founder-memory';

interface ProfilePhaseProps {
  data: Record<string, any>;
  onNext: (data: any) => void;
}

export function ProfilePhase({ data, onNext }: ProfilePhaseProps) {
  const [streaming, setStreaming] = useState(true); // Start as true so indicators show immediately
  const [generatedBio, setGeneratedBio] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [archetype, setArchetype] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState('🔍 Initializing...');
  const [chunkCount, setChunkCount] = useState(0);
  const [linkedinData, setLinkedinData] = useState('');
  const [showLinkedInInput, setShowLinkedInInput] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('getting ready to research... 🚀');
  const [isReasoning, setIsReasoning] = useState(false);
  const streamContainerRef = useRef<HTMLDivElement>(null);

  // Funny thinking messages (rotate every 3 seconds during research)
  const thinkingMessages = [
    "stalking your LinkedIn... professionally 👀",
    "reading between the lines of your bio 📖",
    "connecting the dots of your journey 🔗",
    "finding your secret superpowers 🦸",
    "uncovering your founder DNA 🧬",
    "researching your entrepreneurial adventures 🗺️",
    "analyzing your wins and learnings 📊",
    "discovering what makes you unique 💎",
    "compiling your greatest hits 🎯",
    "piecing together your story 🧩",
  ];

  // Reasoning messages (when Guddy is thinking deeply)
  const reasoningMessages = [
    "thinking like a VC analyst about your story 🧠",
    "crafting your narrative as if pitching to YC 📝",
    "analyzing patterns in your journey 🔍",
    "connecting your wins and learnings 💡",
    "synthesizing what makes you unique 🎨",
    "weighing every word like an investor would ⚖️",
    "finding your unfair advantage 🌟",
    "polishing your founder story ✨",
  ];

  useEffect(() => {
    generateProfile();
  }, []);

  useEffect(() => {
    if (streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [generatedBio]);

  // Rotate thinking messages while streaming
  useEffect(() => {
    if (streaming && chunkCount === 0) {
      // Set initial message
      setThinkingMessage(thinkingMessages[0]);
      
      // After 20 seconds, switch to "reasoning" phase (Guddy analyzing deeply)
      const reasoningTimeout = setTimeout(() => {
        if (chunkCount === 0) {
          setIsReasoning(true);
          setProgressStatus('🧠 Guddy is analyzing like a VC...');
          setThinkingMessage(reasoningMessages[0]);
        }
      }, 20000); // 20 seconds (after web research completes)
      
      // Rotate messages every 3 seconds
      const interval = setInterval(() => {
        const messages = isReasoning ? reasoningMessages : thinkingMessages;
        setThinkingMessage(messages[Math.floor(Math.random() * messages.length)]);
      }, 3000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(reasoningTimeout);
      };
    } else if (!streaming) {
      setThinkingMessage('');
      setIsReasoning(false);
    }
  }, [streaming, chunkCount, isReasoning]);

  const generateProfile = async () => {
    // Set streaming FIRST so animations show immediately
    setStreaming(true);
    setGeneratedBio('');
    setProgressStatus('🔍 Starting research...');
    setChunkCount(0);
    setThinkingMessage(thinkingMessages[0]); // Show first thinking message immediately

    console.log('⚡ [Profile] Starting generation, streaming=true');

    // Add timeout to detect stuck requests
    const timeoutId = setTimeout(() => {
      if (streaming) {
        setProgressStatus('⚠️ Guddy is being extra thorough today...');
      }
    }, 60000); // 60 seconds (give it more time before warning)

    try {
      setProgressStatus('🔍 Guddy is diving into your background...');
      
      const response = await fetch('/api/founder-journey/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: 'profile',
          userId: 'current-user',
          data: {
            researchSummary: data.research?.summary,
            linkedinUrl: data.research?.linkedinUrl || data.linkedinUrl,
            linkedinData: linkedinData || undefined, // User-provided LinkedIn text
            resumeText: data.resumeText || undefined, // User-provided resume/bio text
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      setProgressStatus('🔍 Guddy is hunting for your achievements...');

      const decoder = new TextDecoder();
      let fullText = '';
      let hasStarted = false;
      let readCount = 0;

      console.log('🔄 [Profile] Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();
        readCount++;
        
        if (done) {
          console.log(`🏁 [Profile] Stream done after ${readCount} reads, final text length: ${fullText.length}`);
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              
              if (eventData.type === 'start') {
                hasStarted = true;
                setProgressStatus('✍️ Guddy is crafting your story...');
                clearTimeout(timeoutId);
                console.log('🚀 [Profile] Stream started');
              } else if (eventData.type === 'chunk') {
                if (!hasStarted) {
                  hasStarted = true;
                  setProgressStatus('✍️ Guddy is writing...');
                  clearTimeout(timeoutId);
                  console.log('🚀 [Profile] Stream started (via first chunk)');
                }
                
                // First chunk - clear reasoning state
                if (chunkCount === 0) {
                  setIsReasoning(false);
                  setProgressStatus('✍️ Guddy is crafting your investor-ready bio...');
                }
                
                fullText += eventData.content;
                setGeneratedBio(fullText);
                setChunkCount(prev => prev + 1);
                
                // Log first chunk and every 20th chunk
                const currentCount = chunkCount + 1;
                if (currentCount === 1 || currentCount % 20 === 0) {
                  console.log(`📨 [Profile] Chunk ${currentCount}: "${eventData.content.substring(0, 50)}..." (${eventData.content.length} chars, total: ${fullText.length})`);
                }
                
                // Update progress based on content length
                if (fullText.length > 100 && fullText.length < 300) {
                  setProgressStatus('📝 Guddy is highlighting your wins...');
                } else if (fullText.length >= 300) {
                  setProgressStatus('🎯 Guddy is identifying what makes you unique...');
                }
              } else if (eventData.type === 'complete') {
                fullText = eventData.fullText;
                console.log(`✅ [Profile] Complete event received, fullText length: ${fullText?.length || 0}`);
                console.log(`✅ [Profile] Complete preview: "${fullText?.substring(0, 200) || '(empty)'}..."`);
                
                setGeneratedBio(fullText);
                setProgressStatus('✅ Guddy crafted your story!');
                clearTimeout(timeoutId);
                
                // Check for empty response - likely an error
                if (!fullText || fullText.trim().length === 0) {
                  console.error('❌ [Profile] Empty response received from complete event');
                  console.error('❌ [Profile] eventData:', JSON.stringify(eventData));
                  throw new Error('Profile generation returned empty response. This may be a model configuration issue.');
                }
              } else if (eventData.type === 'error') {
                console.error('❌ [Profile] Error event received:', eventData.error);
                throw new Error(eventData.error || 'Unknown error');
              }
            } catch (e) {
              console.warn('Failed to parse event data:', e);
            }
          }
        }
      }

      clearTimeout(timeoutId);
      setEditedBio(fullText);
      setStreaming(false);

      // Extract archetype from bio
      extractArchetype(fullText);

    } catch (error) {
      console.error('Profile generation failed:', error);
      clearTimeout(timeoutId);
      setStreaming(false);
      setProgressStatus('❌ Error occurred');
      
      // Better error message for empty responses
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isEmptyResponse = errorMessage.includes('empty response');
      
      const linkedinUrl = data.research?.linkedinUrl || data.linkedinUrl;
      const fallbackBio = isEmptyResponse
        ? `⚠️ Guddy couldn't generate your bio (model configuration issue). Please edit this section to describe your professional background, key achievements, companies you've worked at (with dates), and what makes you a unique founder.`
        : linkedinUrl 
          ? `Unable to generate bio automatically. Please provide your LinkedIn URL (${linkedinUrl}) to the AI for research, or edit this bio manually to describe your professional background, achievements, and founder journey.`
          : 'Unable to generate bio automatically. Please edit this section to describe your professional background, key achievements, companies you\'ve worked at (with dates), and what makes you a unique founder.';
      
      setGeneratedBio(fallbackBio);
      setEditedBio(fallbackBio);
      setArchetype('Builder');
      
      // Show user-friendly alert for empty response
      if (isEmptyResponse) {
        console.error('❌ [Profile] Empty response - likely model issue. Check if GPT-5 is available or switch to GPT-4o');
        // Don't alert user immediately - they can edit the fallback bio
      }
    }
  };

  const extractArchetype = (bioText: string) => {
    const archetypes = ['Visionary', 'Operator', 'Researcher', 'Builder']; // Reordered: check Visionary first
    
    for (const type of archetypes) {
      // Use word boundary regex to match whole words only (avoid "building" matching "builder")
      const regex = new RegExp(`\\b${type}\\b`, 'i'); // \b = word boundary, i = case insensitive
      if (regex.test(bioText)) {
        console.log(`🎯 [Profile] Found archetype: ${type} in bio`);
        setArchetype(type);
        return;
      }
    }
    
    // Default to Builder if no archetype found
    console.log('⚠️ [Profile] No archetype found in bio, defaulting to Builder');
    setArchetype('Builder');
  };

  const handleSave = () => {
    setIsEditing(false);
    setGeneratedBio(editedBio);
  };

  const handleContinue = async () => {
    // Extract structured info from bio and save to FounderMemory
    const extractFounderInfo = (bio: string) => {
      const lines = bio.split(/[.!?]\s+/);

      // Extract name (first sentence pattern)
      const nameMatch = bio.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|has|was|co-founded)/);
      const name = nameMatch ? nameMatch[1] : undefined;

      // Extract companies (look for company names and years)
      const companies: any[] = [];
      const companyPattern = /(?:founded|co-founded|joined|worked at|advisor to)\s+([A-Z][a-zA-Z\s]+?)(?:\s+\((\d{4}(?:-\d{4}|-present)?)\))?/g;
      let match;
      while ((match = companyPattern.exec(bio)) !== null) {
        companies.push({
          name: match[1].trim(),
          role: match[0].includes('co-founded') ? 'Co-founder' : match[0].includes('founded') ? 'Founder' : 'Team Member',
          years: match[2] || 'Unknown',
        });
      }

      // Extract education (look for university/degree mentions)
      const education: any[] = [];
      const eduPattern = /(Master's|Bachelor's|PhD|degree)\s+(?:in\s+)?([^,]+?)\s+from\s+([^,\.]+)/gi;
      while ((match = eduPattern.exec(bio)) !== null) {
        education.push({
          degree: match[1],
          field: match[2].trim(),
          school: match[3].trim(),
        });
      }

      return { name, companies, education };
    };

    const extracted = extractFounderInfo(editedBio);

    // Save to FounderMemory (client-side)
    MemoryManager.saveFounderMemory({
      name: extracted.name,
      bio: editedBio,
      archetype: archetype as any || 'Builder',
      companies: extracted.companies,
      education: extracted.education,
      linkedinUrl: data.linkedinUrl || data.research?.linkedinUrl,
    });

    console.log('💾 [Founder Memory] Saved profile to localStorage');

    // Save to database
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: extracted.name,
          bio: editedBio,
          linkedinUrl: data.linkedinUrl || data.research?.linkedinUrl,
          archetype: archetype || 'Builder',
          researchData: data.research,
        }),
      });
      console.log('✅ [Database] Saved profile to Supabase');
    } catch (error) {
      console.error('❌ [Database] Failed to save profile:', error);
      // Continue anyway - localStorage backup exists
    }

    onNext({
      profile: {
        bio: editedBio,
        archetype: archetype || 'Builder',
        name: extracted.name,
      }
    });
  };

  const archetypeInfo: Record<string, { emoji: string; description: string; examples: string }> = {
    Builder: {
      emoji: '🔨',
      description: 'You excel at creating products and solving technical challenges',
      examples: 'Mark Zuckerberg, Larry Page, Patrick Collison'
    },
    Visionary: {
      emoji: '🔮',
      description: 'You see the future and inspire others to build it with you',
      examples: 'Elon Musk, Jeff Bezos, Steve Jobs'
    },
    Operator: {
      emoji: '⚙️',
      description: 'You turn ideas into scalable, efficient businesses',
      examples: 'Sheryl Sandberg, Tim Cook, Satya Nadella'
    },
    Researcher: {
      emoji: '🔬',
      description: 'You bring deep scientific/technical expertise to innovation',
      examples: 'Larry Page, Demis Hassabis, Daphne Koller'
    },
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mb-3">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full text-sm shadow-md">
            GitGud.vc
          </span>
        </div>
        <div className="text-6xl mb-4">✨</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Founder Profile</h1>
        <p className={`text-lg font-semibold mb-2 ${isReasoning ? 'text-purple-700' : streaming ? 'text-blue-700' : 'text-gray-700'}`}>
          {isReasoning 
            ? '🧠 Guddy is thinking deeply like a VC analyst...' 
            : streaming 
              ? '🔍 Guddy is researching your achievements...' 
              : 'Meet Guddy, your AI mentor & VC analyst'
          }
        </p>
        <p className="text-sm text-gray-600">
          {streaming 
            ? (isReasoning 
                ? 'Analyzing patterns, finding your unfair advantage...'
                : 'Searching for companies, exits, interviews, achievements...'
              )
            : 'She\'ll help you craft an investor-ready founder story'
          }
        </p>
      </div>

      {/* Archetype Badge - ONLY show after bio is complete */}
      {archetype && generatedBio && !streaming && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-8 border-2 border-purple-200">
          <div className="text-center">
            <div className="text-5xl mb-3">{archetypeInfo[archetype]?.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Guddy thinks you're a <span className="text-purple-600">{archetype}</span> Founder
            </h2>
            <p className="text-gray-700 mb-4">
              {archetypeInfo[archetype]?.description}
            </p>
            <p className="text-sm text-gray-600">
              Famous {archetype}s: {archetypeInfo[archetype]?.examples}
            </p>
          </div>
        </div>
      )}


      {/* BIG LOADING ANIMATION - Shows when streaming but no bio yet */}
      {streaming && !generatedBio && (
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-12 mb-8 border-4 border-blue-400 animate-pulse">
          <div className="text-center space-y-6">
            {/* GIANT bouncing animation */}
            <div className="flex justify-center items-center space-x-4">
              <div className="w-6 h-6 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
              <div className="w-6 h-6 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.6s' }} />
              <div className="w-6 h-6 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '0.6s' }} />
            </div>
            
            {/* BIG STATUS */}
            <h3 className={`text-3xl font-bold ${isReasoning ? 'text-purple-700' : 'text-blue-700'} animate-pulse`}>
              {isReasoning 
                ? '🧠 Guddy is Analyzing Like a VC...' 
                : '🔍 Guddy is Deep in Research...'
              }
            </h3>
            
            {/* Rotating message */}
            {thinkingMessage && (
              <p className="text-xl text-gray-700 font-medium animate-pulse">
                {thinkingMessage}
              </p>
            )}
            
            {/* What's happening */}
            <div className={`text-lg ${isReasoning ? 'text-purple-600' : 'text-blue-600'} font-medium`}>
              {isReasoning 
                ? 'Connecting dots, finding patterns, identifying your edge...'
                : 'Searching companies, exits, interviews, achievements...'
              }
            </div>
          </div>
        </div>
      )}

      {/* Generated Bio - Only show when bio text exists */}
      {generatedBio && (
      <div className="bg-white rounded-2xl p-8 mb-8 border-2 border-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full mr-3 ${streaming ? 'bg-gradient-to-br from-blue-600 to-indigo-600 animate-pulse' : 'bg-gradient-to-br from-blue-600 to-indigo-600'} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
              G
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {streaming && !generatedBio
                ? (isReasoning ? 'Thinking Deeply...' : 'Working on Your Bio...') 
                : generatedBio
                  ? 'Your Founder Bio'
                  : 'Getting Ready...'
              }
            </h2>
          </div>
          {!streaming && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isEditing ? '✓ Save' : '✏️ Edit'}
            </button>
          )}
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={editedBio}
              onChange={(e) => setEditedBio(e.target.value)}
              onBlur={handleSave}
              className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg leading-relaxed text-gray-900 placeholder-gray-600"
              placeholder="Edit your bio..."
            />
            <p className="text-sm text-gray-600 mt-2">
              Make it your own! Keep it authentic and compelling.
            </p>
          </div>
        ) : (
          <div 
            ref={streamContainerRef}
            className="prose max-w-none text-lg leading-relaxed text-gray-900"
          >
            {generatedBio || ''}
            {streaming && generatedBio && (
              <span className="inline-block w-2 h-5 bg-blue-600 animate-pulse ml-1" />
            )}
          </div>
        )}
      </div>
      )}

      {/* Continue Button */}
      {generatedBio && !streaming && (
        <div className="text-center">
          <button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold px-10 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Ready for the Challenge →
          </button>
          <p className="text-gray-600 mt-3 text-sm">
            Next: Prove you can ship in 60 minutes 🚀
          </p>
        </div>
      )}

    </div>
  );
}

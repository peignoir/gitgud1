'use client';

import { useState, useEffect } from 'react';

interface SprintPhaseProps {
  data: Record<string, any>;
  onUpdate: (data: any) => void;
}

interface OKR {
  id: string;
  objective: string;
  keyResults: string[];
  completed: boolean;
}

export function SprintPhase({ data, onUpdate }: SprintPhaseProps) {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [userUpdate, setUserUpdate] = useState('');
  const [mentorResponse, setMentorResponse] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('10-15');
  const [isSetup, setIsSetup] = useState(false);

  const category = data.evaluation?.category || 'vc-backable';

  useEffect(() => {
    if (!isSetup) {
      setupSprint();
    }
  }, []);

  const setupSprint = async () => {
    // Get initial OKRs from mentor
    const response = await fetch('/api/founder-journey/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phase: 'sprint',
        userId: 'current-user',
        data: {
          sprintAction: 'setup',
          evaluationFeedback: data.evaluation?.feedback,
          timeCommitment,
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
              fullText += eventData.content;
            } else if (eventData.type === 'complete') {
              fullText = eventData.fullText;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    setMentorResponse(fullText);
    setIsSetup(true);

    // Initialize OKRs (would parse from mentor response in production)
    setOkrs([
      {
        id: '1',
        objective: 'Customer Discovery',
        keyResults: ['Complete 5 customer interviews', 'Identify 3 pain points', 'Validate problem hypothesis'],
        completed: false,
      },
      {
        id: '2',
        objective: 'Market Research',
        keyResults: ['Research 10 competitors', 'Define unique value prop', 'Size the market'],
        completed: false,
      },
      {
        id: '3',
        objective: 'MVP Progress',
        keyResults: ['Define core feature set', 'Build first prototype', 'Get 3 early users'],
        completed: false,
      },
    ]);
  };

  const handleWeeklyCheckIn = async () => {
    if (!userUpdate.trim()) return;

    const response = await fetch('/api/founder-journey/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phase: 'sprint',
        userId: 'current-user',
        data: {
          sprintAction: 'checkin',
          currentWeek,
          userUpdate,
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
              fullText += eventData.content;
            } else if (eventData.type === 'complete') {
              fullText = eventData.fullText;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    setMentorResponse(fullText);
    setUserUpdate('');
  };

  const toggleOKR = (id: string) => {
    setOkrs(okrs.map(okr =>
      okr.id === id ? { ...okr, completed: !okr.completed } : okr
    ));
  };

  const advanceWeek = () => {
    if (currentWeek < 3) {
      setCurrentWeek(currentWeek + 1);
      setMentorResponse('');
      // In production, load new OKRs for next week
    }
  };

  const completedOKRs = okrs.filter(okr => okr.completed).length;
  const progress = (completedOKRs / okrs.length) * 100;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🏃</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">3-Week Sprint</h1>
        <p className="text-lg text-gray-700">
          Week {currentWeek} of 3 • {category === 'vc-backable' ? 'VC Track' : 'Bootstrap Track'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: OKRs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Bar */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Week {currentWeek} Progress</h2>
              <span className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {completedOKRs} of {okrs.length} objectives completed
            </p>
          </div>

          {/* OKRs List */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h2 className="text-xl font-semibold mb-4">📋 Your OKRs</h2>
            <div className="space-y-4">
              {okrs.map((okr) => (
                <div key={okr.id} className="border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{okr.objective}</h3>
                    <button
                      onClick={() => toggleOKR(okr.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        okr.completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {okr.completed ? '✓ Done' : 'Mark Done'}
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {okr.keyResults.map((kr, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <span className="mr-2">→</span>
                        <span className={okr.completed ? 'line-through' : ''}>{kr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Check-in */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
            <h2 className="text-xl font-semibold mb-4">💬 Weekly Check-in</h2>
            <textarea
              value={userUpdate}
              onChange={(e) => setUserUpdate(e.target.value)}
              rows={4}
              placeholder="Share your progress, wins, blockers, or questions..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none mb-4"
            />
            <button
              onClick={handleWeeklyCheckIn}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-lg w-full"
            >
              Get Mentor Feedback
            </button>
          </div>

          {/* Mentor Response */}
          {mentorResponse && (
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-200">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">🧙</span>
                <h2 className="text-xl font-semibold">Your Mentor</h2>
              </div>
              <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                {mentorResponse}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Community & Resources */}
        <div className="space-y-6">
          {/* Week Navigation */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="font-semibold mb-4">Sprint Timeline</h3>
            <div className="space-y-2">
              {[1, 2, 3].map((week) => (
                <div
                  key={week}
                  className={`p-3 rounded-lg border-2 ${
                    week === currentWeek
                      ? 'border-blue-500 bg-blue-50'
                      : week < currentWeek
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Week {week}</span>
                    {week < currentWeek && <span>✓</span>}
                    {week === currentWeek && <span>🔵</span>}
                  </div>
                </div>
              ))}
            </div>
            {currentWeek < 3 && (
              <button
                onClick={advanceWeek}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg"
              >
                Advance to Week {currentWeek + 1}
              </button>
            )}
          </div>

          {/* Community */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
            <h3 className="font-semibold mb-3">👥 Your Cohort</h3>
            <p className="text-sm text-gray-700 mb-4">
              Connect with other founders in your sprint
            </p>
            <div className="space-y-2">
              {['Sarah K.', 'Mike R.', 'Priya S.'].map((name, idx) => (
                <div key={idx} className="flex items-center bg-white p-2 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 mr-2" />
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm">
              Join Group Chat
            </button>
          </div>

          {/* Resources */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="font-semibold mb-3">📚 Resources</h3>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-blue-600 hover:underline">
                → YC Startup School
              </a>
              <a href="#" className="block text-blue-600 hover:underline">
                → Customer Dev Guide
              </a>
              <a href="#" className="block text-blue-600 hover:underline">
                → {category === 'vc-backable' ? 'Fundraising Playbook' : 'Bootstrap Handbook'}
              </a>
              <a href="#" className="block text-blue-600 hover:underline">
                → Founder Stories
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Week 3 Complete */}
      {currentWeek === 3 && progress === 100 && (
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-300 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Sprint Complete!</h2>
          <p className="text-lg text-gray-700 mb-6">
            You've completed the 3-week program. Time to keep building!
          </p>
          <button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-bold px-10 py-3 rounded-full shadow-lg">
            View Dashboard & Rankings
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  email: string;
  name: string;
  startup_name: string;
  bio: string;
  archetype: string;
  video_url: string;
  five_liner: string;
  code_url: string;
  house_decision: string;
  challenge_duration_seconds: number;
  challenge_completed_at: string;
  created_at: string;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🚀</div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (selectedSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => setSelectedSubmission(null)}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to all submissions
          </button>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedSubmission.startup_name}</h1>
                <p className="text-lg text-gray-600 mb-1">by {selectedSubmission.name}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {selectedSubmission.archetype}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {selectedSubmission.house_decision}
                  </span>
                  <span className="text-sm text-gray-600">
                    ⏱️ Completed in {formatDuration(selectedSubmission.challenge_duration_seconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">About the Founder</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.bio}</p>
            </div>
          </div>

          {/* Video */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📹 Demo Video</h2>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              {selectedSubmission.video_url ? (
                <iframe
                  src={selectedSubmission.video_url.replace('watch?v=', 'embed/')}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <p className="text-gray-500">No video submitted</p>
              )}
            </div>
            <a
              href={selectedSubmission.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              🔗 Open video in new tab
            </a>
          </div>

          {/* 5-Liner */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Business Plan (5-Liner)</h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 font-sans">{selectedSubmission.five_liner}</pre>
            </div>
          </div>

          {/* Code */}
          {selectedSubmission.code_url && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">💻 Code</h2>
              <a
                href={selectedSubmission.code_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">90-Minute Startup Challenge</h1>
          <p className="text-xl text-gray-600">All Submissions</p>
          <p className="text-gray-500 mt-2">{submissions.length} startups built in 90 minutes</p>
        </div>

        {/* Submissions Grid */}
        {submissions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No submissions yet</h2>
            <p className="text-gray-600 mb-6">Be the first to complete the challenge!</p>
            <button
              onClick={() => router.push('/founder-journey')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Start Challenge
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                onClick={() => setSelectedSubmission(submission)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{submission.startup_name}</h3>
                  <p className="text-blue-100">by {submission.name}</p>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {submission.archetype}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {submission.house_decision}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {submission.bio}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                    <span>⏱️ {formatDuration(submission.challenge_duration_seconds)}</span>
                    <span>{formatDate(submission.challenge_completed_at)}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-6">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  bio: string;
  linkedin_url: string;
  archetype: string;
  startup_name: string;
  house_decision: string;
  challenge_completed_at: string;
  created_at: string;
  last_login_at: string;
}

const archetypeColors = {
  Builder: 'from-blue-500 to-cyan-500',
  Visionary: 'from-purple-500 to-pink-500',
  Operator: 'from-green-500 to-emerald-500',
  Researcher: 'from-orange-500 to-red-500',
};

const archetypeEmojis = {
  Builder: '🔨',
  Visionary: '🔮',
  Operator: '⚙️',
  Researcher: '🔬',
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Check admin access
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && session?.user?.email !== 'franck@recorp.co') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users?all=true');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.archetype === filter;
    const matchesSearch = !search ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.bio?.toLowerCase().includes(search.toLowerCase()) ||
      user.startup_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || session?.user?.email !== 'franck@recorp.co') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Founder Bios</h1>
              <p className="text-gray-600 mt-1">Admin Dashboard - {users.length} founders</p>
            </div>
            <button
              onClick={() => router.push('/founder-journey')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              ← Back to Journey
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, bio, or startup..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {['Builder', 'Visionary', 'Operator', 'Researcher'].map((arch) => (
                <button
                  key={arch}
                  onClick={() => setFilter(arch)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === arch
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {archetypeEmojis[arch as keyof typeof archetypeEmojis]} {arch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Cards Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No founders found</h2>
            <p className="text-gray-600">
              {search || filter !== 'all' ? 'Try adjusting your filters' : 'No users in database yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-gray-200"
              >
                {/* Card Header with Gradient */}
                <div className={`h-24 bg-gradient-to-r ${archetypeColors[user.archetype as keyof typeof archetypeColors] || 'from-gray-400 to-gray-600'} relative`}>
                  <div className="absolute -bottom-8 left-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-gray-700 shadow-lg border-4 border-white">
                      {user.name?.[0] || user.email?.[0] || '?'}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="pt-10 px-6 pb-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 truncate">
                        {user.name || user.email}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Archetype Badge */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${archetypeColors[user.archetype as keyof typeof archetypeColors] || 'from-gray-400 to-gray-600'}`}>
                      {archetypeEmojis[user.archetype as keyof typeof archetypeEmojis]} {user.archetype}
                    </span>
                    {user.house_decision && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {user.house_decision}
                      </span>
                    )}
                    {user.challenge_completed_at && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✅ Challenge Done
                      </span>
                    )}
                  </div>

                  {/* Startup Name */}
                  {user.startup_name && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-blue-600">
                        🚀 {user.startup_name}
                      </p>
                    </div>
                  )}

                  {/* Bio Preview */}
                  <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                    {user.bio || 'No bio yet'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      View Full Bio →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Full Bio */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-6 bg-gradient-to-r ${archetypeColors[selectedUser.archetype as keyof typeof archetypeColors] || 'from-gray-400 to-gray-600'} text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedUser.name || selectedUser.email}</h2>
                  <p className="text-white/90">{selectedUser.email}</p>
                  {selectedUser.startup_name && (
                    <p className="text-lg font-semibold mt-2">🚀 {selectedUser.startup_name}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${archetypeColors[selectedUser.archetype as keyof typeof archetypeColors]}`}>
                  {archetypeEmojis[selectedUser.archetype as keyof typeof archetypeEmojis]} {selectedUser.archetype}
                </span>
                {selectedUser.house_decision && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                    {selectedUser.house_decision}
                  </span>
                )}
              </div>

              {/* Full Bio */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Bio</h3>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                  {selectedUser.bio || 'No bio available'}
                </div>
              </div>

              {/* LinkedIn */}
              {selectedUser.linkedin_url && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">LinkedIn</h3>
                  <a
                    href={selectedUser.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {selectedUser.linkedin_url}
                  </a>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Joined:</span>
                    <span className="ml-2 font-medium">{new Date(selectedUser.created_at).toLocaleString()}</span>
                  </div>
                  {selectedUser.last_login_at && (
                    <div>
                      <span className="text-gray-600">Last active:</span>
                      <span className="ml-2 font-medium">{new Date(selectedUser.last_login_at).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedUser.challenge_completed_at && (
                    <div>
                      <span className="text-gray-600">Challenge completed:</span>
                      <span className="ml-2 font-medium">{new Date(selectedUser.challenge_completed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

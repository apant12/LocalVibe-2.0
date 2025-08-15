import React, { useState } from 'react';
import { Gift, Star, Trophy, Award, Target, TrendingUp, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  isRedeemed: boolean;
  isAvailable: boolean;
  icon: string;
}

const RewardsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'rewards'>('overview');

  // Mock user data
  const userPoints = 1250;
  const userLevel = 8;
  const totalBookings = 12;
  const totalReviews = 8;

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Booking',
      description: 'Complete your first experience booking',
      icon: '🎯',
      points: 50,
      isUnlocked: true,
      progress: 1,
      maxProgress: 1
    },
    {
      id: '2',
      title: 'Explorer',
      description: 'Book 5 different types of experiences',
      icon: '🗺️',
      points: 100,
      isUnlocked: true,
      progress: 5,
      maxProgress: 5
    },
    {
      id: '3',
      title: 'Review Master',
      description: 'Leave 10 reviews for experiences',
      icon: '⭐',
      points: 150,
      isUnlocked: false,
      progress: 8,
      maxProgress: 10
    },
    {
      id: '4',
      title: 'Video Creator',
      description: 'Upload 5 videos of your experiences',
      icon: '📹',
      points: 200,
      isUnlocked: false,
      progress: 2,
      maxProgress: 5
    },
    {
      id: '5',
      title: 'Social Butterfly',
      description: 'Share 20 experiences on social media',
      icon: '🦋',
      points: 75,
      isUnlocked: false,
      progress: 12,
      maxProgress: 20
    }
  ];

  const rewards: Reward[] = [
    {
      id: '1',
      title: '10% Off Next Booking',
      description: 'Get 10% discount on your next experience',
      pointsRequired: 500,
      isRedeemed: false,
      isAvailable: true,
      icon: '🎫'
    },
    {
      id: '2',
      title: 'Free Coffee Experience',
      description: 'Redeem a free coffee tasting experience',
      pointsRequired: 1000,
      isRedeemed: false,
      isAvailable: true,
      icon: '☕'
    },
    {
      id: '3',
      title: 'VIP Concert Access',
      description: 'Get early access to concert tickets',
      pointsRequired: 2000,
      isRedeemed: false,
      isAvailable: false,
      icon: '🎵'
    },
    {
      id: '4',
      title: 'Free Experience',
      description: 'Redeem any experience up to $50',
      pointsRequired: 1500,
      isRedeemed: true,
      isAvailable: false,
      icon: '🎁'
    }
  ];

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const availableRewards = rewards.filter(r => r.isAvailable && !r.isRedeemed);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
          <p className="text-gray-600 mt-1">Earn points and unlock amazing rewards</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'achievements'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Achievements ({unlockedAchievements.length}/{achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'rewards'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Rewards ({availableRewards.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Points and Level */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Level {userLevel}</h2>
                  <p className="text-blue-100">Keep exploring to level up!</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{userPoints}</div>
                  <div className="text-blue-100">Total Points</div>
                </div>
              </div>
              <div className="w-full bg-blue-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(userPoints % 200) / 2}%` }}
                ></div>
              </div>
              <p className="text-sm text-blue-100 mt-2">
                {200 - (userPoints % 200)} points to next level
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
                    <div className="text-sm text-gray-600">Total Bookings</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{totalReviews}</div>
                    <div className="text-sm text-gray-600">Reviews Written</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{unlockedAchievements.length}</div>
                    <div className="text-sm text-gray-600">Achievements</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                {unlockedAchievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{achievement.title}</div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                    </div>
                    <div className="text-green-600 font-semibold">+{achievement.points}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className={`text-3xl ${achievement.isUnlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                      {achievement.isUnlocked && (
                        <Award className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            achievement.isUnlocked ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">+{achievement.points}</div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            {rewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{reward.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{reward.title}</h3>
                      {reward.isRedeemed && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Redeemed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{reward.pointsRequired} points required</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {reward.isRedeemed ? (
                      <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm">
                        Redeemed
                      </button>
                    ) : reward.isAvailable && userPoints >= reward.pointsRequired ? (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        Redeem
                      </button>
                    ) : (
                      <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm">
                        {userPoints < reward.pointsRequired ? 'Need More Points' : 'Coming Soon'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;

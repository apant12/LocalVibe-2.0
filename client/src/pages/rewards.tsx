import { useQuery } from "@tanstack/react-query";
import HeaderNav from "@/components/HeaderNav";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Gift, Target, TrendingUp, Award } from "lucide-react";

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl: string;
  isUnlocked: boolean;
  category: 'achievement' | 'redeemable' | 'milestone';
}

interface UserStats {
  totalPoints: number;
  level: number;
  experienceToNextLevel: number;
  totalExperience: number;
  achievements: number;
  experiencesCompleted: number;
}

export default function Rewards() {
  const { user } = useAuth();

  const { data: userStats = {
    totalPoints: 1250,
    level: 8,
    experienceToNextLevel: 250,
    totalExperience: 1750,
    achievements: 12,
    experiencesCompleted: 24
  } } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const { data: rewards = [
    {
      id: "1",
      name: "Early Bird Badge",
      description: "Complete 5 experiences before 9 AM",
      pointsCost: 0,
      imageUrl: "https://via.placeholder.com/60x60/FFD700/000000?text=🌅",
      isUnlocked: true,
      category: 'achievement'
    },
    {
      id: "2",
      name: "Adventure Seeker",
      description: "Visit 10 different cities",
      pointsCost: 0,
      imageUrl: "https://via.placeholder.com/60x60/4CAF50/000000?text=🗺️",
      isUnlocked: true,
      category: 'achievement'
    },
    {
      id: "3",
      name: "Free Coffee",
      description: "Redeem for a free coffee at partner locations",
      pointsCost: 500,
      imageUrl: "https://via.placeholder.com/60x60/8B4513/000000?text=☕",
      isUnlocked: false,
      category: 'redeemable'
    },
    {
      id: "4",
      name: "50% Off Next Experience",
      description: "Get 50% off your next booked experience",
      pointsCost: 1000,
      imageUrl: "https://via.placeholder.com/60x60/FF6B6B/000000?text=🎫",
      isUnlocked: false,
      category: 'redeemable'
    }
  ] } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    enabled: !!user,
  });

  const progressToNextLevel = ((userStats.totalExperience % 250) / 250) * 100;

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderNav user={user} />
      
      <div className="pt-20 pb-24 px-4 space-y-6">
        {/* User Stats Header */}
        <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <h1 className="text-2xl font-bold">Rewards & Achievements</h1>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{userStats.totalPoints}</div>
                  <div className="text-sm text-gray-300">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">Level {userStats.level}</div>
                  <div className="text-sm text-gray-300">Current Level</div>
                </div>
              </div>

              {/* Level Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Level {userStats.level + 1}</span>
                  <span>{userStats.experienceToNextLevel - (userStats.totalExperience % 250)} XP needed</span>
                </div>
                <Progress value={progressToNextLevel} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-surface border-gray-800">
            <CardContent className="p-4 text-center">
              <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-lg font-bold">{userStats.achievements}</div>
              <div className="text-xs text-gray-400">Achievements</div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-gray-800">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-lg font-bold">{userStats.experiencesCompleted}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-gray-800">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-lg font-bold">{userStats.totalExperience}</div>
              <div className="text-xs text-gray-400">Total XP</div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Award className="w-6 h-6 text-yellow-400" />
            <span>Achievements</span>
          </h2>
          
          <div className="grid grid-cols-1 gap-3">
            {rewards.filter(r => r.category === 'achievement').map((reward) => (
              <Card key={reward.id} className={`bg-surface border-gray-800 ${reward.isUnlocked ? 'border-green-500/30' : 'border-gray-600'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img src={reward.imageUrl} alt={reward.name} className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{reward.name}</h3>
                      <p className="text-sm text-gray-400">{reward.description}</p>
                    </div>
                    {reward.isUnlocked ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Locked</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Redeemable Rewards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Gift className="w-6 h-6 text-purple-400" />
            <span>Redeem Rewards</span>
          </h2>
          
          <div className="grid grid-cols-1 gap-3">
            {rewards.filter(r => r.category === 'redeemable').map((reward) => (
              <Card key={reward.id} className="bg-surface border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img src={reward.imageUrl} alt={reward.name} className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{reward.name}</h3>
                      <p className="text-sm text-gray-400">{reward.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-yellow-400">{reward.pointsCost} points</span>
                      </div>
                    </div>
                    <Button 
                      disabled={userStats.totalPoints < reward.pointsCost}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {userStats.totalPoints >= reward.pointsCost ? 'Redeem' : 'Not Enough Points'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How to Earn Points */}
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>How to Earn Points</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm">Complete experiences: +50 points</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm">Daily fortune cookie: +10 points</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm">Write reviews: +25 points</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm">Invite friends: +100 points</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav activeTab="rewards" />
    </div>
  );
}

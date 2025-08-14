import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Gift, Star, Clock } from "lucide-react";

interface FortuneCookieStatus {
  canClaim: boolean;
  lastClaimed?: string;
}

interface FortuneCookieResult {
  cookie: {
    id: string;
    message: string;
    points: number;
    claimedAt: string;
  };
  pointsEarned: number;
}

export default function FortuneCookie() {
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery<FortuneCookieStatus>({
    queryKey: ["/api/fortune-cookie/status"],
    enabled: isAuthenticated,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/fortune-cookie/claim");
      return response.json() as Promise<FortuneCookieResult>;
    },
    onSuccess: (data: FortuneCookieResult) => {
      setShowCelebration(true);
      toast({
        title: "Fortune Cookie Claimed! 🥠",
        description: `You earned ${data.pointsEarned} points!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fortune-cookie/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: () => {
      toast({
        title: "Already Claimed",
        description: "Come back tomorrow for your next fortune cookie!",
        variant: "destructive",
      });
    },
  });

  const handleClaim = () => {
    claimMutation.mutate();
  };

  if (!isAuthenticated || isLoading) {
    return null;
  }

  const canClaim = status?.canClaim;
  const lastClaimed = status?.lastClaimed;

  return (
    <>
      {/* Fortune Cookie Button */}
      <Button
        onClick={() => setShowModal(true)}
        variant={canClaim ? "default" : "secondary"}
        size="sm"
        className={`relative ${canClaim ? "bg-orange-500 hover:bg-orange-600 text-white animate-pulse" : ""}`}
      >
        <Gift className="w-4 h-4 mr-2" />
        Daily Fortune
        {canClaim && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce" />
        )}
      </Button>

      {/* Fortune Cookie Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-center text-2xl font-bold">
            Daily Fortune Cookie 🥠
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Claim your daily inspiration and earn rewards!
          </DialogDescription>

          <div className="space-y-6 py-4">
            {canClaim ? (
              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-6xl mb-4">🥠</div>
                  <h3 className="text-xl font-semibold text-orange-800">
                    Your Daily Fortune Awaits!
                  </h3>
                  <p className="text-orange-700">
                    Click the fortune cookie to reveal today's inspiration and earn 10 points.
                  </p>
                  <Button
                    onClick={handleClaim}
                    disabled={claimMutation.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {claimMutation.isPending ? "Opening..." : "Open Fortune Cookie"}
                    <Star className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-4xl mb-4 opacity-50">🥠</div>
                  <h3 className="text-lg font-semibold text-gray-600">
                    Already Claimed Today
                  </h3>
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {lastClaimed && (
                      <span>
                        Last claimed: {new Date(lastClaimed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">
                    Come back tomorrow for your next daily fortune and rewards!
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Fortune cookies refresh daily at midnight
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Celebration Modal */}
      {claimMutation.data && (
        <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
          <DialogContent className="max-w-md">
            <div className="text-center space-y-6 py-4">
              <div className="text-8xl animate-bounce">🎉</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-orange-600">Congratulations!</h2>
                <p className="text-lg text-green-600 font-semibold">
                  +{claimMutation.data.pointsEarned} Points Earned!
                </p>
              </div>
              
              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                <CardContent className="p-6">
                  <div className="text-4xl mb-3">📜</div>
                  <p className="text-lg font-medium text-orange-800 leading-relaxed">
                    "{claimMutation.data.cookie.message}"
                  </p>
                </CardContent>
              </Card>

              <Button
                onClick={() => setShowCelebration(false)}
                className="w-full"
              >
                Continue Exploring
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
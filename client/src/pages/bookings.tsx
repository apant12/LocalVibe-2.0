import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import HeaderNav from "@/components/HeaderNav";
import BottomNav from "@/components/BottomNav";
import FortuneCookie from "@/components/FortuneCookie";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/types";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

export default function Bookings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const { data: bookings = [], isLoading: isLoadingBookings, error } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
              window.location.href = "/login";
    }, 500);
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success text-black";
      case "pending": return "bg-warning text-black";
      case "cancelled": return "bg-error text-white";
      case "completed": return "bg-secondary text-black";
      default: return "bg-gray-600 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return "fas fa-check-circle";
      case "pending": return "fas fa-clock";
      case "cancelled": return "fas fa-times-circle";
      case "completed": return "fas fa-star";
      default: return "fas fa-question-circle";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderNav user={user} />
      
      <div className="pt-20 pb-24 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <div className="text-sm text-gray-400">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </div>
        </div>

        {isLoadingBookings ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-surface border-gray-800">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="w-20 h-20 bg-gray-800 animate-pulse rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-800 animate-pulse rounded w-3/4"></div>
                      <div className="h-3 bg-gray-800 animate-pulse rounded w-1/2"></div>
                      <div className="h-3 bg-gray-800 animate-pulse rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="space-y-6">
            <FortuneCookie onExplore={() => window.location.href = "/"} />
            
            <Card className="bg-surface border-gray-800">
              <CardContent className="p-8 text-center">
                <i className="fas fa-calendar-alt text-4xl text-gray-600 mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                <p className="text-gray-400 mb-6">
                  Start exploring experiences and book your first adventure!
                </p>
                <Button 
                  onClick={() => window.location.href = "/"}
                  className="bg-primary hover:bg-primary/90"
                >
                  <i className="fas fa-compass mr-2"></i>
                  Explore Experiences
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="bg-surface border-gray-800">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">Experience #{booking.experienceId}</h3>
                          <p className="text-gray-400 text-sm">
                            Booked on {new Date(booking.bookedAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          <i className={`${getStatusIcon(booking.status)} mr-1`}></i>
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">People:</span>
                          <span className="ml-2 font-medium">{booking.numberOfPeople}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Total:</span>
                          <span className="ml-2 font-bold text-primary">
                            ${booking.totalAmount}
                          </span>
                        </div>
                        {booking.paymentMethod && (
                          <div className="col-span-2">
                            <span className="text-gray-400">Payment:</span>
                            <span className="ml-2 font-medium capitalize">
                              {booking.paymentMethod}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 mt-4">
                        {booking.status === "confirmed" && (
                          <Button size="sm" variant="outline" className="border-gray-600">
                            <i className="fas fa-info-circle mr-2"></i>
                            View Details
                          </Button>
                        )}
                        {booking.status === "completed" && (
                          <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-black">
                            <i className="fas fa-star mr-2"></i>
                            Leave Review
                          </Button>
                        )}
                        {(booking.status === "confirmed" || booking.status === "pending") && (
                          <Button size="sm" variant="destructive">
                            <i className="fas fa-times mr-2"></i>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="bookings" />
    </div>
  );
}

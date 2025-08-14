import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation as useLocationContext } from "@/components/LocationContext";
import ExperienceCard from "@/components/ExperienceCard";
import BookingModal from "@/components/BookingModal";
import type { Experience, FilterOptions, ExperienceWithInteractions } from "@/types";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ExperienceFeedProps {
  filters: FilterOptions;
}

export default function ExperienceFeed({ filters }: ExperienceFeedProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentCity } = useLocationContext();
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [userInteractions, setUserInteractions] = useState<{ likes: string[]; saves: string[] }>({
    likes: [],
    saves: [],
  });
  const [viewedExperiences, setViewedExperiences] = useState<Set<string>>(new Set());

  // Fetch experiences with city context
  const { data: experiences = [], isLoading } = useQuery<Experience[]>({
    queryKey: ["/api/experiences", filters, currentCity.name],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.limit) params.set('limit', filters.limit.toString());
      if (filters.offset) params.set('offset', filters.offset.toString());
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.location) params.set('location', filters.location);
      if (filters.availability) params.set('availability', filters.availability);
      if (filters.search) params.set('search', filters.search);
      if (filters.date) params.set('date', filters.date); // Date filtering for Ticketmaster events
      // Add city-specific filtering
      params.set('city', currentCity.name);
      params.set('coordinates', `${currentCity.coordinates.lat},${currentCity.coordinates.lng}`);
      
      const url = `/api/experiences${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Fetch user interactions
  const { data: interactions } = useQuery<{ likes: string[]; saves: string[] }>({
    queryKey: ["/api/user/interactions"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (interactions) {
      setUserInteractions(interactions);
    }
  }, [interactions]);

  // View tracking mutation
  const viewMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      return apiRequest("POST", `/api/experiences/${experienceId}/view`);
    },
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      const response = await apiRequest("POST", `/api/experiences/${experienceId}/like`);
      return response.json();
    },
    onSuccess: (data, experienceId) => {
      setUserInteractions(prev => ({
        ...prev,
        likes: data.liked
          ? [...prev.likes, experienceId]
          : prev.likes.filter(id => id !== experienceId),
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to like experience",
        variant: "destructive",
      });
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      const response = await apiRequest("POST", `/api/experiences/${experienceId}/save`);
      return response.json();
    },
    onSuccess: (data, experienceId) => {
      setUserInteractions(prev => ({
        ...prev,
        saves: data.saved
          ? [...prev.saves, experienceId]
          : prev.saves.filter(id => id !== experienceId),
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to save experience",
        variant: "destructive",
      });
    },
  });

  const handleExperienceView = (experienceId: string) => {
    // Only track view once per experience per session
    if (!viewedExperiences.has(experienceId)) {
      setViewedExperiences(prev => new Set(Array.from(prev).concat(experienceId)));
      viewMutation.mutate(experienceId);
    }
  };

  const handleLike = (experienceId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    likeMutation.mutate(experienceId);
  };

  const handleSave = (experienceId: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    saveMutation.mutate(experienceId);
  };

  const handleBooking = (experience: Experience) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    setSelectedExperience(experience);
  };

  const experiencesWithInteractions: ExperienceWithInteractions[] = experiences.map(exp => ({
    ...exp,
    isLiked: userInteractions.likes.includes(exp.id),
    isSaved: userInteractions.saves.includes(exp.id),
  }));

  if (isLoading) {
    return (
      <div className="feed-container h-full overflow-y-auto pt-32">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading experiences...</p>
          </div>
        </div>
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="feed-container h-full overflow-y-auto pt-32">
        <div className="h-screen flex items-center justify-center px-6">
          <div className="text-center">
            <i className="fas fa-compass text-4xl text-gray-600 mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">No experiences found</h3>
            <p className="text-gray-400">
              Try adjusting your filters or check back later for new experiences
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="feed-container h-full overflow-y-auto pt-32 pb-20">
        {experiencesWithInteractions.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            onView={handleExperienceView}
            onLike={handleLike}
            onSave={handleSave}
            onBook={handleBooking}
          />
        ))}
      </div>

      {selectedExperience && (
        <BookingModal
          experience={selectedExperience}
          isOpen={!!selectedExperience}
          onClose={() => setSelectedExperience(null)}
        />
      )}
    </>
  );
}

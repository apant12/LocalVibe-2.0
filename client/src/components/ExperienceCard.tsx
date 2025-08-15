import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ExperienceWithInteractions } from "@/types";

interface ExperienceCardProps {
  experience: ExperienceWithInteractions;
  onView: (experienceId: string) => void;
  onLike: (experienceId: string) => void;
  onSave: (experienceId: string) => void;
  onBook: (experience: ExperienceWithInteractions) => void;
}

export default function ExperienceCard({ experience, onView, onLike, onSave, onBook }: ExperienceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onView(experience.id);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [experience.id, onView]);

  const getAvailabilityStatus = () => {
    switch (experience.availability) {
      case "available":
        return {
          label: "Available Now",
          color: "bg-success/20 text-success",
          icon: "fas fa-circle animate-pulse",
        };
      case "limited":
        return {
          label: `${experience.availableSpots} spots left`,
          color: "bg-warning/20 text-warning",
          icon: "fas fa-exclamation-circle",
        };
      case "ongoing":
        return {
          label: "Drop-in Welcome",
          color: "bg-success/20 text-success",
          icon: "fas fa-circle animate-pulse",
        };
      default:
        return {
          label: "Starting Soon",
          color: "bg-warning/20 text-warning",
          icon: "fas fa-clock animate-pulse",
        };
    }
  };

  const getPrice = () => {
    if (experience.type === "free") {
      return { amount: "FREE", label: "" };
    }
    return { amount: `$${experience.price}`, label: "per person" };
  };

  const getStartTime = () => {
    if (!experience.startTime) return "Ongoing activity";
    const startTime = new Date(experience.startTime);
    const now = new Date();
    const diffMs = startTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 60) {
      return `Starts in ${diffMinutes} min`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `Starts in ${diffHours}h ${remainingMinutes}min`;
  };

  const getActionButton = () => {
    if (experience.type === "free") {
      return {
        text: experience.availability === "ongoing" ? "Join Now" : "RSVP Free",
        className: "bg-secondary hover:bg-secondary/90 text-black",
        icon: experience.availability === "ongoing" ? "fas fa-walking" : "fas fa-calendar-check",
      };
    }
    return {
      text: "Quick Book",
      className: "bg-primary hover:bg-primary/90 text-white",
      icon: "fas fa-bolt",
    };
  };

  const status = getAvailabilityStatus();
  const price = getPrice();
  const actionButton = getActionButton();

  return (
    <div ref={cardRef} className="experience-card h-screen relative">
      <img
        src={experience.imageUrl}
        alt={experience.title}
        className="w-full h-full object-cover"
      />
      
      <div className="absolute inset-0 gradient-overlay"></div>
      
      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${status.color}`}>
              <div className={`w-2 h-2 ${status.color.includes('success') ? 'bg-success' : 'bg-warning'} rounded-full`}>
                <i className={status.icon} style={{ fontSize: '8px' }}></i>
              </div>
              <span className="font-medium">{status.label}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-300">
              <i className="fas fa-map-marker-alt"></i>
              <span>{experience.location}</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold">{experience.title}</h2>
          <p className="text-gray-300 line-clamp-2">{experience.description}</p>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <i className="fas fa-star text-warning"></i>
              <span className="font-semibold">{experience.rating || "0.0"}</span>
              <span className="text-gray-300">({experience.reviewCount})</span>
            </div>
            {experience.duration && (
              <div className="flex items-center space-x-1">
                <i className="fas fa-clock"></i>
                <span>{Math.floor(experience.duration / 60)} hours</span>
              </div>
            )}
            {experience.maxParticipants && (
              <div className="flex items-center space-x-1">
                <i className="fas fa-users"></i>
                <span>{experience.availableSpots || experience.maxParticipants} spots</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-2xl font-bold ${experience.type === 'free' ? 'text-secondary' : 'text-primary'}`}>
                {price.amount}
              </span>
              {price.label && <span className="text-gray-300 ml-1">{price.label}</span>}
            </div>
            <div className="text-sm text-gray-300">
              {getStartTime()}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <Button
            onClick={() => onBook(experience)}
            className={`flex-1 font-bold py-4 px-6 rounded-2xl transition-all floating-action ${actionButton.className}`}
          >
            <i className={`${actionButton.icon} mr-2`}></i>
            {actionButton.text}
          </Button>
          <div className="flex space-x-3 sm:flex-col sm:space-x-0 sm:space-y-3">
            <Button
              onClick={() => onSave(experience.id)}
              className={`w-14 h-14 backdrop-blur hover:bg-surface rounded-2xl flex items-center justify-center transition-colors ${
                experience.isSaved ? 'bg-primary/20 text-primary' : 'bg-surface/80'
              }`}
            >
              <i className={`fas fa-heart text-xl ${experience.isSaved ? 'text-primary' : ''}`}></i>
            </Button>
            <Button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: experience.title,
                    text: experience.description,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="w-14 h-14 bg-surface/80 backdrop-blur hover:bg-surface rounded-2xl flex items-center justify-center transition-colors"
            >
              <i className="fas fa-share text-xl"></i>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 space-y-4 hidden sm:flex flex-col">
        <button
          onClick={() => onLike(experience.id)}
          className="flex flex-col items-center space-y-1 group"
        >
          <div className={`p-3 rounded-full transition-all ${
            experience.isLiked 
              ? 'bg-red-500 scale-110' 
              : 'bg-black/50 group-hover:bg-black/70'
          }`}>
            <i className={`fas fa-heart text-xl ${
              experience.isLiked 
                ? 'text-white' 
                : 'text-white/80'
            }`}></i>
          </div>
          <span className="text-white text-sm font-medium">
            {experience.likeCount || 0}
          </span>
        </button>

        <button
          onClick={() => onSave(experience.id)}
          className="flex flex-col items-center space-y-1 group"
        >
          <div className={`p-3 rounded-full transition-all ${
            experience.isSaved 
              ? 'bg-primary/20 scale-110' 
              : 'bg-black/50 group-hover:bg-black/70'
          }`}>
            <i className={`fas fa-bookmark text-xl ${
              experience.isSaved 
                ? 'text-primary' 
                : 'text-white/80'
            }`}></i>
          </div>
          <span className="text-white text-sm font-medium">Save</span>
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: experience.title,
                text: experience.description,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="flex flex-col items-center space-y-1 group"
        >
          <div className="p-3 bg-black/50 group-hover:bg-black/70 rounded-full transition-all">
            <i className="fas fa-share text-xl text-white/80"></i>
          </div>
          <span className="text-white text-sm font-medium">Share</span>
        </button>
      </div>
    </div>
  );
}

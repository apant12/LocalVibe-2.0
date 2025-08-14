import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Experience } from "@/types";

interface BookingModalProps {
  experience: Experience;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ experience, isOpen, onClose }: BookingModalProps) {
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [, navigate] = useLocation();

  const handleConfirmBooking = () => {
    const totalAmount = experience.type === "free" ? 0 : (parseFloat(experience.price?.toString() || "0") * numberOfPeople);
    
    if (experience.type === "free") {
      // For free experiences, book directly without payment
      // TODO: Implement direct booking API call
      onClose();
    } else {
      // For paid experiences, redirect to checkout page
      const checkoutUrl = `/checkout?experienceId=${experience.id}&numberOfPeople=${numberOfPeople}&amount=${totalAmount}&title=${encodeURIComponent(experience.title)}`;
      navigate(checkoutUrl);
      onClose();
    }
  };

  const incrementPeople = () => {
    if (experience.maxParticipants && numberOfPeople >= experience.maxParticipants) return;
    setNumberOfPeople(prev => prev + 1);
  };

  const decrementPeople = () => {
    if (numberOfPeople <= 1) return;
    setNumberOfPeople(prev => prev - 1);
  };

  const getTotalAmount = () => {
    if (experience.type === "free") return "FREE";
    return (parseFloat(experience.price?.toString() || "0") * numberOfPeople).toFixed(2);
  };

  const getPaymentButtonText = () => {
    if (experience.type === "free") return "Confirm RSVP";
    return "Pay with Apple Pay";
  };

  const getPaymentIcon = () => {
    if (experience.type === "free") return "fas fa-check-circle";
    return "fas fa-credit-card";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]">
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">Complete Booking</h3>
          <Button
            onClick={onClose}
            className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center"
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
        
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{experience.title}</h4>
                  <p className="text-sm text-gray-300 mt-1">{experience.location}</p>
                  {experience.startTime && (
                    <p className="text-sm text-gray-300">
                      {new Date(experience.startTime).toLocaleDateString()} at{' '}
                      {new Date(experience.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  )}
                  {experience.duration && (
                    <p className="text-sm text-gray-300">
                      Duration: {Math.floor(experience.duration / 60)}h {experience.duration % 60}m
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className={`text-xl font-bold ${experience.type === 'free' ? 'text-secondary' : 'text-primary'}`}>
                    {experience.type === "free" ? "FREE" : `$${experience.price}`}
                  </p>
                  <p className="text-sm text-gray-300">per person</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium">Number of People</label>
            <div className="flex items-center space-x-4">
              <Button
                onClick={decrementPeople}
                disabled={numberOfPeople <= 1}
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-full flex items-center justify-center"
              >
                <i className="fas fa-minus"></i>
              </Button>
              <span className="text-xl font-semibold w-8 text-center">{numberOfPeople}</span>
              <Button
                onClick={incrementPeople}
                disabled={experience.maxParticipants ? numberOfPeople >= experience.maxParticipants : false}
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-full flex items-center justify-center"
              >
                <i className="fas fa-plus"></i>
              </Button>
            </div>
            {experience.maxParticipants && (
              <p className="text-xs text-gray-400">
                Maximum {experience.maxParticipants} people per booking
              </p>
            )}
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total</span>
              <span className={`text-2xl font-bold ${experience.type === 'free' ? 'text-secondary' : 'text-primary'}`}>
                {experience.type === "free" ? "FREE" : `$${getTotalAmount()}`}
              </span>
            </div>
            
            <Button
              onClick={handleConfirmBooking}
              className={`w-full font-bold py-4 rounded-2xl transition-all floating-action ${
                experience.type === 'free' 
                  ? 'bg-secondary hover:bg-secondary/90 text-black'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              <i className={`${getPaymentIcon()} mr-2`}></i>
              {getPaymentButtonText()}
            </Button>
          </div>
          
          <p className="text-xs text-gray-400 text-center">
            By booking, you agree to our Terms of Service and Cancellation Policy
          </p>
        </div>
      </div>
    </div>
  );
}

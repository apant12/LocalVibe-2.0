import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, DollarSign, Users, Clock } from "lucide-react";

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EventCreationModal({ isOpen, onClose }: EventCreationModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '0',
    maxParticipants: '10',
    startTime: '',
    endTime: '',
    category: 'food',
    isPaid: false
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Event Created!",
        description: "Your event has been successfully created and is now live.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
      onClose();
      setFormData({
        title: '',
        description: '',
        location: '',
        price: '0',
        maxParticipants: '10',
        startTime: '',
        endTime: '',
        category: 'food',
        isPaid: false
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      ...formData,
      price: formData.isPaid ? formData.price : '0',
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      status: 'active',
      type: formData.isPaid ? 'paid' : 'free',
      availability: 'available',
      isDropIn: false,
      tags: [formData.category, 'user-created'],
      externalSource: 'user-created'
    };

    createEventMutation.mutate(eventData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your event"
              required
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
                required
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endTime">End Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="food">Food & Dining</SelectItem>
                <SelectItem value="music">Music & Concerts</SelectItem>
                <SelectItem value="outdoor">Outdoor & Adventure</SelectItem>
                <SelectItem value="arts">Arts & Culture</SelectItem>
                <SelectItem value="nightlife">Nightlife</SelectItem>
                <SelectItem value="wellness">Wellness & Fitness</SelectItem>
                <SelectItem value="shopping">Shopping & Markets</SelectItem>
                <SelectItem value="education">Learning & Workshops</SelectItem>
                <SelectItem value="family">Family & Kids</SelectItem>
                <SelectItem value="tech">Tech & Innovation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  min="1"
                  required
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  min="0"
                  step="0.01"
                  disabled={!formData.isPaid}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPaid"
              checked={formData.isPaid}
              onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
              className="rounded border-gray-700 bg-gray-900"
            />
            <Label htmlFor="isPaid">This is a paid event</Label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEventMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-black"
            >
              {createEventMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

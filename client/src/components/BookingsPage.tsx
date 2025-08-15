import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Users, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Booking {
  id: string;
  experienceId: string;
  experienceTitle: string;
  experienceLocation: string;
  numberOfPeople: number;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  totalAmount: number;
  bookingDate: string;
  hostName: string;
  category: string;
}

const BookingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Mock bookings data
  const mockBookings: Booking[] = [
    {
      id: 'booking-1',
      experienceId: '1',
      experienceTitle: 'Local Coffee Tasting',
      experienceLocation: 'Downtown San Francisco',
      numberOfPeople: 2,
      startTime: '2025-01-20T10:00:00Z',
      endTime: '2025-01-20T12:00:00Z',
      status: 'confirmed',
      totalAmount: 50,
      bookingDate: '2025-01-15T10:00:00Z',
      hostName: 'Local Coffee Expert',
      category: 'food'
    },
    {
      id: 'booking-2',
      experienceId: 'tm-event-1',
      experienceTitle: 'Concert in the Park',
      experienceLocation: 'Golden Gate Park, San Francisco',
      numberOfPeople: 1,
      startTime: '2025-01-25T19:00:00Z',
      endTime: '2025-01-25T21:00:00Z',
      status: 'confirmed',
      totalAmount: 45,
      bookingDate: '2025-01-16T14:30:00Z',
      hostName: 'Ticketmaster Events',
      category: 'music'
    },
    {
      id: 'booking-3',
      experienceId: 'place-1',
      experienceTitle: 'Golden Gate Bridge',
      experienceLocation: 'Golden Gate Bridge, San Francisco',
      numberOfPeople: 3,
      startTime: '2025-01-10T15:00:00Z',
      endTime: '2025-01-10T17:00:00Z',
      status: 'completed',
      totalAmount: 0,
      bookingDate: '2025-01-05T09:00:00Z',
      hostName: 'Google Places',
      category: 'outdoor'
    }
  ];

  const upcomingBookings = mockBookings.filter(booking => 
    new Date(booking.startTime) > new Date() && booking.status === 'confirmed'
  );

  const pastBookings = mockBookings.filter(booking => 
    new Date(booking.startTime) <= new Date() || booking.status === 'completed'
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your upcoming and past experiences</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Past ({pastBookings.length})
          </button>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.experienceTitle}
                    </h3>
                    {getStatusIcon(booking.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.experienceLocation}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'person' : 'people'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>${booking.totalAmount.toFixed(2)} total</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Hosted by {booking.hostName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Booked on {formatDate(booking.bookingDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {booking.status === 'confirmed' && new Date(booking.startTime) > new Date() && (
                  <>
                    <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                      Cancel
                    </button>
                  </>
                )}
                {booking.status === 'completed' && (
                  <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    Leave Review
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">
                {activeTab === 'upcoming' ? '📅' : '✅'}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'upcoming' 
                  ? 'Start exploring events to make your first booking!'
                  : 'Your completed experiences will appear here'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;

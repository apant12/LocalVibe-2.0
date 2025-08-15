import React from 'react';
import { CheckCircle, MapPin, Calendar, Users, Download, Share2 } from 'lucide-react';

interface CheckoutSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails?: {
    experienceId: string;
    title: string;
    price: string;
    location: string;
    startTime: string;
    hostName: string;
    bookingId: string;
  };
}

const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({ isOpen, onClose, bookingDetails }) => {
  if (!isOpen) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-green-100">Your payment was successful and your booking is confirmed.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event</p>
                  <p className="font-medium">{bookingDetails?.title || 'Experience'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{bookingDetails?.location || 'Location'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {bookingDetails?.startTime ? formatTime(bookingDetails.startTime) : 'TBD'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Host</p>
                  <p className="font-medium">{bookingDetails?.hostName || 'Host'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Check your email</p>
                  <p className="text-sm text-gray-600">We've sent you a confirmation email with all the details.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Save to calendar</p>
                  <p className="text-sm text-gray-600">Add this event to your calendar so you don't forget.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Get ready</p>
                  <p className="text-sm text-gray-600">Prepare for an amazing experience!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Download Receipt
            </button>
            
            <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" />
              Share with Friends
            </button>
          </div>

          {/* Important Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Important Information</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Please arrive 15 minutes before the event starts</li>
              <li>• Bring your booking confirmation (email or app)</li>
              <li>• Contact the host if you have any questions</li>
              <li>• Cancellation policy: 24 hours notice required</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Booking ID: {bookingDetails?.bookingId || 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;

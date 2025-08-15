import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import TikTokVideoFeed from './components/TikTokVideoFeed';
import ExplorePage from './components/ExplorePage';
import BookingsPage from './components/BookingsPage';
import RewardsPage from './components/RewardsPage';
import ProfilePage from './components/ProfilePage';
import CityExperiencePlanner from './components/CityExperiencePlanner';
import EventCreationModal from './components/EventCreationModal';
import LandingPage from './components/LandingPage';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import { Home, Search, Plus, User, Gift, Calendar, MapPin, LogOut } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<'home' | 'explore' | 'create' | 'profile' | 'bookings' | 'rewards' | 'planner'>('home');
  const [showEventCreationModal, setShowEventCreationModal] = useState(false);
  const [showSignOutMessage, setShowSignOutMessage] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'signup' | 'main'>('landing');

  // Handle sign out with message
  const handleSignOut = async () => {
    await signOut();
    setShowSignOutMessage(true);
    // The page will reload after signOut, so this message won't show
    // But we keep it for the brief moment before reload
  };

  // Handle get started from landing page
  const handleGetStarted = () => {
    console.log('handleGetStarted called, isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('Setting view to main');
      setCurrentView('main');
    } else {
      console.log('Setting view to login');
      setCurrentView('login');
    }
  };

  // Check for sign out message on mount
  useEffect(() => {
    const showMessage = localStorage.getItem('showSignOutMessage');
    if (showMessage === 'true') {
      setShowSignOutMessage(true);
      localStorage.removeItem('showSignOutMessage');
      // Hide message after 3 seconds
      setTimeout(() => setShowSignOutMessage(false), 3000);
    }
  }, []);

  // Show appropriate view based on authentication state
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, isLoading, user, currentView });
    if (!isLoading) {
      if (isAuthenticated && currentView !== 'main') {
        console.log('Setting view to main');
        setCurrentView('main');
      } else if (!isAuthenticated && currentView === 'main') {
        console.log('Setting view to landing');
        setCurrentView('landing');
      }
    }
  }, [isAuthenticated, isLoading, user, currentView]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <TikTokVideoFeed />;
      case 'explore':
        return <ExplorePage />;
      case 'create':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Create Event</h2>
              <button
                onClick={() => setShowEventCreationModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Open Event Creation
              </button>
            </div>
          </div>
        );
      case 'bookings':
        return <BookingsPage />;
      case 'rewards':
        return <RewardsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'planner':
        return <CityExperiencePlanner />;
      default:
        return <TikTokVideoFeed />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading LocalVibe...</p>
        </div>
      </div>
    );
  }

  // Show landing page
  if (currentView === 'landing') {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <LandingPage onGetStarted={handleGetStarted} />
        </div>
      </QueryClientProvider>
    );
  }

  // Show login/signup pages
  if (currentView === 'login') {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <LoginPage onSwitchToSignup={() => setCurrentView('signup')} />
        </div>
      </QueryClientProvider>
    );
  }

  if (currentView === 'signup') {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <SignupPage onSwitchToLogin={() => setCurrentView('login')} />
        </div>
      </QueryClientProvider>
    );
  }

  // Show main app when authenticated
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        {/* Sign Out Message */}
        {showSignOutMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg z-50 shadow-lg">
            Successfully signed out! Please log in to continue.
          </div>
        )}

        {/* Welcome Message */}
        {user && (
          <div className="fixed top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg z-40 shadow-lg">
            Welcome, {user.firstName || user.name}! 👋
          </div>
        )}

        {renderPage()}
        
        {/* Bottom Navigation - Only show when authenticated */}
        {isAuthenticated && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40">
            <div className="flex justify-around py-2">
              <button
                onClick={() => setCurrentPage('home')}
                className={`flex flex-col items-center p-2 transition-colors ${
                  currentPage === 'home' ? 'text-purple-600' : 'text-gray-500 hover:text-purple-500'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-xs mt-1">Home</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('explore')}
                className={`flex flex-col items-center p-2 transition-colors ${
                  currentPage === 'explore' ? 'text-purple-600' : 'text-gray-500 hover:text-purple-500'
                }`}
              >
                <Search className="w-5 h-5" />
                <span className="text-xs mt-1">Explore</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('planner')}
                className={`flex flex-col items-center p-2 transition-colors ${
                  currentPage === 'planner' ? 'text-purple-600' : 'text-gray-500 hover:text-purple-500'
                }`}
              >
                <MapPin className="w-5 h-5" />
                <span className="text-xs mt-1">Planner</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('create')}
                className={`flex flex-col items-center p-2 transition-colors ${
                  currentPage === 'create' ? 'text-purple-600' : 'text-gray-500 hover:text-purple-500'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs mt-1">Create</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('bookings')}
                className={`flex flex-col items-center p-2 transition-colors ${
                  currentPage === 'bookings' ? 'text-purple-600' : 'text-gray-500 hover:text-purple-500'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-xs mt-1">Bookings</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('rewards')}
                className={`flex flex-col items-center p-2 transition-colors ${
                  currentPage === 'rewards' ? 'text-purple-600' : 'text-gray-500 hover:text-purple-500'
                }`}
              >
                <Gift className="w-5 h-5" />
                <span className="text-xs mt-1">Rewards</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('profile')}
                className={`flex flex-col items-center p-2 transition-colors ${
                  currentPage === 'profile' ? 'text-purple-600' : 'text-gray-500 hover:text-purple-500'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-xs mt-1">Profile</span>
              </button>

              <button
                onClick={handleSignOut}
                className="flex flex-col items-center p-2 text-red-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-xs mt-1">Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Event Creation Modal */}
        <EventCreationModal
          isOpen={showEventCreationModal}
          onClose={() => setShowEventCreationModal(false)}
        />
      </div>
    </QueryClientProvider>
  );
}

export default App;

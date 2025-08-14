import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    // Navigate to login page using Wouter
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=900)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full justify-center items-center text-center px-6">
          <div className="mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <i className="fas fa-map-marker-alt text-2xl text-white"></i>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Local<span className="text-primary">Vibe</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
              Discover unique, last-minute experiences happening right now near you
            </p>
          </div>

          <div className="space-y-4 w-full max-w-sm">
            <Button 
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-2xl text-lg floating-action"
            >
              <i className="fas fa-rocket mr-2"></i>
              Start Exploring
            </Button>
            
            <p className="text-sm text-gray-400">
              Join thousands discovering amazing local experiences
            </p>
            
            <div className="text-center mt-4">
              <Link href="/login" className="text-primary hover:text-primary/80 text-sm">
                Or sign in with Google/Apple →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why LocalVibe?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-surface border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <i className="fas fa-bolt text-primary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Discovery</h3>
                <p className="text-gray-400">
                  Find experiences happening right now with our TikTok-style feed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-surface border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <i className="fas fa-map-marker-alt text-secondary text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">Location-Based</h3>
                <p className="text-gray-400">
                  Discover unique experiences within walking distance
                </p>
              </CardContent>
            </Card>

            <Card className="bg-surface border-gray-800">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <i className="fas fa-credit-card text-warning text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-2">One-Tap Booking</h3>
                <p className="text-gray-400">
                  Book experiences instantly with Apple Pay and Google Pay
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

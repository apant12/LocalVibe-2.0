import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocationProvider } from "@/components/LocationContext";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Bookings from "@/pages/bookings";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Checkout from "@/pages/checkout";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import ExploreNew from "@/pages/explore-new";
import MapPage from "@/pages/map";
import Rewards from "@/pages/rewards";
const HomeNew = lazy(() => import("@/pages/home-new"));

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner only briefly while checking auth
  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
        </>
      ) : (
        <>
          <Route path="/" component={() => (
            <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>}>
              <HomeNew />
            </Suspense>
          )} />
          <Route path="/explore" component={() => (
            <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>}>
              <ExploreNew />
            </Suspense>
          )} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/rewards" component={Rewards} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/admin" component={Admin} />
          <Route path="/map" component={MapPage} />
        </>
      )}
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LocationProvider>
    </QueryClientProvider>
  );
}

export default App;

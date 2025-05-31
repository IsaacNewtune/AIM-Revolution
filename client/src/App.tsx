import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import SignUp from "@/pages/SignUp";
import SubscriptionPlans from "@/pages/SubscriptionPlans";
import PaymentSetup from "@/pages/PaymentSetup";
import ProfileSetup from "@/pages/ProfileSetup";
import Home from "@/pages/Home";
import ListenerDashboard from "@/pages/ListenerDashboard";
import ArtistDashboard from "@/pages/ArtistDashboard";
import ManagerDashboard from "@/pages/ManagerDashboard";
import Discover from "@/pages/Discover";
import ArtistAnalytics from "@/pages/ArtistAnalytics";
import ArtistSignUp from "@/pages/ArtistSignUp";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="animate-spin w-8 h-8 border-4 border-ai-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/signup" component={SignUp} />
          <Route path="/artist-signup" component={ArtistSignUp} />
          <Route path="/subscription-plans" component={SubscriptionPlans} />
          <Route path="/payment-setup" component={PaymentSetup} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/profile-setup" component={ProfileSetup} />
          <Route path="/discover" component={Discover} />
          <Route path="/analytics" component={ArtistAnalytics} />
          <Route path="/listener" component={ListenerDashboard} />
          <Route path="/artist" component={ArtistDashboard} />
          <Route path="/manager" component={ManagerDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

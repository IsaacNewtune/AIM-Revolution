import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import MusicPlayer from "@/components/MusicPlayer";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import SignUp from "@/pages/SignUp";
import SubscriptionPlans from "@/pages/SubscriptionPlans";
import SubscriptionComparison from "@/pages/SubscriptionComparison";
import PaymentSetup from "@/pages/PaymentSetup";
import ProfileSetup from "@/pages/ProfileSetup";
import Home from "@/pages/Home";
import ListenerDashboard from "@/pages/ListenerDashboard";
import ArtistDashboard from "@/pages/ArtistDashboard";
import ManagerDashboard from "@/pages/ManagerDashboard";
import Discover from "@/pages/Discover";
import AdvancedDiscovery from "@/pages/AdvancedDiscovery";
import SocialHub from "@/pages/SocialHub";
import ArtistAnalytics from "@/pages/ArtistAnalytics";
import ArtistSignUp from "@/pages/ArtistSignUp";
import ManagerSignUp from "@/pages/ManagerSignUp";
import ArtistManagementDashboard from "@/pages/ArtistManagementDashboard";
import Playlists from "@/pages/Playlists";
import PlaylistDetail from "@/pages/PlaylistDetail";
import AdminDashboard from "@/pages/AdminDashboard";
import AccountTypeSelector from "@/pages/AccountTypeSelector";
import CreateArtistProfile from "@/pages/CreateArtistProfile";
import EditArtistProfile from "@/pages/EditArtistProfile";
import SongUpload from "@/pages/SongUpload";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="animate-spin w-8 h-8 border-4 border-ai-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  // Remove the automatic redirect to auth page for unauthenticated users
  // Let the router handle showing Landing page for root path

  // If user is authenticated but doesn't have an account type set, 
  // show account setup to let them choose their role
  const needsAccountSetup = user && !user.accountType && 
    window.location.pathname !== '/account-setup';

  if (needsAccountSetup) {
    return <AccountTypeSelector />;
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/signup" component={SignUp} />
          <Route path="/artist-signup" component={ArtistSignUp} />
          <Route path="/manager-signup" component={ManagerSignUp} />
          <Route path="/subscription-plans" component={SubscriptionPlans} />
          <Route path="/pricing" component={SubscriptionComparison} />
          <Route path="/payment-setup" component={PaymentSetup} />
        </>
      ) : (
        <>
          <Route path="/account-setup" component={AccountTypeSelector} />
          <Route path="/subscription-plans" component={SubscriptionPlans} />
          <Route path="/pricing" component={SubscriptionComparison} />
          <Route path="/payment-setup" component={PaymentSetup} />
          <Route path="/" component={Home} />
          <Route path="/profile-setup" component={ProfileSetup} />
          <Route path="/discover" component={AdvancedDiscovery} />
          <Route path="/social" component={SocialHub} />
          <Route path="/analytics" component={ArtistAnalytics} />
          <Route path="/artist-analytics/:id" component={ArtistAnalytics} />
          <Route path="/playlists" component={Playlists} />
          <Route path="/playlist/:id" component={PlaylistDetail} />
          <Route path="/listener" component={ListenerDashboard} />
          <Route path="/artist" component={ArtistDashboard} />
          <Route path="/manager" component={ManagerDashboard} />
          <Route path="/manager/artists" component={ArtistManagementDashboard} />
          <Route path="/manager/analytics" component={ArtistAnalytics} />
          <Route path="/artist-dashboard/:artistId" component={ArtistManagementDashboard} />
          <Route path="/manager/create-artist" component={CreateArtistProfile} />
          <Route path="/edit-artist/:id" component={EditArtistProfile} />
          <Route path="/upload" component={SongUpload} />
          <Route path="/admin" component={AdminDashboard} />
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
        <MusicPlayerProvider>
          <Toaster />
          <Router />
          <MusicPlayer />
        </MusicPlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

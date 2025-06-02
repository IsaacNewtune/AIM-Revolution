import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.accountType) {
      // Redirect to appropriate dashboard based on account type
      setLocation(`/${user.accountType}`);
    } else {
      // User needs to select account type first
      setLocation('/account-setup');
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-ai-purple border-t-transparent rounded-full" />
    </div>
  );
}

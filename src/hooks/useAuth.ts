import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const signInWithProvider = async (provider: string) => {
    await supabase.auth.signInWithOAuth({ provider: provider as any, options: { redirectTo: window.location.origin } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    try {
      await fetch('/api/logout');
    } catch (_) {}
    window.location.reload();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithProvider,
    signOut,
  };
}

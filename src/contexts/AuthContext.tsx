
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  profile_picture_url: string | null;
  position: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  signOut: async () => {},
  isLoading: true,
  refreshSession: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoize the fetchProfile function to prevent unnecessary re-renders
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);

        if (currentSession.user) {
          await fetchProfile(currentSession.user.id);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const updateProfile = useCallback(async (profileData: Partial<Profile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile");
        return;
      }

      // Refresh the profile data
      await fetchProfile(user.id);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error in updateProfile:", error);
      toast.error("An unexpected error occurred");
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);

          if (initialSession.user) {
            await fetchProfile(initialSession.user.id);
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          if (newSession.user) {
            await fetchProfile(newSession.user.id);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
        setIsLoading(false);
        
        // Show appropriate toast messages based on auth events
        if (event === 'SIGNED_IN') {
          toast.success("Signed in successfully");
        } else if (event === 'SIGNED_OUT') {
          toast.success("Signed out successfully");
        } else if (event === 'PASSWORD_RECOVERY') {
          toast.info("Password recovery initiated");
        } else if (event === 'USER_UPDATED') {
          toast.success("User profile updated");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    session,
    user,
    profile,
    signOut,
    isLoading,
    refreshSession,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

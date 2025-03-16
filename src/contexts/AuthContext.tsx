
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
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
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Initialize storage bucket on load - do only once
  useEffect(() => {
    const initStorageBucket = async () => {
      try {
        await supabase.functions.invoke("create-storage-bucket");
      } catch (error) {
        console.error("Error initializing storage bucket:", error);
      }
    };
    
    initStorageBucket();
  }, []);
  
  // Memoize the fetchProfile function to prevent unnecessary re-renders
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      if (!userId) return;
      
      console.log(`Fetching profile for user: ${userId}`);
      const start = performance.now();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const end = performance.now();
      console.log(`Profile fetch completed in ${end - start}ms`);

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data);
        console.log("Profile data set:", data);
      } else {
        console.log("No profile found for user:", userId);
        // Create an empty profile if none exists
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId })
          .select()
          .single();
          
        if (insertError) {
          console.error("Error creating profile:", insertError);
        } else {
          // Fetch the profile again after creating it
          await fetchProfile(userId);
        }
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing session...");
      setIsLoading(true);
      const start = performance.now();
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      const end = performance.now();
      console.log(`Session refresh completed in ${end - start}ms`);
      
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
      
      return currentSession;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return null;
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
      console.log("Updating profile with data:", profileData);
      const start = performance.now();
      
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      const end = performance.now();
      console.log(`Profile update completed in ${end - start}ms`);

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
    // Get initial session - only once
    const initializeAuth = async () => {
      if (authInitialized) return;
      
      try {
        console.log("Initializing auth...");
        setIsLoading(true);
        const start = performance.now();
        
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        const end = performance.now();
        console.log(`Auth initialization completed in ${end - start}ms`);
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);

          if (initialSession.user) {
            await fetchProfile(initialSession.user.id);
          }
        }
        
        setAuthInitialized(true);
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
        console.log("Auth state change:", event);
        
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
        setAuthInitialized(true);
        
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
  }, [fetchProfile, authInitialized]);

  const signOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize the context value to prevent unnecessary rerenders
  const value = useMemo(() => ({
    session,
    user,
    profile,
    signOut,
    isLoading,
    refreshSession,
    updateProfile,
  }), [session, user, profile, signOut, isLoading, refreshSession, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

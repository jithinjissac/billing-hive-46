import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { supabase, createPublicBucket } from "@/integrations/supabase/client";
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
  refreshSession: () => Promise<Session | null>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  initStorageBucket: () => Promise<void>; // Function to initialize storage bucket
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  signOut: async () => {},
  isLoading: true,
  refreshSession: async () => null,
  updateProfile: async () => {},
  initStorageBucket: async () => {},
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
  const [bucketInitialized, setBucketInitialized] = useState(false);
  
  // Initialize storage bucket function with improved error handling
  const initStorageBucket = useCallback(async () => {
    if (!session) {
      console.log("Cannot initialize storage bucket: No active session");
      return;
    }
    
    if (bucketInitialized) {
      console.log("Storage bucket already initialized");
      return;
    }
    
    try {
      console.log("Initializing profile-pictures storage bucket...");
      
      // Use the helper function to create a public bucket
      const response = await createPublicBucket('profile-pictures');
      console.log("Storage bucket response:", response);
      
      setBucketInitialized(true);
      return response;
    } catch (error) {
      console.error("Error initializing storage bucket:", error);
      // Log but don't throw to prevent disrupting the app flow
    }
  }, [session, bucketInitialized]);
  
  // Initialize storage bucket when session is established
  useEffect(() => {
    if (session && !bucketInitialized) {
      initStorageBucket().catch(console.error);
    }
  }, [session, bucketInitialized, initStorageBucket]);
  
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log(`Fetching profile for user: ${userId}`);
      
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        toast.error("Failed to fetch profile");
        return null;
      }

      if (existingProfile) {
        console.log("Profile data fetched:", existingProfile);
        setProfile(existingProfile);
        return existingProfile;
      } else {
        // If profile doesn't exist, create it
        console.log("Creating new profile for user:", userId);
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: userId }])
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
          toast.error("Failed to create profile");
          return null;
        } else if (newProfile) {
          console.log("New profile created:", newProfile);
          setProfile(newProfile);
          return newProfile;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      toast.error("An error occurred while fetching profile");
      return null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing session...");
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      return currentSession;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
  }, [fetchProfile]);

  const updateProfile = useCallback(async (profileData: Partial<Profile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    try {
      console.log("Updating profile with data:", profileData);
      
      // Make sure we have the user ID in the profile data
      const dataToUpdate = {
        ...profileData,
        id: user.id,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(dataToUpdate);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to update profile: " + error.message);
        return;
      }

      // Fetch the updated profile to ensure we have the latest data
      const updatedProfile = await fetchProfile(user.id);
      
      if (updatedProfile) {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error in updateProfile:", error);
      toast.error("An error occurred while updating profile");
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (authInitialized) return;
      
      try {
        console.log("Initializing auth...");
        setIsLoading(true);
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setAuthInitialized(true);
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state change:", event);
      
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        await fetchProfile(newSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      setIsLoading(false);
      setAuthInitialized(true);
      
      if (event === 'SIGNED_IN') {
        toast.success("Signed in successfully");
      } else if (event === 'SIGNED_OUT') {
        toast.success("Signed out successfully");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile, authInitialized]);

  const signOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    signOut,
    isLoading,
    refreshSession,
    updateProfile,
    initStorageBucket,
  }), [session, user, profile, signOut, isLoading, refreshSession, updateProfile, initStorageBucket]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

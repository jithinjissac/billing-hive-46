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
  removeProfilePicture: () => Promise<void>;
  initStorageBucket: () => Promise<any>; // Function to initialize storage bucket
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  signOut: async () => {},
  isLoading: true,
  refreshSession: async () => null,
  updateProfile: async () => {},
  removeProfilePicture: async () => {},
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
  
  const initStorageBucket = useCallback(async () => {
    try {
      console.log("Initializing profile-pictures storage bucket...");
      
      const response = await createPublicBucket('profile-pictures');
      console.log("Storage bucket response:", response);
      
      if (response.partial) {
        console.warn("Storage bucket partially configured:", response.message);
        toast.warning("Storage access partially configured. Please try again if you encounter upload issues.");
      }
      
      setBucketInitialized(true);
      return response;
    } catch (error) {
      console.error("Error initializing storage bucket:", error);
      toast.error("Failed to configure storage access. Profile picture uploads may not work.");
      setBucketInitialized(true);
      return { error: true, message: "Failed to initialize bucket" };
    }
  }, []);
  
  useEffect(() => {
    const initBucket = async () => {
      if (session && !bucketInitialized) {
        try {
          await initStorageBucket();
        } catch (error) {
          console.error("Failed to initialize bucket on auth:", error);
          // Don't block UI for this error
        }
      }
    };
    
    initBucket();
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
        console.log("No profile found, creating new profile for user:", userId);
        
        // Get user metadata to populate profile
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        let firstName = null;
        let lastName = null;
        
        if (!userError && userData?.user?.user_metadata) {
          firstName = userData.user.user_metadata.first_name || null;
          lastName = userData.user.user_metadata.last_name || null;
          console.log("Using metadata for profile creation:", firstName, lastName);
        }
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({ 
            id: userId,
            first_name: firstName,
            last_name: lastName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
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
        console.log("Session found, setting session and user");
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Always fetch the profile when refreshing session
        const profileData = await fetchProfile(currentSession.user.id);
        console.log("Profile data after refresh:", profileData);
      } else {
        console.log("No session found, clearing user and profile data");
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

      const updatedProfile = await fetchProfile(user.id);
      
      if (updatedProfile) {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error in updateProfile:", error);
      toast.error("An error occurred while updating profile");
    }
  }, [user, fetchProfile]);

  const removeProfilePicture = useCallback(async () => {
    if (!user || !profile?.profile_picture_url) {
      return;
    }

    try {
      console.log("Removing profile picture...");
      
      const profilePicturePath = profile.profile_picture_url.split('/').pop();
      
      if (!profilePicturePath) {
        toast.error("Could not determine profile picture path");
        return;
      }
      
      if (!bucketInitialized) {
        await initStorageBucket();
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('id', user.id);
      
      if (updateError) {
        console.error("Error updating profile:", updateError);
        toast.error("Failed to update profile");
        return;
      }
      
      try {
        const { error: storageError } = await supabase
          .storage
          .from('profile-pictures')
          .remove([profilePicturePath]);
        
        if (storageError) {
          console.error("Error removing profile picture from storage:", storageError);
          // Don't show error to user since profile was already updated
        }
      } catch (storageError) {
        console.error("Exception removing profile picture from storage:", storageError);
        // Don't show error to user since profile was already updated
      }
      
      setProfile(prev => prev ? {...prev, profile_picture_url: null} : null);
      
      toast.success("Profile picture removed successfully");
    } catch (error) {
      console.error("Error in removeProfilePicture:", error);
      toast.error("An error occurred while removing profile picture");
    }
  }, [user, profile, bucketInitialized, initStorageBucket]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (authInitialized) return;
      
      try {
        console.log("Initializing auth...");
        setIsLoading(true);
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          console.log("Initial session found:", initialSession.user.id);
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Fetch profile data for the logged-in user
          await fetchProfile(initialSession.user.id);
        } else {
          console.log("No initial session found");
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
        console.log("New session detected:", newSession.user.id);
        setSession(newSession);
        setUser(newSession.user);
        
        // Fetch profile on auth state change
        await fetchProfile(newSession.user.id);
      } else {
        console.log("No session in auth state change");
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
    removeProfilePicture,
    initStorageBucket,
  }), [session, user, profile, signOut, isLoading, refreshSession, updateProfile, removeProfilePicture, initStorageBucket]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

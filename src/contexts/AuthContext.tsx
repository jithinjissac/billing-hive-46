
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { supabase, createPublicBucket } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { safeUUID, prepareForInsert, prepareForUpdate } from "@/utils/supabaseHelpers";

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
  const [authStateChangeProcessed, setAuthStateChangeProcessed] = useState(false);
  
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
        .eq('id', safeUUID(userId))
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        toast.error("Failed to fetch profile");
        return null;
      }

      if (existingProfile) {
        console.log("Profile data fetched:", existingProfile);
        const profileData: Profile = {
          id: existingProfile.id,
          first_name: existingProfile.first_name,
          last_name: existingProfile.last_name,
          phone: existingProfile.phone,
          address: existingProfile.address,
          profile_picture_url: existingProfile.profile_picture_url,
          position: existingProfile.position
        };
        setProfile(profileData);
        return profileData;
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

        // Prepare data for insert, ensuring we exclude id from auto-generated fields
        const profileData = {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Directly use upsert without the prepareForInsert helper 
        // since we specifically need the id field for this operation
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert(profileData, {
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
          const createdProfile: Profile = {
            id: newProfile.id,
            first_name: newProfile.first_name,
            last_name: newProfile.last_name,
            phone: newProfile.phone,
            address: newProfile.address,
            profile_picture_url: newProfile.profile_picture_url,
            position: newProfile.position
          };
          setProfile(createdProfile);
          return createdProfile;
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
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return null;
      }
      
      if (currentSession) {
        console.log("Session found, setting session and user");
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Always fetch the profile when refreshing session
        await fetchProfile(currentSession.user.id);
        console.log("Profile data after refresh:", profile);
      } else {
        console.log("No session found, clearing user and profile data");
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      return currentSession;
    } catch (error) {
      console.error("Error refreshing session:", error);
      setIsLoading(false);
      return null;
    } finally {
      // Ensure loading state is updated even if there are errors
      setIsLoading(false);
    }
  }, [fetchProfile, profile]);

  const updateProfile = useCallback(async (profileData: Partial<Profile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    try {
      console.log("Updating profile with data:", profileData);
      
      // Prepare the update data
      const updateData = prepareForUpdate({
        ...profileData,
        updated_at: new Date().toISOString()
      });
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', safeUUID(user.id));

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

      // Use a simpler update with just the profile_picture_url field
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: null })
        .eq('id', safeUUID(user.id));
      
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
    // Define a timeout for the initial auth check to prevent infinite loading
    let authTimeoutId: number | undefined;
    
    const initializeAuth = async () => {
      if (authInitialized) return;
      
      try {
        console.log("Initializing auth...");
        setIsLoading(true);
        
        // Set a timeout to prevent infinite loading state
        authTimeoutId = window.setTimeout(() => {
          console.warn("Auth initialization timeout reached - forcing completion");
          setIsLoading(false);
          setAuthInitialized(true);
        }, 5000); // 5 seconds timeout
        
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        // Clear the timeout since we got a response
        clearTimeout(authTimeoutId);
        
        if (error) {
          console.error("Error getting initial session:", error);
          setIsLoading(false);
          setAuthInitialized(true);
          return;
        }
        
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
        clearTimeout(authTimeoutId);
        setAuthInitialized(true);
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state change:", event);
      
      // Mark that we've processed at least one auth state change event
      setAuthStateChangeProcessed(true);
      
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
      // Clean up timeout and listener on unmount
      if (authTimeoutId) clearTimeout(authTimeoutId);
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, [fetchProfile, authInitialized]);
  
  // Fallback effect to ensure loading state is eventually turned off
  // in case anything goes wrong with auth initialization
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (isLoading && authInitialized) {
        console.warn("Forcing loading state to false after timeout");
        setIsLoading(false);
      }
    }, 8000); // 8 seconds fallback
    
    return () => clearTimeout(fallbackTimer);
  }, [isLoading, authInitialized]);

  const signOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      setIsLoading(true);
      await supabase.auth.signOut();
      // The onAuthStateChange handler will update state
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
      setIsLoading(false);
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

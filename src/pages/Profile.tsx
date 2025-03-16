import { useState, useEffect, ChangeEvent, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Info, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const Profile = () => {
  const { user, profile, updateProfile, isLoading: authLoading, initStorageBucket } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bucketReady, setBucketReady] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    position: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        position: profile.position || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    const prepareBucket = async () => {
      if (user && !bucketReady) {
        try {
          console.log("Pre-initializing storage bucket on profile page load...");
          const result = await initStorageBucket();
          console.log("Bucket initialization result:", result);
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          setBucketReady(true);
          console.log("Bucket is now ready for uploads");
        } catch (error) {
          console.error("Error initializing bucket:", error);
        }
      }
    };
    
    prepareBucket();
  }, [user, bucketReady, initStorageBucket]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    setLoading(true);
    
    try {
      await updateProfile(formData);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingImage(true);
    setUploadProgress(0);
    setUploadError(null);
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      setUploadingImage(false);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      setUploadingImage(false);
      return;
    }
    
    try {
      if (!bucketReady) {
        console.log("Initializing storage bucket before upload...");
        const bucketResult = await initStorageBucket();
        console.log("Bucket initialization result:", bucketResult);
        
        console.log("Waiting for bucket policies to apply...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        setBucketReady(true);
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      console.log("Attempting to upload file:", fileName);
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 200);
      
      let uploadSuccess = false;
      let uploadError = null;
      let publicUrl = '';
      
      for (let attempt = 1; attempt <= 3 && !uploadSuccess; attempt++) {
        try {
          console.log(`Upload attempt ${attempt}...`);
          
          if (attempt > 1) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
          
          const { error, data } = await supabase.storage
            .from('profile-pictures')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (error) {
            console.error(`Upload error (attempt ${attempt}):`, error);
            uploadError = error;
          } else {
            uploadSuccess = true;
            console.log(`Upload succeeded on attempt ${attempt}:`, data);
            
            const { data: urlData } = supabase.storage
              .from('profile-pictures')
              .getPublicUrl(fileName);
              
            publicUrl = urlData.publicUrl;
            console.log("File public URL:", publicUrl);
          }
        } catch (err) {
          console.error(`Upload exception (attempt ${attempt}):`, err);
          uploadError = err;
        }
      }
      
      clearInterval(progressInterval);
      
      if (!uploadSuccess) {
        throw uploadError || new Error("Failed to upload after multiple attempts");
      }
      
      setUploadProgress(100);
      
      await updateProfile({
        profile_picture_url: publicUrl
      });
      
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      setUploadError(error.message || "Unknown error occurred");
      toast.error(`Failed to upload profile picture: ${error.message || "Unknown error"}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user || !profile?.profile_picture_url) return;
    
    setRemovingImage(true);
    try {
      const url = new URL(profile.profile_picture_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      console.log("Attempting to remove file:", fileName);
      
      if (!bucketReady) {
        console.log("Initializing storage bucket before deletion...");
        await initStorageBucket();
        
        console.log("Waiting for bucket policies to apply...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        setBucketReady(true);
      }
      
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove([fileName]);
      
      if (deleteError) {
        console.error("Error deleting profile picture:", deleteError);
        throw deleteError;
      }
      
      await updateProfile({
        profile_picture_url: null
      });
      
      toast.success("Profile picture removed successfully");
    } catch (error: any) {
      console.error("Error removing profile picture:", error);
      toast.error(`Failed to remove profile picture: ${error.message || "Unknown error"}`);
    } finally {
      setRemovingImage(false);
    }
  };

  const initials = useMemo(() => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || "?";
  }, [formData.first_name, formData.last_name, user]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Profile</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Loading your profile information...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="text-center mt-4">
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto mt-2" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Loading your personal information...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Profile</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Update your profile picture here. Click on the avatar to change it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative mb-6">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={profile?.profile_picture_url || ""} alt={formData.first_name} />
                <AvatarFallback className="text-3xl font-bold bg-primary text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="absolute -bottom-2 -right-2 flex gap-2">
                <label 
                  htmlFor="profile-picture-upload" 
                  className={`rounded-full p-2 ${uploadingImage ? 'bg-muted' : 'bg-primary'} text-white cursor-pointer`}
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </label>
                
                {profile?.profile_picture_url && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full h-8 w-8 p-0"
                    onClick={handleRemoveProfilePicture}
                    disabled={removingImage || uploadingImage}
                  >
                    {removingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              
              <input 
                type="file" 
                id="profile-picture-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleProfilePictureUpload}
                disabled={uploadingImage || removingImage}
              />
            </div>
            
            {uploadingImage && (
              <div className="w-full mb-4">
                <Progress value={uploadProgress} className="h-2 mb-1" />
                <p className="text-xs text-center text-muted-foreground">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}
            
            {uploadError && (
              <div className="mb-4 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            
            {!bucketReady && !uploadingImage && !removingImage && (
              <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-600 flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Preparing storage for uploads...</span>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-lg font-medium">
                {formData.first_name && formData.last_name 
                  ? `${formData.first_name} ${formData.last_name}` 
                  : 'Update Your Name'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formData.position || 'Add your position'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal information here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="CEO, Manager, etc."
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, Anytown, USA"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

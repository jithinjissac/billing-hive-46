
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const UpdateAuthSettings = () => {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const updateAuthSettings = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      // Get the current site URL
      const siteUrl = window.location.origin;
      
      const { data, error } = await supabase.functions.invoke('update-auth-settings', {
        body: { siteUrl },
      });
      
      if (error) {
        throw error;
      }
      
      if (data.success) {
        toast.success("Authentication settings updated successfully");
        setInitialized(true);
      } else {
        throw new Error(data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error updating auth settings:", error);
      toast.error("Failed to update authentication settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if settings were already initialized
    const checkInitialization = () => {
      const initialized = localStorage.getItem("auth_settings_initialized");
      if (initialized === "true") {
        setInitialized(true);
      }
    };
    
    checkInitialization();
  }, []);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem("auth_settings_initialized", "true");
    }
  }, [initialized]);

  if (initialized) {
    return null;
  }

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
      <h3 className="font-medium text-amber-800">Email Configuration</h3>
      <p className="text-sm text-amber-700 mb-3">
        To properly configure authentication emails with the correct branding and URLs, click the button below:
      </p>
      <Button 
        onClick={updateAuthSettings} 
        disabled={loading}
        variant="outline" 
        className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Configuring...
          </>
        ) : (
          "Configure Auth Emails"
        )}
      </Button>
    </div>
  );
};

export default UpdateAuthSettings;

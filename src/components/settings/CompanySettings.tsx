
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getCompanySettings, updateCompanySettings } from "@/services/settingsService";
import { supabase } from "@/integrations/supabase/client";

export function CompanySettings() {
  const [companyName, setCompanyName] = useState("Techius Solutions");
  const [address, setAddress] = useState("Mallappally, Kerala");
  const [uamNumber, setUamNumber] = useState("KL11D0004260");
  const [phone, setPhone] = useState("+91-9961560545");
  const [website, setWebsite] = useState("www.techiussolutions.in");
  const [email, setEmail] = useState("info@techiussolutions.in");
  const [slogan, setSlogan] = useState("EXPERIENCE THE DIGITAL INNOVATION");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png");
  const [stamp, setStamp] = useState<File | null>(null);
  const [stampUrl, setStampUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      // Check if we have data in Supabase
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        console.error("Error loading company settings from Supabase:", error);
        const localSettings = getCompanySettings();
        setCompanyName(localSettings.name);
        setAddress(localSettings.address);
        setUamNumber(localSettings.uamNumber);
        setPhone(localSettings.phone);
        setWebsite(localSettings.website);
        setEmail(localSettings.email);
        setLogoUrl(localSettings.logo);
        setStampUrl(localSettings.stamp || "");
        setSlogan(localSettings.slogan || "EXPERIENCE THE DIGITAL INNOVATION");
        return;
      }
      
      // If we have data from Supabase, use it
      if (data) {
        setCompanyName(data.name);
        setAddress(data.address || "");
        setUamNumber(data.uam_number || "");
        setPhone(data.phone || "");
        setWebsite(data.website || "");
        setEmail(data.email || "");
        setLogoUrl(data.logo_url || "/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png");
        setStampUrl(data.stamp_url || "");
        setSlogan(data.slogan || "EXPERIENCE THE DIGITAL INNOVATION");
      }
    } catch (error) {
      console.error("Error loading company settings:", error);
      toast.error("Failed to load company settings");
    }
  };
  
  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${folder}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
        
      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        return null;
      }
      
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create new logo URL if file was uploaded
      let newLogoUrl = logoUrl;
      if (logo) {
        const uploadedLogoUrl = await uploadFile(logo, 'company-assets', 'logos');
        if (uploadedLogoUrl) {
          newLogoUrl = uploadedLogoUrl;
        } else {
          toast.error("Failed to upload logo");
        }
      }
      
      // Create new stamp URL if file was uploaded
      let newStampUrl = stampUrl;
      if (stamp) {
        const uploadedStampUrl = await uploadFile(stamp, 'company-assets', 'stamps');
        if (uploadedStampUrl) {
          newStampUrl = uploadedStampUrl;
        } else {
          toast.error("Failed to upload stamp");
        }
      }
      
      // Update settings in Supabase
      const { data, error } = await supabase
        .from('company_settings')
        .upsert({
          id: 1, // Use 1 as the default ID for single record settings
          name: companyName,
          address: address,
          uam_number: uamNumber,
          phone: phone,
          website: website,
          email: email,
          logo_url: newLogoUrl,
          stamp_url: newStampUrl,
          slogan: slogan,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error updating company settings:", error);
        toast.error("Failed to update company settings");
        return;
      }
      
      // Also update in local storage for compatibility
      updateCompanySettings({
        name: companyName,
        address,
        uamNumber,
        phone,
        website,
        email,
        logo: newLogoUrl,
        stamp: newStampUrl,
        slogan
      });
      
      toast.success("Company settings updated successfully");
    } catch (error) {
      console.error("Error updating company settings:", error);
      toast.error("Failed to update company settings");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="logo">Company Logo</Label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-32 rounded-md border border-input flex items-center justify-center overflow-hidden">
              {logo ? (
                <img 
                  src={URL.createObjectURL(logo)} 
                  alt="Company Logo" 
                  className="h-full w-full object-contain" 
                />
              ) : (
                <img 
                  src={logoUrl} 
                  alt="Company Logo" 
                  className="h-full w-full object-contain" 
                />
              )}
            </div>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setLogo(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stamp">Company Stamp</Label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-32 rounded-md border border-input flex items-center justify-center overflow-hidden">
              {stamp ? (
                <img 
                  src={URL.createObjectURL(stamp)} 
                  alt="Company Stamp" 
                  className="h-full w-full object-contain" 
                />
              ) : stampUrl ? (
                <img 
                  src={stampUrl} 
                  alt="Company Stamp" 
                  className="h-full w-full object-contain" 
                />
              ) : (
                <div className="text-gray-400 text-sm text-center">No stamp uploaded</div>
              )}
            </div>
            <Input
              id="stamp"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setStamp(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slogan">Company Slogan</Label>
          <Input
            id="slogan"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="uamNumber">UAM Number</Label>
            <Input
              id="uamNumber"
              value={uamNumber}
              onChange={(e) => setUamNumber(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

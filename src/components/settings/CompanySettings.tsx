
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
  
  // File states
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png");
  const [stamp, setStamp] = useState<File | null>(null);
  const [stampUrl, setStampUrl] = useState<string>("");
  const [icon, setIcon] = useState<File | null>(null);
  const [iconUrl, setIconUrl] = useState<string>("/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png");
  
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
        setIconUrl(localSettings.icon || "/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png");
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
        setIconUrl(data.icon_url || "/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png");
        setSlogan(data.slogan || "EXPERIENCE THE DIGITAL INNOVATION");
      }
    } catch (error) {
      console.error("Error loading company settings:", error);
      toast.error("Failed to load company settings");
    }
  };
  
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Convert file to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          reject(null);
        };
      });
    } catch (error) {
      console.error("Error reading file:", error);
      return null;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Process file uploads
      let newLogoUrl = logoUrl;
      let newStampUrl = stampUrl;
      let newIconUrl = iconUrl;
      
      if (logo) {
        const base64Logo = await uploadFile(logo);
        if (base64Logo) {
          newLogoUrl = base64Logo;
        } else {
          toast.error("Failed to process logo");
        }
      }
      
      if (stamp) {
        const base64Stamp = await uploadFile(stamp);
        if (base64Stamp) {
          newStampUrl = base64Stamp;
        } else {
          toast.error("Failed to process stamp");
        }
      }
      
      if (icon) {
        const base64Icon = await uploadFile(icon);
        if (base64Icon) {
          newIconUrl = base64Icon;
        } else {
          toast.error("Failed to process icon");
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
          icon_url: newIconUrl,
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
        icon: newIconUrl,
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
          <p className="text-sm text-muted-foreground">Recommended size: 300x100px. Used in invoices and documents.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="icon">Company Icon</Label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-md border border-input flex items-center justify-center overflow-hidden">
              {icon ? (
                <img 
                  src={URL.createObjectURL(icon)} 
                  alt="Company Icon" 
                  className="h-full w-full object-contain" 
                />
              ) : (
                <img 
                  src={iconUrl} 
                  alt="Company Icon" 
                  className="h-full w-full object-contain" 
                />
              )}
            </div>
            <Input
              id="icon"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setIcon(e.target.files[0]);
                }
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground">Square icon used in the sidebar. Recommended size: 64x64px.</p>
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
          <p className="text-sm text-muted-foreground">Used on invoices. Recommended size: 200x200px.</p>
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

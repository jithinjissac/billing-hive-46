
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function CompanySettings() {
  const [companyName, setCompanyName] = useState("Techius Solutions");
  const [address, setAddress] = useState("Mallappally, Kerala");
  const [uamNumber, setUamNumber] = useState("KL11D0004260");
  const [phone, setPhone] = useState("+91-9961560545");
  const [website, setWebsite] = useState("www.techiussolutions.in");
  const [email, setEmail] = useState("info@techiussolutions.in");
  const [logo, setLogo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
                  src="/lovable-uploads/c3b81e67-f83d-4fb7-82e4-f4a8bdc42f2a.png" 
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
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
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

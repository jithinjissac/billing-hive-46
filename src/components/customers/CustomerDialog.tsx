
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Customer } from "@/types/invoice";
import { toast } from "sonner";
import { dummyCustomers } from "@/data/dummyData";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit?: (customer: Customer) => void;
}

export function CustomerDialog({ 
  open, 
  onOpenChange, 
  customer, 
  onSubmit 
}: CustomerDialogProps) {
  const [name, setName] = useState(customer?.name || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reset form when customer changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      setName(customer?.name || "");
      setEmail(customer?.email || "");
      setPhone(customer?.phone || "");
      setAddress(customer?.address || "");
    }
  }, [open, customer]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const customerData: Customer = {
        id: customer?.id || crypto.randomUUID(),
        name,
        email,
        phone,
        address
      };
      
      if (onSubmit) {
        onSubmit(customerData);
      } else {
        // Add to dummy data (in real app, this would be an API call)
        dummyCustomers.push(customerData);
        toast.success("Customer added successfully");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("An error occurred while saving customer");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : customer ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

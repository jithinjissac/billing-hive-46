
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ColorPicker } from "./ColorPicker";
import { 
  getInvoiceSettings, 
  updateInvoiceSettings,
  availableCurrencies 
} from "@/services/settingsService";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyCode } from "@/types/invoice";

export function InvoiceSettings() {
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [defaultDueDays, setDefaultDueDays] = useState("30");
  const [defaultTaxRate, setDefaultTaxRate] = useState("10");
  const [defaultNotes, setDefaultNotes] = useState("Thank you for your business!");
  const [accentColor, setAccentColor] = useState("#00BCD4");
  const [footerText, setFooterText] = useState("Logic will get you from A to B. Imagination will take you everywhere. - Albert Einstein");
  const [template, setTemplate] = useState("modern");
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>("INR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load settings on component mount
  useEffect(() => {
    const settings = getInvoiceSettings();
    setInvoicePrefix(settings.invoicePrefix);
    setDefaultDueDays(settings.defaultDueDays.toString());
    setDefaultTaxRate(settings.defaultTaxRate.toString());
    setDefaultNotes(settings.defaultNotes);
    setAccentColor(settings.accentColor);
    setFooterText(settings.footerText);
    setTemplate(settings.template);
    setDefaultCurrency(settings.defaultCurrency || "INR");
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Update settings
      updateInvoiceSettings({
        invoicePrefix,
        defaultDueDays: parseInt(defaultDueDays),
        defaultTaxRate: parseInt(defaultTaxRate),
        defaultNotes,
        accentColor,
        footerText,
        template,
        defaultCurrency
      });
      
      toast.success("Invoice settings updated successfully");
    } catch (error) {
      console.error("Error updating invoice settings:", error);
      toast.error("Failed to update invoice settings");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
            <Input
              id="invoicePrefix"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="defaultDueDays">Default Due Days</Label>
            <Input
              id="defaultDueDays"
              type="number"
              min="1"
              value={defaultDueDays}
              onChange={(e) => setDefaultDueDays(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
            <Input
              id="defaultTaxRate"
              type="number"
              min="0"
              max="100"
              value={defaultTaxRate}
              onChange={(e) => setDefaultTaxRate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">Default Currency</Label>
            <Select
              value={defaultCurrency}
              onValueChange={(value) => setDefaultCurrency(value as CurrencyCode)}
            >
              <SelectTrigger id="defaultCurrency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <ColorPicker 
              color={accentColor} 
              onChange={setAccentColor} 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="defaultNotes">Default Notes</Label>
          <Textarea
            id="defaultNotes"
            value={defaultNotes}
            onChange={(e) => setDefaultNotes(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="footerText">Footer Text</Label>
          <Textarea
            id="footerText"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            rows={2}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Invoice Template</Label>
          <RadioGroup
            value={template}
            onValueChange={setTemplate}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2"
          >
            <div className="flex items-center space-x-2 border rounded-md p-4">
              <RadioGroupItem value="modern" id="modern" />
              <Label htmlFor="modern" className="cursor-pointer">Modern</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-4">
              <RadioGroupItem value="classic" id="classic" />
              <Label htmlFor="classic" className="cursor-pointer">Classic</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-4">
              <RadioGroupItem value="minimal" id="minimal" />
              <Label htmlFor="minimal" className="cursor-pointer">Minimal</Label>
            </div>
          </RadioGroup>
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

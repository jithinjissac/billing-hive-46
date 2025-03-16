
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanySettings } from "@/components/settings/CompanySettings";
import { InvoiceSettings } from "@/components/settings/InvoiceSettings";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">TechiusPay Settings</h1>
      </div>
      
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details to be displayed on invoices and other documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <CompanySettings />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>
                Customize the appearance and default settings for your invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <InvoiceSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;

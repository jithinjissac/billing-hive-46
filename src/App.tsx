
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import InvoiceCreate from "./pages/InvoiceCreate";
import InvoiceView from "./pages/InvoiceView";
import InvoiceEdit from "./pages/InvoiceEdit";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Set app title to TechiusPay
  useEffect(() => {
    document.title = "TechiusPay - Invoice Management System";
  }, []);
  useEffect(() => {
    // Remove the unwanted script
    document.querySelectorAll("script[src='https://cdn.gpteng.co/gptengineer.js']").forEach(el => el.remove());

    // Remove the unwanted element
    document.querySelectorAll("#lovable-badge, script[src*='lovable']").forEach(el => el.remove());
  }, []); // Runs once when the component mounts

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/create" element={<InvoiceCreate />} />
            <Route path="/invoices/:id" element={<InvoiceView />} />
            <Route path="/invoices/edit/:id" element={<InvoiceEdit />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

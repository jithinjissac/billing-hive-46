
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Invoices from "./pages/Invoices";
import InvoiceCreate from "./pages/InvoiceCreate";
import InvoiceView from "./pages/InvoiceView";
import InvoiceEdit from "./pages/InvoiceEdit";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import ResetPassword from "./pages/auth/ResetPassword";
import UpdatePassword from "./pages/auth/UpdatePassword";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { supabase } from "./integrations/supabase/client";

function App() {
  // Initialize storage bucket on app load
  useEffect(() => {
    const initApp = async () => {
      try {
        await supabase.functions.invoke('create-storage-bucket', {});
      } catch (error) {
        console.error("Error initializing storage:", error);
      }
    };
    
    initApp();
  }, []);
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/update-password" element={<UpdatePassword />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute>
              <Invoices />
            </ProtectedRoute>
          } />
          <Route path="/invoices/create" element={
            <ProtectedRoute>
              <InvoiceCreate />
            </ProtectedRoute>
          } />
          <Route path="/invoices/:id" element={
            <ProtectedRoute>
              <InvoiceView />
            </ProtectedRoute>
          } />
          <Route path="/invoices/edit/:id" element={
            <ProtectedRoute>
              <InvoiceEdit />
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } />
          <Route path="/customers/:id" element={
            <ProtectedRoute>
              <CustomerDetail />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;

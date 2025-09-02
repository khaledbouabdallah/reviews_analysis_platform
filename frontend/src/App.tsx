import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import Businesses from "./pages/Businesses";
import Locations from "./pages/Locations";
import Jobs from "./pages/Jobs";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService"; 
import CookiePolicy from "./pages/CookiePolicy";
import Analytics from "./pages/Analytics";
import { CookieConsent } from "./components/legal/CookieConsent";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthRedirect } from "./components/auth/AuthRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Auth routes - redirect to dashboard if already logged in */}
          <Route path="/signin" element={
            <AuthRedirect>
              <SignIn />
            </AuthRedirect>
          } />
          <Route path="/signup" element={
            <AuthRedirect>
              <SignUp />
            </AuthRedirect>
          } />

          {/* ADD: Legal pages - accessible to everyone */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />

          {/* Protected dashboard routes - require authentication */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="businesses" element={<Businesses />} />
            <Route path="locations" element={<Locations />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="campaigns" element={<div className="p-6">Campaigns Page (Coming Soon)</div>} />
            <Route path="jobs" element={<Jobs/>} />
            <Route path="reviews" element={<Reviews/>} />
            <Route path="documentation" element={<div className="p-6">Documentation Page (Coming Soon)</div>} />
            <Route path="settings" element={<div className="p-6">Settings Page (Coming Soon)</div>} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      {/* ADD: Global components */}
      <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

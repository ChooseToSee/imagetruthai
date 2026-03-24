import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlanProvider } from "@/contexts/PlanContext";
import DevPlanToolbar from "@/components/DevPlanToolbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";
import AiDisclaimer from "./pages/AiDisclaimer";
import HowItWorksPage from "./pages/HowItWorks";
import PhotoshoppedSigns from "./pages/PhotoshoppedSigns";
import SharedReport from "./pages/SharedReport";
import FeedbackWidget from "./components/FeedbackWidget";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PlanProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/history" element={<History />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/ai-disclaimer" element={<AiDisclaimer />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/blog/photoshopped-signs" element={<PhotoshoppedSigns />} />
                <Route path="/report/:token" element={<SharedReport />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <FeedbackWidget />
              <DevPlanToolbar />
            </PlanProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;

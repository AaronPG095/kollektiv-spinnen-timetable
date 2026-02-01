import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy load all route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Admin = lazy(() => import("./pages/Admin"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Tickets = lazy(() => import("./pages/Soli-Beitrag"));
const TicketCheckout = lazy(() => import("./pages/Soli-BeitragCheckout"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  if (import.meta.env.DEV) {
    console.log('[DEBUG] App component rendering');
  }
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/reset-password" element={<ResetPassword />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/faq" element={<FAQ />} />
                  {/* Soli-Beitrag routes */}
                  <Route path="/soli-beitrag" element={<Tickets />} />
                  <Route path="/soli-beitrag/checkout" element={<TicketCheckout />} />
                  {/* Backwards compatibility: redirect old /tickets URLs */}
                  <Route path="/tickets" element={<Navigate to="/soli-beitrag" replace />} />
                  <Route path="/tickets/checkout" element={<Navigate to="/soli-beitrag/checkout" replace />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/profile" element={<Profile />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

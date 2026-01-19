import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import FAQ from "./pages/FAQ";
import Tickets from "./pages/Tickets";
import TicketCheckout from "./pages/TicketCheckout";
import About from "./pages/About";

const App = () => {
  // #region agent log
  console.log('[DEBUG] App component rendering');
  // #endregion
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/faq" element={<FAQ />} />
                {/* Soli-Beitrag routes */}
                <Route path="/soli-beitrag" element={<Tickets />} />
                <Route path="/soli-beitrag/checkout" element={<TicketCheckout />} />
                {/* Backwards compatibility: redirect old /tickets URLs */}
                <Route path="/tickets" element={<Navigate to="/soli-beitrag" replace />} />
                <Route path="/tickets/checkout" element={<Navigate to="/soli-beitrag/checkout" replace />} />
                <Route path="/about" element={<About />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

// App Pages
import Home from "./pages/app/Home";
import Rules from "./pages/app/Rules";
import Nights from "./pages/app/Nights";
import Tournaments from "./pages/app/Tournaments";
import Profile from "./pages/app/Profile";
import NightDetails from "@/pages/app/NightDetails";
import TournamentDetails from "@/pages/app/TournamentDetails";
import AppLayout from "./pages/app/AppLayout";
import { AuthGuard } from "./components/layout/AuthGuard";

// Dev Pages
import UIKit from "./pages/dev/UIKit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* App Routes (Protected) */}
          <Route
            path="/app/*"
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="rules" element={<Rules />} />
            <Route path="nights" element={<Nights />} />
            <Route path="nights/:nightId" element={<NightDetails />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="tournaments/:tournamentId" element={<TournamentDetails />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Dev Routes */}
          <Route path="/dev/ui-kit" element={<UIKit />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useRoutes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pegawai from "./pages/Pegawai";
import TambahPegawai from "./pages/TambahPegawai";
import EditPegawai from "./pages/EditPegawai";
import Evaluasi from "./pages/Evaluasi";
import FormEvaluasi from "./pages/FormEvaluasi";
import Ranking from "./pages/Ranking";
import Laporan from "./pages/Laporan";
import Settings from "./pages/Settings";
import AdminScoreFix from "./pages/AdminScoreFix";
import NotFound from "./pages/NotFound";

// Import tempo routes conditionally
let routes: any = null;
// Disabled tempo routes for now
// if (import.meta.env.VITE_TEMPO) {
//   try {
//     const tempoRoutes = await import("tempo-routes");
//     routes = tempoRoutes.default;
//   } catch (error) {}
// }

const queryClient = new QueryClient();

const AppRoutes = () => {
  const tempoRoutes = null; // Disabled for now
  // const tempoRoutes =
  //   import.meta.env.VITE_TEMPO && routes ? useRoutes(routes) : null;

  return (
    <>
      {tempoRoutes}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pegawai" element={<Pegawai />} />
        <Route path="/pegawai/tambah" element={<TambahPegawai />} />
        <Route path="/pegawai/:id/edit" element={<EditPegawai />} />
        <Route path="/evaluasi" element={<Evaluasi />} />
        <Route path="/evaluasi/:id" element={<FormEvaluasi />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/laporan" element={<Laporan />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/score-fix" element={<AdminScoreFix />} />
        {/* Tempo catch-all route - disabled */}
        {/* {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />} */}
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

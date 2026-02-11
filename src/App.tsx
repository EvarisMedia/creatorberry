import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import AdminUsers from "./pages/AdminUsers";
import CreateBrand from "./pages/CreateBrand";
import Boards from "./pages/Boards";
import Pins from "./pages/Pins";
import Sources from "./pages/Sources";
import Scripts from "./pages/Scripts";
import Sparks from "./pages/Sparks";
import VoiceProfile from "./pages/VoiceProfile";
import Personas from "./pages/Personas";
import AdminTrainingLibrary from "./pages/AdminTrainingLibrary";
import AdminSettings from "./pages/AdminSettings";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ProductIdeas from "./pages/ProductIdeas";
import ProductOutline from "./pages/ProductOutline";
import ContentEditor from "./pages/ContentEditor";
import ImageStudio from "./pages/ImageStudio";
import ExportCenter from "./pages/ExportCenter";
import KDPPublisher from "./pages/KDPPublisher";
import SalesPageBuilder from "./pages/SalesPageBuilder";
import LaunchToolkit from "./pages/LaunchToolkit";
import TemplateLibrary from "./pages/TemplateLibrary";
import AdminPlans from "./pages/AdminPlans";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/plans" element={<AdminPlans />} />
            <Route path="/admin/training" element={<AdminTrainingLibrary />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/channels/new" element={<CreateBrand />} />
            <Route path="/boards" element={<Boards />} />
            <Route path="/pins" element={<Pins />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/scripts" element={<Scripts />} />
            <Route path="/scripts/new" element={<Scripts />} />
            <Route path="/sparks" element={<Sparks />} />
            <Route path="/voice" element={<VoiceProfile />} />
            <Route path="/personas" element={<Personas />} />
            <Route path="/product-ideas" element={<ProductIdeas />} />
            <Route path="/outlines" element={<ProductOutline />} />
            <Route path="/outlines/:outlineId" element={<ProductOutline />} />
            <Route path="/content-editor" element={<ContentEditor />} />
            <Route path="/content-editor/:sectionId" element={<ContentEditor />} />
            <Route path="/image-studio" element={<ImageStudio />} />
            <Route path="/export-center" element={<ExportCenter />} />
            <Route path="/kdp" element={<KDPPublisher />} />
            <Route path="/sales-pages" element={<SalesPageBuilder />} />
            <Route path="/launch-toolkit" element={<LaunchToolkit />} />
            <Route path="/templates" element={<TemplateLibrary />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

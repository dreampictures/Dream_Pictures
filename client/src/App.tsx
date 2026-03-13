import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Layout & Pages
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Portfolio from "@/pages/Portfolio";
import About from "@/pages/About";
import Terms from "@/pages/Terms";
import AlbumDetail from "@/pages/AlbumDetail";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import GoldenAlbumView from "@/pages/GoldenAlbumView";
import GoldenAlbum from "@/pages/GoldenAlbum";
import AdminCRM from "@/pages/AdminCRM";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();

  // CRM page — no navbar or footer
  if (location.startsWith("/admin-work-secret")) {
    return (
      <Switch>
        <Route path="/admin-work-secret" component={AdminCRM} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/about" component={About} />
          <Route path="/terms" component={Terms} />
          <Route path="/albums/:id" component={AlbumDetail} />
          <Route path="/admin" component={AdminLogin} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/golden-album" component={GoldenAlbumView} />
          <Route path="/golden-album/:code" component={GoldenAlbum} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

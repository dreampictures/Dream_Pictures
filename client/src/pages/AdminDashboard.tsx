import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Users, 
  MessageSquare, 
  Plus, 
  Image as ImageIcon, 
  LogOut, 
  CheckCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ContactMessage, PortfolioItem, Album } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("messages");

  // Auth check
  useEffect(() => {
    if (localStorage.getItem("admin_auth") !== "true") {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: messages } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contacts"],
  });

  const { data: portfolio } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await apiRequest("PATCH", `/api/admin/contacts/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      toast({ title: "Updated", description: "Follow-up status changed" });
    }
  });

  const addPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/portfolio", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Success", description: "Portfolio item added" });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setLocation("/admin");
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-serif">Studio Manager</h1>
            <p className="text-muted-foreground uppercase tracking-widest text-xs mt-2">Dream Pictures Administration</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="messages" className="gap-2"><MessageSquare className="w-4 h-4"/> Inquiries</TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2"><ImageIcon className="w-4 h-4"/> Manage Portfolio</TabsTrigger>
            <TabsTrigger value="albums" className="gap-2"><Users className="w-4 h-4"/> Client Albums</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {messages?.map((msg) => (
                <Card key={msg.id} className="bg-white/[0.02] border-white/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-xl">{msg.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter ${
                            msg.status === 'new' ? 'bg-primary text-primary-foreground' : 'bg-green-500/20 text-green-500 border border-green-500/30'
                          }`}>
                            {msg.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">{msg.email} • {msg.phone}</p>
                        <p className="text-primary text-xs uppercase tracking-widest font-medium">{msg.service}</p>
                        <p className="mt-4 text-white/80 font-light italic leading-relaxed">"{msg.message}"</p>
                      </div>
                      <div className="flex flex-row md:flex-col gap-2 shrink-0">
                        {msg.status === 'new' && (
                          <Button 
                            size="sm" 
                            className="gap-2"
                            onClick={() => updateStatusMutation.mutate({ id: msg.id, status: 'followed-up' })}
                          >
                            <CheckCircle className="w-4 h-4" /> Mark Followed Up
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-2 border-white/10">
                          <Clock className="w-4 h-4" /> Archive
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="bg-white/[0.02] border-white/5 sticky top-32">
                <CardHeader>
                  <CardTitle className="font-serif">Add to Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    addPortfolioMutation.mutate({
                      title: formData.get("title"),
                      category: formData.get("category"),
                      imageUrl: formData.get("imageUrl"),
                      featured: formData.get("featured") === "true",
                    });
                    (e.target as HTMLFormElement).reset();
                  }}>
                    <Input name="title" placeholder="Project Title" className="bg-black/20" required />
                    <Input name="category" placeholder="Category (e.g. Wedding)" className="bg-black/20" required />
                    <Input name="imageUrl" placeholder="Image URL" className="bg-black/20" required />
                    <div className="flex items-center gap-2 px-2 py-2">
                      <input type="checkbox" name="featured" value="true" id="featured" />
                      <label htmlFor="featured" className="text-xs uppercase tracking-widest text-muted-foreground">Featured on Home</label>
                    </div>
                    <Button type="submit" className="w-full gap-2">
                      <Plus className="w-4 h-4" /> Publish Item
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {portfolio?.map((item) => (
                <div key={item.id} className="relative aspect-video rounded-sm overflow-hidden border border-white/5 group">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover brightness-50 group-hover:brightness-75 transition-all" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary">{item.category}</p>
                    <h4 className="font-serif text-white">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="albums">
            <Card className="bg-white/[0.02] border-white/5 p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="font-serif text-2xl mb-2">Album Management</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Create private secure galleries for your clients to view and download their collections.</p>
              <Button className="mt-8 gap-2 px-8">
                <Plus className="w-4 h-4" /> Create New Album
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

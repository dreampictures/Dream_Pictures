import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Users, 
  MessageSquare, 
  Plus, 
  Image as ImageIcon, 
  LogOut, 
  CheckCircle,
  Clock,
  QrCode,
  Copy,
  Download,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ContactMessage, PortfolioItem } from "@shared/schema";
import QRCode from "qrcode";

const ALBUM_BASE_URL = "https://album.thedreampictures.com/golden-album";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("messages");

  // Album Manager state
  const [clientName, setClientName] = useState("");
  const [albumPassword, setAlbumPassword] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

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

  const { data: albumPasswords, refetch: refetchPasswords } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/album-passwords"],
    enabled: activeTab === "albums",
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/contacts/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      toast({ title: "Updated", description: "Follow-up status changed" });
    },
  });

  const addPortfolioMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/portfolio", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({ title: "Success", description: "Portfolio item added" });
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async ({ code, password }: { code: string; password: string }) => {
      await apiRequest("POST", `/api/admin/album-passwords/${code}`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/album-passwords"] });
      toast({ title: "Password Saved", description: "Album password has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save password.", variant: "destructive" });
    },
  });

  const removePasswordMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiRequest("DELETE", `/api/admin/album-passwords/${code}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/album-passwords"] });
      toast({ title: "Password Removed", description: "Album is now public." });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setLocation("/admin");
  };

  const getAlbumUrl = (code: string) => `${ALBUM_BASE_URL}/${code}`;

  const generateQR = async (code: string) => {
    const url = getAlbumUrl(code);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: "#D4AF37", light: "#0a0a0a" },
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
      setGeneratedCode(code);
    } catch (err) {
      toast({ title: "QR Error", description: "Could not generate QR code.", variant: "destructive" });
    }
  };

  const handleGenerateAlbum = async () => {
    const code = clientName.trim().toLowerCase().replace(/\s+/g, "");
    if (!code) {
      toast({ title: "Missing Name", description: "Please enter a client name.", variant: "destructive" });
      return;
    }
    await generateQR(code);
  };

  const handleUpdatePassword = () => {
    const code = clientName.trim().toLowerCase().replace(/\s+/g, "");
    if (!code) {
      toast({ title: "Missing Name", description: "Please enter a client name.", variant: "destructive" });
      return;
    }
    if (!albumPassword.trim()) {
      toast({ title: "Missing Password", description: "Please enter a password.", variant: "destructive" });
      return;
    }
    setPasswordMutation.mutate({ code, password: albumPassword.trim() });
  };

  const handleRemovePassword = () => {
    const code = clientName.trim().toLowerCase().replace(/\s+/g, "");
    if (!code) {
      toast({ title: "Missing Name", description: "Please enter a client name.", variant: "destructive" });
      return;
    }
    removePasswordMutation.mutate(code);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !generatedCode) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `album-qr-${generatedCode}.png`;
    a.click();
  };

  const handleCopyLink = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(getAlbumUrl(generatedCode));
    toast({ title: "Copied!", description: "Album link copied to clipboard." });
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-serif">Studio Manager</h1>
            <p className="text-muted-foreground uppercase tracking-widest text-xs mt-2">
              Dream Pictures Administration
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="w-4 h-4" /> Inquiries
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              <ImageIcon className="w-4 h-4" /> Manage Portfolio
            </TabsTrigger>
            <TabsTrigger value="albums" className="gap-2">
              <Users className="w-4 h-4" /> Album Manager
            </TabsTrigger>
          </TabsList>

          {/* ── INQUIRIES ── */}
          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {messages?.map((msg) => (
                <Card key={msg.id} className="bg-white/[0.02] border-white/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-xl">{msg.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter ${
                              msg.status === "new"
                                ? "bg-primary text-primary-foreground"
                                : "bg-green-500/20 text-green-500 border border-green-500/30"
                            }`}
                          >
                            {msg.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {msg.email} • {msg.phone}
                        </p>
                        <p className="text-primary text-xs uppercase tracking-widest font-medium">
                          {msg.service}
                        </p>
                        <p className="mt-4 text-white/80 font-light italic leading-relaxed">
                          "{msg.message}"
                        </p>
                      </div>
                      <div className="flex flex-row md:flex-col gap-2 shrink-0">
                        {msg.status === "new" && (
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: msg.id, status: "followed-up" })
                            }
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

          {/* ── PORTFOLIO ── */}
          <TabsContent value="portfolio" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="bg-white/[0.02] border-white/5 sticky top-32">
                <CardHeader>
                  <CardTitle className="font-serif">Add to Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      addPortfolioMutation.mutate({
                        title: formData.get("title"),
                        category: formData.get("category"),
                        imageUrl: formData.get("imageUrl"),
                        featured: formData.get("featured") === "true",
                      });
                      (e.target as HTMLFormElement).reset();
                    }}
                  >
                    <Input name="title" placeholder="Project Title" className="bg-black/20" required />
                    <Input name="category" placeholder="Category (e.g. Wedding)" className="bg-black/20" required />
                    <Input name="imageUrl" placeholder="Image URL" className="bg-black/20" required />
                    <div className="flex items-center gap-2 px-2 py-2">
                      <input type="checkbox" name="featured" value="true" id="featured" />
                      <label htmlFor="featured" className="text-xs uppercase tracking-widest text-muted-foreground">
                        Featured on Home
                      </label>
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
                <div
                  key={item.id}
                  className="relative aspect-video rounded-sm overflow-hidden border border-white/5 group"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover brightness-50 group-hover:brightness-75 transition-all"
                  />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary">{item.category}</p>
                    <h4 className="font-serif text-white">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── ALBUM MANAGER ── */}
          <TabsContent value="albums" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left — Form */}
              <Card className="bg-white/[0.02] border-white/5">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    Album Manager
                  </CardTitle>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest">
                    Generate links, QR codes &amp; manage access
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Client Name
                    </label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. nirmalsingh"
                      className="bg-black/30 border-white/10 focus:border-primary/50"
                      data-testid="input-client-name"
                    />
                    <p className="text-[11px] text-white/30">
                      Spaces are removed automatically.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Album Password
                    </label>
                    <Input
                      value={albumPassword}
                      onChange={(e) => setAlbumPassword(e.target.value)}
                      placeholder="Leave blank to keep public"
                      type="text"
                      className="bg-black/30 border-white/10 focus:border-primary/50"
                      data-testid="input-album-password"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      onClick={handleGenerateAlbum}
                      className="gap-2 bg-gradient-to-r from-[#B38D2F] to-[#D4AF37] text-black hover:opacity-90 font-semibold"
                      data-testid="button-generate-album"
                    >
                      <QrCode className="w-4 h-4" />
                      Generate Album
                    </Button>
                    <Button
                      onClick={handleUpdatePassword}
                      variant="outline"
                      className="gap-2 border-white/10 hover:border-primary/50"
                      disabled={setPasswordMutation.isPending}
                      data-testid="button-update-password"
                    >
                      <Lock className="w-4 h-4" />
                      {setPasswordMutation.isPending ? "Saving…" : "Update Password"}
                    </Button>
                    <Button
                      onClick={handleRemovePassword}
                      variant="outline"
                      className="gap-2 border-white/10 hover:border-red-500/50 hover:text-red-400"
                      disabled={removePasswordMutation.isPending}
                      data-testid="button-remove-password"
                    >
                      <Unlock className="w-4 h-4" />
                      {removePasswordMutation.isPending ? "Removing…" : "Remove Password"}
                    </Button>
                    <Button
                      onClick={() => {
                        const code = clientName.trim().toLowerCase().replace(/\s+/g, "");
                        if (code) generateQR(code);
                      }}
                      variant="outline"
                      className="gap-2 border-white/10 hover:border-primary/50"
                      data-testid="button-generate-qr"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Generate QR
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Right — QR Display */}
              <Card className="bg-white/[0.02] border-white/5 flex flex-col">
                <CardHeader>
                  <CardTitle className="font-serif text-base">QR Code &amp; Link</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center gap-6">
                  {qrDataUrl && generatedCode ? (
                    <>
                      <div className="p-3 rounded-xl bg-[#0a0a0a] border border-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                        <img
                          src={qrDataUrl}
                          alt={`QR for ${generatedCode}`}
                          className="w-48 h-48 block"
                        />
                      </div>
                      <div className="w-full space-y-2">
                        <p className="text-center text-xs text-white/40 uppercase tracking-widest">
                          {generatedCode}
                        </p>
                        <div className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 truncate text-center">
                          {getAlbumUrl(generatedCode)}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={handleDownloadQR}
                            className="gap-2 bg-gradient-to-r from-[#B38D2F] to-[#D4AF37] text-black font-semibold hover:opacity-90"
                            data-testid="button-download-qr"
                          >
                            <Download className="w-4 h-4" />
                            Download QR
                          </Button>
                          <Button
                            onClick={handleCopyLink}
                            variant="outline"
                            className="gap-2 border-white/10 hover:border-primary/50"
                            data-testid="button-copy-link"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-white/20 py-8">
                      <QrCode className="w-16 h-16 mx-auto mb-3 opacity-20" />
                      <p className="text-sm uppercase tracking-widest">
                        Enter a client name and click Generate Album
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Password-protected albums list */}
            {albumPasswords && Object.keys(albumPasswords).length > 0 && (
              <Card className="bg-white/[0.02] border-white/5">
                <CardHeader>
                  <CardTitle className="font-serif text-base flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Password-Protected Albums
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(albumPasswords).map(([code, pwd]) => (
                      <div
                        key={code}
                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-black/30 border border-white/5"
                        data-testid={`row-album-${code}`}
                      >
                        <div className="flex items-center gap-4">
                          <Lock className="w-3.5 h-3.5 text-primary/60" />
                          <span className="font-mono text-sm text-white/80">{code}</span>
                          <span className="text-white/30 text-xs font-mono">
                            {"•".repeat(Math.min(pwd.length, 8))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/40 hover:text-primary text-xs gap-1"
                            onClick={() => {
                              setClientName(code);
                              setActiveTab("albums");
                              generateQR(code);
                            }}
                          >
                            <QrCode className="w-3.5 h-3.5" /> QR
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/40 hover:text-red-400 text-xs gap-1"
                            onClick={() => removePasswordMutation.mutate(code)}
                            data-testid={`button-remove-${code}`}
                          >
                            <Unlock className="w-3.5 h-3.5" /> Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

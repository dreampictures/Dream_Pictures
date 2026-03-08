import { useEffect, useState } from "react";
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
  Eye,
  EyeOff,
  ExternalLink,
  BookOpen,
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

function getAlbumUrl(code: string) {
  return `${ALBUM_BASE_URL}/${code}`;
}

async function generateQRDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(getAlbumUrl(code), {
    width: 300,
    margin: 2,
    color: { dark: "#D4AF37", light: "#0a0a0a" },
    errorCorrectionLevel: "H",
  });
}

function AlbumRow({
  code,
  passwords,
  onPasswordChange,
}: {
  code: string;
  passwords: Record<string, string>;
  onPasswordChange: () => void;
}) {
  const { toast } = useToast();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [editingPwd, setEditingPwd] = useState(false);
  const [pwdInput, setPwdInput] = useState("");

  const hasPassword = Boolean(passwords[code]);
  const albumUrl = getAlbumUrl(code);

  const setPasswordMutation = useMutation({
    mutationFn: async ({ code, password }: { code: string; password: string }) => {
      await apiRequest("POST", `/api/admin/album-passwords/${code}`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/album-passwords"] });
      toast({ title: "Password Saved", description: `Password set for ${code}` });
      setEditingPwd(false);
      setPwdInput("");
      onPasswordChange();
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
      toast({ title: "Password Removed", description: `${code} is now public.` });
      onPasswordChange();
    },
  });

  const handleShowQr = async () => {
    if (!qrUrl) {
      const url = await generateQRDataUrl(code);
      setQrUrl(url);
    }
    setShowQr((v) => !v);
  };

  const handleDownloadQr = async () => {
    const url = qrUrl || (await generateQRDataUrl(code));
    if (!qrUrl) setQrUrl(url);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${code}.png`;
    a.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(albumUrl);
    toast({ title: "Copied!", description: "Album link copied to clipboard." });
  };

  return (
    <div
      className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3"
      data-testid={`album-row-${code}`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Name + Link */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary/60 shrink-0" />
            <span className="font-mono text-sm font-semibold text-white truncate">{code}</span>
            {hasPassword ? (
              <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full shrink-0">
                Protected
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-widest bg-white/5 text-white/30 border border-white/10 px-2 py-0.5 rounded-full shrink-0">
                Public
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] text-white/30 truncate">{albumUrl}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs text-white/50 hover:text-primary border border-white/10 hover:border-primary/30"
            onClick={handleShowQr}
            data-testid={`button-qr-${code}`}
          >
            <QrCode className="w-3.5 h-3.5" />
            {showQr ? "Hide QR" : "QR Code"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs text-white/50 hover:text-primary border border-white/10 hover:border-primary/30"
            onClick={handleDownloadQr}
            data-testid={`button-download-qr-${code}`}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs text-white/50 hover:text-primary border border-white/10 hover:border-primary/30"
            onClick={handleCopyLink}
            data-testid={`button-copy-${code}`}
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Link
          </Button>
          <a
            href={albumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-primary border border-white/10 hover:border-primary/30 rounded-md px-3 py-1.5 transition-colors"
            data-testid={`link-open-${code}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </a>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs text-white/50 hover:text-yellow-400 border border-white/10 hover:border-yellow-400/30"
            onClick={() => setEditingPwd((v) => !v)}
            data-testid={`button-setpwd-${code}`}
          >
            <Lock className="w-3.5 h-3.5" />
            {hasPassword ? "Change" : "Set Password"}
          </Button>
          {hasPassword && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs text-white/50 hover:text-red-400 border border-white/10 hover:border-red-400/30"
              onClick={() => removePasswordMutation.mutate(code)}
              disabled={removePasswordMutation.isPending}
              data-testid={`button-removepwd-${code}`}
            >
              <Unlock className="w-3.5 h-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Password display */}
      {hasPassword && !editingPwd && (
        <div className="flex items-center gap-2 text-xs text-white/40 pl-6">
          <Lock className="w-3 h-3 text-primary/40" />
          <span className="font-mono">
            {showPwd ? passwords[code] : "•".repeat(passwords[code].length)}
          </span>
          <button
            onClick={() => setShowPwd((v) => !v)}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Password edit form */}
      {editingPwd && (
        <div className="flex items-center gap-2 pl-6">
          <Input
            value={pwdInput}
            onChange={(e) => setPwdInput(e.target.value)}
            placeholder="Enter new password"
            className="h-8 text-sm bg-black/40 border-white/10 focus:border-primary/50 max-w-xs"
            data-testid={`input-pwd-${code}`}
          />
          <Button
            size="sm"
            className="h-8 text-xs bg-gradient-to-r from-[#B38D2F] to-[#D4AF37] text-black font-semibold hover:opacity-90"
            disabled={!pwdInput.trim() || setPasswordMutation.isPending}
            onClick={() => setPasswordMutation.mutate({ code, password: pwdInput.trim() })}
            data-testid={`button-savepwd-${code}`}
          >
            {setPasswordMutation.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-white/40 hover:text-white"
            onClick={() => { setEditingPwd(false); setPwdInput(""); }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* QR code display */}
      {showQr && qrUrl && (
        <div className="pl-6 pt-1">
          <div className="inline-block p-2 rounded-lg bg-[#0a0a0a] border border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
            <img src={qrUrl} alt={`QR for ${code}`} className="w-32 h-32 block" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("messages");

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

  const {
    data: r2Albums,
    isLoading: albumsLoading,
    refetch: refetchAlbums,
  } = useQuery<string[]>({
    queryKey: ["/api/admin/albums"],
    enabled: activeTab === "albums",
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

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setLocation("/admin");
  };

  const allAlbumCodes = Array.from(
    new Set([
      ...(r2Albums || []),
      ...Object.keys(albumPasswords || {}),
    ])
  ).sort();

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
          <TabsContent value="albums" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl">Album Manager</h2>
                <p className="text-white/40 text-xs uppercase tracking-widest mt-1">
                  Albums auto-detected from Cloudflare R2
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-white/10 hover:border-primary/40"
                onClick={() => { refetchAlbums(); refetchPasswords(); }}
                data-testid="button-refresh-albums"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-serif text-primary">{allAlbumCodes.length}</p>
                <p className="text-[11px] uppercase tracking-widest text-white/40 mt-1">Total Albums</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-serif text-primary">{Object.keys(albumPasswords || {}).length}</p>
                <p className="text-[11px] uppercase tracking-widest text-white/40 mt-1">Protected</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-serif text-primary">
                  {allAlbumCodes.length - Object.keys(albumPasswords || {}).length}
                </p>
                <p className="text-[11px] uppercase tracking-widest text-white/40 mt-1">Public</p>
              </div>
            </div>

            {/* Albums list */}
            {albumsLoading ? (
              <div className="text-center py-16 text-white/30">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
                <p className="text-sm uppercase tracking-widest">Scanning R2 bucket…</p>
              </div>
            ) : allAlbumCodes.length === 0 ? (
              <div className="text-center py-16 text-white/20 border border-white/5 rounded-xl">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm uppercase tracking-widest">No albums found in R2 bucket</p>
                <p className="text-xs mt-2 text-white/20">Upload folders to your R2 bucket to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allAlbumCodes.map((code) => (
                  <AlbumRow
                    key={code}
                    code={code}
                    passwords={albumPasswords || {}}
                    onPasswordChange={refetchPasswords}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Shield,
  Key,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  id: string;
  username: string | null;
  nama_lengkap: string | null;
  unit_kerja_id: string | null;
  unit_kerja?: {
    nama_unit_kerja: string;
  };
}

interface UnitKerja {
  id: string;
  nama_unit_kerja: string;
}

const Settings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [unitKerja, setUnitKerja] = useState<UnitKerja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    nama_lengkap: "",
    unit_kerja_id: "",
  });

  useEffect(() => {
    checkAuth();
    fetchProfile();
    fetchUnitKerja();
    loadApiKey();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          unit_kerja:unit_kerja_id(nama_unit_kerja)
        `,
        )
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        username: data.username || "",
        nama_lengkap: data.nama_lengkap || "",
        unit_kerja_id: data.unit_kerja_id || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Gagal memuat profil pengguna",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnitKerja = async () => {
    try {
      const { data, error } = await supabase
        .from("unit_kerja")
        .select("*")
        .order("nama_unit_kerja");

      if (error) throw error;
      setUnitKerja(data || []);
    } catch (error) {
      console.error("Error fetching unit kerja:", error);
    }
  };

  const loadApiKey = () => {
    const savedApiKey = localStorage.getItem("deepseek_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Tidak ada session aktif");

      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          nama_lengkap: formData.nama_lengkap,
          unit_kerja_id: formData.unit_kerja_id || null,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui",
      });

      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui profil",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApiKeySave = () => {
    localStorage.setItem("deepseek_api_key", apiKey);
    toast({
      title: "Berhasil",
      description: "API Key Deepseek berhasil disimpan",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Pengaturan</h1>
                <p className="text-sm text-muted-foreground">
                  Konfigurasi sistem dan profil pengguna
                </p>
              </div>
            </div>
            <SettingsIcon className="h-8 w-8 text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profil Pengguna
              </CardTitle>
              <CardDescription>
                Kelola informasi profil dan preferensi akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Username unik"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                    <Input
                      id="nama_lengkap"
                      type="text"
                      placeholder="Nama lengkap sesuai identitas"
                      value={formData.nama_lengkap}
                      onChange={(e) =>
                        handleInputChange("nama_lengkap", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_kerja">Unit Kerja</Label>
                  <Select
                    value={formData.unit_kerja_id}
                    onValueChange={(value) =>
                      handleInputChange("unit_kerja_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada unit kerja</SelectItem>
                      {unitKerja.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.nama_unit_kerja}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profile?.id ? "Email dari Supabase Auth" : ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email tidak dapat diubah melalui halaman ini
                  </p>
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Profil
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Konfigurasi API
              </CardTitle>
              <CardDescription>
                Pengaturan integrasi dengan layanan eksternal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deepseek_key">API Key Deepseek</Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="deepseek_key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-your-deepseek-api-key-here"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button onClick={handleApiKeySave} variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  API Key untuk menggunakan fitur analisis AI otomatis. Dapatkan
                  dari{" "}
                  <a
                    href="https://platform.deepseek.com/api_keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Deepseek Platform
                  </a>
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Status Integrasi</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Supabase Database</div>
                      <div className="text-sm text-muted-foreground">
                        Backend database dan autentikasi
                      </div>
                    </div>
                    <Badge variant="default">Aktif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Deepseek AI</div>
                      <div className="text-sm text-muted-foreground">
                        Analisis AI untuk evaluasi
                      </div>
                    </div>
                    <Badge variant={apiKey ? "default" : "secondary"}>
                      {apiKey ? "Terkonfigurasi" : "Tidak Terkonfigurasi"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Informasi Sistem
              </CardTitle>
              <CardDescription>
                Informasi tentang aplikasi dan versi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Versi Aplikasi</Label>
                  <div className="font-mono text-sm">v1.0.0</div>
                </div>
                <div className="space-y-2">
                  <Label>Framework</Label>
                  <div className="font-mono text-sm">React 18 + TypeScript</div>
                </div>
                <div className="space-y-2">
                  <Label>Backend</Label>
                  <div className="font-mono text-sm">Supabase PostgreSQL</div>
                </div>
                <div className="space-y-2">
                  <Label>UI Library</Label>
                  <div className="font-mono text-sm">
                    Shadcn/ui + Tailwind CSS
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label>Tentang Aplikasi</Label>
                <p className="text-sm text-muted-foreground">
                  Aplikasi Penilaian dan Eliminasi ASN Kementerian
                  Ketenagakerjaan untuk Anugerah ASN Teladan Tahun 2025.
                  Aplikasi ini mendukung proses evaluasi komprehensif dengan
                  teknologi AI untuk mengidentifikasi ASN terbaik.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;

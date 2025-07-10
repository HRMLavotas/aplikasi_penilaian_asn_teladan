import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  Settings,
  LogOut,
  UserPlus,
  FileText,
  BarChart3,
  Shield,
} from "lucide-react";
import WorkflowTracker from "@/components/WorkflowTracker";

interface DashboardStats {
  totalPegawai: number;
  evaluasiSelesai: number;
  rataSkor: number | null;
  asnTeladan: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPegawai: 0,
    evaluasiSelesai: 0,
    rataSkor: null,
    asnTeladan: 0,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      // Get total pegawai
      const { count: totalPegawai } = await supabase
        .from("pegawai")
        .select("*", { count: "exact", head: true });

      // Get evaluations for current year
      const currentYear = new Date().getFullYear();
      const { data: evaluations } = await supabase
        .from("penilaian")
        .select("pegawai_id, persentase_akhir")
        .eq("tahun_penilaian", currentYear);

      // Calculate stats
      const evaluasiSelesai = evaluations?.length || 0;
      const rataSkor =
        evaluations && evaluations.length > 0
          ? evaluations.reduce(
              (sum, evaluation) => sum + (evaluation.persentase_akhir || 0),
              0,
            ) / evaluations.length
          : null;
      const asnTeladan =
        evaluations?.filter(
          (evaluation) => (evaluation.persentase_akhir || 0) >= 85,
        ).length || 0;

      setStats({
        totalPegawai: totalPegawai || 0,
        evaluasiSelesai,
        rataSkor,
        asnTeladan,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/auth");
      } else {
        await fetchStats();
      }
      setIsLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchStats();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Gagal logout. Silakan coba lagi.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout Berhasil",
        description: "Anda telah berhasil keluar dari sistem.",
      });
      navigate("/auth");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Data Pegawai",
      description: "Kelola data pegawai ASN",
      icon: Users,
      href: "/pegawai",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Tambah Pegawai",
      description: "Daftarkan pegawai baru",
      icon: UserPlus,
      href: "/pegawai/tambah",
      color: "bg-green-500/10 text-green-600",
    },
    {
      title: "Evaluasi Pegawai",
      description: "Lakukan penilaian pegawai",
      icon: ClipboardCheck,
      href: "/evaluasi",
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      title: "Laporan Analisis",
      description: "Lihat hasil analisis dan laporan",
      icon: BarChart3,
      href: "/laporan",
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Ranking ASN",
      description: "Peringkat pegawai teladan",
      icon: TrendingUp,
      href: "/ranking",
      color: "bg-yellow-500/10 text-yellow-600",
    },
    {
      title: "Pengaturan",
      description: "Konfigurasi sistem",
      icon: Settings,
      href: "/settings",
      color: "bg-gray-500/10 text-gray-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">ASN Insight Hub</h1>
                <p className="text-sm text-muted-foreground">
                  Sistem Evaluasi ASN
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {user?.user_metadata?.nama_lengkap || user?.email}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {user?.user_metadata?.username || "User"}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Selamat datang di sistem evaluasi dan eliminasi ASN. Pilih menu di
            bawah untuk memulai.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pegawai</CardDescription>
              <CardTitle className="text-2xl">{stats.totalPegawai}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                Terdaftar
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Evaluasi Selesai</CardDescription>
              <CardTitle className="text-2xl">
                {stats.evaluasiSelesai}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <ClipboardCheck className="h-4 w-4 mr-1" />
                Tahun {new Date().getFullYear()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rata-rata Skor</CardDescription>
              <CardTitle className="text-2xl">
                {stats.rataSkor ? `${stats.rataSkor.toFixed(1)}%` : "-"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4 mr-1" />
                {stats.evaluasiSelesai > 0 ? "Rata-rata" : "Belum Ada Data"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ASN Teladan</CardDescription>
              <CardTitle className="text-2xl">{stats.asnTeladan}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 mr-1" />
                Skor ≥85%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Card
              key={item.href}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate(item.href)}
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${item.color} group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada aktivitas terbaru</p>
              <p className="text-sm">
                Mulai dengan menambahkan data pegawai atau melakukan evaluasi
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;

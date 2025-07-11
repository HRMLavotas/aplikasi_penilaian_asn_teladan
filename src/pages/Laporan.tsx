import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Users,
  Award,
  Calendar,
} from "lucide-react";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReportData {
  totalPegawai: number;
  totalEvaluasi: number;
  rataRataSkor: number;
  distribusiSkor: {
    sangat_baik: number;
    baik: number;
    cukup: number;
    kurang: number;
  };
  topPerformers: Array<{
    nama: string;
    nip: string;
    jabatan: string;
    unit_kerja: string;
    skor: number;
  }>;
  unitKerjaStats: Array<{
    nama_unit: string;
    total_pegawai: number;
    rata_skor: number;
    top_performer: number;
  }>;
}

const Laporan = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchReportData();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchReportData = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Get total pegawai
      const { count: totalPegawai } = await supabase
        .from("pegawai")
        .select("*", { count: "exact", head: true });

      // Get evaluations with pegawai data
      const { data: evaluations } = await supabase
        .from("penilaian")
        .select(
          `
          persentase_akhir,
          pegawai:pegawai_id(
            nama,
            nip, 
            jabatan,
            unit_kerja:unit_kerja_id(nama_unit_kerja)
          )
        `,
        )
        .eq("tahun_penilaian", currentYear);

      if (!evaluations) {
        setReportData({
          totalPegawai: totalPegawai || 0,
          totalEvaluasi: 0,
          rataRataSkor: 0,
          distribusiSkor: { sangat_baik: 0, baik: 0, cukup: 0, kurang: 0 },
          topPerformers: [],
          unitKerjaStats: [],
        });
        return;
      }

      // Calculate statistics
      const totalEvaluasi = evaluations.length;
      const rataRataSkor =
        evaluations.reduce((sum, e) => sum + (e.persentase_akhir || 0), 0) /
        totalEvaluasi;

      // Score distribution
      const distribusiSkor = {
        sangat_baik: evaluations.filter((e) => (e.persentase_akhir || 0) >= 85)
          .length,
        baik: evaluations.filter(
          (e) =>
            (e.persentase_akhir || 0) >= 70 && (e.persentase_akhir || 0) < 85,
        ).length,
        cukup: evaluations.filter(
          (e) =>
            (e.persentase_akhir || 0) >= 55 && (e.persentase_akhir || 0) < 70,
        ).length,
        kurang: evaluations.filter((e) => (e.persentase_akhir || 0) < 55)
          .length,
      };

      // Top performers
      const topPerformers = evaluations
        .filter((e) => e.pegawai && e.persentase_akhir)
        .sort((a, b) => (b.persentase_akhir || 0) - (a.persentase_akhir || 0))
        .slice(0, 10)
        .map((e) => ({
          nama: (e.pegawai as any)?.nama || "",
          nip: (e.pegawai as any)?.nip || "",
          jabatan: (e.pegawai as any)?.jabatan || "",
          unit_kerja: (e.pegawai as any)?.unit_kerja?.nama_unit_kerja || "",
          skor: e.persentase_akhir || 0,
        }));

      // Unit kerja statistics
      const unitStats = new Map();
      evaluations.forEach((e) => {
        if (e.pegawai) {
          const unitName =
            (e.pegawai as any)?.unit_kerja?.nama_unit_kerja || "Unknown";
          if (!unitStats.has(unitName)) {
            unitStats.set(unitName, { scores: [], count: 0 });
          }
          const stats = unitStats.get(unitName);
          stats.scores.push(e.persentase_akhir || 0);
          stats.count++;
        }
      });

      const unitKerjaStats = Array.from(unitStats.entries()).map(
        ([nama_unit, data]) => ({
          nama_unit,
          total_pegawai: (data as any).count,
          rata_skor:
            (data as any).scores.reduce(
              (sum: number, score: number) => sum + score,
              0,
            ) / (data as any).count,
          top_performer: (data as any).scores.filter(
            (score: number) => score >= 85,
          ).length,
        }),
      );

      setReportData({
        totalPegawai: totalPegawai || 0,
        totalEvaluasi,
        rataRataSkor,
        distribusiSkor,
        topPerformers,
        unitKerjaStats,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportText = `
LAPORAN EVALUASI ASN TELADAN ${new Date().getFullYear()}
=========================================

RINGKASAN EVALUASI:
- Total Pegawai Terdaftar: ${reportData.totalPegawai}
- Total Evaluasi Selesai: ${reportData.totalEvaluasi}
- Rata-rata Skor: ${reportData.rataRataSkor.toFixed(1)}%

DISTRIBUSI SKOR:
- Sangat Baik (≥85%): ${reportData.distribusiSkor.sangat_baik} pegawai
- Baik (70-84%): ${reportData.distribusiSkor.baik} pegawai  
- Cukup (55-69%): ${reportData.distribusiSkor.cukup} pegawai
- Kurang (<55%): ${reportData.distribusiSkor.kurang} pegawai

TOP PERFORMERS:
${reportData.topPerformers
  .map((p, i) => `${i + 1}. ${p.nama} (${p.nip}) - ${p.skor.toFixed(1)}%`)
  .join("\n")}

STATISTIK PER UNIT KERJA:
${reportData.unitKerjaStats
  .map(
    (u) =>
      `${u.nama_unit}: ${u.total_pegawai} pegawai, rata-rata ${u.rata_skor.toFixed(1)}%, ${u.top_performer} teladan`,
  )
  .join("\n")}

Generated: ${new Date().toLocaleString("id-ID")}
    `;

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_ASN_Teladan_${new Date().getFullYear()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Berhasil",
      description: "Laporan berhasil diekspor",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="font-semibold mb-2">Gagal memuat data laporan</h3>
          <Button onClick={() => navigate("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>
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
                <h1 className="text-2xl font-bold">Laporan Analisis</h1>
                <p className="text-sm text-muted-foreground">
                  Laporan evaluasi ASN Teladan {new Date().getFullYear()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={exportReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Laporan
              </Button>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pegawai</CardDescription>
              <CardTitle className="text-2xl">
                {reportData.totalPegawai}
              </CardTitle>
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
                {reportData.totalEvaluasi}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mr-1" />
                Tahun {new Date().getFullYear()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rata-rata Skor</CardDescription>
              <CardTitle className="text-2xl">
                {reportData.totalEvaluasi > 0
                  ? `${reportData.rataRataSkor.toFixed(1)}%`
                  : "-"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 mr-1" />
                Keseluruhan
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ASN Teladan</CardDescription>
              <CardTitle className="text-2xl">
                {reportData.distribusiSkor.sangat_baik}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Award className="h-4 w-4 mr-1" />
                Skor ≥85%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Score Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Distribusi Skor Evaluasi</CardTitle>
            <CardDescription>
              Sebaran kategori penilaian pegawai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {reportData.distribusiSkor.sangat_baik}
                </div>
                <div className="text-sm font-medium">Sangat Baik</div>
                <div className="text-xs text-muted-foreground">≥85%</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {reportData.distribusiSkor.baik}
                </div>
                <div className="text-sm font-medium">Baik</div>
                <div className="text-xs text-muted-foreground">70-84%</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border">
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {reportData.distribusiSkor.cukup}
                </div>
                <div className="text-sm font-medium">Cukup</div>
                <div className="text-xs text-muted-foreground">55-69%</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {reportData.distribusiSkor.kurang}
                </div>
                <div className="text-sm font-medium">Kurang</div>
                <div className="text-xs text-muted-foreground">&lt;55%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Performers</CardTitle>
              <CardDescription>Pegawai dengan skor tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.topPerformers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Belum ada data evaluasi
                </div>
              ) : (
                <div className="space-y-3">
                  {reportData.topPerformers.map((performer, index) => (
                    <div
                      key={performer.nip}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                  ? "bg-amber-600"
                                  : "bg-blue-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{performer.nama}</div>
                          <div className="text-sm text-muted-foreground">
                            {performer.jabatan}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {performer.skor.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unit Kerja Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistik per Unit Kerja</CardTitle>
              <CardDescription>Performa berdasarkan unit kerja</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.unitKerjaStats.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Belum ada data evaluasi
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit Kerja</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Rata-rata</TableHead>
                        <TableHead className="text-center">Teladan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.unitKerjaStats.map((unit) => (
                        <TableRow key={unit.nama_unit}>
                          <TableCell className="font-medium max-w-48 truncate">
                            {unit.nama_unit}
                          </TableCell>
                          <TableCell className="text-center">
                            {unit.total_pegawai}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {unit.rata_skor.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                unit.top_performer > 0 ? "default" : "secondary"
                              }
                            >
                              {unit.top_performer}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Laporan dihasilkan: {new Date().toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                Sistem Evaluasi ASN Teladan - Kementerian Ketenagakerjaan RI
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Laporan;

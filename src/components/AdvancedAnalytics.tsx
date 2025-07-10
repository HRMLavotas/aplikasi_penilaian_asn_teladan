import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Target,
  Zap,
  Brain,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsData {
  overview: {
    totalPegawai: number;
    avgScore: number;
    topPerformers: number;
    improvementRate: number;
  };
  scoreDistribution: {
    excellent: number; // ≥90
    good: number; // 80-89
    fair: number; // 70-79
    poor: number; // <70
  };
  aspectAnalysis: Array<{
    aspect: string;
    avgScore: number;
    trend: "up" | "down" | "stable";
  }>;
  unitPerformance: Array<{
    unitName: string;
    avgScore: number;
    totalEmployees: number;
    topPerformers: number;
  }>;
  timeSeriesData: Array<{
    month: string;
    evaluations: number;
    avgScore: number;
  }>;
}

const AdvancedAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("2025");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const currentYear = parseInt(selectedPeriod);

      // Get evaluations with detailed data
      const { data: evaluations } = await supabase
        .from("penilaian")
        .select(
          `
          *,
          pegawai:pegawai_id(
            nama,
            unit_kerja:unit_kerja_id(nama_unit_kerja)
          )
        `,
        )
        .eq("tahun_penilaian", currentYear);

      if (!evaluations || evaluations.length === 0) {
        setAnalytics({
          overview: {
            totalPegawai: 0,
            avgScore: 0,
            topPerformers: 0,
            improvementRate: 0,
          },
          scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
          aspectAnalysis: [],
          unitPerformance: [],
          timeSeriesData: [],
        });
        return;
      }

      // Overview calculations
      const totalPegawai = evaluations.length;
      const avgScore =
        evaluations.reduce((sum, e) => sum + (e.persentase_akhir || 0), 0) /
        totalPegawai;
      const topPerformers = evaluations.filter(
        (e) => (e.persentase_akhir || 0) >= 85,
      ).length;
      const improvementRate = 12.5; // Mock data - would calculate from historical data

      // Score distribution
      const scoreDistribution = {
        excellent: evaluations.filter((e) => (e.persentase_akhir || 0) >= 90)
          .length,
        good: evaluations.filter(
          (e) =>
            (e.persentase_akhir || 0) >= 80 && (e.persentase_akhir || 0) < 90,
        ).length,
        fair: evaluations.filter(
          (e) =>
            (e.persentase_akhir || 0) >= 70 && (e.persentase_akhir || 0) < 80,
        ).length,
        poor: evaluations.filter((e) => (e.persentase_akhir || 0) < 70).length,
      };

      // Aspect analysis
      const aspects = [
        { key: "kinerja_perilaku_score", name: "Kinerja & Perilaku" },
        { key: "inovasi_dampak_score", name: "Inovasi & Dampak" },
        { key: "prestasi_score", name: "Prestasi" },
        { key: "inspiratif_score", name: "Inspiratif" },
        { key: "komunikasi_score", name: "Komunikasi" },
        { key: "kerjasama_kolaborasi_score", name: "Kerjasama" },
        { key: "leadership_score", name: "Leadership" },
        { key: "rekam_jejak_score", name: "Rekam Jejak" },
        { key: "integritas_moralitas_score", name: "Integritas" },
      ];

      const aspectAnalysis = aspects.map((aspect) => {
        const scores = evaluations.map((e) => (e as any)[aspect.key] || 0);
        const avgScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return {
          aspect: aspect.name,
          avgScore,
          trend: "stable" as const, // Mock - would calculate from historical data
        };
      });

      // Unit performance
      const unitStats = new Map();
      evaluations.forEach((e) => {
        const unitName =
          (e.pegawai as any)?.unit_kerja?.nama_unit_kerja || "Unknown";
        if (!unitStats.has(unitName)) {
          unitStats.set(unitName, { scores: [], count: 0, topCount: 0 });
        }
        const stats = unitStats.get(unitName);
        stats.scores.push(e.persentase_akhir || 0);
        stats.count++;
        if ((e.persentase_akhir || 0) >= 85) stats.topCount++;
      });

      const unitPerformance = Array.from(unitStats.entries()).map(
        ([unitName, data]) => ({
          unitName,
          totalEmployees: (data as any).count,
          avgScore:
            (data as any).scores.reduce(
              (sum: number, score: number) => sum + score,
              0,
            ) / (data as any).count,
          topPerformers: (data as any).topCount,
        }),
      );

      // Mock time series data
      const timeSeriesData = [
        {
          month: "Jan",
          evaluations: Math.floor(totalPegawai * 0.1),
          avgScore: avgScore - 2,
        },
        {
          month: "Feb",
          evaluations: Math.floor(totalPegawai * 0.25),
          avgScore: avgScore - 1,
        },
        {
          month: "Mar",
          evaluations: Math.floor(totalPegawai * 0.45),
          avgScore: avgScore,
        },
        {
          month: "Apr",
          evaluations: Math.floor(totalPegawai * 0.7),
          avgScore: avgScore + 1,
        },
        { month: "May", evaluations: totalPegawai, avgScore: avgScore + 1.5 },
      ];

      setAnalytics({
        overview: { totalPegawai, avgScore, topPerformers, improvementRate },
        scoreDistribution,
        aspectAnalysis,
        unitPerformance,
        timeSeriesData,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      period: selectedPeriod,
      overview: analytics.overview,
      scoreDistribution: analytics.scoreDistribution,
      topAspects: analytics.aspectAnalysis
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 3),
      topUnits: analytics.unitPerformance
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_report_${selectedPeriod}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Insights</h2>
          <p className="text-muted-foreground">
            Analisis mendalam performa evaluasi ASN
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {analytics.overview.totalPegawai}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Evaluasi
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {analytics.overview.avgScore.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Rata-rata Skor
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">
                  {analytics.overview.topPerformers}
                </div>
                <div className="text-sm text-muted-foreground">
                  Top Performers
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  +{analytics.overview.improvementRate}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Improvement Rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Distribusi Skor
          </CardTitle>
          <CardDescription>Sebaran tingkat performa pegawai</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <div className="text-3xl font-bold text-green-600">
                {analytics.scoreDistribution.excellent}
              </div>
              <div className="text-sm font-medium">Excellent</div>
              <div className="text-xs text-muted-foreground">≥90%</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.scoreDistribution.good}
              </div>
              <div className="text-sm font-medium">Good</div>
              <div className="text-xs text-muted-foreground">80-89%</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border">
              <div className="text-3xl font-bold text-yellow-600">
                {analytics.scoreDistribution.fair}
              </div>
              <div className="text-sm font-medium">Fair</div>
              <div className="text-xs text-muted-foreground">70-79%</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border">
              <div className="text-3xl font-bold text-red-600">
                {analytics.scoreDistribution.poor}
              </div>
              <div className="text-sm font-medium">Needs Improvement</div>
              <div className="text-xs text-muted-foreground">&lt;70%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aspect Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Analisis per Aspek
            </CardTitle>
            <CardDescription>
              Performa rata-rata setiap aspek penilaian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.aspectAnalysis
                .sort((a, b) => b.avgScore - a.avgScore)
                .map((aspect, index) => (
                  <div
                    key={aspect.aspect}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index < 3
                            ? "bg-green-100 text-green-800"
                            : index < 6
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium">{aspect.aspect}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        {aspect.avgScore.toFixed(1)}
                      </span>
                      <TrendingUp
                        className={`h-4 w-4 ${
                          aspect.trend === "up"
                            ? "text-green-600"
                            : aspect.trend === "down"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Unit Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Performa Unit Kerja
            </CardTitle>
            <CardDescription>
              Ranking performa berdasarkan unit kerja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.unitPerformance
                .sort((a, b) => b.avgScore - a.avgScore)
                .slice(0, 5)
                .map((unit, index) => (
                  <div key={unit.unitName} className="p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={index < 2 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <span className="font-medium text-sm">
                          {unit.unitName}
                        </span>
                      </div>
                      <span className="font-mono text-lg font-bold">
                        {unit.avgScore.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{unit.totalEmployees} pegawai</span>
                      <span>{unit.topPerformers} top performers</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Rekomendasi Strategis</CardTitle>
          <CardDescription>Saran berdasarkan analisis data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">
                Fokus Pengembangan
              </h3>
              <p className="text-sm text-blue-700">
                Aspek dengan skor terendah perlu mendapat perhatian khusus dalam
                program pengembangan SDM.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">
                Best Practices
              </h3>
              <p className="text-sm text-green-700">
                Unit kerja dengan performa tinggi dapat menjadi model dan mentor
                bagi unit lainnya.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Target Improvement
              </h3>
              <p className="text-sm text-yellow-700">
                Tetapkan target peningkatan 10-15% untuk periode evaluasi
                berikutnya.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  Award,
  Plus,
  FileText,
} from "lucide-react";

interface AssessmentTemplate {
  id: string;
  nama_assessment: string;
  deskripsi: string;
  assessment_type: string;
}

interface Stats {
  totalPegawai: number;
  totalPenilaian: number;
  avgScore: number;
  pendingApproval: number;
}

export default function AssessmentDashboard() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentTemplate | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalPegawai: 0,
    totalPenilaian: 0,
    avgScore: 0,
    pendingApproval: 0,
  });

  useEffect(() => {
    loadData();
  }, [assessmentId]);

  const loadData = async () => {
    if (!assessmentId) return;
    
    try {
      setLoading(true);

      // Load assessment info
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Load stats
      const { count: pegawaiCount } = await supabase
        .from('pegawai')
        .select('*', { count: 'exact', head: true });

      const { data: penilaianData, count: penilaianCount } = await supabase
        .from('penilaian')
        .select('persentase_akhir, verification_status', { count: 'exact' })
        .eq('assessment_template_id', assessmentId);

      const avgScore = penilaianData && penilaianData.length > 0
        ? penilaianData.reduce((sum, p) => sum + (p.persentase_akhir || 0), 0) / penilaianData.length
        : 0;

      const pendingCount = penilaianData?.filter(
        p => p.verification_status === 'pending'
      ).length || 0;

      setStats({
        totalPegawai: pegawaiCount || 0,
        totalPenilaian: penilaianCount || 0,
        avgScore: avgScore,
        pendingApproval: pendingCount,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Assessment tidak ditemukan</h2>
        <Button onClick={() => navigate('/dashboard')}>Kembali ke Portal</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{assessment.nama_assessment}</h1>
        <p className="text-muted-foreground mt-1">{assessment.deskripsi}</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={() => navigate(`/assessment/${assessmentId}/pegawai`)}
          className="h-auto py-4 flex-col"
        >
          <Users className="h-6 w-6 mb-2" />
          <span>Kelola Pegawai</span>
        </Button>
        <Button
          onClick={() => navigate(`/assessment/${assessmentId}/evaluasi`)}
          className="h-auto py-4 flex-col"
        >
          <ClipboardCheck className="h-6 w-6 mb-2" />
          <span>Mulai Evaluasi</span>
        </Button>
        <Button
          onClick={() => navigate(`/assessment/${assessmentId}/ranking`)}
          className="h-auto py-4 flex-col"
        >
          <TrendingUp className="h-6 w-6 mb-2" />
          <span>Lihat Ranking</span>
        </Button>
        <Button
          onClick={() => navigate(`/assessment/${assessmentId}/laporan`)}
          className="h-auto py-4 flex-col"
        >
          <FileText className="h-6 w-6 mb-2" />
          <span>Laporan</span>
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pegawai</CardDescription>
            <CardTitle className="text-3xl">{stats.totalPegawai}</CardTitle>
          </CardHeader>
          <CardContent>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Penilaian</CardDescription>
            <CardTitle className="text-3xl">{stats.totalPenilaian}</CardTitle>
          </CardHeader>
          <CardContent>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rata-rata Skor</CardDescription>
            <CardTitle className="text-3xl">{stats.avgScore.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Approval</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingApproval}</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity or Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Petunjuk Penggunaan</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Tambahkan data pegawai melalui menu <strong>Data Pegawai</strong></li>
            <li>Lakukan evaluasi melalui menu <strong>Evaluasi</strong></li>
            <li>Lihat hasil ranking di menu <strong>Ranking</strong></li>
            <li>Generate laporan di menu <strong>Laporan</strong></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

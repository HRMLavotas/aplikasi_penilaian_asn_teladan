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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Search,
  ClipboardCheck,
  Star,
  TrendingUp,
  Users,
  Award,
  FileText,
  Eye,
  Check,
  X,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStatusJabatanDisplay } from "@/utils/statusJabatan";

interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  status_jabatan: string;
  masa_kerja_tahun: number;
  memiliki_inovasi: boolean;
  memiliki_penghargaan: boolean;
  unit_kerja: {
    nama_unit_kerja: string;
  };
  penilaian: Array<{
    id: string;
    tahun_penilaian: number;
    persentase_akhir: number;
  }>;
}

interface UnitKerja {
  id: string;
  nama_unit_kerja: string;
}

export default function Evaluasi() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [penilaianData, setPenilaianData] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      
      // Check if user is super admin using the database function
      const { data: isSuperAdminData, error } = await supabase.rpc('is_super_admin');
      if (error) throw error;
      setIsSuperAdmin(isSuperAdminData || false);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
      
      // Set default tab to first assessment or ASN Teladan
      if (data && data.length > 0) {
        const asnTeladanAssessment = data.find(a => a.assessment_type === 'asn_teladan');
        setSelectedTab(asnTeladanAssessment?.id || data[0].id);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  };

  const loadPenilaianData = async () => {
    try {
      const { data, error } = await supabase
        .from('penilaian')
        .select(`
          *,
          pegawai (
            id,
            nama,
            nip,
            jabatan,
            unit_kerja_id
          ),
          assessment_templates (
            id,
            nama_assessment,
            assessment_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPenilaianData(data || []);
    } catch (error) {
      console.error('Error loading penilaian data:', error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          loadUserData(),
          loadAssessments(),
          loadPenilaianData()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const getPenilaianByAssessment = (assessmentId: string) => {
    return penilaianData.filter(p => p.assessment_template_id === assessmentId);
  };

  const handleApprove = async (penilaianId: string) => {
    try {
      const { error } = await supabase
        .from('penilaian')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', penilaianId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Penilaian telah disetujui",
      });

      // Reload penilaian data
      loadPenilaianData();
    } catch (error) {
      console.error('Error approving penilaian:', error);
      toast({
        title: "Error",
        description: "Gagal menyetujui penilaian",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (penilaianId: string) => {
    try {
      const { error } = await supabase
        .from('penilaian')
        .update({
          verification_status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', penilaianId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Penilaian telah ditolak",
      });

      // Reload penilaian data
      loadPenilaianData();
    } catch (error) {
      console.error('Error rejecting penilaian:', error);
      toast({
        title: "Error",
        description: "Gagal menolak penilaian",
        variant: "destructive",
      });
    }
  };

  const renderPenilaianTable = (assessmentPenilaian: any[]) => {
    if (assessmentPenilaian.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Belum ada penilaian
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Belum ada penilaian untuk assessment ini
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pegawai
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NIP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jabatan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assessmentPenilaian.map((penilaian) => (
              <tr key={penilaian.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {penilaian.pegawai?.nama}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {penilaian.pegawai?.nip}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {penilaian.pegawai?.jabatan}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {penilaian.persentase_akhir?.toFixed(1) || 0}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    penilaian.verification_status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : penilaian.verification_status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {penilaian.verification_status === 'approved' 
                      ? 'Disetujui'
                      : penilaian.verification_status === 'rejected'
                      ? 'Ditolak'
                      : 'Pending'
                    }
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(penilaian.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/assessment-detail/${penilaian.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                    {isSuperAdmin && penilaian.verification_status !== 'approved' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(penilaian.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(penilaian.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Evaluasi & Approval</h1>
              <p className="mt-1 text-sm text-gray-500">
                Kelola dan setujui hasil penilaian
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              {isSuperAdmin && (
                <Button onClick={() => navigate('/pegawai')}>
                  <Users className="mr-2 h-4 w-4" />
                  Kelola Pegawai
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Penilaian</CardTitle>
            <CardDescription>
              Pilih assessment untuk melihat daftar penilaian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-auto">
                {assessments.map((assessment) => (
                  <TabsTrigger key={assessment.id} value={assessment.id}>
                    {assessment.nama_assessment}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {assessments.map((assessment) => (
                <TabsContent key={assessment.id} value={assessment.id} className="mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {assessment.nama_assessment}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {assessment.deskripsi}
                    </p>
                  </div>
                  {renderPenilaianTable(getPenilaianByAssessment(assessment.id))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
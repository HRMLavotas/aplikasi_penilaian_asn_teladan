import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, FileText, Award, TrendingUp, Plus, Eye, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalPegawai: 0,
    totalPenilaian: 0,
    avgScore: 0,
    pendingApproval: 0
  });
  const [assessments, setAssessments] = useState<any[]>([]);
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');

  const loadUserData = async () => {
    try {
      // First check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // If no session, redirect to auth
        navigate("/auth");
        return;
      }

      // Now we can safely get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      setUser(user);
      
      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      setProfile(profileData);
      
      // Check if user is super admin using RPC
      const { data: isSuperAdminData, error: adminError } = await supabase.rpc('is_super_admin');
      if (!adminError) {
        setIsSuperAdmin(isSuperAdminData || false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // On error, redirect to auth
      navigate("/auth");
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
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  };

  const loadPegawaiList = async () => {
    try {
      const { data, error } = await supabase
        .from('pegawai')
        .select('id, nama, nip, jabatan')
        .order('nama');

      if (error) throw error;
      setPegawaiList(data || []);
    } catch (error) {
      console.error('Error loading pegawai:', error);
    }
  };

  useEffect(() => {
    loadUserData();
    loadAssessments();
    loadPegawaiList();
  }, []);

  const handleStartAssessment = (assessmentId: string, pegawaiId: string) => {
    navigate(`/assessment/${assessmentId}/pegawai/${pegawaiId}`);
  };

  const getAssessmentTypeColor = (type: string) => {
    switch (type) {
      case 'asn_teladan':
        return 'bg-blue-100 text-blue-800';
      case 'flexing':
        return 'bg-green-100 text-green-800';
      case 'custom':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Selamat datang, {profile?.nama_lengkap || user?.email}
              </p>
            </div>
            <div className="flex space-x-3">
              {isSuperAdmin && (
                <>
                  <Button
                    onClick={() => navigate('/assessment-management')}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Kelola Assessment
                  </Button>
                  <Button
                    onClick={() => navigate('/pegawai/tambah')}
                    variant="outline"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Tambah Pegawai
                  </Button>
                </>
              )}
              <Button onClick={() => navigate('/evaluasi')}>
                <FileText className="mr-2 h-4 w-4" />
                ASN Teladan (Legacy)
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Pegawai
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalPegawai}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Penilaian
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalPenilaian}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Rata-rata Skor
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.avgScore.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Approval
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.pendingApproval}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Assessments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Tersedia</CardTitle>
              <CardDescription>
                Pilih assessment yang ingin Anda lakukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {assessment.nama_assessment}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {assessment.deskripsi}
                        </p>
                        <div className="mt-2">
                          <Badge className={getAssessmentTypeColor(assessment.assessment_type)}>
                            {assessment.assessment_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedAssessment(assessment.id)}
                        variant={selectedAssessment === assessment.id ? "default" : "outline"}
                      >
                        {selectedAssessment === assessment.id ? "Dipilih" : "Pilih"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mulai Penilaian</CardTitle>
              <CardDescription>
                Pilih pegawai yang akan dinilai
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedAssessment ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Assessment: {assessments.find(a => a.id === selectedAssessment)?.nama_assessment}
                    </label>
                  </div>
                  <div className="space-y-2">
                    {pegawaiList.map((pegawai) => (
                      <div
                        key={pegawai.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{pegawai.nama}</p>
                          <p className="text-sm text-gray-600">
                            {pegawai.nip} • {pegawai.jabatan}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStartAssessment(selectedAssessment, pegawai.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Nilai
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Pilih Assessment
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Pilih assessment terlebih dahulu untuk melihat daftar pegawai
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
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
      // Filter out ASN Teladan karena akan menggunakan sistem legacy
      const filteredData = (data || []).filter(a => a.assessment_type !== 'asn_teladan');
      setAssessments(filteredData);
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Load pegawai count
      const { count: pegawaiCount } = await supabase
        .from('pegawai')
        .select('*', { count: 'exact', head: true });

      // Load penilaian count and average score
      const { data: penilaianData } = await supabase
        .from('penilaian')
        .select('persentase_akhir, verification_status');

      const totalPenilaian = penilaianData?.length || 0;
      const avgScore = penilaianData && penilaianData.length > 0
        ? penilaianData.reduce((sum, p) => sum + (Number(p.persentase_akhir) || 0), 0) / penilaianData.length
        : 0;
      
      const pendingApproval = penilaianData?.filter(p => p.verification_status === 'pending').length || 0;

      setStats({
        totalPegawai: pegawaiCount || 0,
        totalPenilaian,
        avgScore,
        pendingApproval
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          loadUserData(),
          loadAssessments(),
          loadStats()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const handleAssessmentClick = (assessmentId: string, assessmentType: string) => {
    // If ASN Teladan (legacy), go to old system
    if (assessmentType === 'asn_teladan') {
      navigate('/evaluasi');
    } else {
      // For new assessments, go to their dedicated dashboard
      navigate(`/assessment/${assessmentId}/dashboard`);
    }
  };

  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'asn_teladan':
        return Award;
      case 'flexing':
        return TrendingUp;
      default:
        return FileText;
    }
  };

  const getAssessmentColor = (type: string) => {
    switch (type) {
      case 'asn_teladan':
        return 'from-blue-500 to-blue-600';
      case 'flexing':
        return 'from-green-500 to-green-600';
      case 'custom':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
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

        {/* Assessment Shortcuts */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sistem Assessment</h2>
              <p className="mt-1 text-sm text-gray-500">
                Pilih sistem assessment yang ingin Anda gunakan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment) => {
              const IconComponent = getAssessmentIcon(assessment.assessment_type);
              const gradientColor = getAssessmentColor(assessment.assessment_type);
              
              return (
                <Card 
                  key={assessment.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => handleAssessmentClick(assessment.id, assessment.assessment_type)}
                >
                  <div className={`h-32 bg-gradient-to-br ${gradientColor} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative h-full flex items-center justify-center">
                      <IconComponent className="h-16 w-16 text-white opacity-90 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {assessment.nama_assessment}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {assessment.deskripsi || 'Sistem penilaian komprehensif untuk evaluasi pegawai'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {assessment.assessment_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Button size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        Mulai <Eye className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* ASN Teladan - Sistem Legacy */}
            <Card 
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => handleAssessmentClick('', 'asn_teladan')}
            >
              <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative h-full flex items-center justify-center">
                  <Award className="h-16 w-16 text-white opacity-90 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  ASN Teladan
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  Sistem penilaian ASN Teladan untuk evaluasi pegawai teladan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">ASN TELADAN</Badge>
                  <Button size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                    Mulai <Eye className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, FileText, User, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PenilaianDetail {
  id: string;
  assessment_template_id: string;
  pegawai_id: string;
  penilai_user_id: string;
  tahun_penilaian: number;
  persentase_akhir: number;
  verification_status: string;
  verification_notes: string;
  created_at: string;
  updated_at: string;
  pegawai: {
    nama: string;
    nip: string;
    jabatan: string;
  };
  assessment_templates: {
    nama_assessment: string;
    deskripsi: string;
    assessment_type: string;
  };
}

interface CriteriaDetail {
  id: string;
  criteria_id: string;
  nilai: any;
  catatan: string;
  assessment_criteria: {
    kode_kriteria: string;
    nama_kriteria: string;
    deskripsi: string;
    tipe_input: string;
    bobot: number;
    min_value: number;
    max_value: number;
    options: any;
  };
}

export default function AssessmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [penilaian, setPenilaian] = useState<PenilaianDetail | null>(null);
  const [criteriaDetails, setCriteriaDetails] = useState<CriteriaDetail[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (id) {
      loadPenilaianDetail();
      checkSuperAdmin();
    }
  }, [id]);

  const checkSuperAdmin = async () => {
    try {
      const { data, error } = await supabase.rpc('is_super_admin');
      if (error) throw error;
      setIsSuperAdmin(data);
    } catch (error) {
      console.error('Error checking super admin:', error);
    }
  };

  const loadPenilaianDetail = async () => {
    try {
      setLoading(true);

      // Load penilaian data
      const { data: penilaianData, error: penilaianError } = await supabase
        .from('penilaian')
        .select(`
          *,
          pegawai (
            nama,
            nip,
            jabatan
          ),
          assessment_templates (
            nama_assessment,
            deskripsi,
            assessment_type
          )
        `)
        .eq('id', id)
        .single();

      if (penilaianError) throw penilaianError;
      setPenilaian(penilaianData);

      // Load criteria details
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('penilaian_detail')
        .select(`
          *,
          assessment_criteria (
            kode_kriteria,
            nama_kriteria,
            deskripsi,
            tipe_input,
            bobot,
            min_value,
            max_value,
            options
          )
        `)
        .eq('penilaian_id', id)
        .order('assessment_criteria(urutan)');

      if (criteriaError) throw criteriaError;
      setCriteriaDetails(criteriaData || []);

    } catch (error) {
      console.error('Error loading penilaian detail:', error);
      toast({
        title: "Error",
        description: "Gagal memuat detail penilaian",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('penilaian')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          verification_notes: 'Disetujui oleh admin'
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Penilaian berhasil disetujui",
      });

      loadPenilaianDetail();
    } catch (error) {
      console.error('Error approving penilaian:', error);
      toast({
        title: "Error",
        description: "Gagal menyetujui penilaian",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('penilaian')
        .update({
          verification_status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          verification_notes: 'Ditolak oleh admin'
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Penilaian berhasil ditolak",
      });

      loadPenilaianDetail();
    } catch (error) {
      console.error('Error rejecting penilaian:', error);
      toast({
        title: "Error",
        description: "Gagal menolak penilaian",
        variant: "destructive",
      });
    }
  };

  const renderNilai = (criteria: CriteriaDetail) => {
    const { tipe_input, options } = criteria.assessment_criteria;
    const nilai = criteria.nilai;

    switch (tipe_input) {
      case 'number':
        return <span className="font-medium">{nilai}</span>;
      
      case 'boolean':
        return (
          <Badge variant={nilai ? "default" : "secondary"}>
            {nilai ? "Ya" : "Tidak"}
          </Badge>
        );
      
      case 'select':
        if (options && options.options) {
          const option = options.options.find((opt: any) => opt.value === nilai);
          return <span className="font-medium">{option?.label || nilai}</span>;
        }
        return <span className="font-medium">{nilai}</span>;
      
      case 'text':
        return (
          <div className="max-w-md">
            <p className="text-sm text-gray-600 line-clamp-3">{nilai}</p>
          </div>
        );
      
      case 'file_upload':
        return nilai ? (
          <a 
            href={nilai} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Lihat Dokumen
          </a>
        ) : (
          <span className="text-gray-400">Tidak ada file</span>
        );
      
      default:
        return <span className="font-medium">{nilai}</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      default:
        return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!penilaian) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Data penilaian tidak ditemukan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detail Penilaian</h1>
              <p className="mt-1 text-sm text-gray-500">
                {penilaian.assessment_templates.nama_assessment}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => navigate('/evaluasi')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              {isSuperAdmin && penilaian.verification_status !== 'approved' && (
                <>
                  <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                  <Button onClick={handleReject} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informasi Umum */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Informasi Pegawai
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nama</label>
                  <p className="text-lg font-medium">{penilaian.pegawai.nama}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NIP</label>
                  <p className="font-medium">{penilaian.pegawai.nip}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Jabatan</label>
                  <p className="font-medium">{penilaian.pegawai.jabatan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tahun Penilaian</label>
                  <p className="font-medium">{penilaian.tahun_penilaian}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tanggal Penilaian</label>
                  <p className="font-medium">
                    {new Date(penilaian.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Status Penilaian
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(penilaian.verification_status)}
                  <Badge className={getStatusColor(penilaian.verification_status)}>
                    {getStatusText(penilaian.verification_status)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Skor Akhir</label>
                  <p className="text-2xl font-bold text-blue-600">
                    {penilaian.persentase_akhir?.toFixed(1) || 0}%
                  </p>
                </div>
                {penilaian.verification_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Catatan</label>
                    <p className="text-sm text-gray-600">{penilaian.verification_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detail Kriteria */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detail Penilaian Kriteria</CardTitle>
                <CardDescription>
                  Rincian penilaian untuk setiap kriteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {criteriaDetails.map((criteria) => (
                    <div key={criteria.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {criteria.assessment_criteria.nama_kriteria}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {criteria.assessment_criteria.deskripsi}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm text-gray-500">
                            Bobot: {criteria.assessment_criteria.bobot}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-sm font-medium text-gray-500">Nilai:</label>
                        <div className="mt-1">
                          {renderNilai(criteria)}
                        </div>
                      </div>
                      {criteria.catatan && (
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-500">Catatan:</label>
                          <p className="text-sm text-gray-600 mt-1">{criteria.catatan}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
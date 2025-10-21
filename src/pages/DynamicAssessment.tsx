import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssessmentTemplate {
  id: string;
  nama_assessment: string;
  deskripsi: string;
  assessment_type: string;
  formula_perhitungan: string;
}

interface AssessmentCriteria {
  id: string;
  kode_kriteria: string;
  nama_kriteria: string;
  deskripsi: string;
  tipe_input: 'number' | 'boolean' | 'text' | 'select' | 'file_upload';
  is_required: boolean;
  bobot: number;
  min_value: number;
  max_value: number;
  options: any;
  urutan: number;
}

interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  unit_kerja_id: string;
}

export default function DynamicAssessment() {
  const { assessmentId, pegawaiId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [criteria, setCriteria] = useState<AssessmentCriteria[]>([]);
  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (assessmentId && pegawaiId) {
      loadAssessmentData();
    }
  }, [assessmentId, pegawaiId]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);

      // Load assessment template
      const { data: templateData, error: templateError } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', assessmentId)
        .eq('is_active', true)
        .single();

      if (templateError) throw templateError;
      setTemplate(templateData);

      // Load assessment criteria
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('assessment_criteria')
        .select('*')
        .eq('assessment_template_id', assessmentId)
        .order('urutan');

      if (criteriaError) throw criteriaError;
      setCriteria(criteriaData);

      // Load pegawai data
      const { data: pegawaiData, error: pegawaiError } = await supabase
        .from('pegawai')
        .select('*')
        .eq('id', pegawaiId)
        .single();

      if (pegawaiError) throw pegawaiError;
      setPegawai(pegawaiData);

      // Initialize form data with default values
      const initialFormData: Record<string, any> = {};
      criteriaData.forEach(criterion => {
        switch (criterion.tipe_input) {
          case 'number':
            initialFormData[criterion.id] = criterion.min_value || 0;
            break;
          case 'boolean':
            initialFormData[criterion.id] = false;
            break;
          case 'text':
            initialFormData[criterion.id] = '';
            break;
          case 'select':
            initialFormData[criterion.id] = '';
            break;
          case 'file_upload':
            initialFormData[criterion.id] = '';
            break;
          default:
            initialFormData[criterion.id] = '';
        }
      });
      setFormData(initialFormData);

    } catch (error) {
      console.error('Error loading assessment data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data assessment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (criteriaId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [criteriaId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[criteriaId]) {
      setErrors(prev => ({
        ...prev,
        [criteriaId]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    criteria.forEach(criterion => {
      const value = formData[criterion.id];
      
      if (criterion.is_required) {
        if (criterion.tipe_input === 'boolean') {
          // Boolean tidak perlu validasi required
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[criterion.id] = `${criterion.nama_kriteria} wajib diisi`;
        }
      }

      if (criterion.tipe_input === 'number' && value !== null && value !== '') {
        const numValue = Number(value);
        if (criterion.min_value !== null && numValue < criterion.min_value) {
          newErrors[criterion.id] = `Nilai minimal ${criterion.min_value}`;
        }
        if (criterion.max_value !== null && numValue > criterion.max_value) {
          newErrors[criterion.id] = `Nilai maksimal ${criterion.max_value}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateScore = () => {
    let totalScore = 0;
    let totalBobot = 0;

    criteria.forEach(criterion => {
      const value = formData[criterion.id];
      let score = 0;

      switch (criterion.tipe_input) {
        case 'number':
          score = Number(value) || 0;
          break;
        case 'boolean':
          score = value ? (criterion.max_value || 100) : 0;
          break;
        case 'select':
          // Untuk select, bisa menggunakan mapping dari options
          if (criterion.options && criterion.options.scoring) {
            score = criterion.options.scoring[value] || 0;
          } else {
            score = value ? (criterion.max_value || 100) : 0;
          }
          break;
        default:
          score = value ? (criterion.max_value || 100) : 0;
      }

      totalScore += score * (criterion.bobot || 1);
      totalBobot += (criterion.bobot || 1);
    });

    return totalBobot > 0 ? (totalScore / totalBobot) : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const finalScore = calculateScore();

      // Create penilaian record
      const { data: penilaianData, error: penilaianError } = await supabase
        .from('penilaian')
        .insert({
          assessment_template_id: assessmentId!,
          pegawai_id: pegawaiId!,
          penilai_user_id: user.id,
          tahun_penilaian: new Date().getFullYear(),
          persentase_akhir: finalScore,
          // Set default values for required fields (legacy ASN Teladan fields)
          inovasi_dampak_score: 0,
          inspiratif_score: 0,
          integritas_moralitas_score: 0,
          kerjasama_kolaborasi_score: 0,
          kinerja_perilaku_score: 0,
          komunikasi_score: 0,
          leadership_score: 0,
          prestasi_score: 0,
          rekam_jejak_score: 0,
          skp_2_tahun_terakhir_baik: false,
          skp_peningkatan_prestasi: false
        })
        .select()
        .single();

      if (penilaianError) throw penilaianError;

      // Create penilaian_detail records
      const detailInserts = criteria.map(criterion => ({
        penilaian_id: penilaianData.id,
        criteria_id: criterion.id,
        nilai: formData[criterion.id],
        catatan: null
      }));

      const { error: detailError } = await supabase
        .from('penilaian_detail')
        .insert(detailInserts);

      if (detailError) throw detailError;

      toast({
        title: "Berhasil",
        description: "Penilaian berhasil disimpan",
      });

      navigate('/dashboard');

    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan penilaian",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderCriteriaInput = (criterion: AssessmentCriteria) => {
    const value = formData[criterion.id];
    const error = errors[criterion.id];

    switch (criterion.tipe_input) {
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={criterion.id}>
              {criterion.nama_kriteria}
              {criterion.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={criterion.id}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(criterion.id, e.target.value)}
              min={criterion.min_value || undefined}
              max={criterion.max_value || undefined}
              className={error ? 'border-red-500' : ''}
            />
            {criterion.deskripsi && (
              <p className="text-sm text-gray-600">{criterion.deskripsi}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={criterion.id}
                checked={value}
                onCheckedChange={(checked) => handleInputChange(criterion.id, checked)}
              />
              <Label htmlFor={criterion.id}>
                {criterion.nama_kriteria}
                {criterion.is_required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {criterion.deskripsi && (
              <p className="text-sm text-gray-600">{criterion.deskripsi}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={criterion.id}>
              {criterion.nama_kriteria}
              {criterion.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={criterion.id}
              value={value}
              onChange={(e) => handleInputChange(criterion.id, e.target.value)}
              className={error ? 'border-red-500' : ''}
              rows={3}
            />
            {criterion.deskripsi && (
              <p className="text-sm text-gray-600">{criterion.deskripsi}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'select':
        const options = criterion.options?.options || [];
        return (
          <div className="space-y-2">
            <Label htmlFor={criterion.id}>
              {criterion.nama_kriteria}
              {criterion.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleInputChange(criterion.id, val)}>
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih opsi..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option: any, index: number) => (
                  <SelectItem key={index} value={option.value || option}>
                    {option.label || option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {criterion.deskripsi && (
              <p className="text-sm text-gray-600">{criterion.deskripsi}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'file_upload':
        return (
          <div className="space-y-2">
            <Label htmlFor={criterion.id}>
              {criterion.nama_kriteria}
              {criterion.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id={criterion.id}
                type="url"
                value={value}
                onChange={(e) => handleInputChange(criterion.id, e.target.value)}
                placeholder="Masukkan URL file/dokumen"
                className={error ? 'border-red-500' : ''}
              />
              <Button type="button" variant="outline" size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {criterion.deskripsi && (
              <p className="text-sm text-gray-600">{criterion.deskripsi}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!template || !pegawai) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Data assessment atau pegawai tidak ditemukan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{template.nama_assessment}</h1>
        <p className="text-gray-600 mt-2">{template.deskripsi}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informasi Pegawai</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nama Pegawai</Label>
              <p className="font-medium">{pegawai.nama}</p>
            </div>
            <div>
              <Label>NIP</Label>
              <p className="font-medium">{pegawai.nip}</p>
            </div>
            <div>
              <Label>Jabatan</Label>
              <p className="font-medium">{pegawai.jabatan}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Form Penilaian</CardTitle>
            <CardDescription>
              Lengkapi semua kriteria penilaian di bawah ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="border-b pb-4 last:border-b-0">
                {renderCriteriaInput(criterion)}
              </div>
            ))}

            <div className="flex justify-between items-center pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Penilaian
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
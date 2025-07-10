import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  User,
  Award,
  TrendingUp,
  Brain,
  MessageSquare,
  Users,
  Crown,
  Shield,
  Heart,
  Star,
} from "lucide-react";

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
}

interface PenilaianData {
  skp_2_tahun_terakhir_baik: boolean;
  skp_peningkatan_prestasi: boolean;
  // Kriteria Integritas
  bebas_temuan: boolean;
  tidak_hukuman_disiplin: boolean;
  tidak_pemeriksaan_disiplin: boolean;
  // Prestasi & Inovasi
  memiliki_inovasi: boolean;
  bukti_inovasi: string;
  memiliki_penghargaan: boolean;
  bukti_penghargaan: string;
  // Core Values ASN BerAKHLAK
  berorientasi_pelayanan_score: number;
  akuntabel_score: number;
  kompeten_score: number;
  harmonis_score: number;
  loyal_score: number;
  adaptif_score: number;
  kolaboratif_score: number;
  // Analisis AI
  analisis_ai_pro: string;
  analisis_ai_kontra: string;
  analisis_ai_kelebihan: string;
  analisis_ai_kekurangan: string;
}

const FormEvaluasi = () => {
  const { id } = useParams<{ id: string }>();
  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [penilaian, setPenilaian] = useState<PenilaianData>({
    skp_2_tahun_terakhir_baik: false,
    skp_peningkatan_prestasi: false,
    // Kriteria Integritas
    bebas_temuan: false,
    tidak_hukuman_disiplin: false,
    tidak_pemeriksaan_disiplin: false,
    // Prestasi & Inovasi
    memiliki_inovasi: false,
    bukti_inovasi: "",
    memiliki_penghargaan: false,
    bukti_penghargaan: "",
    // Core Values ASN BerAKHLAK
    berorientasi_pelayanan_score: 1,
    akuntabel_score: 1,
    kompeten_score: 1,
    harmonis_score: 1,
    loyal_score: 1,
    adaptif_score: 1,
    kolaboratif_score: 1,
    // Analisis AI
    analisis_ai_pro: "",
    analisis_ai_kontra: "",
    analisis_ai_kelebihan: "",
    analisis_ai_kekurangan: "",
  });

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchPegawai();
      fetchExistingEvaluation();
    }
  }, [id]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchPegawai = async () => {
    try {
      const { data, error } = await supabase
        .from("pegawai")
        .select(
          `
          *,
          unit_kerja:unit_kerja_id(nama_unit_kerja)
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setPegawai(data);
    } catch (error) {
      console.error("Error fetching pegawai:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pegawai",
        variant: "destructive",
      });
      navigate("/evaluasi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingEvaluation = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from("penilaian")
        .select("*")
        .eq("pegawai_id", id)
        .eq("penilai_user_id", session.user.id)
        .eq("tahun_penilaian", currentYear)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPenilaian({
          skp_2_tahun_terakhir_baik: data.skp_2_tahun_terakhir_baik,
          skp_peningkatan_prestasi: data.skp_peningkatan_prestasi,
          // Kriteria Integritas
          bebas_temuan: data.bebas_temuan || false,
          tidak_hukuman_disiplin: data.tidak_hukuman_disiplin || false,
          tidak_pemeriksaan_disiplin: data.tidak_pemeriksaan_disiplin || false,
          // Prestasi & Inovasi
          memiliki_inovasi: data.memiliki_inovasi || false,
          bukti_inovasi: data.bukti_inovasi || "",
          memiliki_penghargaan: data.memiliki_penghargaan || false,
          bukti_penghargaan: data.bukti_penghargaan || "",
          // Core Values ASN BerAKHLAK
          berorientasi_pelayanan_score: data.berorientasi_pelayanan_score || 1,
          akuntabel_score: data.akuntabel_score || 1,
          kompeten_score: data.kompeten_score || 1,
          harmonis_score: data.harmonis_score || 1,
          loyal_score: data.loyal_score || 1,
          adaptif_score: data.adaptif_score || 1,
          kolaboratif_score: data.kolaboratif_score || 1,
          // Analisis AI
          analisis_ai_pro: data.analisis_ai_pro || "",
          analisis_ai_kontra: data.analisis_ai_kontra || "",
          analisis_ai_kelebihan: data.analisis_ai_kelebihan || "",
          analisis_ai_kekurangan: data.analisis_ai_kekurangan || "",
        });
      }
    } catch (error) {
      console.error("Error fetching existing evaluation:", error);
    }
  };

  const handleScoreChange = (field: keyof PenilaianData, value: number[]) => {
    setPenilaian((prev) => ({
      ...prev,
      [field]: value[0],
    }));
  };

  const handleBooleanChange = (field: keyof PenilaianData, value: boolean) => {
    setPenilaian((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTextChange = (field: keyof PenilaianData, value: string) => {
    setPenilaian((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculatePreviewScore = () => {
    // Kriteria Integritas (30%)
    let integritasScore = 0;
    if (penilaian.bebas_temuan) integritasScore += 10;
    if (penilaian.tidak_hukuman_disiplin) integritasScore += 10;
    if (penilaian.tidak_pemeriksaan_disiplin) integritasScore += 10;

    // Prestasi & Inovasi (30%)
    let prestasiScore = 0;
    if (penilaian.memiliki_inovasi) prestasiScore += 20;
    if (penilaian.memiliki_penghargaan) prestasiScore += 10;

    // Kriteria SKP (20%)
    let skpScore = 0;
    if (penilaian.skp_2_tahun_terakhir_baik) skpScore += 10;
    if (penilaian.skp_peningkatan_prestasi) skpScore += 10;

    // Core Values ASN BerAKHLAK (20%)
    const coreValuesScores = [
      penilaian.berorientasi_pelayanan_score,
      penilaian.akuntabel_score,
      penilaian.kompeten_score,
      penilaian.harmonis_score,
      penilaian.loyal_score,
      penilaian.adaptif_score,
      penilaian.kolaboratif_score,
    ];
    const coreValuesAverage =
      coreValuesScores.reduce((sum, score) => sum + score, 0) /
      coreValuesScores.length;
    const coreValuesScore = (coreValuesAverage * 20) / 100; // 20% dari rata-rata core values

    const totalScore =
      integritasScore + prestasiScore + skpScore + coreValuesScore;
    return Math.min(totalScore, 100);
  };

  const generateAIAnalysis = async () => {
    setIsGeneratingAI(true);

    try {
      if (!pegawai) return;

      const prompt = `Analyze the following performance data for an ASN candidate for the 'Anugerah ASN Teladan Tahun 2025' award. Provide a comprehensive analysis of their pros, cons, strengths, and weaknesses based on the new evaluation criteria with proper weightings. Focus on aspects relevant to their suitability for the award.

**Candidate Information:**
- Name: ${pegawai.nama}
- NIP: ${pegawai.nip}
- Jabatan: ${pegawai.jabatan}
- Unit Kerja: ${pegawai.unit_kerja?.nama_unit_kerja}
- Status Jabatan: ${pegawai.status_jabatan}
- Masa Kerja: ${pegawai.masa_kerja_tahun} tahun

**Evaluation Criteria with Weightings:**

**1. Kriteria Integritas (30% total):**
- Bebas Temuan (10%): ${penilaian.bebas_temuan ? "✓ Ya" : "✗ Tidak"}
- Tidak Ada Hukuman Disiplin (10%): ${penilaian.tidak_hukuman_disiplin ? "✓ Ya" : "✗ Tidak"}
- Tidak Dalam Pemeriksaan (10%): ${penilaian.tidak_pemeriksaan_disiplin ? "✓ Ya" : "✗ Tidak"}

**2. Prestasi & Inovasi (30% total):**
- Memiliki Inovasi (20%): ${penilaian.memiliki_inovasi ? "✓ Ya" : "✗ Tidak"}
${penilaian.memiliki_inovasi && penilaian.bukti_inovasi ? `  Bukti: ${penilaian.bukti_inovasi}` : ""}
- Memiliki Penghargaan (10%): ${penilaian.memiliki_penghargaan ? "✓ Ya" : "✗ Tidak"}
${penilaian.memiliki_penghargaan && penilaian.bukti_penghargaan ? `  Bukti: ${penilaian.bukti_penghargaan}` : ""}

**3. Kriteria SKP (20% total):**
- SKP 2 Tahun Terakhir Baik (10%): ${penilaian.skp_2_tahun_terakhir_baik ? "✓ Ya" : "✗ Tidak"}
- SKP Menunjukkan Peningkatan Prestasi (10%): ${penilaian.skp_peningkatan_prestasi ? "✓ Ya" : "✗ Tidak"}

**4. Core Values ASN BerAKHLAK (20% total, 2.857% each):**
- Berorientasi Pelayanan: ${penilaian.berorientasi_pelayanan_score}/100
- Akuntabel: ${penilaian.akuntabel_score}/100
- Kompeten: ${penilaian.kompeten_score}/100
- Harmonis: ${penilaian.harmonis_score}/100
- Loyal: ${penilaian.loyal_score}/100
- Adaptif: ${penilaian.adaptif_score}/100
- Kolaboratif: ${penilaian.kolaboratif_score}/100

**Total Calculated Score: ${calculatePreviewScore().toFixed(2)}%**

Provide analysis in Indonesian language considering the weighted evaluation system. Format:
**Pros:**
- [Point 1]
- [Point 2]
...

**Cons:**
- [Point 1]
- [Point 2]
...

**Strengths:**
- [Point 1]
- [Point 2]
...

**Weaknesses:**
- [Point 1]
- [Point 2]
...`;

      const response = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY || "sk-your-api-key-here"}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.choices[0]?.message?.content || "";

      // Parse the analysis into sections
      const prosMatch = analysis.match(/\*\*Pros:\*\*([\s\S]*?)\*\*Cons:\*\*/);
      const consMatch = analysis.match(
        /\*\*Cons:\*\*([\s\S]*?)\*\*Strengths:\*\*/,
      );
      const strengthsMatch = analysis.match(
        /\*\*Strengths:\*\*([\s\S]*?)\*\*Weaknesses:\*\*/,
      );
      const weaknessesMatch = analysis.match(/\*\*Weaknesses:\*\*([\s\S]*)$/);

      setPenilaian((prev) => ({
        ...prev,
        analisis_ai_pro: prosMatch ? prosMatch[1].trim() : "",
        analisis_ai_kontra: consMatch ? consMatch[1].trim() : "",
        analisis_ai_kelebihan: strengthsMatch ? strengthsMatch[1].trim() : "",
        analisis_ai_kekurangan: weaknessesMatch
          ? weaknessesMatch[1].trim()
          : "",
      }));

      toast({
        title: "Berhasil",
        description: "Analisis AI telah dihasilkan",
      });
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      toast({
        title: "Error",
        description:
          "Gagal menghasilkan analisis AI. Pastikan API key Deepseek sudah dikonfigurasi.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const validateDescriptions = () => {
    const descriptions = [
      { key: "berorientasi_pelayanan_desc", label: "Berorientasi Pelayanan" },
      { key: "akuntabel_desc", label: "Akuntabel" },
      { key: "kompeten_desc", label: "Kompeten" },
      { key: "harmonis_desc", label: "Harmonis" },
      { key: "loyal_desc", label: "Loyal" },
      { key: "adaptif_desc", label: "Adaptif" },
      { key: "kolaboratif_desc", label: "Kolaboratif" },
    ];

    const invalidDescriptions = descriptions.filter(
      (desc) =>
        ((penilaian[desc.key as keyof PenilaianData] as string) || "").length <
        600,
    );

    return invalidDescriptions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate descriptions
    const invalidDescriptions = validateDescriptions();
    if (invalidDescriptions.length > 0) {
      toast({
        title: "Validasi Gagal",
        description: `Deskripsi untuk ${invalidDescriptions.map((d) => d.label).join(", ")} belum memenuhi minimum 600 karakter.`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Tidak ada session aktif");

      const currentYear = new Date().getFullYear();

      const { error } = await supabase.from("penilaian").upsert(
        [
          {
            pegawai_id: id,
            penilai_user_id: session.user.id,
            tahun_penilaian: currentYear,
            ...penilaian,
          },
        ],
        {
          onConflict: "pegawai_id,penilai_user_id,tahun_penilaian",
        },
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Evaluasi pegawai berhasil disimpan",
      });

      navigate("/evaluasi");
    } catch (error: any) {
      console.error("Error saving evaluation:", error);

      let errorMessage = "Gagal menyimpan evaluasi";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const scoreItems = [
    {
      key: "berorientasi_pelayanan_score" as keyof PenilaianData,
      descKey: "berorientasi_pelayanan_desc" as keyof PenilaianData,
      label: "Berorientasi Pelayanan",
      description:
        "Memahami dan memenuhi kebutuhan masyarakat sebagai prioritas utama",
      icon: Heart,
      color: "text-blue-600",
      percentage: "2,857%",
    },
    {
      key: "akuntabel_score" as keyof PenilaianData,
      descKey: "akuntabel_desc" as keyof PenilaianData,
      label: "Akuntabel",
      description: "Bertanggung jawab atas kinerja dan keputusan yang diambil",
      icon: Shield,
      color: "text-green-600",
      percentage: "2,857%",
    },
    {
      key: "kompeten_score" as keyof PenilaianData,
      descKey: "kompeten_desc" as keyof PenilaianData,
      label: "Kompeten",
      description: "Terus belajar dan mengembangkan kapabilitas diri",
      icon: Brain,
      color: "text-purple-600",
      percentage: "2,857%",
    },
    {
      key: "harmonis_score" as keyof PenilaianData,
      descKey: "harmonis_desc" as keyof PenilaianData,
      label: "Harmonis",
      description:
        "Menghargai setiap orang dan menunjukkan empati pada situasi yang dihadapi",
      icon: Users,
      color: "text-orange-600",
      percentage: "2,857%",
    },
    {
      key: "loyal_score" as keyof PenilaianData,
      descKey: "loyal_desc" as keyof PenilaianData,
      label: "Loyal",
      description: "Berdedikasi dan mengutamakan kepentingan bangsa dan negara",
      icon: Star,
      color: "text-red-600",
      percentage: "2,857%",
    },
    {
      key: "adaptif_score" as keyof PenilaianData,
      descKey: "adaptif_desc" as keyof PenilaianData,
      label: "Adaptif",
      description:
        "Terus berinovasi dan antusias dalam menggerakkan atau menghadapi perubahan",
      icon: TrendingUp,
      color: "text-indigo-600",
      percentage: "2,857%",
    },
    {
      key: "kolaboratif_score" as keyof PenilaianData,
      descKey: "kolaboratif_desc" as keyof PenilaianData,
      label: "Kolaboratif",
      description:
        "Membangun kerja sama yang sinergis untuk menghasilkan karya yang lebih berkualitas",
      icon: MessageSquare,
      color: "text-cyan-600",
      percentage: "2,857%",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pegawai) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="font-semibold mb-2">Pegawai tidak ditemukan</h3>
          <Button onClick={() => navigate("/evaluasi")}>Kembali</Button>
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
                onClick={() => navigate("/evaluasi")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Form Evaluasi</h1>
                <p className="text-sm text-muted-foreground">
                  Penilaian kinerja pegawai ASN
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {calculatePreviewScore().toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Skor Preview</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Employee Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informasi Pegawai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Nama Lengkap
                  </Label>
                  <p className="font-medium">{pegawai.nama}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    NIP
                  </Label>
                  <p className="font-mono">{pegawai.nip}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Jabatan
                  </Label>
                  <p className="font-medium">{pegawai.jabatan}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Unit Kerja
                  </Label>
                  <p className="font-medium">
                    {pegawai.unit_kerja?.nama_unit_kerja}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status Jabatan
                  </Label>
                  <Badge
                    variant={
                      pegawai.status_jabatan === "fungsional"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {pegawai.status_jabatan}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Masa Kerja
                  </Label>
                  <p className="font-medium">
                    {pegawai.masa_kerja_tahun} tahun
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kriteria Integritas */}
          <Card>
            <CardHeader>
              <CardTitle>Kriteria Integritas</CardTitle>
              <CardDescription>
                Penilaian integritas dan kedisiplinan pegawai (Total bobot: 30%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="bebas_temuan">Bebas Temuan</Label>
                      <Badge variant="secondary" className="text-xs">
                        10%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tidak ada temuan audit
                    </p>
                  </div>
                  <Switch
                    id="bebas_temuan"
                    checked={penilaian.bebas_temuan}
                    onCheckedChange={(checked) =>
                      handleBooleanChange("bebas_temuan", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="tidak_hukuman">
                        Tidak Ada Hukuman Disiplin
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        10%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bersih dari hukuman disiplin
                    </p>
                  </div>
                  <Switch
                    id="tidak_hukuman"
                    checked={penilaian.tidak_hukuman_disiplin}
                    onCheckedChange={(checked) =>
                      handleBooleanChange("tidak_hukuman_disiplin", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="tidak_pemeriksaan">
                        Tidak Dalam Pemeriksaan
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        10%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tidak sedang diperiksa
                    </p>
                  </div>
                  <Switch
                    id="tidak_pemeriksaan"
                    checked={penilaian.tidak_pemeriksaan_disiplin}
                    onCheckedChange={(checked) =>
                      handleBooleanChange("tidak_pemeriksaan_disiplin", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prestasi & Inovasi */}
          <Card>
            <CardHeader>
              <CardTitle>Prestasi & Inovasi</CardTitle>
              <CardDescription>
                Pencapaian dan kontribusi inovatif pegawai (Total bobot: 30%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="memiliki_inovasi">
                          Memiliki Inovasi
                        </Label>
                        <Badge variant="secondary" className="text-xs">
                          20%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Telah membuat inovasi
                      </p>
                    </div>
                    <Switch
                      id="memiliki_inovasi"
                      checked={penilaian.memiliki_inovasi}
                      onCheckedChange={(checked) =>
                        handleBooleanChange("memiliki_inovasi", checked)
                      }
                    />
                  </div>

                  {penilaian.memiliki_inovasi && (
                    <div className="space-y-2">
                      <Label htmlFor="bukti_inovasi">Bukti Inovasi</Label>
                      <Textarea
                        id="bukti_inovasi"
                        placeholder="Deskripsikan inovasi yang telah dibuat..."
                        value={penilaian.bukti_inovasi}
                        onChange={(e) =>
                          handleTextChange("bukti_inovasi", e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="memiliki_penghargaan">
                          Memiliki Penghargaan
                        </Label>
                        <Badge variant="secondary" className="text-xs">
                          10%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pernah menerima penghargaan
                      </p>
                    </div>
                    <Switch
                      id="memiliki_penghargaan"
                      checked={penilaian.memiliki_penghargaan}
                      onCheckedChange={(checked) =>
                        handleBooleanChange("memiliki_penghargaan", checked)
                      }
                    />
                  </div>

                  {penilaian.memiliki_penghargaan && (
                    <div className="space-y-2">
                      <Label htmlFor="bukti_penghargaan">
                        Bukti Penghargaan
                      </Label>
                      <Textarea
                        id="bukti_penghargaan"
                        placeholder="Deskripsikan penghargaan yang pernah diterima..."
                        value={penilaian.bukti_penghargaan}
                        onChange={(e) =>
                          handleTextChange("bukti_penghargaan", e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SKP Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Kriteria SKP</CardTitle>
              <CardDescription>
                Penilaian berdasarkan Sasaran Kinerja Pegawai (SKP) (Total
                bobot: 20%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="skp_2_tahun">
                      SKP 2 Tahun Terakhir Baik
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      10%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hasil SKP 2 tahun terakhir menunjukkan performa yang baik
                  </p>
                </div>
                <Switch
                  id="skp_2_tahun"
                  checked={penilaian.skp_2_tahun_terakhir_baik}
                  onCheckedChange={(checked) =>
                    handleBooleanChange("skp_2_tahun_terakhir_baik", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="skp_peningkatan">
                      SKP Menunjukkan Peningkatan Prestasi
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      10%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Terdapat peningkatan prestasi dari periode sebelumnya
                  </p>
                </div>
                <Switch
                  id="skp_peningkatan"
                  checked={penilaian.skp_peningkatan_prestasi}
                  onCheckedChange={(checked) =>
                    handleBooleanChange("skp_peningkatan_prestasi", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Score Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Penilaian Core Values ASN BerAKHLAK</CardTitle>
              <CardDescription>
                Berikan skor 1-100 untuk setiap core value (Total bobot: 20%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {scoreItems.map((item) => (
                <div key={item.key} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-lg bg-background ${item.color}`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Label className="font-medium">{item.label}</Label>
                          <Badge variant="secondary" className="text-xs">
                            {item.percentage}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {penilaian[item.key]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.description}
                      </p>
                      <Slider
                        value={[penilaian[item.key] as number]}
                        onValueChange={(value) =>
                          handleScoreChange(item.key, value)
                        }
                        min={1}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1 (Sangat Kurang)</span>
                        <span>50 (Cukup)</span>
                        <span>100 (Sangat Baik)</span>
                      </div>

                      {/* Description field for this core value */}
                      <div className="mt-4 space-y-2">
                        <Label
                          htmlFor={`desc_${item.key}`}
                          className="text-sm font-medium"
                        >
                          Deskripsi/Alasan Penilaian {item.label}
                          <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Textarea
                          id={`desc_${item.key}`}
                          placeholder={`Jelaskan secara detail alasan pemberian nilai ${penilaian[item.key]} untuk aspek ${item.label}. Berikan contoh konkret, evidence, dan justifikasi yang mendukung penilaian ini. Minimum 600 karakter.`}
                          value={(penilaian[item.descKey] as string) || ""}
                          onChange={(e) =>
                            handleTextChange(item.descKey, e.target.value)
                          }
                          rows={6}
                          className={`resize-none ${
                            ((penilaian[item.descKey] as string) || "").length <
                            600
                              ? "border-red-300 focus:border-red-500"
                              : "border-green-300 focus:border-green-500"
                          }`}
                        />
                        <div className="flex justify-between text-xs">
                          <span
                            className={`${
                              ((penilaian[item.descKey] as string) || "")
                                .length < 600
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {((penilaian[item.descKey] as string) || "").length}{" "}
                            / 600 karakter minimum
                          </span>
                          {((penilaian[item.descKey] as string) || "").length <
                            600 && (
                            <span className="text-red-600 font-medium">
                              Kurang{" "}
                              {600 -
                                ((penilaian[item.descKey] as string) || "")
                                  .length}{" "}
                              karakter
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Analisis Mendalam</CardTitle>
                  <CardDescription>
                    Berikan analisis terperinci mengenai kelebihan dan
                    kekurangan pegawai
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateAIAnalysis}
                  disabled={isGeneratingAI}
                  className="shrink-0"
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Menghasilkan...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate AI Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="analisis_pro">Analisis Pro/Positif</Label>
                  <Textarea
                    id="analisis_pro"
                    placeholder="Jelaskan aspek-aspek positif dan keunggulan pegawai..."
                    value={penilaian.analisis_ai_pro}
                    onChange={(e) =>
                      handleTextChange("analisis_ai_pro", e.target.value)
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analisis_kontra">
                    Analisis Kontra/Area Perbaikan
                  </Label>
                  <Textarea
                    id="analisis_kontra"
                    placeholder="Jelaskan area yang perlu diperbaiki atau ditingkatkan..."
                    value={penilaian.analisis_ai_kontra}
                    onChange={(e) =>
                      handleTextChange("analisis_ai_kontra", e.target.value)
                    }
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="analisis_kelebihan">Kelebihan Utama</Label>
                  <Textarea
                    id="analisis_kelebihan"
                    placeholder="Sebutkan kelebihan utama yang menonjol..."
                    value={penilaian.analisis_ai_kelebihan}
                    onChange={(e) =>
                      handleTextChange("analisis_ai_kelebihan", e.target.value)
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="analisis_kekurangan">
                    Kekurangan yang Perlu Diperbaiki
                  </Label>
                  <Textarea
                    id="analisis_kekurangan"
                    placeholder="Sebutkan kekurangan yang perlu mendapat perhatian..."
                    value={penilaian.analisis_ai_kekurangan}
                    onChange={(e) =>
                      handleTextChange("analisis_ai_kekurangan", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/evaluasi")}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Evaluasi
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default FormEvaluasi;

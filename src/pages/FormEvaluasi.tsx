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
  kinerja_perilaku_score: number;
  inovasi_dampak_score: number;
  prestasi_score: number;
  inspiratif_score: number;
  komunikasi_score: number;
  kerjasama_kolaborasi_score: number;
  leadership_score: number;
  rekam_jejak_score: number;
  integritas_moralitas_score: number;
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
    kinerja_perilaku_score: 70,
    inovasi_dampak_score: 70,
    prestasi_score: 70,
    inspiratif_score: 70,
    komunikasi_score: 70,
    kerjasama_kolaborasi_score: 70,
    leadership_score: 70,
    rekam_jejak_score: 70,
    integritas_moralitas_score: 70,
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
          kinerja_perilaku_score: data.kinerja_perilaku_score,
          inovasi_dampak_score: data.inovasi_dampak_score,
          prestasi_score: data.prestasi_score,
          inspiratif_score: data.inspiratif_score,
          komunikasi_score: data.komunikasi_score,
          kerjasama_kolaborasi_score: data.kerjasama_kolaborasi_score,
          leadership_score: data.leadership_score,
          rekam_jejak_score: data.rekam_jejak_score,
          integritas_moralitas_score: data.integritas_moralitas_score,
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
    const scores = [
      penilaian.kinerja_perilaku_score,
      penilaian.inovasi_dampak_score,
      penilaian.prestasi_score,
      penilaian.inspiratif_score,
      penilaian.komunikasi_score,
      penilaian.kerjasama_kolaborasi_score,
      penilaian.leadership_score,
      penilaian.rekam_jejak_score,
      penilaian.integritas_moralitas_score,
    ];

    let average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (penilaian.skp_2_tahun_terakhir_baik) average += 5;
    if (penilaian.skp_peningkatan_prestasi) average += 5;

    return Math.min(average, 100);
  };

  const generateAIAnalysis = async () => {
    setIsGeneratingAI(true);

    try {
      if (!pegawai) return;

      const prompt = `Analyze the following performance data for an ASN candidate for the 'Teladan' award. Provide a concise analysis of their pros, cons, strengths, and weaknesses based on the provided scores and information. Focus on aspects relevant to their suitability for the award.

**Candidate Information:**
- Name: ${pegawai.nama}
- NIP: ${pegawai.nip}
- Jabatan: ${pegawai.jabatan}
- Unit Kerja: ${pegawai.unit_kerja?.nama_unit_kerja}

**Eligibility Criteria:**
- Jabatan: ${pegawai.status_jabatan}
- Masa Kerja: ${pegawai.masa_kerja_tahun} tahun
- Memiliki Inovasi: ${pegawai.memiliki_inovasi ? "Ya" : "Tidak"}
- Memiliki Penghargaan: ${pegawai.memiliki_penghargaan ? "Ya" : "Tidak"}

**Performance Scores (1-100, higher is better):**
- Kinerja dan Perilaku: ${penilaian.kinerja_perilaku_score}
- Inovasi dan Dampak: ${penilaian.inovasi_dampak_score}
- Prestasi: ${penilaian.prestasi_score}
- Inspiratif: ${penilaian.inspiratif_score}
- Kemampuan Komunikasi: ${penilaian.komunikasi_score}
- Kerja Sama dan Kolaborasi: ${penilaian.kerjasama_kolaborasi_score}
- Leadership: ${penilaian.leadership_score}
- Rekam Jejak: ${penilaian.rekam_jejak_score}
- Integritas dan Moralitas: ${penilaian.integritas_moralitas_score}

**SKP (2 Tahun Terakhir):**
- Kategori Baik: ${penilaian.skp_2_tahun_terakhir_baik ? "Ya" : "Tidak"}
- Peningkatan Prestasi: ${penilaian.skp_peningkatan_prestasi ? "Ya" : "Tidak"}

Provide analysis in Indonesian language. Format:
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan evaluasi",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const scoreItems = [
    {
      key: "kinerja_perilaku_score" as keyof PenilaianData,
      label: "Kinerja & Perilaku",
      description: "Penilaian terhadap hasil kerja dan perilaku sehari-hari",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      key: "inovasi_dampak_score" as keyof PenilaianData,
      label: "Inovasi & Dampak",
      description:
        "Kemampuan berinovasi dan dampak positif terhadap organisasi",
      icon: Brain,
      color: "text-purple-600",
    },
    {
      key: "prestasi_score" as keyof PenilaianData,
      label: "Prestasi",
      description: "Pencapaian dan prestasi yang telah diraih",
      icon: Award,
      color: "text-yellow-600",
    },
    {
      key: "inspiratif_score" as keyof PenilaianData,
      label: "Inspiratif",
      description: "Kemampuan menginspirasi dan memotivasi rekan kerja",
      icon: Star,
      color: "text-orange-600",
    },
    {
      key: "komunikasi_score" as keyof PenilaianData,
      label: "Komunikasi",
      description: "Keterampilan komunikasi dan penyampaian ide",
      icon: MessageSquare,
      color: "text-green-600",
    },
    {
      key: "kerjasama_kolaborasi_score" as keyof PenilaianData,
      label: "Kerjasama & Kolaborasi",
      description: "Kemampuan bekerja sama dan berkolaborasi",
      icon: Users,
      color: "text-indigo-600",
    },
    {
      key: "leadership_score" as keyof PenilaianData,
      label: "Kepemimpinan",
      description: "Kemampuan memimpin dan mengambil inisiatif",
      icon: Crown,
      color: "text-red-600",
    },
    {
      key: "rekam_jejak_score" as keyof PenilaianData,
      label: "Rekam Jejak",
      description: "Konsistensi dan track record kinerja",
      icon: Shield,
      color: "text-cyan-600",
    },
    {
      key: "integritas_moralitas_score" as keyof PenilaianData,
      label: "Integritas & Moralitas",
      description: "Kejujuran, etika, dan moral dalam bekerja",
      icon: Heart,
      color: "text-pink-600",
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

          {/* SKP Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Kriteria SKP</CardTitle>
              <CardDescription>
                Penilaian berdasarkan Sasaran Kinerja Pegawai (SKP)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="skp_2_tahun">SKP 2 Tahun Terakhir Baik</Label>
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
                  <Label htmlFor="skp_peningkatan">
                    SKP Menunjukkan Peningkatan Prestasi
                  </Label>
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
              <CardTitle>Penilaian Aspek Kinerja</CardTitle>
              <CardDescription>
                Berikan skor 1-100 untuk setiap aspek penilaian
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
                        <Label className="font-medium">{item.label}</Label>
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

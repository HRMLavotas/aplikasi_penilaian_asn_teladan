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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Star,
  Users,
  TrendingUp,
  Eye,
  Download,
  Filter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface PegawaiRanking {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  status_jabatan: string;
  masa_kerja_tahun: number;
  // Integrity and achievement fields (in pegawai table)
  bebas_temuan: boolean;
  bukti_inovasi: string | null;
  bukti_penghargaan: string | null;
  memiliki_inovasi: boolean;
  memiliki_penghargaan: boolean;
  tidak_hukuman_disiplin: boolean;
  tidak_pemeriksaan_disiplin: boolean;
  unit_kerja: {
    nama_unit_kerja: string;
  };
  penilaian: Array<{
    id: string;
    tahun_penilaian: number;
    persentase_akhir: number;
    // Original scoring system (still in database)
    kinerja_perilaku_score: number;
    inovasi_dampak_score: number;
    prestasi_score: number;
    inspiratif_score: number;
    komunikasi_score: number;
    kerjasama_kolaborasi_score: number;
    leadership_score: number;
    rekam_jejak_score: number;
    integritas_moralitas_score: number;
    // BerAKHLAK Core Values Descriptions
    adaptif_desc: string | null;
    akuntabel_desc: string | null;
    berorientasi_pelayanan_desc: string | null;
    harmonis_desc: string | null;
    kolaboratif_desc: string | null;
    kompeten_desc: string | null;
    loyal_desc: string | null;
    // SKP Criteria
    skp_2_tahun_terakhir_baik: boolean;
    skp_peningkatan_prestasi: boolean;
    // AI Analysis
    analisis_ai_pro: string | null;
    analisis_ai_kontra: string | null;
    analisis_ai_kelebihan: string | null;
    analisis_ai_kekurangan: string | null;
  }>;
}

interface UnitKerja {
  id: string;
  nama_unit_kerja: string;
}

const Ranking = () => {
  const [pegawai, setPegawai] = useState<PegawaiRanking[]>([]);
  const [filteredPegawai, setFilteredPegawai] = useState<PegawaiRanking[]>([]);
  const [unitKerja, setUnitKerja] = useState<UnitKerja[]>([]);
  const [selectedPegawai, setSelectedPegawai] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [maxResults, setMaxResults] = useState<number>(10);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pegawai, filterUnit, filterStatus, minScore]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      // Fetch pegawai with evaluations
      const { data: pegawaiData, error: pegawaiError } = await supabase
        .from("pegawai")
        .select(
          `
          id,
          nama,
          nip,
          jabatan,
          status_jabatan,
          masa_kerja_tahun,
          unit_kerja:unit_kerja_id(nama_unit_kerja),
          penilaian(
            id,
            tahun_penilaian,
            persentase_akhir,
            berorientasi_pelayanan_score,
            akuntabel_score,
            kompeten_score,
            harmonis_score,
            loyal_score,
            adaptif_score,
            kolaboratif_score,
            akuntabel_desc,
            adaptif_desc,
            berorientasi_pelayanan_desc,
            harmonis_desc,
            kolaboratif_desc,
            kompeten_desc,
            loyal_desc,
            skp_2_tahun_terakhir_baik,
            skp_peningkatan_prestasi,
            bebas_temuan,
            tidak_hukuman_disiplin,
            tidak_pemeriksaan_disiplin,
            memiliki_inovasi,
            bukti_inovasi,
            memiliki_penghargaan,
            bukti_penghargaan,
            analisis_ai_pro,
            analisis_ai_kontra,
            analisis_ai_kelebihan,
            analisis_ai_kekurangan
          )
        `,
        )
        .order("nama");

      if (pegawaiError) throw pegawaiError;

      // Fetch unit kerja for filter
      const { data: unitData, error: unitError } = await supabase
        .from("unit_kerja")
        .select("*")
        .order("nama_unit_kerja");

      if (unitError) throw unitError;

      // Filter pegawai with evaluations and calculate latest scores
      const pegawaiWithEvaluations = (pegawaiData || [])
        .filter((p) => p.penilaian && p.penilaian.length > 0)
        .map((p) => {
          const latestEvaluation = p.penilaian.reduce(
            (latest: any, current: any) =>
              current.tahun_penilaian > latest.tahun_penilaian
                ? current
                : latest,
          );
          return {
            ...p,
            penilaian: [latestEvaluation],
          };
        })
        .sort(
          (a, b) =>
            (b.penilaian[0]?.persentase_akhir || 0) -
            (a.penilaian[0]?.persentase_akhir || 0),
        );

      setPegawai(pegawaiWithEvaluations);
      setUnitKerja(unitData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: `Gagal memuat data ranking: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    const filtered = pegawai.filter((p) => {
      const latestScore = p.penilaian[0]?.persentase_akhir || 0;
      const matchesUnit =
        filterUnit === "all" || p.unit_kerja?.nama_unit_kerja === filterUnit;
      const matchesStatus =
        filterStatus === "all" || p.status_jabatan === filterStatus;
      const matchesScore = latestScore >= minScore;

      return matchesUnit && matchesStatus && matchesScore;
    });

    setFilteredPegawai(filtered);
  };

  const handleSelectPegawai = (pegawaiId: string, checked: boolean) => {
    if (checked) {
      if (selectedPegawai.length < maxResults) {
        setSelectedPegawai((prev) => [...prev, pegawaiId]);
      } else {
        toast({
          title: "Batas Maksimal",
          description: `Maksimal ${maxResults} pegawai yang dapat dipilih`,
          variant: "destructive",
        });
      }
    } else {
      setSelectedPegawai((prev) => prev.filter((id) => id !== pegawaiId));
    }
  };

  const handleSelectAll = () => {
    const topPegawai = filteredPegawai.slice(0, maxResults);
    setSelectedPegawai(topPegawai.map((p) => p.id));
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return { icon: Trophy, color: "bg-yellow-500 text-white", label: "#1" };
    if (rank === 2)
      return { icon: Medal, color: "bg-gray-400 text-white", label: "#2" };
    if (rank === 3)
      return { icon: Award, color: "bg-amber-600 text-white", label: "#3" };
    return { icon: Star, color: "bg-blue-500 text-white", label: `#${rank}` };
  };

  const exportResults = () => {
    const selectedData = filteredPegawai
      .filter((p) => selectedPegawai.includes(p.id))
      .map((p, index) => ({
        Rank: index + 1,
        Nama: p.nama,
        NIP: p.nip,
        Jabatan: p.jabatan,
        "Unit Kerja": p.unit_kerja?.nama_unit_kerja,
        "Status Jabatan": p.status_jabatan,
        "Skor Akhir": p.penilaian[0]?.persentase_akhir?.toFixed(1) + "%",
      }));

    const csvContent = [
      Object.keys(selectedData[0] || {}).join(","),
      ...selectedData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ASN_Teladan_Ranking_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Berhasil",
      description: "Data ranking berhasil diekspor",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                <h1 className="text-2xl font-bold">Ranking ASN Teladan</h1>
                <p className="text-sm text-muted-foreground">
                  Sistem eliminasi dan seleksi kandidat terbaik
                </p>
              </div>
            </div>
            <Trophy className="h-8 w-8 text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Kandidat</CardDescription>
              <CardTitle className="text-2xl">{pegawai.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                Sudah Dievaluasi
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Setelah Filter</CardDescription>
              <CardTitle className="text-2xl">
                {filteredPegawai.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Filter className="h-4 w-4 mr-1" />
                Memenuhi Kriteria
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Dipilih</CardDescription>
              <CardTitle className="text-2xl">
                {selectedPegawai.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Award className="h-4 w-4 mr-1" />
                Dari {maxResults} Maksimal
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Skor Tertinggi</CardDescription>
              <CardTitle className="text-2xl">
                {filteredPegawai.length > 0
                  ? filteredPegawai[0].penilaian[0]?.persentase_akhir?.toFixed(
                      1,
                    ) + "%"
                  : "-"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 mr-1" />
                Best Score
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter & Pengaturan Eliminasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Unit Kerja</Label>
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Unit Kerja</SelectItem>
                    {unitKerja.map((unit) => (
                      <SelectItem key={unit.id} value={unit.nama_unit_kerja}>
                        {unit.nama_unit_kerja}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status Jabatan</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="administrasi">Administrasi</SelectItem>
                    <SelectItem value="fungsional">Fungsional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Skor Minimum</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Maksimal Dipilih</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label className="invisible">Actions</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex-1"
                  >
                    Pilih Top {Math.min(maxResults, filteredPegawai.length)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPegawai([])}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {selectedPegawai.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {selectedPegawai.length} ASN Teladan Terpilih
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Siap untuk proses selanjutnya
                  </p>
                </div>
                <Button onClick={exportResults} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ranking Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Ranking Kandidat ASN Teladan ({filteredPegawai.length})
            </CardTitle>
            <CardDescription>
              Daftar pegawai yang telah dievaluasi, diurutkan berdasarkan skor
              tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPegawai.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Tidak ada kandidat</h3>
                <p className="text-muted-foreground mb-4">
                  Tidak ada pegawai yang memenuhi kriteria filter yang dipilih.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Pilih</TableHead>
                      <TableHead className="w-[80px]">Rank</TableHead>
                      <TableHead>Pegawai</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Skor</TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPegawai.map((p, index) => {
                      const rank = index + 1;
                      const rankBadge = getRankBadge(rank);
                      const RankIcon = rankBadge.icon;
                      const latestEval = p.penilaian[0];

                      return (
                        <TableRow
                          key={p.id}
                          className={
                            selectedPegawai.includes(p.id) ? "bg-muted/50" : ""
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedPegawai.includes(p.id)}
                              onCheckedChange={(checked) =>
                                handleSelectPegawai(p.id, checked as boolean)
                              }
                              disabled={
                                !selectedPegawai.includes(p.id) &&
                                selectedPegawai.length >= maxResults
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div
                              className={`w-12 h-8 rounded-md flex items-center justify-center ${rankBadge.color}`}
                            >
                              <RankIcon className="h-4 w-4" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{p.nama}</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {p.nip}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{p.jabatan}</TableCell>
                          <TableCell className="max-w-48 truncate">
                            {p.unit_kerja?.nama_unit_kerja || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.status_jabatan === "fungsional"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {p.status_jabatan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-lg font-bold">
                              {latestEval?.persentase_akhir?.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {latestEval?.memiliki_inovasi && (
                                <Badge variant="outline" className="text-xs">
                                  Inovasi
                                </Badge>
                              )}
                              {latestEval?.memiliki_penghargaan && (
                                <Badge variant="outline" className="text-xs">
                                  Award
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-xl">
                                    Detail Evaluasi Lengkap - {p.nama}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Rincian lengkap penilaian ASN meliputi
                                    kriteria integritas, prestasi & inovasi,
                                    SKP, dan analisis AI
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                  {/* Overall Score */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">
                                        Skor Akhir
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-4xl font-bold text-center">
                                        {latestEval?.persentase_akhir?.toFixed(
                                          1,
                                        )}
                                        %
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Kriteria Integritas */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">
                                        Kriteria Integritas
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Bebas Temuan
                                          </Label>
                                          <Badge
                                            variant={
                                              latestEval?.bebas_temuan
                                                ? "default"
                                                : "destructive"
                                            }
                                          >
                                            {latestEval?.bebas_temuan
                                              ? "✓ Ya"
                                              : "✗ Tidak"}
                                          </Badge>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Tidak Ada Hukuman Disiplin
                                          </Label>
                                          <Badge
                                            variant={
                                              latestEval?.tidak_hukuman_disiplin
                                                ? "default"
                                                : "destructive"
                                            }
                                          >
                                            {latestEval?.tidak_hukuman_disiplin
                                              ? "✓ Ya"
                                              : "✗ Tidak"}
                                          </Badge>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Tidak Dalam Pemeriksaan
                                          </Label>
                                          <Badge
                                            variant={
                                              latestEval?.tidak_pemeriksaan_disiplin
                                                ? "default"
                                                : "destructive"
                                            }
                                          >
                                            {latestEval?.tidak_pemeriksaan_disiplin
                                              ? "✓ Ya"
                                              : "✗ Tidak"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Prestasi & Inovasi */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">
                                        Prestasi & Inovasi
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Memiliki Inovasi
                                          </Label>
                                          <Badge
                                            variant={
                                              latestEval?.memiliki_inovasi
                                                ? "default"
                                                : "secondary"
                                            }
                                          >
                                            {latestEval?.memiliki_inovasi
                                              ? "✓ Ya"
                                              : "✗ Tidak"}
                                          </Badge>
                                          {latestEval?.bukti_inovasi && (
                                            <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                                              <strong>Bukti:</strong>{" "}
                                              {latestEval.bukti_inovasi}
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Memiliki Penghargaan
                                          </Label>
                                          <Badge
                                            variant={
                                              latestEval?.memiliki_penghargaan
                                                ? "default"
                                                : "secondary"
                                            }
                                          >
                                            {latestEval?.memiliki_penghargaan
                                              ? "✓ Ya"
                                              : "✗ Tidak"}
                                          </Badge>
                                          {latestEval?.bukti_penghargaan && (
                                            <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                                              <strong>Bukti:</strong>{" "}
                                              {latestEval.bukti_penghargaan}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Kriteria SKP */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">
                                        Kriteria SKP (Sasaran Kerja Pegawai)
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            SKP 2 Tahun Terakhir Baik
                                          </Label>
                                          <Badge
                                            variant={
                                              latestEval?.skp_2_tahun_terakhir_baik
                                                ? "default"
                                                : "destructive"
                                            }
                                          >
                                            {latestEval?.skp_2_tahun_terakhir_baik
                                              ? "✓ Ya"
                                              : "✗ Tidak"}
                                          </Badge>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Peningkatan Prestasi SKP
                                          </Label>
                                          <Badge
                                            variant={
                                              latestEval?.skp_peningkatan_prestasi
                                                ? "default"
                                                : "secondary"
                                            }
                                          >
                                            {latestEval?.skp_peningkatan_prestasi
                                              ? "✓ Ya"
                                              : "✗ Tidak"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* BerAKHLAK Core Values Scores */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">
                                        Penilaian BerAKHLAK Core Values
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Berorientasi Pelayanan
                                          </Label>
                                          <div className="text-2xl font-bold text-blue-600">
                                            {
                                              latestEval?.berorientasi_pelayanan_score
                                            }
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Akuntabel
                                          </Label>
                                          <div className="text-2xl font-bold text-green-600">
                                            {latestEval?.akuntabel_score}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Kompeten
                                          </Label>
                                          <div className="text-2xl font-bold text-purple-600">
                                            {latestEval?.kompeten_score}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Harmonis
                                          </Label>
                                          <div className="text-2xl font-bold text-yellow-600">
                                            {latestEval?.harmonis_score}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Loyal
                                          </Label>
                                          <div className="text-2xl font-bold text-indigo-600">
                                            {latestEval?.loyal_score}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Adaptif
                                          </Label>
                                          <div className="text-2xl font-bold text-pink-600">
                                            {latestEval?.adaptif_score}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-sm font-medium">
                                            Kolaboratif
                                          </Label>
                                          <div className="text-2xl font-bold text-orange-600">
                                            {latestEval?.kolaboratif_score}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* BerAKHLAK Core Values Descriptions */}
                                  {latestEval &&
                                    (latestEval.akuntabel_desc ||
                                      latestEval.adaptif_desc ||
                                      latestEval.berorientasi_pelayanan_desc ||
                                      latestEval.harmonis_desc ||
                                      latestEval.kolaboratif_desc ||
                                      latestEval.kompeten_desc ||
                                      latestEval.loyal_desc) && (
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Deskripsi Penilaian BerAKHLAK
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-1 gap-4">
                                            {latestEval.akuntabel_desc && (
                                              <div className="space-y-2">
                                                <Label className="text-sm font-medium text-blue-700">
                                                  Akuntabel
                                                </Label>
                                                <div className="text-sm p-3 bg-blue-50 rounded-lg border">
                                                  {latestEval.akuntabel_desc}
                                                </div>
                                              </div>
                                            )}
                                            {latestEval.adaptif_desc && (
                                              <div className="space-y-2">
                                                <Label className="text-sm font-medium text-green-700">
                                                  Adaptif
                                                </Label>
                                                <div className="text-sm p-3 bg-green-50 rounded-lg border">
                                                  {latestEval.adaptif_desc}
                                                </div>
                                              </div>
                                            )}
                                            {latestEval.berorientasi_pelayanan_desc && (
                                              <div className="space-y-2">
                                                <Label className="text-sm font-medium text-purple-700">
                                                  Berorientasi Pelayanan
                                                </Label>
                                                <div className="text-sm p-3 bg-purple-50 rounded-lg border">
                                                  {
                                                    latestEval.berorientasi_pelayanan_desc
                                                  }
                                                </div>
                                              </div>
                                            )}
                                            {latestEval.harmonis_desc && (
                                              <div className="space-y-2">
                                                <Label className="text-sm font-medium text-yellow-700">
                                                  Harmonis
                                                </Label>
                                                <div className="text-sm p-3 bg-yellow-50 rounded-lg border">
                                                  {latestEval.harmonis_desc}
                                                </div>
                                              </div>
                                            )}
                                            {latestEval.kolaboratif_desc && (
                                              <div className="space-y-2">
                                                <Label className="text-sm font-medium text-indigo-700">
                                                  Kolaboratif
                                                </Label>
                                                <div className="text-sm p-3 bg-indigo-50 rounded-lg border">
                                                  {latestEval.kolaboratif_desc}
                                                </div>
                                              </div>
                                            )}
                                            {latestEval.kompeten_desc && (
                                              <div className="space-y-2">
                                                <Label className="text-sm font-medium text-pink-700">
                                                  Kompeten
                                                </Label>
                                                <div className="text-sm p-3 bg-pink-50 rounded-lg border">
                                                  {latestEval.kompeten_desc}
                                                </div>
                                              </div>
                                            )}
                                            {latestEval.loyal_desc && (
                                              <div className="space-y-2">
                                                <Label className="text-sm font-medium text-orange-700">
                                                  Loyal
                                                </Label>
                                                <div className="text-sm p-3 bg-orange-50 rounded-lg border">
                                                  {latestEval.loyal_desc}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )}

                                  {/* AI Analysis */}
                                  {latestEval &&
                                    (latestEval.analisis_ai_pro ||
                                      latestEval.analisis_ai_kelebihan ||
                                      latestEval.analisis_ai_kontra ||
                                      latestEval.analisis_ai_kekurangan) && (
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Analisis AI
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium text-green-700">
                                                Analisis Positif
                                              </Label>
                                              <div className="text-sm p-3 bg-green-50 rounded-lg border min-h-[100px]">
                                                {latestEval.analisis_ai_pro ||
                                                  "Tidak ada analisis positif"}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium text-orange-700">
                                                Area Perbaikan
                                              </Label>
                                              <div className="text-sm p-3 bg-orange-50 rounded-lg border min-h-[100px]">
                                                {latestEval.analisis_ai_kontra ||
                                                  "Tidak ada area perbaikan"}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium text-blue-700">
                                                Kelebihan
                                              </Label>
                                              <div className="text-sm p-3 bg-blue-50 rounded-lg border min-h-[100px]">
                                                {latestEval.analisis_ai_kelebihan ||
                                                  "Tidak ada analisis kelebihan"}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium text-red-700">
                                                Kekurangan
                                              </Label>
                                              <div className="text-sm p-3 bg-red-50 rounded-lg border min-h-[100px]">
                                                {latestEval.analisis_ai_kekurangan ||
                                                  "Tidak ada analisis kekurangan"}
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Ranking;

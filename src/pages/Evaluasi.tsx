import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Award
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

const Evaluasi = () => {
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [unitKerja, setUnitKerja] = useState<UnitKerja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      // Fetch pegawai with unit kerja and latest evaluations
      const { data: pegawaiData, error: pegawaiError } = await supabase
        .from("pegawai")
        .select(`
          *,
          unit_kerja:unit_kerja_id(nama_unit_kerja),
          penilaian(id, tahun_penilaian, persentase_akhir)
        `)
        .order("nama");

      if (pegawaiError) throw pegawaiError;

      // Fetch unit kerja for filter
      const { data: unitData, error: unitError } = await supabase
        .from("unit_kerja")
        .select("*")
        .order("nama_unit_kerja");

      if (unitError) throw unitError;

      setPegawai(pegawaiData || []);
      setUnitKerja(unitData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pegawai",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLatestEvaluation = (evaluations: any[]) => {
    if (!evaluations || evaluations.length === 0) return null;
    return evaluations.reduce((latest, current) => 
      current.tahun_penilaian > latest.tahun_penilaian ? current : latest
    );
  };

  const getEvaluationStatus = (evaluations: any[]) => {
    const currentYear = new Date().getFullYear();
    const hasCurrentYearEval = evaluations?.some(e => e.tahun_penilaian === currentYear);
    
    if (hasCurrentYearEval) {
      return { status: "completed", label: "Sudah Dinilai", variant: "default" as const };
    } else if (evaluations && evaluations.length > 0) {
      return { status: "outdated", label: "Perlu Update", variant: "secondary" as const };
    } else {
      return { status: "pending", label: "Belum Dinilai", variant: "destructive" as const };
    }
  };

  const filteredPegawai = pegawai.filter((p) => {
    const matchesSearch = 
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nip.includes(searchTerm) ||
      p.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUnit = filterUnit === "all" || p.unit_kerja?.nama_unit_kerja === filterUnit;
    const matchesStatus = filterStatus === "all" || p.status_jabatan === filterStatus;

    return matchesSearch && matchesUnit && matchesStatus;
  });

  const stats = {
    total: pegawai.length,
    evaluated: pegawai.filter(p => {
      const currentYear = new Date().getFullYear();
      return p.penilaian?.some(e => e.tahun_penilaian === currentYear);
    }).length,
    pending: pegawai.filter(p => {
      const currentYear = new Date().getFullYear();
      return !p.penilaian?.some(e => e.tahun_penilaian === currentYear);
    }).length,
    highPerformers: pegawai.filter(p => {
      const latest = getLatestEvaluation(p.penilaian);
      return latest && latest.persentase_akhir >= 85;
    }).length
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
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Evaluasi Pegawai</h1>
                <p className="text-sm text-muted-foreground">Lakukan penilaian kinerja pegawai ASN</p>
              </div>
            </div>
            <ClipboardCheck className="h-8 w-8 text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pegawai</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                Terdaftar
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sudah Dievaluasi</CardDescription>
              <CardTitle className="text-2xl">{stats.evaluated}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <ClipboardCheck className="h-4 w-4 mr-1" />
                Tahun ini
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Menunggu Evaluasi</CardDescription>
              <CardTitle className="text-2xl">{stats.pending}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Star className="h-4 w-4 mr-1" />
                Pending
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Performa Tinggi</CardDescription>
              <CardTitle className="text-2xl">{stats.highPerformers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 mr-1" />
                ≥85% Skor
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pencarian</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, NIP, atau jabatan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Kerja</label>
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
                <label className="text-sm font-medium">Status Jabatan</label>
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
                <label className="text-sm font-medium invisible">Actions</label>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterUnit("all");
                    setFilterStatus("all");
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pegawai untuk Evaluasi ({filteredPegawai.length})</CardTitle>
            <CardDescription>
              Pilih pegawai untuk melakukan evaluasi kinerja
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPegawai.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Tidak ada data pegawai</h3>
                <p className="text-muted-foreground mb-4">
                  {pegawai.length === 0 
                    ? "Belum ada pegawai yang terdaftar untuk dievaluasi."
                    : "Tidak ada pegawai yang cocok dengan filter yang dipilih."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pegawai</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Evaluasi Terakhir</TableHead>
                      <TableHead>Skor Terakhir</TableHead>
                      <TableHead>Status Evaluasi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPegawai.map((p) => {
                      const latestEval = getLatestEvaluation(p.penilaian);
                      const evalStatus = getEvaluationStatus(p.penilaian);
                      
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{p.nama}</div>
                              <div className="text-sm text-muted-foreground font-mono">{p.nip}</div>
                            </div>
                          </TableCell>
                          <TableCell>{p.jabatan}</TableCell>
                          <TableCell className="max-w-48 truncate">
                            {p.unit_kerja?.nama_unit_kerja || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.status_jabatan === "fungsional" ? "default" : "secondary"}>
                              {p.status_jabatan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {latestEval ? latestEval.tahun_penilaian : "-"}
                          </TableCell>
                          <TableCell>
                            {latestEval ? (
                              <div className="flex items-center space-x-2">
                                <span className="font-mono">
                                  {latestEval.persentase_akhir?.toFixed(1)}%
                                </span>
                                {latestEval.persentase_akhir >= 85 && (
                                  <Award className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={evalStatus.variant}>
                              {evalStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm"
                              onClick={() => navigate(`/evaluasi/${p.id}`)}
                            >
                              <ClipboardCheck className="h-4 w-4 mr-2" />
                              Evaluasi
                            </Button>
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

export default Evaluasi;
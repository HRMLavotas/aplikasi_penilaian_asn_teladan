import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  Users,
  Award,
  Clock,
  Upload,
} from "lucide-react";
import BulkImport from "@/components/BulkImport";
import { getStatusJabatanDisplay } from "@/utils/statusJabatan";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Pegawai {
  id: string;
  user_id: string;
  nama: string;
  nip: string;
  jabatan: string;
  status_jabatan: string;
  masa_kerja_tahun: number;
  memiliki_inovasi: boolean;
  memiliki_penghargaan: boolean;
  created_at: string;
  unit_kerja: {
    nama_unit_kerja: string;
  };
  user?: {
    email: string;
  };
}

interface UnitKerja {
  id: string;
  nama_unit_kerja: string;
}

const Pegawai = () => {
  const [pegawai, setPegawai] = useState<Pegawai[]>([]);
  const [unitKerja, setUnitKerja] = useState<UnitKerja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    user,
    isSuperAdmin,
    isLoading: authLoading,
    isInitialized,
  } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // First, fetch unit kerja since it's needed for both admin and regular users
      const { data: unitData, error: unitError } = await supabase
        .from("unit_kerja")
        .select("*")
        .order("nama_unit_kerja");

      if (unitError) throw unitError;
      setUnitKerja(unitData || []);

      // First, let's check the structure of the pegawai table

      // Define the type for our pegawai data
      interface PegawaiData {
        id: string;
        user_id: string;
        nama: string;
        nip: string;
        jabatan: string;
        status_jabatan: string;
        masa_kerja_tahun: number;
        memiliki_inovasi: boolean;
        memiliki_penghargaan: boolean;
        created_at: string;
        unit_kerja_id: string;
      }

      // Simple query to get all columns without joins first
      const { data, error } = await supabase
        .from("pegawai")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // If we have data, process it
      if (data && data.length > 0) {
        // Get unique unit_kerja_ids
        const unitKerjaIds = [
          ...new Set(data.map((p) => (p as PegawaiData).unit_kerja_id)),
        ].filter((id): id is string => !!id);

        // Fetch unit_kerja data if we have any unit_kerja_ids
        let unitKerjaMap = new Map();
        if (unitKerjaIds.length > 0) {
          const { data: unitKerjaData, error: unitError } = await supabase
            .from("unit_kerja")
            .select("*")
            .in("id", unitKerjaIds);

          if (unitError) {
          } else if (unitKerjaData) {
            unitKerjaMap = new Map(unitKerjaData.map((uk) => [uk.id, uk]));
          }
        }

        // Create user information
        const userMap = new Map<string, { id: string; email: string }>();

        // Add current user's information
        if (user) {
          userMap.set(user.id, {
            id: user.id,
            email: user.email || `user_${user.id.substring(0, 6)}`,
          });
        }

        // Format the data with related information
        const formattedData: Pegawai[] = data.map((item: unknown) => {
          const pegawai = item as PegawaiData;
          return {
            id: pegawai.id,
            user_id: pegawai.user_id,
            nama: pegawai.nama || "",
            nip: pegawai.nip || "",
            jabatan: pegawai.jabatan || "",
            status_jabatan: pegawai.status_jabatan || "",
            masa_kerja_tahun: pegawai.masa_kerja_tahun || 0,
            memiliki_inovasi: pegawai.memiliki_inovasi || false,
            memiliki_penghargaan: pegawai.memiliki_penghargaan || false,
            created_at: pegawai.created_at,
            unit_kerja: unitKerjaMap.get(pegawai.unit_kerja_id) || {
              nama_unit_kerja: "",
            },
            user: userMap.get(pegawai.user_id) || {
              email: `user_${pegawai.user_id?.substring(0, 6) || "unknown"}`,
            },
          };
        });

        setPegawai(formattedData);
      } else {
        setPegawai([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data pegawai. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isSuperAdmin, toast]);

  useEffect(() => {
    if (!authLoading && isInitialized && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchData();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user, authLoading, isInitialized, navigate, fetchData]);

  const handleDelete = async (id: string, ownerId: string) => {
    try {
      if (!isSuperAdmin && user?.id !== ownerId) {
        toast({
          title: "Error",
          description: "Anda tidak memiliki izin untuk menghapus data ini",
          variant: "destructive",
        });
        setDeleteId(null);
        return;
      }

      const { error } = await supabase.from("pegawai").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data pegawai berhasil dihapus",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus data pegawai",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const filteredPegawai = pegawai.filter((p) => {
    const matchesSearch =
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nip.includes(searchTerm) ||
      p.jabatan.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const columns = [
    {
      header: "Nama",
      accessor: (row: Pegawai) => row.nama,
    },
    {
      header: "NIP",
      accessor: (row: Pegawai) => row.nip || "-",
    },
    {
      header: "Jabatan",
      accessor: (row: Pegawai) => row.jabatan || "-",
    },
    {
      header: "Unit Kerja",
      accessor: (row: Pegawai) => row.unit_kerja?.nama_unit_kerja || "-",
    },
    {
      header: "Status",
      accessor: (row: Pegawai) => (
        <Badge
          variant={
            row.status_jabatan === "fungsional" ? "default" : "secondary"
          }
        >
          {row.status_jabatan}
        </Badge>
      ),
    },
    {
      header: "Aksi",
      accessor: (row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/evaluasi/baru?pegawai_id=${row.id}`)}
            title="Buat Evaluasi"
          >
            <Award className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/pegawai/${row.id}/edit`)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.id)}
            title="Hapus"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isSuperAdmin) {
    columns.splice(columns.length - 1, 0, {
      header: "Pemilik",
      accessor: (row: any) => row.user?.email || "N/A",
    });
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
                <h1 className="text-2xl font-bold">Data Pegawai</h1>
                <p className="text-sm text-muted-foreground">
                  Kelola data pegawai ASN
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowBulkImport(!showBulkImport)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Massal
              </Button>
              <Button onClick={() => navigate("/pegawai/tambah")}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pegawai
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Bulk Import */}
        {showBulkImport && (
          <div className="mb-8">
            <BulkImport
              onImportComplete={(result) => {
                if (result.success > 0) {
                  fetchData(); // Refresh data after import
                }
                setShowBulkImport(false);
              }}
            />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pegawai</CardDescription>
              <CardTitle className="text-2xl">{pegawai.length}</CardTitle>
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
              <CardDescription>Administrasi</CardDescription>
              <CardTitle className="text-2xl">
                {
                  pegawai.filter((p) => p.status_jabatan === "administrasi")
                    .length
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                Pegawai
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Fungsional</CardDescription>
              <CardTitle className="text-2xl">
                {
                  pegawai.filter((p) => p.status_jabatan === "fungsional")
                    .length
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Award className="h-4 w-4 mr-1" />
                Pegawai
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Dengan Inovasi</CardDescription>
              <CardTitle className="text-2xl">
                {pegawai.filter((p) => p.memiliki_inovasi).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Award className="h-4 w-4 mr-1" />
                Inovator
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
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
                <Select value="all" onValueChange={() => {}}>
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
                <Select value="all" onValueChange={() => {}}>
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
            <CardTitle>Daftar Pegawai ({filteredPegawai.length})</CardTitle>
            <CardDescription>
              Data pegawai ASN yang terdaftar dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPegawai.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Tidak ada data pegawai</h3>
                <p className="text-muted-foreground mb-4">
                  {pegawai.length === 0
                    ? "Belum ada pegawai yang terdaftar. Tambahkan pegawai pertama."
                    : "Tidak ada pegawai yang cocok dengan filter yang dipilih."}
                </p>
                {pegawai.length === 0 && (
                  <Button onClick={() => navigate("/pegawai/tambah")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pegawai
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column.header}>
                          {column.header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPegawai.map((p) => (
                      <TableRow key={p.id}>
                        {columns.map((column) => (
                          <TableCell key={column.header}>
                            {column.accessor(p)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Pegawai</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data pegawai ini? Tindakan ini
              tidak dapat dibatalkan dan akan menghapus semua data penilaian
              terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const pegawaiToDelete = pegawai.find((p) => p.id === deleteId);
                if (pegawaiToDelete) {
                  handleDelete(deleteId, pegawaiToDelete.user_id);
                } else {
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Pegawai;

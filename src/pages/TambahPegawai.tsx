import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  UserPlus,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  DataValidator,
  asnValidationRules,
  validateNIP,
  calculateDataQuality,
} from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TambahPegawai = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [nipInfo, setNipInfo] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    jabatan: "",
    unit_kerja_nama: "",
    status_jabatan: "",
    masa_kerja_tahun: 0,
    bebas_temuan: false,
    tidak_hukuman_disiplin: false,
    tidak_pemeriksaan_disiplin: false,
    memiliki_inovasi: false,
    bukti_inovasi: "",
    memiliki_penghargaan: false,
    bukti_penghargaan: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.nama ||
      !formData.nip ||
      !formData.jabatan ||
      !formData.unit_kerja_nama ||
      !formData.status_jabatan
    ) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Silakan isi semua field yang wajib diisi",
        variant: "destructive",
      });
      return;
    }

    if (formData.nip.length < 8) {
      toast({
        title: "NIP Tidak Valid",
        description: "NIP harus minimal 8 karakter",
        variant: "destructive",
      });
      return;
    }

    if (formData.masa_kerja_tahun < 0 || formData.masa_kerja_tahun > 50) {
      toast({
        title: "Masa Kerja Tidak Valid",
        description: "Masa kerja harus antara 0-50 tahun",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Tidak ada session aktif");
      }

      // Find or create unit kerja
      let unitKerjaId;
      const { data: existingUnitKerja, error: searchError } = await supabase
        .from("unit_kerja")
        .select("id")
        .eq("nama_unit_kerja", formData.unit_kerja_nama)
        .maybeSingle();

      if (searchError) {
        throw new Error(`Error searching unit kerja: ${searchError.message}`);
      }

      if (existingUnitKerja) {
        unitKerjaId = existingUnitKerja.id;
      } else {
        // Create new unit kerja
        const { data: newUnitKerja, error: unitError } = await supabase
          .from("unit_kerja")
          .insert([{ nama_unit_kerja: formData.unit_kerja_nama }])
          .select("id")
          .single();

        if (unitError) {
          throw new Error(`Error creating unit kerja: ${unitError.message}`);
        }
        unitKerjaId = newUnitKerja.id;
      }

      const { unit_kerja_nama, ...pegawaiData } = formData;

      // Prepare data for insertion
      const insertData = {
        ...pegawaiData,
        unit_kerja_id: unitKerjaId,
        user_id: session.user.id,
        bukti_inovasi: formData.memiliki_inovasi
          ? formData.bukti_inovasi
          : null,
        bukti_penghargaan: formData.memiliki_penghargaan
          ? formData.bukti_penghargaan
          : null,
      };

      // Debug: log the data being inserted
      console.log("Inserting pegawai data:", insertData);
      console.log("Unit kerja ID:", unitKerjaId);

      // Validate required fields
      if (
        !insertData.nama ||
        !insertData.nip ||
        !insertData.jabatan ||
        !insertData.status_jabatan ||
        !insertData.unit_kerja_id
      ) {
        throw new Error("Missing required fields for pegawai insertion");
      }

      const { error } = await supabase.from("pegawai").insert([insertData]);

      if (error) {
        if (error.message.includes("duplicate key")) {
          toast({
            title: "NIP Sudah Terdaftar",
            description: "NIP yang dimasukkan sudah terdaftar dalam sistem",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Berhasil",
        description: "Data pegawai berhasil ditambahkan",
      });

      navigate("/pegawai");
    } catch (error) {
      console.error("Error adding pegawai:", error);
      console.error("Error type:", typeof error);
      console.error("Error keys:", error ? Object.keys(error) : "null");

      let errorMessage = "Unknown error occurred";

      try {
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === "object") {
          // Handle Supabase errors which can have different structures
          if ("message" in error) {
            errorMessage = String((error as any).message);
          } else if ("details" in error) {
            errorMessage = String((error as any).details);
          } else if ("hint" in error) {
            errorMessage = String((error as any).hint);
          } else if ("code" in error) {
            errorMessage = `Database error (${(error as any).code})`;
          } else {
            // Last resort - try to stringify the error
            errorMessage = JSON.stringify(error);
          }
        } else if (typeof error === "string") {
          errorMessage = error;
        }
      } catch (stringifyError) {
        console.error("Error while processing error:", stringifyError);
        errorMessage = "Error occurred but details could not be extracted";
      }

      toast({
        title: "Error",
        description: `Gagal menambahkan data pegawai: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
                onClick={() => navigate("/pegawai")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Tambah Pegawai</h1>
                <p className="text-sm text-muted-foreground">
                  Daftarkan pegawai ASN baru
                </p>
              </div>
            </div>
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Data Pribadi */}
          <Card>
            <CardHeader>
              <CardTitle>Data Pribadi</CardTitle>
              <CardDescription>Informasi dasar pegawai</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input
                    id="nama"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={formData.nama}
                    onChange={(e) => handleInputChange("nama", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nip">NIP *</Label>
                  <Input
                    id="nip"
                    type="text"
                    placeholder="Nomor Induk Pegawai"
                    value={formData.nip}
                    onChange={(e) => handleInputChange("nip", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan *</Label>
                  <Input
                    id="jabatan"
                    type="text"
                    placeholder="Jabatan saat ini"
                    value={formData.jabatan}
                    onChange={(e) =>
                      handleInputChange("jabatan", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="masa_kerja">Masa Kerja (Tahun) *</Label>
                  <Input
                    id="masa_kerja"
                    type="number"
                    placeholder="0"
                    min="0"
                    max="50"
                    value={formData.masa_kerja_tahun}
                    onChange={(e) =>
                      handleInputChange(
                        "masa_kerja_tahun",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_kerja">Unit Kerja *</Label>
                  <Input
                    id="unit_kerja"
                    type="text"
                    placeholder="Masukkan nama unit kerja"
                    value={formData.unit_kerja_nama}
                    onChange={(e) =>
                      handleInputChange("unit_kerja_nama", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status_jabatan">Status Jabatan *</Label>
                  <Select
                    value={formData.status_jabatan}
                    onValueChange={(value) =>
                      handleInputChange("status_jabatan", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrator">
                        Administrator
                      </SelectItem>
                      <SelectItem value="pengawas">Pengawas</SelectItem>
                      <SelectItem value="pelaksana">Pelaksana</SelectItem>
                      <SelectItem value="fungsional">Fungsional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kriteria Integritas */}
          <Card>
            <CardHeader>
              <CardTitle>Kriteria Integritas</CardTitle>
              <CardDescription>
                Penilaian integritas dan kedisiplinan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <Label htmlFor="bebas_temuan">Bebas Temuan</Label>
                    <p className="text-sm text-muted-foreground">
                      Tidak ada temuan audit
                    </p>
                  </div>
                  <Switch
                    id="bebas_temuan"
                    checked={formData.bebas_temuan}
                    onCheckedChange={(checked) =>
                      handleInputChange("bebas_temuan", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <Label htmlFor="tidak_hukuman">
                      Tidak Ada Hukuman Disiplin
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Bersih dari hukuman disiplin
                    </p>
                  </div>
                  <Switch
                    id="tidak_hukuman"
                    checked={formData.tidak_hukuman_disiplin}
                    onCheckedChange={(checked) =>
                      handleInputChange("tidak_hukuman_disiplin", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <Label htmlFor="tidak_pemeriksaan">
                      Tidak Dalam Pemeriksaan
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Tidak sedang diperiksa
                    </p>
                  </div>
                  <Switch
                    id="tidak_pemeriksaan"
                    checked={formData.tidak_pemeriksaan_disiplin}
                    onCheckedChange={(checked) =>
                      handleInputChange("tidak_pemeriksaan_disiplin", checked)
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
                Pencapaian dan kontribusi pegawai
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="memiliki_inovasi">Memiliki Inovasi</Label>
                      <p className="text-sm text-muted-foreground">
                        Telah membuat inovasi
                      </p>
                    </div>
                    <Switch
                      id="memiliki_inovasi"
                      checked={formData.memiliki_inovasi}
                      onCheckedChange={(checked) =>
                        handleInputChange("memiliki_inovasi", checked)
                      }
                    />
                  </div>

                  {formData.memiliki_inovasi && (
                    <div className="space-y-2">
                      <Label htmlFor="bukti_inovasi">Bukti Inovasi</Label>
                      <Textarea
                        id="bukti_inovasi"
                        placeholder="Deskripsikan inovasi yang telah dibuat..."
                        value={formData.bukti_inovasi}
                        onChange={(e) =>
                          handleInputChange("bukti_inovasi", e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="memiliki_penghargaan">
                        Memiliki Penghargaan
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Pernah menerima penghargaan
                      </p>
                    </div>
                    <Switch
                      id="memiliki_penghargaan"
                      checked={formData.memiliki_penghargaan}
                      onCheckedChange={(checked) =>
                        handleInputChange("memiliki_penghargaan", checked)
                      }
                    />
                  </div>

                  {formData.memiliki_penghargaan && (
                    <div className="space-y-2">
                      <Label htmlFor="bukti_penghargaan">
                        Bukti Penghargaan
                      </Label>
                      <Textarea
                        id="bukti_penghargaan"
                        placeholder="Deskripsikan penghargaan yang pernah diterima..."
                        value={formData.bukti_penghargaan}
                        onChange={(e) =>
                          handleInputChange("bukti_penghargaan", e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/pegawai")}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Pegawai
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default TambahPegawai;

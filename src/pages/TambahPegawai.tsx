import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Edit3,
  Copy,
  ExternalLink,
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

    // Validate status_jabatan
    const validStatuses = [
      "administrator",
      "pengawas",
      "pelaksana",
      "fungsional",
    ];
    if (!validStatuses.includes(formData.status_jabatan)) {
      toast({
        title: "Status Jabatan Tidak Valid",
        description:
          "Status jabatan harus: administrator, pengawas, pelaksana, atau fungsional",
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

      // Map new status_jabatan values to database values
      let dbStatusJabatan = pegawaiData.status_jabatan;
      if (
        ["administrator", "pengawas", "pelaksana"].includes(
          pegawaiData.status_jabatan,
        )
      ) {
        dbStatusJabatan = "administrasi";
      }

      // Prepare data for insertion
      const insertData = {
        ...pegawaiData,
        status_jabatan: dbStatusJabatan,
        unit_kerja_id: unitKerjaId,
        user_id: session.user.id,
        // Add fields that are required by the database schema
        bebas_temuan: false,
        tidak_hukuman_disiplin: false,
        tidak_pemeriksaan_disiplin: false,
        memiliki_inovasi: false,
        bukti_inovasi: null,
        memiliki_penghargaan: false,
        bukti_penghargaan: null,
      };

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

      // Validate status_jabatan against database constraint
      if (!["administrasi", "fungsional"].includes(insertData.status_jabatan)) {
        throw new Error(
          `Invalid status_jabatan: ${insertData.status_jabatan}. Must be 'administrasi' or 'fungsional'`,
        );
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
      // Log each property of the error object for debugging
      if (error && typeof error === "object") {
        const errorObj = error as any;
      }

      let errorMessage = "Unknown error occurred";

      try {
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === "object") {
          // Handle Supabase errors which can have different structures
          const supabaseError = error as any;

          if (supabaseError.message) {
            errorMessage = String(supabaseError.message);

            // Add additional details if available
            if (supabaseError.details) {
              errorMessage += ` Details: ${supabaseError.details}`;
            }
            if (supabaseError.hint) {
              errorMessage += ` Hint: ${supabaseError.hint}`;
            }
            if (supabaseError.code) {
              errorMessage += ` (Code: ${supabaseError.code})`;
            }
          } else if (supabaseError.details) {
            errorMessage = String(supabaseError.details);
          } else if (supabaseError.hint) {
            errorMessage = String(supabaseError.hint);
          } else if (supabaseError.code) {
            errorMessage = `Database error (${supabaseError.code})`;
          } else {
            // Last resort - try to stringify the error
            errorMessage = JSON.stringify(error);
          }
        } else if (typeof error === "string") {
          errorMessage = error;
        }
      } catch (stringifyError) {
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

  const validateForm = (data: typeof formData) => {
    const validator = new DataValidator(asnValidationRules);
    const validation = validator.validate(data);
    setValidationErrors(validation.errors);

    // Calculate data quality
    const quality = calculateDataQuality(data);
    setDataQuality(quality);

    // Validate NIP if provided
    if (data.nip) {
      const nipValidation = validateNIP(data.nip);
      setNipInfo(nipValidation);
    }

    return validation.isValid;
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };
    setFormData(newFormData);

    // Real-time validation with debounce
    setTimeout(() => validateForm(newFormData), 300);
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

          {/* Data Quality Indicator */}
          {dataQuality && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {dataQuality.score >= 80 ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  )}
                  Kualitas Data: {dataQuality.score}%
                </CardTitle>
                <CardDescription>
                  Indikator kualitas dan kelengkapan data pegawai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {dataQuality.details.completeness}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Kelengkapan
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dataQuality.details.accuracy}%
                    </div>
                    <div className="text-sm text-muted-foreground">Akurasi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {dataQuality.details.consistency}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Konsistensi
                    </div>
                  </div>
                </div>
                {dataQuality.score < 80 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      Kualitas data kurang dari 80%. Pastikan semua field terisi
                      dengan benar dan bukti inovasi/penghargaan sesuai.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* NIP Information */}
          {nipInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {nipInfo.isValid ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  )}
                  Informasi NIP
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nipInfo.isValid && nipInfo.info ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tanggal Lahir:</span>{" "}
                      {nipInfo.info.birthDate}
                    </div>
                    <div>
                      <span className="font-medium">Usia:</span>{" "}
                      {nipInfo.info.age} tahun
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {nipInfo.errors.map((error: string, i: number) => (
                      <p key={i} className="text-sm text-red-600">
                        • {error}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Validation Errors */}
          {Object.keys(validationErrors).length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Error Validasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(validationErrors).map(([field, errors]) => (
                    <div key={field}>
                      <p className="font-medium text-red-800 capitalize">
                        {field}:
                      </p>
                      {errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-600 ml-2">
                          • {error}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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

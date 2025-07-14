import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Save, Edit, Loader2, Copy, ExternalLink, Edit3, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface UnitKerja {
  id: string;
  nama_unit_kerja: string;
}
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
  bebas_temuan: boolean;
  tidak_hukuman_disiplin: boolean;
  tidak_pemeriksaan_disiplin: boolean;
  bukti_inovasi: string | null;
  bukti_penghargaan: string | null;
  unit_kerja_id: string;
}
const EditPegawai = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [unitKerjaList, setUnitKerjaList] = useState<UnitKerja[]>([]);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user,
    isSuperAdmin,
    isLoading: authLoading
  } = useAuth();
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    jabatan: "",
    unit_kerja_id: "",
    status_jabatan: "",
    masa_kerja_tahun: 0,
    memiliki_inovasi: false,
    memiliki_penghargaan: false,
    bebas_temuan: false,
    tidak_hukuman_disiplin: false,
    tidak_pemeriksaan_disiplin: false,
    bukti_inovasi: "",
    bukti_penghargaan: ""
  });
  const [adminDocs, setAdminDocs] = useState({
    bukti_inovasi_link: "",
    bukti_penghargaan_link: "",
    drh_link: "",
    bebas_temuan_link: "",
    tidak_hukuman_disiplin_link: "",
    tidak_pemeriksaan_disiplin_link: "",
    skp_2_tahun_terakhir_baik_link: "",
    skp_peningkatan_prestasi_link: ""
  });
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user && id) {
      fetchData();
    }
  }, [user, authLoading, id]);
  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);

      // Fetch unit kerja list
      const {
        data: unitData,
        error: unitError
      } = await supabase.from("unit_kerja").select("*").order("nama_unit_kerja");
      if (unitError) throw unitError;
      setUnitKerjaList(unitData || []);

      // Fetch pegawai data
      const {
        data: pegawaiData,
        error: pegawaiError
      } = await supabase.from("pegawai").select("*").eq("id", id).single();
      if (pegawaiError) throw pegawaiError;

      // Check permission
      if (!isSuperAdmin && pegawaiData.user_id !== user?.id) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk mengedit data ini",
          variant: "destructive"
        });
        navigate("/pegawai");
        return;
      }
      setPegawai(pegawaiData);
      setFormData({
        nama: pegawaiData.nama || "",
        nip: pegawaiData.nip || "",
        jabatan: pegawaiData.jabatan || "",
        unit_kerja_id: pegawaiData.unit_kerja_id || "",
        status_jabatan: pegawaiData.status_jabatan || "",
        masa_kerja_tahun: pegawaiData.masa_kerja_tahun || 0,
        memiliki_inovasi: pegawaiData.memiliki_inovasi || false,
        memiliki_penghargaan: pegawaiData.memiliki_penghargaan || false,
        bebas_temuan: pegawaiData.bebas_temuan || false,
        tidak_hukuman_disiplin: pegawaiData.tidak_hukuman_disiplin || false,
        tidak_pemeriksaan_disiplin: pegawaiData.tidak_pemeriksaan_disiplin || false,
        bukti_inovasi: pegawaiData.bukti_inovasi || "",
        bukti_penghargaan: pegawaiData.bukti_penghargaan || ""
      });

      // Set admin docs data - these might not exist in database yet for older records
      setAdminDocs({
        bukti_inovasi_link: pegawaiData.bukti_inovasi || "",
        bukti_penghargaan_link: pegawaiData.bukti_penghargaan || "",
        drh_link: "",
        bebas_temuan_link: "",
        tidak_hukuman_disiplin_link: "",
        tidak_pemeriksaan_disiplin_link: "",
        skp_2_tahun_terakhir_baik_link: "",
        skp_peningkatan_prestasi_link: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data pegawai",
        variant: "destructive"
      });
      navigate("/pegawai");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pegawai) return;

    // Validation
    if (!formData.nama || !formData.nip || !formData.jabatan || !formData.unit_kerja_id || !formData.status_jabatan) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Silakan isi semua field yang wajib diisi",
        variant: "destructive"
      });
      return;
    }

    // Validate status_jabatan
    const validStatuses = ["administrasi", "fungsional"];
    if (!validStatuses.includes(formData.status_jabatan)) {
      toast({
        title: "Status Jabatan Tidak Valid",
        description: "Status jabatan harus: administrasi atau fungsional",
        variant: "destructive"
      });
      return;
    }
    if (formData.nip.length < 8) {
      toast({
        title: "NIP Tidak Valid",
        description: "NIP harus minimal 8 karakter",
        variant: "destructive"
      });
      return;
    }
    if (formData.masa_kerja_tahun < 0 || formData.masa_kerja_tahun > 50) {
      toast({
        title: "Masa Kerja Tidak Valid",
        description: "Masa kerja harus antara 0-50 tahun",
        variant: "destructive"
      });
      return;
    }

    // Validate Google Drive links
    const invalidLinks = Object.entries(adminDocs).filter(([_, link]) => link.trim() !== "" && !isValidGoogleDriveLink(link)).map(([key, _]) => adminDocFields.find(f => f.key === key)?.label);
    if (invalidLinks.length > 0) {
      toast({
        title: "Link Google Drive Tidak Valid",
        description: `Link tidak valid untuk: ${invalidLinks.join(", ")}`,
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const updateData = {
        nama: formData.nama,
        nip: formData.nip,
        jabatan: formData.jabatan,
        unit_kerja_id: formData.unit_kerja_id,
        status_jabatan: formData.status_jabatan,
        masa_kerja_tahun: formData.masa_kerja_tahun,
        memiliki_inovasi: !!adminDocs.bukti_inovasi_link,
        memiliki_penghargaan: !!adminDocs.bukti_penghargaan_link,
        bebas_temuan: formData.bebas_temuan,
        tidak_hukuman_disiplin: formData.tidak_hukuman_disiplin,
        tidak_pemeriksaan_disiplin: formData.tidak_pemeriksaan_disiplin,
        bukti_inovasi: adminDocs.bukti_inovasi_link || null,
        bukti_penghargaan: adminDocs.bukti_penghargaan_link || null,
        updated_at: new Date().toISOString()
      };
      const {
        error
      } = await supabase.from("pegawai").update(updateData).eq("id", id);
      if (error) {
        if (error.message.includes("duplicate key")) {
          toast({
            title: "NIP Sudah Terdaftar",
            description: "NIP yang dimasukkan sudah terdaftar dalam sistem",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }
      toast({
        title: "Berhasil",
        description: "Data pegawai berhasil diperbarui"
      });
      navigate("/pegawai");
    } catch (error) {
      console.error("Error updating pegawai:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui data pegawai",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleAdminDocChange = (field: string, value: string) => {
    setAdminDocs(prev => ({
      ...prev,
      [field]: value
    }));
  };
/* Duplicate broken implementation retained for reference
  const toggleEditMode = (field: string) => {

      ...prev,
      [field]: !prev[field]
    }));
  };

  const removeAdminDoc = (fieldKey: string, label: string) => {
    setAdminDocs(prev => ({ ...prev, [fieldKey]: "" }));
 ...prev, [fieldKey]: false }));
    toast({
      title: "Berhasil",
      description: `Link ${label} berhasil dihapus`
    });
  };

  

      ...prev,
      [field]: !prev[field]
    }));
  };
*/

  const toggleEditMode = (field: string) => {
    setEditMode((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const removeAdminDoc = (fieldKey: string, label: string) => {
    setAdminDocs((prev) => ({ ...prev, [fieldKey]: "" }));
    setEditMode((prev) => ({ ...prev, [fieldKey]: false }));
    toast({
      title: "Berhasil",
      description: `Link ${label} berhasil dihapus`,
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Berhasil",
        description: `Link ${label} berhasil disalin`
      });
    } catch (error) {
      toast({
        title: "Gagal",
        description: "Gagal menyalin link ke clipboard",
        variant: "destructive"
      });
    }
  };
  const isValidGoogleDriveLink = (url: string) => {
    if (!url) return true; // Allow empty links
    const googleDrivePattern = /^https:\/\/drive\.google\.com\/|^https:\/\/docs\.google\.com\//;
    return googleDrivePattern.test(url);
  };
  const adminDocFields = [{
    key: "bukti_inovasi_link",
    label: "Bukti Inovasi",
    description: "Dokumen yang membuktikan inovasi yang telah dibuat"
  }, {
    key: "bukti_penghargaan_link",
    label: "Bukti Penghargaan",
    description: "Dokumen penghargaan atau prestasi yang diterima"
  }, {
    key: "drh_link",
    label: "Daftar Riwayat Hidup (DRH)",
    description: "Lampiran daftar riwayat hidup terbaru"
  }, {
    key: "bebas_temuan_link",
    label: "Bebas Temuan",
    description: "Dokumen yang membuktikan bebas dari temuan audit/pemeriksaan"
  }, {
    key: "tidak_hukuman_disiplin_link",
    label: "Tidak Ada Hukuman Disiplin",
    description: "Surat keterangan bebas dari hukuman disiplin"
  }, {
    key: "tidak_pemeriksaan_disiplin_link",
    label: "Tidak Dalam Pemeriksaan",
    description: "Surat keterangan tidak sedang dalam pemeriksaan disiplin"
  }, {
    key: "skp_2_tahun_terakhir_baik_link",
    label: "SKP 2 Tahun Terakhir Baik",
    description: "Dokumen SKP dengan nilai baik dalam 2 tahun terakhir"
  }, {
    key: "skp_peningkatan_prestasi_link",
    label: "Peningkatan Prestasi SKP",
    description: "Dokumen yang menunjukkan peningkatan prestasi kerja"
  }];
  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  if (!pegawai) {
    return <div className="flex items-center justify-center h-64">
        <p>Data pegawai tidak ditemukan</p>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/pegawai")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit Pegawai</h1>
                <p className="text-sm text-muted-foreground">
                  Perbarui data pegawai ASN
                </p>
              </div>
            </div>
            <Edit className="h-8 w-8 text-primary" />
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
                  <Input id="nama" type="text" placeholder="Masukkan nama lengkap" value={formData.nama} onChange={e => handleInputChange("nama", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nip">NIP *</Label>
                  <Input id="nip" type="text" placeholder="Nomor Induk Pegawai" value={formData.nip} onChange={e => handleInputChange("nip", e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan *</Label>
                  <Input id="jabatan" type="text" placeholder="Jabatan saat ini" value={formData.jabatan} onChange={e => handleInputChange("jabatan", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_kerja">Unit Kerja *</Label>
                  <Select value={formData.unit_kerja_id} onValueChange={value => handleInputChange("unit_kerja_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitKerjaList.map(unit => <SelectItem key={unit.id} value={unit.id}>
                          {unit.nama_unit_kerja}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status_jabatan">Status Jabatan *</Label>
                  <Select value={formData.status_jabatan} onValueChange={value => handleInputChange("status_jabatan", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrasi">Administrasi</SelectItem>
                      <SelectItem value="fungsional">Fungsional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="masa_kerja">Masa Kerja (Tahun) *</Label>
                  <Input id="masa_kerja" type="number" min="0" max="50" placeholder="Masa kerja dalam tahun" value={formData.masa_kerja_tahun} onChange={e => handleInputChange("masa_kerja_tahun", parseInt(e.target.value) || 0)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dokumen & Prestasi */}
          

          {/* Kelengkapan Administrasi Penilaian */}
          <Card>
            <CardHeader>
              <CardTitle>Kelengkapan Administrasi Penilaian</CardTitle>
              <CardDescription>
                Link Google Drive untuk dokumen persyaratan yang dijadikan
                sebagai data kriteria penilaian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {adminDocFields.map(field => <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.key} className="text-sm font-medium">
                      {field.label}
                    </Label>
                    <div className="flex space-x-1">
                      {adminDocs[field.key as keyof typeof adminDocs] && <>
                          <Button type="button" variant="ghost" size="sm" onClick={() => copyToClipboard(adminDocs[field.key as keyof typeof adminDocs], field.label)} className="h-8 w-8 p-0">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeAdminDoc(field.key, field.label)} className="h-8 w-8 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                          {isValidGoogleDriveLink(adminDocs[field.key as keyof typeof adminDocs]) && <Button type="button" variant="ghost" size="sm" onClick={() => window.open(adminDocs[field.key as keyof typeof adminDocs], "_blank")} className="h-8 w-8 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>}
                        </>}
                      <Button type="button" variant="ghost" size="sm" onClick={() => toggleEditMode(field.key)} className="h-8 w-8 p-0">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {field.description}
                  </p>

                  {editMode[field.key] ? <div className="flex space-x-2">
                      <Input id={field.key} type="url" placeholder="https://drive.google.com/... atau https://docs.google.com/..." value={adminDocs[field.key as keyof typeof adminDocs]} onChange={e => handleAdminDocChange(field.key, e.target.value)} className={adminDocs[field.key as keyof typeof adminDocs] && !isValidGoogleDriveLink(adminDocs[field.key as keyof typeof adminDocs]) ? "border-red-300 focus:border-red-500" : ""} />
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleEditMode(field.key)}>
                        Simpan
                      </Button>
                    </div> : <div className="min-h-[40px] p-3 bg-muted/50 rounded-md border cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => toggleEditMode(field.key)}>
                      {adminDocs[field.key as keyof typeof adminDocs] ? <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-600 hover:underline">
                            {adminDocs[field.key as keyof typeof adminDocs]}
                          </span>
                          {!isValidGoogleDriveLink(adminDocs[field.key as keyof typeof adminDocs]) && <span className="text-xs text-red-500 ml-2">
                              ⚠️ Bukan link Google Drive yang valid
                            </span>}
                        </div> : <span className="text-sm text-muted-foreground">
                          Klik untuk menambahkan link Google Drive
                        </span>}
                    </div>}

                  {adminDocs[field.key as keyof typeof adminDocs] && !isValidGoogleDriveLink(adminDocs[field.key as keyof typeof adminDocs]) && <p className="text-xs text-red-500">
                        Mohon masukkan link Google Drive yang valid
                        (drive.google.com atau docs.google.com)
                      </p>}
                </div>)}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Petunjuk:</strong> Pastikan dokumen di Google Drive
                  dapat diakses oleh evaluator. Gunakan pengaturan "Anyone with
                  the link can view" untuk memudahkan proses penilaian.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate("/pegawai")}>
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </> : <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>}
            </Button>
          </div>
        </form>
      </main>
    </div>;
};
export default EditPegawai;
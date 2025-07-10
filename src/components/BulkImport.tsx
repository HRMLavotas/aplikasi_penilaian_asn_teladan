import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

interface BulkImportProps {
  onImportComplete?: (result: ImportResult) => void;
}

const BulkImport = ({ onImportComplete }: BulkImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const csvContent = `nama,nip,jabatan,unit_kerja_nama,status_jabatan,masa_kerja_tahun,bebas_temuan,tidak_hukuman_disiplin,tidak_pemeriksaan_disiplin,memiliki_inovasi,bukti_inovasi,memiliki_penghargaan,bukti_penghargaan
John Doe,198501011234567890,Analis Kebijakan,Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas,administrator,10,true,true,true,true,Sistem Manajemen Kinerja Digital,true,Penghargaan Pegawai Teladan 2024
Jane Smith,198502022345678901,Perancang Sistem,Direktorat Jenderal Pembinaan Pengawasan Ketenagakerjaan,pengawas,8,true,true,true,false,,false,`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_pegawai.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description:
        "Template CSV berhasil diunduh. Silakan isi data sesuai format.",
    });
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue;

      const values = lines[i].split(",");
      const row: any = {};

      headers.forEach((header, index) => {
        let value = values[index]?.trim() || "";

        // Handle boolean fields
        if (
          [
            "bebas_temuan",
            "tidak_hukuman_disiplin",
            "tidak_pemeriksaan_disiplin",
            "memiliki_inovasi",
            "memiliki_penghargaan",
          ].includes(header)
        ) {
          value = value.toLowerCase() === "true";
        }

        // Handle numeric fields
        if (header === "masa_kerja_tahun") {
          value = parseInt(value) || 0;
        }

        row[header] = value;
      });

      data.push(row);
    }

    return data;
  };

  const validateRow = (row: any, rowIndex: number): string[] => {
    const errors = [];

    if (!row.nama) errors.push("Nama wajib diisi");
    if (!row.nip) errors.push("NIP wajib diisi");
    if (row.nip && row.nip.length < 8) errors.push("NIP minimal 8 karakter");
    if (!row.jabatan) errors.push("Jabatan wajib diisi");
    if (!row.unit_kerja_nama) errors.push("Unit kerja wajib diisi");
    if (!row.status_jabatan) errors.push("Status jabatan wajib diisi");
    if (
      !["administrator", "pengawas", "pelaksana", "fungsional"].includes(
        row.status_jabatan,
      )
    ) {
      errors.push(
        "Status jabatan harus: administrator, pengawas, pelaksana, atau fungsional",
      );
    }
    if (row.masa_kerja_tahun < 0 || row.masa_kerja_tahun > 50) {
      errors.push("Masa kerja harus antara 0-50 tahun");
    }

    return errors;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Format File Tidak Valid",
        description: "Hanya file CSV yang didukung",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    // Preview data
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      try {
        const parsed = parseCSV(csvText);
        setPreviewData(parsed.slice(0, 5)); // Show first 5 rows
        setShowPreview(true);
      } catch (error) {
        toast({
          title: "Error Parsing File",
          description: "File CSV tidak dapat dibaca. Periksa format file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(selectedFile);
  };

  const processImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Tidak ada session aktif");

      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        const data = parseCSV(csvText);

        const result: ImportResult = {
          success: 0,
          failed: 0,
          errors: [],
        };

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          setProgress((i / data.length) * 100);

          try {
            // Validate row
            const validationErrors = validateRow(row, i + 2);
            if (validationErrors.length > 0) {
              result.errors.push({
                row: i + 2,
                error: validationErrors.join(", "),
                data: row,
              });
              result.failed++;
              continue;
            }

            // Find or create unit kerja
            let unitKerjaId;
            const { data: existingUnitKerja, error: searchError } =
              await supabase
                .from("unit_kerja")
                .select("id")
                .eq("nama_unit_kerja", row.unit_kerja_nama)
                .maybeSingle();

            if (searchError) throw searchError;

            if (existingUnitKerja) {
              unitKerjaId = existingUnitKerja.id;
            } else {
              const { data: newUnitKerja, error: unitError } = await supabase
                .from("unit_kerja")
                .insert([{ nama_unit_kerja: row.unit_kerja_nama }])
                .select("id")
                .single();

              if (unitError) throw unitError;
              unitKerjaId = newUnitKerja.id;
            }

            // Insert pegawai
            const { unit_kerja_nama, ...pegawaiData } = row;
            const insertData = {
              ...pegawaiData,
              unit_kerja_id: unitKerjaId,
              user_id: session.user.id,
              bukti_inovasi: row.memiliki_inovasi ? row.bukti_inovasi : null,
              bukti_penghargaan: row.memiliki_penghargaan
                ? row.bukti_penghargaan
                : null,
            };

            const { error: insertError } = await supabase
              .from("pegawai")
              .insert([insertData]);

            if (insertError) {
              if (insertError.message.includes("duplicate key")) {
                result.errors.push({
                  row: i + 2,
                  error: `NIP ${row.nip} sudah terdaftar`,
                  data: row,
                });
              } else {
                throw insertError;
              }
              result.failed++;
            } else {
              result.success++;
            }
          } catch (error) {
            console.error(`Error processing row ${i + 2}:`, error);
            result.errors.push({
              row: i + 2,
              error: error instanceof Error ? error.message : "Unknown error",
              data: row,
            });
            result.failed++;
          }

          // Small delay to prevent overwhelming the database
          if (i % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        setProgress(100);
        setImportResult(result);
        onImportComplete?.(result);

        toast({
          title: "Import Selesai",
          description: `Berhasil: ${result.success}, Gagal: ${result.failed}`,
        });
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat import data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Import Data Pegawai Massal
        </CardTitle>
        <CardDescription>
          Import data pegawai dalam jumlah besar menggunakan file CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-medium">Template CSV</h3>
              <p className="text-sm text-muted-foreground">
                Download template untuk format data yang benar
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="csv-file">Pilih File CSV</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isImporting}
          />
        </div>

        {/* Preview Data */}
        {showPreview && previewData.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Preview Data (5 baris pertama):</p>
                <div className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                  {previewData.map((row, i) => (
                    <div key={i} className="truncate">
                      {row.nama} - {row.nip} - {row.jabatan}
                    </div>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Import Progress */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Progress Import</Label>
              <span className="text-sm text-muted-foreground">
                {progress.toFixed(0)}%
              </span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Import Button */}
        <Button
          onClick={processImport}
          disabled={!file || isImporting}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Mengimpor Data...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Mulai Import
            </>
          )}
        </Button>

        {/* Import Results */}
        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.success}
                      </div>
                      <div className="text-sm text-green-700">Berhasil</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {importResult.failed}
                      </div>
                      <div className="text-sm text-red-700">Gagal</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error Details */}
            {importResult.errors.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Lihat Detail Error ({importResult.errors.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Detail Error Import</DialogTitle>
                    <DialogDescription>
                      Daftar baris yang gagal diimport beserta alasannya
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    {importResult.errors.map((error, i) => (
                      <div
                        key={i}
                        className="p-3 bg-red-50 border border-red-200 rounded"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="destructive">Baris {error.row}</Badge>
                          <span className="text-sm text-red-700">
                            {error.data?.nama || "Unknown"}
                          </span>
                        </div>
                        <p className="text-sm text-red-800">{error.error}</p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkImport;

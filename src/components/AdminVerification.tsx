import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, ShieldX, ShieldAlert, Eye } from "lucide-react";

interface AdminVerificationProps {
  penilaianId: string;
  currentStatus: string;
  currentLabel: string | null;
  currentNotes: string | null;
  isDataValid: boolean;
  currentScore: number;
  pegawaiNama: string;
  onVerificationUpdate: () => void;
}

const verificationLabels = [
  {
    value: "tidak_memenuhi_kriteria",
    label: "Tidak Memenuhi Kriteria",
    color: "bg-red-500",
    icon: ShieldX,
  },
  {
    value: "memenuhi_kriteria", 
    label: "Memenuhi Kriteria",
    color: "bg-green-500",
    icon: ShieldCheck,
  },
  {
    value: "melebihi_kriteria",
    label: "Melebihi Kriteria", 
    color: "bg-blue-500",
    icon: ShieldAlert,
  },
];

export const AdminVerification = ({
  penilaianId,
  currentStatus,
  currentLabel,
  currentNotes,
  isDataValid,
  currentScore,
  pegawaiNama,
  onVerificationUpdate,
}: AdminVerificationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [label, setLabel] = useState(currentLabel || "");
  const [notes, setNotes] = useState(currentNotes || "");
  const [dataValid, setDataValid] = useState(isDataValid);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleVerification = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User tidak terautentikasi");
      }

      // Store original score if not already stored
      const originalScore = currentScore;

      const updateData: any = {
        verification_status: status,
        verification_label: label || null,
        verification_notes: notes || null,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        is_data_valid: dataValid,
      };

      // Store original score if this is the first verification
      if (currentStatus === 'pending') {
        updateData.original_score = originalScore;
      }

      // If data is invalid (fake), set score to 0
      if (!dataValid) {
        updateData.persentase_akhir = 0;
      } else if (currentStatus !== 'pending' && dataValid) {
        // If reverting from invalid to valid, restore original score
        const { data: penilaianData } = await supabase
          .from("penilaian")
          .select("original_score")
          .eq("id", penilaianId)
          .single();
        
        if (penilaianData?.original_score !== null) {
          updateData.persentase_akhir = penilaianData.original_score;
        }
      }

      const { error } = await supabase
        .from("penilaian")
        .update(updateData)
        .eq("id", penilaianId);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Verifikasi untuk ${pegawaiNama} berhasil disimpan`,
      });

      setIsOpen(false);
      onVerificationUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Gagal menyimpan verifikasi: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (currentStatus === "pending") {
      return <Badge variant="outline">Belum Diverifikasi</Badge>;
    }
    
    if (!isDataValid) {
      return <Badge className="bg-red-500 text-white">Data Tidak Valid</Badge>;
    }

    const labelConfig = verificationLabels.find(l => l.value === currentLabel);
    if (labelConfig) {
      const Icon = labelConfig.icon;
      return (
        <Badge className={`${labelConfig.color} text-white`}>
          <Icon className="w-3 h-3 mr-1" />
          {labelConfig.label}
        </Badge>
      );
    }

    return <Badge className="bg-green-500 text-white">Terverifikasi</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          Verifikasi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verifikasi Data Pegawai</DialogTitle>
          <DialogDescription>
            Verifikasi data evaluasi untuk <strong>{pegawaiNama}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Status Saat Ini:</label>
            <div className="mt-1">{getStatusBadge()}</div>
          </div>

          <div>
            <label className="text-sm font-medium">Validitas Data</label>
            <Select
              value={dataValid ? "valid" : "invalid"}
              onValueChange={(value) => setDataValid(value === "valid")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valid">Data Valid</SelectItem>
                <SelectItem value="invalid">Data Tidak Valid (Fake)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Status Verifikasi</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Belum Diverifikasi</SelectItem>
                <SelectItem value="verified">Terverifikasi</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "verified" && dataValid && (
            <div>
              <label className="text-sm font-medium">Label Kriteria</label>
              <Select value={label} onValueChange={setLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih label kriteria..." />
                </SelectTrigger>
                <SelectContent>
                  {verificationLabels.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Catatan Verifikasi</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan verifikasi..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleVerification} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Verifikasi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";

interface PendingAssessment {
  id: string;
  pegawai_id: string;
  pegawai_nama: string;
  assessment_template_id: string;
  assessment_nama: string;
  persentase_akhir: number;
  verification_status: string;
  penilai_user_id: string;
  penilai_nama: string;
  created_at: string;
}

export const AdminPanel = () => {
  const [assessments, setAssessments] = useState<PendingAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<PendingAssessment | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [verificationNotes, setVerificationNotes] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadPendingAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('penilaian')
        .select(`
          id,
          pegawai_id,
          assessment_template_id,
          persentase_akhir,
          verification_status,
          penilai_user_id,
          created_at,
          pegawai:pegawai_id (nama),
          assessment_templates:assessment_template_id (nama_assessment),
          profiles:penilai_user_id (nama_lengkap)
        `)
        .in('verification_status', ['pending', 'needs_review'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        pegawai_id: item.pegawai_id,
        pegawai_nama: (item.pegawai as any)?.nama || 'N/A',
        assessment_template_id: item.assessment_template_id,
        assessment_nama: (item.assessment_templates as any)?.nama_assessment || 'N/A',
        persentase_akhir: item.persentase_akhir || 0,
        verification_status: item.verification_status || 'pending',
        penilai_user_id: item.penilai_user_id,
        penilai_nama: (item.profiles as any)?.nama_lengkap || 'N/A',
        created_at: item.created_at,
      })) || [];

      setAssessments(formattedData);
    } catch (error: any) {
      console.error('Error loading pending assessments:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data penilaian pending",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingAssessments();
  }, []);

  const openVerificationDialog = (assessment: PendingAssessment) => {
    setSelectedAssessment(assessment);
    setVerificationStatus(assessment.verification_status);
    setVerificationNotes("");
    setIsDialogOpen(true);
  };

  const handleVerification = async () => {
    if (!selectedAssessment) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('penilaian')
        .update({
          verification_status: verificationStatus,
          verification_notes: verificationNotes,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', selectedAssessment.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Status verifikasi berhasil diperbarui",
      });

      setIsDialogOpen(false);
      loadPendingAssessments();
    } catch (error: any) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status verifikasi",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      case 'needs_review':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Perlu Review</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Panel Admin Pusat</CardTitle>
          <CardDescription>Memuat data penilaian...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Panel Admin Pusat - Verifikasi Penilaian</CardTitle>
          <CardDescription>
            Terdapat {assessments.length} penilaian menunggu verifikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Tidak ada penilaian yang menunggu verifikasi
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>Sistem Assessment</TableHead>
                  <TableHead>Penilai</TableHead>
                  <TableHead>Nilai Akhir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.pegawai_nama}</TableCell>
                    <TableCell>{assessment.assessment_nama}</TableCell>
                    <TableCell>{assessment.penilai_nama}</TableCell>
                    <TableCell>{assessment.persentase_akhir.toFixed(2)}%</TableCell>
                    <TableCell>{getStatusBadge(assessment.verification_status)}</TableCell>
                    <TableCell>{new Date(assessment.created_at).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openVerificationDialog(assessment)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verifikasi Penilaian</DialogTitle>
            <DialogDescription>
              Review dan verifikasi hasil penilaian
            </DialogDescription>
          </DialogHeader>

          {selectedAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Nama Pegawai</p>
                  <p className="text-sm text-muted-foreground">{selectedAssessment.pegawai_nama}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Sistem Assessment</p>
                  <p className="text-sm text-muted-foreground">{selectedAssessment.assessment_nama}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Penilai</p>
                  <p className="text-sm text-muted-foreground">{selectedAssessment.penilai_nama}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Nilai Akhir</p>
                  <p className="text-sm text-muted-foreground">{selectedAssessment.persentase_akhir.toFixed(2)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status Verifikasi</label>
                <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                    <SelectItem value="needs_review">Perlu Review Ulang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan Verifikasi</label>
                <Textarea
                  placeholder="Masukkan catatan atau alasan verifikasi..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleVerification}>
              Simpan Verifikasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

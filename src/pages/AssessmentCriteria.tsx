import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ArrowLeft, MoveUp, MoveDown } from "lucide-react";

interface Criteria {
  id: string;
  nama_kriteria: string;
  kode_kriteria: string;
  deskripsi: string | null;
  tipe_input: "number" | "boolean" | "text" | "select" | "file_upload";
  options: any;
  bobot: number;
  min_value: number | null;
  max_value: number | null;
  is_required: boolean;
  urutan: number;
}

export default function AssessmentCriteria() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<Criteria | null>(null);
  const [formData, setFormData] = useState<{
    nama_kriteria: string;
    kode_kriteria: string;
    deskripsi: string;
    tipe_input: "number" | "boolean" | "text" | "select" | "file_upload";
    bobot: number;
    min_value: number;
    max_value: number;
    is_required: boolean;
  }>({
    nama_kriteria: "",
    kode_kriteria: "",
    deskripsi: "",
    tipe_input: "number",
    bobot: 0,
    min_value: 0,
    max_value: 100,
    is_required: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: template } = useQuery({
    queryKey: ["assessment-template", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_templates")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: criteria, isLoading } = useQuery({
    queryKey: ["assessment-criteria", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_criteria")
        .select("*")
        .eq("assessment_template_id", id)
        .order("urutan", { ascending: true });
      if (error) throw error;
      return data as Criteria[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const maxUrutan = criteria?.reduce((max, c) => Math.max(max, c.urutan), 0) || 0;
      const { error } = await supabase.from("assessment_criteria").insert([{
        ...data,
        assessment_template_id: id,
        urutan: maxUrutan + 1,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-criteria", id] });
      toast({ title: "Kriteria berhasil ditambahkan" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menambahkan kriteria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ criteriaId, data }: { criteriaId: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("assessment_criteria")
        .update(data)
        .eq("id", criteriaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-criteria", id] });
      toast({ title: "Kriteria berhasil diperbarui" });
      setOpen(false);
      setEditingCriteria(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui kriteria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (criteriaId: string) => {
      const { error } = await supabase
        .from("assessment_criteria")
        .delete()
        .eq("id", criteriaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-criteria", id] });
      toast({ title: "Kriteria berhasil dihapus" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus kriteria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      nama_kriteria: "",
      kode_kriteria: "",
      deskripsi: "",
      tipe_input: "number",
      bobot: 0,
      min_value: 0,
      max_value: 100,
      is_required: true,
    });
    setEditingCriteria(null);
  };

  const handleSubmit = () => {
    if (editingCriteria) {
      updateMutation.mutate({ criteriaId: editingCriteria.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (criterion: Criteria) => {
    setEditingCriteria(criterion);
    setFormData({
      nama_kriteria: criterion.nama_kriteria,
      kode_kriteria: criterion.kode_kriteria,
      deskripsi: criterion.deskripsi || "",
      tipe_input: criterion.tipe_input,
      bobot: criterion.bobot,
      min_value: criterion.min_value || 0,
      max_value: criterion.max_value || 100,
      is_required: criterion.is_required,
    });
    setOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      number: "Angka",
      boolean: "Ya/Tidak",
      text: "Teks",
      select: "Pilihan",
      file_upload: "Upload File",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/assessment-management")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{template?.nama_assessment}</h1>
              <p className="text-muted-foreground">Kelola kriteria penilaian</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kriteria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCriteria ? "Edit Kriteria" : "Tambah Kriteria Baru"}
                </DialogTitle>
                <DialogDescription>
                  Definisikan kriteria penilaian untuk assessment ini
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="nama">Nama Kriteria</Label>
                  <Input
                    id="nama"
                    value={formData.nama_kriteria}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_kriteria: e.target.value })
                    }
                    placeholder="Contoh: Kreativitas"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kode">Kode Kriteria</Label>
                  <Input
                    id="kode"
                    value={formData.kode_kriteria}
                    onChange={(e) =>
                      setFormData({ ...formData, kode_kriteria: e.target.value.toUpperCase() })
                    }
                    placeholder="Contoh: KREATIF"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Deskripsi</Label>
                  <Textarea
                    id="desc"
                    value={formData.deskripsi}
                    onChange={(e) =>
                      setFormData({ ...formData, deskripsi: e.target.value })
                    }
                    placeholder="Penjelasan tentang kriteria ini"
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipe">Tipe Input</Label>
                  <Select
                    value={formData.tipe_input}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, tipe_input: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Angka</SelectItem>
                      <SelectItem value="boolean">Ya/Tidak</SelectItem>
                      <SelectItem value="text">Teks</SelectItem>
                      <SelectItem value="select">Pilihan</SelectItem>
                      <SelectItem value="file_upload">Upload File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.tipe_input === "number" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="min">Nilai Minimum</Label>
                      <Input
                        id="min"
                        type="number"
                        value={formData.min_value}
                        onChange={(e) =>
                          setFormData({ ...formData, min_value: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max">Nilai Maximum</Label>
                      <Input
                        id="max"
                        type="number"
                        value={formData.max_value}
                        onChange={(e) =>
                          setFormData({ ...formData, max_value: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="bobot">Bobot (%)</Label>
                  <Input
                    id="bobot"
                    type="number"
                    value={formData.bobot}
                    onChange={(e) =>
                      setFormData({ ...formData, bobot: parseInt(e.target.value) })
                    }
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="required">Wajib Diisi</Label>
                  <Switch
                    id="required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_required: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.nama_kriteria ||
                    !formData.kode_kriteria ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {editingCriteria ? "Simpan Perubahan" : "Tambah Kriteria"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : criteria && criteria.length > 0 ? (
          <div className="space-y-4">
            {criteria.map((criterion, index) => (
              <Card key={criterion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-muted-foreground font-normal">#{index + 1}</span>
                        {criterion.nama_kriteria}
                        <span className="text-sm font-mono text-muted-foreground">
                          ({criterion.kode_kriteria})
                        </span>
                      </CardTitle>
                      <CardDescription>{criterion.deskripsi}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(criterion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Yakin ingin menghapus kriteria ini?")) {
                            deleteMutation.mutate(criterion.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipe:</span>{" "}
                      <span className="font-medium">{getTypeLabel(criterion.tipe_input)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bobot:</span>{" "}
                      <span className="font-medium">{criterion.bobot}%</span>
                    </div>
                    {criterion.tipe_input === "number" && (
                      <div>
                        <span className="text-muted-foreground">Range:</span>{" "}
                        <span className="font-medium">
                          {criterion.min_value} - {criterion.max_value}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Wajib:</span>{" "}
                      <span className="font-medium">{criterion.is_required ? "Ya" : "Tidak"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Belum ada kriteria untuk assessment ini
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kriteria Pertama
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
